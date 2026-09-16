'use client'

import type { Route } from 'next'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowLeft } from '@siamo/ui/icons'
import { cn } from '@siamo/ui'

interface ScreenHeaderProps {
  /** Shorthand: renders the standard back pill as a link to this route. */
  backHref?: Route
  /** Shorthand: renders the standard back pill as a button. Ignored when `backHref` is set. */
  onBack?: () => void
  /** Arbitrary leading content. Takes precedence over the back shorthands. */
  left?: ReactNode
  /** Plain string gets the standard title style; pass a node to override it. */
  title?: ReactNode
  /** Trailing controls. Any number of them — the title stays centred regardless. */
  right?: ReactNode
  /** Keeps the header pinned while the page scrolls, with a blurred backdrop. */
  sticky?: boolean
  className?: string
}

const backButtonClass = cn(
  'size-12 rounded-full bg-muted flex items-center justify-center',
  'transition-colors hover:bg-muted/80',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
)

/**
 * The single page header for the app.
 *
 * Laid out as `1fr auto 1fr` rather than `justify-between`: the two side columns
 * are equal by definition, so the title is centred on the screen no matter how
 * many controls sit on either side. The previous `justify-between` version only
 * centred the title when the left and right sides happened to be the same width,
 * which is why a hand-maintained `w-12` spacer accompanied every back button —
 * and why /meu-perfil (two trailing icons) and /notificacoes (a variable-width
 * text button) drifted off-centre.
 *
 * A title too long for its column truncates instead of colliding with the controls.
 *
 * Lives in apps/web rather than packages/ui on purpose: the Tailwind `@source`
 * path for packages/ui is broken (see CLAUDE.md §11), so classes used only there
 * are dropped from the built CSS.
 */
export function ScreenHeader({
  backHref,
  onBack,
  left,
  title,
  right,
  sticky = false,
  className,
}: ScreenHeaderProps) {
  const leading =
    left ??
    (backHref ? (
      <Link href={backHref} aria-label="Voltar" className={backButtonClass}>
        <ArrowLeft size={18} strokeWidth={1.8} />
      </Link>
    ) : onBack ? (
      <button type="button" onClick={onBack} aria-label="Voltar" className={backButtonClass}>
        <ArrowLeft size={18} strokeWidth={1.8} />
      </button>
    ) : null)

  return (
    <header
      className={cn(
        'grid flex-shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 py-3',
        // Clears the iOS status bar: the app runs with viewportFit "cover" and a
        // translucent status bar, so without this the header renders underneath it.
        'pt-[calc(0.75rem+env(safe-area-inset-top,0px))]',
        sticky && 'bg-background/80 sticky top-0 z-10 backdrop-blur-sm',
        className,
      )}
    >
      <div className="flex min-w-0 items-center justify-start gap-2">{leading}</div>

      {typeof title === 'string' ? (
        <h1 className="truncate text-center text-[15px] font-medium">{title}</h1>
      ) : (
        <div className="min-w-0 truncate text-center">{title}</div>
      )}

      <div className="flex min-w-0 items-center justify-end gap-2">{right}</div>
    </header>
  )
}
