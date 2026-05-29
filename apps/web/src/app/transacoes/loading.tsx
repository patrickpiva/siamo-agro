function Bone({ className }: { className?: string }) {
  return <div className={`bg-muted animate-pulse rounded-md ${className ?? ''}`} />
}

export default function TransacoesLoading() {
  return (
    <div className="bg-background min-h-screen pb-24">
      {/* Header */}
      <div className="px-5 pb-3 pt-4">
        <Bone className="h-7 w-32" />
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 overflow-hidden px-5 pb-4">
        {[88, 72, 112, 88, 88].map((w, i) => (
          <Bone key={i} className={`h-8 w-[${w}px] flex-shrink-0 rounded-full`} />
        ))}
      </div>

      {/* Transaction cards */}
      <div className="space-y-3 px-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="border-border bg-card rounded-xl border p-4">
            <div className="mb-3 flex items-center gap-3">
              <Bone className="size-10 rounded-full" />
              <div className="flex flex-1 flex-col gap-1.5">
                <Bone className="h-4 w-36" />
                <Bone className="h-3 w-24" />
              </div>
              <Bone className="h-5 w-20 rounded-full" />
            </div>
            <Bone className="h-3 w-48" />
          </div>
        ))}
      </div>
    </div>
  )
}
