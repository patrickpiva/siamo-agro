'use client'

import * as React from 'react'
import { cn } from './lib/utils'

const OTP_LENGTH = 6

interface OTPInputProps {
  value: string
  onChange: (value: string) => void
  onComplete?: (value: string) => void
  disabled?: boolean
  error?: boolean
}

/**
 * OTPInput — 6 células para código de verificação.
 * Auto-avança ao digitar, paste-aware, foco gerenciado por ref.
 */
export function OTPInput({ value, onChange, onComplete, disabled, error }: OTPInputProps) {
  const inputRefs = React.useRef<Array<HTMLInputElement | null>>([])

  const digits = value.padEnd(OTP_LENGTH, '').slice(0, OTP_LENGTH).split('')

  function focusIndex(index: number) {
    inputRefs.current[Math.max(0, Math.min(index, OTP_LENGTH - 1))]?.focus()
  }

  function handleChange(index: number, e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, '')
    if (!raw) return

    const newDigits = [...digits]
    // Suporte a paste: preenche múltiplas células
    const chars = raw.split('').slice(0, OTP_LENGTH - index)
    chars.forEach((ch: string, i: number) => {
      newDigits[index + i] = ch
    })

    const next = newDigits.join('').slice(0, OTP_LENGTH)
    onChange(next)

    const nextFocus = Math.min(index + chars.length, OTP_LENGTH - 1)
    focusIndex(nextFocus)

    if (next.length === OTP_LENGTH) onComplete?.(next)
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace') {
      if (digits[index]) {
        const newDigits = [...digits]
        newDigits[index] = ''
        onChange(newDigits.join(''))
      } else if (index > 0) {
        const newDigits = [...digits]
        newDigits[index - 1] = ''
        onChange(newDigits.join(''))
        focusIndex(index - 1)
      }
      e.preventDefault()
    } else if (e.key === 'ArrowLeft' && index > 0) {
      focusIndex(index - 1)
    } else if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      focusIndex(index + 1)
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH)
    onChange(pasted)
    focusIndex(Math.min(pasted.length, OTP_LENGTH - 1))
    if (pasted.length === OTP_LENGTH) onComplete?.(pasted)
  }

  return (
    <div
      className="flex justify-between gap-2"
      role="group"
      aria-label="Código de verificação de 6 dígitos"
    >
      {Array.from({ length: OTP_LENGTH }).map((_, i) => {
        const filled = !!digits[i]
        const isCurrent = value.length === i

        return (
          <input
            key={i}
            ref={(el) => {
              inputRefs.current[i] = el
            }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            size={1}
            value={digits[i] ?? ''}
            onChange={(e) => handleChange(i, e)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            disabled={disabled}
            aria-label={`Dígito ${i + 1}`}
            aria-invalid={error}
            className={cn(
              'h-14 w-[52px] flex-none rounded-[10px] border text-center font-mono text-[22px] font-medium',
              'transition-colors focus:outline-none',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'min-h-0',
              error
                ? 'border-destructive bg-destructive/5 text-destructive'
                : filled
                  ? 'border-accent-forest dark:border-accent-lime bg-primary-subtle dark:bg-accent-lime/[0.06] text-accent-forest dark:text-accent-lime border-[1.5px]'
                  : isCurrent
                    ? 'border-accent-forest dark:border-accent-lime bg-bg-elevated border-[1.5px]'
                    : 'border-border bg-bg-elevated text-foreground',
            )}
          />
        )
      })}
    </div>
  )
}
