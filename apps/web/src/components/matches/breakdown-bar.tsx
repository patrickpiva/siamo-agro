import { cn } from '@siamo/ui'
import type { ReactNode } from 'react'

export type BreakdownColorClass = 'distance' | 'reputation' | 'compatibility' | 'responsiveness'

export interface BreakdownBarProps {
  icon: ReactNode
  label: string
  weight: number // percentage e.g. 40
  points: number // points earned e.g. 38
  fill: number // 0–100 bar fill percentage
  detail: string
  colorClass: BreakdownColorClass
}

export function BreakdownBar({
  icon,
  label,
  weight,
  points,
  fill,
  detail,
  colorClass,
}: BreakdownBarProps) {
  return (
    <div className="mb-[14px]">
      <div className="mb-[6px] flex items-center justify-between">
        <div className="text-fg-secondary flex items-center gap-[6px] text-[12px]">
          {icon}
          <span>{label}</span>
        </div>
        <div className="flex items-center gap-[6px]">
          <span className="text-muted-foreground font-mono text-[10px]">peso {weight}%</span>
          <span className="text-accent dark:text-primary font-mono text-[12px] font-medium">
            {points} pts
          </span>
        </div>
      </div>

      {/* Track */}
      <div className="bg-border h-[6px] overflow-hidden rounded-full">
        <div
          className={cn('h-full rounded-full transition-all', `bar-fill-${colorClass}`)}
          style={{ width: `${fill}%` }}
        />
      </div>

      <p className="text-muted-foreground mt-1 text-[11px]">{detail}</p>
    </div>
  )
}
