'use client'

import { cn } from './lib/utils'

interface PriceProposalInputProps {
  valueCents: number
  onChange: (cents: number) => void
  referenceCents: number
  className?: string
}

function formatDisplay(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function PriceProposalInput({
  valueCents,
  onChange,
  referenceCents,
  className,
}: PriceProposalInputProps) {
  const diff = referenceCents > 0 ? ((valueCents - referenceCents) / referenceCents) * 100 : 0

  const diffLabel =
    diff === 0
      ? 'Igual ao preço anunciado'
      : diff < 0
        ? `${Math.abs(diff).toFixed(1)}% abaixo do preço anunciado`
        : `+${diff.toFixed(1)}% acima do preço anunciado`

  const diffClass =
    diff === 0
      ? 'text-muted-foreground'
      : diff < 0
        ? 'text-accent dark:text-primary font-medium'
        : 'text-muted-foreground'

  function handleChange(raw: string) {
    const digits = raw.replace(/\D/g, '')
    onChange(Number(digits))
  }

  return (
    <div
      className={cn(
        'bg-card flex items-center gap-3 rounded-[12px] border px-4 py-[14px]',
        'border-accent dark:border-primary border-[1.5px]',
        className,
      )}
    >
      <span className="border-border text-muted-foreground border-r pr-[10px] font-mono text-[15px]">
        R$
      </span>
      <div className="flex-1">
        <input
          type="tel"
          inputMode="numeric"
          value={formatDisplay(valueCents)}
          onChange={(e) => handleChange(e.target.value)}
          className="text-accent dark:text-primary w-full bg-transparent font-mono text-[20px] font-medium outline-none"
          aria-label="Preço proposto em reais"
        />
        <p className={cn('mt-[2px] text-[11px]', diffClass)}>{diffLabel}</p>
      </div>
    </div>
  )
}
