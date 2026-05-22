'use client'

import { cn } from './lib/utils'

export type FontSizeOption = 'small' | 'normal' | 'large'

const OPTIONS: { value: FontSizeOption; label: string; size: string }[] = [
  { value: 'small', label: 'Pequeno', size: 'text-[12px]' },
  { value: 'normal', label: 'Normal', size: 'text-[14px]' },
  { value: 'large', label: 'Grande', size: 'text-[17px]' },
]

interface FontSizeSliderProps {
  value: FontSizeOption
  onChange: (v: FontSizeOption) => void
  className?: string
}

export function FontSizeSlider({ value, onChange, className }: FontSizeSliderProps) {
  return (
    <div className={cn('px-4', className)}>
      <div className="bg-card border-border flex overflow-hidden rounded-[12px] border">
        {OPTIONS.map((opt) => {
          const isSelected = value === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-1 py-3 transition-colors',
                isSelected
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <span className={cn('font-medium leading-none', opt.size)}>Aa</span>
              <span className="font-mono text-[10px] leading-none opacity-80">{opt.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
