/** @type {import('next').NextConfig} */

// Universal platform detection - works everywhere automatically
function getAppUrl() {
  // Check explicit setting first
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  
  // Auto-detect platform and build URL
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  
  // Railway
  if (process.env.RAILWAY_PUBLIC_DOMAIN) {
    return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
  }
  
  // Vercel
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  // Render
  if (process.env.RENDER_EXTERNAL_URL) {
    return process.env.RENDER_EXTERNAL_URL;
  }
  
  // Fly.io
  if (process.env.FLY_APP_NAME) {
    return `https://${process.env.FLY_APP_NAME}.fly.dev`;
  }
  
  // Heroku
  if (process.env.HEROKU_APP_NAME) {
    return `https://${process.env.HEROKU_APP_NAME}.herokuapp.com`;
  }
  
  // Generic PORT-based (works on any platform)
  const port = process.env.PORT || '3000';
  const host = process.env.HOST || 'localhost';
  return `${protocol}://${host}:${port}`;
}

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['server', 'shared'],
  
  // Auto-configured environment variables
  env: {
    NEXT_PUBLIC_APP_URL: getAppUrl(),
  },
  
  // External packages - prevents bundling issues on all platforms
  serverExternalPackages: [
    'express',
    'passport',
    'express-session',
    'pg',
    'postgres',
    'drizzle-orm',
    'connect-pg-simple',
    'memorystore',
    'ioredis',
    'ws',
    'bufferutil',
    'utf-8-validate',
  ],
  
  // Standalone output works on Docker, Railway, Render, etc.
  // Vercel will ignore this and use its own output
  output: 'standalone',
  
  // Image optimization - allow all HTTPS sources
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
    unoptimized: process.env.NODE_ENV === 'development',
  },
  
  // Webpack configuration for universal compatibility
  webpack: (config, { isServer }) => {
    // Client-side fallbacks for Node.js modules
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
      };
    }
    
    // Ignore platform-specific modules
    config.externals = config.externals || [];
    if (isServer) {
      config.externals.push({
        'utf-8-validate': 'commonjs utf-8-validate',
        'bufferutil': 'commonjs bufferutil',
      });
    }
    
    return config;
  },
  
  // Experimental features for better compatibility
  experimental: {
    serverComponentsExternalPackages: [
      'express',
      'passport',
      'express-session',
      'pg',
      'postgres',
      'drizzle-orm',
    ],
  },
};

export default nextConfig;
