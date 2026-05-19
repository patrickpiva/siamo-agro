import * as React from 'react'
import type { IconProps } from '../index'

/**
 * Irrigation — gota d'água com ondas (irrigação)
 * Uso: categorias IRRIGATION, IRRIGATION_SYSTEM.
 */
export const Irrigation = React.forwardRef<SVGSVGElement, IconProps>(
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
      <path d="M12 2L8 8c-1 2-1.5 3.5-1.5 5a5.5 5.5 0 0011 0c0-1.5-.5-3-1.5-5L12 2z" />
      <path d="M9 15c.5 2 1.5 3 3 3" />
    </svg>
  ),
)
Irrigation.displayName = 'Irrigation'
