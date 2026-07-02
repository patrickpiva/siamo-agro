import { ListingCardSkeleton } from '@agraia/ui'

function Bone({ className }: { className?: string }) {
  return <div className={`bg-muted animate-pulse rounded-md ${className ?? ''}`} />
}

export default function ExplorarLoading() {
  return (
    <main className="bg-background min-h-screen">
      <div className="flex items-start justify-between px-5 pb-3 pt-4">
        <div className="flex flex-col gap-1.5">
          <Bone className="h-2.5 w-28" />
          <Bone className="h-7 w-44" />
        </div>
        <div className="flex gap-2">
          <Bone className="size-[44px] rounded-full" />
          <Bone className="size-[44px] rounded-full" />
        </div>
      </div>

      <div className="flex gap-2 px-5 pb-4">
        <Bone className="h-8 w-[120px] rounded-full" />
        <Bone className="h-8 w-[80px] rounded-full" />
        <Bone className="h-8 w-[64px] rounded-full" />
        <Bone className="h-8 w-[64px] rounded-full" />
      </div>

      <div className="grid grid-cols-2 gap-3 px-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <ListingCardSkeleton key={i} />
        ))}
      </div>
    </main>
  )
}
