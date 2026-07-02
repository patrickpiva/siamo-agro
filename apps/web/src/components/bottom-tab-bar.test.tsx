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

function renderWithPath(path: string, authenticated = true) {
  vi.mocked(usePathname).mockReturnValue(path)
  return render(<BottomTabBar authenticated={authenticated} />)
}

// ---------------------------------------------------------------------------
// Rotas onde a barra deve estar OCULTA (página tem CTA própria)
// ---------------------------------------------------------------------------
describe('BottomTabBar — oculta nas rotas internas', () => {
  const hiddenRoutes = [
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

  it('oculta na landing pública (/ sem sessão)', () => {
    const { container } = renderWithPath('/', false)
    expect(container.firstChild).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Rotas onde a barra deve estar VISÍVEL (destinos de tab)
// ---------------------------------------------------------------------------
describe('BottomTabBar — visível nas rotas de tab', () => {
  const visibleRoutes = [
    '/', // home autenticada
    '/explorar',
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
  it('marca INÍCIO como ativo em /', () => {
    const { getByLabelText } = renderWithPath('/')
    expect(getByLabelText('INÍCIO')).toHaveAttribute('aria-current', 'page')
  })

  it('marca EXPLORAR como ativo em /explorar (e não INÍCIO)', () => {
    const { getByLabelText } = renderWithPath('/explorar')
    expect(getByLabelText('EXPLORAR')).toHaveAttribute('aria-current', 'page')
    expect(getByLabelText('INÍCIO')).not.toHaveAttribute('aria-current', 'page')
  })

  it('marca PERFIL como ativo em /meu-perfil', () => {
    const { getByLabelText } = renderWithPath('/meu-perfil')
    expect(getByLabelText('PERFIL')).toHaveAttribute('aria-current', 'page')
  })

  it('não marca nenhuma tab de rota em /busca (fora da nav)', () => {
    const { getByLabelText } = renderWithPath('/busca')
    expect(getByLabelText('INÍCIO')).not.toHaveAttribute('aria-current', 'page')
    expect(getByLabelText('EXPLORAR')).not.toHaveAttribute('aria-current', 'page')
  })
})
