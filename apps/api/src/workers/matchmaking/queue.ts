import { Queue } from 'bullmq'
import type { MatchmakingJobData } from './types.js'

// ─── Connection ───────────────────────────────────────────────────────────────

export function buildRedisConnection() {
  const url = process.env['REDIS_URL']
  if (!url) throw new Error('REDIS_URL não definida — matchmaking queue indisponível')
  const parsed = new URL(url)
  return {
    host: parsed.hostname,
    port: Number(parsed.port) || 6379,
    ...(parsed.password ? { password: decodeURIComponent(parsed.password) } : {}),
    ...(parsed.protocol === 'rediss:' ? { tls: {} } : {}),
  }
}

// ─── Queue singleton ──────────────────────────────────────────────────────────

let _queue: Queue<MatchmakingJobData> | null = null

export function getMatchmakingQueue(): Queue<MatchmakingJobData> | null {
  if (!process.env['REDIS_URL']) return null
  _queue ??= new Queue<MatchmakingJobData>('matchmaking', {
    connection: buildRedisConnection(),
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: { age: 3600 }, // keep 1h for metrics
      removeOnFail: { age: 86400 * 7 }, // keep failed jobs 7d for replay
    },
  })
  return _queue
}

// ─── Business hours helpers ───────────────────────────────────────────────────

/**
 * Returns the number of milliseconds until the next 08:00 Brasília time.
 * Returns 0 if we are currently within business hours (08:00–20:00 BRT).
 *
 * Used to delay notification jobs so they fire at a reasonable hour rather
 * than waking up users or exhausting retry budgets overnight.
 */
export function msUntilNextBusinessHours(): number {
  const brtHour = parseInt(
    new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      hour: 'numeric',
      hour12: false,
    }).format(new Date()),
    10,
  )

  if (brtHour >= 8 && brtHour < 20) return 0

  // Hours remaining until 08:00 next business window
  const hoursUntil = brtHour < 8 ? 8 - brtHour : 32 - brtHour // (24 - h) + 8
  return (hoursUntil * 60 + 10) * 60 * 1000 // +10 min buffer
}

// ─── Job helpers ──────────────────────────────────────────────────────────────

/**
 * `dedupe: true` usa jobId fixo por listing: enquanto um job igual estiver na
 * fila/ativo (ou completado dentro da janela de removeOnComplete, 1h), novos
 * adds são ignorados pelo BullMQ. Usado nos disparos vindos do feed — sem isso,
 * cada visita ao feed vazio reenfileirava dezenas de computes idênticos.
 * Criação/edição de anúncio NÃO deduplica: edição precisa recomputar sempre.
 */
export async function addComputeMatchesJob(
  listingId: string,
  opts?: { dedupe?: boolean },
): Promise<void> {
  const queue = getMatchmakingQueue()
  if (!queue) {
    console.warn('[matchmaking-queue] Redis não configurado, job ignorado', { listingId })
    return
  }
  await queue.add(
    'compute-matches-for-listing',
    {
      type: 'compute-matches-for-listing',
      listingId,
    },
    opts?.dedupe ? { jobId: `compute:${listingId}` } : {},
  )
}

/**
 * Adds a notify-match job with jobId deduplication to enforce the 1/day limit.
 * BullMQ will silently skip the add if a job with this ID already exists
 * (waiting, active, delayed, or completed within the removeOnComplete window).
 */
export async function addNotifyMatchJob(
  matchScoreId: string,
  listingOwnerUserId: string,
): Promise<void> {
  const queue = getMatchmakingQueue()
  if (!queue) return

  const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
  const delay = msUntilNextBusinessHours()

  await queue.add(
    'notify-match',
    { type: 'notify-match', matchScoreId, listingOwnerUserId },
    {
      jobId: `notify-match:${listingOwnerUserId}:${today}`,
      // Schedule for next business window if currently outside 08:00–20:00 BRT.
      // This avoids exhausting retries with exponential backoff overnight.
      ...(delay > 0 ? { delay } : {}),
      // Keep completed notify jobs for 25h so the jobId dedup window covers the full day.
      removeOnComplete: { age: 90_000 },
      removeOnFail: false,
    },
  )
}
