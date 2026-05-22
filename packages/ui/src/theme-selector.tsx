'use client'

import { Moon, Sun, Monitor } from './icons/index'
import { cn } from './lib/utils'

export type ThemeOption = 'dark' | 'light' | 'system'

interface ThemeOptionConfig {
  value: ThemeOption
  label: string
  Icon: typeof Moon
  previewClass: string
  labelClass: string
}

const OPTIONS: ThemeOptionConfig[] = [
  {
    value: 'dark',
    label: 'Escuro',
    Icon: Moon,
    previewClass: 'bg-[#0A0A0A]',
    labelClass: 'bg-[#141412] text-[#F5F5F0]',
  },
  {
    value: 'light',
    label: 'Claro',
    Icon: Sun,
    previewClass: 'bg-[#FAFAF7]',
    labelClass: 'bg-[#F5F5F0] text-[#0A0A0A]',
  },
  {
    value: 'system',
    label: 'Sistema',
    Icon: Monitor,
    previewClass: 'bg-gradient-to-br from-[#0A0A0A] to-[#FAFAF7]',
    labelClass: 'bg-muted text-foreground',
  },
]

interface ThemeSelectorProps {
  value: ThemeOption
  onChange: (v: ThemeOption) => void
  className?: string
}

export function ThemeSelector({ value, onChange, className }: ThemeSelectorProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Tema do aplicativo"
      className={cn('grid grid-cols-3 gap-[10px] px-4', className)}
    >
      {OPTIONS.map((opt) => {
        const isSelected = value === opt.value
        return (
          <button
            key={opt.value}
            role="radio"
            aria-checked={isSelected}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              'overflow-hidden rounded-[14px] border-[1.5px] transition-colors',
              isSelected ? 'border-primary' : 'border-border',
            )}
          >
            {/* Preview */}
            <div className={cn('flex h-[80px] items-center justify-center', opt.previewClass)}>
              <opt.Icon
                size={28}
                strokeWidth={1.5}
                className={
                  opt.value === 'dark'
                    ? 'text-[#F5F5F0]'
                    : opt.value === 'light'
                      ? 'text-[#0A0A0A]'
                      : 'text-[#8A8A82]'
                }
              />
            </div>
            {/* Label */}
            <div className={cn('py-2 text-center text-[12px] font-medium', opt.labelClass)}>
              {opt.label}
            </div>
          </button>
        )
      })}
    </div>
  )
}
