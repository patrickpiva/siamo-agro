import type {
  PrismaClient,
  TransactionStatus,
  CancellationReason,
  NotificationType,
} from '@agrolink/db'
import type {
  CreateTransactionBody,
  ListTransactionsQuery,
  CounterProposalBody,
  CancelTransactionBody,
  SendMessageBody,
} from './schema.js'
import {
  TransactionNotFoundError,
  TransactionForbiddenError,
  TransactionConflictError,
  TransactionInvalidStateError,
} from './errors.js'
import { createWhatsAppAdapter } from '../../integrations/whatsapp/index.js'
import { addAutoCancelJob, addStaleProgressAlertJob } from '../../workers/transactions/queue.js'
import { addReputationRecomputeJob } from '../../workers/reputation/queue.js'

const whatsapp = createWhatsAppAdapter()
const APP_URL = process.env['NEXT_PUBLIC_APP_URL'] ?? 'https://agrolink.app'

const CANCELLABLE: TransactionStatus[] = ['PROPOSED', 'ACCEPTED', 'IN_PROGRESS']

// ─── Prisma Decimal → number ──────────────────────────────────────────────────

function toNum(d: { toNumber(): number } | number): number {
  return typeof d === 'number' ? d : d.toNumber()
}

// ─── Row → API shape ──────────────────────────────────────────────────────────

type TxRow = {
  id: string
  listingId: string
  buyerId: string
  sellerId: string
  amount: { toNumber(): number } | number
  status: TransactionStatus
  buyerConfirmedStart: boolean
  sellerConfirmedStart: boolean
  buyerConfirmedEnd: boolean
  sellerConfirmedEnd: boolean
  cancelledById: string | null
  cancellationReason: CancellationReason | null
  cancelledAt: Date | null
  completionFirstConfirmedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

function fmt(t: TxRow) {
  return {
    id: t.id,
    listingId: t.listingId,
    buyerId: t.buyerId,
    sellerId: t.sellerId,
    amount: toNum(t.amount),
    status: t.status,
    buyerConfirmedStart: t.buyerConfirmedStart,
    sellerConfirmedStart: t.sellerConfirmedStart,
    buyerConfirmedEnd: t.buyerConfirmedEnd,
    sellerConfirmedEnd: t.sellerConfirmedEnd,
    cancelledById: t.cancelledById,
    cancellationReason: t.cancellationReason,
    cancelledAt: t.cancelledAt?.toISOString() ?? null,
    completionFirstConfirmedAt: t.completionFirstConfirmedAt?.toISOString() ?? null,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  }
}

export class TransactionService {
  constructor(private readonly prisma: PrismaClient) {}

  // ─── Create ────────────────────────────────────────────────────────────────

  async create(initiatorId: string, body: CreateTransactionBody) {
    const { listingId, amount, message } = body

    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      include: { profile: { select: { userId: true, name: true } } },
    })
    if (!listing || listing.status !== 'ACTIVE') throw new TransactionNotFoundError(listingId)

    const ownerUserId = listing.profile.userId

    if (ownerUserId === initiatorId) {
      throw new TransactionForbiddenError('Você não pode fazer proposta no próprio anúncio')
    }

    // DEMAND: listing owner wants to buy → owner = buyer, initiator = seller
    // OFFER / SERVICE / EQUIPMENT: listing owner sells → owner = seller, initiator = buyer
    const isDemand = listing.kind === 'DEMAND'
    const buyerId = isDemand ? ownerUserId : initiatorId
    const sellerId = isDemand ? initiatorId : ownerUserId

    const existing = await this.prisma.transaction.findFirst({
      where: { listingId, buyerId, status: { in: ['PROPOSED', 'ACCEPTED', 'IN_PROGRESS'] } },
    })
    if (existing)
      throw new TransactionConflictError('Já existe uma transação ativa para este anúncio')

    const transaction = await this.prisma.$transaction(async (tx) => {
      const created = await tx.transaction.create({
        data: { listingId, buyerId, sellerId, amount },
      })
      await tx.transactionMessage.create({
        data: { transactionId: created.id, senderId: initiatorId, content: message },
      })
      return created
    })

    await this.notify(ownerUserId, 'PROPOSAL_RECEIVED', {
      transactionId: transaction.id,
      listingId,
    })
    this.sendWhatsApp(ownerUserId, 'new_proposal', {
      name: 'Alguém',
      listing: listing.title,
      amount: amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      url: `${APP_URL}/transacoes/${transaction.id}`,
    })

    await addAutoCancelJob(transaction.id)

    return fmt(transaction)
  }

  // ─── Accept ────────────────────────────────────────────────────────────────

  async accept(userId: string, transactionId: string) {
    const tx = await this.authorize(transactionId, userId)

    if (tx.status !== 'PROPOSED') throw new TransactionInvalidStateError(tx.status, 'PROPOSED')

    // Prevent accepting your own proposal (check last message sender)
    const lastMsg = await this.prisma.transactionMessage.findFirst({
      where: { transactionId },
      orderBy: { createdAt: 'desc' },
      select: { senderId: true },
    })
    if (lastMsg?.senderId === userId) {
      throw new TransactionForbiddenError('Você não pode aceitar sua própria proposta')
    }

    const updated = await this.prisma.transaction.update({
      where: { id: transactionId },
      data: { status: 'ACCEPTED' },
    })

    await this.notify(tx.buyerId, 'PROPOSAL_ACCEPTED', { transactionId })
    await this.notify(tx.sellerId, 'PROPOSAL_ACCEPTED', { transactionId })

    const listing = await this.prisma.listing.findUnique({
      where: { id: tx.listingId },
      select: { title: true },
    })
    if (listing) {
      this.sendWhatsApp(userId === tx.buyerId ? tx.sellerId : tx.buyerId, 'transaction_accepted', {
        listing: listing.title,
        url: `${APP_URL}/transacoes/${transactionId}`,
      })
    }

    return fmt(updated)
  }

  // ─── Counter proposal ──────────────────────────────────────────────────────

  async counter(userId: string, transactionId: string, body: CounterProposalBody) {
    const tx = await this.authorize(transactionId, userId)

    if (tx.status !== 'PROPOSED') throw new TransactionInvalidStateError(tx.status, 'PROPOSED')

    const updated = await this.prisma.$transaction(async (pTx) => {
      const t = await pTx.transaction.update({
        where: { id: transactionId },
        data: { amount: body.amount },
      })
      await pTx.transactionMessage.create({
        data: { transactionId, senderId: userId, content: body.message },
      })
      return t
    })

    const counterpartId = userId === tx.buyerId ? tx.sellerId : tx.buyerId
    await this.notify(counterpartId, 'PROPOSAL_RECEIVED', { transactionId, amount: body.amount })

    return fmt(updated)
  }

  // ─── Confirm start (ACCEPTED → IN_PROGRESS when both confirm) ─────────────

  async confirmStart(userId: string, transactionId: string) {
    const tx = await this.authorize(transactionId, userId)

    if (tx.status !== 'ACCEPTED') throw new TransactionInvalidStateError(tx.status, 'ACCEPTED')

    const isBuyer = tx.buyerId === userId
    const updated = await this.prisma.$transaction(async (pTx) => {
      const flagged = await pTx.transaction.update({
        where: { id: transactionId },
        data: isBuyer ? { buyerConfirmedStart: true } : { sellerConfirmedStart: true },
      })
      if (flagged.buyerConfirmedStart && flagged.sellerConfirmedStart) {
        return pTx.transaction.update({
          where: { id: transactionId },
          data: { status: 'IN_PROGRESS' },
        })
      }
      return flagged
    })

    if (updated.status === 'IN_PROGRESS') {
      await this.notify(tx.buyerId, 'TRANSACTION_COMPLETED', { transactionId, event: 'started' })
      await this.notify(tx.sellerId, 'TRANSACTION_COMPLETED', { transactionId, event: 'started' })
      await addStaleProgressAlertJob(transactionId)
    }

    return fmt(updated)
  }

  // ─── Confirm complete (IN_PROGRESS → COMPLETED when both confirm) ──────────

  async confirmComplete(userId: string, transactionId: string) {
    const tx = await this.authorize(transactionId, userId)

    if (tx.status !== 'IN_PROGRESS')
      throw new TransactionInvalidStateError(tx.status, 'IN_PROGRESS')

    const isBuyer = tx.buyerId === userId
    const updated = await this.prisma.$transaction(async (pTx) => {
      // Set timer on the first party to confirm
      const neitherConfirmedYet = !tx.buyerConfirmedEnd && !tx.sellerConfirmedEnd
      const timerData =
        neitherConfirmedYet && !tx.completionFirstConfirmedAt
          ? { completionFirstConfirmedAt: new Date() }
          : {}

      const flagged = await pTx.transaction.update({
        where: { id: transactionId },
        data: {
          ...(isBuyer ? { buyerConfirmedEnd: true } : { sellerConfirmedEnd: true }),
          ...timerData,
        },
      })
      if (flagged.buyerConfirmedEnd && flagged.sellerConfirmedEnd) {
        return pTx.transaction.update({
          where: { id: transactionId },
          data: { status: 'COMPLETED' },
        })
      }
      return flagged
    })

    if (updated.status === 'COMPLETED') {
      await this.notify(tx.buyerId, 'TRANSACTION_COMPLETED', { transactionId })
      await this.notify(tx.sellerId, 'TRANSACTION_COMPLETED', { transactionId })
      await addReputationRecomputeJob(tx.buyerId)
      await addReputationRecomputeJob(tx.sellerId)
    }

    return fmt(updated)
  }

  // ─── Cancel ────────────────────────────────────────────────────────────────

  async cancel(userId: string, transactionId: string, body: CancelTransactionBody) {
    const tx = await this.authorize(transactionId, userId)

    if (!CANCELLABLE.includes(tx.status)) {
      throw new TransactionInvalidStateError(tx.status, 'PROPOSED | ACCEPTED | IN_PROGRESS')
    }

    const updated = await this.prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: 'CANCELLED',
        cancelledById: userId,
        cancellationReason: body.reason,
        cancelledAt: new Date(),
      },
    })

    const counterpartId = userId === tx.buyerId ? tx.sellerId : tx.buyerId
    await this.notify(counterpartId, 'PROPOSAL_REFUSED', { transactionId, reason: body.reason })

    return fmt(updated)
  }

  // ─── List ──────────────────────────────────────────────────────────────────

  async list(userId: string, query: ListTransactionsQuery) {
    const { role, status, cursor, limit } = query

    const roleFilter =
      role === 'as_buyer'
        ? { buyerId: userId }
        : role === 'as_seller'
          ? { sellerId: userId }
          : { OR: [{ buyerId: userId }, { sellerId: userId }] }

    const items = await this.prisma.transaction.findMany({
      where: {
        ...roleFilter,
        ...(status ? { status } : {}),
      },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: 'desc' },
      include: {
        listing: { select: { id: true, title: true, kind: true } },
        buyer: { include: { profile: { select: { name: true, photo: true } } } },
        seller: { include: { profile: { select: { name: true, photo: true } } } },
      },
    })

    const hasMore = items.length > limit
    const data = hasMore ? items.slice(0, limit) : items
    const nextCursor = hasMore ? (data.at(-1)?.id ?? null) : null

    return { data: data.map(fmt), meta: { nextCursor, limit } }
  }

  // ─── Get by ID ─────────────────────────────────────────────────────────────

  async findById(userId: string, transactionId: string) {
    const tx = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        listing: { select: { id: true, title: true, kind: true } },
        buyer: { include: { profile: { select: { name: true, photo: true, badge: true } } } },
        seller: { include: { profile: { select: { name: true, photo: true, badge: true } } } },
        messages: { orderBy: { createdAt: 'asc' } },
      },
    })

    if (!tx) throw new TransactionNotFoundError(transactionId)
    if (tx.buyerId !== userId && tx.sellerId !== userId) {
      throw new TransactionForbiddenError('Você não tem acesso a esta transação')
    }

    return {
      ...fmt(tx),
      messages: tx.messages.map((m) => ({
        id: m.id,
        transactionId: m.transactionId,
        senderId: m.senderId,
        content: m.content,
        createdAt: m.createdAt.toISOString(),
      })),
      listing: tx.listing,
      buyer: {
        id: tx.buyer.id,
        name: tx.buyer.profile?.name ?? '',
        photo: tx.buyer.profile?.photo ?? null,
        badge: String(tx.buyer.profile?.badge ?? 'NONE'),
      },
      seller: {
        id: tx.seller.id,
        name: tx.seller.profile?.name ?? '',
        photo: tx.seller.profile?.photo ?? null,
        badge: String(tx.seller.profile?.badge ?? 'NONE'),
      },
    }
  }

  // ─── Send message ──────────────────────────────────────────────────────────

  async sendMessage(userId: string, transactionId: string, body: SendMessageBody) {
    const tx = await this.authorize(transactionId, userId)

    if (tx.status === 'COMPLETED' || tx.status === 'CANCELLED') {
      throw new TransactionForbiddenError('Transação encerrada — mensagens não permitidas')
    }

    const message = await this.prisma.transactionMessage.create({
      data: { transactionId, senderId: userId, content: body.content },
    })

    const counterpartId = userId === tx.buyerId ? tx.sellerId : tx.buyerId
    await this.notify(counterpartId, 'PROPOSAL_RECEIVED', { transactionId, event: 'new_message' })
    // WhatsApp debounce handled via BullMQ (TODO: addDebounceNotifyJob)

    return {
      id: message.id,
      transactionId: message.transactionId,
      senderId: message.senderId,
      content: message.content,
      createdAt: message.createdAt.toISOString(),
    }
  }

  // ─── Worker: auto-cancel expired PROPOSED (72h) ───────────────────────────

  async autoCancelExpired(): Promise<number> {
    const cutoff = new Date(Date.now() - 72 * 60 * 60 * 1000)
    const expired = await this.prisma.transaction.findMany({
      where: { status: 'PROPOSED', createdAt: { lt: cutoff } },
      select: { id: true, buyerId: true, sellerId: true },
    })

    if (expired.length === 0) return 0

    await this.prisma.transaction.updateMany({
      where: { id: { in: expired.map((t) => t.id) } },
      data: { status: 'CANCELLED', cancellationReason: 'NO_RESPONSE', cancelledAt: new Date() },
    })

    for (const t of expired) {
      await this.notify(t.buyerId, 'PROPOSAL_REFUSED', {
        transactionId: t.id,
        reason: 'NO_RESPONSE',
      })
      await this.notify(t.sellerId, 'PROPOSAL_REFUSED', {
        transactionId: t.id,
        reason: 'NO_RESPONSE',
      })
    }

    return expired.length
  }

  // ─── Worker: alert stale IN_PROGRESS (90d) ────────────────────────────────

  async alertStaleProgress(transactionId: string): Promise<void> {
    const tx = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
      select: { id: true, buyerId: true, sellerId: true, status: true },
    })
    if (!tx || tx.status !== 'IN_PROGRESS') return

    await this.notify(tx.buyerId, 'SYSTEM', {
      transactionId,
      message: 'Sua transação está em andamento há mais de 90 dias',
    })
    await this.notify(tx.sellerId, 'SYSTEM', {
      transactionId,
      message: 'Sua transação está em andamento há mais de 90 dias',
    })
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  private async authorize(transactionId: string, userId: string) {
    const tx = await this.prisma.transaction.findUnique({ where: { id: transactionId } })
    if (!tx) throw new TransactionNotFoundError(transactionId)
    if (tx.buyerId !== userId && tx.sellerId !== userId) {
      throw new TransactionForbiddenError('Você não tem acesso a esta transação')
    }
    return tx
  }

  private async notify(userId: string, type: NotificationType, data: Record<string, unknown>) {
    try {
      await this.prisma.notification.create({ data: { userId, type, data: data as never } })
    } catch (err) {
      console.warn('[notify] Falha ao criar notificação — transação não afetada', {
        userId,
        type,
        err,
      })
    }
  }

  private sendWhatsApp<T extends Parameters<typeof whatsapp.sendNotification>[1]>(
    userId: string,
    template: T,
    params: Parameters<typeof whatsapp.sendNotification<T>>[2],
  ) {
    this.prisma.user
      .findUnique({ where: { id: userId }, select: { phone: true } })
      .then((u) => {
        if (u?.phone) return whatsapp.sendNotification(u.phone, template, params)
      })
      .catch(console.error)
  }
}
