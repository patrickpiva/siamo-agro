function Bone({ className }: { className?: string }) {
  return <div className={`bg-muted animate-pulse rounded-md ${className ?? ''}`} />
}

export default function EditarPerfilLoading() {
  return (
    <div className="bg-background flex min-h-screen flex-col pb-[80px]">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3">
        <Bone className="size-12 rounded-full" />
        <Bone className="h-5 w-28" />
        <div className="w-12" />
      </header>

      {/* Avatar section */}
      <div className="flex flex-col items-center px-5 pb-5 pt-6">
        <Bone className="size-[96px] rounded-full" />
        <Bone className="mt-2 h-4 w-20" />
      </div>

      {/* Form fields */}
      <div className="space-y-4 px-5">
        {[
          { label: 'w-28', input: 'h-12' },
          { label: 'w-36', input: 'h-12' },
          { label: 'w-24', input: 'h-24' },
          { label: 'w-20', input: 'h-12' },
          { label: 'w-24', input: 'h-12' },
        ].map(({ label, input }, i) => (
          <div key={i}>
            <Bone className={`mb-2 h-3 ${label}`} />
            <Bone className={`rounded-xl ${input}`} />
          </div>
        ))}
      </div>

      {/* Save button */}
      <div className="border-border mt-6 border-t px-5 pb-6 pt-4">
        <Bone className="h-[52px] rounded-xl" />
      </div>
    </div>
  )
}
