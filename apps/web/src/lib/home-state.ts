/**
 * Lógica pura da Home v2 (Lote 7) — sem Prisma, sem server-only, testável isolado.
 * O agregador de dados (Prisma direto, ADR §9) vive em `home.ts` e reexporta daqui.
 */
import type { ProfileType, BadgeTier } from '@siamo/db'

export type HomeState = 'FIRST_ACCESS' | 'RETURNING_PENDING' | 'RETURNING_CLEAR'

export interface OnboardingState {
  accountCreated: boolean
  profileComplete: boolean
  firstListing: boolean
}

export interface PendingProposal {
  transactionId: string
  buyerName: string
  listingTitle: string
  amount: number
  createdAt: string
}

export interface ContinueThread {
  transactionId: string
  counterpartyName: string
  lastMessage: string | null
  lastActivityAt: string
  /** Mensagens novas da contraparte desde a última resposta do usuário. */
  newCount: number
}

export interface Opportunity {
  listingId: string
  kind: string
  category: string
  title: string
  price: number | null
  distanceKm: number | null
  /** Float 0–1; o card converte para inteiro 0–100. */
  matchScore: number
  thumbnailUrl: string | null
}

export interface HomeData {
  profile: {
    id: string
    name: string
    firstName: string
    type: ProfileType
    badge: BadgeTier
    photo: string | null
  }
  onboarding: OnboardingState
  pendingProposals: PendingProposal[]
  pendingProposalCount: number
  continueThreads: ContinueThread[]
  opportunities: Opportunity[]
  counts: { listings: number; transactions: number }
}

/**
 * Máquina de estados da Home (mesma lógica da v1 do spec). Onboarding incompleto
 * OU nenhuma atividade ⇒ primeiro acesso; depois, pendência define o destaque.
 * `pendingCount` agrega as "pending actions" do spec — hoje, propostas a responder.
 */
export function resolveHomeState(args: {
  onboardingComplete: boolean
  listingsCount: number
  transactionsCount: number
  pendingCount: number
}): HomeState {
  if (!args.onboardingComplete || (args.listingsCount === 0 && args.transactionsCount === 0)) {
    return 'FIRST_ACCESS'
  }
  if (args.pendingCount > 0) return 'RETURNING_PENDING'
  return 'RETURNING_CLEAR'
}

/**
 * Conta a sequência mais recente de mensagens que NÃO são do usuário — a melhor
 * aproximação de "novas desde sua última resposta" enquanto `TransactionMessage`
 * não tiver read-tracking. `messages` deve vir do mais recente para o mais antigo.
 */
export function countNewMessages(messages: { senderId: string }[], myUserId: string): number {
  let count = 0
  for (const m of messages) {
    if (m.senderId === myUserId) break
    count++
  }
  return count
}

/** Primeiro nome para a saudação ("Bom dia, João"). */
export function firstNameOf(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? fullName
}
