// ─── Public API ───────────────────────────────────────────────────────────────

export type {
  WhatsAppAdapter,
  WhatsAppTemplateName,
  WhatsAppTemplateParams,
  DlqPayload,
} from './types.js'
export { MockAdapter } from './mock.adapter.js'
export { TwilioAdapter } from './twilio.adapter.js'
export { EvolutionApiAdapter } from './evolution-api.adapter.js'

// ─── Factory ──────────────────────────────────────────────────────────────────

import type { WhatsAppAdapter } from './types.js'
import { TwilioAdapter } from './twilio.adapter.js'
import { EvolutionApiAdapter } from './evolution-api.adapter.js'
import { MockAdapter } from './mock.adapter.js'

/**
 * Retorna o adapter configurado pela variável WHATSAPP_PROVIDER.
 *
 * Valores aceitos:
 *   'twilio'    — Twilio WhatsApp Business API (produção recomendada)
 *   'evolution' — Evolution API self-hosted
 *   'mock'      — console-only, sem chamadas HTTP (CI e desenvolvimento)
 *
 * Padrão: 'mock' (seguro — nunca envia em ambientes sem configuração)
 */
export function createWhatsAppAdapter(): WhatsAppAdapter {
  const provider = process.env['WHATSAPP_PROVIDER'] ?? 'mock'

  switch (provider) {
    case 'twilio':
      return new TwilioAdapter()
    case 'evolution':
      return new EvolutionApiAdapter()
    case 'mock':
      return new MockAdapter()
    default:
      console.warn(
        JSON.stringify({
          level: 'warn',
          module: 'whatsapp:factory',
          event: 'unknown_provider',
          provider,
          fallback: 'mock',
        }),
      )
      return new MockAdapter()
  }
}
