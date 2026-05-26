'use client'

import { Star } from 'lucide-react'
import { cn } from './lib/utils'

interface StarRatingProps {
  value: number
  onChange?: (v: number) => void
  readOnly?: boolean
  size?: number
  className?: string
}

const LABELS: Record<number, string> = {
  1: 'Ruim',
  2: 'Regular',
  3: 'Bom',
  4: 'Muito bom',
  5: 'Excelente',
}

export function StarRating({ value, onChange, readOnly, size = 44, className }: StarRatingProps) {
  return (
    <div className={cn('flex flex-col items-center', className)}>
      <div
        className="flex gap-2"
        role={readOnly ? undefined : 'radiogroup'}
        aria-label="Avaliação em estrelas"
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
              style={{ width: size, height: size }}
              className={cn(
                'flex items-center justify-center rounded-full border transition-colors',
                filled
                  ? 'border-[#c6e845] bg-[#f0f7d9] dark:border-[rgba(198,232,69,0.3)] dark:bg-[rgba(198,232,69,0.12)]'
                  : 'border-[#d8d8d0] bg-[#f5f5f0] dark:border-[rgba(255,255,255,0.12)] dark:bg-[rgba(255,255,255,0.05)]',
                readOnly && 'cursor-default',
              )}
            >
              {filled ? (
                <Star
                  size={20}
                  fill="currentColor"
                  strokeWidth={0}
                  className="text-accent dark:text-primary"
                />
              ) : (
                <Star size={20} strokeWidth={1.5} className="text-[#c0c0b8] dark:text-[#8a8a82]" />
              )}
            </button>
          )
        })}
      </div>
      {!readOnly && value > 0 && (
        <>
          <p className="mt-2 text-[14px] font-medium">{LABELS[value]}</p>
          <p className="text-muted-foreground text-[12px]">Toque nas estrelas para mudar</p>
        </>
      )}
    </div>
  )
}
