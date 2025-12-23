/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  async rewrites() {
    return [
      {
        source: '/media/:path*',
        destination: 'http://localhost:5001/media/:path*',
      },
    ]
  },
};

module.exports = nextConfig;