import * as React from 'react'
import type { IconProps } from '../index'

/**
 * Soil — camadas de solo com broto
 * Uso: categoria SOIL.
 */
export const Soil = React.forwardRef<SVGSVGElement, IconProps>(
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
      <path d="M3 16h18" />
      <path d="M3 20h18" />
      <path d="M12 16v-6" />
      <path d="M9 13c0-2 1.5-3.5 3-3.5s3 1.5 3 3.5" />
    </svg>
  ),
)
Soil.displayName = 'Soil'
