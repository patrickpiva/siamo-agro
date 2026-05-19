'use client'

import { cn } from './lib/utils'

interface ToggleProps {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  label: string
  description?: string
  disabled?: boolean
  className?: string
}

export function Toggle({
  checked,
  onCheckedChange,
  label,
  description,
  disabled,
  className,
}: ToggleProps) {
  return (
    <div
      className={cn(
        'bg-card border-border flex items-center justify-between rounded-[12px] border px-4 py-3',
        className,
      )}
    >
      <div>
        <span className="text-foreground text-[13px]">{label}</span>
        {description && <p className="text-muted-foreground mt-0.5 text-[11px]">{description}</p>}
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onCheckedChange(!checked)}
        style={{
          minHeight: '24px',
          minWidth: '44px',
          ...(!checked ? { backgroundColor: 'hsl(var(--switch-off, 60 5% 70%))' } : {}),
        }}
        className={cn(
          'relative ml-4 inline-flex h-[24px] w-[44px] flex-shrink-0 cursor-pointer items-center rounded-full',
          'border-2 border-transparent transition-colors duration-200',
          'focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          checked && 'bg-primary',
          disabled && 'cursor-not-allowed opacity-50',
        )}
      >
        <span
          style={{ transform: checked ? 'translateX(20px)' : 'translateX(0)' }}
          className="pointer-events-none block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform duration-200"
        />
      </button>
    </div>
  )
}
