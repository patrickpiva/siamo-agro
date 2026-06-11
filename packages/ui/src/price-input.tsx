'use client'

import { useState } from 'react'
import { cn } from './lib/utils'

function centsToDisplay(cents: number): string {
  const reais = Math.floor(cents / 100)
  const centavos = cents % 100
  return `${reais.toLocaleString('pt-BR')},${String(centavos).padStart(2, '0')}`
}

interface PriceInputProps {
  value: number | null
  onChange: (cents: number | null) => void
  placeholder?: string
  disabled?: boolean
  ariaLabel?: string
  className?: string
}

export function PriceInput({
  value,
  onChange,
  placeholder = '0,00',
  disabled,
  ariaLabel,
  className,
}: PriceInputProps) {
  const [focused, setFocused] = useState(false)
  const displayValue = value !== null && value > 0 ? centsToDisplay(value) : ''

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace') {
      e.preventDefault()
      if (!value) return
      const next = Math.floor(value / 10)
      onChange(next === 0 ? null : next)
      return
    }
    if (e.key >= '0' && e.key <= '9') {
      e.preventDefault()
      const digit = parseInt(e.key, 10)
      const current = value ?? 0
      const next = current * 10 + digit
      if (next <= 999_999_999) onChange(next)
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/[^0-9]/g, '')
    if (!digits) {
      onChange(null)
      return
    }
    const cents = parseInt(digits, 10)
    if (cents <= 999_999_999) onChange(cents)
  }

  return (
    <div
      className={cn(
        'bg-card flex items-center gap-3 rounded-[12px] border-[1.5px] px-4 py-[14px]',
        focused ? 'border-accent' : 'border-border',
        disabled && 'opacity-50',
        className,
      )}
    >
      <span className="border-border text-muted-foreground border-r pr-[10px] font-mono text-[15px]">
        R$
      </span>
      <input
        type="text"
        inputMode="numeric"
        value={displayValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        disabled={disabled}
        aria-label={ariaLabel}
        className="text-accent placeholder:text-muted-foreground flex-1 bg-transparent font-mono text-[17px] font-medium outline-none"
      />
    </div>
  )
}
