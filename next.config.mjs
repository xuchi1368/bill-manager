/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: '.next',
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: false },
};

export default nextConfig;
