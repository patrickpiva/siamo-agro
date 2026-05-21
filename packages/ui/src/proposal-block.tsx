import { cn, formatBRL } from './lib/utils'

interface ProposalBlockProps {
  label: string
  priceCents: number
  unit?: string
  quantity?: number
  totalCents?: number
  message?: string
  negotiable?: boolean
  className?: string
}

export function ProposalBlock({
  label,
  priceCents,
  unit,
  quantity,
  totalCents,
  message,
  negotiable,
  className,
}: ProposalBlockProps) {
  return (
    <div
      className={cn(
        'rounded-[12px] border p-4',
        'border-[#c6e845] bg-[#f0f7d9]',
        'dark:border-[rgba(198,232,69,0.2)] dark:bg-[rgba(198,232,69,0.06)]',
        className,
      )}
    >
      <p className="text-accent dark:text-primary mb-2 font-mono text-[11px] tracking-[0.4px]">
        [{label}]
      </p>
      <p className="text-accent dark:text-primary mb-1 font-mono text-[28px] font-medium leading-none">
        {formatBRL(priceCents)}
        {unit && (
          <span className="text-muted-foreground ml-1 text-[16px] font-normal">/{unit}</span>
        )}
      </p>
      {(quantity != null || totalCents != null) && (
        <p className="text-foreground/70 text-[12px]">
          {quantity != null && `${quantity}${unit ? ` ${unit}` : ''}`}
          {totalCents != null && ` · Total: `}
          {totalCents != null && (
            <span className="text-accent dark:text-primary font-mono font-medium">
              {formatBRL(totalCents)}
            </span>
          )}
          {negotiable && ' · Negociável'}
        </p>
      )}
      {message && (
        <p
          className={cn(
            'text-foreground/70 mt-[10px] rounded-[8px] px-3 py-[10px] text-[13px] italic leading-[1.5]',
            'border border-[#e0e0d8] bg-white/70',
            'dark:bg-white/4 dark:border-transparent',
          )}
        >
          &ldquo;{message}&rdquo;
        </p>
      )}
    </div>
  )
}
