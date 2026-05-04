import type { FastifyInstance } from 'fastify'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: process.env['NODE_ENV'] === 'production' ? 'warn' : 'info',
    },
  })

  await app.register(helmet)
  await app.register(cors, {
    origin: process.env['NEXT_PUBLIC_APP_URL'] ?? 'http://localhost:3000',
  })

  app.get('/health', () => {
    return { status: 'ok', timestamp: new Date().toISOString() }
  })

  return app
}
