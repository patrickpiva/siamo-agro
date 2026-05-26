import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { OwnerBanner } from './owner-banner'

vi.mock('@agraia/ui/icons', () => ({
  Info: () => null,
}))

describe('OwnerBanner', () => {
  it.each([
    ['ACTIVE', 'ATIVO'],
    ['PAUSED', 'PAUSADO'],
    ['CLOSED', 'ENCERRADO'],
  ])('maps status "%s" to portuguese label "%s"', (status, expectedLabel) => {
    render(<OwnerBanner status={status} />)
    expect(screen.getByText(expectedLabel)).toBeInTheDocument()
  })

  it('falls back to the raw status value for unknown statuses', () => {
    render(<OwnerBanner status="DRAFT" />)
    expect(screen.getByText('DRAFT')).toBeInTheDocument()
  })

  it('renders the owner identification message', () => {
    render(<OwnerBanner status="ACTIVE" />)
    // The banner renders "Este é o seu anúncio · ATIVO"
    // Check for the static part of the message
    expect(screen.getByText(/este é o seu anúncio/i)).toBeInTheDocument()
  })

  it('renders the status inside a <strong> element', () => {
    const { container } = render(<OwnerBanner status="PAUSED" />)
    const strong = container.querySelector('strong')
    expect(strong).toBeInTheDocument()
    expect(strong?.textContent).toBe('PAUSADO')
  })
})
