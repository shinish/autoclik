import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST /api/catalog/launch - Launch AWX job template
export async function POST(request) {
  try {
    const body = await request.json();
    const { environmentId, jobTemplateId, requestBody } = body;

    // Validate required fields
    if (!environmentId || !jobTemplateId) {
      return NextResponse.json(
        { error: 'Environment ID and Job Template ID are required' },
        { status: 400 }
      );
    }

    // Fetch environment details
    const environment = await prisma.awxEnvironment.findUnique({
      where: { id: environmentId },
    });

    if (!environment) {
      return NextResponse.json(
        { error: 'Environment not found' },
        { status: 404 }
      );
    }

    // Construct the AWX API URL
    // baseUrl already contains /api/v2, so we just append the job_templates endpoint
    const awxUrl = `${environment.baseUrl}/job_templates/${jobTemplateId}/launch/`;

    // Prepare request headers
    const headers = {
      'Content-Type': 'application/json',
    };

    // Add authorization if token is provided
    if (environment.token) {
      headers['Authorization'] = `Bearer ${environment.token}`;
    }

    // Parse request body if provided
    let parsedBody = {};
    if (requestBody && requestBody.trim()) {
      try {
        parsedBody = JSON.parse(requestBody);
      } catch (error) {
        return NextResponse.json(
          {
            success: false,
            message: 'Invalid JSON in request body',
            details: error.message
          },
          { status: 400 }
        );
      }
    }

    // Make POST request to AWX
    const awxResponse = await fetch(awxUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(parsedBody),
    });

    const awxData = await awxResponse.json();

    if (!awxResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          message: `AWX API error: ${awxResponse.status} ${awxResponse.statusText}`,
          details: awxData,
          url: awxUrl
        },
        { status: awxResponse.status }
      );
    }

    // Return success response
    return NextResponse.json({
      success: true,
      jobId: awxData.id || awxData.job,
      jobUrl: awxData.url || `${environment.baseUrl}/#/jobs/${awxData.id || awxData.job}`,
      data: awxData,
      message: 'Job launched successfully'
    });

  } catch (error) {
    console.error('Error launching job:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to launch job',
        details: error.message
      },
      { status: 500 }
    );
  }
}
