import { Star } from 'lucide-react'
import { EmptyState } from '@agrolink/ui'

/**
 * Shown inside a listing's matches panel while the match job is still pending.
 * matchJobs.status === 'pending' (typically < 5 min after publication).
 */
export function MatchesCalculating() {
  return (
    <EmptyState
      icon={<Star size={28} strokeWidth={1.3} />}
      iconVariant="muted"
      title="Calculando matches…"
      description="O algoritmo busca compatibilidades automaticamente. Resultados aparecem em até 5 minutos após publicação."
    />
  )
}
