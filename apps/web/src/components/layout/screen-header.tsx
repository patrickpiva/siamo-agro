'use client'

import type { Route } from 'next'
import Link from 'next/link'
import { ArrowLeft } from '@agrolink/ui/icons'
import { cn } from '@agrolink/ui'

interface ScreenHeaderProps {
  backHref?: Route
  onBack?: () => void
  title?: React.ReactNode
  right?: React.ReactNode
  className?: string
}

const backButtonClass = cn(
  'w-9 h-9 rounded-full bg-bg-elevated flex items-center justify-center',
  'transition-colors hover:bg-muted',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
  'min-h-0 min-w-0',
)

export function ScreenHeader({ backHref, onBack, title, right, className }: ScreenHeaderProps) {
  return (
    <div className={cn('flex flex-shrink-0 items-center justify-between px-4 py-3', className)}>
      {backHref ? (
        <Link href={backHref} aria-label="Voltar" className={backButtonClass}>
          <ArrowLeft size={18} strokeWidth={1.8} />
        </Link>
      ) : (
        <button type="button" onClick={onBack} aria-label="Voltar" className={backButtonClass}>
          <ArrowLeft size={18} strokeWidth={1.8} />
        </button>
      )}

      <div className="flex-1 text-center">{title}</div>

      <div className="w-9">{right}</div>
    </div>
  )
}
