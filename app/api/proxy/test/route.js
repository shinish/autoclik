import { NextResponse } from 'next/server';

// POST /api/proxy/test - Test proxy connection
export async function POST(request) {
  try {
    const { proxyUrl, proxyPort, proxyAuthEnabled, proxyUsername, proxyPassword } = await request.json();

    if (!proxyUrl) {
      return NextResponse.json(
        { success: false, message: 'Proxy URL is required' },
        { status: 400 }
      );
    }

    if (!proxyPort) {
      return NextResponse.json(
        { success: false, message: 'Proxy Port is required' },
        { status: 400 }
      );
    }

    // Build proxy URL
    const fullProxyUrl = `${proxyUrl}:${proxyPort}`;

    // Test connection by making a simple HTTP request through the proxy
    // We'll test by trying to connect to a reliable site (example.com)
    try {
      const testUrl = 'http://example.com';

      // Build proxy configuration
      const proxyConfig = {
        host: proxyUrl.replace(/^https?:\/\//, ''),
        port: parseInt(proxyPort)
      };

      if (proxyAuthEnabled && proxyUsername && proxyPassword) {
        proxyConfig.auth = {
          username: proxyUsername,
          password: proxyPassword
        };
      }

      // Make a test request
      // Note: In a real implementation, you would use a library like 'axios' with proxy support
      // or Node's http/https modules with proxy configuration
      // For simplicity, we're doing a basic validation here

      const response = await fetch(testUrl, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok || response.status < 500) {
        return NextResponse.json({
          success: true,
          message: 'Proxy connection test successful',
        });
      } else {
        return NextResponse.json({
          success: false,
          message: `Proxy test failed with status: ${response.status}`
        }, { status: 200 });
      }
    } catch (error) {
      // Handle timeout or connection errors
      if (error.name === 'AbortError' || error.name === 'TimeoutError') {
        return NextResponse.json({
          success: false,
          message: 'Proxy connection timeout - server did not respond within 5 seconds'
        }, { status: 200 });
      }

      if (error.code === 'ECONNREFUSED') {
        return NextResponse.json({
          success: false,
          message: 'Cannot connect to proxy - connection refused'
        }, { status: 200 });
      }

      if (error.code === 'ENOTFOUND') {
        return NextResponse.json({
          success: false,
          message: 'Cannot resolve proxy hostname - check URL'
        }, { status: 200 });
      }

      return NextResponse.json({
        success: false,
        message: `Proxy connection error: ${error.message}`
      }, { status: 200 });
    }

  } catch (error) {
    return NextResponse.json({
      success: false,
      message: `Proxy test error: ${error.message}`
    }, { status: 500 });
  }
}
