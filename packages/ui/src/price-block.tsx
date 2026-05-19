import { cn } from './lib/utils'

interface PriceBlockProps {
  label: string
  value: string
  note?: string
  className?: string
}

export function PriceBlock({ label, value, note, className }: PriceBlockProps) {
  return (
    <div
      className={cn(
        'bg-primary-subtle border-primary rounded-[12px] border px-4 py-[14px]',
        className,
      )}
    >
      <p className="text-accent mb-1 font-mono text-[11px] tracking-[0.4px]">{label}</p>
      <div className="flex items-baseline gap-2">
        <span className="text-accent font-mono text-[26px] font-medium">{value}</span>
        {note && <span className="text-muted-foreground text-[12px]">{note}</span>}
      </div>
    </div>
  )
}
