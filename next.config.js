/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@neondatabase/serverless'],
  images: {
    domains: [
      'images.unsplash.com',
      'pixabay.com'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ]
  },
  // Allow cross-origin requests for Replit development
  experimental: {
    allowedDevOrigins: ['127.0.0.1', '*.replit.dev'],
  },
}

export default nextConfig;
