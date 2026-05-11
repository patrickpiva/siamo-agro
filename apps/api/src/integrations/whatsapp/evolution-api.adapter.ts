import { BaseWhatsAppAdapter } from './_base.adapter.js'
import { NonRetryableError } from './retry.js'

// ─── EvolutionApiAdapter ──────────────────────────────────────────────────────

/**
 * Envia mensagens via Evolution API (WhatsApp Business self-hosted).
 * https://doc.evolution-api.com
 *
 * Variáveis de ambiente obrigatórias em produção:
 *   EVOLUTION_API_URL    — URL base da instância (ex: https://api.meudominio.com)
 *   EVOLUTION_API_KEY    — chave de autenticação global
 *   EVOLUTION_INSTANCE   — nome da instância configurada no painel
 *
 * Sem as variáveis, opera em modo stub (loga no console, não envia).
 */
export class EvolutionApiAdapter extends BaseWhatsAppAdapter {
  protected readonly provider = 'evolution'

  private readonly baseUrl: string
  private readonly apiKey: string
  private readonly instance: string
  private readonly isStub: boolean

  constructor() {
    super()
    this.baseUrl = process.env['EVOLUTION_API_URL'] ?? ''
    this.apiKey = process.env['EVOLUTION_API_KEY'] ?? ''
    this.instance = process.env['EVOLUTION_INSTANCE'] ?? ''
    this.isStub = !this.baseUrl || !this.apiKey || !this.instance
  }

  protected async doSend(phone: string, body: string): Promise<void> {
    if (this.isStub) {
      this.log('warn', 'stub_send', {
        phone: this.maskPhone(phone),
        hint: 'Configure EVOLUTION_API_URL, EVOLUTION_API_KEY e EVOLUTION_INSTANCE',
      })
      return
    }

    // Evolution API espera número sem '+' e sem formatação
    const normalizedPhone = phone.replace(/^\+/, '')

    const response = await fetch(`${this.baseUrl}/message/sendText/${this.instance}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: this.apiKey,
      },
      body: JSON.stringify({
        number: normalizedPhone,
        text: body,
      }),
    })

    if (!response.ok) {
      const text = await response.text()
      const message = `EvolutionAPI ${response.status}: ${text}`

      // 4xx permanentes — não retentar (ex: instância inválida, número banido)
      if (response.status >= 400 && response.status < 500) {
        throw new NonRetryableError(message)
      }

      throw new Error(message)
    }
  }
}
