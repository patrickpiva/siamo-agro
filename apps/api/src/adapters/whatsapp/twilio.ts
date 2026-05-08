import type { WhatsAppAdapter } from './types.js'

/**
 * Envia OTP via Twilio SMS ou WhatsApp Business API.
 * Requer as variáveis de ambiente:
 *   TWILIO_ACCOUNT_SID  → SID da conta Twilio
 *   TWILIO_AUTH_TOKEN   → token de autenticação
 *   TWILIO_FROM_NUMBER  → número de origem (ex: whatsapp:+14155238886)
 */
export class TwilioAdapter implements WhatsAppAdapter {
  private readonly accountSid: string
  private readonly authToken: string
  private readonly fromNumber: string

  constructor() {
    this.accountSid = process.env['TWILIO_ACCOUNT_SID'] ?? ''
    this.authToken = process.env['TWILIO_AUTH_TOKEN'] ?? ''
    this.fromNumber = process.env['TWILIO_FROM_NUMBER'] ?? ''
  }

  async sendOtp(phone: string, code: string): Promise<void> {
    const message = `Seu código de acesso AgroLink é: ${code}. Válido por 5 minutos. Não compartilhe.`

    if (!this.accountSid || !this.authToken || !this.fromNumber) {
      console.info(`[Twilio] OTP enviado para ${phone} (stub — configure as env vars)`)
      return
    }

    const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`
    const body = new URLSearchParams({
      From: this.fromNumber,
      To: `whatsapp:${phone}`,
      Body: message,
    })

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64')}`,
      },
      body: body.toString(),
    })

    if (!response.ok) {
      const data = (await response.json()) as { message?: string }
      throw new Error(`Twilio error ${response.status}: ${data.message ?? 'unknown'}`)
    }
  }
}
