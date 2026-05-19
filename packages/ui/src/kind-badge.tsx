import { cn } from './lib/utils'

const KIND_LABELS: Record<string, string> = {
  OFFER: 'OFERTA',
  DEMAND: 'DEMANDA',
  SERVICE: 'SERVIÇO',
  EQUIPMENT: 'EQUIP.',
}

interface KindBadgeProps {
  kind: string
  className?: string
}

export function KindBadge({ kind, className }: KindBadgeProps) {
  return (
    <span
      className={cn(
        'inline-block font-mono text-[10px] font-medium tracking-[0.3px]',
        'bg-cta-bg text-cta-fg rounded-[5px] px-2 py-[3px]',
        className,
      )}
    >
      {KIND_LABELS[kind] ?? kind}
    </span>
  )
}
