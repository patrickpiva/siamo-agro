import { withRetry } from './retry.js'
import { enqueueDlq } from './dlq.js'
import { renderTemplate } from './templates.js'
import type {
  DlqPayload,
  WhatsAppAdapter,
  WhatsAppTemplateName,
  WhatsAppTemplateParams,
} from './types.js'

// ─── Base ─────────────────────────────────────────────────────────────────────

/**
 * Classe base interna — não importe diretamente fora deste diretório.
 * Encapsula retry, logging estruturado e DLQ para todos os adapters concretos.
 */
export abstract class BaseWhatsAppAdapter implements WhatsAppAdapter {
  /** Identificador do provider para logs e DLQ (ex: 'twilio', 'evolution') */
  protected abstract readonly provider: string

  // ── Interface pública ──────────────────────────────────────────────────────

  async sendOtp(phone: string, code: string): Promise<void> {
    const body = renderTemplate('otp', { code })
    await this.dispatch(phone, body, {
      method: 'sendOtp',
      // Código OTP nunca vai para o DLQ payload — apenas o telefone mascarado
      payload: { template: 'otp' },
    })
  }

  async sendNotification<T extends WhatsAppTemplateName>(
    phone: string,
    template: T,
    params: WhatsAppTemplateParams[T],
  ): Promise<void> {
    const body = renderTemplate(template, params)
    await this.dispatch(phone, body, {
      method: 'sendNotification',
      payload: { template, params: params },
    })
  }

  // ── Implementação obrigatória ──────────────────────────────────────────────

  /**
   * Executa a chamada HTTP ao provider.
   * Deve lançar `NonRetryableError` para erros 4xx (permanentes).
   * Qualquer outro erro será tratado como transitório e será retentado.
   */
  protected abstract doSend(phone: string, body: string): Promise<void>

  // ── Retry + logging + DLQ ─────────────────────────────────────────────────

  private async dispatch(
    phone: string,
    body: string,
    meta: Pick<DlqPayload, 'method' | 'payload'>,
  ): Promise<void> {
    let attemptsMade = 0

    try {
      await withRetry(async () => {
        attemptsMade++
        await this.doSend(phone, body)
      })

      this.log('info', 'send_success', {
        phone: this.maskPhone(phone),
        method: meta.method,
        ...(meta.method === 'sendNotification' && { template: meta.payload['template'] }),
      })
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err)

      this.log('error', 'send_failed', {
        phone: this.maskPhone(phone),
        method: meta.method,
        attemptsMade,
        error,
      })

      await enqueueDlq({
        provider: this.provider,
        phone,
        method: meta.method,
        payload: meta.payload,
        error,
        attemptsMade,
        failedAt: new Date().toISOString(),
      })

      throw err
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  protected log(
    level: 'info' | 'warn' | 'error',
    event: string,
    extra?: Record<string, unknown>,
  ): void {
    const entry = {
      level,
      module: `whatsapp:${this.provider}`,
      event,
      ts: new Date().toISOString(),
      ...extra,
    }
    if (level === 'error') {
      console.error(JSON.stringify(entry))
    } else {
      console.info(JSON.stringify(entry))
    }
  }

  protected maskPhone(phone: string): string {
    if (phone.length < 8) return '***'
    return `${phone.slice(0, 5)}****${phone.slice(-4)}`
  }
}
