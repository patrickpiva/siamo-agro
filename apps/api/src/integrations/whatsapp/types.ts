// ─── Template Definitions ─────────────────────────────────────────────────────

export type WhatsAppTemplateName =
  | 'otp'
  | 'new_match'
  | 'new_proposal'
  | 'new_rating'
  | 'transaction_accepted'
  | 'transaction_started'
  | 'transaction_completed'
  | 'transaction_cancelled'
  | 'new_transaction_message'

export type WhatsAppTemplateParams = {
  otp: { code: string }
  new_match: { listing: string; url: string }
  new_proposal: { name: string; listing: string; amount: string; url: string }
  new_rating: { name: string; score: number; url: string }
  transaction_accepted: { listing: string; url: string }
  transaction_started: { listing: string; url: string }
  transaction_completed: { listing: string; url: string }
  transaction_cancelled: { listing: string; reason: string; url: string }
  new_transaction_message: { name: string; listing: string; url: string }
}

// ─── Adapter Interface ────────────────────────────────────────────────────────

export interface WhatsAppAdapter {
  /**
   * Envia o código OTP via WhatsApp.
   * Nunca deve logar o `code` em produção.
   */
  sendOtp(phone: string, code: string): Promise<void>

  /**
   * Envia uma notificação usando um template pré-definido.
   * O tipo dos `params` é inferido automaticamente a partir do `template`.
   */
  sendNotification<T extends WhatsAppTemplateName>(
    phone: string,
    template: T,
    params: WhatsAppTemplateParams[T],
  ): Promise<void>
}

// ─── DLQ Payload ─────────────────────────────────────────────────────────────

export interface DlqPayload {
  provider: string
  phone: string
  method: 'sendOtp' | 'sendNotification'
  /** Parâmetros da mensagem — nunca contém o código OTP em produção */
  payload: Record<string, unknown>
  error: string
  attemptsMade: number
  failedAt: string
}
