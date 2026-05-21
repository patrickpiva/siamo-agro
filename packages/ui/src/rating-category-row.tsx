'use client'

import { MiniStarRating } from './mini-star-rating'
import { cn } from './lib/utils'

interface RatingCategoryRowProps {
  label: string
  value: number
  onChange?: (v: number) => void
  readOnly?: boolean
  className?: string
}

export function RatingCategoryRow({
  label,
  value,
  onChange,
  readOnly,
  className,
}: RatingCategoryRowProps) {
  return (
    <div
      className={cn(
        'bg-card border-border flex items-center justify-between rounded-[12px] border px-[14px] py-3',
        className,
      )}
    >
      <span className="text-foreground/80 text-[13px]">{label}</span>
      <MiniStarRating value={value} onChange={onChange} readOnly={readOnly} />
    </div>
  )
}
