'use client'

import * as React from 'react'
import { cn } from './lib/utils'

interface BottomCTAProps {
  children: React.ReactNode
  className?: string
  /** Remove a borda superior (ex: landing page sem header) */
  borderless?: boolean
}

/**
 * BottomCTA — área fixa no rodapé de cada tela com os botões de ação.
 * Padding 16px top / 24px bottom para safe area implícita.
 */
export function BottomCTA({ children, className, borderless = false }: BottomCTAProps) {
  return (
    <div
      className={cn(
        'flex flex-shrink-0 flex-col gap-3 px-5 pb-6 pt-4',
        !borderless && 'border-border border-t',
        className,
      )}
    >
      {children}
    </div>
  )
}
