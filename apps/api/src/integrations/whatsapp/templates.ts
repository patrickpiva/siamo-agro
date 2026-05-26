import type { WhatsAppTemplateName, WhatsAppTemplateParams } from './types.js'

// ─── Template Strings ─────────────────────────────────────────────────────────

type Renderer<T extends WhatsAppTemplateName> = (params: WhatsAppTemplateParams[T]) => string

const TEMPLATES = {
  otp: ({ code }: WhatsAppTemplateParams['otp']) =>
    `Seu código AgroLink: ${code}. Válido por 5 minutos. Não compartilhe com ninguém.`,

  new_match: ({ listing, url }: WhatsAppTemplateParams['new_match']) =>
    `Novo match encontrado para seu anúncio '${listing}'. Ver detalhes: ${url}`,

  new_proposal: ({ name, listing, amount, url }: WhatsAppTemplateParams['new_proposal']) =>
    `${name} fez uma proposta para seu anúncio '${listing}'. Valor: R$ ${amount}. Ver: ${url}`,

  new_rating: ({ name, score, url }: WhatsAppTemplateParams['new_rating']) =>
    `${name} avaliou sua transação com ${score} estrelas. Ver: ${url}`,

  transaction_accepted: ({ listing, url }: WhatsAppTemplateParams['transaction_accepted']) =>
    `Sua proposta para '${listing}' foi aceita! Confirme o início do serviço: ${url}`,

  transaction_started: ({ listing, url }: WhatsAppTemplateParams['transaction_started']) =>
    `Transação '${listing}' iniciada. Acompanhe o andamento: ${url}`,

  transaction_completed: ({ listing, url }: WhatsAppTemplateParams['transaction_completed']) =>
    `Transação '${listing}' concluída com sucesso. Avalie sua experiência: ${url}`,

  transaction_cancelled: ({
    listing,
    reason,
    url,
  }: WhatsAppTemplateParams['transaction_cancelled']) =>
    `Transação '${listing}' foi cancelada (${reason}). Ver detalhes: ${url}`,

  new_transaction_message: ({
    name,
    listing,
    url,
  }: WhatsAppTemplateParams['new_transaction_message']) =>
    `${name} enviou uma mensagem sobre '${listing}'. Responder: ${url}`,
} satisfies { [K in WhatsAppTemplateName]: Renderer<K> }

// ─── Renderer ────────────────────────────────────────────────────────────────

export function renderTemplate<T extends WhatsAppTemplateName>(
  template: T,
  params: WhatsAppTemplateParams[T],
): string {
  return (TEMPLATES[template] as Renderer<T>)(params)
}
