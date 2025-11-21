import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Get AWX configuration from environment variables or database
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
    baseUrl = 'http://127.0.0.1:59809';
  }

  return { baseUrl, token };
}

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

    const awxConfig = await getAwxConfig();

    // Cancel the job in AWX
    const cancelRes = await fetch(`${awxConfig.baseUrl}/api/v2/jobs/${awxJobId}/cancel/`, {
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

    return NextResponse.json({
      message: 'Job cancelled successfully',
      jobId: awxJobId
    });

  } catch (error) {
    console.error('Error cancelling automation:', error);
    return NextResponse.json(
      { error: 'Failed to cancel automation', message: error.message },
      { status: 500 }
    );
  }
}
