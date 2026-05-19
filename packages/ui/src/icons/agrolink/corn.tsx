import * as React from 'react'
import type { IconProps } from '../index'

/**
 * Corn — espiga de milho com fileiras de grãos
 * Uso: categorias CORN, VEGETABLES.
 */
export const Corn = React.forwardRef<SVGSVGElement, IconProps>(
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
      <path d="M12 3v2" />
      <rect x="8" y="5" width="8" height="13" rx="4" />
      <line x1="8.5" y1="9.5" x2="15.5" y2="9.5" />
      <line x1="8.5" y1="13.5" x2="15.5" y2="13.5" />
      <path d="M9 5c-1.5 0-2.5.5-3 1.5" />
      <path d="M15 5c1.5 0 2.5.5 3 1.5" />
      <path d="M10 18c.5 1 1 1.5 2 1.5s1.5-.5 2-1.5" />
    </svg>
  ),
)
Corn.displayName = 'Corn'
