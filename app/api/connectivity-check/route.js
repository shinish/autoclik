import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { launchJobTemplate, getJobStatus } from '@/lib/awx-api';
import { logInfo, logError } from '@/lib/logger';

// Default connectivity check job template ID (from AWX)
const DEFAULT_CONNECTIVITY_TEMPLATE_ID = '8';

// POST /api/connectivity-check - Run connectivity check
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      executionNodeGroup,   // Execution Node Group / Queue Name (maps to source_system in AWX)
      destinationIPs,       // Array of destination IPs (joined by ";" for AWX)
      ports,                // Array of ports (joined by "," for AWX)
      instanceGroupId,      // Optional: Instance Group ID (overrides default from settings)
      executedBy
    } = body;

    logInfo('🔌 Running connectivity check', {
      executionNodeGroup,
      destinationIPs,
      ports,
      executedBy
    });

    // Validate inputs
    if (!executionNodeGroup || !destinationIPs || !ports) {
      return NextResponse.json(
        { error: 'Execution node group, destination IPs, and ports are required' },
        { status: 400 }
      );
    }

    // Check if AWX is configured
    const awxEndpoint = await prisma.setting.findUnique({
      where: { key: 'default_api_endpoint' }
    });

    const awxToken = await prisma.setting.findUnique({
      where: { key: 'awx_token' }
    });

    // If AWX is not configured, run in demo mode
    if (!awxEndpoint?.value || !awxToken?.value) {
      logInfo('📋 Running connectivity check in demo mode (AWX not configured)');

      // Generate demo results
      const results = [];
      for (const ip of destinationIPs) {
        for (const port of ports) {
          // Simulate random success/failure
          const isSuccess = Math.random() > 0.3; // 70% success rate
          const responseTime = isSuccess ? `${Math.floor(Math.random() * 100 + 10)}ms` : null;

          results.push({
            destination: ip,
            port: port,
            status: isSuccess ? 'Success' : 'Failed',
            responseTime,
            error: isSuccess ? null : 'Connection timed out',
          });
        }
      }

      return NextResponse.json({
        success: true,
        mode: 'demo',
        results,
        message: 'Demo mode - AWX not configured'
      });
    }

    // Get the connectivity check job template ID from settings
    const jobTemplateIdSetting = await prisma.setting.findUnique({
      where: { key: 'connectivity_check_template_id' }
    });

    const jobTemplateId = jobTemplateIdSetting?.value || DEFAULT_CONNECTIVITY_TEMPLATE_ID;

    // Get instance group ID from settings or use provided value
    const instanceGroupSetting = await prisma.setting.findUnique({
      where: { key: 'default_instance_group_id' }
    });

    // Priority: request body > settings > default (298)
    let finalInstanceGroupId = 298; // Default value
    if (instanceGroupId) {
      finalInstanceGroupId = parseInt(instanceGroupId, 10);
    } else if (instanceGroupSetting?.value) {
      finalInstanceGroupId = parseInt(instanceGroupSetting.value, 10);
    }

    // Prepare the AWX request body with proper format
    // Based on the user's PowerShell test:
    // {
    //   "instance_groups": [298],
    //   "extra_vars": {
    //     "source_system": ["VRT-PDC"],
    //     "destn_ip": "10.118.234.75",
    //     "ports_input": "9419"
    //   }
    // }
    const awxBody = {
      instance_groups: [finalInstanceGroupId],
      extra_vars: {
        source_system: Array.isArray(executionNodeGroup) ? executionNodeGroup : [executionNodeGroup],
        destn_ip: destinationIPs.join(';'),  // Multiple IPs separated by semicolon
        ports_input: ports.join(','),         // Multiple ports separated by comma
      }
    };

    logInfo('🚀 AWX Request Body', awxBody);

    // Try to launch AWX job
    try {
      const awxJob = await launchJobTemplate(jobTemplateId, awxBody);

      // Find or create the Connectivity Check catalog entry
      let connectivityCatalog = await prisma.catalog.findFirst({
        where: { name: 'Connectivity Check' }
      });

      if (!connectivityCatalog) {
        // Create a connectivity check catalog if it doesn't exist
        connectivityCatalog = await prisma.catalog.create({
          data: {
            name: 'Connectivity Check',
            description: 'Test network connectivity between nodes',
            templateId: jobTemplateId,
          }
        });
      }

      // Create execution record
      const execution = await prisma.catalogExecution.create({
        data: {
          catalogId: connectivityCatalog.id,
          status: 'running',
          awxJobId: String(awxJob.id),
          parameters: JSON.stringify({
            executionNodeGroup,
            destinationIPs,
            ports,
          }),
          executedBy: executedBy || 'system',
          startedAt: new Date(),
        },
      });

      // Log activity
      await prisma.activity.create({
        data: {
          action: 'executed',
          entityType: 'connectivity-check',
          entityId: execution.id,
          entityName: 'Connectivity Check',
          description: `Connectivity check started from ${executionNodeGroup} to ${destinationIPs.length} destination(s)`,
          performedBy: executedBy || 'system',
        },
      });

      return NextResponse.json({
        success: true,
        execution,
        awxJob: { id: awxJob.id },
        message: 'Connectivity check started'
      });
    } catch (awxError) {
      logError('AWX job launch failed', awxError);

      // Return error instead of falling back to demo mode when AWX is configured but fails
      return NextResponse.json({
        success: false,
        error: awxError.message || 'Failed to launch AWX job',
        mode: 'error',
        message: 'AWX job launch failed - check AWX configuration and connectivity'
      }, { status: 500 });
    }
  } catch (error) {
    logError('Connectivity check error', error);
    return NextResponse.json(
      { error: error.message || 'Failed to run connectivity check' },
      { status: 500 }
    );
  }
}

// GET /api/connectivity-check - Get recent connectivity checks
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    // Find the Connectivity Check catalog
    const connectivityCatalog = await prisma.catalog.findFirst({
      where: { name: 'Connectivity Check' }
    });

    if (!connectivityCatalog) {
      return NextResponse.json([]);
    }

    const executions = await prisma.catalogExecution.findMany({
      where: {
        catalogId: connectivityCatalog.id,
      },
      orderBy: { startedAt: 'desc' },
      take: limit,
    });

    return NextResponse.json(executions);
  } catch (error) {
    logError('Error fetching connectivity checks', error);
    return NextResponse.json(
      { error: 'Failed to fetch connectivity checks' },
      { status: 500 }
    );
  }
}
