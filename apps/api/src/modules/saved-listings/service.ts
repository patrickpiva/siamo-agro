import type { PrismaClient } from '@agraia/db'
import type { ListSavedQuery } from './schema.js'
import { ListingNotFoundError } from './errors.js'

export class SavedListingsService {
  constructor(private readonly prisma: PrismaClient) {}

  async toggle(userId: string, listingId: string): Promise<{ saved: boolean }> {
    // Verify the listing exists and is not closed
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      select: { id: true },
    })
    if (!listing) throw new ListingNotFoundError(listingId)

    const existing = await this.prisma.savedListing.findUnique({
      where: { userId_listingId: { userId, listingId } },
    })

    if (existing) {
      await this.prisma.savedListing.delete({
        where: { userId_listingId: { userId, listingId } },
      })
      return { saved: false }
    }

    await this.prisma.savedListing.create({
      data: { userId, listingId },
    })
    return { saved: true }
  }

  async isSaved(userId: string, listingId: string): Promise<boolean> {
    const row = await this.prisma.savedListing.findUnique({
      where: { userId_listingId: { userId, listingId } },
      select: { id: true },
    })
    return row !== null
  }

  async list(userId: string, query: ListSavedQuery) {
    const { cursor, limit } = query

    const rows = await this.prisma.savedListing.findMany({
      where: { userId },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: 'desc' },
      include: {
        listing: {
          include: {
            photos: { orderBy: { order: 'asc' } },
            profile: {
              include: { location: true },
            },
          },
        },
      },
    })

    const hasMore = rows.length > limit
    const items = hasMore ? rows.slice(0, limit) : rows
    const nextCursor = hasMore ? (items[items.length - 1]?.id ?? null) : null

    const data = items
      .filter((r) => r.listing.status !== 'CLOSED')
      .map((r) => {
        const l = r.listing
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

    return { data, meta: { nextCursor, limit } }
  }
}
