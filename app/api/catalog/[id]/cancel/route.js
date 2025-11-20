import { NextResponse } from 'next/server';
import { getAWXConfig } from '@/lib/awx';

export async function POST(request, { params }) {
  try {
    const { awxJobId } = await request.json();
    const { id } = params;

    if (!awxJobId) {
      return NextResponse.json(
        { error: 'AWX Job ID is required' },
        { status: 400 }
      );
    }

    const awxConfig = await getAWXConfig();

    // Cancel the job in AWX
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
