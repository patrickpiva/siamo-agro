import type { NextConfig } from 'next'
import withSerwistInit from '@serwist/next'

// Variáveis de ambiente da raiz do monorepo são carregadas via
// `node --env-file=../../.env` nos scripts dev/start do package.json.
// O proxy de API é tratado por apps/web/src/app/api/proxy/[...path]/route.ts
// que injeta o header Authorization a partir do cookie access_token.

const nextConfig: NextConfig = {
  typedRoutes: true,
  transpilePackages: ['@agrolink/ui', '@agrolink/shared'],
  // Derives NEXT_PUBLIC_* vars from their server-side counterparts so client
  // components get the values without requiring duplicate entries in .env.
  env: {
    NEXT_PUBLIC_API_URL: process.env['API_URL'] ?? 'http://localhost:3001',
    // NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set
    // directly in .env — do NOT forward them here or this block would
    // override the real values with empty strings.
  },
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

const withSerwist = withSerwistInit({
  swSrc: 'src/sw.ts',
  swDest: 'public/sw.js',
  // Disable SW in dev to avoid caching issues during development
  disable: process.env['NODE_ENV'] === 'development',
})

export default withSerwist(nextConfig)
