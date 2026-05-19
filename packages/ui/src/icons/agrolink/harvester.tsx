import * as React from 'react'
import type { IconProps } from '../index'

/**
 * Harvester — colheitadeira (silhueta lateral)
 * Uso: categoria HARVESTER, EQUIPMENT.
 */
export const Harvester = React.forwardRef<SVGSVGElement, IconProps>(
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
      <rect x="2" y="10" width="13" height="7" rx="1" />
      <circle cx="5.5" cy="17" r="2.5" />
      <circle cx="5.5" cy="17" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="13" cy="17" r="2" />
      <circle cx="13" cy="17" r="0.6" fill="currentColor" stroke="none" />
      <path d="M15 13h4l2-3h-3" />
      <path d="M5 10V8h6l2 2" />
    </svg>
  ),
)
Harvester.displayName = 'Harvester'
