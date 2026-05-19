import * as React from 'react'
import type { IconProps } from '../index'

/**
 * Tractor — trator agrícola (silhueta lateral)
 * Uso: categoria TRACTOR, EQUIPMENT em geral.
 */
export const Tractor = React.forwardRef<SVGSVGElement, IconProps>(
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
      <circle cx="7" cy="17" r="3" />
      <circle cx="7" cy="17" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="17" cy="17" r="2.2" />
      <circle cx="17" cy="17" r="0.6" fill="currentColor" stroke="none" />
      <path d="M2 14h4V9h5l3 5h5v3" />
      <path d="M11 9V6h2v3" />
    </svg>
  ),
)
Tractor.displayName = 'Tractor'
