import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  transpilePackages: [
    '@sistema-odontologico/auth-core',
    '@sistema-odontologico/config',
    '@sistema-odontologico/permissions',
    '@sistema-odontologico/types',
    '@sistema-odontologico/ui',
    '@sistema-odontologico/tenancy-core',
    '@sistema-odontologico/audit-core',
    '@sistema-odontologico/validation',
  ],
};

export default nextConfig;
