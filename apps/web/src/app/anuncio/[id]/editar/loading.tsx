function Bone({ className }: { className?: string }) {
  return <div className={`bg-muted animate-pulse rounded-md ${className ?? ''}`} />
}

export default function EditListingLoading() {
  return (
    <div className="bg-background min-h-screen pb-24">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3">
        <Bone className="size-12 rounded-full" />
        <Bone className="h-5 w-32" />
        <div className="w-12" />
      </header>

      <div className="space-y-5 px-5 pt-2">
        {/* Photo grid */}
        <div className="grid grid-cols-3 gap-2">
          <Bone className="aspect-square rounded-xl" />
          <Bone className="aspect-square rounded-xl" />
          <Bone className="aspect-square rounded-xl opacity-40" />
        </div>

        {/* Form fields: label + input */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Bone className="h-3 w-24" />
            <Bone className={`rounded-xl ${i === 2 ? 'h-24' : 'h-12'}`} />
          </div>
        ))}
      </div>
    </div>
  )
}
