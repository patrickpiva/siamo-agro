import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { PrismaClient } from '@siamo/db'
import { ListingsService } from './service.js'
import {
  ListingNotFoundError,
  ListingForbiddenError,
  ListingLocationRequiredError,
  ListingMatchFilterUnauthenticatedError,
} from './errors.js'

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
    // Anonymous-path defaults; the authenticated path overrides these
    matchScore: null,
    matchDistanceKm: null,
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

    expect(prisma.$queryRaw).toHaveBeenCalledTimes(2) // list + count, no probes
    expect(result.meta.searchRelaxed).toBeUndefined()
  })

  it('reports the exact tier and stops at the first probe', async () => {
    mockSearchTierProbes(prisma, 'exact', [[makeRawListRow()]])

    const result = await service.list({ ...baseQuery, search: 'soja' })

    expect(result.meta.searchRelaxed).toBe('exact')
    expect(prisma.$queryRaw).toHaveBeenCalledTimes(3) // 1 probe + list + count
  })

  it('relaxes to partial when the strict AND finds nothing', async () => {
    mockSearchTierProbes(prisma, 'partial', [[makeRawListRow()]])

    const result = await service.list({ ...baseQuery, search: 'soja milho' })

    expect(result.meta.searchRelaxed).toBe('partial')
    expect(prisma.$queryRaw).toHaveBeenCalledTimes(4) // 2 probes + list + count
  })

  it('relaxes to fuzzy when even the OR finds nothing', async () => {
    mockSearchTierProbes(prisma, 'fuzzy', [[makeRawListRow()]])

    const result = await service.list({ ...baseQuery, search: 'colheitadera' })

    expect(result.meta.searchRelaxed).toBe('fuzzy')
    expect(prisma.$queryRaw).toHaveBeenCalledTimes(5) // 3 probes + list + count
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

// ─── list: filters, viewer and total ─────────────────────────────────────────

describe('ListingsService.list — filters and viewer', () => {
  let prisma: ReturnType<typeof makePrisma>
  let service: ListingsService

  beforeEach(() => {
    prisma = makePrisma()
    service = new ListingsService(prisma as unknown as PrismaClient)
  })

  const baseQuery = { limit: 20 } as Parameters<ListingsService['list']>[0]

  /** A viewer with a profile and a location on it. */
  function givenViewerProfile(overrides: Record<string, unknown> = {}) {
    prisma.profile.findUnique.mockResolvedValue({
      id: 'profile-viewer',
      location: { latitude: -19.9, longitude: -43.9 },
      ...overrides,
    })
  }

  function sqlOfCall(n: number): string {
    const call: unknown = prisma.$queryRaw.mock.calls[n]
    if (!Array.isArray(call)) throw new Error(`$queryRaw was never called ${n + 1} times`)
    return sqlOf(call)
  }

  it('expands a single kind into a one-element IN list, keeping old URLs working', async () => {
    prisma.$queryRaw.mockResolvedValue([])

    await service.list({ ...baseQuery, kind: ['OFFER'] })

    expect(sqlOfCall(0)).toContain('lst.kind::text IN (')
  })

  it('filters on several kinds and categories at once', async () => {
    prisma.$queryRaw.mockResolvedValue([])

    await service.list({ ...baseQuery, kind: ['OFFER', 'DEMAND'], category: ['COFFEE', 'SOY'] })

    const sql = sqlOfCall(0)
    expect(sql).toContain('lst.kind::text IN (')
    expect(sql).toContain('lst.category IN (')
  })

  it('filters by seller badge', async () => {
    prisma.$queryRaw.mockResolvedValue([])

    await service.list({ ...baseQuery, badge: ['GOLD', 'SILVER'] })

    expect(sqlOfCall(0)).toContain('p.badge::text IN (')
  })

  it('joins match_scores against the viewer profile when authenticated', async () => {
    givenViewerProfile()
    prisma.$queryRaw.mockResolvedValue([])

    await service.list({ ...baseQuery }, 'user-viewer')

    expect(sqlOfCall(0)).toContain('LEFT JOIN match_scores ms')
  })

  it('does not join match_scores for anonymous requests', async () => {
    prisma.$queryRaw.mockResolvedValue([])

    await service.list({ ...baseQuery })

    expect(sqlOfCall(0)).not.toContain('match_scores')
  })

  it('rejects minMatchScore without a viewer instead of ignoring it', async () => {
    prisma.$queryRaw.mockResolvedValue([])

    await expect(service.list({ ...baseQuery, minMatchScore: 0.7 })).rejects.toThrow(
      ListingMatchFilterUnauthenticatedError,
    )
  })

  it('applies minMatchScore in the probe query too, not just the main one', async () => {
    givenViewerProfile()
    mockSearchTierProbes(prisma, 'exact', [[makeRawListRow()]])

    await service.list({ ...baseQuery, search: 'soja', minMatchScore: 0.7 }, 'user-viewer')

    // Probe (call 0) must carry both the join and the score filter — otherwise
    // it would report "results exist" for rows minMatchScore then removes
    const probeSql = sqlOfCall(0)
    expect(probeSql).toContain('LEFT JOIN match_scores ms')
    expect(probeSql).toContain('ms.score >=')
  })

  it("falls back to the viewer's profile location when lat/lng are omitted", async () => {
    givenViewerProfile()
    prisma.$queryRaw.mockResolvedValue([])

    await service.list({ ...baseQuery, radiusKm: 50 }, 'user-viewer')

    expect(sqlOfCall(0)).toContain('ST_DWithin')
  })

  it('rejects a distance filter when no origin can be resolved', async () => {
    prisma.$queryRaw.mockResolvedValue([])

    await expect(service.list({ ...baseQuery, radiusKm: 50 })).rejects.toThrow(
      ListingLocationRequiredError,
    )
  })

  it('rejects a distance filter when the viewer has no location on file', async () => {
    givenViewerProfile({ location: null })
    prisma.$queryRaw.mockResolvedValue([])

    await expect(service.list({ ...baseQuery, radiusKm: 50 }, 'user-viewer')).rejects.toThrow(
      ListingLocationRequiredError,
    )
  })

  it('treats a logged-in user without a profile as anonymous', async () => {
    prisma.profile.findUnique.mockResolvedValue(null)
    prisma.$queryRaw.mockResolvedValue([])

    await service.list({ ...baseQuery }, 'user-no-profile')

    expect(sqlOfCall(0)).not.toContain('match_scores')
  })

  it('returns total on the first page', async () => {
    prisma.$queryRaw
      .mockResolvedValueOnce([makeRawListRow()])
      .mockResolvedValueOnce([{ total: BigInt(7) }])

    const result = await service.list({ ...baseQuery })

    expect(result.meta.total).toBe(7)
  })

  it('skips the count once paginating, since the header never changes', async () => {
    prisma.$queryRaw
      .mockResolvedValueOnce([{ createdAt: new Date(), rank: null, distance: null }]) // cursor lookup
      .mockResolvedValueOnce([makeRawListRow()])

    const result = await service.list({ ...baseQuery, cursor: 'listing-99' })

    expect(result.meta.total).toBeUndefined()
    expect(prisma.$queryRaw).toHaveBeenCalledTimes(2) // cursor lookup + list, no count
  })

  it('omits matchScore rather than sending 0 when the pair has no score', async () => {
    givenViewerProfile()
    prisma.$queryRaw
      .mockResolvedValueOnce([makeRawListRow({ matchScore: null, matchDistanceKm: null })])
      .mockResolvedValueOnce([{ total: BigInt(1) }])

    const result = await service.list({ ...baseQuery }, 'user-viewer')

    expect(result.data[0]).not.toHaveProperty('matchScore')
  })

  it('surfaces matchScore and distanceKm when the pair is scored', async () => {
    givenViewerProfile()
    prisma.$queryRaw
      .mockResolvedValueOnce([makeRawListRow({ matchScore: 0.82, matchDistanceKm: 14.2 })])
      .mockResolvedValueOnce([{ total: BigInt(1) }])

    const result = await service.list({ ...baseQuery }, 'user-viewer')

    expect(result.data[0]?.matchScore).toBe(0.82)
    expect(result.data[0]?.distanceKm).toBe(14.2)
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
