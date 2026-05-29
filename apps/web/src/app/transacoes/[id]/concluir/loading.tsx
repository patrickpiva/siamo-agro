function Bone({ className }: { className?: string }) {
  return <div className={`bg-muted animate-pulse rounded-md ${className ?? ''}`} />
}

export default function ConcluirLoading() {
  return (
    <div className="bg-background flex min-h-screen flex-col pb-24">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <Bone className="size-12 rounded-full" />
        <Bone className="h-5 w-36" />
        <div className="w-12" />
      </div>

      <div className="space-y-5 px-4 pt-2">
        {/* Participant cards side by side */}
        <div className="grid grid-cols-2 gap-3">
          <div className="border-border flex flex-col items-center gap-2 rounded-xl border p-4">
            <Bone className="size-12 rounded-full" />
            <Bone className="h-4 w-20" />
            <Bone className="h-5 w-16 rounded-full" />
          </div>
          <div className="border-border flex flex-col items-center gap-2 rounded-xl border p-4">
            <Bone className="size-12 rounded-full" />
            <Bone className="h-4 w-20" />
            <Bone className="h-5 w-16 rounded-full" />
          </div>
        </div>

        {/* Timer / countdown */}
        <Bone className="h-16 rounded-xl" />

        {/* Listing context */}
        <div className="border-border flex items-center gap-3 rounded-xl border p-3">
          <Bone className="size-12 flex-shrink-0 rounded-lg" />
          <div className="flex flex-1 flex-col gap-1.5">
            <Bone className="h-4 w-40" />
            <Bone className="h-3 w-24" />
          </div>
        </div>

        {/* Description */}
        <Bone className="h-4 w-full" />
        <Bone className="h-4 w-4/5" />
      </div>

      {/* CTA */}
      <div className="border-border bg-card fixed bottom-0 left-0 right-0 border-t px-4 pb-6 pt-4">
        <Bone className="h-[52px] rounded-xl" />
      </div>
    </div>
  )
}
