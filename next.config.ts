import type { NextConfig } from "next";

// Get basePath from environment variable (default to empty string for root deployment)
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

const nextConfig: NextConfig = {
  // Set basePath for routing
  basePath: basePath,

  // Set assetPrefix to ensure assets are loaded from correct path
  assetPrefix: basePath,

  // Enable trailing slash for consistent URL handling
  trailingSlash: false,

  // Ensure environment variables are available on client
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || `${basePath}/api`,
  },

  // Add CORS headers for API routes and CSP
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; img-src 'self' http://localhost:3003 http: https: data: blob:; connect-src 'self' http://localhost:3003 http: https:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-eval' 'unsafe-inline';",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
