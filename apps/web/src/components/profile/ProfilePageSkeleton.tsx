import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'

export function ProfilePageSkeleton() {
  return (
    <div className="flex min-h-svh flex-col">
      {/* Header skeleton */}
      <div className="flex flex-col gap-4 p-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
        <div className="flex gap-6">
          <Skeleton className="h-10 w-16" />
          <Skeleton className="h-10 w-16" />
          <Skeleton className="h-10 w-16" />
        </div>
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-16 w-full" />
      </div>

      <Separator />

      {/* Tabs skeleton */}
      <div className="p-4">
        <div className="mb-4 flex gap-2">
          <Skeleton className="h-9 flex-1 rounded-md" />
          <Skeleton className="h-9 flex-1 rounded-md" />
          <Skeleton className="h-9 flex-1 rounded-md" />
        </div>
        <div className="flex flex-col gap-3">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      </div>
    </div>
  )
}
