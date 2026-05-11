import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const API_URL = process.env['API_URL'] ?? 'http://localhost:3001'

const SuccessSchema = z.object({
  data: z.object({
    accessToken: z.string(),
    refreshToken: z.string(),
    user: z.object({ id: z.string() }).passthrough(),
    needsOnboarding: z.boolean(),
  }),
  error: z.null(),
})

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
}

export async function POST(req: NextRequest) {
  try {
    const body: unknown = await req.json()

    const res = await fetch(`${API_URL}/api/v1/auth/otp/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const data: unknown = await res.json()

    if (!res.ok) {
      return NextResponse.json(data, { status: res.status })
    }

    const parsed = SuccessSchema.safeParse(data)
    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: { code: 'PARSE_ERROR', message: 'Resposta inesperada da API' } },
        { status: 500 },
      )
    }

    const { accessToken, refreshToken, user, needsOnboarding } = parsed.data.data
    const userId = user.id

    const response = NextResponse.json(
      { data: { userId, needsOnboarding }, error: null },
      { status: 200 },
    )

    // Tokens nunca chegam ao JavaScript do cliente — apenas cookies httpOnly
    response.cookies.set('access_token', accessToken, {
      ...COOKIE_OPTS,
      maxAge: 60 * 15, // 15 min
    })
    response.cookies.set('refresh_token', refreshToken, {
      ...COOKIE_OPTS,
      maxAge: 60 * 60 * 24 * 30, // 30 dias
    })

    return response
  } catch {
    return NextResponse.json(
      { data: null, error: { code: 'NETWORK_ERROR', message: 'Erro de conexão com a API' } },
      { status: 502 },
    )
  }
}
