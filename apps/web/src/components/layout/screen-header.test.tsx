import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { ScreenHeader } from './screen-header'

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

// ---------------------------------------------------------------------------
// Centring: the reason for moving from justify-between to grid. With
// justify-between the title was only centred when both sides happened to be the
// same width — /meu-perfil (two icons) sat 28px to the left.
// ---------------------------------------------------------------------------
describe('ScreenHeader — colunas laterais', () => {
  function sideColumns(container: HTMLElement) {
    const header = container.querySelector('header')
    expect(header).not.toBeNull()
    return Array.from(header!.children)
  }

  it('usa grid 1fr auto 1fr em vez de justify-between', () => {
    const { container } = render(<ScreenHeader backHref="/" title="Config" />)
    const header = container.querySelector('header')!
    expect(header.className).toContain('grid-cols-[1fr_auto_1fr]')
    expect(header.className).not.toContain('justify-between')
  })

  it('renderiza exatamente três colunas, mesmo sem conteúdo lateral', () => {
    const { container } = render(<ScreenHeader title="Negócios" />)
    expect(sideColumns(container)).toHaveLength(3)
  })

  it('mantém três colunas com dois controles à direita (caso /meu-perfil)', () => {
    const { container } = render(
      <ScreenHeader
        title="Meu Perfil"
        right={
          <>
            <button type="button" aria-label="Compartilhar" />
            <button type="button" aria-label="Configurações" />
          </>
        }
      />,
    )
    const cols = sideColumns(container)
    expect(cols).toHaveLength(3)
    // Both controls live in the SAME side column — that is what keeps the title
    // column centred instead of pushing it to the left.
    expect(cols[2]!.querySelectorAll('button')).toHaveLength(2)
    expect(cols[0]!.children).toHaveLength(0)
  })

  it('aceita conteúdo lateral de largura variável sem spacer manual', () => {
    const { container } = render(
      <ScreenHeader
        backHref="/"
        title="Notificações"
        right={<button type="button">MARCAR LIDAS</button>}
      />,
    )
    const cols = sideColumns(container)
    // Neither side is a fixed w-12 spacer: both are flex columns of the grid.
    expect(cols[0]!.className).toContain('justify-start')
    expect(cols[2]!.className).toContain('justify-end')
  })
})

describe('ScreenHeader — botão voltar', () => {
  it('renderiza link quando backHref é passado', () => {
    const { getByLabelText } = render(<ScreenHeader backHref="/configuracoes" title="Ajuda" />)
    expect(getByLabelText('Voltar').tagName).toBe('A')
  })

  it('renderiza button quando apenas onBack é passado', () => {
    const { getByLabelText } = render(<ScreenHeader onBack={() => {}} title="Ajuda" />)
    expect(getByLabelText('Voltar').tagName).toBe('BUTTON')
  })

  it('não renderiza botão voltar em destino de tab (sem backHref nem onBack)', () => {
    const { queryByLabelText } = render(<ScreenHeader title="Negócios" />)
    expect(queryByLabelText('Voltar')).toBeNull()
  })

  it('left tem precedência sobre os atalhos de voltar', () => {
    const { queryByLabelText, getByTestId } = render(
      <ScreenHeader backHref="/" left={<span data-testid="custom" />} title="Perfil" />,
    )
    expect(getByTestId('custom')).toBeInTheDocument()
    expect(queryByLabelText('Voltar')).toBeNull()
  })
})

describe('ScreenHeader — título', () => {
  it('aplica o estilo padrão a título string', () => {
    const { container } = render(<ScreenHeader title="Configurações" />)
    const h1 = container.querySelector('h1')!
    expect(h1.textContent).toBe('Configurações')
    expect(h1.className).toContain('text-[15px]')
    expect(h1.className).toContain('truncate')
  })

  it('respeita um título em ReactNode sem envolvê-lo em h1', () => {
    const { container } = render(<ScreenHeader title={<span data-testid="skeleton" />} />)
    expect(container.querySelector('h1')).toBeNull()
    expect(container.querySelector('[data-testid="skeleton"]')).not.toBeNull()
  })
})

describe('ScreenHeader — safe area e sticky', () => {
  it('sempre reserva o inset superior do iOS', () => {
    const { container } = render(<ScreenHeader title="Ajuda" />)
    expect(container.querySelector('header')!.className).toContain('safe-area-inset-top')
  })

  it('aplica sticky + backdrop apenas quando pedido', () => {
    const { container: plain } = render(<ScreenHeader title="Ajuda" />)
    expect(plain.querySelector('header')!.className).not.toContain('sticky')

    const { container: stuck } = render(<ScreenHeader sticky title="Perfil" />)
    expect(stuck.querySelector('header')!.className).toContain('sticky')
  })
})
