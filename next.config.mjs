/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb',
      allowedOrigins: [
        'localhost:3000',
        '127.0.0.1:3000',
        '0.0.0.0:3000',
        '192.168.100.15:3000',
        '192.168.20.1:3000',
        '192.168.19.1:3000',
        '*.local:3000',
        '*.local',
        '192.168.*',
        '10.*',
        '172.*',
      ],
    },
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
