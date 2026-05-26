import type { FastifyRequest, FastifyReply } from 'fastify'
import '@fastify/jwt'

// Extende o payload do JWT para incluir os campos do usuário AgraIA
declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { id: string; phone: string }
    user: { id: string; phone: string }
  }
}

// Decora a instância do Fastify com o método authenticate
declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
}
