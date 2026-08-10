import { Prisma } from '@siamo/db'
import type { PrismaClient } from '@siamo/db'
import { isCategoryValidForKind } from '@siamo/shared'
import { addComputeMatchesJob } from '../../workers/matchmaking/queue.js'
import { isOwnedListingPhotoUrl } from './photo-ownership.js'
import {
  ListingNotFoundError,
  ListingForbiddenError,
  ListingInvalidCategoryError,
  ListingProfileNotFoundError,
  ListingPhotoOwnershipError,
} from './errors.js'
import type {
  CreateListingBody,
  UpdateListingBody,
  ListListingsQuery,
  ListMyListingsQuery,
  ListingDetail,
  ListingWithProfile,
} from './schema.js'

// ─── Tipos internos ───────────────────────────────────────────────────────────

type ListingWithIncludes = Prisma.ListingGetPayload<{
  include: {
    profile: { include: { location: true } }
    photos: { orderBy: { order: 'asc' } }
  }
}>

interface RawListingRow {
  id: string
  profileId: string
  kind: string
  category: string
  title: string
  description: string
  price: string | null
  negotiable: boolean
  status: string
  viewCount: number
  createdAt: Date
  updatedAt: Date
  profileName: string
  profilePhoto: string | null
  profileRating: number
  profileBadge: string
}

export interface ListListingsResult {
  data: ListingWithProfile[]
  meta: { nextCursor: string | null; limit: number }
}

export interface ListMyListingsResult {
  data: ListingDetail[]
  meta: { nextCursor: string | null; limit: number }
}

// ─── ListingsService ──────────────────────────────────────────────────────────

export class ListingsService {
  constructor(private readonly prisma: PrismaClient) {}

  // ── Create ──────────────────────────────────────────────────────────────────

  async create(userId: string, body: CreateListingBody): Promise<ListingDetail> {
    const profile = await this.prisma.profile.findUnique({ where: { userId } })
    if (!profile) throw new ListingProfileNotFoundError()

    if (body.photoUrls.some((url) => !isOwnedListingPhotoUrl(url, userId))) {
      throw new ListingPhotoOwnershipError()
    }

    const listing = await this.prisma.$transaction(async (tx) => {
      const created = await tx.listing.create({
        data: {
          profileId: profile.id,
          kind: body.kind,
          category: body.category,
          title: body.title,
          description: body.description,
          price: body.price ?? null,
          negotiable: body.negotiable ?? false,
        },
      })

      if (body.photoUrls.length > 0) {
        await tx.listingPhoto.createMany({
          data: body.photoUrls.map((url, index) => ({
            listingId: created.id,
            url,
            order: index,
          })),
        })
      }

      return tx.listing.findUniqueOrThrow({
        where: { id: created.id },
        include: {
          profile: { include: { location: true } },
          photos: { orderBy: { order: 'asc' } },
        },
      })
    })

    addComputeMatchesJob(listing.id).catch((err: unknown) =>
      console.error('[listings] Erro ao disparar compute-matches:', err),
    )

    return this.mapToDetail(listing)
  }

  // ── List ─────────────────────────────────────────────────────────────────────

  async list(query: ListListingsQuery): Promise<ListListingsResult> {
    const { kind, category, minPrice, maxPrice, lat, lng, radiusKm, search, cursor, limit } = query

    const hasGeo = lat !== undefined && lng !== undefined && radiusKm !== undefined
    const hasSearch = search !== undefined && search.length > 0

    // Expressões de ordenação reutilizadas no keyset do cursor — precisam ser
    // idênticas no ORDER BY e no WHERE para a paginação ser estável
    const rankExpr = hasSearch
      ? Prisma.sql`ts_rank(to_tsvector('portuguese', lst.title || ' ' || lst.description), plainto_tsquery('portuguese', ${search}))`
      : null
    const distExpr = hasGeo
      ? Prisma.sql`ST_Distance(loc.geog, ST_MakePoint(${lng}, ${lat})::geography)`
      : null

    const cursorCondition = cursor
      ? await this.buildCursorCondition(cursor, rankExpr, distExpr)
      : null

    const conditions: Prisma.Sql[] = [Prisma.sql`lst.status = 'ACTIVE'`]

    if (kind) conditions.push(Prisma.sql`lst.kind = ${kind}`)
    if (category) conditions.push(Prisma.sql`lst.category = ${category}`)
    if (minPrice !== undefined) conditions.push(Prisma.sql`lst.price >= ${minPrice}`)
    if (maxPrice !== undefined) conditions.push(Prisma.sql`lst.price <= ${maxPrice}`)
    if (hasGeo) {
      conditions.push(
        Prisma.sql`loc.geog IS NOT NULL AND ST_DWithin(loc.geog, ST_MakePoint(${lng}, ${lat})::geography, ${radiusKm * 1000})`,
      )
    }
    if (hasSearch) {
      conditions.push(
        Prisma.sql`to_tsvector('portuguese', lst.title || ' ' || lst.description) @@ plainto_tsquery('portuguese', ${search})`,
      )
    }
    if (cursorCondition) conditions.push(cursorCondition)

    const whereClause = Prisma.join(conditions, ' AND ')

    const orderParts: Prisma.Sql[] = []
    if (rankExpr) orderParts.push(Prisma.sql`${rankExpr} DESC`)
    if (distExpr) orderParts.push(Prisma.sql`${distExpr} ASC NULLS LAST`)
    orderParts.push(Prisma.sql`lst.created_at DESC`)
    orderParts.push(Prisma.sql`lst.id DESC`)

    const orderClause = Prisma.join(orderParts, ', ')
    const fetchLimit = limit + 1

    const rows = await this.prisma.$queryRaw<RawListingRow[]>`
      SELECT
        lst.id,
        lst.profile_id        AS "profileId",
        lst.kind,
        lst.category,
        lst.title,
        lst.description,
        lst.price::text        AS price,
        lst.negotiable,
        lst.status,
        lst.view_count         AS "viewCount",
        lst.created_at         AS "createdAt",
        lst.updated_at         AS "updatedAt",
        p.name                 AS "profileName",
        p.photo                AS "profilePhoto",
        p.current_rating       AS "profileRating",
        p.badge                AS "profileBadge"
      FROM listings lst
      JOIN profiles p   ON p.id = lst.profile_id
      LEFT JOIN locations loc ON loc.profile_id = p.id
      WHERE ${whereClause}
      ORDER BY ${orderClause}
      LIMIT ${fetchLimit}
    `

    const hasMore = rows.length > limit
    const data = hasMore ? rows.slice(0, limit) : rows

    // Batch-fetch the first photo for each listing in a single Prisma query
    const listingIds = data.map((r) => r.id)
    const allPhotos =
      listingIds.length > 0
        ? await this.prisma.listingPhoto.findMany({
            where: { listingId: { in: listingIds } },
          })
        : []

    // Sort by order asc in JS to avoid SQL reserved-word issues with the `order` column name
    allPhotos.sort((a, b) => a.order - b.order)

    // Keep only the first photo per listing (lowest order value)
    const firstPhotoByListing = new Map<string, { id: string; url: string; order: number }>()
    for (const photo of allPhotos) {
      if (!firstPhotoByListing.has(photo.listingId)) {
        firstPhotoByListing.set(photo.listingId, {
          id: photo.id,
          url: photo.url,
          order: photo.order,
        })
      }
    }

    return {
      data: data.map((row) => this.mapRawToListItem(row, firstPhotoByListing)),
      meta: {
        nextCursor: hasMore ? (data.at(-1)?.id ?? null) : null,
        limit,
      },
    }
  }

  // ── List Mine ────────────────────────────────────────────────────────────────

  async listMine(userId: string, query: ListMyListingsQuery): Promise<ListMyListingsResult> {
    const profile = await this.prisma.profile.findUnique({ where: { userId } })
    if (!profile) throw new ListingProfileNotFoundError()

    const { status, cursor, limit } = query

    const where: Prisma.ListingWhereInput = {
      profileId: profile.id,
      ...(status && { status }),
    }

    const listings = await this.prisma.listing.findMany({
      where,
      include: {
        profile: { include: { location: true } },
        photos: { orderBy: { order: 'asc' } },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    })

    const hasMore = listings.length > limit
    const data = hasMore ? listings.slice(0, limit) : listings

    return {
      data: data.map((l) => this.mapToDetail(l)),
      meta: {
        nextCursor: hasMore ? (data.at(-1)?.id ?? null) : null,
        limit,
      },
    }
  }

  // ── Find by ID ───────────────────────────────────────────────────────────────

  async findById(id: string): Promise<ListingDetail> {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      include: {
        profile: { include: { location: true } },
        photos: { orderBy: { order: 'asc' } },
      },
    })
    if (!listing) throw new ListingNotFoundError(id)

    // Fire-and-forget: não bloqueia a resposta
    this.prisma.listing
      .update({
        where: { id },
        data: { viewCount: { increment: 1 } },
      })
      .catch((err: unknown) => console.error('[listings] Erro ao incrementar viewCount:', err))

    return this.mapToDetail(listing)
  }

  // ── Update ───────────────────────────────────────────────────────────────────

  async update(listingId: string, userId: string, body: UpdateListingBody): Promise<ListingDetail> {
    const { listing } = await this.checkOwnership(listingId, userId)

    if (body.category && !isCategoryValidForKind(body.category, listing.kind)) {
      throw new ListingInvalidCategoryError(body.category, listing.kind)
    }

    // update aceitava qualquer photoUrl sem checar dono — mesma regra do create
    if (body.photoUrls?.some((url) => !isOwnedListingPhotoUrl(url, userId))) {
      throw new ListingPhotoOwnershipError()
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.listing.update({
        where: { id: listingId },
        data: {
          ...(body.title && { title: body.title }),
          ...(body.description && { description: body.description }),
          ...(body.category && { category: body.category }),
          ...(body.price !== undefined && { price: body.price }),
          ...(body.negotiable !== undefined && { negotiable: body.negotiable }),
        },
      })

      if (body.photoUrls !== undefined) {
        await tx.listingPhoto.deleteMany({ where: { listingId } })
        if (body.photoUrls.length > 0) {
          await tx.listingPhoto.createMany({
            data: body.photoUrls.map((url, index) => ({ listingId, url, order: index })),
          })
        }
      }

      return tx.listing.findUniqueOrThrow({
        where: { id: listingId },
        include: {
          profile: { include: { location: true } },
          photos: { orderBy: { order: 'asc' } },
        },
      })
    })

    const touchedContent = body.title || body.description || body.category
    if (touchedContent) {
      addComputeMatchesJob(listingId).catch((err: unknown) =>
        console.error('[listings] Erro ao re-disparar compute-matches:', err),
      )
    }

    return this.mapToDetail(updated)
  }

  // ── Delete (soft) ────────────────────────────────────────────────────────────

  async delete(listingId: string, userId: string): Promise<void> {
    await this.checkOwnership(listingId, userId)
    await this.prisma.listing.update({
      where: { id: listingId },
      data: { status: 'CLOSED' },
    })
  }

  // ── Pause ────────────────────────────────────────────────────────────────────

  async pause(listingId: string, userId: string): Promise<void> {
    await this.checkOwnership(listingId, userId)
    await this.prisma.listing.update({
      where: { id: listingId },
      data: { status: 'PAUSED' },
    })
  }

  // ── Resume ───────────────────────────────────────────────────────────────────

  async resume(listingId: string, userId: string): Promise<void> {
    await this.checkOwnership(listingId, userId)
    await this.prisma.listing.update({
      where: { id: listingId },
      data: { status: 'ACTIVE' },
    })
  }

  // ── Helpers privados ─────────────────────────────────────────────────────────

  /**
   * Keyset para ordenação mista (rank DESC, distância ASC, created_at DESC, id DESC).
   * O cursor segue sendo o id do último item; os valores de ordenação dele são
   * recalculados aqui com as MESMAS expressões da query principal. Filtrar só por
   * created_at quando a ordenação primária era rank/distância duplicava e pulava
   * itens a partir da página 2.
   */
  private async buildCursorCondition(
    cursor: string,
    rankExpr: Prisma.Sql | null,
    distExpr: Prisma.Sql | null,
  ): Promise<Prisma.Sql | null> {
    const rows = await this.prisma.$queryRaw<
      { createdAt: Date; rank: number | null; distance: number | null }[]
    >`
      SELECT
        lst.created_at AS "createdAt",
        ${rankExpr ?? Prisma.sql`NULL::float`} AS rank,
        ${distExpr ?? Prisma.sql`NULL::float`} AS distance
      FROM listings lst
      LEFT JOIN locations loc ON loc.profile_id = lst.profile_id
      WHERE lst.id = ${cursor}
    `
    const keys = rows[0]
    if (!keys) return null // cursor desconhecido → trata como primeira página

    const tieBreak = Prisma.sql`(lst.created_at < ${keys.createdAt} OR (lst.created_at = ${keys.createdAt} AND lst.id < ${cursor}))`

    if (rankExpr && distExpr && keys.rank !== null && keys.distance !== null) {
      return Prisma.sql`(${rankExpr} < ${keys.rank} OR (${rankExpr} = ${keys.rank} AND (${distExpr} > ${keys.distance} OR (${distExpr} = ${keys.distance} AND ${tieBreak}))))`
    }
    if (rankExpr && keys.rank !== null) {
      return Prisma.sql`(${rankExpr} < ${keys.rank} OR (${rankExpr} = ${keys.rank} AND ${tieBreak}))`
    }
    if (distExpr && keys.distance !== null) {
      return Prisma.sql`(${distExpr} > ${keys.distance} OR (${distExpr} = ${keys.distance} AND ${tieBreak}))`
    }
    return tieBreak
  }

  private async checkOwnership(listingId: string, userId: string) {
    const [listing, profile] = await Promise.all([
      this.prisma.listing.findUnique({ where: { id: listingId } }),
      this.prisma.profile.findUnique({ where: { userId } }),
    ])

    if (!listing) throw new ListingNotFoundError(listingId)
    if (!profile || listing.profileId !== profile.id) throw new ListingForbiddenError()

    return { listing, profile }
  }

  private mapToDetail(listing: ListingWithIncludes): ListingDetail {
    return {
      id: listing.id,
      profileId: listing.profileId,
      kind: listing.kind,
      category: listing.category,
      title: listing.title,
      description: listing.description,
      price: listing.price ? Number(listing.price) : null,
      negotiable: listing.negotiable,
      status: listing.status,
      viewCount: (listing as unknown as { viewCount?: number }).viewCount ?? 0,
      createdAt: listing.createdAt.toISOString(),
      updatedAt: listing.updatedAt.toISOString(),
      profile: {
        id: listing.profile.id,
        userId: listing.profile.userId,
        name: listing.profile.name,
        photo: listing.profile.photo ?? null,
        rating: listing.profile.currentRating,
        badge: listing.profile.badge,
        city: listing.profile.location?.city ?? null,
        state: listing.profile.location?.state ?? null,
      },
      photos: listing.photos.map((p) => ({
        id: p.id,
        url: p.url,
        order: p.order,
      })),
    }
  }

  private mapRawToListItem(
    row: RawListingRow,
    firstPhotoByListing: Map<string, { id: string; url: string; order: number }>,
  ): ListingWithProfile {
    const photo = firstPhotoByListing.get(row.id)
    return {
      id: row.id,
      profileId: row.profileId,
      kind: row.kind as ListingDetail['kind'],
      category: row.category,
      title: row.title,
      description: row.description,
      price: row.price !== null ? parseFloat(row.price) : null,
      negotiable: row.negotiable,
      status: row.status as ListingDetail['status'],
      viewCount: Number(row.viewCount),
      createdAt:
        row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
      updatedAt:
        row.updatedAt instanceof Date ? row.updatedAt.toISOString() : String(row.updatedAt),
      profile: {
        name: row.profileName,
        photo: row.profilePhoto ?? null,
        rating: Number(row.profileRating),
        badge: row.profileBadge as ListingDetail['profile']['badge'],
      },
      photos: photo ? [photo] : [],
    }
  }
}
