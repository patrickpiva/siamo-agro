function Bone({ className }: { className?: string }) {
  return <div className={`bg-muted animate-pulse rounded-md ${className ?? ''}`} />
}

export default function TransacaoDetalheLoading() {
  return (
    <div className="bg-background flex min-h-screen flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <Bone className="size-12 rounded-full" />
        <Bone className="h-5 w-32" />
        <Bone className="size-10 rounded-full" />
      </div>

      {/* Status banner */}
      <Bone className="mx-4 mb-3 h-10 rounded-xl" />

      {/* Listing context strip */}
      <div className="border-border mx-4 mb-4 flex items-center gap-3 rounded-xl border p-3">
        <Bone className="size-12 flex-shrink-0 rounded-lg" />
        <div className="flex flex-1 flex-col gap-1.5">
          <Bone className="h-4 w-40" />
          <Bone className="h-3 w-24" />
        </div>
      </div>

      {/* Proposal block */}
      <Bone className="mx-4 mb-4 h-[88px] rounded-xl" />

      {/* Chat messages area */}
      <div className="flex-1 space-y-3 px-4">
        <Bone className="ml-auto h-12 w-3/4 rounded-2xl rounded-br-sm" />
        <Bone className="h-16 w-3/4 rounded-2xl rounded-bl-sm" />
        <Bone className="ml-auto h-10 w-1/2 rounded-2xl rounded-br-sm" />
        <Bone className="h-10 w-2/3 rounded-2xl rounded-bl-sm" />
      </div>

      {/* Bottom action */}
      <div className="border-border border-t px-4 pb-6 pt-3">
        <Bone className="h-[52px] rounded-xl" />
      </div>
    </div>
  )
}
