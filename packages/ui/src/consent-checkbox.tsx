'use client'

import { Check } from './icons/index'
import { cn } from './lib/utils'

interface ConsentCheckboxProps {
  id: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  title: string
  required?: boolean
  disabled?: boolean
  description?: string
  linkText?: string
  linkHref?: string
}

export function ConsentCheckbox({
  id,
  checked,
  onCheckedChange,
  title,
  required,
  disabled,
  description,
  linkText,
  linkHref,
}: ConsentCheckboxProps) {
  return (
    <div className="border-border flex items-start gap-3.5 border-b px-4 py-5 last:border-b-0">
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        aria-required={required}
        id={id}
        disabled={disabled}
        onClick={() => onCheckedChange(!checked)}
        style={{ width: 26, height: 26, minWidth: 0, minHeight: 0, flexShrink: 0 }}
        className={cn(
          'mt-0.5 flex items-center justify-center rounded-[8px]',
          'focus-visible:ring-ring transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
          checked
            ? 'bg-accent-forest border-accent-forest border-[1.5px]'
            : 'border-border border-[1.5px] bg-transparent',
          disabled && 'pointer-events-none opacity-50',
        )}
      >
        {checked && (
          <Check size={14} strokeWidth={2.5} style={{ color: 'hsl(var(--accent-foreground))' }} />
        )}
      </button>

      <div
        className="min-w-0 flex-1 cursor-pointer"
        onClick={() => !disabled && onCheckedChange(!checked)}
      >
        <p className="mb-0.5 text-sm font-semibold leading-snug">
          {title}{' '}
          <span className="text-muted-foreground text-xs font-normal">
            ({required ? 'obrigatório' : 'opcional'})
          </span>
        </p>
        {description && (
          <p className="text-fg-secondary text-[13px] leading-snug">
            {description}{' '}
            {linkText && linkHref && (
              <a
                href={linkHref}
                className="text-accent-forest dark:text-accent-lime font-medium underline underline-offset-2"
                onClick={(e) => e.stopPropagation()}
              >
                {linkText}
              </a>
            )}
          </p>
        )}
      </div>
    </div>
  )
}
