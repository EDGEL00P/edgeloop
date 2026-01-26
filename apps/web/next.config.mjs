/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // PPR and React Compiler require additional setup/canary versions
    // Can be enabled when upgrading to canary versions
  },
  transpilePackages: ['@edgeloop/ui'],
}

export default nextConfig
