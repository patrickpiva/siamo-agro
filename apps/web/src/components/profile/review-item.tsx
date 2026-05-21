import { Star } from '@agrolink/ui/icons'

interface ReviewItemProps {
  reviewerName: string
  reviewerInitials: string
  score: number
  text: string
  meta: string
  date: string
}

export function ReviewItem({
  reviewerName,
  reviewerInitials,
  score,
  text,
  meta,
  date,
}: ReviewItemProps) {
  return (
    <div className="bg-card border-border mx-5 mb-[10px] rounded-[12px] border px-[14px] py-[14px]">
      {/* Header */}
      <div className="mb-2 flex items-center gap-[10px]">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#C6E845] text-[11px] font-medium text-[#0A0A0A]">
          {reviewerInitials}
        </div>
        <div className="flex-1">
          <p className="mb-[2px] text-[12px] font-medium">{reviewerName}</p>
          <div className="flex gap-[2px]">
            {[1, 2, 3, 4, 5].map((n) =>
              n <= score ? (
                <Star
                  key={n}
                  size={11}
                  fill="currentColor"
                  strokeWidth={0}
                  className="text-accent dark:text-primary"
                />
              ) : (
                <Star
                  key={n}
                  size={11}
                  strokeWidth={2}
                  className="text-[#b0b0a5] dark:text-[#8a8a82]"
                />
              ),
            )}
          </div>
        </div>
        <span className="text-muted-foreground font-mono text-[10px]">{date}</span>
      </div>

      {/* Text */}
      <p className="text-foreground/70 mb-[6px] text-[12px] leading-[1.55]">{text}</p>

      {/* Meta */}
      <p className="text-muted-foreground font-mono text-[10px]">{meta}</p>
    </div>
  )
}
