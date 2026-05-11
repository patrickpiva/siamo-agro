'use client'

import { IMaskInput } from 'react-imask'
import { Label } from '@/components/ui/label'
import { cn } from '@agrolink/ui'

interface PhoneInputProps {
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  error?: string
  disabled?: boolean
}

export function PhoneInput({ value, onChange, onBlur, error, disabled }: PhoneInputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="phone-input">Telefone (WhatsApp)</Label>
      <IMaskInput
        id="phone-input"
        mask="+55 (00) 00000-0000"
        value={value}
        onAccept={(val: string) => {
          // Converte para E.164: +5511999990001
          const digits = val.replace(/\D/g, '')
          if (digits.length >= 2) {
            onChange(`+${digits}`)
          } else {
            onChange(val)
          }
        }}
        onBlur={onBlur}
        disabled={disabled}
        inputMode="tel"
        autoComplete="tel"
        placeholder="+55 (11) 99999-0001"
        className={cn(
          'border-input bg-background flex h-12 w-full rounded-md border px-3 py-2 text-base',
          'ring-offset-background placeholder:text-muted-foreground',
          'focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error && 'border-destructive focus-visible:ring-destructive',
        )}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? 'phone-error' : undefined}
      />
      {error && (
        <p id="phone-error" className="text-destructive text-sm" role="alert">
          {error}
        </p>
      )}
      <p className="text-muted-foreground text-xs">
        Você receberá um código de verificação via WhatsApp
      </p>
    </div>
  )
}
