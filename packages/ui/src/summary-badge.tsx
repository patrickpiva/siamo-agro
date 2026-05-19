import { cn } from './lib/utils'

interface SummaryBadgeProps {
  kindLabel: string
  text?: string
  onEdit?: () => void
  className?: string
}

export function SummaryBadge({ kindLabel, text, onEdit, className }: SummaryBadgeProps) {
  return (
    <div
      className={cn(
        'bg-card border-border flex items-center gap-[10px] rounded-[10px] border px-[14px] py-[10px]',
        className,
      )}
    >
      <span className="bg-cta-bg text-cta-fg flex-shrink-0 rounded-[4px] px-2 py-[3px] font-mono text-[10px] font-medium tracking-[0.3px]">
        {kindLabel}
      </span>
      {text && <span className="text-fg-secondary min-w-0 truncate text-[13px]">{text}</span>}
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="text-accent ml-auto flex-shrink-0 text-[11px] font-medium"
        >
          Editar
        </button>
      )}
    </div>
  )
}
