import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { prisma } from '@agrolink/db'
import { ReputationService } from './service.js'
import {
  TransactionParamsSchema,
  ProfileParamsSchema,
  SubmitRatingBodySchema,
  SubmitRatingResponseSchema,
  ReputationResponseSchema,
  ErrorResponseSchema,
} from './schema.js'

const service = new ReputationService(prisma)

export const reputationRoutes: FastifyPluginAsyncZod = async (app) => {
  // ── POST /api/v1/transactions/:id/rating ──────────────────────────────────
  app.post('/transactions/:id/rating', {
    schema: {
      params: TransactionParamsSchema,
      body: SubmitRatingBodySchema,
      response: {
        201: SubmitRatingResponseSchema,
        401: ErrorResponseSchema,
        409: ErrorResponseSchema,
        422: ErrorResponseSchema,
      },
    },
    onRequest: [app.authenticate],
    handler: async (request, reply) => {
      const data = await service.submitRating(request.user.id, request.params.id, request.body)
      return reply.code(201).send({ data, error: null })
    },
  })

  // ── GET /api/v1/profiles/:id/reputation ───────────────────────────────────
  app.get('/profiles/:id/reputation', {
    schema: {
      params: ProfileParamsSchema,
      response: {
        200: ReputationResponseSchema,
        404: ErrorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const data = await service.getReputation(request.params.id)
      return reply.send({ data, error: null })
    },
  })
}
