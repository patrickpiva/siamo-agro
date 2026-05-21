import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { BottomTabBar } from './bottom-tab-bar'

// ---------------------------------------------------------------------------
// Mock next/navigation — usePathname
// ---------------------------------------------------------------------------
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}))

// ---------------------------------------------------------------------------
// Mock next/link — renderiza <a> simples
// ---------------------------------------------------------------------------
vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

import { usePathname } from 'next/navigation'

function renderWithPath(path: string) {
  vi.mocked(usePathname).mockReturnValue(path)
  return render(<BottomTabBar />)
}

// ---------------------------------------------------------------------------
// Rotas onde a barra deve estar OCULTA (página tem CTA própria)
// ---------------------------------------------------------------------------
describe('BottomTabBar — oculta nas rotas internas', () => {
  const hiddenRoutes = [
    '/',
    '/entrar',
    '/entrar/codigo',
    '/cadastro/perfil',
    '/cadastro/foto',
    '/anuncio/novo',
    '/anuncio/cm123abc/proposta',
    '/anuncio/cm123abc/editar',
    '/anuncio/cm123abc', // detalhe do anúncio
    '/perfil/cm456def', // perfil público
    '/proposta/mock-1/enviada',
    '/transacao/cm789/avaliar',
  ]

  hiddenRoutes.forEach((path) => {
    it(`não renderiza em ${path}`, () => {
      const { container } = renderWithPath(path)
      expect(container.firstChild).toBeNull()
    })
  })
})

// ---------------------------------------------------------------------------
// Rotas onde a barra deve estar VISÍVEL (destinos de tab)
// ---------------------------------------------------------------------------
describe('BottomTabBar — visível nas rotas de tab', () => {
  const visibleRoutes = [
    '/feed',
    '/busca',
    '/busca?q=soja',
    '/transacoes',
    '/meu-perfil',
    '/meu-perfil/editar',
  ]

  visibleRoutes.forEach((path) => {
    it(`renderiza em ${path}`, () => {
      const { getByRole } = renderWithPath(path)
      expect(getByRole('navigation')).toBeInTheDocument()
    })
  })
})

// ---------------------------------------------------------------------------
// Tab ativa
// ---------------------------------------------------------------------------
describe('BottomTabBar — tab ativa marcada corretamente', () => {
  it('marca FEED como ativo em /feed', () => {
    const { getByLabelText } = renderWithPath('/feed')
    expect(getByLabelText('FEED')).toHaveAttribute('aria-current', 'page')
  })

  it('não marca FEED como ativo em /busca', () => {
    const { getByLabelText } = renderWithPath('/busca')
    expect(getByLabelText('FEED')).not.toHaveAttribute('aria-current', 'page')
    expect(getByLabelText('BUSCA')).toHaveAttribute('aria-current', 'page')
  })

  it('marca PERFIL como ativo em /meu-perfil', () => {
    const { getByLabelText } = renderWithPath('/meu-perfil')
    expect(getByLabelText('PERFIL')).toHaveAttribute('aria-current', 'page')
  })
})
