import type { NextConfig } from 'next';

const config: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@beorchid/core-sdk'],
  experimental: {
    externalDir: true,
  },
  output: 'standalone',
};

export default config;
