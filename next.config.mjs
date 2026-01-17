import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Exclude server directory from Next.js builds
  // Server code runs separately as Rust backend
  transpilePackages: ['shared'],
  
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
    // Use VERCEL_PROJECT_PRODUCTION_URL for production links (always set)
    // Fallback to VERCEL_URL for current deployment URL
    NEXT_PUBLIC_APP_URL: process.env.RAILWAY_PUBLIC_DOMAIN
      ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
      : process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}`
          : process.env.NEXT_PUBLIC_VERCEL_URL
            ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
            : 'http://localhost:3000',
    // Expose Vercel environment for client-side use
    NEXT_PUBLIC_VERCEL_ENV: process.env.VERCEL_ENV || 'development',
    // Expose deployment ID for version tracking
    NEXT_PUBLIC_VERCEL_DEPLOYMENT_ID: process.env.VERCEL_DEPLOYMENT_ID || '',
  },
  
  // Server packages excluded - not used in Next.js app
  // serverExternalPackages: ['@hono/node-server', 'hono'],
  
  // Standalone output for Docker/Railway/Render
  // Vercel uses this for optimized deployments
  output: 'standalone',
  
  // Image optimization for Vercel
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
  },
  
  // Mobile-first optimizations
  compress: true,
  poweredByHeader: false,
  
  // Explicitly configure Turbopack for Next.js 16
  // Required for Vercel deployments
  turbopack: {},
  
  // Production optimizations
  swcMinify: true,
  
  // Experimental features for better performance
  experimental: {
    optimizePackageImports: ['@radix-ui/react-icons', 'lucide-react'],
  },
};

export default nextConfig;
