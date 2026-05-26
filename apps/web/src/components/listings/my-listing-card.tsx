import { MoreVertical, Eye, MessageCircle, Star } from '@agraia/ui/icons'
import { KindBadge, StatusBadge } from '@agraia/ui'
import type { Listing } from '@/lib/api'

interface MyListingCardProps {
  listing: Listing
  onMore: (e: React.MouseEvent) => void
}

export function MyListingCard({ listing, onMore }: MyListingCardProps) {
  const thumb = listing.photos[0]?.url
  const isPaused = listing.status === 'PAUSED'

  return (
    <div
      className={`bg-card border-border flex gap-3 rounded-[14px] border p-3 ${isPaused ? 'opacity-70' : ''}`}
    >
      {/* Thumbnail */}
      <div className="bg-muted size-[80px] flex-shrink-0 overflow-hidden rounded-[10px]">
        {thumb && <img src={thumb} alt="" className="h-full w-full object-cover" />}
      </div>

      {/* Info */}
      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div>
          <div className="mb-1 flex items-center gap-1">
            <StatusBadge status={listing.status} />
            <KindBadge kind={listing.kind} className="px-[6px] py-[2px] text-[9px]" />
          </div>
          <p
            className={`mb-1.5 line-clamp-2 text-[13px] font-medium leading-snug ${isPaused ? 'text-muted-foreground' : ''}`}
          >
            {listing.title}
          </p>
        </div>
        <div className="text-muted-foreground flex gap-3 text-[10px]">
          <span className="flex items-center gap-[3px]">
            <Eye size={11} strokeWidth={2} />
            <strong className="text-foreground font-mono text-[11px]">{listing.viewCount}</strong>
          </span>
          <span className="flex items-center gap-[3px]">
            <MessageCircle size={11} strokeWidth={2} />
            <strong className="text-foreground font-mono text-[11px]">
              {listing.proposalCount ?? 0}
            </strong>
          </span>
          <span className="flex items-center gap-[3px]">
            <Star size={11} strokeWidth={2} />
            <strong className="text-foreground font-mono text-[11px]">
              {listing.matchCount ?? 0}
            </strong>
          </span>
        </div>
      </div>

      {/* More button */}
      <button
        type="button"
        onClick={onMore}
        aria-label="Mais opções"
        className="text-muted-foreground flex-shrink-0 self-start p-1"
      >
        <MoreVertical size={18} strokeWidth={1.8} />
      </button>
    </div>
  )
}
