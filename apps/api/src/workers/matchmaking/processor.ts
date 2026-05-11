import { Worker } from 'bullmq'
import { prisma } from '@agrolink/db'
import type { BadgeTier } from '@agrolink/db'
import { computeMatchScore } from '../../modules/matchmaking/algorithm.js'
import type { CandidateProfile } from '../../modules/matchmaking/algorithm.js'
import { createWhatsAppAdapter } from '../../integrations/whatsapp/index.js'
import { buildRedisConnection, addNotifyMatchJob } from './queue.js'
import type { ComputeMatchesJobData, NotifyMatchJobData, CandidateRow } from './types.js'
import type { MatchmakingJobData } from './types.js'
import type { Job } from 'bullmq'

const MAX_CANDIDATES = 500
const MAX_RADIUS_M = 200_000 // 200 km in metres
const BATCH_SIZE = 50
const TOP_MATCHES = 50
const MIN_SCORE = 0.3
const HIGH_SCORE_THRESHOLD = 0.7

// ─── Business hours check (Brasília UTC-3) ────────────────────────────────────

function isBusinessHours(): boolean {
  const hour = parseInt(
    new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      hour: 'numeric',
      hour12: false,
    }).format(new Date()),
    10,
  )
  return hour >= 8 && hour < 20
}

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

  // 2. Fetch up to MAX_CANDIDATES nearby profiles with at least one active listing
  const candidateRows = await prisma.$queryRaw<CandidateRow[]>`
    SELECT
      p.id,
      p.current_rating                                                             AS "currentRating",
      p.rating_count                                                               AS "ratingCount",
      p.badge,
      loc.latitude,
      loc.longitude,
      ST_Distance(loc.geog, ST_MakePoint(${lng}, ${lat})::geography) / 1000.0     AS "distanceKm"
    FROM profiles p
    JOIN locations loc ON loc.profile_id = p.id
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
    return
  }

  // 3. Load active listings for all candidates (single query)
  const candidateIds = candidateRows.map((r) => r.id)
  const candidateListings = await prisma.listing.findMany({
    where: { profileId: { in: candidateIds }, status: 'ACTIVE' },
    select: { profileId: true, kind: true, category: true, status: true },
  })

  const listingsByProfile = new Map<string, typeof candidateListings>()
  for (const l of candidateListings) {
    const arr = listingsByProfile.get(l.profileId) ?? []
    arr.push(l)
    listingsByProfile.set(l.profileId, arr)
  }

  // 4. Build CandidateProfile objects
  const candidates: CandidateProfile[] = candidateRows.map((row) => ({
    id: row.id,
    currentRating: Number(row.currentRating),
    ratingCount: Number(row.ratingCount),
    badge: row.badge as BadgeTier,
    avgResponseHours: null, // Phase 2: derive from transaction history
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

  // 5. Compute scores in batches of BATCH_SIZE
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

  // 6. Keep top TOP_MATCHES above MIN_SCORE
  const topMatches = allResults
    .filter((r) => r.score >= MIN_SCORE)
    .sort((a, b) => b.score - a.score)
    .slice(0, TOP_MATCHES)

  // 7. Persist — delete stale records then insert fresh ones
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

  // 8. Trigger notifications for high-quality matches
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

  // 2. Business hours gate
  if (!isBusinessHours()) {
    // Delay re-check — throw so BullMQ retries with backoff until business hours
    throw new Error('Fora do horário comercial — será reprocessado')
  }

  // 3. Send notification (daily dedup is handled by the jobId in queue.ts)
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
    {
      connection,
      concurrency: 10,
    },
  )

  return worker
}
