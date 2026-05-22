'use client'

import { Moon, Sun, Monitor } from './icons/index'
import { cn } from './lib/utils'

export type ThemeOption = 'dark' | 'light' | 'system'

interface ThemeOptionConfig {
  value: ThemeOption
  label: string
  Icon: typeof Moon
  previewBg: string
  iconColor: string
  labelBg: string
  labelColor?: string
}

const OPTIONS: ThemeOptionConfig[] = [
  {
    value: 'dark',
    label: 'Escuro',
    Icon: Moon,
    previewBg: '#0A0A0A',
    iconColor: '#F5F5F0',
    labelBg: '#141412',
    labelColor: '#F5F5F0',
  },
  {
    value: 'light',
    label: 'Claro',
    Icon: Sun,
    previewBg: '#FAFAF7',
    iconColor: '#0A0A0A',
    labelBg: '#F5F5F0',
    labelColor: '#0A0A0A',
  },
  {
    value: 'system',
    label: 'Sistema',
    Icon: Monitor,
    previewBg: 'linear-gradient(135deg, #0A0A0A 50%, #FAFAF7 50%)',
    iconColor: '#8A8A82',
    labelBg: 'transparent',
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
        const isSystem = opt.value === 'system'

        return (
          <button
            key={opt.value}
            role="radio"
            aria-checked={isSelected}
            type="button"
            onClick={() => onChange(opt.value)}
            style={{ height: '96px' }}
            className={cn(
              'flex flex-col overflow-hidden rounded-[14px] border-[1.5px] transition-colors',
              isSelected ? 'border-primary' : 'border-border',
            )}
          >
            {/* Preview — inline style ensures colors render regardless of current theme */}
            <div
              className="flex flex-1 items-center justify-center"
              style={isSystem ? { background: opt.previewBg } : { backgroundColor: opt.previewBg }}
            >
              <opt.Icon size={28} strokeWidth={1.5} color={opt.iconColor} />
            </div>
            {/* Label */}
            <div
              className="py-2 text-center text-[12px] font-medium"
              style={{
                backgroundColor: isSystem ? undefined : opt.labelBg,
                color: opt.labelColor,
              }}
            >
              {opt.label}
            </div>
          </button>
        )
      })}
    </div>
  )
}
