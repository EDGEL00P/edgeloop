import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@edgeloop/ui', '@edgeloop/shared'],
  experimental: {
    typedRoutes: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.espn.com',
      },
      {
        protocol: 'https',
        hostname: '**.espncdn.com',
      },
    ],
  },
}

export default nextConfig
