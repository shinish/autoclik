import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { launchJobTemplate, pollJobUntilComplete, getJobArtifacts, getJobOutput } from '@/lib/awx-api';
import yaml from 'js-yaml';
import { generateUniqueRunId } from '@/lib/runIdGenerator';

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
      return NextResponse.json({ error: 'Automation not found' }, { status: 404 });
    }

    // Get user information
    const executedBy = body.user?.name || body.user?.email || 'System';

    // Use pre-reserved Task ID if provided, otherwise generate a new one
    let uniqueId = reservedTaskId || await generateUniqueRunId(body.user);

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

    try {
      // Build request body from customBodyOverride, customBody, or fallback to legacy extraVars
      let requestBody = {};

      if (customBodyOverride) {
        // User edited the JSON directly - use it as-is
        try {
          requestBody = JSON.parse(customBodyOverride);
          console.log('🔧 Using customBodyOverride from user edit');
        } catch (parseError) {
          console.error('Error parsing customBodyOverride:', parseError);
          throw new Error('Invalid custom body override: ' + parseError.message);
        }
      } else if (automation.customBody) {
        // Use custom body template with variable replacement
        try {
          // Parse JSON template
          const bodyTemplate = JSON.parse(automation.customBody);

          // Deep clone and replace template variables
          requestBody = replaceTemplateVariables(bodyTemplate, parameters);
        } catch (parseError) {
          console.error('Error parsing customBody:', parseError);
          throw new Error('Invalid custom body configuration');
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

      // Generate curl command for documentation
      const curlCommand = generateCurlCommand(
        awxConfig.baseUrl,
        automation.templateId,
        requestBody,
        awxConfig.token
      );

      // Launch AWX job template
      const awxResponse = await launchJobTemplate(
        automation.templateId,
        requestBody
      );

      const jobId = awxResponse.id?.toString();

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
        finalJobStatus = await pollJobUntilComplete(jobId, 300, 5); // 5 minutes max

        // Get artifacts and job output if job completed
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

        console.log('📦 Fetched artifacts:', JSON.stringify(artifacts, null, 2));

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
      } catch (pollError) {
        // If polling times out or fails, mark as running and let user check later
        console.error('Job polling error:', pollError);
        await prisma.run.update({
          where: { id: run.id },
          data: {
            status: 'running',
            errorMessage: `Job is still running. Check AWX for status: ${pollError.message}`,
          },
        });
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
      // Update run with failed status
      await prisma.run.update({
        where: { id: run.id },
        data: {
          status: 'failed',
          errorMessage: awxError.message,
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
          description: `Failed to execute automation "${automation.name}" (${uniqueId}): ${awxError.message}`,
          performedBy: body.user?.email || 'system',
          metadata: JSON.stringify({
            runId: run.id,
            uniqueId: uniqueId,
            parameters: parameters,
            status: 'failed',
            error: awxError.message,
          }),
        },
      });

      return NextResponse.json(
        {
          error: 'Failed to execute automation',
          details: awxError.message,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error running automation:', error);
    return NextResponse.json({ error: 'Failed to run automation' }, { status: 500 });
  }
}

