import * as React from 'react'
import type { IconProps } from '../index'

/**
 * Cattle — cara de vaca estilizada
 * Uso: categorias LIVESTOCK, DAIRY, VETERINARY.
 */
export const Cattle = React.forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, strokeWidth = 1.8, className, ...props }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path d="M5 8c0-2 1-3 3-3l1.5 2.5L12 6l2.5 1.5L16 5c2 0 3 1 3 3v3c0 4-3 7-7 7s-7-3-7-7V8z" />
      <circle cx="9.5" cy="12" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="12" r="0.9" fill="currentColor" stroke="none" />
      <path d="M10.5 15.5c.4.6 1 1 1.5 1s1.1-.4 1.5-1" />
    </svg>
  ),
)
Cattle.displayName = 'Cattle'
