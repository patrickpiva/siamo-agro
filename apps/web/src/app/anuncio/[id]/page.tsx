import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { Bookmark, Share2, Pencil, MoreVertical, MapPin, MessageCircle } from '@agrolink/ui/icons'
import { BackButton } from '@/components/layout/back-button'
import { PriceBlock } from '@agrolink/ui'
import { getServerSession } from '@/lib/server-auth'
import { fetchListing, fetchListingProposals } from '@/lib/api'
import { ListingHero } from '@/components/listings/listing-hero'
import { SellerCard } from '@/components/listings/seller-card'
import { OwnerBanner } from '@/components/listings/owner-banner'
import { OwnerStats } from '@/components/listings/owner-stats'
import { ProposalsList } from '@/components/listings/proposals-list'

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
    title: `${listing.title} · AgroLink`,
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
  const proposals = isOwner ? await fetchListingProposals(id, 3) : []
  const photos = [...listing.photos].sort((a, b) => a.order - b.order).map((p) => ({ url: p.url }))

  const catLabel = CATEGORY_LABELS[listing.category] ?? listing.category
  const waText = encodeURIComponent(`Olá, vi seu anúncio "${listing.title}" no AgroLink`)
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
              <button
                type="button"
                aria-label="Salvar anúncio"
                className="bg-muted flex size-[48px] items-center justify-center rounded-full"
              >
                <Bookmark size={17} strokeWidth={1.8} />
              </button>
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
        <OwnerStats
          views={listing.viewCount}
          proposals={listing.proposalCount ?? 0}
          matches={listing.matchCount ?? 0}
        />
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
              rating: listing.profile.rating ?? null,
            }}
          />
        )}

        {/* Proposals preview (owner only) */}
        {isOwner && (
          <div className="mt-2">
            <p className="text-muted-foreground mb-[10px] font-mono text-[11px] tracking-[0.4px]">
              [PROPOSTAS RECENTES · {listing.proposalCount ?? 0}]
            </p>
            <ProposalsList proposals={proposals} listingId={id} />
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
