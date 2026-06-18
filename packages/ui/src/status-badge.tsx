import { cn } from './lib/utils'

type ListingStatus = 'ACTIVE' | 'PAUSED' | 'CLOSED'

const STATUS_CONFIG: Record<ListingStatus, { label: string; className: string }> = {
  ACTIVE: {
    label: 'ATIVO',
    className: 'bg-accent text-accent-foreground',
  },
  PAUSED: {
    label: 'PAUSADO',
    className: 'bg-warning text-warning-foreground',
  },
  CLOSED: {
    label: 'ENCERRADO',
    className: 'bg-muted-foreground text-background',
  },
}

interface StatusBadgeProps {
  status: string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status as ListingStatus] ?? {
    label: status,
    className: 'bg-muted text-muted-foreground',
  }

  return (
    <span
      className={cn(
        'inline-block font-mono text-[9px] font-medium tracking-[0.3px]',
        'rounded-[3px] px-[6px] py-[2px]',
        config.className,
        className,
      )}
      aria-label={`Status: ${config.label}`}
    >
      {config.label}
    </span>
  )
}
