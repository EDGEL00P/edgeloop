/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      allowedOrigins: ["0.0.0.0", "localhost"],
    },
  },
  // Allow serving from custom port (5000)
  env: {
    PORT: process.env.PORT || '5000',
  },
  // Configure image optimization
  images: {
    domains: [],
  },
  // Empty turbopack config acknowledges we're using Turbopack (Next.js 16 default)
  // Add custom Turbopack configuration here if needed
  turbopack: {},
};

export default nextConfig;
