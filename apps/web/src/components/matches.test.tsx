import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MatchesCarousel } from './matches-carousel'
import { MatchCard } from './match-card'
import { MatchesPageClient } from '@/app/matches/matches-page-client'
import type { MatchResult } from '@/lib/matches-api'

// ─── Module mocks ─────────────────────────────────────────────────────────────

vi.mock('@/lib/matches-api', () => ({
  fetchMatches: vi.fn(),
}))

vi.mock('next/image', () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img {...props} />,
}))

vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}))

// import after mocks are defined so vi.mock hoisting is correct
import * as matchesApi from '@/lib/matches-api'
const mockFetch = matchesApi.fetchMatches as ReturnType<typeof vi.fn>

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } })
}

function wrapper({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={makeClient()}>{children}</QueryClientProvider>
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const MATCH: MatchResult = {
  id: 'match-1',
  score: 0.85,
  distanceKm: 12.5,
  computedAt: new Date().toISOString(),
  candidate: {
    id: 'profile-1',
    name: 'João Produtor',
    photo: null,
    rating: 4.5,
    badge: 'GOLD',
    city: 'Ribeirão Preto',
    state: 'SP',
  },
  bestListing: {
    kind: 'OFFER',
    category: 'GRAINS',
    title: 'Soja colheita 2025',
  },
}

const LISTING = {
  id: 'listing-1',
  kind: 'DEMAND',
  category: 'GRAINS',
  title: 'Procuro soja orgânica',
}

// ─── MatchCard ────────────────────────────────────────────────────────────────

describe('MatchCard', () => {
  it('renders candidate name and score', () => {
    render(<MatchCard match={MATCH} />, { wrapper })
    expect(screen.getByText('João Produtor')).toBeInTheDocument()
    expect(screen.getByText('85')).toBeInTheDocument()
  })

  it('renders best listing title', () => {
    render(<MatchCard match={MATCH} />, { wrapper })
    expect(screen.getByText('Soja colheita 2025')).toBeInTheDocument()
  })

  it('renders distance in km', () => {
    render(<MatchCard match={MATCH} />, { wrapper })
    expect(screen.getByText('12.5 km de distância')).toBeInTheDocument()
  })

  it('renders distance in metres when under 1 km', () => {
    const close = { ...MATCH, distanceKm: 0.3 }
    render(<MatchCard match={close} />, { wrapper })
    expect(screen.getByText('300 m de distância')).toBeInTheDocument()
  })

  it('links to candidate profile', () => {
    render(<MatchCard match={MATCH} />, { wrapper })
    expect(screen.getByRole('link')).toHaveAttribute('href', '/perfil/profile-1')
  })

  it('renders without best listing gracefully', () => {
    const noListing = { ...MATCH, bestListing: null }
    render(<MatchCard match={noListing} />, { wrapper })
    expect(screen.getByText('João Produtor')).toBeInTheDocument()
    expect(screen.queryByText('Soja colheita 2025')).not.toBeInTheDocument()
  })
})

// ─── MatchesCarousel ──────────────────────────────────────────────────────────

describe('MatchesCarousel', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  it('renders nothing when no listings provided', () => {
    const { container } = render(<MatchesCarousel listings={[]} />, { wrapper })
    expect(container.firstChild).toBeNull()
  })

  it('shows processing spinner when API returns processing=true', async () => {
    mockFetch.mockResolvedValue({ processing: true, data: null })
    render(<MatchesCarousel listings={[LISTING]} />, { wrapper })
    await waitFor(() => {
      expect(screen.getByText(/Calculando matches/i)).toBeInTheDocument()
    })
  })

  it('renders match cards when data arrives', async () => {
    mockFetch.mockResolvedValue({
      processing: false,
      data: [MATCH],
      meta: { nextCursor: null, limit: 20 },
    })
    render(<MatchesCarousel listings={[LISTING]} />, { wrapper })
    await waitFor(() => {
      expect(screen.getByText('João Produtor')).toBeInTheDocument()
    })
  })

  it('shows empty state when no matches found', async () => {
    mockFetch.mockResolvedValue({
      processing: false,
      data: [],
      meta: { nextCursor: null, limit: 20 },
    })
    render(<MatchesCarousel listings={[LISTING]} />, { wrapper })
    await waitFor(() => {
      expect(screen.getByText(/Nenhum match encontrado/i)).toBeInTheDocument()
    })
  })

  it('renders Ver todos link to /matches', async () => {
    mockFetch.mockResolvedValue({
      processing: false,
      data: [MATCH],
      meta: { nextCursor: null, limit: 20 },
    })
    render(<MatchesCarousel listings={[LISTING]} />, { wrapper })
    await waitFor(() => {
      const link = screen.getByRole('link', { name: /ver todos/i })
      expect(link).toHaveAttribute('href', '/matches')
    })
  })
})

// ─── MatchesPageClient ────────────────────────────────────────────────────────

describe('MatchesPageClient', () => {
  const LISTINGS = [
    { id: 'l1', kind: 'DEMAND', category: 'GRAINS', title: 'Procuro soja' },
    { id: 'l2', kind: 'OFFER', category: 'DAIRY', title: 'Vendo leite' },
  ]

  beforeEach(() => {
    mockFetch.mockReset()
    mockFetch.mockResolvedValue({
      processing: false,
      data: [],
      meta: { nextCursor: null, limit: 20 },
    })
  })

  it('renders listing selector tabs when multiple listings', async () => {
    render(<MatchesPageClient listings={LISTINGS} />, { wrapper })
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Procuro soja' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Vendo leite' })).toBeInTheDocument()
    })
  })

  it('switches listing when a tab is clicked', async () => {
    const user = userEvent.setup()
    render(<MatchesPageClient listings={LISTINGS} />, { wrapper })

    await waitFor(() => screen.getByRole('button', { name: 'Vendo leite' }))
    await user.click(screen.getByRole('button', { name: 'Vendo leite' }))

    await waitFor(() => {
      const calls = mockFetch.mock.calls.map((c) => c[0] as string)
      expect(calls).toContain('l2')
    })
  })
})
