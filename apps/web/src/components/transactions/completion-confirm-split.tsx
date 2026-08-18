import { Check, Clock } from '@siamo/ui/icons'
import { cn } from '@siamo/ui'

interface Party {
  name: string
  initials: string
  confirmed: boolean
}

interface CompletionConfirmSplitProps {
  parties: [Party, Party]
  className?: string
}

export function CompletionConfirmSplit({ parties, className }: CompletionConfirmSplitProps) {
  return (
    <div className={cn('grid grid-cols-2 gap-[10px]', className)} aria-live="polite">
      {parties.map((party) => (
        <div
          key={party.name}
          className={cn(
            'rounded-[12px] border p-[14px] text-center transition-colors',
            party.confirmed
              ? 'border-[1.5px] border-[#1f5f3f] bg-[#f0f7d9] dark:border-[#c6e845] dark:bg-[rgba(198,232,69,0.06)]'
              : 'bg-card border-border',
          )}
        >
          <div
            className={cn(
              'mx-auto mb-2 flex size-10 items-center justify-center rounded-full text-[13px] font-medium',
              party.confirmed ? 'bg-[#C6E845] text-[#0A0A0A]' : 'bg-accent text-white',
            )}
          >
            {party.initials}
          </div>
          <p className="mb-[6px] text-[12px] font-medium">{party.name}</p>
          <div
            className={cn(
              'flex items-center justify-center gap-1 font-mono text-[10px] tracking-[0.3px]',
              party.confirmed
                ? 'text-accent dark:text-primary font-medium'
                : 'text-muted-foreground',
            )}
          >
            {party.confirmed ? (
              <Check size={12} strokeWidth={2.5} />
            ) : (
              <Clock size={12} strokeWidth={2} />
            )}
            {party.confirmed ? 'CONFIRMOU' : 'AGUARDANDO'}
          </div>
        </div>
      ))}
    </div>
  )
}
