import * as React from 'react'
import type { IconProps } from '../index'

/**
 * Soybean — vagem de soja com sementes visíveis
 * Uso: categorias SOY, GRAINS.
 */
export const Soybean = React.forwardRef<SVGSVGElement, IconProps>(
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
      <ellipse cx="12" cy="13.5" rx="5.5" ry="7" />
      <path d="M12 2v4.5" />
      <path d="M8.5 7c-1.5-1-3.5-.5-4 1" />
      <path d="M15.5 7c1.5-1 3.5-.5 4 1" />
      <circle cx="10" cy="12" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="14" cy="12" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="12" cy="16" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  ),
)
Soybean.displayName = 'Soybean'
