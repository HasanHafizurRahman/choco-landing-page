import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // When product images come from the admin panel's storage/CDN, allow that host here:
  // images: { remotePatterns: [{ protocol: 'https', hostname: 'cdn.example.com' }] },
};

export default nextConfig;
