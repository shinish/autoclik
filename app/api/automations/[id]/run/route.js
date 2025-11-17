import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { launchJobTemplate, pollJobUntilComplete, getJobArtifacts, getJobOutput, testAwxConnection } from '@/lib/awx-api';
import yaml from 'js-yaml';
import { generateUniqueRunId } from '@/lib/runIdGenerator';
import { logAutomationStart, logAutomationSuccess, logAutomationFailure, logError, logInfo } from '@/lib/logger';

/**
 * Replace template variables in object recursively
 * Supports {{form.fieldname}} syntax
 * @param {any} obj - Object to process
 * @param {object} parameters - Parameter values
 * @returns {any} - Processed object
 */
function replaceTemplateVariables(obj, parameters) {
  if (typeof obj === 'string') {
    // Replace {{form.key}} with actual values
    const regex = /\{\{form\.(\w+)\}\}/g;
    return obj.replace(regex, (match, fieldName) => {
      return parameters[fieldName] !== undefined ? parameters[fieldName] : match;
    });
  } else if (Array.isArray(obj)) {
    return obj.map(item => replaceTemplateVariables(item, parameters));
  } else if (obj !== null && typeof obj === 'object') {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = replaceTemplateVariables(value, parameters);
    }
    return result;
  }
  return obj;
}

/**
 * Get AWX configuration from environment variables or database
 * Priority: Environment variables > Database settings > Defaults
 */
async function getAwxConfig() {
  let baseUrl = process.env.AWX_BASE_URL || '';
  let token = process.env.AWX_TOKEN || '';

  // If environment variables are not set or empty, fetch from database
  if (!baseUrl || !token) {
    try {
      const [urlSetting, tokenSetting] = await Promise.all([
        prisma.setting.findUnique({ where: { key: 'default_api_endpoint' } }),
        prisma.setting.findUnique({ where: { key: 'awx_token' } }),
      ]);

      if (!baseUrl && urlSetting?.value) {
        baseUrl = urlSetting.value;
      }
      if (!token && tokenSetting?.value) {
        token = tokenSetting.value;
      }
    } catch (error) {
      console.error('Error fetching AWX config from database:', error);
    }
  }

  // Fallback to default if still not set
  if (!baseUrl) {
    baseUrl = 'https://awx.example.com/api/v2';
  }

  return { baseUrl, token };
}

/**
 * Generate a curl command representation of the AWX API request
 * @param {string} baseUrl - AWX base URL
 * @param {string} templateId - Job template ID
 * @param {object} requestBody - Request body
 * @param {string} token - AWX token (masked for security)
 * @returns {string} - Formatted curl command
 */
function generateCurlCommand(baseUrl, templateId, requestBody, token) {
  const maskedToken = token ? `${token.substring(0, 8)}...` : '[TOKEN]';
  const endpoint = `${baseUrl}/job_templates/${templateId}/launch/`;
  const body = JSON.stringify(requestBody, null, 2);

  return `curl -X POST '${endpoint}' \\
  -H 'Authorization: Bearer ${maskedToken}' \\
  -H 'Content-Type: application/json' \\
  -d '${body}'`;
}

// POST /api/automations/[id]/run - Execute an automation
export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { parameters, reservedTaskId, customBodyOverride } = body;

    // Fetch the automation details
    const automation = await prisma.automation.findUnique({
      where: { id },
    });

    if (!automation) {
      logError('Automation not found', { automationId: id });
      return NextResponse.json({ error: 'Automation not found' }, { status: 404 });
    }

    // Debug: Log customBody details
    console.log('DEBUG - customBody type:', typeof automation.customBody);
    console.log('DEBUG - customBody value:', automation.customBody);
    console.log('DEBUG - customBody length:', automation.customBody?.length);
    console.log('DEBUG - customBodyOverride:', customBodyOverride);

    // Get user information
    const executedBy = body.user?.name || body.user?.email || 'System';

    // Use pre-reserved Task ID if provided, otherwise generate a new one
    let uniqueId = reservedTaskId || await generateUniqueRunId(body.user);

    // Log automation start
    logAutomationStart(automation.id, automation.name, uniqueId, parameters);

    // Create a run record with retry logic for duplicate uniqueId
    let run;
    const maxRetries = 3;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        run = await prisma.run.create({
          data: {
            automationId: automation.id,
            status: 'running',
            uniqueId: uniqueId,
            executedBy: executedBy,
            parameters: JSON.stringify(parameters || {}),
          },
        });
        logInfo('✅ Database run record created successfully', {
          '🆔 Run ID (Database)': run.id,
          '🎫 Unique Run ID': uniqueId,
          '🔧 Automation ID': automation.id,
          '📊 Initial Status': 'running',
          '👤 Executed By': executedBy,
          '⏰ Created At': new Date().toISOString(),
        });
        break; // Success, exit loop
      } catch (createError) {
        // If uniqueId constraint failed and we have retries left, generate a new ID
        if (createError.code === 'P2002' &&
            createError.meta?.target?.includes('uniqueId') &&
            attempt < maxRetries - 1) {
          console.log(`UniqueId ${uniqueId} already exists, generating a new one (attempt ${attempt + 1}/${maxRetries})`);
          uniqueId = await generateUniqueRunId(body.user);
          continue;
        }
        // If it's a different error or we're out of retries, throw it
        throw createError;
      }
    }

    // Test AWX connection before attempting to execute
    const connectionTest = await testAwxConnection();
    if (!connectionTest.valid) {
      logError('🔌 AWX Connection Test Failed - Cannot Execute Automation', {
        '🚨 Error Code': connectionTest.error,
        '📝 Error Message': connectionTest.message,
        '🆔 Database Run ID': run.id,
        '🎫 Unique Run ID': uniqueId,
        '🔧 Automation ID': automation.id,
        '📛 Automation Name': automation.name,
        '👤 Executed By': executedBy,
        '⏰ Failed At': new Date().toISOString(),
        '💡 Solution': 'Configure AWX Base URL and Token in Settings page',
        '📍 Settings Path': '/settings',
      });

      // Create activity log for failed execution
      await prisma.activity.create({
        data: {
          action: 'executed',
          entityType: 'automation',
          entityId: automation.id,
          entityName: automation.name,
          description: `Failed to execute automation "${automation.name}" (${uniqueId}): ${connectionTest.message}`,
          performedBy: body.user?.email || 'system',
          metadata: JSON.stringify({
            runId: run.id,
            uniqueId: uniqueId,
            parameters: parameters,
            status: 'failed',
            error: connectionTest.message,
            errorCode: connectionTest.error,
            errorType: 'AWX_CONNECTION_ERROR',
          }),
        },
      });

      // Update run with failed status
      await prisma.run.update({
        where: { id: run.id },
        data: {
          status: 'failed',
          errorMessage: connectionTest.message,
          completedAt: new Date(),
        },
      });

      return NextResponse.json(
        {
          error: 'AWX_CONNECTION_ERROR',
          errorCode: connectionTest.error,
          message: connectionTest.message,
          requiresConfiguration: true,
          redirectToSettings: true,
        },
        { status: 500 }
      );
    }

    try {
      // Build request body from customBodyOverride, customBody, or fallback to legacy extraVars
      let requestBody = {};

      if (customBodyOverride) {
        // User edited the JSON directly - use it as-is
        try {
          // Trim whitespace and validate it's not empty
          const trimmedBody = customBodyOverride.trim();
          if (!trimmedBody) {
            throw new Error('Custom body is empty');
          }
          requestBody = JSON.parse(trimmedBody);
          logInfo('Using customBodyOverride from user edit', { uniqueId });
        } catch (parseError) {
          logError('Error parsing customBodyOverride', parseError);
          logError('customBodyOverride content (first 200 chars):', customBodyOverride.substring(0, 200));
          throw new Error('Invalid custom body override: ' + parseError.message + ' - Content starts with: ' + customBodyOverride.substring(0, 50));
        }
      } else if (automation.customBody && automation.customBody.trim() && automation.customBody.trim() !== 'null') {
        // Use custom body template with variable replacement
        // Check that customBody is not empty, not just whitespace, and not the string "null"
        try {
          // Trim whitespace
          const trimmedBody = automation.customBody.trim();

          // Parse JSON template
          const bodyTemplate = JSON.parse(trimmedBody);

          // Deep clone and replace template variables
          requestBody = replaceTemplateVariables(bodyTemplate, parameters);
          logInfo('Using automation.customBody template', { uniqueId });
        } catch (parseError) {
          console.error('Error parsing customBody:', parseError);
          console.error('customBody content (first 200 chars):', automation.customBody.substring(0, 200));
          throw new Error('Invalid custom body configuration: ' + parseError.message + ' - Content starts with: ' + automation.customBody.substring(0, 50));
        }
      } else if (automation.extraVars) {
        // Fallback to legacy extraVars (YAML)
        try {
          let extraVars = yaml.load(automation.extraVars);
          const replacedVars = {};
          for (const [key, value] of Object.entries(extraVars)) {
            if (typeof value === 'string') {
              const regex = /\{\{form\.(\w+)\}\}/g;
              replacedVars[key] = value.replace(regex, (match, fieldName) => {
                return parameters[fieldName] || match;
              });
            } else {
              replacedVars[key] = value;
            }
          }
          requestBody = { extra_vars: replacedVars };
          if (automation.inventoryId) {
            requestBody.inventory = automation.inventoryId;
          }
        } catch (yamlError) {
          console.error('Error parsing YAML:', yamlError);
        }
      } else {
        // Minimal body with inventory
        if (automation.inventoryId) {
          requestBody.inventory = automation.inventoryId;
        }
      }

      // Fetch AWX config
      const awxConfig = await getAwxConfig();
      logInfo('📡 AWX Configuration loaded', {
        '🌐 Base URL': awxConfig.baseUrl || '(not configured)',
        '🔑 Token Status': awxConfig.token ? `Configured (${awxConfig.token.length} chars)` : 'NOT CONFIGURED',
        '🎯 Target Template ID': automation.templateId,
        '📦 Request Body Size': JSON.stringify(requestBody).length + ' bytes',
      });

      // Generate curl command for documentation
      const curlCommand = generateCurlCommand(
        awxConfig.baseUrl,
        automation.templateId,
        requestBody,
        awxConfig.token
      );

      // Launch AWX job template
      logInfo('🚀 Initiating AWX job template launch', {
        '🎫 Run ID': uniqueId,
        '🔧 Template ID': automation.templateId,
        '🌐 AWX Endpoint': `${awxConfig.baseUrl}/job_templates/${automation.templateId}/launch/`,
        '📤 Request Body': requestBody,
        '⏰ Launch Time': new Date().toISOString(),
      });

      const awxResponse = await launchJobTemplate(
        automation.templateId,
        requestBody
      );

      const jobId = awxResponse.id?.toString();
      logInfo('✅ AWX job launched successfully', {
        '🎫 Run ID': uniqueId,
        '🔧 AWX Job ID': jobId,
        '📊 Job Status': awxResponse.status,
        '🔗 Job URL': awxResponse.url,
        '⏰ Job Created': awxResponse.created,
        '📝 Response': awxResponse,
      });

      // Update run with AWX job ID
      await prisma.run.update({
        where: { id: run.id },
        data: {
          awxJobId: jobId,
          status: 'running',
        },
      });

      // Poll for job completion (with timeout)
      let finalJobStatus;
      let artifacts = null;

      try {
        logInfo('⏳ Polling AWX job for completion', {
          '🔧 AWX Job ID': jobId,
          '🎫 Run ID': uniqueId,
          '⏱️ Max Wait Time': '300 seconds (5 minutes)',
          '🔄 Poll Interval': '5 seconds',
          '⏰ Started Polling': new Date().toISOString(),
        });

        finalJobStatus = await pollJobUntilComplete(jobId, 300, 5); // 5 minutes max

        logInfo('✅ AWX job polling completed', {
          '🔧 AWX Job ID': jobId,
          '📊 Final Status': finalJobStatus.status,
          '⏱️ Elapsed Time': finalJobStatus.elapsed ? `${finalJobStatus.elapsed}s` : 'unknown',
          '⏰ Finished At': finalJobStatus.finished || new Date().toISOString(),
        });

        // Get artifacts and job output if job completed
        logInfo('📦 Fetching job artifacts and output', {
          '🔧 AWX Job ID': jobId,
        });

        const [artifactData, jobOutput] = await Promise.all([
          getJobArtifacts(jobId),
          getJobOutput(jobId)
        ]);

        // Combine artifacts with job output
        artifacts = {
          ...artifactData,
          job_output: jobOutput,
          fetched_at: new Date().toISOString()
        };

        logInfo('✅ Artifacts and output fetched successfully', {
          '🔧 AWX Job ID': jobId,
          '📦 Artifacts Size': JSON.stringify(artifacts).length + ' bytes',
          '📝 Has Output': !!jobOutput,
        });

        // Determine final status
        const status = finalJobStatus.status === 'successful' ? 'success' : 'failed';

        // Update run with final status and artifacts
        await prisma.run.update({
          where: { id: run.id },
          data: {
            status: status,
            result: JSON.stringify(finalJobStatus),
            artifacts: artifacts ? JSON.stringify(artifacts) : null,
            errorMessage: status === 'failed' ? finalJobStatus.job_explanation || 'Job failed' : null,
            completedAt: new Date(),
          },
        });

        logInfo(`✅ Database updated with ${status} status`, {
          '🆔 Run ID': run.id,
          '📊 Status': status,
          '🔧 AWX Job ID': jobId,
          '⏰ Completed At': new Date().toISOString(),
        });
      } catch (pollError) {
        // If polling times out or fails, mark as failed with timeout message
        logError('⏱️ Job polling failed or timed out', {
          '🔧 AWX Job ID': jobId,
          '🎫 Run ID': uniqueId,
          '🚨 Error': pollError.message,
          '📍 Failure Point': 'Job status polling',
          '💡 Note': `Check AWX Job ID ${jobId} directly on AWX server for actual status`,
          '📚 Stack': pollError.stack,
        });

        await prisma.run.update({
          where: { id: run.id },
          data: {
            status: 'failed',
            errorMessage: `Job execution timeout: ${pollError.message}. Check AWX Job ID ${jobId} for actual status.`,
            completedAt: new Date(),
          },
        });
        logAutomationFailure(automation.id, uniqueId, pollError, { awxJobId: jobId, phase: 'polling' });
      }

      // Increment automation runs counter
      await prisma.automation.update({
        where: { id: automation.id },
        data: {
          runs: { increment: 1 },
        },
      });

      // Create activity log for automation execution
      await prisma.activity.create({
        data: {
          action: 'executed',
          entityType: 'automation',
          entityId: automation.id,
          entityName: automation.name,
          description: `Executed automation "${automation.name}" (${uniqueId}) with AWX Job ID: ${awxResponse.id}`,
          performedBy: body.user?.email || 'system',
          metadata: JSON.stringify({
            runId: run.id,
            uniqueId: uniqueId,
            awxJobId: awxResponse.id,
            parameters: parameters,
            status: 'success',
          }),
        },
      });

      const finalStatus = finalJobStatus ? (finalJobStatus.status === 'successful' ? 'success' : 'failed') : 'running';
      logAutomationSuccess(automation.id, uniqueId, jobId, finalStatus);

      return NextResponse.json({
        success: true,
        runId: run.id,
        uniqueId: uniqueId,
        awxJobId: jobId,
        status: finalJobStatus ? (finalJobStatus.status === 'successful' ? 'success' : 'failed') : 'running',
        message: finalJobStatus ?
          (finalJobStatus.status === 'successful' ? 'Automation completed successfully' : 'Automation failed') :
          'Automation started successfully',
        parameters: parameters,
        requestBody: requestBody,
        curlCommand: curlCommand,
        artifacts: artifacts,
      });
    } catch (awxError) {
      // Comprehensive error details
      const errorMessage = awxError?.message || String(awxError) || 'Unknown AWX error';

      // Log the AWX error with full details
      logAutomationFailure(automation.id, uniqueId, awxError, {
        phase: 'awx_execution',
        templateId: automation.templateId,
        errorType: awxError?.constructor?.name,
        errorCode: awxError?.code,
        errorName: awxError?.name,
        allErrorKeys: Object.keys(awxError || {}),
      });

      // Update run with failed status
      await prisma.run.update({
        where: { id: run.id },
        data: {
          status: 'failed',
          errorMessage: errorMessage,
          completedAt: new Date(),
        },
      });

      // Create activity log for failed execution
      await prisma.activity.create({
        data: {
          action: 'executed',
          entityType: 'automation',
          entityId: automation.id,
          entityName: automation.name,
          description: `Failed to execute automation "${automation.name}" (${uniqueId}): ${errorMessage}`,
          performedBy: body.user?.email || 'system',
          metadata: JSON.stringify({
            runId: run.id,
            uniqueId: uniqueId,
            parameters: parameters,
            status: 'failed',
            error: errorMessage,
            errorType: awxError?.constructor?.name,
          }),
        },
      });

      return NextResponse.json(
        {
          error: 'Failed to execute automation',
          details: errorMessage,
          errorType: awxError?.constructor?.name,
          code: awxError?.code,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    // Comprehensive error logging
    const errorDetails = {
      '🚨 Error Type': typeof error,
      '📝 Error ToString': String(error),
      '🔍 Constructor': error?.constructor?.name || 'Unknown',
      '📋 Message': error?.message || (typeof error === 'string' ? error : 'No message'),
      '🔢 Code': error?.code !== undefined ? error.code : 'No code property',
      '📛 Name': error?.name || 'No name',
      '📚 Stack': error?.stack || 'No stack trace',
      '📊 All Properties': JSON.stringify(Object.keys(error || {})),
      '🔬 Full Error Object': JSON.stringify(error, Object.getOwnPropertyNames(error)),
    };

    logError('Unexpected error running automation', errorDetails);

    return NextResponse.json(
      {
        error: 'Failed to run automation',
        details: error?.message || String(error) || 'An unexpected error occurred',
        errorType: error?.constructor?.name,
        code: error?.code,
        allKeys: Object.keys(error || {}),
      },
      { status: 500 }
    );
  }
}

