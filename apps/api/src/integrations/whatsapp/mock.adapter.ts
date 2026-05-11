import { renderTemplate } from './templates.js'
import type { WhatsAppAdapter, WhatsAppTemplateName, WhatsAppTemplateParams } from './types.js'

// ─── Tipos internos ───────────────────────────────────────────────────────────

interface MockCall {
  method: 'sendOtp' | 'sendNotification'
  phone: string
  template: WhatsAppTemplateName
  params: Record<string, unknown>
  renderedBody: string
  timestamp: Date
}

// ─── MockAdapter ──────────────────────────────────────────────────────────────

/**
 * Adapter usado em ambiente de desenvolvimento e CI.
 * Não faz chamadas HTTP — apenas registra os envios em memória e loga no console.
 *
 * Use `getCalls()` nos testes para verificar os argumentos passados.
 * Use `clearCalls()` no `beforeEach` para isolar testes.
 *
 * Não possui retry nem DLQ — falhas são imediatas e intencionais para facilitar testes.
 */
export class MockAdapter implements WhatsAppAdapter {
  private readonly calls: MockCall[] = []

  async sendOtp(phone: string, code: string): Promise<void> {
    const renderedBody = renderTemplate('otp', { code })
    this.calls.push({
      method: 'sendOtp',
      phone,
      template: 'otp',
      params: { code },
      renderedBody,
      timestamp: new Date(),
    })
    console.info(
      JSON.stringify({
        level: 'info',
        module: 'whatsapp:mock',
        event: 'send_otp',
        phone: this.maskPhone(phone),
      }),
    )
  }

  async sendNotification<T extends WhatsAppTemplateName>(
    phone: string,
    template: T,
    params: WhatsAppTemplateParams[T],
  ): Promise<void> {
    const renderedBody = renderTemplate(template, params)
    this.calls.push({
      method: 'sendNotification',
      phone,
      template,
      params: params,
      renderedBody,
      timestamp: new Date(),
    })
    console.info(
      JSON.stringify({
        level: 'info',
        module: 'whatsapp:mock',
        event: 'send_notification',
        template,
        phone: this.maskPhone(phone),
      }),
    )
  }

  /** Retorna cópia imutável do histórico de envios para asserções em testes */
  getCalls(): readonly MockCall[] {
    return [...this.calls]
  }

  /** Limpa o histórico — chamar no beforeEach para isolar testes */
  clearCalls(): void {
    this.calls.length = 0
  }

  private maskPhone(phone: string): string {
    if (phone.length < 8) return '***'
    return `${phone.slice(0, 5)}****${phone.slice(-4)}`
  }
}
