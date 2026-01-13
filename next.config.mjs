/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  distDir: '.next',
  // Exclude server directory from Next.js compilation
  typescript: {
    ignoreBuildErrors: false,
    tsconfigPath: './tsconfig.json',
  },
  // Exclude server files
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'].map(ext => `page.${ext}`).concat(['tsx', 'ts', 'jsx', 'js']),
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
};

export default nextConfig;
