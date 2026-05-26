import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ShareButton } from './share-button'

vi.mock('@agraia/ui/icons', () => ({
  Share2: () => null,
}))

describe('ShareButton', () => {
  beforeEach(() => {
    // Reset navigator properties before each test
    Object.defineProperty(navigator, 'share', {
      value: undefined,
      configurable: true,
      writable: true,
    })
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
      writable: true,
    })
  })

  it('renders a button with "Compartilhar" label', () => {
    render(<ShareButton title="Meu anúncio" url="https://example.com/anuncio/1" />)
    expect(screen.getByRole('button', { name: /compartilhar/i })).toBeInTheDocument()
  })

  it('calls navigator.share with title and url when the Web Share API is available', async () => {
    const shareMock = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'share', { value: shareMock, configurable: true })

    render(<ShareButton title="Café safra 2025" url="https://example.com/anuncio/abc" />)
    await userEvent.click(screen.getByRole('button'))

    expect(shareMock).toHaveBeenCalledOnce()
    expect(shareMock).toHaveBeenCalledWith({
      title: 'Café safra 2025',
      url: 'https://example.com/anuncio/abc',
    })
  })

  it('falls back to clipboard.writeText when navigator.share is not available', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'share', { value: undefined, configurable: true })
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextMock },
      configurable: true,
    })

    render(<ShareButton title="Café safra 2025" url="https://example.com/anuncio/abc" />)
    await userEvent.click(screen.getByRole('button'))

    expect(writeTextMock).toHaveBeenCalledOnce()
    expect(writeTextMock).toHaveBeenCalledWith('https://example.com/anuncio/abc')
  })

  it('does not throw when navigator.share rejects (user cancelled)', async () => {
    const shareMock = vi.fn().mockRejectedValue(new DOMException('AbortError'))
    Object.defineProperty(navigator, 'share', { value: shareMock, configurable: true })

    render(<ShareButton title="Test" url="https://example.com" />)

    // Should not throw
    await expect(userEvent.click(screen.getByRole('button'))).resolves.not.toThrow()
  })
})
