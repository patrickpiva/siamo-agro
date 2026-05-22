import type { NextConfig } from 'next'

// Variáveis de ambiente da raiz do monorepo são carregadas via
// `node --env-file=../../.env` nos scripts dev/build/start do package.json.

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001'

const nextConfig: NextConfig = {
  typedRoutes: true,
  transpilePackages: ['@agrolink/ui', '@agrolink/shared'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/proxy/:path*',
        destination: `${API_URL}/api/v1/:path*`,
      },
    ]
  },
}

export default nextConfig
