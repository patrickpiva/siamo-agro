import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { prisma } from '@siamo/db'
import { TransactionService } from './service.js'
import {
  TransactionParamsSchema,
  CreateTransactionBodySchema,
  CreateTransactionResponseSchema,
  ListTransactionsQuerySchema,
  ListTransactionsResponseSchema,
  GetTransactionResponseSchema,
  CounterProposalBodySchema,
  TransactionActionResponseSchema,
  CancelTransactionBodySchema,
  SendMessageBodySchema,
  SendMessageResponseSchema,
  ErrorResponseSchema,
} from './schema.js'

const service = new TransactionService(prisma)

export const transactionsRoutes: FastifyPluginAsyncZod = async (app) => {
  // ── POST /api/v1/transactions ─────────────────────────────────────────────
  app.post('/', {
    schema: {
      body: CreateTransactionBodySchema,
      response: {
        201: CreateTransactionResponseSchema,
        403: ErrorResponseSchema,
        409: ErrorResponseSchema,
        422: ErrorResponseSchema,
      },
    },
    onRequest: [app.authenticate],
    handler: async (request, reply) => {
      const data = await service.create(request.user.id, request.body)
      return reply.code(201).send({ data, error: null })
    },
  })

  // ── GET /api/v1/transactions ──────────────────────────────────────────────
  app.get('/', {
    schema: {
      querystring: ListTransactionsQuerySchema,
      response: { 200: ListTransactionsResponseSchema, 401: ErrorResponseSchema },
    },
    onRequest: [app.authenticate],
    handler: async (request, reply) => {
      const result = await service.list(request.user.id, request.query)
      return reply.send({ ...result, error: null })
    },
  })

  // ── GET /api/v1/transactions/:id ──────────────────────────────────────────
  app.get('/:id', {
    schema: {
      params: TransactionParamsSchema,
      response: {
        200: GetTransactionResponseSchema,
        403: ErrorResponseSchema,
        404: ErrorResponseSchema,
      },
    },
    onRequest: [app.authenticate],
    handler: async (request, reply) => {
      const data = await service.findById(request.user.id, request.params.id)
      return reply.send({ data, error: null })
    },
  })

  // ── POST /api/v1/transactions/:id/accept ─────────────────────────────────
  app.post('/:id/accept', {
    schema: {
      params: TransactionParamsSchema,
      response: {
        200: TransactionActionResponseSchema,
        403: ErrorResponseSchema,
        422: ErrorResponseSchema,
      },
    },
    onRequest: [app.authenticate],
    handler: async (request, reply) => {
      const data = await service.accept(request.user.id, request.params.id)
      return reply.send({ data, error: null })
    },
  })

  // ── POST /api/v1/transactions/:id/counter ────────────────────────────────
  app.post('/:id/counter', {
    schema: {
      params: TransactionParamsSchema,
      body: CounterProposalBodySchema,
      response: {
        200: TransactionActionResponseSchema,
        403: ErrorResponseSchema,
        422: ErrorResponseSchema,
      },
    },
    onRequest: [app.authenticate],
    handler: async (request, reply) => {
      const data = await service.counter(request.user.id, request.params.id, request.body)
      return reply.send({ data, error: null })
    },
  })

  // ── POST /api/v1/transactions/:id/start ──────────────────────────────────
  app.post('/:id/start', {
    schema: {
      params: TransactionParamsSchema,
      response: {
        200: TransactionActionResponseSchema,
        403: ErrorResponseSchema,
        422: ErrorResponseSchema,
      },
    },
    onRequest: [app.authenticate],
    handler: async (request, reply) => {
      const data = await service.confirmStart(request.user.id, request.params.id)
      return reply.send({ data, error: null })
    },
  })

  // ── POST /api/v1/transactions/:id/complete ───────────────────────────────
  app.post('/:id/complete', {
    schema: {
      params: TransactionParamsSchema,
      response: {
        200: TransactionActionResponseSchema,
        403: ErrorResponseSchema,
        422: ErrorResponseSchema,
      },
    },
    onRequest: [app.authenticate],
    handler: async (request, reply) => {
      const data = await service.confirmComplete(request.user.id, request.params.id)
      return reply.send({ data, error: null })
    },
  })

  // ── POST /api/v1/transactions/:id/cancel ─────────────────────────────────
  app.post('/:id/cancel', {
    schema: {
      params: TransactionParamsSchema,
      body: CancelTransactionBodySchema,
      response: {
        200: TransactionActionResponseSchema,
        403: ErrorResponseSchema,
        422: ErrorResponseSchema,
      },
    },
    onRequest: [app.authenticate],
    handler: async (request, reply) => {
      const data = await service.cancel(request.user.id, request.params.id, request.body)
      return reply.send({ data, error: null })
    },
  })

  // ── POST /api/v1/transactions/:id/messages ───────────────────────────────
  app.post('/:id/messages', {
    schema: {
      params: TransactionParamsSchema,
      body: SendMessageBodySchema,
      response: {
        201: SendMessageResponseSchema,
        403: ErrorResponseSchema,
        422: ErrorResponseSchema,
      },
    },
    onRequest: [app.authenticate],
    handler: async (request, reply) => {
      const data = await service.sendMessage(request.user.id, request.params.id, request.body)
      return reply.code(201).send({ data, error: null })
    },
  })
}
