import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { prisma } from '@agraia/db'
import { ProfilesService } from './service.js'
import { CreateProfileBodySchema, ProfileResponseSchema, ErrorResponseSchema } from './schema.js'

const service = new ProfilesService(prisma)

export const profilesRoutes: FastifyPluginAsyncZod = async (app) => {
  // ── POST /api/v1/profiles ──────────────────────────────────────────────────
  app.post('/', {
    schema: {
      body: CreateProfileBodySchema,
      response: {
        201: ProfileResponseSchema,
        401: ErrorResponseSchema,
        409: ErrorResponseSchema,
        422: ErrorResponseSchema,
      },
    },
    onRequest: [app.authenticate],
    handler: async (request, reply) => {
      const profile = await service.create(request.user.id, request.body)
      return reply.status(201).send({
        data: {
          profile: {
            id: profile.id,
            userId: profile.userId,
            type: profile.type,
            name: profile.name,
            propertyName: profile.propertyName,
            bio: profile.bio,
            photo: profile.photo,
            badge: profile.badge,
            createdAt: profile.createdAt.toISOString(),
          },
        },
        error: null,
      })
    },
  })
}
