function Bone({ className }: { className?: string }) {
  return <div className={`bg-muted animate-pulse rounded-md ${className ?? ''}`} />
}

export default function AvaliarLoading() {
  return (
    <div className="bg-background min-h-screen pb-24">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <Bone className="size-12 rounded-full" />
        <Bone className="h-5 w-28" />
        <div className="w-12" />
      </div>

      <div className="flex flex-col items-center px-5 pt-4">
        {/* Counterpart avatar + name */}
        <Bone className="size-[72px] rounded-full" />
        <Bone className="mt-3 h-5 w-36" />
        <Bone className="mt-1.5 h-4 w-48" />

        {/* Star row */}
        <div className="mt-6 flex gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Bone key={i} className="size-9 rounded-full" />
          ))}
        </div>

        {/* Category ratings */}
        <div className="mt-6 w-full space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <Bone className="h-4 w-28" />
              <div className="flex gap-2">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Bone key={j} className="size-6 rounded-full" />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Comment field */}
        <Bone className="mt-5 h-[100px] w-full rounded-xl" />
      </div>
    </div>
  )
}
