import { NextResponse } from 'next/server';

// POST /api/awx/test - Test AWX connection
export async function POST(request) {
  try {
    const { baseUrl, token } = await request.json();

    if (!baseUrl) {
      return NextResponse.json(
        { success: false, message: 'Base URL is required' },
        { status: 400 }
      );
    }

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'AWX Token is required' },
        { status: 400 }
      );
    }

    // Remove /api/v2 if it's already in the URL and add /ping/
    const cleanUrl = baseUrl.replace(/\/api\/v2\/?$/, '');
    const pingUrl = `${cleanUrl}/api/v2/ping/`;

    // Test the connection
    const response = await fetch(pingUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      // Set timeout
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({
        success: false,
        message: `AWX returned error: ${response.status} ${response.statusText}`,
        details: errorText,
        url: pingUrl
      }, { status: 200 }); // Return 200 so frontend can handle the error message
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      message: 'Connection successful',
      version: data.version || 'Unknown',
      instanceGroups: data.instances || [],
      activeNode: data.active_node || null
    });

  } catch (error) {
    // Build the URL for error messages
    const cleanUrl = baseUrl ? baseUrl.replace(/\/api\/v2\/?$/, '') : '';
    const pingUrl = cleanUrl ? `${cleanUrl}/api/v2/ping/` : 'unknown';

    // Handle timeout
    if (error.name === 'AbortError' || error.name === 'TimeoutError') {
      return NextResponse.json({
        success: false,
        message: 'Connection timeout - AWX server did not respond within 5 seconds',
        url: pingUrl
      }, { status: 200 });
    }

    // Handle network errors
    if (error.message.includes('fetch')) {
      return NextResponse.json({
        success: false,
        message: 'Cannot reach AWX server - check if URL is correct and AWX is running',
        url: pingUrl,
        details: error.message
      }, { status: 200 });
    }

    return NextResponse.json({
      success: false,
      message: `Connection error: ${error.message}`,
      url: pingUrl
    }, { status: 200 });
  }
}
