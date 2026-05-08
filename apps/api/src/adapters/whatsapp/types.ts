export interface WhatsAppAdapter {
  /**
   * Envia o código OTP via WhatsApp ou SMS.
   * Nunca deve logar o `code` em produção.
   */
  sendOtp(phone: string, code: string): Promise<void>
}
