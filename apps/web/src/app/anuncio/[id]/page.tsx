import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { Share2, Pencil, MoreVertical, MapPin, MessageCircle } from '@agraia/ui/icons'
import { BookmarkButton } from '@/components/listings/bookmark-button'
import { BackButton } from '@/components/layout/back-button'
import { PriceBlock } from '@agraia/ui'
import { getServerSession } from '@/lib/server-auth'
import { fetchListing } from '@/lib/api'
import { prisma } from '@agraia/db'
import { ListingHero } from '@/components/listings/listing-hero'
import { SellerCard } from '@/components/listings/seller-card'
import { OwnerBanner } from '@/components/listings/owner-banner'
import { OwnerStats } from '@/components/listings/owner-stats'
import { ProposalsList } from '@/components/listings/proposals-list'

const API_URL = process.env['API_URL'] ?? 'http://localhost:3001'

interface SellerReputation {
  currentRating: number
  ratingCount: number
}

async function getSellerReputation(profileId: string): Promise<SellerReputation | null> {
  try {
    const res = await fetch(`${API_URL}/api/v1/profiles/${profileId}/reputation`, {
      cache: 'no-store',
    })
    if (!res.ok) return null
    const json = (await res.json()) as { data: SellerReputation }
    return json.data
  } catch {
    return null
  }
}

const CATEGORY_LABELS: Record<string, string> = {
  COFFEE: 'CAFÉ',
  SOY: 'SOJA',
  CORN: 'MILHO',
  GRAINS: 'GRÃOS',
  LIVESTOCK: 'PECUÁRIA',
  DAIRY: 'LATICÍNIOS',
  FRUITS: 'FRUTAS',
  VEGETABLES: 'HORTALIÇAS',
  AGRONOMY: 'AGRONOMIA',
  VETERINARY: 'VETERINÁRIA',
  CONSULTING: 'CONSULTORIA',
  MECHANICS: 'MECÂNICA',
  LABOR: 'MÃO DE OBRA',
  TRANSPORT: 'TRANSPORTE',
  IRRIGATION: 'IRRIGAÇÃO',
  TRACTOR: 'TRATOR',
  HARVESTER: 'COLHEITADEIRA',
  IRRIGATION_SYSTEM: 'IRRIGAÇÃO',
  TOOLS: 'FERRAMENTAS',
  STORAGE: 'ARMAZENAMENTO',
  OTHER: 'OUTROS',
}

function formatBRL(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function timeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime()
  const hours = Math.floor(diff / 3_600_000)
  if (hours < 24) return `há ${hours}h`
  const days = Math.floor(hours / 24)
  return `há ${days}d`
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const listing = await fetchListing(id)
  if (!listing) return {}
  return {
    title: `${listing.title} · AgraIA`,
    description: listing.description.slice(0, 160),
    openGraph: {
      images: listing.photos[0] ? [{ url: listing.photos[0].url }] : [],
      type: 'website',
    },
  }
}

export default async function AnuncioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [session, listing] = await Promise.all([getServerSession(), fetchListing(id)])

  if (!listing || listing.status === 'CLOSED') notFound()

  const isOwner = session?.userId === listing.profile.userId

  // Real counts + recent proposals via Prisma (owner only)
  const [proposalCount, matchCount, recentProposals] = isOwner
    ? await Promise.all([
        prisma.transaction.count({
          where: { listingId: id, status: 'PROPOSED' },
        }),
        prisma.matchScore.count({
          where: { listingId: id },
        }),
        prisma.transaction.findMany({
          where: { listingId: id, status: 'PROPOSED' },
          include: {
            buyer: { select: { id: true, profile: { select: { name: true, photo: true } } } },
            messages: { orderBy: { createdAt: 'asc' }, take: 1 },
          },
          orderBy: { createdAt: 'desc' },
          take: 3,
        }),
      ])
    : [0, 0, []]

  // Seller stats for the SellerCard (visitors only)
  const sellerProfileId = listing.profile.id
  const [sellerReputation, sellerProfile] =
    !isOwner && sellerProfileId
      ? await Promise.all([
          getSellerReputation(sellerProfileId),
          prisma.profile.findUnique({
            where: { id: sellerProfileId },
            select: { userId: true, createdAt: true },
          }),
        ])
      : [null, null]

  const sellerTransactionCount =
    !isOwner && sellerProfile
      ? await prisma.transaction.count({
          where: {
            OR: [{ buyerId: sellerProfile.userId }, { sellerId: sellerProfile.userId }],
            status: 'COMPLETED',
          },
        })
      : 0

  const sellerYearsActive = sellerProfile
    ? Math.floor((Date.now() - sellerProfile.createdAt.getTime()) / (1000 * 60 * 60 * 24 * 365.25))
    : 0

  // Check whether the current user has saved this listing
  const isSaved =
    session && !isOwner
      ? (await prisma.savedListing.findUnique({
          where: { userId_listingId: { userId: session.userId, listingId: id } },
          select: { id: true },
        })) !== null
      : false

  const photos = [...listing.photos].sort((a, b) => a.order - b.order).map((p) => ({ url: p.url }))

  const catLabel = CATEGORY_LABELS[listing.category] ?? listing.category
  const waText = encodeURIComponent(`Olá, vi seu anúncio "${listing.title}" no AgraIA`)
  const waLink = `https://wa.me/?text=${waText}`

  return (
    <div className="bg-background flex min-h-screen flex-col pb-24">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3">
        <BackButton fallbackHref="/feed" />

        <div className="flex gap-2">
          {isOwner ? (
            <>
              <Link
                href={`/anuncio/${id}/editar`}
                aria-label="Editar anúncio"
                className="bg-muted flex size-[48px] items-center justify-center rounded-full"
              >
                <Pencil size={17} strokeWidth={1.8} />
              </Link>
              <button
                type="button"
                aria-label="Mais opções"
                className="bg-muted flex size-[48px] items-center justify-center rounded-full"
              >
                <MoreVertical size={17} strokeWidth={1.8} />
              </button>
            </>
          ) : (
            <>
              <BookmarkButton
                listingId={id}
                initialSaved={isSaved}
                isAuthenticated={session !== null}
              />
              <button
                type="button"
                aria-label="Compartilhar anúncio"
                className="bg-muted flex size-[48px] items-center justify-center rounded-full"
              >
                <Share2 size={17} strokeWidth={1.8} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Owner banner + stats ────────────────────────────────── */}
      {isOwner && <OwnerBanner status={listing.status} />}
      {isOwner && (
        <OwnerStats views={listing.viewCount} proposals={proposalCount} matches={matchCount} />
      )}

      {/* ── Hero carousel ───────────────────────────────────────── */}
      <ListingHero photos={photos} kind={listing.kind} height={isOwner ? 140 : 220} />

      {/* ── Content ─────────────────────────────────────────────── */}
      <div className="px-5 pt-4">
        {/* Category chip */}
        <div className="mb-2">
          <span className="bg-primary-subtle border-primary text-accent rounded-[4px] border px-2 py-[3px] text-[10px] font-medium tracking-[0.3px]">
            {catLabel}
          </span>
        </div>

        {/* Title */}
        <h1 className="mb-[6px] text-[19px] font-medium leading-snug">{listing.title}</h1>

        {/* Location + time */}
        <div className="mb-4 flex items-center gap-[6px]">
          <MapPin size={13} strokeWidth={2} className="text-muted-foreground flex-shrink-0" />
          <span className="text-muted-foreground text-[12px]">
            {[listing.profile.city, listing.profile.state].filter(Boolean).join(', ')}
            {listing.profile.city ? ' · ' : ''}
            {timeAgo(listing.createdAt)}
          </span>
        </div>

        {/* Price block */}
        {listing.price !== null && (
          <PriceBlock
            label={`[PREÇO · ${catLabel}]`}
            value={formatBRL(listing.price)}
            note={listing.negotiable ? '· Negociável' : undefined}
            className="mb-5"
          />
        )}

        {/* Description */}
        <div className="mb-5">
          <h2 className="mb-[6px] text-[12px] font-medium">Descrição</h2>
          <p className="text-fg-secondary whitespace-pre-line text-[13px] leading-relaxed">
            {listing.description}
          </p>
        </div>

        {/* Seller card (visitors only) */}
        {!isOwner && (
          <SellerCard
            profile={{
              ...listing.profile,
              rating: sellerReputation?.currentRating ?? listing.profile.rating ?? null,
              reviewCount: sellerReputation?.ratingCount,
              transactionCount: sellerTransactionCount,
              yearsActive: sellerYearsActive > 0 ? sellerYearsActive : undefined,
              responseTime: undefined,
            }}
          />
        )}

        {/* Proposals preview (owner only) */}
        {isOwner && (
          <div className="mt-2">
            <p className="text-muted-foreground mb-[10px] font-mono text-[11px] tracking-[0.4px]">
              [PROPOSTAS RECENTES · {proposalCount}]
            </p>
            <ProposalsList proposals={recentProposals} listingId={id} />
          </div>
        )}
      </div>

      {/* ── Fixed CTA bar ───────────────────────────────────────── */}
      <div className="border-border bg-card fixed bottom-0 left-0 right-0 border-t px-5 pb-6 pt-4">
        {isOwner ? (
          <div className="flex gap-2">
            <button
              type="button"
              className="bg-card border-border min-w-0 flex-[1] rounded-[12px] border py-[13px] text-[13px] font-medium"
            >
              Pausar
            </button>
            <Link
              href={`/anuncio/${id}/propostas` as never}
              className="bg-cta-bg text-cta-fg flex min-w-0 flex-[2] items-center justify-center rounded-[12px] py-[13px] text-[15px] font-medium"
            >
              Ver todas as propostas
            </Link>
          </div>
        ) : (
          <div className="flex gap-[10px]">
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Contato via WhatsApp"
              className="bg-muted flex size-[44px] flex-shrink-0 items-center justify-center rounded-[12px]"
            >
              <MessageCircle size={18} strokeWidth={1.8} />
            </a>
            <Link
              href={`/anuncio/${id}/proposta`}
              className="bg-cta-bg text-cta-fg flex flex-1 items-center justify-center rounded-[12px] py-[15px] text-[15px] font-medium"
            >
              Fazer proposta
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
