import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request, { params }) {
  try {
    const { awxJobId } = await request.json();
    const { id } = await params;

    if (!awxJobId) {
      return NextResponse.json(
        { error: 'AWX Job ID is required' },
        { status: 400 }
      );
    }

    // Get catalog with environment
    const catalog = await prisma.catalog.findUnique({
      where: { id },
      include: { environment: true },
    });

    if (!catalog || !catalog.environment) {
      return NextResponse.json(
        { error: 'Catalog or environment not found' },
        { status: 404 }
      );
    }

    const awxConfig = {
      url: catalog.environment.baseUrl,
      token: catalog.environment.token,
    };

    // Check if AWX is configured
    if (!awxConfig.token) {
      console.error('AWX environment is not configured properly.');
      return NextResponse.json(
        {
          error: 'AWX environment not configured',
          details: 'Please configure AWX environment credentials in Settings > AWX Environments'
        },
        { status: 503 }
      );
    }

    console.log(`Attempting to cancel AWX job ${awxJobId} at ${awxConfig.url}`);

    // Cancel the job in AWX
    try {
      const cancelRes = await fetch(`${awxConfig.url}/api/v2/jobs/${awxJobId}/cancel/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${awxConfig.token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!cancelRes.ok) {
        const errorText = await cancelRes.text();
        console.error('AWX cancel error:', errorText);
        return NextResponse.json(
          { error: 'Failed to cancel job in AWX', details: errorText },
          { status: cancelRes.status }
        );
      }
    } catch (fetchError) {
      console.error('Failed to connect to AWX:', fetchError.message);
      return NextResponse.json(
        {
          error: 'Failed to connect to AWX',
          details: `Cannot reach AWX server at ${awxConfig.url}. Please check if AWX is running and the URL is correct.`,
          baseUrl: awxConfig.url
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      message: 'Job cancelled successfully',
      jobId: awxJobId
    });

  } catch (error) {
    console.error('Error cancelling catalog execution:', error);
    return NextResponse.json(
      { error: 'Failed to cancel catalog execution', message: error.message },
      { status: 500 }
    );
  }
}
