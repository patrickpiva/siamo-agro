interface QuestionHeroProps {
  eyebrow: string
  question: string
  /** Palavra final destacada com a cor de acento (ex.: "hoje?"). */
  accent: string
}

/**
 * Bloco dominante da primeira dobra. O `<h1>` é o elemento mais pesado da tela
 * (30px/700) — a saudação acima cede o protagonismo à decisão.
 */
export function QuestionHero({ eyebrow, question, accent }: QuestionHeroProps) {
  return (
    <div className="px-6 pt-6">
      <p className="text-accent dark:text-primary mb-2 font-mono text-[11px] font-medium tracking-[0.5px]">
        {eyebrow}
      </p>
      <h1 className="text-[30px] font-bold leading-[1.1] tracking-[-0.8px]">
        {question} <span className="text-accent dark:text-primary">{accent}</span>
      </h1>
    </div>
  )
}
