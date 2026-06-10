import 'server-only'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { AppError } from '@agraia/shared'

export interface ServerSession {
  userId: string
  phone: string
}

export async function getServerSession(): Promise<ServerSession | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('access_token')?.value
  if (!token) return null
  try {
    const payload = jwt.verify(
      token,
      process.env['JWT_SECRET'] ?? 'dev-secret-change-in-production',
    ) as {
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
