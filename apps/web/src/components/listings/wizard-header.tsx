'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, X } from '@agrolink/ui/icons'
import { cn } from '@agrolink/ui'

interface WizardHeaderProps {
  title: string
  onBack?: () => void
  onClose?: () => void
  rightSlot?: React.ReactNode
  className?: string
}

export function WizardHeader({ title, onBack, onClose, rightSlot, className }: WizardHeaderProps) {
  const router = useRouter()

  function handleBack() {
    if (onBack) onBack()
    else router.back()
  }

  function handleClose() {
    if (onClose) onClose()
  }

  return (
    <div className={cn('flex flex-shrink-0 items-center justify-between px-4 py-3', className)}>
      <button
        type="button"
        onClick={handleBack}
        aria-label="Voltar"
        className="bg-muted flex size-[48px] items-center justify-center rounded-full"
      >
        <ArrowLeft size={18} strokeWidth={1.8} />
      </button>

      <span className="flex-1 text-center text-[15px] font-medium">{title}</span>

      {rightSlot ?? (
        <button
          type="button"
          onClick={handleClose}
          aria-label="Fechar"
          className="bg-muted flex size-[48px] items-center justify-center rounded-full"
        >
          <X size={18} strokeWidth={1.8} />
        </button>
      )}
    </div>
  )
}
