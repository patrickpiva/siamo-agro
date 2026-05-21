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
}

function pct(value: number, min: number, max: number) {
  return ((value - min) / (max - min)) * 100
}

export function RangeSlider({
  min,
  max,
  value,
  onChange,
  step = 1,
  format = (v) => String(v),
  single = false,
  className,
}: RangeSliderProps) {
  const [lo, hi] = value
  const loPct = pct(lo, min, max)
  const hiPct = pct(hi, min, max)

  const trackStyle = single
    ? { left: '0%', width: `${hiPct}%` }
    : { left: `${loPct}%`, width: `${hiPct - loPct}%` }

  return (
    <div className={cn('py-2', className)}>
      {/* Track */}
      <div className="relative mx-[11px]">
        <div className="bg-border relative h-1 rounded-full">
          <div
            className="bg-accent dark:bg-primary absolute h-full rounded-full"
            style={trackStyle}
          />
        </div>

        {/* Lower thumb (hidden in single mode) */}
        {!single && (
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={lo}
            aria-label="Valor mínimo"
            aria-valuemin={min}
            aria-valuemax={hi}
            aria-valuenow={lo}
            onChange={(e) => {
              const next = Number(e.target.value)
              if (next < hi) onChange([next, hi])
            }}
            className="range-thumb-input pointer-events-none absolute inset-0 h-full w-full opacity-0"
            style={{ zIndex: lo > max - (max - min) * 0.1 ? 5 : 3 }}
          />
        )}

        {/* Upper thumb */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={hi}
          aria-label={single ? 'Valor máximo' : 'Valor máximo'}
          aria-valuemin={single ? min : lo}
          aria-valuemax={max}
          aria-valuenow={hi}
          onChange={(e) => {
            const next = Number(e.target.value)
            if (single || next > lo) onChange([lo, next])
          }}
          className="range-thumb-input absolute inset-0 h-full w-full opacity-0"
          style={{ zIndex: 4 }}
        />

        {/* Visual thumbs */}
        {!single && (
          <div
            className="bg-foreground border-background pointer-events-none absolute top-1/2 size-[22px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] shadow-sm"
            style={{ left: `${loPct}%` }}
          />
        )}
        <div
          className="bg-foreground border-background pointer-events-none absolute top-1/2 size-[22px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] shadow-sm"
          style={{ left: `${hiPct}%` }}
        />
      </div>

      {/* Labels */}
      <div className="text-muted-foreground mt-3 flex justify-between font-mono text-[11px]">
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
