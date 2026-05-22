'use client'

import { CheckCircle } from './icons/index'
import { Toggle } from './toggle'
import { cn } from './lib/utils'

interface ConsentRowProps {
  title: string
  description: string
  acceptedAt?: Date | string | null
  revocable: boolean
  currentValue?: boolean
  onToggle?: (v: boolean) => void
  className?: string
}

export function ConsentRow({
  title,
  description,
  acceptedAt,
  revocable,
  currentValue,
  onToggle,
  className,
}: ConsentRowProps) {
  const dateLabel = acceptedAt
    ? new Date(acceptedAt).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : null

  return (
    <div
      className={cn(
        'border-border flex items-start gap-3 border-b py-3 last:border-b-0',
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="text-foreground text-[13px] font-medium">{title}</p>
        <p className="text-muted-foreground mt-[2px] text-[11px] leading-[1.4]">{description}</p>
        {dateLabel && (
          <p className="text-muted-foreground mt-1 font-mono text-[10px]">Aceito em {dateLabel}</p>
        )}
      </div>

      {revocable && onToggle !== undefined && currentValue !== undefined ? (
        <Toggle
          checked={currentValue}
          onCheckedChange={onToggle}
          label=""
          className="border-none bg-transparent p-0"
        />
      ) : (
        <CheckCircle size={18} strokeWidth={1.8} className="text-success mt-0.5 flex-shrink-0" />
      )}
    </div>
  )
}
