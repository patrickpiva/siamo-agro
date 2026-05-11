interface ProfileRatingProps {
  score: number
  count: number
  showCount?: boolean
}

export function ProfileRating({ score, count, showCount = true }: ProfileRatingProps) {
  if (count === 0) {
    return <span className="text-muted-foreground text-sm">Sem avaliações ainda</span>
  }

  const stars = Array.from({ length: 5 }, (_, i) => {
    if (i < Math.floor(score)) return 'full'
    if (i < score) return 'half'
    return 'empty'
  })

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center" aria-label={`${score.toFixed(1)} estrelas`}>
        {stars.map((type, i) => (
          <svg
            key={i}
            className={`h-4 w-4 ${type === 'empty' ? 'text-muted-foreground/30' : 'text-primary'}`}
            fill={
              type === 'half' ? 'url(#half)' : type === 'full' ? 'currentColor' : 'currentColor'
            }
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            {type === 'half' ? (
              <>
                <defs>
                  <linearGradient id="half">
                    <stop offset="50%" stopColor="currentColor" />
                    <stop offset="50%" stopColor="transparent" />
                  </linearGradient>
                </defs>
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </>
            ) : (
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            )}
          </svg>
        ))}
      </div>
      <span className="font-mono text-sm font-medium">{score.toFixed(1)}</span>
      {showCount && <span className="text-muted-foreground text-sm">({count} avaliações)</span>}
    </div>
  )
}
