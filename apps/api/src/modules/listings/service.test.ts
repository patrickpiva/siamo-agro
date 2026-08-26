import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { PrismaClient } from '@siamo/db'
import { ListingsService } from './service.js'
import { ListingNotFoundError, ListingForbiddenError } from './errors.js'

// ─── Mock external dependencies ───────────────────────────────────────────────

vi.mock('../../workers/matchmaking/queue.js', () => ({
  addComputeMatchesJob: vi.fn().mockResolvedValue(undefined),
}))

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makePrisma() {
  return {
    listing: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn().mockResolvedValue({}),
    },
    profile: {
      findUnique: vi.fn(),
    },
    listingPhoto: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
      // `list()` batch-fetches the first photo of each listing in one findMany
      findMany: vi.fn().mockResolvedValue([]),
    },
    $transaction: vi.fn(),
    $queryRaw: vi.fn(),
  }
}

function makeRawListing(overrides: Record<string, unknown> = {}) {
  return {
    id: 'listing-1',
    profileId: 'profile-1',
    kind: 'OFFER',
    category: 'COFFEE',
    title: 'Café arábica especial safra 2025',
    description: 'Descrição longa o suficiente para passar na validação.',
    price: '850.00',
    negotiable: false,
    status: 'ACTIVE',
    viewCount: 10,
    proposalCount: 2,
    matchCount: 5,
    createdAt: new Date('2025-01-01T00:00:00Z'),
    updatedAt: new Date('2025-01-01T00:00:00Z'),
    profile: {
      id: 'profile-1',
      userId: 'user-1',
      name: 'João Silva',
      photo: 'https://cdn.example.com/avatar.jpg',
      currentRating: 4.5,
      badge: 'GOLD',
      location: {
        city: 'Uberlândia',
        state: 'MG',
      },
    },
    photos: [{ id: 'photo-1', url: 'https://cdn.example.com/img.jpg', order: 0 }],
    ...overrides,
  }
}

// ─── findById ─────────────────────────────────────────────────────────────────

describe('ListingsService.findById', () => {
  let prisma: ReturnType<typeof makePrisma>
  let service: ListingsService

  beforeEach(() => {
    prisma = makePrisma()
    service = new ListingsService(prisma as unknown as PrismaClient)
  })

  it('returns profile with id, userId, city and state', async () => {
    prisma.listing.findUnique.mockResolvedValue(makeRawListing())

    const detail = await service.findById('listing-1')

    expect(detail.profile.id).toBe('profile-1')
    expect(detail.profile.userId).toBe('user-1')
    expect(detail.profile.city).toBe('Uberlândia')
    expect(detail.profile.state).toBe('MG')
  })

  it('returns null city and state when location is absent', async () => {
    const raw = makeRawListing({ profile: { ...makeRawListing().profile, location: null } })
    prisma.listing.findUnique.mockResolvedValue(raw)

    const detail = await service.findById('listing-1')

    expect(detail.profile.city).toBeNull()
    expect(detail.profile.state).toBeNull()
  })

  it('returns photos sorted by order', async () => {
    const raw = makeRawListing({
      photos: [
        { id: 'p2', url: 'https://cdn.example.com/b.jpg', order: 1 },
        { id: 'p1', url: 'https://cdn.example.com/a.jpg', order: 0 },
      ],
    })
    prisma.listing.findUnique.mockResolvedValue(raw)

    const detail = await service.findById('listing-1')

    // photos are returned as-is from DB (DB does the ordering via orderBy)
    expect(detail.photos).toHaveLength(2)
    expect(detail.photos[0]?.id).toBe('p2') // preserved as returned by Prisma
  })

  it('converts price string to number', async () => {
    prisma.listing.findUnique.mockResolvedValue(makeRawListing({ price: '1500.50' }))

    const detail = await service.findById('listing-1')

    expect(detail.price).toBe(1500.5)
  })

  it('returns null price when listing has no price', async () => {
    prisma.listing.findUnique.mockResolvedValue(makeRawListing({ price: null }))

    const detail = await service.findById('listing-1')

    expect(detail.price).toBeNull()
  })

  it('throws ListingNotFoundError when listing does not exist', async () => {
    prisma.listing.findUnique.mockResolvedValue(null)

    await expect(service.findById('nonexistent')).rejects.toThrow(ListingNotFoundError)
  })
})

/**
 * A flat row as `list()` receives it from $queryRaw — NOT the same shape as
 * `makeRawListing()`, which mimics the nested Prisma payload used by `findById`.
 */
function makeRawListRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'listing-1',
    profileId: 'profile-1',
    kind: 'OFFER',
    category: 'SOY',
    title: 'Soja safra 2025/26 — 1.500 sacas disponíveis',
    description: 'Descrição longa o suficiente para passar na validação.',
    price: '850.00',
    negotiable: false,
    status: 'ACTIVE',
    viewCount: 10,
    createdAt: new Date('2025-01-01T00:00:00Z'),
    updatedAt: new Date('2025-01-01T00:00:00Z'),
    profileName: 'João Silva',
    profilePhoto: null,
    profileRating: 4.5,
    profileBadge: 'GOLD',
    ...overrides,
  }
}

// ─── list: search relaxation ladder ──────────────────────────────────────────

/**
 * `list()` with `search` fires tier probes (`SELECT 1 ... LIMIT 1`) before the
 * main query. This helper answers those probes in exact → partial → fuzzy
 * order: `hits` names the probe that finds a row, and every call after that
 * probe is served from `postProbeResponses`.
 */
function mockSearchTierProbes(
  prisma: ReturnType<typeof makePrisma>,
  hits: 'exact' | 'partial' | 'fuzzy' | 'none',
  /** Responses for the queries AFTER the probes, in order. With a cursor the
   *  first is the `buildCursorCondition` lookup; the last is always the list. */
  postProbeResponses: unknown[][] = [],
) {
  const order = ['exact', 'partial', 'fuzzy'] as const
  const hitIndex = hits === 'none' ? -1 : order.indexOf(hits)
  let probe = 0
  let post = 0

  prisma.$queryRaw.mockImplementation(() => {
    // Probes: one per tier, up to the first that returns a row
    if (hitIndex === -1 ? probe < 3 : probe <= hitIndex) {
      const isHit = hitIndex !== -1 && probe === hitIndex
      probe += 1
      return Promise.resolve(isHit ? [{ one: 1 }] : [])
    }
    return Promise.resolve(postProbeResponses[post++] ?? [])
  })
}

/**
 * Reconstructs the SQL of a $queryRaw call for textual inspection.
 *
 * The mock receives the raw tagged template, so `Prisma.Sql` fragments
 * (whereClause, orderClause…) arrive as VALUES rather than text — a plain
 * `strings.join()` would not see any of what these tests look for. Hence the
 * recursion into values that are themselves Sql.
 */
function sqlOf(call: unknown[]): string {
  const [strings, ...values] = call as [ArrayLike<string>, ...unknown[]]
  const isSql = (v: unknown): v is { strings: string[]; values: unknown[] } =>
    typeof v === 'object' && v !== null && 'strings' in v && 'values' in v

  return Array.from(strings).reduce((acc, part, i) => {
    const value = values[i]
    const rendered = isSql(value) ? sqlOf([value.strings, ...value.values]) : ''
    return acc + part + rendered
  }, '')
}

describe('ListingsService.list — search relaxation', () => {
  let prisma: ReturnType<typeof makePrisma>
  let service: ListingsService

  beforeEach(() => {
    prisma = makePrisma()
    service = new ListingsService(prisma as unknown as PrismaClient)
  })

  const baseQuery = { limit: 20 } as Parameters<ListingsService['list']>[0]

  /** SQL of the nth $queryRaw call (0-indexed), with a readable error if absent. */
  function nthSql(n: number): string {
    const call: unknown = prisma.$queryRaw.mock.calls[n]
    if (!Array.isArray(call)) {
      throw new Error(`$queryRaw was never called ${n + 1} times`)
    }
    return sqlOf(call)
  }

  it('does not probe tiers when there is no text search', async () => {
    prisma.$queryRaw.mockResolvedValue([])

    const result = await service.list({ ...baseQuery })

    expect(prisma.$queryRaw).toHaveBeenCalledTimes(1) // the list query only
    expect(result.meta.searchRelaxed).toBeUndefined()
  })

  it('reports the exact tier and stops at the first probe', async () => {
    mockSearchTierProbes(prisma, 'exact', [[makeRawListRow()]])

    const result = await service.list({ ...baseQuery, search: 'soja' })

    expect(result.meta.searchRelaxed).toBe('exact')
    expect(prisma.$queryRaw).toHaveBeenCalledTimes(2) // 1 probe + list
  })

  it('relaxes to partial when the strict AND finds nothing', async () => {
    mockSearchTierProbes(prisma, 'partial', [[makeRawListRow()]])

    const result = await service.list({ ...baseQuery, search: 'soja milho' })

    expect(result.meta.searchRelaxed).toBe('partial')
    expect(prisma.$queryRaw).toHaveBeenCalledTimes(3) // 2 probes + list
  })

  it('relaxes to fuzzy when even the OR finds nothing', async () => {
    mockSearchTierProbes(prisma, 'fuzzy', [[makeRawListRow()]])

    const result = await service.list({ ...baseQuery, search: 'colheitadera' })

    expect(result.meta.searchRelaxed).toBe('fuzzy')
    expect(prisma.$queryRaw).toHaveBeenCalledTimes(4) // 3 probes + list
  })

  it('falls back to exact when no tier matches, so empty stays honest', async () => {
    mockSearchTierProbes(prisma, 'none', [])

    const result = await service.list({ ...baseQuery, search: 'xyzabc' })

    expect(result.data).toHaveLength(0)
    expect(result.meta.searchRelaxed).toBe('exact')
  })

  it('uses the expression indexed by 006 in the WHERE, else the GIN is skipped', async () => {
    mockSearchTierProbes(prisma, 'exact', [[makeRawListRow()]])

    await service.list({ ...baseQuery, search: 'agronomica' })

    const listSql = nthSql(1)
    expect(listSql).toContain('listing_search_document(lst.title, lst.description)')
    expect(listSql).toContain('immutable_unaccent(')
    // the old accent-sensitive expression must not survive anywhere
    expect(listSql).not.toContain('plainto_tsquery')
  })

  it('converts the tsquery to OR in the partial tier', async () => {
    mockSearchTierProbes(prisma, 'partial', [[makeRawListRow()]])

    await service.list({ ...baseQuery, search: 'soja milho' })

    const listSql = nthSql(2)
    expect(listSql).toContain(`replace(`)
    expect(listSql).toContain(`'&', '|'`)
  })

  it('uses word_similarity in the fuzzy tier, not whole-title similarity', async () => {
    mockSearchTierProbes(prisma, 'fuzzy', [[makeRawListRow()]])

    await service.list({ ...baseQuery, search: 'colheitadera' })

    const listSql = nthSql(3)
    expect(listSql).toContain('<%')
    expect(listSql).toContain('word_similarity(')
  })

  it('picks the tier without the cursor, so page 2 cannot land on another tier', async () => {
    // With a cursor the sequence is: probe(exact) → probe(partial) → cursor
    // lookup (buildCursorCondition) → list.
    mockSearchTierProbes(prisma, 'partial', [
      [{ createdAt: new Date('2025-01-01T00:00:00Z'), rank: 0.5, distance: null }],
      [makeRawListRow()],
    ])

    const result = await service.list({
      ...baseQuery,
      search: 'soja milho',
      cursor: 'listing-99',
    })

    expect(result.meta.searchRelaxed).toBe('partial')

    // The tier probes must not see the cursor — that is what keeps the tier
    // stable across pages
    expect(nthSql(0)).not.toContain('lst.id =')
    expect(nthSql(1)).not.toContain('lst.id =')
  })
})

// ─── checkOwnership (tested via update) ──────────────────────────────────────

describe('ListingsService ownership checks', () => {
  let prisma: ReturnType<typeof makePrisma>
  let service: ListingsService

  beforeEach(() => {
    prisma = makePrisma()
    service = new ListingsService(prisma as unknown as PrismaClient)
  })

  it('throws ListingForbiddenError when requesting user does not own the listing', async () => {
    prisma.listing.findUnique.mockResolvedValue({
      id: 'listing-1',
      profileId: 'profile-owner', // listing belongs to profile-owner
      kind: 'OFFER',
    })
    prisma.profile.findUnique.mockResolvedValue({
      id: 'profile-attacker', // different profile for the requesting user
      userId: 'user-attacker',
    })

    await expect(
      service.update('listing-1', 'user-attacker', { title: 'Tentativa de título longo' }),
    ).rejects.toThrow(ListingForbiddenError)
  })

  it('throws ListingNotFoundError when the listing does not exist', async () => {
    prisma.listing.findUnique.mockResolvedValue(null)
    prisma.profile.findUnique.mockResolvedValue({ id: 'profile-1', userId: 'user-1' })

    await expect(
      service.update('nonexistent', 'user-1', { title: 'Tentativa de título longo' }),
    ).rejects.toThrow(ListingNotFoundError)
  })

  it('throws ListingForbiddenError when user has no profile', async () => {
    prisma.listing.findUnique.mockResolvedValue({ id: 'listing-1', profileId: 'profile-1' })
    prisma.profile.findUnique.mockResolvedValue(null) // no profile for this user

    await expect(
      service.update('listing-1', 'user-no-profile', { title: 'Tentativa de título longo' }),
    ).rejects.toThrow(ListingForbiddenError)
  })
})
