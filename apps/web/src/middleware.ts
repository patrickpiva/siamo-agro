import { type NextRequest, NextResponse } from 'next/server'

// ─── JWT helpers (Edge-compatible, no Node.js libs) ───────────────────────────

function getTokenExpiry(token: string): number | null {
  try {
    const part = token.split('.')[1]
    if (!part) return null
    const payload = JSON.parse(atob(part.replace(/-/g, '+').replace(/_/g, '/'))) as { exp?: number }
    return payload.exp ?? null
  } catch {
    return null
  }
}

/** Returns true if the token is missing, malformed, or expires within 30 s */
function needsRefresh(token: string | undefined): boolean {
  if (!token) return true
  const exp = getTokenExpiry(token)
  if (!exp) return true
  return Date.now() / 1000 > exp - 30
}

// ─── Cookie defaults (must match apps/web/src/actions/auth.ts) ───────────────

const COOKIE_BASE = {
  httpOnly: true,
  sameSite: 'lax' as const,
  path: '/',
} as const

// ─── Middleware ───────────────────────────────────────────────────────────────

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const isProxyRequest = request.nextUrl.pathname.startsWith('/api/proxy/')
  const accessToken = request.cookies.get('access_token')?.value
  const refreshToken = request.cookies.get('refresh_token')?.value

  // Build a NextResponse that injects Authorization for proxy requests.
  // Cookie mutations (.cookies.set / .delete) can be chained on the returned response.
  function makeResponse(token: string | undefined): NextResponse {
    if (isProxyRequest && token) {
      const headers = new Headers(request.headers)
      headers.set('Authorization', `Bearer ${token}`)
      return NextResponse.next({ request: { headers } })
    }
    return NextResponse.next()
  }

  // Access token is still valid — inject it for proxy requests, pass through otherwise
  if (!needsRefresh(accessToken)) {
    return makeResponse(accessToken)
  }

  // No refresh token — let page-level guards handle redirect to /entrar
  if (!refreshToken) {
    return NextResponse.next()
  }

  // ── Attempt silent token refresh ─────────────────────────────────────────────
  try {
    const apiUrl = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001'
    const res = await fetch(`${apiUrl}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })

    if (!res.ok) {
      // Refresh token is revoked or expired — clear cookies so guards redirect cleanly
      const response = NextResponse.next()
      response.cookies.delete('access_token')
      response.cookies.delete('refresh_token')
      return response
    }

    const json = (await res.json()) as {
      data: { accessToken: string; refreshToken: string }
    }

    const isProduction = process.env.NODE_ENV === 'production'
    const newToken = json.data.accessToken

    const response = makeResponse(newToken)

    response.cookies.set('access_token', newToken, {
      ...COOKIE_BASE,
      secure: isProduction,
      maxAge: 60 * 15, // 15 min — matches ACCESS_TOKEN_TTL
    })
    response.cookies.set('refresh_token', json.data.refreshToken, {
      ...COOKIE_BASE,
      secure: isProduction,
      maxAge: 60 * 60 * 24 * 30, // 30 days — matches REFRESH_TOKEN_EXPIRES_DAYS
    })

    return response
  } catch {
    // Network error (API down?) — proceed without refreshing; guards will handle it
    return NextResponse.next()
  }
}

// ─── Route matcher ────────────────────────────────────────────────────────────
// Runs on all routes except Next.js internals and static assets.
// The token-refresh fetch goes directly to localhost:3001, so no infinite loop risk.

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico).*)'],
}
