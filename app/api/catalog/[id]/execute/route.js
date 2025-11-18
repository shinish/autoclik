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

    // Get AWX token from environment variable (mandatory)
    const awxToken = process.env.AWX_TOKEN;

    if (!awxToken) {
      // Update execution with error
      await prisma.catalogExecution.update({
        where: { id: execution.id },
        data: {
          status: 'failed',
          errorMessage: 'AWX_TOKEN environment variable is not configured',
          completedAt: new Date(),
        },
      });

      return NextResponse.json(
        { error: 'AWX_TOKEN environment variable is required but not configured' },
        { status: 500 }
      );
    }

    try {
      // Update execution status to running
      await prisma.catalogExecution.update({
        where: { id: execution.id },
        data: { status: 'running' },
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

      try {
        result = JSON.parse(responseText);
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

      // Update execution with AWX job ID
      const updatedExecution = await prisma.catalogExecution.update({
        where: { id: execution.id },
        data: {
          awxJobId: result.id?.toString(),
          consoleOutput: JSON.stringify(result),
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

      // Update execution with error
      await prisma.catalogExecution.update({
        where: { id: execution.id },
        data: {
          status: 'failed',
          errorMessage: error.message,
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
