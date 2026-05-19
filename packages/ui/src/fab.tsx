import * as React from 'react'
import { cn } from './lib/utils'

interface FABProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  className?: string
}

export function FAB({ children, className, ...props }: FABProps) {
  return (
    <button
      type="button"
      className={cn(
        'fixed bottom-24 right-5 z-50',
        'flex size-14 items-center justify-center rounded-full',
        'bg-cta-bg text-cta-fg',
        'shadow-[0_8px_20px_rgba(10,10,10,0.25)] dark:shadow-[0_8px_20px_rgba(198,232,69,0.3)]',
        'transition-transform active:scale-95',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
