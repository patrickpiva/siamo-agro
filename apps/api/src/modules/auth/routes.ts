import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { prisma } from '@agrolink/db'
import { AuthService } from './service.js'
import {
  RequestOtpBodySchema,
  RequestOtpResponseSchema,
  VerifyOtpBodySchema,
  VerifyOtpResponseSchema,
  RefreshBodySchema,
  RefreshResponseSchema,
  LogoutBodySchema,
  LogoutResponseSchema,
  ErrorResponseSchema,
} from './schema.js'
import { createWhatsAppAdapter } from '../../integrations/whatsapp/index.js'

const service = new AuthService(
  prisma,
  createWhatsAppAdapter(),
  process.env['JWT_SECRET'] ?? 'dev-secret-change-in-production',
)

export const authRoutes: FastifyPluginAsyncZod = async (app) => {
  // ── POST /api/v1/auth/otp/request ──────────────────────────────────────────
  app.post('/otp/request', {
    schema: {
      body: RequestOtpBodySchema,
      response: {
        200: RequestOtpResponseSchema,
        422: ErrorResponseSchema,
        429: ErrorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const { phone } = request.body
      const result = await service.requestOtp(phone)
      return reply.send({ data: result, error: null })
    },
  })

  // ── POST /api/v1/auth/otp/verify ───────────────────────────────────────────
  app.post('/otp/verify', {
    schema: {
      body: VerifyOtpBodySchema,
      response: {
        200: VerifyOtpResponseSchema,
        400: ErrorResponseSchema,
        422: ErrorResponseSchema,
        429: ErrorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const { phone, code } = request.body
      const result = await service.verifyOtp(phone, code)
      return reply.send({ data: result, error: null })
    },
  })

  // ── POST /api/v1/auth/refresh ──────────────────────────────────────────────
  app.post('/refresh', {
    schema: {
      body: RefreshBodySchema,
      response: {
        200: RefreshResponseSchema,
        401: ErrorResponseSchema,
        422: ErrorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const { refreshToken } = request.body
      const result = await service.refreshAccessToken(refreshToken)
      return reply.send({ data: result, error: null })
    },
  })

  // ── POST /api/v1/auth/logout ───────────────────────────────────────────────
  app.post('/logout', {
    schema: {
      body: LogoutBodySchema,
      response: {
        200: LogoutResponseSchema,
        401: ErrorResponseSchema,
        422: ErrorResponseSchema,
      },
    },
    onRequest: [app.authenticate],
    handler: async (request, reply) => {
      const { refreshToken } = request.body
      await service.logout(request.user.id, refreshToken)
      return reply.send({ data: { ok: true as const }, error: null })
    },
  })
}
