'use client'

import * as React from 'react'
import { cn } from './lib/utils'

interface SectionLabelProps extends React.HTMLAttributes<HTMLParagraphElement> {
  optional?: boolean
}

/**
 * SectionLabel — label acima de inputs, em JetBrains Mono maiúsculo.
 * Uso: [NOME COMPLETO], [NÚMERO DO WHATSAPP] · OPCIONAL
 */
export function SectionLabel({ children, optional, className, ...props }: SectionLabelProps) {
  return (
    <p
      className={cn(
        'text-muted-foreground mb-2 font-mono text-[11px] uppercase tracking-[0.4px]',
        className,
      )}
      {...props}
    >
      [{children}
      {optional && (
        <span className="text-muted-foreground/70 normal-case tracking-normal"> · OPCIONAL</span>
      )}
      ]
    </p>
  )
}
