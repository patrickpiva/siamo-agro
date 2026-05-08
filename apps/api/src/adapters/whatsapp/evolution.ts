import type { WhatsAppAdapter } from './types.js'

/**
 * Envia OTP via Evolution API (WhatsApp Business self-hosted).
 * Requer as variáveis de ambiente:
 *   EVOLUTION_API_URL   → URL base da instância (ex: https://api.meudominio.com)
 *   EVOLUTION_API_KEY   → chave de autenticação
 *   EVOLUTION_INSTANCE  → nome da instância configurada
 */
export class EvolutionApiAdapter implements WhatsAppAdapter {
  private readonly baseUrl: string
  private readonly apiKey: string
  private readonly instance: string

  constructor() {
    this.baseUrl = process.env['EVOLUTION_API_URL'] ?? ''
    this.apiKey = process.env['EVOLUTION_API_KEY'] ?? ''
    this.instance = process.env['EVOLUTION_INSTANCE'] ?? ''
  }

  async sendOtp(phone: string, code: string): Promise<void> {
    const message = `Seu código de acesso AgroLink é: *${code}*\n\nVálido por 5 minutos. Não compartilhe com ninguém.`

    if (!this.baseUrl || !this.apiKey || !this.instance) {
      // Stub para desenvolvimento — nunca logar o code em produção
      console.info(`[EvolutionAPI] OTP enviado para ${phone} (stub — configure as env vars)`)
      return
    }

    const response = await fetch(`${this.baseUrl}/message/sendText/${this.instance}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: this.apiKey,
      },
      body: JSON.stringify({
        number: phone.replace('+', ''),
        text: message,
      }),
    })

    if (!response.ok) {
      const body = await response.text()
      throw new Error(`EvolutionAPI error ${response.status}: ${body}`)
    }
  }
}
