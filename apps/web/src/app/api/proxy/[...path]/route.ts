/**
 * CP-FE1 — Auth-injecting API proxy.
 * Forwards all requests to the Fastify API, injecting Authorization: Bearer
 * from the access_token httpOnly cookie. Takes precedence over the
 * next.config.ts rewrite (which has no auth injection).
 */
import { type NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const API_URL = process.env['API_URL'] ?? 'http://localhost:3001'

async function handler(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
): Promise<NextResponse> {
  const { path } = await params
  const apiPath = path.join('/')
  const targetUrl = `${API_URL}/api/v1/${apiPath}${request.nextUrl.search}`

  const cookieStore = await cookies()
  const token = cookieStore.get('access_token')?.value

  const headers: Record<string, string> = {}
  if (token) headers['Authorization'] = `Bearer ${token}`

  const rawBody =
    request.method !== 'GET' && request.method !== 'HEAD' ? await request.text() : undefined

  // Only forward a body (and the JSON content-type) when there is actual content.
  // Fastify rejects Content-Type: application/json with an empty body.
  const body = rawBody?.length ? rawBody : undefined
  if (body) headers['Content-Type'] = 'application/json'

  try {
    const res = await fetch(targetUrl, {
      method: request.method,
      headers,
      body,
    })
    const text = await res.text()
    return new NextResponse(text, {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch {
    return NextResponse.json(
      { data: null, error: { code: 'PROXY_ERROR', message: 'API unreachable' } },
      { status: 502 },
    )
  }
}

export const GET = handler
export const POST = handler
export const PATCH = handler
export const DELETE = handler
export const PUT = handler
