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
 * Modo sandbox (Twilio Sandbox, sem aprovação Meta):
 *   Deixar TWILIO_CONTENT_SID_OTP vazio — usa Body livre, funciona apenas
 *   para números que fizeram opt-in no sandbox.
 *
 * Modo produção (WhatsApp Business aprovado):
 *   TWILIO_CONTENT_SID_OTP — Content SID do template agraia_otp (HXxxx...)
 *   Sem este SID a mensagem será rejeitada pela API do WhatsApp fora do sandbox.
 *
 * Sem nenhuma das variáveis, opera em modo stub (loga no console, não envia).
 */
export class TwilioAdapter extends BaseWhatsAppAdapter {
  protected readonly provider = 'twilio'

  private readonly accountSid: string
  private readonly authToken: string
  private readonly fromNumber: string
  private readonly otpContentSid: string
  private readonly isStub: boolean

  constructor() {
    super()
    this.accountSid = process.env['TWILIO_ACCOUNT_SID'] ?? ''
    this.authToken = process.env['TWILIO_AUTH_TOKEN'] ?? ''
    this.fromNumber = process.env['TWILIO_WHATSAPP_FROM'] ?? ''
    this.otpContentSid = process.env['TWILIO_CONTENT_SID_OTP'] ?? ''
    this.isStub = !this.accountSid || !this.authToken || !this.fromNumber
  }

  /**
   * OTP usa Content Template aprovado pela Meta quando TWILIO_CONTENT_SID_OTP
   * está definido. Caso contrário usa Body livre (válido apenas no sandbox).
   */
  protected override async sendOtpDirect(phone: string, code: string): Promise<void> {
    if (this.isStub) {
      this.log('warn', 'stub_send', {
        phone: this.maskPhone(phone),
        hint: 'Configure TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN e TWILIO_WHATSAPP_FROM',
      })
      return
    }

    const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`
    const auth = Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64')

    let formBody: URLSearchParams

    if (this.otpContentSid) {
      // Produção: template aprovado pela Meta (categoria Authentication)
      // ContentVariables mapeia {{1}} → código OTP
      formBody = new URLSearchParams({
        From: this.fromNumber,
        To: `whatsapp:${phone}`,
        ContentSid: this.otpContentSid,
        ContentVariables: JSON.stringify({ '1': code }),
      })
    } else {
      // Sandbox: mensagem livre (usuário precisa ter feito opt-in no sandbox)
      formBody = new URLSearchParams({
        From: this.fromNumber,
        To: `whatsapp:${phone}`,
        Body: `Seu código AgraIA: ${code}. Válido por 5 minutos. Não compartilhe com ninguém.`,
      })
    }

    await this.post(url, formBody, auth)
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
    const auth = Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64')

    // Notificações usam Body livre dentro da janela de sessão (24h após o usuário
    // ter interagido). Para notificações business-initiated fora da janela, criar
    // Content Templates e trocar Body por ContentSid + ContentVariables, assim
    // como feito para OTP acima.
    const formBody = new URLSearchParams({
      From: this.fromNumber,
      To: `whatsapp:${phone}`,
      Body: body,
    })

    await this.post(url, formBody, auth)
  }

  private async post(url: string, formBody: URLSearchParams, auth: string): Promise<void> {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${auth}`,
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
