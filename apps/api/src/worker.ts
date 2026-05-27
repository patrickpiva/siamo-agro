/**
 * Worker process — BullMQ only, no HTTP server.
 *
 * Deployed as a separate Railway service ("worker") so it can scale and restart
 * independently from the API.  All queues are processed here; the API only
 * enqueues jobs.
 *
 * Start command (Railway / production):
 *   node apps/api/dist/worker.js
 *
 * Start command (local dev, second terminal):
 *   pnpm dev:worker
 */

import { startMatchmakingWorker, stopMatchmakingWorker } from './workers/matchmaking/index.js'

// ─── Guard ────────────────────────────────────────────────────────────────────

if (!process.env['REDIS_URL']) {
  console.error(
    JSON.stringify({
      level: 'fatal',
      module: 'worker',
      event: 'missing_redis_url',
      message: 'REDIS_URL is required — worker process cannot start without Redis',
    }),
  )
  process.exit(1)
}

// ─── Boot ─────────────────────────────────────────────────────────────────────

startMatchmakingWorker()

console.info(
  JSON.stringify({
    level: 'info',
    module: 'worker',
    event: 'started',
    message: 'Worker process ready — waiting for jobs',
    queues: ['matchmaking'],
  }),
)

// ─── Graceful shutdown ────────────────────────────────────────────────────────

async function shutdown(signal: string): Promise<void> {
  console.info(
    JSON.stringify({
      level: 'info',
      module: 'worker',
      event: 'shutdown',
      signal,
      message: 'Draining workers…',
    }),
  )

  await stopMatchmakingWorker()

  console.info(
    JSON.stringify({
      level: 'info',
      module: 'worker',
      event: 'shutdown_complete',
      message: 'Worker stopped cleanly',
    }),
  )

  process.exit(0)
}

process.on('SIGTERM', () => void shutdown('SIGTERM'))
process.on('SIGINT', () => void shutdown('SIGINT'))

// Surface unhandled promise rejections so they don't die silently
process.on('unhandledRejection', (reason) => {
  console.error(
    JSON.stringify({
      level: 'error',
      module: 'worker',
      event: 'unhandled_rejection',
      error: String(reason),
    }),
  )
})
