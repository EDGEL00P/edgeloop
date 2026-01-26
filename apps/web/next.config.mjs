/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    ppr: true, // Enable Partial Prerendering
    reactCompiler: true,
  },
  transpilePackages: ['@edgeloop/ui'],
}

export default nextConfig
