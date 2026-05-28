'use client'

import type { Route } from 'next'
import Link from 'next/link'
import { ArrowLeft } from '@agraia/ui/icons'
import { cn } from '@agraia/ui'

interface ScreenHeaderProps {
  backHref?: Route
  onBack?: () => void
  title?: React.ReactNode
  right?: React.ReactNode
  className?: string
}

const backButtonClass = cn(
  'size-12 rounded-full bg-muted flex items-center justify-center',
  'transition-colors hover:bg-muted/80',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
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

      <div className="w-12">{right}</div>
    </div>
  )
}
