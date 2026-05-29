function Bone({ className }: { className?: string }) {
  return <div className={`bg-muted animate-pulse rounded-md ${className ?? ''}`} />
}

export default function MeuPerfilLoading() {
  return (
    <div className="bg-background min-h-screen pb-24">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="w-12" />
        <Bone className="h-5 w-24" />
        <div className="flex gap-2">
          <Bone className="size-11 rounded-full" />
          <Bone className="size-11 rounded-full" />
        </div>
      </div>

      {/* Profile hero */}
      <div className="flex flex-col items-center px-5 pb-5 pt-2">
        <Bone className="size-[88px] rounded-full" />
        <Bone className="mt-3 h-6 w-40" />
        <Bone className="mt-1.5 h-4 w-24 rounded-full" />
        <Bone className="mt-2 h-4 w-32" />

        {/* Stats row */}
        <div className="mt-4 flex w-full justify-around">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <Bone className="h-6 w-10" />
              <Bone className="h-3 w-16" />
            </div>
          ))}
        </div>
      </div>

      {/* Reputation section */}
      <div className="border-border border-t px-5 py-4">
        <Bone className="mb-3 h-4 w-32" />
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Bone key={i} className="h-[72px] rounded-xl" />
          ))}
        </div>
      </div>

      {/* Active listings */}
      <div className="border-border border-t px-5 py-4">
        <Bone className="mb-3 h-4 w-28" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Bone key={i} className="h-[120px] rounded-xl" />
          ))}
        </div>
      </div>

      {/* Reviews */}
      <div className="border-border border-t px-5 py-4">
        <Bone className="mb-3 h-4 w-24" />
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="border-border rounded-xl border p-4">
              <div className="mb-2 flex items-center gap-2">
                <Bone className="size-8 rounded-full" />
                <Bone className="h-4 w-28" />
              </div>
              <Bone className="h-3 w-full" />
              <Bone className="mt-1.5 h-3 w-4/5" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
