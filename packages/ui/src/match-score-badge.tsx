'use client'

import { useState } from 'react'
import { cn } from './lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ScoreBreakdown {
  distance: number
  reputation: number
  compatibility: number
  responsiveness: number
}

export interface MatchScoreBadgeProps {
  /** Raw score from the API — float 0.0 to 1.0. Displayed as 0–100. */
  score: number
  breakdown?: ScoreBreakdown
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function colorClass(pct: number) {
  if (pct >= 70) return 'bg-green-100 text-green-700 ring-green-300'
  if (pct >= 50) return 'bg-amber-100 text-amber-700 ring-amber-300'
  return 'bg-red-100 text-red-700 ring-red-300'
}

const SIZE: Record<NonNullable<MatchScoreBadgeProps['size']>, string> = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
}

function pct(v: number) {
  return `${Math.round(v * 100)}%`
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MatchScoreBadge({
  score,
  breakdown,
  size = 'md',
  className,
}: MatchScoreBadgeProps) {
  const [open, setOpen] = useState(false)
  const displayScore = Math.round(score * 100)
  const color = colorClass(displayScore)

  return (
    <div
      className={cn('relative inline-flex', className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <div
        role="img"
        aria-label={`Match score: ${displayScore}%`}
        className={cn(
          'flex items-center justify-center rounded-full font-bold ring-2',
          SIZE[size],
          color,
        )}
      >
        {displayScore}
      </div>

      {/* Tooltip */}
      {open && (
        <div className="border-border bg-card absolute bottom-full left-1/2 z-50 mb-2 w-48 -translate-x-1/2 rounded-lg border p-3 text-xs shadow-lg">
          <p className="text-foreground mb-1.5 font-semibold">Score: {displayScore}%</p>
          {breakdown ? (
            <ul className="text-muted-foreground space-y-1">
              <li className="flex justify-between">
                <span>Distância</span>
                <span className="font-medium">{pct(breakdown.distance)}</span>
              </li>
              <li className="flex justify-between">
                <span>Reputação</span>
                <span className="font-medium">{pct(breakdown.reputation)}</span>
              </li>
              <li className="flex justify-between">
                <span>Compatibilidade</span>
                <span className="font-medium">{pct(breakdown.compatibility)}</span>
              </li>
              <li className="flex justify-between">
                <span>Responsividade</span>
                <span className="font-medium">{pct(breakdown.responsiveness)}</span>
              </li>
            </ul>
          ) : (
            <p className="text-muted-foreground">
              Baseado em distância, reputação e compatibilidade de anúncio.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
