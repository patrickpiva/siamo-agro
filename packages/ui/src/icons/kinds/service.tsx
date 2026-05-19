import * as React from 'react'
import type { IconProps } from '../index'

/**
 * ServiceKind — tipo "Serviço" (prancheta com check)
 * Semântica: "ofereço ou contrato um serviço"
 */
export const ServiceKind = React.forwardRef<SVGSVGElement, IconProps>(
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
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <path d="M9 12l2 2 4-4" />
      <path d="M9 17h6" />
    </svg>
  ),
)
ServiceKind.displayName = 'ServiceKind'
