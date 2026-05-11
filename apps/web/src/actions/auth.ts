'use server'

import { cookies } from 'next/headers'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ActionResult<T> = { ok: true; data: T } | { ok: false; code: string; message: string }

// ─── logoutAction ─────────────────────────────────────────────────────────────
// Permanece como Server Action — raro, não precisa de mock nos testes E2E.

const API_URL = process.env['API_URL'] ?? 'http://localhost:3001'

export async function logoutAction(): Promise<ActionResult<{ ok: boolean }>> {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('access_token')?.value
    const refreshToken = cookieStore.get('refresh_token')?.value

    if (accessToken && refreshToken) {
      await fetch(`${API_URL}/api/v1/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ refreshToken }),
      })
    }

    cookieStore.delete('access_token')
    cookieStore.delete('refresh_token')

    return { ok: true, data: { ok: true } }
  } catch {
    // Limpa os cookies mesmo em caso de erro de rede
    const cookieStore = await cookies()
    cookieStore.delete('access_token')
    cookieStore.delete('refresh_token')
    return { ok: true, data: { ok: true } }
  }
}
