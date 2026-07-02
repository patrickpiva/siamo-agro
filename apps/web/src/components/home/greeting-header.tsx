import { getInitials } from '@agraia/ui'
import type { ProfileType, BadgeTier } from '@agraia/db'

const TYPE_LABEL: Record<ProfileType, string> = {
  PRODUCER: 'PRODUTOR',
  PROVIDER: 'PRESTADOR',
}

const SEAL_LABEL: Partial<Record<BadgeTier, string>> = {
  GOLD: 'OURO',
  SILVER: 'PRATA',
  BRONZE: 'BRONZE',
}

function greetingForHour(h: number): string {
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

interface GreetingHeaderProps {
  firstName: string
  type: ProfileType
  badge: BadgeTier
  /** Primeiro acesso usa "Bem-vindo" no lugar da saudação por horário. */
  welcome?: boolean
}

/**
 * Cabeçalho da Home (formato v1 restaurado): data + saudação 24px + pill de
 * perfil/selo. Server Component — a data/saudação vêm de `new Date()` no servidor,
 * renderizado uma vez (sem mismatch de hidratação).
 */
export function GreetingHeader({ firstName, type, badge, welcome }: GreetingHeaderProps) {
  const now = new Date()
  const greeting = welcome ? 'Bem-vindo' : greetingForHour(now.getHours())
  const dateLabel = now
    .toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })
    .replace(/\./g, '')
    .toUpperCase()
  const seal = SEAL_LABEL[badge]

  return (
    <div className="px-5 pt-[18px]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-muted-foreground font-mono text-[11px] tracking-[0.4px]">
            {dateLabel}
          </p>
          <p className="text-[24px] font-semibold leading-[1.1] tracking-[-0.5px]">
            {greeting}, {firstName}
          </p>
          <span className="bg-primary-subtle text-accent dark:text-primary mt-[10px] inline-flex items-center gap-[6px] rounded-[6px] border border-[#c6e845] px-[10px] py-1 font-mono text-[10px] tracking-[0.4px] dark:border-[rgba(198,232,69,0.25)]">
            <span className="bg-accent dark:bg-primary size-[6px] rounded-full" />
            {TYPE_LABEL[type]}
            {seal ? ` · ${seal}` : ''}
          </span>
        </div>
        <div className="bg-accent border-primary flex size-10 shrink-0 items-center justify-center rounded-full border-2 text-[15px] font-medium text-white">
          {getInitials(firstName)}
        </div>
      </div>
    </div>
  )
}
