import Image from 'next/image'
import Link from 'next/link'
import { cn } from './lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ListingCardData {
  id: string
  kind: string
  category: string
  title: string
  price: number | null
  photos: { url: string; order: number }[]
  profile: {
    name: string
    avatarUrl: string | null
    rating: number | null
    badge: string | null
    city: string | null
    state: string | null
  }
  createdAt: string
  distance?: number | null
}

// ─── Kind badge ───────────────────────────────────────────────────────────────

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

function relativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 60) return `há ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `há ${hours}h`
  const days = Math.floor(hours / 24)
  return `há ${days}d`
}

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// ─── ListingCard ──────────────────────────────────────────────────────────────

export function ListingCard({ listing }: { listing: ListingCardData }) {
  const photo = listing.photos.sort((a, b) => a.order - b.order)[0]
  const badgeClass = KIND_BADGE_CLASS[listing.kind] ?? 'bg-gray-100 text-gray-800'
  const kindLabel = KIND_LABELS[listing.kind] ?? listing.kind

  return (
    <Link
      href={`/anuncio/${listing.id}`}
      className="border-border bg-card group flex flex-col overflow-hidden rounded-xl border transition-shadow hover:shadow-md"
    >
      {/* Photo */}
      <div className="bg-muted relative aspect-[4/3] overflow-hidden">
        {photo ? (
          <Image
            src={photo.url}
            alt={listing.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 280px"
          />
        ) : (
          <div className="text-muted-foreground absolute inset-0 flex items-center justify-center text-4xl">
            🌾
          </div>
        )}
        <span
          className={cn(
            'absolute left-2 top-2 rounded-full px-2 py-0.5 text-xs font-semibold',
            badgeClass,
          )}
        >
          {kindLabel}
        </span>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-2 p-3">
        {/* Title */}
        <p className="line-clamp-2 text-sm font-medium leading-snug">{listing.title}</p>

        {/* Price */}
        {listing.price != null && (
          <p className="text-primary text-base font-bold">{formatBRL(listing.price)}</p>
        )}

        {/* Profile row */}
        <div className="mt-auto flex items-center gap-1.5">
          <div className="bg-muted relative h-5 w-5 shrink-0 overflow-hidden rounded-full">
            {listing.profile.avatarUrl && (
              <Image
                src={listing.profile.avatarUrl}
                alt={listing.profile.name}
                fill
                className="object-cover"
                sizes="20px"
              />
            )}
          </div>
          <span className="text-muted-foreground truncate text-xs">{listing.profile.name}</span>
          {listing.profile.rating != null && (
            <span className="shrink-0 text-xs text-amber-500">
              ★ {listing.profile.rating.toFixed(1)}
            </span>
          )}
          {listing.profile.badge && (
            <span className="shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800">
              {listing.profile.badge}
            </span>
          )}
        </div>

        {/* Location + date */}
        <div className="text-muted-foreground flex items-center justify-between text-xs">
          <span>
            {[listing.profile.city, listing.profile.state].filter(Boolean).join(', ')}
            {listing.distance != null && ` · ${listing.distance.toFixed(0)} km`}
          </span>
          <span className="shrink-0">{relativeDate(listing.createdAt)}</span>
        </div>
      </div>
    </Link>
  )
}

// ─── ListingCardSkeleton ──────────────────────────────────────────────────────

export function ListingCardSkeleton() {
  return (
    <div className="border-border bg-card flex animate-pulse flex-col overflow-hidden rounded-xl border">
      <div className="bg-muted aspect-[4/3]" />
      <div className="flex flex-col gap-2 p-3">
        <div className="bg-muted h-4 w-3/4 rounded" />
        <div className="bg-muted h-4 w-1/2 rounded" />
        <div className="bg-muted mt-1 h-5 w-1/3 rounded" />
        <div className="mt-1 flex items-center gap-2">
          <div className="bg-muted h-5 w-5 rounded-full" />
          <div className="bg-muted h-3 w-24 rounded" />
        </div>
        <div className="mt-1 flex justify-between">
          <div className="bg-muted h-3 w-20 rounded" />
          <div className="bg-muted h-3 w-12 rounded" />
        </div>
      </div>
    </div>
  )
}
