import Link from 'next/link'
import { Camera } from '@siamo/ui/icons'
import { ReputationSeal, getInitials } from '@siamo/ui'

interface RepStats {
  transactions: number
  ratings: number
  responseTime: string
}

interface ProfileHeroProps {
  name: string
  photo?: string | null
  profileType: 'PRODUCER' | 'PROVIDER'
  badge: 'NONE' | 'BRONZE' | 'SILVER' | 'GOLD'
  currentRating: number
  ratingCount: number
  location?: { city: string; state: string } | null
  joinedAt?: Date | null
  stats: RepStats
  showEditOverlay?: boolean
}

const TYPE_LABEL: Record<string, string> = {
  PRODUCER: 'Produtor Rural',
  PROVIDER: 'Prestador de Serviços',
}

function formatJoinedAt(joinedAt: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - joinedAt.getTime()
  const diffMonths = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30.44))
  const years = Math.floor(diffMonths / 12)
  if (years >= 1) return `no AgraIA há ${years} ${years === 1 ? 'ano' : 'anos'}`
  if (diffMonths >= 1) return `no AgraIA há ${diffMonths} ${diffMonths === 1 ? 'mês' : 'meses'}`
  return 'no AgraIA há menos de 1 mês'
}

export function ProfileHero({
  name,
  photo,
  profileType,
  badge,
  currentRating,
  ratingCount,
  location,
  joinedAt,
  stats,
  showEditOverlay = false,
}: ProfileHeroProps) {
  const initials = getInitials(name)

  return (
    <>
      {/* Avatar + seal + score */}
      <div className="px-6 pb-5 pt-6 text-center">
        {/* Avatar */}
        <div className="relative mx-auto mb-3 size-[88px]">
          <div className="border-primary bg-accent flex h-full w-full items-center justify-center overflow-hidden rounded-full border-[2.5px]">
            {photo ? (
              <img src={photo} alt={name} className="h-full w-full object-cover" />
            ) : (
              <span className="text-accent-foreground select-none text-[30px] font-medium leading-none">
                {initials}
              </span>
            )}
          </div>
          {showEditOverlay && (
            <Link
              href="/perfil/editar"
              aria-label="Editar foto de perfil"
              className="bg-primary border-background absolute bottom-[-2px] right-[-2px] flex size-[28px] items-center justify-center rounded-full border-2"
            >
              <Camera size={13} strokeWidth={2} className="text-primary-foreground" />
            </Link>
          )}
        </div>

        {/* Reputation seal */}
        {badge !== 'NONE' && <ReputationSeal tier={badge} className="mb-2" />}

        {/* Score — show dash when no ratings yet */}
        <p className="text-primary font-mono text-[40px] font-medium leading-none">
          {ratingCount === 0 ? '—' : currentRating.toFixed(1)}
        </p>
        <p className="text-muted-foreground mt-1 text-[18px] font-medium">{name}</p>
        <p className="text-muted-foreground mt-[2px] text-[12px]">
          {TYPE_LABEL[profileType]}
          {location ? ` · ${location.city}, ${location.state}` : ''}
          {joinedAt ? ` · ${formatJoinedAt(joinedAt)}` : ''}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2 px-5 pb-4">
        <StatCard value={String(stats.transactions)} label="Transações" />
        <StatCard value={String(stats.ratings)} label="Avaliações" />
        <StatCard value={stats.responseTime} label="Resp. média" />
      </div>
    </>
  )
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="bg-card border-border rounded-[10px] border px-2 py-[10px] text-center">
      <p className="text-primary font-mono text-[16px] font-medium">{value}</p>
      <p className="text-muted-foreground mt-[2px] text-[9px] leading-[1.3]">{label}</p>
    </div>
  )
}
