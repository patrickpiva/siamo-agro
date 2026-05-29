function Bone({ className }: { className?: string }) {
  return <div className={`bg-muted animate-pulse rounded-md ${className ?? ''}`} />
}

function GroupSkeleton({ rows, labelWidth }: { rows: number; labelWidth: string }) {
  return (
    <div className="space-y-1">
      <Bone className={`mb-2 h-3 ${labelWidth}`} />
      {Array.from({ length: rows }).map((_, i) => (
        <Bone key={i} className="h-[52px] rounded-xl" />
      ))}
    </div>
  )
}

export default function ConfiguracoesLoading() {
  return (
    <div className="bg-background min-h-screen pb-[80px]">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3">
        <Bone className="size-12 rounded-full" />
        <Bone className="h-5 w-28" />
        <div className="w-12" />
      </header>

      <div className="space-y-5 px-4 py-2">
        {/* Profile strip */}
        <div className="border-border bg-card flex items-center gap-3 rounded-xl border p-4">
          <Bone className="size-12 rounded-full" />
          <div className="flex flex-1 flex-col gap-1.5">
            <Bone className="h-4 w-32" />
            <Bone className="h-3 w-24" />
          </div>
          <Bone className="h-6 w-14 rounded-full" />
        </div>

        <GroupSkeleton rows={3} labelWidth="w-16" />
        <GroupSkeleton rows={2} labelWidth="w-24" />
        <GroupSkeleton rows={2} labelWidth="w-20" />
        <GroupSkeleton rows={2} labelWidth="w-16" />
      </div>
    </div>
  )
}
