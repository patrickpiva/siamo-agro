import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StorageClient } from '@supabase/storage-js'
import { UploadsService } from './service.js'
import { UploadStorageNotConfiguredError } from './errors.js'
import {
  PresignedBodySchema,
  PresignedResponseSchema,
  ConfirmBodySchema,
  ConfirmResponseSchema,
  ErrorResponseSchema,
} from './schema.js'

function buildStorageClient(): StorageClient {
  const url = process.env['SUPABASE_URL']
  const key = process.env['SUPABASE_SERVICE_ROLE_KEY']
  if (!url || !key) throw new UploadStorageNotConfiguredError()
  return new StorageClient(`${url}/storage/v1`, {
    apikey: key,
    Authorization: `Bearer ${key}`,
  })
}

let _service: UploadsService | null = null

function getService(): UploadsService {
  if (!_service) _service = new UploadsService(buildStorageClient())
  return _service
}

export const uploadsRoutes: FastifyPluginAsyncZod = async (app) => {
  // ── POST /api/v1/uploads/presigned ────────────────────────────────────────
  app.post('/presigned', {
    schema: {
      body: PresignedBodySchema,
      response: {
        200: PresignedResponseSchema,
        401: ErrorResponseSchema,
        422: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
    },
    onRequest: [app.authenticate],
    handler: async (request, reply) => {
      const uploads = await getService().presigned(request.user.id, request.body)
      return reply.send({ data: { uploads }, error: null })
    },
  })

  // ── POST /api/v1/uploads/confirm ──────────────────────────────────────────
  app.post('/confirm', {
    schema: {
      body: ConfirmBodySchema,
      response: {
        200: ConfirmResponseSchema,
        401: ErrorResponseSchema,
        422: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
    },
    onRequest: [app.authenticate],
    handler: async (request, reply) => {
      const urls = await getService().confirm(request.body.keys)
      return reply.send({ data: { urls }, error: null })
    },
  })
}
