import { cn } from './lib/utils'
import { KindBadge } from './kind-badge'
import { StatusBadge } from './status-badge'

// Simple placeholder icon (wheat/grain) as SVG inline — avoids external import
function PlaceholderIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M12 22V12" />
      <path d="M9 7c0 2.8 1.3 4 3 5 1.7-1 3-2.2 3-5a3 3 0 0 0-6 0z" />
      <path d="M6 12c0 2.8 1.3 4 3 4.5" />
      <path d="M18 12c0 2.8-1.3 4-3 4.5" />
    </svg>
  )
}

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
          <div className="flex h-full w-full items-center justify-center">
            <PlaceholderIcon className="text-muted-foreground size-5 opacity-50" />
          </div>
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
