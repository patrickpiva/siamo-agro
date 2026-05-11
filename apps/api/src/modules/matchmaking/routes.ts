import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { prisma } from '@agrolink/db'
import { AppError } from '@agrolink/shared'
import { MatchmakingService } from './service.js'
import {
  ListMatchesQuerySchema,
  MatchesResponseSchema,
  MatchesProcessingResponseSchema,
  ErrorResponseSchema,
} from './schema.js'

const service = new MatchmakingService(prisma)

export const matchmakingRoutes: FastifyPluginAsyncZod = async (app) => {
  // GET /api/v1/listings/:id/matches
  app.get('/:id/matches', {
    onRequest: [app.authenticate],
    schema: {
      querystring: ListMatchesQuerySchema,
      response: {
        200: MatchesResponseSchema,
        202: MatchesProcessingResponseSchema,
        403: ErrorResponseSchema,
        404: ErrorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const { id } = request.params as { id: string }
      const userId = (request.user as { id: string }).id

      try {
        const result = await service.getMatchesForListing(id, userId, request.query)

        if ('processing' in result) {
          return reply.code(202).send({ data: null, processing: true, error: null })
        }

        return reply.send({ ...result, error: null })
      } catch (err) {
        if (err instanceof AppError) {
          return reply
            .code(err.statusCode)
            .send({ data: null, error: { code: err.code, message: err.message } })
        }
        throw err
      }
    },
  })
}
