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
  // Enable webpack 5
  webpack: (config) => {
    config.resolve.fallback = { 
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    return config;
  },
};

module.exports = nextConfig;
