import { BaseWhatsAppAdapter } from './_base.adapter.js'
import { NonRetryableError } from './retry.js'

// ─── TwilioAdapter ────────────────────────────────────────────────────────────

/**
 * Envia mensagens via Twilio WhatsApp Business API.
 *
 * Variáveis de ambiente obrigatórias em produção:
 *   TWILIO_ACCOUNT_SID    — SID da conta (começa com AC)
 *   TWILIO_AUTH_TOKEN     — token de autenticação
 *   TWILIO_WHATSAPP_FROM  — número de origem (ex: whatsapp:+14155238886)
 *
 * Sem as variáveis, opera em modo stub (loga no console, não envia).
 */
export class TwilioAdapter extends BaseWhatsAppAdapter {
  protected readonly provider = 'twilio'

  private readonly accountSid: string
  private readonly authToken: string
  private readonly fromNumber: string
  private readonly isStub: boolean

  constructor() {
    super()
    this.accountSid = process.env['TWILIO_ACCOUNT_SID'] ?? ''
    this.authToken = process.env['TWILIO_AUTH_TOKEN'] ?? ''
    this.fromNumber = process.env['TWILIO_WHATSAPP_FROM'] ?? ''
    this.isStub = !this.accountSid || !this.authToken || !this.fromNumber
  }

  protected async doSend(phone: string, body: string): Promise<void> {
    if (this.isStub) {
      this.log('warn', 'stub_send', {
        phone: this.maskPhone(phone),
        hint: 'Configure TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN e TWILIO_WHATSAPP_FROM',
      })
      return
    }

    const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`

    const formBody = new URLSearchParams({
      From: this.fromNumber,
      To: `whatsapp:${phone}`,
      Body: body,
    })

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64')}`,
      },
      body: formBody.toString(),
    })

    if (!response.ok) {
      const data = (await response.json()) as { message?: string; code?: number }
      const message = `Twilio ${response.status}: ${data.message ?? 'unknown error'}`

      // 4xx são erros permanentes (número inválido, conta suspensa, etc.) — não retentar
      if (response.status >= 400 && response.status < 500) {
        throw new NonRetryableError(message)
      }

      // 5xx são transitórios — withRetry vai retentar
      throw new Error(message)
    }
  }
}
