import type { PrismaClient } from '@agraia/db'
import { scoreCompatibilityPair } from './algorithm.js'
import { addComputeMatchesJob } from '../../workers/matchmaking/queue.js'
import { MatchesListingNotFoundError, MatchesForbiddenError } from './errors.js'
import type { ListMatchesQuery, MatchResult } from './schema.js'

const MATCH_TTL_MS = 24 * 60 * 60 * 1000 // 24h

export class MatchmakingService {
  constructor(private readonly prisma: PrismaClient) {}

  async getMatchesForListing(
    listingId: string,
    userId: string,
    query: ListMatchesQuery,
  ): Promise<
    | { processing: true }
    | { data: MatchResult[]; meta: { nextCursor: string | null; limit: number } }
  > {
    // 1. Verify listing exists and belongs to the requesting user
    const [listing, profile] = await Promise.all([
      this.prisma.listing.findUnique({ where: { id: listingId } }),
      this.prisma.profile.findUnique({ where: { userId } }),
    ])

    if (!listing) throw new MatchesListingNotFoundError(listingId)
    if (!profile || listing.profileId !== profile.id) throw new MatchesForbiddenError()

    // 2. Check freshness — trigger async job if stale
    const freshestMatch = await this.prisma.matchScore.findFirst({
      where: { listingId },
      orderBy: { computedAt: 'desc' },
    })

    const isStale = !freshestMatch || Date.now() - freshestMatch.computedAt.getTime() > MATCH_TTL_MS

    if (isStale) {
      addComputeMatchesJob(listingId).catch((err: unknown) =>
        console.error('[matchmaking] erro ao despachar job:', err),
      )
      return { processing: true }
    }

    // 3. Cursor pagination — fetch cursor record once, use in query
    const { cursor, limit } = query

    let cursorScore: number | undefined
    if (cursor) {
      const cursorRow = await this.prisma.matchScore.findUnique({
        where: { id: cursor },
        select: { score: true },
      })
      cursorScore = cursorRow?.score
    }

    const matches = await this.prisma.matchScore.findMany({
      where: {
        listingId,
        ...(cursor !== undefined && cursorScore !== undefined
          ? {
              OR: [{ score: { lt: cursorScore } }, { score: cursorScore, id: { lt: cursor } }],
            }
          : {}),
      },
      take: limit + 1,
      orderBy: [{ score: 'desc' }, { id: 'desc' }],
      include: {
        candidateProfile: {
          include: {
            location: true,
            listings: {
              where: { status: 'ACTIVE' },
              select: { kind: true, category: true, title: true },
            },
          },
        },
      },
    })

    const hasMore = matches.length > limit
    const page = hasMore ? matches.slice(0, limit) : matches

    const data: MatchResult[] = page.map((ms) => {
      let bestListing: MatchResult['bestListing'] = null
      let bestScore = -1
      for (const cl of ms.candidateProfile.listings) {
        const s = scoreCompatibilityPair(listing.kind, listing.category, cl.kind, cl.category)
        if (s > bestScore) {
          bestScore = s
          bestListing = { kind: cl.kind, category: cl.category, title: cl.title }
        }
      }

      return {
        id: ms.id,
        score: ms.score,
        distanceKm: ms.distanceKm ?? null,
        computedAt: ms.computedAt.toISOString(),
        candidate: {
          id: ms.candidateProfile.id,
          name: ms.candidateProfile.name,
          photo: ms.candidateProfile.photo ?? null,
          rating: ms.candidateProfile.currentRating,
          badge: ms.candidateProfile.badge,
          city: ms.candidateProfile.location?.city ?? null,
          state: ms.candidateProfile.location?.state ?? null,
        },
        bestListing,
      }
    })

    return {
      data,
      meta: { nextCursor: hasMore ? (page.at(-1)?.id ?? null) : null, limit },
    }
  }
}
