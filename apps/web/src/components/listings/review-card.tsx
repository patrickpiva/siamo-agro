import * as React from 'react'
import { cn } from '@siamo/ui'

interface ReviewCardProps {
  label: string
  onEdit?: () => void
  children: React.ReactNode
  className?: string
}

export function ReviewCard({ label, onEdit, children, className }: ReviewCardProps) {
  return (
    <div
      className={cn(
        'bg-card border-border overflow-hidden rounded-[12px] border px-4 py-3',
        className,
      )}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '6px',
        }}
      >
        <span
          style={{ alignSelf: 'center' }}
          className="text-muted-foreground font-mono text-[11px] leading-none tracking-[0.4px]"
        >
          {label}
        </span>
        {onEdit && (
          <span
            role="button"
            tabIndex={0}
            onClick={onEdit}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') onEdit()
            }}
            style={{ alignSelf: 'center' }}
            className="text-accent cursor-pointer text-[11px] font-medium leading-none"
          >
            Editar
          </span>
        )}
      </div>
      <div className="text-foreground text-[13px]">{children}</div>
    </div>
  )
}
