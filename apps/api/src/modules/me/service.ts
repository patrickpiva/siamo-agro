import type { PrismaClient } from '@agrolink/db'
import { AppError, NotFoundError } from '@agrolink/shared'
import type { UpdateMeBody, UpdateNotificationPrefsBody, UpdateConsentsBody } from './schema.js'

export class MeService {
  constructor(private readonly prisma: PrismaClient) {}

  async getMe(userId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      include: {
        location: true,
        _count: { select: { listings: { where: { status: 'ACTIVE' } } } },
      },
    })
    if (!profile) throw new NotFoundError('Profile')

    return {
      id: profile.id,
      type: profile.type,
      name: profile.name,
      propertyName: profile.propertyName,
      bio: profile.bio,
      photo: profile.photo,
      badge: profile.badge,
      currentRating: profile.currentRating,
      ratingCount: profile.ratingCount,
      activeListingCount: profile._count.listings,
      termsAcceptedAt: profile.termsAcceptedAt?.toISOString() ?? null,
      privacyAcceptedAt: profile.privacyAcceptedAt?.toISOString() ?? null,
      marketingOptIn: profile.marketingWhatsappOptInAt !== null,
      location: profile.location
        ? { city: profile.location.city, state: profile.location.state }
        : null,
    }
  }

  async updateMe(userId: string, body: UpdateMeBody) {
    const profile = await this.prisma.profile.findUnique({ where: { userId } })
    if (!profile) throw new NotFoundError('Profile')

    const data: Record<string, unknown> = {}
    if (body.name !== undefined) data['name'] = body.name
    if (body.propertyName !== undefined) data['propertyName'] = body.propertyName
    if (body.bio !== undefined) data['bio'] = body.bio
    if (body.photo !== undefined) data['photo'] = body.photo

    await this.prisma.profile.update({ where: { id: profile.id }, data })
    return { ok: true as const }
  }

  async getNotificationPreferences(userId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      select: { id: true },
    })
    if (!profile) throw new NotFoundError('Profile')

    const prefs = await this.prisma.notificationPreference.upsert({
      where: { profileId: profile.id },
      create: { profileId: profile.id },
      update: {},
    })

    return {
      whatsapp: prefs.whatsapp,
      push: prefs.push,
      proposalReceived: prefs.proposalReceived,
      transactionUpdate: prefs.transactionUpdate,
      matchFound: prefs.matchFound,
      ratingReceived: prefs.ratingReceived,
      collectiveUpdate: prefs.collectiveUpdate,
      weeklyTips: prefs.weeklyTips,
    }
  }

  async updateNotificationPreferences(userId: string, body: UpdateNotificationPrefsBody) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      select: { id: true },
    })
    if (!profile) throw new NotFoundError('Profile')

    await this.prisma.notificationPreference.upsert({
      where: { profileId: profile.id },
      create: { profileId: profile.id, ...body },
      update: body,
    })

    return { ok: true as const }
  }

  async getConsents(userId: string) {
    const profile = await this.prisma.profile.findUnique({ where: { userId } })
    if (!profile) throw new NotFoundError('Profile')

    return {
      termsAcceptedAt: profile.termsAcceptedAt?.toISOString() ?? null,
      privacyAcceptedAt: profile.privacyAcceptedAt?.toISOString() ?? null,
      marketingOptIn: profile.marketingWhatsappOptInAt !== null,
      marketingOptInAt: profile.marketingWhatsappOptInAt?.toISOString() ?? null,
    }
  }

  async updateConsents(userId: string, body: UpdateConsentsBody) {
    const profile = await this.prisma.profile.findUnique({ where: { userId } })
    if (!profile) throw new NotFoundError('Profile')

    await this.prisma.profile.update({
      where: { id: profile.id },
      data: {
        marketingWhatsappOptInAt: body.marketingOptIn ? new Date() : null,
      },
    })

    return { ok: true as const }
  }

  async requestDataExport(userId: string) {
    // Log the export request for LGPD audit trail
    // In production this would queue an email job
    await this.prisma.notification.create({
      data: {
        userId,
        type: 'SYSTEM',
        data: {
          message:
            'Sua solicitação de exportação de dados foi recebida. Você receberá um e-mail em até 15 dias úteis.',
        },
      },
    })
    return { requested: true as const }
  }

  async deleteAccount(userId: string) {
    // Soft-delete: mark as DELETED, physical removal after 30 days per LGPD
    await this.prisma.user.update({
      where: { id: userId },
      data: { status: 'DELETED' },
    })

    // Log deletion request for audit trail
    await this.prisma.notification.create({
      data: {
        userId,
        type: 'SYSTEM',
        data: {
          message:
            'Sua conta foi marcada para exclusão. Os dados serão removidos em até 30 dias conforme a LGPD.',
        },
      },
    })

    return { scheduled: true as const }
  }
}

export class MeNotFoundError extends AppError {
  constructor() {
    super('Perfil não encontrado', 'PROFILE_NOT_FOUND', 404)
  }
}
