import type { NextConfig } from 'next'

// Variáveis de ambiente da raiz do monorepo são carregadas via
// `node --env-file=../../.env` nos scripts dev/build/start do package.json.

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
}

export default nextConfig
