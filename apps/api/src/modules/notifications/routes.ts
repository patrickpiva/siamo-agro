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
  PushSubscriptionBodySchema,
  RegisterPushResponseSchema,
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

  // ── POST /api/v1/notifications/push ──────────────────────────────────────
  // Saves a Web Push subscription for the authenticated user.
  // TODO: persist subscription to a push_subscriptions table (userId, endpoint, p256dh, auth, expiresAt)
  // TODO: use web-push library (npm i web-push) + VAPID_PRIVATE_KEY / VAPID_SUBJECT env vars to send pushes
  app.post('/push', {
    schema: {
      body: PushSubscriptionBodySchema,
      response: {
        200: RegisterPushResponseSchema,
        401: ErrorResponseSchema,
      },
    },
    onRequest: [app.authenticate],
    handler: async (_request, reply) => {
      // Stub: acknowledge receipt without persisting
      // Replace with: await service.registerPushSubscription(request.user.id, request.body)
      return reply.send({ data: { ok: true as const }, error: null })
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
