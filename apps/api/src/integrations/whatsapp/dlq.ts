import { Queue } from 'bullmq'
import type { DlqPayload } from './types.js'

// ─── Queue singleton ──────────────────────────────────────────────────────────

let _queue: Queue<DlqPayload> | null = null

function buildQueue(): Queue<DlqPayload> {
  const redisUrl = process.env['REDIS_URL']

  if (!redisUrl) {
    throw new Error('REDIS_URL não definida — DLQ indisponível')
  }

  const url = new URL(redisUrl)

  return new Queue<DlqPayload>('whatsapp:dlq', {
    connection: {
      host: url.hostname,
      port: Number(url.port) || 6379,
      ...(url.password ? { password: decodeURIComponent(url.password) } : {}),
      ...(url.protocol === 'rediss:' ? { tls: {} } : {}),
    },
    defaultJobOptions: {
      attempts: 1, // DLQ não re-processa automaticamente
      removeOnComplete: 100, // guarda as últimas 100 para auditoria
      removeOnFail: false, // preserva erros indefinidamente para replay manual
    },
  })
}

function getDlq(): Queue<DlqPayload> | null {
  if (!process.env['REDIS_URL']) return null
  _queue ??= buildQueue()
  return _queue
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Enfileira uma mensagem que falhou após todos os retries na fila DLQ.
 *
 * Se REDIS_URL não estiver definida, loga o payload no stderr em vez de enfileirar.
 * Nunca lança — a DLQ é best-effort para não mascarar o erro original.
 */
export async function enqueueDlq(payload: DlqPayload): Promise<void> {
  try {
    const queue = getDlq()

    if (queue) {
      await queue.add('failed-send', payload, { jobId: `${payload.provider}:${Date.now()}` })
      console.warn(
        JSON.stringify({
          level: 'warn',
          module: 'whatsapp:dlq',
          event: 'enqueued',
          provider: payload.provider,
          method: payload.method,
          phone: payload.phone.slice(0, 5) + '****' + payload.phone.slice(-4),
          attemptsMade: payload.attemptsMade,
        }),
      )
    } else {
      // Sem Redis: loga em stderr para não perder rastro
      console.error(
        JSON.stringify({
          level: 'error',
          module: 'whatsapp:dlq',
          event: 'no_redis_fallback',
          ...payload,
          phone: payload.phone.slice(0, 5) + '****' + payload.phone.slice(-4),
        }),
      )
    }
  } catch (err) {
    // DLQ deve ser best-effort — nunca esconde o erro original
    console.error(
      JSON.stringify({
        level: 'error',
        module: 'whatsapp:dlq',
        event: 'enqueue_failed',
        error: err instanceof Error ? err.message : String(err),
      }),
    )
  }
}
