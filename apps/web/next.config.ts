import type { NextConfig } from 'next';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

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
  async rewrites() {
    return [
      {
        source: '/api/storage/:path*',
        destination: `${API_URL}/api/storage/:path*`,
      },
    ];
  },
};

export default nextConfig;
