import type { WhatsAppAdapter } from './types.js'

/**
 * Envia OTP via Twilio WhatsApp Business API.
 *
 * Variáveis de ambiente obrigatórias:
 *   TWILIO_ACCOUNT_SID       → SID da conta Twilio (AC...)
 *   TWILIO_AUTH_TOKEN        → token de autenticação
 *   TWILIO_WHATSAPP_FROM     → número de origem com prefixo (whatsapp:+14155238886)
 *
 * Variável obrigatória para produção (recomendada no sandbox):
 *   TWILIO_CONTENT_SID       → SID do Content Template aprovado (HX...)
 *                               Resolve o erro "Outside messaging window".
 *                               Crie em: console.twilio.com → Messaging → Content Template Builder
 *                               Tipo: Authentication | Variável {{1}} = código OTP
 *
 * Sem TWILIO_CONTENT_SID:
 *   Envia mensagem de texto livre — só funciona dentro da janela de 24 h (sandbox manual).
 */
export class TwilioAdapter implements WhatsAppAdapter {
  private readonly accountSid: string
  private readonly authToken: string
  private readonly fromNumber: string
  private readonly contentSid: string

  constructor() {
    this.accountSid = process.env['TWILIO_ACCOUNT_SID'] ?? ''
    this.authToken = process.env['TWILIO_AUTH_TOKEN'] ?? ''
    // Aceita TWILIO_WHATSAPP_FROM (padrão) ou TWILIO_FROM_NUMBER (legado)
    this.fromNumber = process.env['TWILIO_WHATSAPP_FROM'] ?? process.env['TWILIO_FROM_NUMBER'] ?? ''
    this.contentSid = process.env['TWILIO_CONTENT_SID'] ?? ''
  }

  async sendOtp(phone: string, code: string): Promise<void> {
    if (!this.accountSid || !this.authToken || !this.fromNumber) {
      console.info(`[Twilio] OTP enviado para ${phone} (stub — configure as env vars)`)
      return
    }

    const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`
    const auth = Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64')

    // ─── Modo Template (recomendado — sem restrição de janela de 24 h) ──────────
    // Usar quando TWILIO_CONTENT_SID estiver configurado.
    // O template deve ter uma variável {{1}} que recebe o código OTP.
    if (this.contentSid) {
      const body = new URLSearchParams({
        From: this.fromNumber,
        To: `whatsapp:${phone}`,
        ContentSid: this.contentSid,
        ContentVariables: JSON.stringify({ '1': code }),
      })

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${auth}`,
        },
        body: body.toString(),
      })

      if (!response.ok) {
        const data = (await response.json()) as { message?: string; code?: number }
        throw new Error(
          `Twilio error ${response.status} (code ${data.code ?? '?'}): ${data.message ?? 'unknown'}`,
        )
      }

      return
    }

    // ─── Modo Texto Livre (fallback — requer janela de 24 h aberta) ─────────────
    // Funciona apenas se o usuário tiver enviado uma mensagem para o sandbox
    // nos últimos 5 minutos (WhatsApp conversa iniciada pelo usuário).
    // Configure TWILIO_CONTENT_SID para evitar o erro "Outside messaging window".
    console.warn(
      '[Twilio] TWILIO_CONTENT_SID não configurado — usando texto livre. Sujeito a erro "Outside messaging window".',
    )

    const message = `Seu código de acesso AgraIA é: ${code}. Válido por 5 minutos. Não compartilhe.`

    const body = new URLSearchParams({
      From: this.fromNumber,
      To: `whatsapp:${phone}`,
      Body: message,
    })

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${auth}`,
      },
      body: body.toString(),
    })

    if (!response.ok) {
      const data = (await response.json()) as { message?: string; code?: number }
      throw new Error(
        `Twilio error ${response.status} (code ${data.code ?? '?'}): ${data.message ?? 'unknown'}`,
      )
    }
  }
}
