import type { PrismaClient } from '@agrolink/db'
import { AppError, NotFoundError } from '@agrolink/shared'
import { addComputeMatchesJob } from '../../workers/matchmaking/queue.js'
import type {
  UpdateMeBody,
  UpdateNotificationPrefsBody,
  UpdateConsentsBody,
  FeedMatchesQuery,
} from './schema.js'

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

  /**
   * Returns listings where the authenticated user's profile appears as a
   * high-scoring match candidate, ordered by match score descending.
   *
   * If no match scores exist yet AND the user has active listings, a background
   * job is dispatched to compute them and `computing: true` is returned so the
   * frontend can show an appropriate loading state.
   */
  async getFeedMatches(userId: string, query: FeedMatchesQuery) {
    const { cursor, limit } = query

    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      select: {
        id: true,
        _count: { select: { listings: { where: { status: 'ACTIVE' } } } },
      },
    })

    if (!profile) {
      return { data: [], meta: { nextCursor: null, limit }, computing: false }
    }

    // Cursor: stored as "matchScoreId" so we can do score-based ordering
    let cursorScore: number | undefined
    if (cursor) {
      const cursorRow = await this.prisma.matchScore.findUnique({
        where: { id: cursor },
        select: { score: true },
      })
      cursorScore = cursorRow?.score
    }

    const matchRows = await this.prisma.matchScore.findMany({
      where: {
        candidateProfileId: profile.id,
        listing: { status: 'ACTIVE' },
        ...(cursor !== undefined && cursorScore !== undefined
          ? {
              OR: [{ score: { lt: cursorScore } }, { score: cursorScore, id: { lt: cursor } }],
            }
          : {}),
      },
      take: limit + 1,
      orderBy: [{ score: 'desc' }, { id: 'desc' }],
      include: {
        listing: {
          include: {
            photos: { orderBy: { order: 'asc' } },
            profile: { include: { location: true } },
          },
        },
      },
    })

    // No matches yet — check if we should trigger computation
    if (matchRows.length === 0 && !cursor) {
      const hasActiveListings = profile._count.listings > 0
      if (hasActiveListings) {
        // Dispatch compute jobs for all of the user's active listings so that
        // OTHER listings can discover them as candidates, populating this feed.
        const myListings = await this.prisma.listing.findMany({
          where: { profileId: profile.id, status: 'ACTIVE' },
          select: { id: true },
        })
        for (const l of myListings) {
          addComputeMatchesJob(l.id).catch((err: unknown) =>
            console.error('[me/feed/matches] erro ao despachar job:', err),
          )
        }
        return { data: [], meta: { nextCursor: null, limit }, computing: true }
      }
      return { data: [], meta: { nextCursor: null, limit }, computing: false }
    }

    const hasMore = matchRows.length > limit
    const page = hasMore ? matchRows.slice(0, limit) : matchRows

    const data = page.map((ms) => {
      const l = ms.listing
      return {
        id: l.id,
        kind: l.kind,
        category: l.category,
        title: l.title,
        description: l.description,
        price: l.price ? Number(l.price) : null,
        negotiable: l.negotiable,
        status: l.status,
        viewCount: l.viewCount,
        createdAt: l.createdAt.toISOString(),
        updatedAt: l.updatedAt.toISOString(),
        matchScore: ms.score,
        distanceKm: ms.distanceKm ?? null,
        photos: l.photos.map((p) => ({ id: p.id, url: p.url, order: p.order })),
        profile: {
          id: l.profile.id,
          userId: l.profile.userId,
          name: l.profile.name,
          photo: l.profile.photo ?? null,
          rating: l.profile.currentRating,
          badge: l.profile.badge,
          city: l.profile.location?.city ?? null,
          state: l.profile.location?.state ?? null,
        },
      }
    })

    return {
      data,
      meta: { nextCursor: hasMore ? (page.at(-1)?.id ?? null) : null, limit },
      computing: false,
    }
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
