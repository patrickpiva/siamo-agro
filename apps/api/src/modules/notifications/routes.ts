import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { prisma } from '@agrolink/db'
import { NotificationsService } from './service.js'
import {
  ListNotificationsQuerySchema,
  ListNotificationsResponseSchema,
  ReadAllResponseSchema,
  NotificationParamsSchema,
  ReadOneResponseSchema,
  ErrorResponseSchema,
} from './schema.js'

const service = new NotificationsService(prisma)

export const notificationsRoutes: FastifyPluginAsyncZod = async (app) => {
  // ── GET /api/v1/notifications ─────────────────────────────────────────────
  app.get('/', {
    schema: {
      querystring: ListNotificationsQuerySchema,
      response: {
        200: ListNotificationsResponseSchema,
        401: ErrorResponseSchema,
      },
    },
    onRequest: [app.authenticate],
    handler: async (request, reply) => {
      const result = await service.list(request.user.id, request.query)
      return reply.send({ ...result, error: null })
    },
  })

  // ── POST /api/v1/notifications/read-all ───────────────────────────────────
  app.post('/read-all', {
    schema: {
      response: {
        200: ReadAllResponseSchema,
        401: ErrorResponseSchema,
      },
    },
    onRequest: [app.authenticate],
    handler: async (request, reply) => {
      const result = await service.markAllRead(request.user.id)
      return reply.send({ data: result, error: null })
    },
  })

  // ── PATCH /api/v1/notifications/:id/read ──────────────────────────────────
  app.patch('/:id/read', {
    schema: {
      params: NotificationParamsSchema,
      response: {
        200: ReadOneResponseSchema,
        401: ErrorResponseSchema,
        404: ErrorResponseSchema,
      },
    },
    onRequest: [app.authenticate],
    handler: async (request, reply) => {
      const result = await service.markOneRead(request.user.id, request.params.id)
      return reply.send({ data: result, error: null })
    },
  })
}
