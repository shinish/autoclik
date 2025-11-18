/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone', // Enable standalone build for minimal deployment

  // Windows compatibility
  experimental: {
    esmExternals: 'loose',
  },

  // Webpack configuration for Windows path handling
  webpack: (config, { isServer, dev }) => {
    // Handle Windows path separators
    if (process.platform === 'win32') {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };

      // Fix source map issues on Windows
      if (dev) {
        config.devtool = 'eval-source-map';
      }
    }

    // Ignore source map warnings
    config.ignoreWarnings = [
      { module: /node_modules/ },
      /Failed to parse source map/,
      /source map url cannot be parsed/,
    ];

    return config;
  },

  // CORS headers configuration
  async headers() {
    return [
      {
        // Apply CORS headers to all API routes
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,PATCH,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' },
        ],
      },
    ];
  },
}

module.exports = nextConfig
