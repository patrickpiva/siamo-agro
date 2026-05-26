import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { prisma } from '@agraia/db'
import { PrivacyService } from './service.js'
import { ConsentBodySchema, ConsentResponseSchema, ErrorResponseSchema } from './schema.js'

const service = new PrivacyService(prisma)

export const privacyRoutes: FastifyPluginAsyncZod = async (app) => {
  // ── POST /api/v1/privacy/consent ───────────────────────────────────────────
  app.post('/consent', {
    schema: {
      body: ConsentBodySchema,
      response: {
        200: ConsentResponseSchema,
        401: ErrorResponseSchema,
        422: ErrorResponseSchema,
      },
    },
    onRequest: [app.authenticate],
    handler: async (request, reply) => {
      const result = await service.record(request.user.id, request.body)
      return reply.send({ data: result, error: null })
    },
  })
}
