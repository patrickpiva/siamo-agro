import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { HelpService } from './service.js'
import {
  ListFaqResponseSchema,
  SearchFaqQuerySchema,
  SearchFaqResponseSchema,
  ErrorResponseSchema,
} from './schema.js'

const service = new HelpService()

export const helpRoutes: FastifyPluginAsyncZod = async (app) => {
  // ── GET /api/v1/help/faq ──────────────────────────────────────────────────
  app.get('/faq', {
    schema: {
      response: {
        200: ListFaqResponseSchema,
      },
    },
    handler: async (_request, reply) => {
      return reply.send({ data: service.listFaq(), error: null })
    },
  })

  // ── GET /api/v1/help/faq/search?q= ───────────────────────────────────────
  app.get('/faq/search', {
    schema: {
      querystring: SearchFaqQuerySchema,
      response: {
        200: SearchFaqResponseSchema,
        422: ErrorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      return reply.send({ data: service.searchFaq(request.query.q), error: null })
    },
  })
}
