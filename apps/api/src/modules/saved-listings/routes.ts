import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { prisma } from '@agraia/db'
import { SavedListingsService } from './service.js'
import {
  ToggleParamsSchema,
  ToggleResponseSchema,
  StatusParamsSchema,
  StatusResponseSchema,
  ListSavedQuerySchema,
  ListSavedResponseSchema,
  ErrorResponseSchema,
} from './schema.js'

const service = new SavedListingsService(prisma)

export const savedListingsRoutes: FastifyPluginAsyncZod = async (app) => {
  // ── POST /api/v1/saved-listings/:listingId ────────────────────────────────
  // Toggle: saves if not saved, unsaves if already saved.
  app.post('/:listingId', {
    schema: {
      params: ToggleParamsSchema,
      response: {
        200: ToggleResponseSchema,
        401: ErrorResponseSchema,
        404: ErrorResponseSchema,
      },
    },
    onRequest: [app.authenticate],
    handler: async (request, reply) => {
      const result = await service.toggle(request.user.id, request.params.listingId)
      return reply.send({ data: result, error: null })
    },
  })

  // ── GET /api/v1/saved-listings/:listingId ─────────────────────────────────
  // Check whether the authenticated user has saved a specific listing.
  app.get('/:listingId', {
    schema: {
      params: StatusParamsSchema,
      response: {
        200: StatusResponseSchema,
        401: ErrorResponseSchema,
      },
    },
    onRequest: [app.authenticate],
    handler: async (request, reply) => {
      const saved = await service.isSaved(request.user.id, request.params.listingId)
      return reply.send({ data: { saved }, error: null })
    },
  })

  // ── GET /api/v1/saved-listings ────────────────────────────────────────────
  // Paginated list of saved listings for the authenticated user.
  app.get('/', {
    schema: {
      querystring: ListSavedQuerySchema,
      response: {
        200: ListSavedResponseSchema,
        401: ErrorResponseSchema,
      },
    },
    onRequest: [app.authenticate],
    handler: async (request, reply) => {
      const result = await service.list(request.user.id, request.query)
      return reply.send({ ...result, error: null })
    },
  })
}
