import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import type { FastifyError } from 'fastify'
import { prisma } from '@agrolink/db'
import { AppError } from '@agrolink/shared'
import { ListingsService } from './service.js'
import {
  CreateListingBodySchema,
  CreateListingResponseSchema,
  ListListingsQuerySchema,
  ListListingsResponseSchema,
  GetListingParamsSchema,
  GetListingResponseSchema,
  UpdateListingBodySchema,
  UpdateListingResponseSchema,
  StatusUpdateResponseSchema,
  ErrorResponseSchema,
} from './schema.js'

const service = new ListingsService(prisma)

// eslint-disable-next-line @typescript-eslint/require-await
export const listingsRoutes: FastifyPluginAsyncZod = async (app) => {
  // ── POST /api/v1/listings ──────────────────────────────────────────────────
  app.post('/', {
    schema: {
      body: CreateListingBodySchema,
      response: {
        201: CreateListingResponseSchema,
        403: ErrorResponseSchema,
        422: ErrorResponseSchema,
      },
    },
    onRequest: [app.authenticate],
    handler: async (request, reply) => {
      const listing = await service.create(request.user.id, request.body)
      return reply.code(201).send({ data: listing, error: null })
    },
  })

  // ── GET /api/v1/listings ───────────────────────────────────────────────────
  app.get('/', {
    schema: {
      querystring: ListListingsQuerySchema,
      response: {
        200: ListListingsResponseSchema,
        422: ErrorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const result = await service.list(request.query)
      return reply.send({ ...result, error: null })
    },
  })

  // ── GET /api/v1/listings/:id ───────────────────────────────────────────────
  app.get('/:id', {
    schema: {
      params: GetListingParamsSchema,
      response: {
        200: GetListingResponseSchema,
        404: ErrorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const listing = await service.findById(request.params.id)
      return reply.send({ data: listing, error: null })
    },
  })

  // ── PATCH /api/v1/listings/:id ────────────────────────────────────────────
  app.patch('/:id', {
    schema: {
      params: GetListingParamsSchema,
      body: UpdateListingBodySchema,
      response: {
        200: UpdateListingResponseSchema,
        403: ErrorResponseSchema,
        404: ErrorResponseSchema,
        422: ErrorResponseSchema,
      },
    },
    onRequest: [app.authenticate],
    handler: async (request, reply) => {
      const listing = await service.update(request.params.id, request.user.id, request.body)
      return reply.send({ data: listing, error: null })
    },
  })

  // ── DELETE /api/v1/listings/:id ───────────────────────────────────────────
  app.delete('/:id', {
    schema: {
      params: GetListingParamsSchema,
      response: {
        200: StatusUpdateResponseSchema,
        403: ErrorResponseSchema,
        404: ErrorResponseSchema,
      },
    },
    onRequest: [app.authenticate],
    handler: async (request, reply) => {
      await service.delete(request.params.id, request.user.id)
      return reply.send({ data: { ok: true as const }, error: null })
    },
  })

  // ── POST /api/v1/listings/:id/pause ───────────────────────────────────────
  app.post('/:id/pause', {
    schema: {
      params: GetListingParamsSchema,
      response: {
        200: StatusUpdateResponseSchema,
        403: ErrorResponseSchema,
        404: ErrorResponseSchema,
      },
    },
    onRequest: [app.authenticate],
    handler: async (request, reply) => {
      await service.pause(request.params.id, request.user.id)
      return reply.send({ data: { ok: true as const }, error: null })
    },
  })

  // ── POST /api/v1/listings/:id/resume ──────────────────────────────────────
  app.post('/:id/resume', {
    schema: {
      params: GetListingParamsSchema,
      response: {
        200: StatusUpdateResponseSchema,
        403: ErrorResponseSchema,
        404: ErrorResponseSchema,
      },
    },
    onRequest: [app.authenticate],
    handler: async (request, reply) => {
      await service.resume(request.params.id, request.user.id)
      return reply.send({ data: { ok: true as const }, error: null })
    },
  })

  // ── Error handler local ────────────────────────────────────────────────────
  app.setErrorHandler((error: FastifyError, _request, reply) => {
    if (error instanceof AppError) {
      return reply.code(error.statusCode).send({
        data: null,
        error: { code: error.code, message: error.message },
      })
    }
    if (error.validation) {
      return reply.code(422).send({
        data: null,
        error: { code: 'VALIDATION_ERROR', message: error.message },
      })
    }
    app.log.error(error)
    return reply.code(500).send({
      data: null,
      error: { code: 'INTERNAL_ERROR', message: 'Erro interno do servidor' },
    })
  })
}
