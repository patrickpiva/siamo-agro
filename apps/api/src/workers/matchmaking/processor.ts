import { Worker } from 'bullmq'
import { prisma } from '@agraia/db'
import type { BadgeTier } from '@agraia/db'
import { computeMatchScore } from '../../modules/matchmaking/algorithm.js'
import type { CandidateProfile } from '../../modules/matchmaking/algorithm.js'
import { createWhatsAppAdapter } from '../../integrations/whatsapp/index.js'
import { buildRedisConnection, addNotifyMatchJob } from './queue.js'
import type { ComputeMatchesJobData, NotifyMatchJobData, CandidateRow } from './types.js'
import type { MatchmakingJobData } from './types.js'
import type { Job } from 'bullmq'

const MAX_CANDIDATES = 500
const MAX_RADIUS_M = 500_000 // 500 km in metres
const BATCH_SIZE = 50
const TOP_MATCHES = 50
const MIN_SCORE = 0.2 // lowered from 0.30 — with live reputation active more matches survive
const HIGH_SCORE_THRESHOLD = 0.7

// ─── compute-matches-for-listing ──────────────────────────────────────────────

export async function processComputeMatchesJob(job: Job<ComputeMatchesJobData>): Promise<void> {
  const { listingId } = job.data
  const startedAt = Date.now()

  // 1. Load source listing with profile + location + user id
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    include: {
      profile: {
        include: {
          location: true,
          user: { select: { id: true } },
        },
      },
    },
  })

  if (!listing || listing.status !== 'ACTIVE') {
    console.warn('[matchmaking] listing não encontrado ou inativo', { listingId })
    return
  }

  if (!listing.profile.location) {
    console.warn('[matchmaking] listing sem localização, skipping', { listingId })
    return
  }

  const { latitude: lat, longitude: lng } = listing.profile.location
  const sourceProfileId = listing.profile.id
  const listingOwnerUserId = listing.profile.user.id

  // 2. Fetch up to MAX_CANDIDATES nearby profiles.
  //    Live rating counts are computed via LEFT JOIN on the ratings table so we
  //    never read stale denormalized values from the profiles columns.
  const candidateRows = await prisma.$queryRaw<CandidateRow[]>`
    SELECT
      p.id,
      p.user_id                                                                    AS "userId",
      p.badge,
      loc.latitude,
      loc.longitude,
      ST_Distance(loc.geog, ST_MakePoint(${lng}, ${lat})::geography) / 1000.0     AS "distanceKm",
      COALESCE(r_agg.avg_score, 0)::float                                          AS "currentRating",
      COALESCE(r_agg.cnt, 0)::int                                                  AS "ratingCount"
    FROM profiles p
    JOIN locations loc ON loc.profile_id = p.id
    LEFT JOIN (
      SELECT ratee_id, AVG(score)::float AS avg_score, COUNT(*)::int AS cnt
      FROM ratings
      GROUP BY ratee_id
    ) r_agg ON r_agg.ratee_id = p.user_id
    WHERE
      p.id != ${sourceProfileId}
      AND loc.geog IS NOT NULL
      AND ST_DWithin(loc.geog, ST_MakePoint(${lng}, ${lat})::geography, ${MAX_RADIUS_M})
      AND EXISTS (
        SELECT 1 FROM listings l
        WHERE l.profile_id = p.id AND l.status = 'ACTIVE'
      )
    ORDER BY ST_Distance(loc.geog, ST_MakePoint(${lng}, ${lat})::geography)
    LIMIT ${MAX_CANDIDATES}
  `

  if (candidateRows.length === 0) {
    console.info('[matchmaking] sem candidatos no raio', { listingId, lat, lng })
    await prisma.listing.update({
      where: { id: listingId },
      data: { matchesComputedAt: new Date() },
    })
    return
  }

  // 3. Load active listings for all candidates (single query)
  const candidateProfileIds = candidateRows.map((r) => r.id)
  const candidateUserIds = candidateRows.map((r) => r.userId)

  const candidateListings = await prisma.listing.findMany({
    where: { profileId: { in: candidateProfileIds }, status: 'ACTIVE' },
    select: { profileId: true, kind: true, category: true, status: true },
  })

  const listingsByProfile = new Map<string, typeof candidateListings>()
  for (const l of candidateListings) {
    const arr = listingsByProfile.get(l.profileId) ?? []
    arr.push(l)
    listingsByProfile.set(l.profileId, arr)
  }

  // 4. Compute average first-response time per seller from transaction history.
  //    Measured as: time from PROPOSED to first message in the transaction thread.
  //    Only considers transactions that progressed past the proposal stage.
  type ResponseRow = { userId: string; avgResponseHours: number }
  const responseRows =
    candidateUserIds.length > 0
      ? await prisma.$queryRaw<ResponseRow[]>`
          SELECT
            t.seller_id                                                             AS "userId",
            AVG(
              EXTRACT(EPOCH FROM (first_msg.min_created_at - t.created_at)) / 3600.0
            )::float                                                                AS "avgResponseHours"
          FROM transactions t
          JOIN (
            SELECT transaction_id, MIN(created_at) AS min_created_at
            FROM transaction_messages
            GROUP BY transaction_id
          ) first_msg ON first_msg.transaction_id = t.id
          WHERE t.seller_id = ANY(${candidateUserIds})
            AND t.status IN ('ACCEPTED', 'IN_PROGRESS', 'COMPLETED')
          GROUP BY t.seller_id
        `
      : []

  const responseMap = new Map<string, number>(
    responseRows.map((r) => [r.userId, Number(r.avgResponseHours)]),
  )

  // 5. Build CandidateProfile objects with live reputation and response data
  const candidates: CandidateProfile[] = candidateRows.map((row) => ({
    id: row.id,
    currentRating: Number(row.currentRating),
    ratingCount: Number(row.ratingCount),
    badge: row.badge as BadgeTier,
    avgResponseHours: responseMap.get(row.userId) ?? null,
    location: { latitude: Number(row.latitude), longitude: Number(row.longitude) },
    listings: (listingsByProfile.get(row.id) ?? []).map((l) => ({
      kind: l.kind,
      category: l.category,
      status: l.status,
    })),
  }))

  const matchListing = {
    id: listing.id,
    kind: listing.kind,
    category: listing.category,
    createdAt: listing.createdAt,
    profile: {
      id: listing.profile.id,
      currentRating: listing.profile.currentRating,
      ratingCount: listing.profile.ratingCount,
      badge: listing.profile.badge,
      location: { latitude: lat, longitude: lng },
    },
  }

  // 6. Compute scores in batches of BATCH_SIZE
  const allResults: { candidate: CandidateProfile; score: number; distanceKm: number }[] = []

  for (let i = 0; i < candidates.length; i += BATCH_SIZE) {
    const batch = candidates.slice(i, i + BATCH_SIZE)
    const batchResults = await Promise.all(
      batch.map(async (candidate) => {
        const result = await computeMatchScore(matchListing, candidate)
        return { candidate, score: result.score, distanceKm: result.distanceKm }
      }),
    )
    allResults.push(...batchResults)
  }

  // 7. Keep top TOP_MATCHES above MIN_SCORE
  const topMatches = allResults
    .filter((r) => r.score >= MIN_SCORE)
    .sort((a, b) => b.score - a.score)
    .slice(0, TOP_MATCHES)

  // 8. Persist — delete stale records then insert fresh ones (single transaction)
  const now = new Date()
  const created = await prisma.$transaction(async (tx) => {
    await tx.matchScore.deleteMany({ where: { listingId } })
    return Promise.all(
      topMatches.map((r) =>
        tx.matchScore.create({
          data: {
            listingId,
            candidateProfileId: r.candidate.id,
            score: r.score,
            distanceKm: r.distanceKm,
            computedAt: now,
          },
        }),
      ),
    )
  })

  await prisma.listing.update({
    where: { id: listingId },
    data: { matchesComputedAt: now },
  })

  // 9. Trigger notifications for high-quality matches.
  //    addNotifyMatchJob already schedules for next business hours if needed.
  const highQuality = created.filter((ms) => ms.score >= HIGH_SCORE_THRESHOLD)
  await Promise.all(highQuality.map((ms) => addNotifyMatchJob(ms.id, listingOwnerUserId)))

  console.info(
    JSON.stringify({
      level: 'info',
      module: 'matchmaking-worker',
      event: 'compute_done',
      listingId,
      candidates: candidates.length,
      persisted: created.length,
      highQuality: highQuality.length,
      durationMs: Date.now() - startedAt,
    }),
  )
}

// ─── notify-match ─────────────────────────────────────────────────────────────

export async function processNotifyMatchJob(job: Job<NotifyMatchJobData>): Promise<void> {
  const { matchScoreId } = job.data

  // 1. Load match with listing owner phone
  const match = await prisma.matchScore.findUnique({
    where: { id: matchScoreId },
    include: {
      listing: {
        include: {
          profile: {
            include: { user: { select: { phone: true } } },
          },
        },
      },
    },
  })

  if (!match) {
    console.warn('[matchmaking] matchScore não encontrado, skipping notify', { matchScoreId })
    return
  }

  const phone = match.listing.profile.user.phone
  if (!phone) {
    console.warn('[matchmaking] usuário sem telefone, skipping notify', { matchScoreId })
    return
  }

  // Note: business-hours scheduling is now handled at enqueue time (queue.ts),
  // so this processor fires only during the correct window. No retry loop needed.

  const adapter = createWhatsAppAdapter()
  await adapter.sendNotification(phone, 'new_match', {
    listing: match.listing.title,
    url: `${process.env['NEXT_PUBLIC_APP_URL'] ?? 'http://localhost:3000'}/anuncio/${match.listingId}`,
  })

  console.info(
    JSON.stringify({
      level: 'info',
      module: 'matchmaking-worker',
      event: 'notify_sent',
      matchScoreId,
      score: match.score,
    }),
  )
}

// ─── Worker factory ───────────────────────────────────────────────────────────

export function createMatchmakingWorker() {
  const connection = buildRedisConnection()

  const worker = new Worker<MatchmakingJobData>(
    'matchmaking',
    async (job) => {
      if (job.data.type === 'compute-matches-for-listing') {
        await processComputeMatchesJob(job as Job<ComputeMatchesJobData>)
      } else if (job.data.type === 'notify-match') {
        await processNotifyMatchJob(job as Job<NotifyMatchJobData>)
      }
    },
    { connection, concurrency: 10 },
  )

  return worker
}
