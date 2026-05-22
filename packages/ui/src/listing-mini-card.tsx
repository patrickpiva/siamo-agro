import { cn } from './lib/utils'
import { KindBadge } from './kind-badge'
import { StatusBadge } from './status-badge'

type ListingKind = 'OFFER' | 'DEMAND' | 'SERVICE' | 'EQUIPMENT'
type ListingStatus = 'ACTIVE' | 'PAUSED' | 'CLOSED'

interface ListingMiniCardProps {
  listing: {
    id: string
    kind: ListingKind
    category: string
    title: string
    price: number
    priceUnit: string
    thumbnail?: string | null
    status: ListingStatus
  }
  className?: string
}

export function ListingMiniCard({ listing, className }: ListingMiniCardProps) {
  return (
    <div
      className={cn(
        'bg-card border-border flex items-center gap-[10px] rounded-[12px] border px-[14px] py-[10px]',
        className,
      )}
    >
      {/* Thumbnail */}
      <div className="bg-muted size-[44px] flex-shrink-0 overflow-hidden rounded-[8px]">
        {listing.thumbnail ? (
          <img src={listing.thumbnail} alt={listing.title} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full" />
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <KindBadge kind={listing.kind} className="mb-[3px]" />
        <p className="text-foreground truncate text-[12px] font-medium leading-tight">
          {listing.title}
        </p>
        <p className="text-accent-lime font-mono text-[11px]">
          {(listing.price / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          {listing.priceUnit ? `/${listing.priceUnit}` : ''}
        </p>
      </div>

      {/* Status badge */}
      <StatusBadge status={listing.status} className="flex-shrink-0" />
    </div>
  )
}
