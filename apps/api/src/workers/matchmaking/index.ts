import type { Worker, Job } from 'bullmq'
import { createMatchmakingWorker } from './processor.js'
import type { MatchmakingJobData } from './types.js'

let _worker: Worker | null = null

export function startMatchmakingWorker(): Worker {
  _worker = createMatchmakingWorker()

  _worker.on('completed', (job: Job<MatchmakingJobData>) => {
    console.info(
      JSON.stringify({
        level: 'info',
        module: 'matchmaking-worker',
        event: 'job_completed',
        jobId: job.id,
        type: job.data.type,
      }),
    )
  })

  _worker.on('failed', (job: Job<MatchmakingJobData> | undefined, err: Error) => {
    console.error(
      JSON.stringify({
        level: 'error',
        module: 'matchmaking-worker',
        event: 'job_failed',
        jobId: job?.id,
        type: job?.data?.type,
        attempt: job?.attemptsMade,
        error: err.message,
      }),
    )
  })

  _worker.on('error', (err) => {
    console.error(
      JSON.stringify({
        level: 'error',
        module: 'matchmaking-worker',
        event: 'worker_error',
        error: err.message,
      }),
    )
  })

  console.info('[matchmaking-worker] started, concurrency=10')
  return _worker
}

export async function stopMatchmakingWorker(): Promise<void> {
  if (_worker) {
    await _worker.close()
    _worker = null
  }
}
