import type { FastifyRequest, FastifyReply } from 'fastify'

/**
 * Middleware de autenticação JWT.
 * Valida o header Authorization: Bearer <token>, popula request.user.
 * Retorna 401 com mensagem clara se o token for inválido ou ausente.
 *
 * Uso em rotas protegidas:
 *   onRequest: [app.authenticate]
 */
export async function authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    await request.jwtVerify()
  } catch {
    return reply.code(401).send({
      data: null,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Token de acesso inválido ou expirado. Faça login novamente.',
      },
    })
  }
}
