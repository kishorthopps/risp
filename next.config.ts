import type { NextConfig } from 'next';
import { appConfig } from './lib/config';

const backendUrl = appConfig.MC_URL.replace(/\/api$/, '');

const nextConfig: NextConfig = {
    // output: 'standalone',
    eslint: {
        ignoreDuringBuilds: true,
    },
    images: { unoptimized: true },
    async rewrites() {
        return [
            {
                source: '/media/:path*',
                destination: `${backendUrl}/media/:path*`,
            },
        ]
    },
};

export default nextConfig;
