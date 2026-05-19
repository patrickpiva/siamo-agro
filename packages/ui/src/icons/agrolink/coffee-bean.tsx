import * as React from 'react'
import type { IconProps } from '../index'

/**
 * CoffeeBean — grão de café arábica
 * Uso: categoria COFFEE em listings, hero illustration de A1.
 */
export const CoffeeBean = React.forwardRef<SVGSVGElement, IconProps>(
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
      <ellipse cx="12" cy="12" rx="5" ry="8.5" />
      <path d="M12 4c-1.2 3-1.2 13 0 16" />
    </svg>
  ),
)
CoffeeBean.displayName = 'CoffeeBean'
