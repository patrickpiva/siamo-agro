'use client'

import { Star } from 'lucide-react'
import { cn } from './lib/utils'

interface MiniStarRatingProps {
  value: number
  onChange?: (v: number) => void
  readOnly?: boolean
  className?: string
}

export function MiniStarRating({ value, onChange, readOnly, className }: MiniStarRatingProps) {
  return (
    <div
      className={cn('flex gap-1', className)}
      role={readOnly ? undefined : 'radiogroup'}
      aria-label="Avaliação"
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= value
        return (
          <button
            key={n}
            type="button"
            role={readOnly ? undefined : 'radio'}
            aria-checked={filled}
            aria-label={`${n} estrela${n > 1 ? 's' : ''}`}
            disabled={readOnly}
            onClick={() => onChange?.(n)}
            className={cn(
              'flex size-6 items-center justify-center rounded-full transition-colors',
              filled
                ? 'bg-[#f0f7d9] dark:bg-[rgba(198,232,69,0.1)]'
                : 'bg-[#efeee7] dark:bg-[rgba(255,255,255,0.05)]',
              readOnly && 'cursor-default',
            )}
          >
            {filled ? (
              <Star
                size={12}
                fill="currentColor"
                strokeWidth={0}
                className="text-accent dark:text-primary"
              />
            ) : (
              <Star size={12} strokeWidth={2} className="text-[#b0b0a5] dark:text-[#8a8a82]" />
            )}
          </button>
        )
      })}
    </div>
  )
}
