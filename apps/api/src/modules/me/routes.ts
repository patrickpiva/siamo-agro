import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { prisma } from '@agrolink/db'
import { MeService } from './service.js'
import {
  MeResponseSchema,
  UpdateMeBodySchema,
  UpdateMeResponseSchema,
  NotificationPrefsResponseSchema,
  UpdateNotificationPrefsBodySchema,
  ConsentsResponseSchema,
  UpdateConsentsBodySchema,
  DataExportResponseSchema,
  DeleteMeResponseSchema,
  ErrorResponseSchema,
} from './schema.js'

const service = new MeService(prisma)

export const meRoutes: FastifyPluginAsyncZod = async (app) => {
  // ── GET /api/v1/me ────────────────────────────────────────────────────────
  app.get('/', {
    schema: {
      response: {
        200: MeResponseSchema,
        401: ErrorResponseSchema,
        404: ErrorResponseSchema,
      },
    },
    onRequest: [app.authenticate],
    handler: async (request, reply) => {
      const profile = await service.getMe(request.user.id)
      return reply.send({ data: { profile }, error: null })
    },
  })

  // ── PATCH /api/v1/me ──────────────────────────────────────────────────────
  app.patch('/', {
    schema: {
      body: UpdateMeBodySchema,
      response: {
        200: UpdateMeResponseSchema,
        401: ErrorResponseSchema,
        404: ErrorResponseSchema,
        422: ErrorResponseSchema,
      },
    },
    onRequest: [app.authenticate],
    handler: async (request, reply) => {
      const result = await service.updateMe(request.user.id, request.body)
      return reply.send({ data: result, error: null })
    },
  })

  // ── GET /api/v1/me/notification-preferences ───────────────────────────────
  app.get('/notification-preferences', {
    schema: {
      response: {
        200: NotificationPrefsResponseSchema,
        401: ErrorResponseSchema,
        404: ErrorResponseSchema,
      },
    },
    onRequest: [app.authenticate],
    handler: async (request, reply) => {
      const preferences = await service.getNotificationPreferences(request.user.id)
      return reply.send({ data: { preferences }, error: null })
    },
  })

  // ── PATCH /api/v1/me/notification-preferences ─────────────────────────────
  app.patch('/notification-preferences', {
    schema: {
      body: UpdateNotificationPrefsBodySchema,
      response: {
        200: UpdateMeResponseSchema,
        401: ErrorResponseSchema,
        404: ErrorResponseSchema,
        422: ErrorResponseSchema,
      },
    },
    onRequest: [app.authenticate],
    handler: async (request, reply) => {
      await service.updateNotificationPreferences(request.user.id, request.body)
      return reply.send({ data: { ok: true as const }, error: null })
    },
  })

  // ── GET /api/v1/me/consents ───────────────────────────────────────────────
  app.get('/consents', {
    schema: {
      response: {
        200: ConsentsResponseSchema,
        401: ErrorResponseSchema,
        404: ErrorResponseSchema,
      },
    },
    onRequest: [app.authenticate],
    handler: async (request, reply) => {
      const consents = await service.getConsents(request.user.id)
      return reply.send({ data: { consents }, error: null })
    },
  })

  // ── PATCH /api/v1/me/consents ─────────────────────────────────────────────
  app.patch('/consents', {
    schema: {
      body: UpdateConsentsBodySchema,
      response: {
        200: UpdateMeResponseSchema,
        401: ErrorResponseSchema,
        404: ErrorResponseSchema,
        422: ErrorResponseSchema,
      },
    },
    onRequest: [app.authenticate],
    handler: async (request, reply) => {
      await service.updateConsents(request.user.id, request.body)
      return reply.send({ data: { ok: true as const }, error: null })
    },
  })

  // ── POST /api/v1/me/data-export ───────────────────────────────────────────
  app.post('/data-export', {
    schema: {
      response: {
        200: DataExportResponseSchema,
        401: ErrorResponseSchema,
        404: ErrorResponseSchema,
      },
    },
    onRequest: [app.authenticate],
    handler: async (request, reply) => {
      const result = await service.requestDataExport(request.user.id)
      return reply.send({ data: result, error: null })
    },
  })

  // ── DELETE /api/v1/me ─────────────────────────────────────────────────────
  app.delete('/', {
    schema: {
      response: {
        200: DeleteMeResponseSchema,
        401: ErrorResponseSchema,
        404: ErrorResponseSchema,
      },
    },
    onRequest: [app.authenticate],
    handler: async (request, reply) => {
      const result = await service.deleteAccount(request.user.id)
      return reply.send({ data: result, error: null })
    },
  })
}
