import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getServerSession } from '@/lib/server-auth'
import { fetchListing } from '@/lib/api'
import { PhotoCarousel } from '@/components/photo-carousel'
import { OwnerTabs } from './owner-tabs'

const KIND_LABELS: Record<string, string> = {
  OFFER: 'Oferta',
  DEMAND: 'Demanda',
  SERVICE: 'Serviço',
  EQUIPMENT: 'Equipamento',
}

const KIND_BADGE_CLASS: Record<string, string> = {
  OFFER: 'bg-green-100 text-green-800',
  DEMAND: 'bg-blue-100 text-blue-800',
  SERVICE: 'bg-orange-100 text-orange-800',
  EQUIPMENT: 'bg-purple-100 text-purple-800',
}

function formatBRL(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const listing = await fetchListing(id)
  return { title: listing?.title ?? 'Anúncio' }
}

export default async function AnuncioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [session, listing] = await Promise.all([getServerSession(), fetchListing(id)])

  if (!listing || listing.status === 'CLOSED') notFound()

  const isOwner = session?.userId === listing.profile.userId
  const photos = listing.photos.sort((a, b) => a.order - b.order)

  return (
    <>
      <main className="bg-background min-h-screen pb-24">
        <div className="mx-auto max-w-2xl">
          {/* Photo carousel */}
          {photos.length > 0 ? (
            <PhotoCarousel photos={photos} />
          ) : (
            <div className="bg-muted flex aspect-video items-center justify-center text-5xl">
              🌾
            </div>
          )}

          <div className="space-y-6 px-4 py-6">
            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              <span
                className={[
                  'rounded-full px-2.5 py-1 text-xs font-semibold',
                  KIND_BADGE_CLASS[listing.kind] ?? 'bg-gray-100 text-gray-800',
                ].join(' ')}
              >
                {KIND_LABELS[listing.kind] ?? listing.kind}
              </span>
              <span className="bg-muted text-muted-foreground rounded-full px-2.5 py-1 text-xs font-semibold">
                {listing.category}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold leading-snug">{listing.title}</h1>

            {/* Price */}
            {listing.price != null && (
              <p className="text-primary text-3xl font-bold">{formatBRL(listing.price)}</p>
            )}

            {/* Description */}
            <p className="text-foreground/80 whitespace-pre-line text-base leading-relaxed">
              {listing.description}
            </p>

            {/* Owner card */}
            <section className="border-border space-y-3 rounded-xl border p-4">
              <h2 className="text-muted-foreground text-sm font-semibold uppercase tracking-wide">
                Sobre o anunciante
              </h2>
              <div className="flex items-center gap-3">
                <div className="bg-muted relative h-12 w-12 shrink-0 overflow-hidden rounded-full">
                  {listing.profile.avatarUrl && (
                    <Image
                      src={listing.profile.avatarUrl}
                      alt={listing.profile.name}
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{listing.profile.name}</p>
                  <div className="text-muted-foreground flex items-center gap-1.5 text-sm">
                    {listing.profile.rating != null && (
                      <span className="text-amber-500">★ {listing.profile.rating.toFixed(1)}</span>
                    )}
                    {listing.profile.badge && (
                      <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800">
                        {listing.profile.badge}
                      </span>
                    )}
                    {listing.profile.city && (
                      <span>
                        {listing.profile.city}
                        {listing.profile.state ? `, ${listing.profile.state}` : ''}
                      </span>
                    )}
                  </div>
                </div>
                <Link
                  href={`/perfil/${listing.profileId}`}
                  className="border-border hover:bg-muted shrink-0 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors"
                >
                  Ver perfil
                </Link>
              </div>
            </section>

            {/* Owner actions + matches tab */}
            {isOwner && <OwnerTabs listingId={id} status={listing.status} />}
          </div>
        </div>
      </main>

      {/* Sticky CTA — Fazer proposta */}
      {!isOwner && (
        <div className="bg-background/95 border-border fixed bottom-0 left-0 right-0 border-t p-4 backdrop-blur">
          <div className="mx-auto max-w-2xl">
            <button
              type="button"
              className="bg-primary text-primary-foreground w-full rounded-xl py-3.5 text-base font-semibold"
            >
              Fazer proposta
            </button>
          </div>
        </div>
      )}
    </>
  )
}
