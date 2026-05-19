'use server'

import { cookies } from 'next/headers'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ActionResult<T> = { ok: true; data: T } | { ok: false; code: string; message: string }

const API_URL = process.env['API_INTERNAL_URL'] ?? process.env['API_URL'] ?? 'http://localhost:3001'

// ─── requestOtp ───────────────────────────────────────────────────────────────

export async function requestOtp(phone: string): Promise<ActionResult<{ sent: true }>> {
  try {
    const res = await fetch(`${API_URL}/api/v1/auth/otp/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    })

    if (res.status === 429) {
      return { ok: false, code: 'RATE_LIMITED', message: 'Muitas tentativas. Aguarde 15 minutos.' }
    }

    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as {
        error?: { code?: string; message?: string }
      }
      return {
        ok: false,
        code: body.error?.code ?? 'REQUEST_FAILED',
        message: body.error?.message ?? 'Erro ao enviar código.',
      }
    }

    return { ok: true, data: { sent: true } }
  } catch {
    return { ok: false, code: 'NETWORK_ERROR', message: 'Sem conexão com o servidor.' }
  }
}

// ─── verifyOtp ────────────────────────────────────────────────────────────────

export async function verifyOtp(
  phone: string,
  code: string,
): Promise<ActionResult<{ needsOnboarding: boolean }>> {
  try {
    const res = await fetch(`${API_URL}/api/v1/auth/otp/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, code }),
    })

    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as {
        error?: { code?: string; message?: string }
      }
      return {
        ok: false,
        code: body.error?.code ?? 'VERIFY_FAILED',
        message: body.error?.message ?? 'Código inválido.',
      }
    }

    type VerifyBody = {
      data: { accessToken: string; refreshToken: string; needsOnboarding?: boolean }
    }
    const body = (await res.json()) as VerifyBody
    const { accessToken, refreshToken, needsOnboarding } = body.data
    const isProduction = process.env.NODE_ENV === 'production'
    const cookieStore = await cookies()

    cookieStore.set('access_token', accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 15 * 60,
      path: '/',
    })

    cookieStore.set('refresh_token', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
    })

    return { ok: true, data: { needsOnboarding: needsOnboarding ?? true } }
  } catch {
    return { ok: false, code: 'NETWORK_ERROR', message: 'Sem conexão com o servidor.' }
  }
}

// ─── logoutAction ─────────────────────────────────────────────────────────────

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
