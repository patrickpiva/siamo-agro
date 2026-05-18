import type { FastifyInstance } from 'fastify'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import jwtPlugin from '@fastify/jwt'
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod'
import { authenticate } from './middlewares/auth.js'
import { authRoutes } from './modules/auth/routes.js'
import { listingsRoutes } from './modules/listings/routes.js'
import { uploadsRoutes } from './modules/uploads/routes.js'
import { matchmakingRoutes } from './modules/matchmaking/routes.js'

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: process.env['NODE_ENV'] === 'production' ? 'warn' : 'info',
    },
  })

  // ── Compiladores Zod ────────────────────────────────────────────────────────
  app.setValidatorCompiler(validatorCompiler)
  app.setSerializerCompiler(serializerCompiler)

  // ── Plugins de segurança ────────────────────────────────────────────────────
  await app.register(helmet)
  await app.register(cors, {
    origin: process.env['NEXT_PUBLIC_APP_URL'] ?? 'http://localhost:3000',
  })

  // ── JWT ─────────────────────────────────────────────────────────────────────
  await app.register(jwtPlugin, {
    secret: process.env['JWT_SECRET'] ?? 'dev-secret-change-in-production',
  })

  // Decora a instância com o middleware de autenticação para uso nas rotas
  app.decorate('authenticate', authenticate)

  // ── Health check ────────────────────────────────────────────────────────────
  app.get('/health', () => {
    return { status: 'ok', timestamp: new Date().toISOString() }
  })

  // ── Módulos ─────────────────────────────────────────────────────────────────
  await app.register(authRoutes, { prefix: '/api/v1/auth' })
  await app.register(listingsRoutes, { prefix: '/api/v1/listings' })
  await app.register(uploadsRoutes, { prefix: '/api/v1/uploads' })
  await app.register(matchmakingRoutes, { prefix: '/api/v1/listings' })

  return app
}
