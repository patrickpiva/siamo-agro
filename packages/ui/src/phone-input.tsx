'use client'

import * as React from 'react'
import { cn } from './lib/utils'

interface PhoneInputProps {
  value: string
  onChange: (value: string) => void
  error?: string
  autoFocus?: boolean
  disabled?: boolean
}

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 2) return digits
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

/**
 * PhoneInput — input de telefone brasileiro com DDI +55 fixo.
 * Aplica máscara (XX) XXXXX-XXXX automaticamente.
 * O valor emitido via onChange é sempre o E.164: +55XXXXXXXXXXX
 */
export function PhoneInput({ value, onChange, error, autoFocus, disabled }: PhoneInputProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)

  const displayValue = React.useMemo(() => {
    const digits = value.replace(/\D/g, '').replace(/^55/, '')
    return formatPhone(digits)
  }, [value])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 11)
    onChange(`+55${digits}`)
  }

  const isFocused = autoFocus

  return (
    <div className="flex flex-col gap-1">
      <div
        className={cn(
          'flex items-center gap-2.5 rounded-md border px-4 py-[14px] transition-colors',
          'bg-bg-elevated',
          error
            ? 'border-destructive'
            : isFocused
              ? 'border-accent-lime bg-accent-lime/[0.04]'
              : 'border-border',
        )}
      >
        {/* DDI */}
        <div className="border-border flex flex-shrink-0 items-center gap-1.5 border-r pr-2.5">
          <span className="text-lg leading-none" role="img" aria-label="Brasil">
            🇧🇷
          </span>
          <span className="text-foreground font-mono text-[15px]">+55</span>
        </div>

        {/* Input */}
        <input
          ref={inputRef}
          type="tel"
          inputMode="numeric"
          placeholder="(XX) XXXXX-XXXX"
          value={displayValue}
          onChange={handleChange}
          autoFocus={autoFocus}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={error ? 'phone-error' : undefined}
          className={cn(
            'text-foreground placeholder:text-muted-foreground flex-1 bg-transparent font-mono text-base',
            'focus:outline-none disabled:cursor-not-allowed disabled:opacity-50',
            'min-h-0', // reset do min-height global de inputs
          )}
        />
      </div>

      {error && (
        <p id="phone-error" className="text-destructive text-xs" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
