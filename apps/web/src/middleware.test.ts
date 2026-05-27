import { describe, it, expect, vi, beforeEach } from 'vitest'
import { middleware } from './middleware'

// ─── Module mocks ─────────────────────────────────────────────────────────────

// vi.hoisted makes nextMock available before vi.mock's factory runs (hoisting order)
const nextMock = vi.hoisted(() => vi.fn())

vi.mock('next/server', () => ({
  NextResponse: {
    next: nextMock,
  },
}))

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Creates a base64url-encoded JWT with the given `exp` claim (Unix timestamp) */
function makeJwt(expSec: number): string {
  const payload = btoa(JSON.stringify({ sub: 'user-1', exp: expSec }))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
  return `eyJhbGciOiJIUzI1NiJ9.${payload}.signature`
}

const nowSec = () => Math.floor(Date.now() / 1000)

/** Token that expires 5 minutes from now — well within the valid window */
const validToken = () => makeJwt(nowSec() + 300)

/** Token that expires in 10 seconds — inside the 30-second refresh window */
const expiringToken = () => makeJwt(nowSec() + 10)

/** Token whose exp is already in the past */
const expiredToken = () => makeJwt(nowSec() - 60)

/** Mock NextRequest with the given cookie map */
function mockRequest(cookies: Record<string, string>, pathname = '/feed') {
  return {
    nextUrl: { pathname },
    cookies: {
      get: (name: string) => {
        const value = cookies[name]
        return value !== undefined ? { value } : undefined
      },
    },
  } as Parameters<typeof middleware>[0]
}

/** Sets up a fresh response mock for NextResponse.next() and returns helpers */
function setupResponseMock() {
  const sets: Array<{ name: string; value: string }> = []
  const deletes: string[] = []

  nextMock.mockReturnValue({
    cookies: {
      set: vi.fn((name: string, value: string) => sets.push({ name, value })),
      delete: vi.fn((name: string) => deletes.push(name)),
    },
  })

  return { sets, deletes }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('middleware — token refresh', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('fetch', vi.fn())
  })

  it('passes through without fetching when access token is valid', async () => {
    setupResponseMock()
    const req = mockRequest({ access_token: validToken() })

    await middleware(req)

    expect(vi.mocked(fetch)).not.toHaveBeenCalled()
    expect(nextMock).toHaveBeenCalledOnce()
  })

  it('passes through without fetching when access token is expiring but there is no refresh token', async () => {
    const { sets } = setupResponseMock()
    const req = mockRequest({ access_token: expiringToken() })

    await middleware(req)

    expect(vi.mocked(fetch)).not.toHaveBeenCalled()
    expect(sets).toHaveLength(0)
  })

  it('calls the refresh endpoint when access token is expiring and refresh token is present', async () => {
    setupResponseMock()
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ data: { accessToken: 'new-access', refreshToken: 'new-refresh' } }),
    } as Response)

    const req = mockRequest({
      access_token: expiringToken(),
      refresh_token: 'valid-refresh-token',
    })

    await middleware(req)

    expect(vi.mocked(fetch)).toHaveBeenCalledOnce()
    const [url, opts] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit]
    expect(url).toContain('/api/v1/auth/refresh')
    expect(opts.method).toBe('POST')
  })

  it('calls the refresh endpoint when access token is missing', async () => {
    setupResponseMock()
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ data: { accessToken: 'new-access', refreshToken: 'new-refresh' } }),
    } as Response)

    const req = mockRequest({ refresh_token: 'valid-refresh-token' })

    await middleware(req)

    expect(vi.mocked(fetch)).toHaveBeenCalledOnce()
  })

  it('calls the refresh endpoint when access token is expired', async () => {
    setupResponseMock()
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ data: { accessToken: 'new-access', refreshToken: 'new-refresh' } }),
    } as Response)

    const req = mockRequest({
      access_token: expiredToken(),
      refresh_token: 'valid-refresh-token',
    })

    await middleware(req)

    expect(vi.mocked(fetch)).toHaveBeenCalledOnce()
  })

  it('sets new access_token and refresh_token cookies on successful refresh', async () => {
    const { sets } = setupResponseMock()
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        data: { accessToken: 'fresh-access-token', refreshToken: 'fresh-refresh-token' },
      }),
    } as Response)

    const req = mockRequest({
      access_token: expiringToken(),
      refresh_token: 'old-refresh-token',
    })

    await middleware(req)

    const accessSet = sets.find((s) => s.name === 'access_token')
    const refreshSet = sets.find((s) => s.name === 'refresh_token')
    expect(accessSet?.value).toBe('fresh-access-token')
    expect(refreshSet?.value).toBe('fresh-refresh-token')
  })

  it('deletes both cookies when refresh endpoint returns a non-OK response', async () => {
    const { deletes } = setupResponseMock()
    vi.mocked(fetch).mockResolvedValue({ ok: false } as Response)

    const req = mockRequest({
      access_token: expiredToken(),
      refresh_token: 'revoked-refresh-token',
    })

    await middleware(req)

    expect(deletes).toContain('access_token')
    expect(deletes).toContain('refresh_token')
  })

  it('passes through silently on network error (API down)', async () => {
    const { sets, deletes } = setupResponseMock()
    vi.mocked(fetch).mockRejectedValue(new Error('ECONNREFUSED'))

    const req = mockRequest({
      access_token: expiredToken(),
      refresh_token: 'valid-refresh-token',
    })

    await middleware(req)

    expect(nextMock).toHaveBeenCalled()
    expect(sets).toHaveLength(0)
    expect(deletes).toHaveLength(0)
  })
})
