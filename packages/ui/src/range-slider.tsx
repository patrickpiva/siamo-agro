'use client'

import { cn } from './lib/utils'

export interface RangeSliderProps {
  min: number
  max: number
  value: [number, number]
  onChange: (v: [number, number]) => void
  step?: number
  format?: (v: number) => string
  /** single=true: only the upper thumb (distance filter) */
  single?: boolean
  className?: string
  /** Accessible name; falls back to generic min/max labels. */
  label?: string
}

function pct(value: number, min: number, max: number) {
  return ((value - min) / (max - min)) * 100
}

/**
 * Dual (or single) range slider built on real `<input type="range">` thumbs.
 *
 * Geometry uses inline styles and the `.range-slider-input` class from the app's
 * globals.css rather than Tailwind utilities, because `packages/ui` classes are
 * not reliably compiled — see CLAUDE.md §11. Relying on utilities here is what
 * broke the previous version: `opacity-0` never existed, so the native control
 * rendered fully opaque over the design.
 */
export function RangeSlider({
  min,
  max,
  value,
  onChange,
  step = 1,
  format = (v) => String(v),
  single = false,
  className,
  label,
}: RangeSliderProps) {
  const [lo, hi] = value
  const loPct = pct(lo, min, max)
  const hiPct = pct(hi, min, max)

  const fillStyle = single
    ? { left: '0%', width: `${hiPct}%` }
    : { left: `${loPct}%`, width: `${Math.max(0, hiPct - loPct)}%` }

  return (
    <div className={cn('py-2', className)}>
      {/*
        Row height matches the 48px tap target (WCAG 2.5.5) while the visible
        track stays 4px — the thumb is what the finger has to hit, and it fills
        this row.
      */}
      <div className="relative" style={{ height: 48 }}>
        {/* Track */}
        <div
          className="bg-border absolute rounded-full"
          style={{ left: 11, right: 11, top: '50%', height: 4, transform: 'translateY(-50%)' }}
        >
          <div
            className="bg-accent dark:bg-primary absolute rounded-full"
            style={{ ...fillStyle, height: '100%' }}
          />
        </div>

        {/*
          Both inputs span the row and overlap. Only their thumbs receive pointer
          events (see .range-slider-input), so the one you grab is whichever
          thumb is under the finger rather than whichever input is on top.
        */}
        <div className="absolute" style={{ left: 11, right: 11, top: 0, bottom: 0 }}>
          {!single && (
            <input
              type="range"
              className="range-slider-input"
              min={min}
              max={max}
              step={step}
              value={lo}
              aria-label={label ? `${label} — mínimo` : 'Valor mínimo'}
              onChange={(e) => {
                const next = Number(e.target.value)
                // Clamp instead of ignoring: dragging past the other thumb should
                // pin to it, not freeze the control.
                onChange([Math.min(next, hi), hi])
              }}
            />
          )}
          <input
            type="range"
            className="range-slider-input"
            min={min}
            max={max}
            step={step}
            value={hi}
            aria-label={label ? `${label} — máximo` : 'Valor máximo'}
            onChange={(e) => {
              const next = Number(e.target.value)
              onChange(single ? [lo, next] : [lo, Math.max(next, lo)])
            }}
          />
        </div>
      </div>

      {/* Labels */}
      <div className="text-muted-foreground mt-1 flex justify-between font-mono text-[11px]">
        {single ? (
          <>
            <span>{format(min)}</span>
            <span className="text-accent dark:text-primary font-medium">{format(hi)}</span>
            <span>{format(max)}</span>
          </>
        ) : (
          <>
            <span className="text-accent dark:text-primary font-medium">{format(lo)}</span>
            <span>—</span>
            <span className="text-accent dark:text-primary font-medium">{format(hi)}</span>
          </>
        )}
      </div>
    </div>
  )
}
