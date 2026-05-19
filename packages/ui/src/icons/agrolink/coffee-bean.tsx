import * as React from 'react'
import type { IconProps } from '../index'

export const CoffeeBean = React.forwardRef<SVGSVGElement, IconProps>(
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
      <path d="M4.05 19.95a11.24 8.585 135 0 0 15.9-15.9 11.24 8.585 135 0 0-15.9 15.9" />
      <path d="M19.8 4.2C20 14 4 10 4.2 19.8" />
    </svg>
  ),
)
CoffeeBean.displayName = 'CoffeeBean'
