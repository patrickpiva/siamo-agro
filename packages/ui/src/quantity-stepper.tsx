'use client'

import { useRef, useEffect } from 'react'
import { cn } from './lib/utils'

interface QuantityStepperProps {
  value: number
  onChange: (n: number) => void
  min?: number
  max?: number
  step?: number
  unit: string
  className?: string
}

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max,
  step = 1,
  unit,
  className,
}: QuantityStepperProps) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  // Always hold the latest value so the interval never reads a stale closure
  const valueRef = useRef(value)
  useEffect(() => {
    valueRef.current = value
  }, [value])

  function clamp(n: number) {
    let v = n
    if (v < min) v = min
    if (max != null && v > max) v = max
    return v
  }

  function stopRepeat() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  function startRepeat(delta: number) {
    // Fire once immediately on press, then repeat while held
    onChange(clamp(valueRef.current + delta * step))

    intervalRef.current = setInterval(() => {
      onChange(clamp(valueRef.current + delta * step))
    }, 150)
  }

  const canDec = value > min
  const canInc = max == null || value < max

  return (
    <div
      className={cn(
        'border-accent bg-card dark:border-primary flex items-center overflow-hidden rounded-[12px] border',
        className,
      )}
    >
      <button
        type="button"
        disabled={!canDec}
        onPointerDown={() => canDec && startRepeat(-1)}
        onPointerUp={stopRepeat}
        onPointerLeave={stopRepeat}
        aria-label="Diminuir quantidade"
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
        className="bg-muted px-[18px] py-[14px] text-[20px] leading-none disabled:opacity-40"
      >
        −
      </button>

      <span className="flex-1 text-center font-mono text-[17px] font-medium">{value}</span>

      <span className="text-muted-foreground pr-[10px] text-[13px]">{unit}</span>

      <button
        type="button"
        disabled={!canInc}
        onPointerDown={() => canInc && startRepeat(1)}
        onPointerUp={stopRepeat}
        onPointerLeave={stopRepeat}
        aria-label="Aumentar quantidade"
        className="bg-muted px-[18px] py-[14px] text-[20px] leading-none disabled:opacity-40"
      >
        +
      </button>
    </div>
  )
}
