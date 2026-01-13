/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  distDir: '.next',
  // Disable built-in server since we're using Express
  // The build output will be served by Express in production
};

export default nextConfig;
