import type { PrismaClient } from '@agrolink/db'
import { AppError } from '@agrolink/shared'
import type { ConsentBody } from './schema.js'

export class ConsentRequiredError extends AppError {
  constructor() {
    super(
      'Aceite dos Termos de uso e da Política de privacidade é obrigatório',
      'CONSENT_REQUIRED',
      422,
    )
  }
}

export class PrivacyService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Registra os consentimentos LGPD no perfil do usuário.
   * Salva o instante em que cada documento foi aceito (auditável).
   *
   * Idempotente: rodar duas vezes não sobrescreve timestamps já existentes
   * (preserva o primeiro aceite). Apenas o opt-in de marketing pode oscilar.
   */
  async record(userId: string, body: ConsentBody) {
    if (!body.terms || !body.privacy) throw new ConsentRequiredError()

    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      select: {
        id: true,
        termsAcceptedAt: true,
        privacyAcceptedAt: true,
        marketingWhatsappOptInAt: true,
      },
    })

    const now = new Date()

    // Se o perfil ainda não existe, registramos o consentimento no momento da
    // criação (handler de profile usa estes mesmos campos). Aqui só atualizamos
    // perfis já criados.
    if (!profile) {
      return {
        termsAcceptedAt: now.toISOString(),
        privacyAcceptedAt: now.toISOString(),
        marketingWhatsappOptInAt: body.marketingWhatsapp ? now.toISOString() : null,
      }
    }

    const updated = await this.prisma.profile.update({
      where: { id: profile.id },
      data: {
        termsAcceptedAt: profile.termsAcceptedAt ?? now,
        privacyAcceptedAt: profile.privacyAcceptedAt ?? now,
        marketingWhatsappOptInAt: body.marketingWhatsapp
          ? (profile.marketingWhatsappOptInAt ?? now)
          : null,
      },
      select: {
        termsAcceptedAt: true,
        privacyAcceptedAt: true,
        marketingWhatsappOptInAt: true,
      },
    })

    return {
      termsAcceptedAt: updated.termsAcceptedAt?.toISOString() ?? null,
      privacyAcceptedAt: updated.privacyAcceptedAt?.toISOString() ?? null,
      marketingWhatsappOptInAt: updated.marketingWhatsappOptInAt?.toISOString() ?? null,
    }
  }
}
