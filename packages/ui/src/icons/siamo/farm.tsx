import * as React from 'react'
import type { IconProps } from '../index'

export const Farm = React.forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, strokeWidth = 2, className, ...props }, ref) => (
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
      <path d="M22 12H2l2-6 8-4 8 4Z" />
      <rect width="4" height="4" x="10" y="8" />
      <path d="m7 22 10-10v10L7 12Z" />
      <path d="M21 12v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-8" />
    </svg>
  ),
)
Farm.displayName = 'Farm'
