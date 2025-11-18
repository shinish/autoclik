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

        // Replace variables in the template with actual parameter values
        if (parameters) {
          Object.keys(parameters).forEach(key => {
            const regex = new RegExp(`{{\\s*form\\.${key}\\s*}}`, 'g');
            bodyTemplate = bodyTemplate.replace(regex, parameters[key]);
          });
        }

        requestBody = JSON.parse(bodyTemplate);
      } catch (error) {
        console.error('Error parsing custom body:', error);

        // Update execution with error
        await prisma.catalogExecution.update({
          where: { id: execution.id },
          data: {
            status: 'failed',
            errorMessage: 'Failed to parse request body template',
            completedAt: new Date(),
          },
        });

        return NextResponse.json(
          { error: 'Failed to parse request body template' },
          { status: 400 }
        );
      }
    }

    // Make request to AWX
    const awxUrl = `${catalog.environment.baseUrl}/job_templates/${catalog.templateId}/launch/`;

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

    try {
      // Build initial console output with API request details
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
╔═══════════════════════════════════════════════════════════════════════════════╗
║                          CATALOG EXECUTION STARTED                            ║
╚═══════════════════════════════════════════════════════════════════════════════╝

📋 Execution Information:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 Form Parameters:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${parametersDisplay}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🌐 HTTP Request Details:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📦 Request Payload:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Body Size         : ${bodySizeFormatted}
  Format            : JSON

  Content:
${JSON.stringify(requestBody, null, 2).split('\n').map(line => '    ' + line).join('\n')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⏳ Initiating connection to AWX server...
⏳ Sending POST request...
`;

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

      const response = await fetch(awxUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
      });

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
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Status Code       : ${response.status} ${response.statusText}
  Response Time     : ${elapsedFormatted}
  Response Size     : ${responseSizeFormatted}
  Content-Type      : ${response.headers.get('content-type') || 'application/json'}
  Server            : ${response.headers.get('server') || 'AWX'}
  Received At       : ${responseTime.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'long' })}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 AWX Job Information:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Job Execution Details:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ${result.id ? `Job started successfully in AWX` : 'Job queued'}
  ${result.url ? `Monitor at: ${catalog.environment.baseUrl}${result.url}` : ''}
  ${result.status === 'pending' ? '⏳ Job is in queue, waiting to start...' : ''}
  ${result.status === 'waiting' ? '⏸️  Job is waiting for dependencies...' : ''}
  ${result.status === 'running' ? '▶️  Job is currently running...' : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📄 Complete Response Payload:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${JSON.stringify(result, null, 2).split('\n').map(line => '    ' + line).join('\n')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔄 Job execution initiated successfully!
📊 The job is now running in AWX. The system will poll for updates every 3 seconds.
💡 You can also view the job directly in AWX at: ${catalog.environment.baseUrl}/#/jobs/${result.id || ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
      } catch (e) {
        // Check if it's an HTML access denied page
        if (responseText.includes('Access Denied') || responseText.includes('<HTML>')) {
          throw new Error('Access Denied: Invalid credentials or insufficient permissions. Please check the AWX API token in environment settings.');
        }
        throw new Error(`AWX returned non-JSON response: ${responseText.substring(0, 200)}`);
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
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Error Category    : ${errorCategory}
  Error Type        : ${error.name || 'Error'}
  Error Message     : ${error.message}
  Error Code        : ${error.code || 'N/A'}
  Failed At         : ${errorTime.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'long' })}
  Timestamp (ISO)   : ${errorTime.toISOString()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 Troubleshooting Steps:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${specificTips.length > 0 ? specificTips.map((tip, i) => `  ${i + 1}. ${tip}`).join('\n') : '  • Check AWX server logs for more details\n  • Verify all configuration settings\n  • Contact your administrator if issue persists'}

General Tips:
  • Review the request details above for any obvious issues
  • Check AWX server status and logs
  • Verify network connectivity
  • Ensure all required fields are filled correctly
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 Stack Trace:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${error.stack || 'No stack trace available'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔗 Helpful Links:
  • AWX Documentation: https://docs.ansible.com/automation-controller/
  • API Reference: ${catalog.environment.baseUrl}/api/
  • Job Templates: ${catalog.environment.baseUrl}/#/templates

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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
