import type { NextConfig } from 'next'
import withSerwistInit from '@serwist/next'

// Variáveis de ambiente da raiz do monorepo são carregadas via
// `node --env-file=../../.env` nos scripts dev/start do package.json.

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

const withSerwist = withSerwistInit({
  swSrc: 'src/sw.ts',
  swDest: 'public/sw.js',
  // Disable SW in dev to avoid caching issues during development
  disable: process.env['NODE_ENV'] === 'development',
})

export default withSerwist(nextConfig)
