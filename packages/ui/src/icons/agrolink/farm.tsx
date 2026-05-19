import * as React from 'react'
import type { IconProps } from '../index'

/**
 * Farm — celeiro/propriedade rural
 * Uso: categoria PROPERTY.
 */
export const Farm = React.forwardRef<SVGSVGElement, IconProps>(
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
      <path d="M3 12L12 4l9 8v8a1 1 0 01-1 1H4a1 1 0 01-1-1v-8z" />
      <path d="M9 21v-8h6v8" />
    </svg>
  ),
)
Farm.displayName = 'Farm'
