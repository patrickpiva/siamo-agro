export type { WhatsAppAdapter } from './types.js'
export { EvolutionApiAdapter } from './evolution.js'
export { TwilioAdapter } from './twilio.js'

import type { WhatsAppAdapter } from './types.js'
import { EvolutionApiAdapter } from './evolution.js'
import { TwilioAdapter } from './twilio.js'

/**
 * Retorna o adapter configurado pela variável WHATSAPP_PROVIDER.
 * Valores aceitos: 'evolution' (padrão) | 'twilio'
 */
export function createWhatsAppAdapter(): WhatsAppAdapter {
  const provider = process.env['WHATSAPP_PROVIDER'] ?? 'evolution'

  if (provider === 'twilio') {
    return new TwilioAdapter()
  }

  return new EvolutionApiAdapter()
}
