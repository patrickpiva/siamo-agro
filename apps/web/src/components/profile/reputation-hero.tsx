import Image from 'next/image'
import { ReputationSeal } from '@agraia/ui'

interface ReputationHeroProps {
  name: string
  initials: string
  photoUrl?: string | null
  type: string
  city: string
  state: string
  memberYears: number
  score: number
  seal?: 'GOLD' | 'SILVER' | 'BRONZE' | null
}

const TYPE_LABEL: Record<string, string> = {
  PRODUCER: 'Produtor',
  PROVIDER: 'Prestador de Serviço',
}

export function ReputationHero({
  name,
  initials,
  photoUrl,
  type,
  city,
  state,
  memberYears,
  score,
  seal,
}: ReputationHeroProps) {
  return (
    <div className="flex flex-col items-center px-6 pb-5 pt-7 text-center">
      {/* Avatar */}
      <div className="relative mb-3">
        <div
          className="bg-accent relative flex size-[88px] items-center justify-center overflow-hidden rounded-full text-[30px] font-medium text-white"
          style={{
            border: '2.5px solid #C6E845',
            boxShadow: '0 0 0 4px #F0F7D9',
          }}
        >
          {photoUrl ? (
            <Image src={photoUrl} alt={name} fill className="object-cover" sizes="88px" />
          ) : (
            <span className="dark:text-[#0A0A0A]">{initials}</span>
          )}
        </div>
      </div>

      {/* Seal */}
      {seal && <ReputationSeal tier={seal} className="mb-3" />}

      {/* Score */}
      <p className="text-accent dark:text-primary mb-1 font-mono text-[48px] font-medium leading-none">
        {score.toFixed(1)}
      </p>

      {/* Name */}
      <p className="mb-1 text-[18px] font-medium">{name}</p>

      {/* Sub */}
      <p className="text-muted-foreground text-[12px] leading-[1.4]">
        {TYPE_LABEL[type] ?? type} · {city}, {state} · no AgraIA há {memberYears}{' '}
        {memberYears === 1 ? 'ano' : 'anos'}
      </p>
    </div>
  )
}
