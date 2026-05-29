export default function Loading() {
  return (
    <div className="bg-background flex min-h-dvh items-center justify-center">
      <div className="flex flex-col items-center gap-5">
        <span className="font-mono text-[22px] font-medium tracking-tight">[AgraIA]</span>
        <div className="splash-spinner" />
      </div>
    </div>
  )
}
