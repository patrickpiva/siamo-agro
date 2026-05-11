'use server'

import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env['JWT_SECRET'] ?? 'dev-secret-change-in-production'

interface JwtPayload {
  id: string
  phone: string
}

/**
 * Lê o userId do cookie httpOnly access_token.
 * Retorna null se não autenticado ou token expirado.
 */
export async function getUserIdFromCookie(): Promise<string | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('access_token')?.value
  if (!token) return null

  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload
    return payload.id
  } catch {
    return null
  }
}
