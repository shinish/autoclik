import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST /api/catalog/[id]/execute - Execute a catalog item
export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { parameters, customBody: providedBody, executedBy } = body;

    // Get catalog with environment
    const catalog = await prisma.catalog.findUnique({
      where: { id },
      include: {
        environment: true,
      },
    });

    if (!catalog) {
      return NextResponse.json({ error: 'Catalog not found' }, { status: 404 });
    }

    // Create execution record
    const execution = await prisma.catalogExecution.create({
      data: {
        catalogId: id,
        status: 'pending',
        parameters: parameters ? JSON.stringify(parameters) : null,
        executedBy: executedBy || 'system',
      },
    });

    // Build request body
    let requestBody = {};

    // Use provided custom body if available, otherwise use catalog's default
    const bodyToUse = providedBody || catalog.customBody;

    if (bodyToUse) {
      try {
        // Parse the custom body template
        let bodyTemplate = bodyToUse;

        // Pre-process parameters for special conversions
        const processedParameters = { ...parameters };

        // Convert check_hosts textarea to array (keep as array, not JSON string)
        if (processedParameters.check_hosts && typeof processedParameters.check_hosts === 'string') {
          processedParameters.check_hosts_array = processedParameters.check_hosts
            .split('\n')
            .map(host => host.trim())
            .filter(host => host.length > 0);
        }

        // Convert instance_group_id to integer
        if (processedParameters.instance_group_id) {
          const igId = parseInt(processedParameters.instance_group_id);
          if (!isNaN(igId)) {
            processedParameters.instance_group_id = igId;
          }
        }

        // Convert timeout to integer if it's a string
        if (processedParameters.timeout && typeof processedParameters.timeout === 'string') {
          const timeoutVal = parseInt(processedParameters.timeout);
          if (!isNaN(timeoutVal)) {
            processedParameters.timeout = timeoutVal;
          }
        }

        // Replace variables in the template with actual parameter values
        if (processedParameters) {
          Object.keys(processedParameters).forEach(key => {
            const value = processedParameters[key];
            const regex = new RegExp(`{{\\s*form\\.${key}\\s*}}`, 'g');

            // For non-string values (numbers, booleans, arrays), use direct JSON substitution
            if (typeof value !== 'string') {
              bodyTemplate = bodyTemplate.replace(regex, JSON.stringify(value));
            } else {
              // For strings, escape quotes and use direct substitution
              bodyTemplate = bodyTemplate.replace(regex, value);
            }
          });
        }

        requestBody = JSON.parse(bodyTemplate);
      } catch (error) {
        console.error('Error parsing custom body with template:', error);

        // If template parsing fails, try building request body dynamically from parameters
        try {
          requestBody = {};

          // Extract instance_groups if present
          if (parameters.instance_group_id) {
            const igId = parseInt(parameters.instance_group_id);
            if (!isNaN(igId)) {
              requestBody.instance_groups = [igId];
            }
          }

          // Build extra_vars from all other parameters (excluding instance_group_id)
          requestBody.extra_vars = {};

          // Get form schema to check field types
          let formSchema = [];
          try {
            formSchema = catalog.formSchema ? JSON.parse(catalog.formSchema) : [];
          } catch (e) {
            formSchema = [];
          }

          Object.keys(parameters).forEach(key => {
            // Skip instance_group_id as it's already handled
            if (key === 'instance_group_id') return;

            let value = parameters[key];

            // Find field in schema to check if it's a textarea
            const field = formSchema.find(f => f.key === key);
            const isTextarea = field && field.type === 'textarea';

            // Handle textarea fields - always convert to array (split by newlines)
            if (isTextarea && typeof value === 'string') {
              value = value.split('\n').map(v => v.trim()).filter(v => v.length > 0);
            }

            // Try to parse numeric values (only if not a textarea)
            if (!isTextarea && typeof value === 'string' && !isNaN(value) && value.trim() !== '') {
              const numVal = parseFloat(value);
              if (!isNaN(numVal)) {
                value = numVal;
              }
            }

            requestBody.extra_vars[key] = value;
          });

          console.log('Built request body dynamically:', requestBody);
        } catch (dynamicError) {
          console.error('Error building dynamic request body:', dynamicError);

          // Update execution with error
          await prisma.catalogExecution.update({
            where: { id: execution.id },
            data: {
              status: 'failed',
              errorMessage: 'Failed to build request body from parameters',
              completedAt: new Date(),
            },
          });

          return NextResponse.json(
            { error: 'Failed to build request body from parameters' },
            { status: 400 }
          );
        }
      }
    } else {
      // No custom body template - build request body dynamically from parameters
      requestBody = {};

      // Extract instance_groups if present
      if (parameters.instance_group_id) {
        const igId = parseInt(parameters.instance_group_id);
        if (!isNaN(igId)) {
          requestBody.instance_groups = [igId];
        }
      }

      // Build extra_vars from all other parameters (excluding instance_group_id)
      requestBody.extra_vars = {};

      // Get form schema to check field types
      let formSchema = [];
      try {
        formSchema = catalog.formSchema ? JSON.parse(catalog.formSchema) : [];
      } catch (e) {
        formSchema = [];
      }

      Object.keys(parameters).forEach(key => {
        // Skip instance_group_id as it's already handled
        if (key === 'instance_group_id') return;

        let value = parameters[key];

        // Find field in schema to check if it's a textarea
        const field = formSchema.find(f => f.key === key);
        const isTextarea = field && field.type === 'textarea';

        // Handle textarea fields - always convert to array (split by newlines)
        if (isTextarea && typeof value === 'string') {
          value = value.split('\n').map(v => v.trim()).filter(v => v.length > 0);
        }

        // Try to parse numeric values (only if not a textarea)
        if (!isTextarea && typeof value === 'string' && !isNaN(value) && value.trim() !== '') {
          const numVal = parseFloat(value);
          if (!isNaN(numVal)) {
            value = numVal;
          }
        }

        requestBody.extra_vars[key] = value;
      });
    }

    // Make request to AWX
    // Use baseUrl from environment settings - ensure it ends with /api/v2
    let baseUrl = catalog.environment.baseUrl;
    // Normalize: remove trailing slash if present
    if (baseUrl.endsWith('/')) {
      baseUrl = baseUrl.slice(0, -1);
    }
    // If baseUrl doesn't include /api/v2, append it
    if (!baseUrl.endsWith('/api/v2')) {
      baseUrl = `${baseUrl}/api/v2`;
    }
    const awxUrl = `${baseUrl}/job_templates/${catalog.templateId}/launch/`;

    // Get AWX token from the selected environment
    const awxToken = catalog.environment.token;

    if (!awxToken) {
      // Update execution with error
      await prisma.catalogExecution.update({
        where: { id: execution.id },
        data: {
          status: 'failed',
          errorMessage: 'AWX token is not configured for this environment',
          completedAt: new Date(),
        },
      });

      return NextResponse.json(
        { error: 'AWX token is not configured for the selected environment' },
        { status: 500 }
      );
    }

    // Build initial console output with API request details (before try block so it's accessible in catch)
    const maskedToken = awxToken && awxToken.length > 12
      ? awxToken.substring(0, 8) + '...' + awxToken.substring(awxToken.length - 4)
      : '***masked***';
    const timestamp = new Date();
    const formattedTime = timestamp.toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'long'
    });

    // Parse parameters for display
    let parametersDisplay = 'None';
    if (parameters && Object.keys(parameters).length > 0) {
      parametersDisplay = Object.entries(parameters)
        .map(([key, value]) => `    • ${key}: ${value}`)
        .join('\n');
    }

    // Calculate request body size
    const bodySize = new Blob([JSON.stringify(requestBody)]).size;
    const bodySizeFormatted = bodySize < 1024
      ? `${bodySize} bytes`
      : `${(bodySize / 1024).toFixed(2)} KB`;

    const initialConsoleOutput = `
CATALOG EXECUTION STARTED

📋 Execution Information:
  Catalog Name      : ${catalog.name}
  Catalog ID        : ${catalog.id}
  Description       : ${catalog.description || 'N/A'}
  Namespace         : ${catalog.namespaceId}
  Environment       : ${catalog.environment.name}
  Environment URL   : ${catalog.environment.baseUrl}
  Template ID       : ${catalog.templateId}
  Executed By       : ${executedBy || 'system'}
  Execution ID      : ${execution.id}
  Started At        : ${formattedTime}
  Timestamp (ISO)   : ${timestamp.toISOString()}

📝 Form Parameters:
${parametersDisplay}

🌐 HTTP Request Details:
  Method            : POST
  URL               : ${awxUrl}
  Protocol          : HTTPS
  Host              : ${new URL(awxUrl).hostname}
  Path              : ${new URL(awxUrl).pathname}
  Port              : ${new URL(awxUrl).port || '443'}

  Headers:
    Content-Type    : application/json
    Authorization   : Bearer ${maskedToken}
    Accept          : application/json
    User-Agent      : Catalog-Automation-Platform/1.0

📦 Request Payload:
  Body Size         : ${bodySizeFormatted}
  Format            : JSON

  Content:
${JSON.stringify(requestBody, null, 2).split('\n').map(line => '    ' + line).join('\n')}

⏳ Initiating connection to AWX server...
⏳ Sending POST request...
`;

    try {
      // Update execution status to running with initial console output
      await prisma.catalogExecution.update({
        where: { id: execution.id },
        data: {
          status: 'running',
          consoleOutput: initialConsoleOutput,
        },
      });

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${awxToken}`,
      };

      console.log('Launching AWX job:', {
        url: awxUrl,
        hasToken: true,
        tokenLength: awxToken.length,
        body: requestBody,
      });

      // For Node.js fetch, we need to handle self-signed certs and HTTP
      const fetchOptions = {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
      };

      // If using HTTPS with localhost/127.0.0.1, disable SSL verification
      if (awxUrl.startsWith('https://') && (awxUrl.includes('localhost') || awxUrl.includes('127.0.0.1'))) {
        const https = require('https');
        fetchOptions.agent = new https.Agent({
          rejectUnauthorized: false
        });
      }

      const response = await fetch(awxUrl, fetchOptions);

      const responseText = await response.text();
      console.log('AWX Response Status:', response.status);
      console.log('AWX Response:', responseText.substring(0, 500));

      let result;
      let responseConsoleOutput = '';

      try {
        result = JSON.parse(responseText);

        // Calculate response time
        const responseTime = new Date();
        const elapsedMs = responseTime - timestamp;
        const elapsedFormatted = elapsedMs < 1000
          ? `${elapsedMs}ms`
          : `${(elapsedMs / 1000).toFixed(2)}s`;

        // Calculate response size
        const responseSize = new Blob([responseText]).size;
        const responseSizeFormatted = responseSize < 1024
          ? `${responseSize} bytes`
          : `${(responseSize / 1024).toFixed(2)} KB`;

        // Build response console output
        responseConsoleOutput = `
✓ Request sent successfully!
✓ Response received!

📥 HTTP Response Details:
  Status Code       : ${response.status} ${response.statusText}
  Response Time     : ${elapsedFormatted}
  Response Size     : ${responseSizeFormatted}
  Content-Type      : ${response.headers.get('content-type') || 'application/json'}
  Server            : ${response.headers.get('server') || 'AWX'}
  Received At       : ${responseTime.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'long' })}

🎯 AWX Job Information:
  Job ID            : ${result.id || 'N/A'}
  Job Name          : ${result.name || 'N/A'}
  Job Type          : ${result.type || 'N/A'}
  Job Status        : ${result.status || 'pending'}
  Job URL           : ${result.url || 'N/A'}
  Playbook          : ${result.playbook || 'N/A'}
  Project           : ${result.project || 'N/A'}
  Inventory         : ${result.inventory || 'N/A'}
  Created By        : ${result.created_by?.username || 'N/A'}
  Launch Type       : ${result.launch_type || 'manual'}

📊 Job Execution Details:
  ${result.id ? `Job started successfully in AWX` : 'Job queued'}
  ${result.url ? `Monitor at: ${catalog.environment.baseUrl}${result.url}` : ''}
  ${result.status === 'pending' ? '⏳ Job is in queue, waiting to start...' : ''}
  ${result.status === 'waiting' ? '⏸️  Job is waiting for dependencies...' : ''}
  ${result.status === 'running' ? '▶️  Job is currently running...' : ''}

📄 Complete Response Payload:
${JSON.stringify(result, null, 2).split('\n').map(line => '    ' + line).join('\n')}

🔄 Job execution initiated successfully!
📊 The job is now running in AWX. The system will poll for updates every 3 seconds.
💡 You can also view the job directly in AWX at: ${catalog.environment.baseUrl}/#/jobs/${result.id || ''}

`;
      } catch (e) {
        // Build non-JSON response console output
        const responseTime = new Date();
        const elapsedMs = responseTime - timestamp;
        const elapsedFormatted = elapsedMs < 1000
          ? `${elapsedMs}ms`
          : `${(elapsedMs / 1000).toFixed(2)}s`;

        const responseSize = new Blob([responseText]).size;
        const responseSizeFormatted = responseSize < 1024
          ? `${responseSize} bytes`
          : `${(responseSize / 1024).toFixed(2)} KB`;

        const contentType = response.headers.get('content-type') || 'unknown';
        const isHTML = responseText.trim().startsWith('<') || contentType.includes('html');

        responseConsoleOutput = `
✓ Request sent successfully!
⚠️  Received non-JSON response!

📥 HTTP Response Details:
  Status Code       : ${response.status} ${response.statusText}
  Response Time     : ${elapsedFormatted}
  Response Size     : ${responseSizeFormatted}
  Content-Type      : ${contentType}
  Format            : ${isHTML ? 'HTML' : 'Plain Text'}
  Received At       : ${responseTime.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'long' })}

📄 Full Response Content:
${responseText}
`;

        // Check if it's an HTML access denied page
        if (responseText.includes('Access Denied') || responseText.includes('<HTML>')) {
          throw new Error('Access Denied: Invalid credentials or insufficient permissions. Please check the AWX API token in environment settings.');
        }
        throw new Error(`AWX returned non-JSON response (${contentType}). See console output above for full response.`);
      }

      if (!response.ok) {
        throw new Error(result.detail || result.error || `AWX request failed with status ${response.status}`);
      }

      // Update execution with AWX job ID and complete console output
      const fullConsoleOutput = initialConsoleOutput + responseConsoleOutput;

      const updatedExecution = await prisma.catalogExecution.update({
        where: { id: execution.id },
        data: {
          awxJobId: result.id?.toString(),
          consoleOutput: fullConsoleOutput,
        },
      });

      // Log activity
      await prisma.activity.create({
        data: {
          action: 'executed',
          entityType: 'catalog',
          entityId: catalog.id,
          entityName: catalog.name,
          description: `Executed catalog: ${catalog.name}`,
          performedBy: executedBy || 'system',
          metadata: JSON.stringify({ executionId: execution.id, awxJobId: result.id }),
        },
      });

      return NextResponse.json({
        execution: updatedExecution,
        awxJob: result,
      });
    } catch (error) {
      console.error('Error executing catalog:', error);

      // Determine error category
      let errorCategory = 'Unknown Error';
      let specificTips = [];

      if (error.message.includes('Access Denied') || error.message.includes('Invalid credentials')) {
        errorCategory = 'Authentication Error';
        specificTips = [
          'Verify the AWX_TOKEN environment variable is set correctly',
          'Ensure the token has "Write" scope in AWX',
          'Check that the token has not expired',
          'Confirm the user has permissions to launch this job template'
        ];
      } else if (error.message.includes('not found') || error.message.includes('404')) {
        errorCategory = 'Resource Not Found';
        specificTips = [
          'Verify the Template ID exists in AWX',
          'Check that the job template has not been deleted',
          'Ensure you are using the correct AWX environment',
          'Confirm the template ID matches the URL path'
        ];
      } else if (error.message.includes('connection') || error.message.includes('ECONNREFUSED')) {
        errorCategory = 'Connection Error';
        specificTips = [
          'Verify AWX server is running and accessible',
          'Check the AWX base URL in environment settings',
          'Ensure network connectivity to AWX server',
          'Verify firewall rules allow connection'
        ];
      } else if (error.message.includes('timeout')) {
        errorCategory = 'Timeout Error';
        specificTips = [
          'AWX server may be under heavy load',
          'Check AWX server performance and resources',
          'Increase timeout settings if needed',
          'Verify AWX is not stuck or frozen'
        ];
      } else if (error.message.includes('JSON')) {
        errorCategory = 'Data Format Error';
        specificTips = [
          'Review the request body for JSON syntax errors',
          'Ensure all template variables are properly replaced',
          'Check for invalid characters in form inputs',
          'Validate the custom body if manually edited'
        ];
      }

      // Build error console output
      const errorTime = new Date();
      const errorConsoleOutput = initialConsoleOutput + `
❌ EXECUTION FAILED!

🚨 Error Information:
  Error Category    : ${errorCategory}
  Error Type        : ${error.name || 'Error'}
  Error Message     : ${error.message}
  Error Code        : ${error.code || 'N/A'}
  Failed At         : ${errorTime.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'long' })}
  Timestamp (ISO)   : ${errorTime.toISOString()}

💡 Troubleshooting Steps:
${specificTips.length > 0 ? specificTips.map((tip, i) => `  ${i + 1}. ${tip}`).join('\n') : '  • Check AWX server logs for more details\n  • Verify all configuration settings\n  • Contact your administrator if issue persists'}

General Tips:
  • Review the request details above for any obvious issues
  • Check AWX server status and logs
  • Verify network connectivity
  • Ensure all required fields are filled correctly

📋 Stack Trace:
${error.stack || 'No stack trace available'}

🔗 Helpful Links:
  • AWX Documentation: https://docs.ansible.com/automation-controller/
  • API Reference: ${catalog.environment.baseUrl}/api/
  • Job Templates: ${catalog.environment.baseUrl}/#/templates

`;

      // Update execution with error and console output
      await prisma.catalogExecution.update({
        where: { id: execution.id },
        data: {
          status: 'failed',
          errorMessage: error.message,
          consoleOutput: errorConsoleOutput,
          completedAt: new Date(),
        },
      });

      return NextResponse.json(
        { error: error.message || 'Failed to execute catalog' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in catalog execution:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to execute catalog' },
      { status: 500 }
    );
  }
}
