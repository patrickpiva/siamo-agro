// Funções de auth que rodam no cliente e chamam os Route Handlers do Next.js.
// O Route Handler faz a chamada server-to-server para o Fastify e seta os cookies.
// Playwright consegue interceptar essas chamadas com page.route().

export type AuthResult<T> = { ok: true; data: T } | { ok: false; code: string; message: string }

interface ErrorShape {
  data: null
  error: { code: string; message: string }
}

// ─── requestOtp ───────────────────────────────────────────────────────────────

export async function requestOtp(
  phone: string,
): Promise<AuthResult<{ expiresIn: number; attemptsLeft: number }>> {
  try {
    const res = await fetch('/api/auth/otp/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    })

    const json: unknown = await res.json()

    if (!res.ok) {
      const err = json as ErrorShape
      return { ok: false, code: err.error.code, message: err.error.message }
    }

    const { data } = json as { data: { expiresIn: number; attemptsLeft: number }; error: null }
    return { ok: true, data }
  } catch {
    return { ok: false, code: 'NETWORK_ERROR', message: 'Erro de conexão. Tente novamente.' }
  }
}

// ─── verifyOtp ────────────────────────────────────────────────────────────────

export async function verifyOtp(
  phone: string,
  code: string,
): Promise<AuthResult<{ userId: string; needsOnboarding: boolean }>> {
  try {
    const res = await fetch('/api/auth/otp/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, code }),
    })

    const json: unknown = await res.json()

    if (!res.ok) {
      const err = json as ErrorShape
      return { ok: false, code: err.error.code, message: err.error.message }
    }

    const { data } = json as { data: { userId: string; needsOnboarding: boolean }; error: null }
    return { ok: true, data }
  } catch {
    return { ok: false, code: 'NETWORK_ERROR', message: 'Erro de conexão. Tente novamente.' }
  }
}
