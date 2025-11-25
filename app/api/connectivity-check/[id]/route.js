import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getJobStatus, getJobOutput, cancelJob } from '@/lib/awx-api';
import { logInfo, logError } from '@/lib/logger';

// GET /api/connectivity-check/[id] - Get execution status
export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const execution = await prisma.catalogExecution.findUnique({
      where: { id },
    });

    if (!execution) {
      return NextResponse.json(
        { error: 'Execution not found' },
        { status: 404 }
      );
    }

    // If execution is still running and has an AWX job, poll for updates
    if (execution.status === 'running' && execution.awxJobId) {
      try {
        const awxStatus = await getJobStatus(execution.awxJobId);
        let consoleOutput = '';
        let results = null;

        // Try to get job output
        try {
          consoleOutput = await getJobOutput(execution.awxJobId);
        } catch (e) {
          console.error('Error getting job output:', e);
        }

        // Map AWX status to our status
        let status = execution.status;
        if (awxStatus.status === 'successful') {
          status = 'success';

          // Try to parse results from artifacts or output
          if (awxStatus.artifacts) {
            try {
              results = parseConnectivityResults(awxStatus.artifacts);
            } catch (e) {
              console.error('Error parsing artifacts:', e);
            }
          }
        } else if (awxStatus.status === 'failed' || awxStatus.status === 'error') {
          status = 'failed';
        } else if (awxStatus.status === 'canceled') {
          status = 'canceled';
        }

        // Update execution if status changed
        if (status !== execution.status) {
          await prisma.catalogExecution.update({
            where: { id },
            data: {
              status,
              consoleOutput,
              artifacts: results ? JSON.stringify(results) : null,
              completedAt: status !== 'running' ? new Date() : null,
            },
          });
        }

        return NextResponse.json({
          ...execution,
          status,
          consoleOutput,
          results,
        });
      } catch (awxError) {
        logError('Error polling AWX job status', awxError);
        // Return current execution state if AWX polling fails
        return NextResponse.json(execution);
      }
    }

    // Parse results from artifacts if available
    let results = null;
    if (execution.artifacts) {
      try {
        results = JSON.parse(execution.artifacts);
      } catch (e) {
        console.error('Error parsing execution artifacts:', e);
      }
    }

    return NextResponse.json({
      ...execution,
      results,
    });
  } catch (error) {
    logError('Error fetching connectivity check execution', error);
    return NextResponse.json(
      { error: 'Failed to fetch execution' },
      { status: 500 }
    );
  }
}

// DELETE /api/connectivity-check/[id] - Cancel execution
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    const execution = await prisma.catalogExecution.findUnique({
      where: { id },
    });

    if (!execution) {
      return NextResponse.json(
        { error: 'Execution not found' },
        { status: 404 }
      );
    }

    if (execution.status !== 'running') {
      return NextResponse.json(
        { error: 'Execution is not running' },
        { status: 400 }
      );
    }

    // Cancel AWX job if exists
    if (execution.awxJobId) {
      try {
        await cancelJob(execution.awxJobId);
      } catch (awxError) {
        logError('Error canceling AWX job', awxError);
      }
    }

    // Update execution status
    await prisma.catalogExecution.update({
      where: { id },
      data: {
        status: 'canceled',
        completedAt: new Date(),
      },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        action: 'canceled',
        entityType: 'connectivity-check',
        entityId: id,
        entityName: 'Connectivity Check',
        description: 'Connectivity check canceled',
        performedBy: 'system',
      },
    });

    return NextResponse.json({ success: true, message: 'Execution canceled' });
  } catch (error) {
    logError('Error canceling connectivity check execution', error);
    return NextResponse.json(
      { error: 'Failed to cancel execution' },
      { status: 500 }
    );
  }
}

// Helper function to parse connectivity check results from AWX output
function parseConnectivityResults(artifacts) {
  if (!artifacts) return null;

  // If artifacts is a string, try to parse it
  const data = typeof artifacts === 'string' ? JSON.parse(artifacts) : artifacts;

  // Expected format from Ansible playbook:
  // { connectivity_results: [{ host: '...', port: '...', status: '...', ... }] }
  if (data.connectivity_results) {
    return data.connectivity_results.map(r => ({
      destination: r.host || r.destination,
      port: r.port,
      status: r.status === 'success' || r.reachable ? 'Success' : 'Failed',
      responseTime: r.response_time || r.responseTime,
      error: r.error || r.msg,
    }));
  }

  // Try to extract from flat structure
  if (Array.isArray(data)) {
    return data.map(r => ({
      destination: r.host || r.destination || r.ip,
      port: r.port,
      status: r.status === 'success' || r.reachable ? 'Success' : 'Failed',
      responseTime: r.response_time || r.responseTime,
      error: r.error || r.msg,
    }));
  }

  return null;
}
