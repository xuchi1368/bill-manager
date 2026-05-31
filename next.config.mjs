/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: '.next',
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: false },
  env: {
    DATABASE_URL: 'libsql://bill-manage-xuchi1368.aws-ap-northeast-1.turso.io',
    TURSO_AUTH_TOKEN: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODAyNDAwMDIsImlkIjoiMDE5ZTdlNmUtMTAwMS03ZDhlLTg3YjUtYzJkNTM4NjFmOTFmIiwicmlkIjoiOTAzNWE5YWItZmQ2NC00NjE5LWIyNTYtYzRmZjA5ODFlYmYwIn0.nYW3MSzvl8wKPlCYAMN0dSk6Cp0WQYGNCdP1tnEe7XRtoNMWwjmokUvR0j3HiHJX6qilVgMu2Y5ubnLCjIIBCQ',
    JWT_SECRET: 'bill-manager-jwt-secret-2026-change-in-production',
  },
};

export default nextConfig;
