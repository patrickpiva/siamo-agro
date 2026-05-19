interface OwnerStatsProps {
  views: number
  proposals: number
  matches: number
}

export function OwnerStats({ views, proposals, matches }: OwnerStatsProps) {
  return (
    <div className="grid grid-cols-3 gap-2 px-4 py-4">
      <StatCard value={views} label="visualizações" />
      <StatCard value={proposals} label="propostas" />
      <StatCard value={matches} label="matches" />
    </div>
  )
}

function StatCard({ value, label }: { value: number; label: string }) {
  return (
    <div className="bg-card border-border flex flex-col items-center rounded-[10px] border px-3 py-[14px] text-center">
      <span className="text-accent mb-[6px] font-mono text-[22px] font-bold leading-none">
        {value}
      </span>
      <span className="text-muted-foreground text-[10px] leading-snug">{label}</span>
    </div>
  )
}
