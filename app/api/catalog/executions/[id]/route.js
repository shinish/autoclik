import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/catalog/executions/[id] - Get execution details and poll AWX for updates
export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const execution = await prisma.catalogExecution.findUnique({
      where: { id },
      include: {
        catalog: {
          include: {
            environment: true,
          },
        },
      },
    });

    if (!execution) {
      return NextResponse.json(
        { error: 'Execution not found' },
        { status: 404 }
      );
    }

    // If execution has an AWX job ID and is still running, poll AWX for updates
    if (execution.awxJobId && execution.status === 'running') {
      try {
        // Use the token from the catalog's environment
        const awxToken = execution.catalog.environment.token;

        if (!awxToken) {
          console.error(`[Execution ${id}] AWX environment token not configured`);
          return NextResponse.json(execution);
        }

        const awxUrl = `${execution.catalog.environment.baseUrl}/api/v2/jobs/${execution.awxJobId}/`;

        const headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${awxToken}`,
        };

        const response = await fetch(awxUrl, { headers });

        if (response.ok) {
          const jobData = await response.json();

          console.log(`[Execution ${id}] AWX job status: ${jobData.status}, finished: ${jobData.finished}`);

          // Determine status based on AWX job status
          let status = execution.status;
          if (jobData.status === 'successful') {
            status = 'success';
          } else if (jobData.status === 'failed') {
            status = 'failed';
          } else if (jobData.status === 'canceled') {
            status = 'canceled';
          }

          console.log(`[Execution ${id}] Mapped status: ${execution.status} -> ${status}`);

          // Get console output if available
          let consoleOutput = execution.consoleOutput;
          try {
            const stdoutUrl = `${execution.catalog.environment.baseUrl}/api/v2/jobs/${execution.awxJobId}/stdout/?format=txt`;
            const stdoutHeaders = {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${awxToken}`,
            };
            const stdoutResponse = await fetch(stdoutUrl, { headers: stdoutHeaders });
            if (stdoutResponse.ok) {
              consoleOutput = await stdoutResponse.text();
            }
          } catch (e) {
            console.error('Error fetching stdout:', e);
          }

          // Update execution if status changed or we have new data
          if (status !== execution.status || consoleOutput !== execution.consoleOutput) {
            const updateData = {
              status,
              consoleOutput,
              artifacts: JSON.stringify(jobData.artifacts || {}),
            };

            if (status === 'success' || status === 'failed' || status === 'canceled') {
              updateData.completedAt = new Date();
            }

            if (status === 'failed') {
              updateData.errorMessage = jobData.result_traceback || 'Job failed';
            }

            const updatedExecution = await prisma.catalogExecution.update({
              where: { id },
              data: updateData,
            });

            return NextResponse.json({
              ...updatedExecution,
              catalog: execution.catalog,
              awxJobData: jobData,
            });
          }
        }
      } catch (error) {
        console.error('Error polling AWX job:', error);
        // Continue with existing execution data
      }
    }

    return NextResponse.json(execution);
  } catch (error) {
    console.error('Error fetching execution:', error);
    return NextResponse.json(
      { error: 'Failed to fetch execution' },
      { status: 500 }
    );
  }
}

// DELETE /api/catalog/executions/[id] - Cancel an execution
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    const execution = await prisma.catalogExecution.findUnique({
      where: { id },
      include: {
        catalog: {
          include: {
            environment: true,
          },
        },
      },
    });

    if (!execution) {
      return NextResponse.json(
        { error: 'Execution not found' },
        { status: 404 }
      );
    }

    // Cancel AWX job if it exists and is running
    if (execution.awxJobId && execution.status === 'running') {
      try {
        // Use the token from the catalog's environment
        const awxToken = execution.catalog.environment.token;

        if (awxToken) {
          const cancelUrl = `${execution.catalog.environment.baseUrl}/api/v2/jobs/${execution.awxJobId}/cancel/`;

          const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${awxToken}`,
          };

          await fetch(cancelUrl, {
            method: 'POST',
            headers,
          });
        } else {
          console.error('Cannot cancel job: AWX environment token not configured');
        }
      } catch (error) {
        console.error('Error canceling AWX job:', error);
      }
    }

    // Update execution status
    const updatedExecution = await prisma.catalogExecution.update({
      where: { id },
      data: {
        status: 'canceled',
        completedAt: new Date(),
      },
    });

    return NextResponse.json(updatedExecution);
  } catch (error) {
    console.error('Error canceling execution:', error);
    return NextResponse.json(
      { error: 'Failed to cancel execution' },
      { status: 500 }
    );
  }
}
