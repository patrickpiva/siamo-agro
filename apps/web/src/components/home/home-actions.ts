import type { Route } from 'next'
import type { LucideIcon } from 'lucide-react'
import type { ProfileType } from '@siamo/db'
import { Home, Search, Wrench } from '@siamo/ui/icons'

export interface HomeAction {
  label: string
  sublabel: string
  Icon: LucideIcon
  href: Route
  variant: 'primary' | 'secondary'
}

/**
 * Escolhas da Home por tipo de perfil. Destinos reais (typedRoutes):
 * "/anuncio/novo" para publicar; "/explorar?intent=…" leva ao feed com intenção
 * pré-filtrada. O spec citava "/publicar" — mapeado para a rota real.
 */
export const HOME_ACTIONS: Record<ProfileType, [HomeAction, HomeAction]> = {
  PRODUCER: [
    {
      label: 'Quero vender',
      sublabel: 'Anunciar colheita ou equipamento',
      Icon: Home,
      href: '/anuncio/novo',
      variant: 'primary',
    },
    {
      label: 'Quero comprar',
      sublabel: 'Buscar insumos, serviços, equipamentos',
      Icon: Search,
      href: '/explorar?intent=buy',
      variant: 'secondary',
    },
  ],
  PROVIDER: [
    {
      label: 'Oferecer serviço',
      sublabel: 'Anunciar especialidade e disponibilidade',
      Icon: Wrench,
      href: '/anuncio/novo',
      variant: 'primary',
    },
    {
      label: 'Buscar trabalho',
      sublabel: 'Ver quem precisa do seu serviço',
      Icon: Search,
      href: '/explorar?intent=jobs',
      variant: 'secondary',
    },
  ],
}
