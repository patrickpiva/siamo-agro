interface FoldHintProps {
  label: string
}

/** Dica discreta de que há conteúdo abaixo da dobra (ex.: "↓ SEU NEGÓCIO"). */
export function FoldHint({ label }: FoldHintProps) {
  return (
    <div className="py-7 text-center">
      <span className="font-mono text-[10px] tracking-[1px] text-[#B0B0A5] dark:text-[#4A4A42]">
        {label}
      </span>
    </div>
  )
}
