import { ScreenHeader } from '@/components/layout/screen-header'

function Bone({ className }: { className?: string }) {
  return <div className={`bg-muted animate-pulse rounded-md ${className ?? ''}`} />
}

export default function ListingLoading() {
  return (
    <div className="bg-background flex min-h-screen flex-col pb-24">
      {/* Header */}
      <ScreenHeader
        left={<Bone className="size-12 rounded-full" />}
        right={
          <>
            <Bone className="size-12 rounded-full" />
            <Bone className="size-12 rounded-full" />
          </>
        }
      />

      {/* Hero */}
      <Bone className="mx-4 h-[220px] rounded-[14px]" />

      {/* Content */}
      <div className="px-5 pt-4">
        {/* Category chip */}
        <Bone className="mb-2 h-5 w-16 rounded-[4px]" />

        {/* Title */}
        <Bone className="mb-1 h-6 w-4/5" />
        <Bone className="mb-4 h-6 w-3/5" />

        {/* Location + time */}
        <Bone className="mb-5 h-4 w-48" />

        {/* Price block */}
        <Bone className="mb-5 h-[72px] rounded-xl" />

        {/* Description header */}
        <Bone className="mb-2 h-4 w-20" />
        {/* Description lines */}
        <Bone className="mb-1.5 h-4 w-full" />
        <Bone className="mb-1.5 h-4 w-11/12" />
        <Bone className="mb-5 h-4 w-3/4" />

        {/* Seller card */}
        <Bone className="h-[120px] rounded-xl" />
      </div>
    </div>
  )
}
