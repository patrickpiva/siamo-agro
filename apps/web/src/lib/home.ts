import 'server-only'
import { cache } from 'react'
import { prisma } from '@siamo/db'
import {
  type HomeData,
  type Opportunity,
  type PendingProposal,
  type ContinueThread,
  countNewMessages,
  firstNameOf,
} from './home-state'

export * from './home-state'

/**
 * Agregador da Home v2 — leitura co-localizada via Prisma direto (Vercel→Supabase,
 * ADR §9), espelhando o padrão da página de detalhe do anúncio. Não há endpoint
 * `GET /api/v1/home`: o detour cross-region da Railway anularia o ganho de latência
 * na tela mais quente do app. `cache()` deduplica chamadas no mesmo request.
 */
export const getHomeData = cache(async (userId: string): Promise<HomeData | null> => {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: {
      id: true,
      name: true,
      type: true,
      badge: true,
      photo: true,
      location: { select: { id: true } },
    },
  })
  if (!profile) return null

  const [listingsCount, transactionsCount, pendingCount, pendingRaw, threadsRaw, oppRaw] =
    await Promise.all([
      prisma.listing.count({ where: { profileId: profile.id, status: 'ACTIVE' } }),
      prisma.transaction.count({ where: { OR: [{ buyerId: userId }, { sellerId: userId }] } }),
      prisma.transaction.count({ where: { sellerId: userId, status: 'PROPOSED' } }),
      prisma.transaction.findMany({
        where: { sellerId: userId, status: 'PROPOSED' },
        select: {
          id: true,
          amount: true,
          createdAt: true,
          listing: { select: { title: true } },
          buyer: { select: { profile: { select: { name: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.transaction.findMany({
        where: {
          OR: [{ buyerId: userId }, { sellerId: userId }],
          status: { in: ['ACCEPTED', 'IN_PROGRESS'] },
        },
        select: {
          id: true,
          buyerId: true,
          updatedAt: true,
          buyer: { select: { profile: { select: { name: true } } } },
          seller: { select: { profile: { select: { name: true } } } },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 10,
            select: { senderId: true, content: true, createdAt: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
        take: 5,
      }),
      prisma.matchScore.findMany({
        where: { candidateProfileId: profile.id, listing: { status: 'ACTIVE' } },
        orderBy: { score: 'desc' },
        take: 4,
        select: {
          score: true,
          distanceKm: true,
          listing: {
            select: {
              id: true,
              kind: true,
              category: true,
              title: true,
              price: true,
              photos: { orderBy: { order: 'asc' }, take: 1, select: { url: true } },
            },
          },
        },
      }),
    ])

  const pendingProposals: PendingProposal[] = pendingRaw.map((t) => ({
    transactionId: t.id,
    buyerName: t.buyer.profile?.name ?? 'Comprador',
    listingTitle: t.listing.title,
    amount: Number(t.amount),
    createdAt: t.createdAt.toISOString(),
  }))

  const continueThreads: ContinueThread[] = threadsRaw
    .filter((t) => t.messages.length > 0)
    .map((t) => {
      const iAmBuyer = t.buyerId === userId
      const counterparty = iAmBuyer ? t.seller.profile?.name : t.buyer.profile?.name
      const last = t.messages[0]
      return {
        transactionId: t.id,
        counterpartyName: counterparty ?? 'Contato',
        lastMessage: last?.content ?? null,
        lastActivityAt: (last?.createdAt ?? t.updatedAt).toISOString(),
        newCount: countNewMessages(t.messages, userId),
      }
    })

  const opportunities: Opportunity[] = oppRaw.map((ms) => ({
    listingId: ms.listing.id,
    kind: ms.listing.kind,
    category: ms.listing.category,
    title: ms.listing.title,
    price: ms.listing.price !== null ? Number(ms.listing.price) : null,
    distanceKm: ms.distanceKm ?? null,
    matchScore: ms.score,
    thumbnailUrl: ms.listing.photos[0]?.url ?? null,
  }))

  return {
    profile: {
      id: profile.id,
      name: profile.name,
      firstName: firstNameOf(profile.name),
      type: profile.type,
      badge: profile.badge,
      photo: profile.photo ?? null,
    },
    onboarding: {
      accountCreated: true,
      profileComplete: Boolean(profile.photo && profile.location),
      firstListing: listingsCount > 0,
    },
    pendingProposals,
    pendingProposalCount: pendingCount,
    continueThreads,
    opportunities,
    counts: { listings: listingsCount, transactions: transactionsCount },
  }
})
