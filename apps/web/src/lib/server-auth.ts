import 'server-only'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { AppError } from '@siamo/shared'

export interface ServerSession {
  userId: string
  phone: string
}

/**
 * Em produção JWT_SECRET é obrigatório — com o fallback silencioso, a ausência
 * da env faria toda sessão parecer inválida (assinada por outro segredo) sem
 * nenhum sinal de erro. Lazy para não quebrar o build quando a env só existe
 * em runtime.
 */
function getJwtSecret(): string {
  const secret = process.env['JWT_SECRET']
  if (secret) return secret
  if (process.env.NODE_ENV === 'production') {
    throw new AppError('JWT_SECRET ausente em produção', 'CONFIG_MISSING_ENV', 500)
  }
  return 'dev-secret-change-in-production'
}

export async function getServerSession(): Promise<ServerSession | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('access_token')?.value
  if (!token) return null
  try {
    const payload = jwt.verify(token, getJwtSecret()) as {
      id: string
      phone: string
    }
    return { userId: payload.id, phone: payload.phone }
  } catch {
    return null
  }
}

export async function requireSession(): Promise<ServerSession> {
  const session = await getServerSession()
  if (!session) throw new AppError('Não autenticado', 'UNAUTHENTICATED', 401)
  return session
}
