import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fetchListing } from './api-client'

// ---------------------------------------------------------------------------
// api-client — fetchListing (client-safe, sem cookies)
// ---------------------------------------------------------------------------

const MOCK_LISTING = {
  id: 'cm123',
  kind: 'OFFER',
  category: 'COFFEE',
  title: 'Café arábica especial',
  description: 'Safra 2025, bebida mole.',
  price: 1850,
  negotiable: false,
  status: 'ACTIVE',
  profileId: 'prof-1',
  viewCount: 10,
  createdAt: '2026-05-01T00:00:00.000Z',
  updatedAt: '2026-05-01T00:00:00.000Z',
  photos: [],
  profile: { name: 'João Silva', photo: null, rating: 4.9, badge: 'GOLD' },
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('fetchListing', () => {
  it('retorna o listing quando a API responde 200', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ data: MOCK_LISTING, error: null }), { status: 200 }),
    )

    const result = await fetchListing('cm123')
    expect(result).toMatchObject({ id: 'cm123', title: 'Café arábica especial' })
  })

  it('retorna null quando a API responde 404', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ data: null, error: { code: 'NOT_FOUND' } }), { status: 404 }),
    )

    const result = await fetchListing('nao-existe')
    expect(result).toBeNull()
  })

  it('retorna null quando o fetch lança exceção (offline)', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

    const result = await fetchListing('cm123')
    expect(result).toBeNull()
  })

  it('chama o endpoint correto com o id fornecido', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ data: MOCK_LISTING, error: null }), { status: 200 }),
    )

    await fetchListing('cm-target-id')
    // Client components sempre passam pelo /api/proxy (injeção de auth + região)
    expect(fetch).toHaveBeenCalledWith('/api/proxy/listings/cm-target-id', expect.any(Object))
  })
})
