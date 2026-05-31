/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: '.next',
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: false },
  env: {
    DATABASE_URL: 'libsql://bill-manage-xuchi1368.aws-ap-northeast-1.turso.io',
    TURSO_AUTH_TOKEN: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODAyMzc2MzksImlkIjoiMDE5ZTdlNmUtMTAwMS03ZDhlLTg3YjUtYzJkNTM4NjFmOTFmIiwicmlkIjoiOTAzNWE5YWItZmQ2NC00NjE5LWIyNTYtYzRmZjA5ODFlYmYwIn0.Cgze6THLSGs_iDKg9QqyezQ_P8JUkLA95_xP0IGmcS532Iqbj9UqWvMg2QT0HmX4zpnSDaBhuOsERh1tjOVBCA',
    JWT_SECRET: 'bill-manager-jwt-secret-2026-change-in-production',
  },
};

export default nextConfig;
