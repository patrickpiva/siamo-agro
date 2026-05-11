// ─── Mock data para páginas de perfil ────────────────────────────────────────
// TODO Sprint 2: substituir por fetch(`${process.env.API_URL}/api/v1/profiles/${id}`)
//                com next: { revalidate: 60 }

export type BadgeTier = 'NONE' | 'BRONZE' | 'SILVER' | 'GOLD'
export type ProfileType = 'PRODUCER' | 'PROVIDER'

export interface ProfileRating {
  score: number
  count: number
}

export interface ProfileListing {
  id: string
  title: string
  description: string
  price?: string
  city: string
  state: string
  createdAt: string
}

export interface ProfileReview {
  id: string
  authorName: string
  authorPhotoUrl?: string
  score: number
  comment: string
  createdAt: string
}

export interface ProfileData {
  id: string
  name: string
  type: ProfileType
  badge: BadgeTier
  bio: string
  photoUrl?: string
  city: string
  state: string
  memberSince: string
  rating: ProfileRating
  listings: ProfileListing[]
  reviews: ProfileReview[]
  completedTransactions: number
}

// ─── Mock profiles ────────────────────────────────────────────────────────────

const MOCK_PROFILES: ProfileData[] = [
  {
    id: 'mock-own',
    name: 'Você',
    type: 'PRODUCER',
    badge: 'NONE',
    bio: 'Produtor rural da região do Triângulo Mineiro.',
    city: 'Uberlândia',
    state: 'MG',
    memberSince: '2026-05-01',
    rating: { score: 0, count: 0 },
    listings: [],
    reviews: [],
    completedTransactions: 0,
  },
  {
    id: 'maria-santos',
    name: 'Maria Santos',
    type: 'PROVIDER',
    badge: 'GOLD',
    bio: 'Consultora agronômica especializada em soja e milho. Mais de 10 anos de experiência no Cerrado.',
    photoUrl:
      'https://api.dicebear.com/9.x/initials/svg?seed=Maria+Santos&backgroundColor=1F5F3F&textColor=C6E845',
    city: 'Sorriso',
    state: 'MT',
    memberSince: '2024-03-15',
    rating: { score: 4.9, count: 87 },
    completedTransactions: 92,
    listings: [
      {
        id: 'listing-1',
        title: 'Consultoria Agronômica — Soja e Milho',
        description: 'Análise de solo, recomendação de adubação e acompanhamento da cultura.',
        price: 'A consultar',
        city: 'Sorriso',
        state: 'MT',
        createdAt: '2026-04-10',
      },
      {
        id: 'listing-2',
        title: 'Laudo técnico para financiamento rural',
        description: 'Elaboração de laudos técnicos para Pronaf, FCO e outras linhas.',
        price: 'R$ 800,00',
        city: 'Sorriso',
        state: 'MT',
        createdAt: '2026-03-20',
      },
    ],
    reviews: [
      {
        id: 'review-1',
        authorName: 'João Pereira',
        score: 5,
        comment: 'Excelente consultora! Aumentou minha produtividade em 20% na safra.',
        createdAt: '2026-04-28',
      },
      {
        id: 'review-2',
        authorName: 'Carlos Melo',
        score: 5,
        comment: 'Muito profissional e pontual. Recomendo sem hesitar.',
        createdAt: '2026-04-15',
      },
      {
        id: 'review-3',
        authorName: 'Ana Rodrigues',
        score: 4,
        comment: 'Ótimo atendimento, laudo entregue antes do prazo.',
        createdAt: '2026-03-30',
      },
    ],
  },
  {
    id: 'carlos-maquinas',
    name: 'Carlos Máquinas Agrícolas',
    type: 'PROVIDER',
    badge: 'SILVER',
    bio: 'Operador de colheitadeira e pulverizador autopropelido. Atendo toda a região Oeste da Bahia.',
    photoUrl:
      'https://api.dicebear.com/9.x/initials/svg?seed=Carlos+Maquinas&backgroundColor=0A0A0A&textColor=C6E845',
    city: 'Barreiras',
    state: 'BA',
    memberSince: '2025-01-10',
    rating: { score: 4.6, count: 34 },
    completedTransactions: 41,
    listings: [
      {
        id: 'listing-3',
        title: 'Colheita mecanizada de soja e milho',
        description: 'Colheitadeira John Deere S760, capacidade 600 ha/safra.',
        price: 'R$ 180/ha',
        city: 'Barreiras',
        state: 'BA',
        createdAt: '2026-02-05',
      },
    ],
    reviews: [
      {
        id: 'review-4',
        authorName: 'Maria Santos',
        score: 5,
        comment: 'Trabalho impecável, perdas mínimas na colheita.',
        createdAt: '2026-04-01',
      },
      {
        id: 'review-5',
        authorName: 'José Alves',
        score: 4,
        comment: 'Boa máquina e bom operador. Entrega no prazo.',
        createdAt: '2026-03-15',
      },
    ],
  },
]

// ─── API mockada ──────────────────────────────────────────────────────────────

export async function getMockProfile(id: string): Promise<ProfileData | null> {
  // Simula latência de rede
  await new Promise((r) => setTimeout(r, 150))

  return MOCK_PROFILES.find((p) => p.id === id) ?? null
}

export async function getMockOwnProfile(): Promise<ProfileData> {
  await new Promise((r) => setTimeout(r, 150))
  // TODO Sprint 2: usar userId do cookie de sessão para buscar o perfil real
  return MOCK_PROFILES[0]!
}
