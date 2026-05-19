import * as React from 'react'
import type { IconProps } from '../index'

/**
 * OfferKind — tipo "Oferta" (caixa com seta para cima)
 * Semântica: "estou oferecendo / vendendo algo"
 */
export const OfferKind = React.forwardRef<SVGSVGElement, IconProps>(
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
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M8 13l4-4 4 4" />
      <path d="M12 9v8" />
    </svg>
  ),
)
OfferKind.displayName = 'OfferKind'
