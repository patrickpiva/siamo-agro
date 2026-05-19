import * as React from 'react'
import type { IconProps } from '../index'

/**
 * Agronomist — pessoa segurando uma folha/planta (agrônomo)
 * Uso: categorias AGRONOMY, CONSULTING. Ícone de "perfil prestador".
 */
export const Agronomist = React.forwardRef<SVGSVGElement, IconProps>(
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
      <circle cx="10" cy="6" r="3" />
      <path d="M4 21v-2c0-2.5 2.5-5 6-5s6 2.5 6 5v2" />
      <path d="M16 11c2-1 3-3 4-3-.5 2-1 4-3 5" />
      <path d="M18 9.5c-1 .5-2 1.5-2 3" />
    </svg>
  ),
)
Agronomist.displayName = 'Agronomist'
