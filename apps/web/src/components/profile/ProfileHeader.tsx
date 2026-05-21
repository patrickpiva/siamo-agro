import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { getInitials } from '@agrolink/ui'
import { ProfileBadge } from './ProfileBadge'
import { ProfileRating } from './ProfileRating'
import type { ProfileData } from '@/lib/profile-mock'

interface ProfileHeaderProps {
  profile: ProfileData
  isOwn?: boolean
  onEditClick?: () => void
}

const PROFILE_TYPE_LABEL: Record<string, string> = {
  PRODUCER: 'Produtor Rural',
  PROVIDER: 'Prestador de Serviço',
}

export function ProfileHeader({ profile, isOwn, onEditClick }: ProfileHeaderProps) {
  const initials = getInitials(profile.name)

  const memberSince = new Date(profile.memberSince).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="ring-border h-20 w-20 ring-2">
            {profile.photoUrl ? (
              <AvatarImage src={profile.photoUrl} alt={`Foto de ${profile.name}`} />
            ) : null}
            <AvatarFallback className="text-xl">{initials}</AvatarFallback>
          </Avatar>

          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-bold">{profile.name}</h1>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-muted-foreground text-sm">
                {PROFILE_TYPE_LABEL[profile.type] ?? profile.type}
              </span>
              <ProfileBadge tier={profile.badge} />
            </div>
          </div>
        </div>

        {isOwn && onEditClick && (
          <button
            type="button"
            onClick={onEditClick}
            className="bg-card hover:bg-muted flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-colors"
            aria-label="Editar perfil"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="flex gap-6">
        <div className="flex flex-col items-center">
          <span className="font-mono text-lg font-bold">{profile.completedTransactions}</span>
          <span className="text-muted-foreground text-xs">Serviços</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="font-mono text-lg font-bold">{profile.rating.count}</span>
          <span className="text-muted-foreground text-xs">Avaliações</span>
        </div>
        {profile.rating.count > 0 && (
          <div className="flex flex-col items-center">
            <span className="font-mono text-lg font-bold">{profile.rating.score.toFixed(1)}</span>
            <span className="text-muted-foreground text-xs">Nota</span>
          </div>
        )}
      </div>

      <ProfileRating score={profile.rating.score} count={profile.rating.count} />

      {profile.bio && <p className="text-foreground/80 text-sm">{profile.bio}</p>}

      <div className="text-muted-foreground flex items-center gap-1 text-xs">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
        {profile.city}, {profile.state} · Membro desde {memberSince}
      </div>
    </div>
  )
}
