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
} satisfies { [K in WhatsAppTemplateName]: Renderer<K> }

// ─── Renderer ────────────────────────────────────────────────────────────────

export function renderTemplate<T extends WhatsAppTemplateName>(
  template: T,
  params: WhatsAppTemplateParams[T],
): string {
  return (TEMPLATES[template] as Renderer<T>)(params)
}
