import type { HTMLAttributes } from 'react'
import { cn } from '@siamo/ui'

function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('bg-muted animate-pulse rounded-md', className)} {...props} />
}

export { Skeleton }
