import type { FastifyRequest } from 'fastify'

/**
 * Best-effort JWT authentication for PUBLIC routes that return richer data when
 * the caller happens to be logged in.
 *
 * Unlike `authenticate`, a missing or invalid token is NOT an error — the
 * request simply proceeds as anonymous. Used by `GET /listings`, which is public
 * but attaches the viewer's match scores when it can identify them.
 *
 * Usage:
 *   onRequest: [optionalAuthenticate]
 */
export async function optionalAuthenticate(request: FastifyRequest): Promise<void> {
  try {
    await request.jwtVerify()
  } catch {
    // Anonymous request: leave `request.user` unset and carry on.
  }
}

/**
 * Reads the user id off a request that went through `optionalAuthenticate`.
 *
 * `@fastify/jwt` types `request.user` as always present, which is true only
 * after a successful `jwtVerify()`. On the optional path it can be undefined at
 * runtime, so this narrows at the boundary instead of letting the lie spread.
 */
export function optionalUserId(request: FastifyRequest): string | null {
  const user: { id?: string } | undefined = request.user
  return user?.id ?? null
}
