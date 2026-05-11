// ─── NonRetryableError ────────────────────────────────────────────────────────

/**
 * Erros marcados como NonRetryable não são reenviados (ex: 4xx do provider).
 * Lançar esse erro dentro de `fn` interrompe o ciclo de retry imediatamente.
 */
export class NonRetryableError extends Error {
  readonly isNonRetryable = true as const

  constructor(
    message: string,
    public override readonly cause?: unknown,
  ) {
    super(message)
    this.name = 'NonRetryableError'
  }
}

// ─── withRetry ────────────────────────────────────────────────────────────────

interface RetryOptions {
  maxAttempts?: number
  /** Delay base em ms; dobra a cada tentativa (backoff exponencial) */
  baseDelayMs?: number
  /** Timeout por tentativa em ms */
  timeoutMs?: number
}

/**
 * Executa `fn` com retry exponencial e timeout por tentativa.
 *
 * Backoff: 1ª retry = baseDelayMs, 2ª = baseDelayMs*2, ...
 * NonRetryableError interrompe o ciclo sem retry.
 */
export async function withRetry<T>(fn: () => Promise<T>, opts: RetryOptions = {}): Promise<T> {
  const maxAttempts = opts.maxAttempts ?? 3
  const baseDelayMs = opts.baseDelayMs ?? 500
  const timeoutMs = opts.timeoutMs ?? 10_000

  let lastError: unknown

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await new Promise<T>((resolve, reject) => {
        const timer = setTimeout(
          () => reject(new Error(`WhatsApp request timeout after ${timeoutMs}ms`)),
          timeoutMs,
        )
        fn().then(
          (val) => {
            clearTimeout(timer)
            resolve(val)
          },
          (err: unknown) => {
            clearTimeout(timer)
            reject(err instanceof Error ? err : new Error(String(err)))
          },
        )
      })
      return result
    } catch (err) {
      // 4xx e outros erros permanentes: não tentar novamente
      if (err instanceof NonRetryableError) throw err

      lastError = err

      if (attempt < maxAttempts) {
        const delayMs = baseDelayMs * 2 ** (attempt - 1) // 500, 1000, 2000ms
        await new Promise<void>((resolve) => setTimeout(resolve, delayMs))
      }
    }
  }

  throw lastError
}
