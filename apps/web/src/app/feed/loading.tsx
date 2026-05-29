import { ListingCardSkeleton, Skeleton } from '@agraia/ui'

export default function FeedLoading() {
  return (
    <main className="bg-background min-h-screen">
      {/* Header */}
      <div className="flex items-start justify-between px-5 pb-3 pt-4">
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-2.5 w-28" />
          <Skeleton className="h-7 w-44" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="size-[44px] rounded-full" />
          <Skeleton className="size-[44px] rounded-full" />
        </div>
      </div>

      {/* Tab pills */}
      <div className="flex gap-2 px-5 pb-4">
        <Skeleton className="h-8 w-[120px] rounded-full" />
        <Skeleton className="h-8 w-[80px] rounded-full" />
        <Skeleton className="h-8 w-[64px] rounded-full" />
        <Skeleton className="h-8 w-[64px] rounded-full" />
      </div>

      {/* Card grid */}
      <div className="grid grid-cols-2 gap-3 px-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <ListingCardSkeleton key={i} />
        ))}
      </div>
    </main>
  )
}
