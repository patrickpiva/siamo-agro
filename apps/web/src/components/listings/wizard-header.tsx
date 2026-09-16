'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { X } from '@siamo/ui/icons'
import { ScreenHeader } from '@/components/layout/screen-header'

interface WizardHeaderProps {
  title: string
  onBack?: () => void
  onClose?: () => void
  rightSlot?: React.ReactNode
  className?: string
}

/**
 * The listing wizard's header: back on the left, a close (or custom) control on
 * the right. A thin wrapper over ScreenHeader so the wizard stays aligned with
 * every other screen and inherits the status-bar safe-area padding.
 */
export function WizardHeader({ title, onBack, onClose, rightSlot, className }: WizardHeaderProps) {
  const router = useRouter()

  return (
    <ScreenHeader
      onBack={onBack ?? (() => router.back())}
      title={title}
      right={
        rightSlot ?? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="bg-muted flex size-[48px] items-center justify-center rounded-full"
          >
            <X size={18} strokeWidth={1.8} />
          </button>
        )
      }
      {...(className ? { className } : {})}
    />
  )
}
