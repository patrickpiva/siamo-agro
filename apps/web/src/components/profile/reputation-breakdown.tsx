interface ReputationBreakdownProps {
  reliability: number
  communication: number
  quality: number
}

interface BarRowProps {
  label: string
  value: number
}

function BarRow({ label, value }: BarRowProps) {
  const pct = Math.round((value / 5) * 100)
  return (
    <div className="flex items-center gap-[10px]">
      <span className="text-muted-foreground w-[110px] shrink-0 text-[11px]">{label}</span>
      <div className="rep-bar-track h-[4px] flex-1 overflow-hidden rounded-full">
        <div
          className="bg-accent dark:bg-primary h-full rounded-full"
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemax={5}
          aria-label={label}
        />
      </div>
      <span className="text-accent dark:text-primary w-6 text-right font-mono text-[11px] font-medium">
        {value.toFixed(1)}
      </span>
    </div>
  )
}

export function ReputationBreakdown({
  reliability,
  communication,
  quality,
}: ReputationBreakdownProps) {
  return (
    <div className="px-5 pb-4">
      <p className="text-muted-foreground mb-3 font-mono text-[11px] tracking-[0.4px]">
        [DETALHES DA REPUTAÇÃO]
      </p>
      <div className="flex flex-col gap-2">
        <BarRow label="Confiabilidade" value={reliability} />
        <BarRow label="Comunicação" value={communication} />
        <BarRow label="Qualidade" value={quality} />
      </div>
    </div>
  )
}
