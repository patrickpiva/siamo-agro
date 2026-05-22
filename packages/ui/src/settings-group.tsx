import type { ReactNode } from 'react'
import { cn } from './lib/utils'

interface SettingsGroupProps {
  label?: string
  children: ReactNode
  className?: string
}

export function SettingsGroup({ label, children, className }: SettingsGroupProps) {
  return (
    <div className={cn('mb-2', className)}>
      {label && (
        <p className="text-muted-foreground px-5 pb-2 pt-3 font-mono text-[11px] tracking-[0.4px]">
          {label}
        </p>
      )}
      <div className="bg-card border-border mx-4 overflow-hidden rounded-[14px] border">
        {children}
      </div>
    </div>
  )
}
