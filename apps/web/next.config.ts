import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    typedRoutes: true,
  },
  transpilePackages: ['@agrolink/ui', '@agrolink/shared'],
}

export default nextConfig
