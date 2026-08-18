import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { TransactionStatus, CancellationReason } from '@siamo/db'
import { TransactionService } from './service.js'
import {
  TransactionNotFoundError,
  TransactionForbiddenError,
  TransactionConflictError,
  TransactionInvalidStateError,
} from './errors.js'

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('../../integrations/whatsapp/index.js', () => ({
  createWhatsAppAdapter: () => ({ sendOtp: vi.fn(), sendNotification: vi.fn() }),
}))

vi.mock('../../workers/transactions/queue.js', () => ({
  addAutoCancelJob: vi.fn(),
  addStaleProgressAlertJob: vi.fn(),
}))

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeTx(overrides: Partial<ReturnType<typeof baseTx>> = {}) {
  return { ...baseTx(), ...overrides }
}

function baseTx() {
  return {
    id: 'tx1',
    listingId: 'listing1',
    buyerId: 'buyer1',
    sellerId: 'seller1',
    amount: { toNumber: () => 100 },
    status: 'PROPOSED' as TransactionStatus,
    buyerConfirmedStart: false,
    sellerConfirmedStart: false,
    buyerConfirmedEnd: false,
    sellerConfirmedEnd: false,
    cancelledById: null,
    cancellationReason: null as CancellationReason | null,
    cancelledAt: null as Date | null,
    completionFirstConfirmedAt: null as Date | null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  }
}

function makeListing(overrides: Record<string, unknown> = {}) {
  return {
    id: 'listing1',
    kind: 'OFFER',
    status: 'ACTIVE',
    title: 'Alface Orgânica',
    profile: { userId: 'seller1', name: 'João' },
    ...overrides,
  }
}

// ─── Mock Prisma ──────────────────────────────────────────────────────────────

const mockPrisma = {
  listing: { findUnique: vi.fn() },
  transaction: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
  transactionMessage: { findFirst: vi.fn(), create: vi.fn() },
  notification: { create: vi.fn() },
  // user.findUnique must return a thenable — sendWhatsApp calls .then() on the result
  user: { findUnique: vi.fn().mockResolvedValue(null) },
  $transaction: vi
    .fn()
    .mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => fn(mockPrisma)),
}

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('TransactionService', () => {
  let service: TransactionService

  beforeEach(() => {
    vi.clearAllMocks()
    mockPrisma.$transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) =>
      fn(mockPrisma),
    )
    service = new TransactionService(mockPrisma as never)
  })

  // ─── create ────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('creates transaction + message for non-owner (OFFER kind)', async () => {
      mockPrisma.listing.findUnique.mockResolvedValue(makeListing())
      mockPrisma.transaction.findFirst.mockResolvedValue(null)
      const created = { ...makeTx(), id: 'tx-new' }
      mockPrisma.transaction.create.mockResolvedValue(created)
      mockPrisma.transactionMessage.create.mockResolvedValue({ id: 'msg1' })
      mockPrisma.notification.create.mockResolvedValue({})

      const result = await service.create('buyer1', {
        listingId: 'listing1',
        amount: 100,
        message: 'Tenho interesse',
      })

      expect(result.buyerId).toBe('buyer1')
      expect(result.sellerId).toBe('seller1')
      expect(result.status).toBe('PROPOSED')
    })

    it('swaps buyer/seller for DEMAND listing', async () => {
      // DEMAND: owner = buyer, initiator = seller
      mockPrisma.listing.findUnique.mockResolvedValue(makeListing({ kind: 'DEMAND' }))
      mockPrisma.transaction.findFirst.mockResolvedValue(null)
      const created = makeTx({ buyerId: 'seller1', sellerId: 'initiator1' })
      mockPrisma.transaction.create.mockResolvedValue(created)
      mockPrisma.transactionMessage.create.mockResolvedValue({ id: 'msg1' })
      mockPrisma.notification.create.mockResolvedValue({})

      const result = await service.create('initiator1', {
        listingId: 'listing1',
        amount: 100,
        message: 'Posso fornecer',
      })

      expect(mockPrisma.transaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          data: expect.objectContaining({ buyerId: 'seller1', sellerId: 'initiator1' }),
        }),
      )
      expect(result).toBeDefined()
    })

    it('throws TransactionForbiddenError when owner tries to propose on own listing', async () => {
      mockPrisma.listing.findUnique.mockResolvedValue(makeListing())

      await expect(
        service.create('seller1', { listingId: 'listing1', amount: 100, message: 'x' }),
      ).rejects.toBeInstanceOf(TransactionForbiddenError)
    })

    it('throws TransactionNotFoundError when listing does not exist', async () => {
      mockPrisma.listing.findUnique.mockResolvedValue(null)

      await expect(
        service.create('buyer1', { listingId: 'listing1', amount: 100, message: 'x' }),
      ).rejects.toBeInstanceOf(TransactionNotFoundError)
    })

    it('throws TransactionNotFoundError when listing is not ACTIVE', async () => {
      mockPrisma.listing.findUnique.mockResolvedValue(makeListing({ status: 'PAUSED' }))

      await expect(
        service.create('buyer1', { listingId: 'listing1', amount: 100, message: 'x' }),
      ).rejects.toBeInstanceOf(TransactionNotFoundError)
    })

    it('throws TransactionConflictError when active transaction already exists for buyer+listing', async () => {
      mockPrisma.listing.findUnique.mockResolvedValue(makeListing())
      mockPrisma.transaction.findFirst.mockResolvedValue(makeTx({ status: 'ACCEPTED' }))

      await expect(
        service.create('buyer1', { listingId: 'listing1', amount: 100, message: 'x' }),
      ).rejects.toBeInstanceOf(TransactionConflictError)
    })
  })

  // ─── accept ────────────────────────────────────────────────────────────────

  describe('accept', () => {
    it('moves PROPOSED → ACCEPTED when called by counterpart of last message sender', async () => {
      mockPrisma.transaction.findUnique.mockResolvedValue(makeTx())
      mockPrisma.transactionMessage.findFirst.mockResolvedValue({ senderId: 'buyer1' })
      const accepted = makeTx({ status: 'ACCEPTED' })
      mockPrisma.transaction.update.mockResolvedValue(accepted)
      mockPrisma.notification.create.mockResolvedValue({})
      mockPrisma.listing.findUnique.mockResolvedValue(makeListing())

      const result = await service.accept('seller1', 'tx1')
      expect(result.status).toBe('ACCEPTED')
    })

    it('throws TransactionForbiddenError when accepting own proposal (last msg sender)', async () => {
      mockPrisma.transaction.findUnique.mockResolvedValue(makeTx())
      mockPrisma.transactionMessage.findFirst.mockResolvedValue({ senderId: 'buyer1' })

      await expect(service.accept('buyer1', 'tx1')).rejects.toBeInstanceOf(
        TransactionForbiddenError,
      )
    })

    it('throws TransactionInvalidStateError when status is not PROPOSED', async () => {
      mockPrisma.transaction.findUnique.mockResolvedValue(makeTx({ status: 'ACCEPTED' }))
      mockPrisma.transactionMessage.findFirst.mockResolvedValue({ senderId: 'buyer1' })

      await expect(service.accept('seller1', 'tx1')).rejects.toBeInstanceOf(
        TransactionInvalidStateError,
      )
    })

    it('throws TransactionForbiddenError when user is not part of transaction', async () => {
      mockPrisma.transaction.findUnique.mockResolvedValue(makeTx())

      await expect(service.accept('outsider', 'tx1')).rejects.toBeInstanceOf(
        TransactionForbiddenError,
      )
    })
  })

  // ─── counter ───────────────────────────────────────────────────────────────

  describe('counter', () => {
    it('updates amount and adds message, keeps PROPOSED', async () => {
      mockPrisma.transaction.findUnique.mockResolvedValue(makeTx())
      const updated = makeTx({ amount: { toNumber: () => 90 } })
      mockPrisma.transaction.update.mockResolvedValue(updated)
      mockPrisma.transactionMessage.create.mockResolvedValue({ id: 'msg2' })
      mockPrisma.notification.create.mockResolvedValue({})

      const result = await service.counter('seller1', 'tx1', { amount: 90, message: 'Ofereço 90' })
      expect(result.amount).toBe(90)
      expect(result.status).toBe('PROPOSED')
    })

    it('throws TransactionInvalidStateError when status is not PROPOSED', async () => {
      mockPrisma.transaction.findUnique.mockResolvedValue(makeTx({ status: 'ACCEPTED' }))

      await expect(
        service.counter('seller1', 'tx1', { amount: 90, message: 'x' }),
      ).rejects.toBeInstanceOf(TransactionInvalidStateError)
    })
  })

  // ─── confirmStart ──────────────────────────────────────────────────────────

  describe('confirmStart', () => {
    it('stays ACCEPTED when only one party confirms', async () => {
      mockPrisma.transaction.findUnique.mockResolvedValue(makeTx({ status: 'ACCEPTED' }))
      const partialConfirm = makeTx({ status: 'ACCEPTED', buyerConfirmedStart: true })
      mockPrisma.transaction.update.mockResolvedValue(partialConfirm)

      const result = await service.confirmStart('buyer1', 'tx1')
      expect(result.status).toBe('ACCEPTED')
      expect(result.buyerConfirmedStart).toBe(true)
    })

    it('moves to IN_PROGRESS when both parties confirm', async () => {
      mockPrisma.transaction.findUnique.mockResolvedValue(
        makeTx({ status: 'ACCEPTED', buyerConfirmedStart: true }),
      )
      // First update: sets sellerConfirmedStart = true → both true
      const bothConfirmed = makeTx({
        status: 'ACCEPTED',
        buyerConfirmedStart: true,
        sellerConfirmedStart: true,
      })
      // Second update: sets status IN_PROGRESS
      const inProgress = makeTx({
        status: 'IN_PROGRESS',
        buyerConfirmedStart: true,
        sellerConfirmedStart: true,
      })
      mockPrisma.transaction.update
        .mockResolvedValueOnce(bothConfirmed)
        .mockResolvedValueOnce(inProgress)
      mockPrisma.notification.create.mockResolvedValue({})

      const result = await service.confirmStart('seller1', 'tx1')
      expect(result.status).toBe('IN_PROGRESS')
    })

    it('throws TransactionInvalidStateError when status is not ACCEPTED', async () => {
      mockPrisma.transaction.findUnique.mockResolvedValue(makeTx({ status: 'IN_PROGRESS' }))

      await expect(service.confirmStart('buyer1', 'tx1')).rejects.toBeInstanceOf(
        TransactionInvalidStateError,
      )
    })
  })

  // ─── confirmComplete ───────────────────────────────────────────────────────

  describe('confirmComplete', () => {
    it('stays IN_PROGRESS when only one party confirms', async () => {
      mockPrisma.transaction.findUnique.mockResolvedValue(makeTx({ status: 'IN_PROGRESS' }))
      mockPrisma.transaction.update.mockResolvedValue(
        makeTx({ status: 'IN_PROGRESS', buyerConfirmedEnd: true }),
      )

      const result = await service.confirmComplete('buyer1', 'tx1')
      expect(result.status).toBe('IN_PROGRESS')
    })

    it('moves to COMPLETED when both parties confirm', async () => {
      mockPrisma.transaction.findUnique.mockResolvedValue(
        makeTx({ status: 'IN_PROGRESS', buyerConfirmedEnd: true }),
      )
      const bothConfirmed = makeTx({
        status: 'IN_PROGRESS',
        buyerConfirmedEnd: true,
        sellerConfirmedEnd: true,
      })
      const completed = makeTx({
        status: 'COMPLETED',
        buyerConfirmedEnd: true,
        sellerConfirmedEnd: true,
      })
      mockPrisma.transaction.update
        .mockResolvedValueOnce(bothConfirmed)
        .mockResolvedValueOnce(completed)
      mockPrisma.notification.create.mockResolvedValue({})

      const result = await service.confirmComplete('seller1', 'tx1')
      expect(result.status).toBe('COMPLETED')
    })

    it('throws TransactionInvalidStateError when status is not IN_PROGRESS', async () => {
      mockPrisma.transaction.findUnique.mockResolvedValue(makeTx({ status: 'ACCEPTED' }))

      await expect(service.confirmComplete('buyer1', 'tx1')).rejects.toBeInstanceOf(
        TransactionInvalidStateError,
      )
    })
  })

  // ─── cancel ────────────────────────────────────────────────────────────────

  describe('cancel', () => {
    it.each(['PROPOSED', 'ACCEPTED', 'IN_PROGRESS'] as const)(
      'cancels from %s with a valid reason',
      async (status) => {
        mockPrisma.transaction.findUnique.mockResolvedValue(makeTx({ status }))
        mockPrisma.transaction.update.mockResolvedValue(
          makeTx({ status: 'CANCELLED', cancellationReason: 'CHANGED_MIND' }),
        )
        mockPrisma.notification.create.mockResolvedValue({})

        const result = await service.cancel('buyer1', 'tx1', { reason: 'CHANGED_MIND' })
        expect(result.status).toBe('CANCELLED')
        expect(result.cancellationReason).toBe('CHANGED_MIND')
      },
    )

    it('throws TransactionInvalidStateError when already COMPLETED', async () => {
      mockPrisma.transaction.findUnique.mockResolvedValue(makeTx({ status: 'COMPLETED' }))

      await expect(
        service.cancel('buyer1', 'tx1', { reason: 'CHANGED_MIND' }),
      ).rejects.toBeInstanceOf(TransactionInvalidStateError)
    })

    it('throws TransactionInvalidStateError when already CANCELLED', async () => {
      mockPrisma.transaction.findUnique.mockResolvedValue(makeTx({ status: 'CANCELLED' }))

      await expect(
        service.cancel('buyer1', 'tx1', { reason: 'CHANGED_MIND' }),
      ).rejects.toBeInstanceOf(TransactionInvalidStateError)
    })
  })

  // ─── sendMessage ───────────────────────────────────────────────────────────

  describe('sendMessage', () => {
    it('creates a message and returns it', async () => {
      mockPrisma.transaction.findUnique.mockResolvedValue(makeTx())
      const msg = {
        id: 'msg1',
        transactionId: 'tx1',
        senderId: 'buyer1',
        content: 'Olá',
        createdAt: new Date(),
      }
      mockPrisma.transactionMessage.create.mockResolvedValue(msg)
      mockPrisma.notification.create.mockResolvedValue({})

      const result = await service.sendMessage('buyer1', 'tx1', { content: 'Olá' })
      expect(result.content).toBe('Olá')
      expect(result.senderId).toBe('buyer1')
    })

    it('throws TransactionForbiddenError when transaction is COMPLETED', async () => {
      mockPrisma.transaction.findUnique.mockResolvedValue(makeTx({ status: 'COMPLETED' }))

      await expect(service.sendMessage('buyer1', 'tx1', { content: 'x' })).rejects.toBeInstanceOf(
        TransactionForbiddenError,
      )
    })

    it('throws TransactionForbiddenError when transaction is CANCELLED', async () => {
      mockPrisma.transaction.findUnique.mockResolvedValue(makeTx({ status: 'CANCELLED' }))

      await expect(service.sendMessage('buyer1', 'tx1', { content: 'x' })).rejects.toBeInstanceOf(
        TransactionForbiddenError,
      )
    })

    it('throws TransactionForbiddenError for outsider', async () => {
      mockPrisma.transaction.findUnique.mockResolvedValue(makeTx())

      await expect(service.sendMessage('outsider', 'tx1', { content: 'x' })).rejects.toBeInstanceOf(
        TransactionForbiddenError,
      )
    })
  })

  // ─── autoCancelExpired ─────────────────────────────────────────────────────

  describe('autoCancelExpired', () => {
    it('cancels all PROPOSED transactions older than 72h with NO_RESPONSE', async () => {
      const expired = [
        { id: 'tx-old-1', buyerId: 'b1', sellerId: 's1' },
        { id: 'tx-old-2', buyerId: 'b2', sellerId: 's2' },
      ]
      mockPrisma.transaction.findMany.mockResolvedValue(expired)
      mockPrisma.transaction.updateMany.mockResolvedValue({ count: 2 })
      mockPrisma.notification.create.mockResolvedValue({})

      const count = await service.autoCancelExpired()
      expect(count).toBe(2)
      expect(mockPrisma.transaction.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          data: expect.objectContaining({ status: 'CANCELLED', cancellationReason: 'NO_RESPONSE' }),
        }),
      )
    })

    it('returns 0 when no expired transactions', async () => {
      mockPrisma.transaction.findMany.mockResolvedValue([])

      const count = await service.autoCancelExpired()
      expect(count).toBe(0)
      expect(mockPrisma.transaction.updateMany).not.toHaveBeenCalled()
    })
  })

  // ─── findById ──────────────────────────────────────────────────────────────

  describe('findById', () => {
    it('returns full detail including messages for a transaction participant', async () => {
      const fullTx = {
        ...makeTx(),
        messages: [
          {
            id: 'm1',
            transactionId: 'tx1',
            senderId: 'buyer1',
            content: 'Oi',
            createdAt: new Date(),
          },
        ],
        listing: { id: 'listing1', title: 'Alface', kind: 'OFFER' },
        buyer: { id: 'buyer1', profile: { name: 'Ana', photo: null, badge: 'NONE' } },
        seller: { id: 'seller1', profile: { name: 'João', photo: null, badge: 'BRONZE' } },
      }
      mockPrisma.transaction.findUnique.mockResolvedValue(fullTx)

      const result = await service.findById('buyer1', 'tx1')
      expect(result.messages).toHaveLength(1)
      expect(result.buyer.name).toBe('Ana')
      expect(result.seller.badge).toBe('BRONZE')
    })

    it('throws TransactionForbiddenError for outsider', async () => {
      const fullTx = {
        ...makeTx(),
        messages: [],
        listing: { id: 'listing1', title: 'Alface', kind: 'OFFER' },
        buyer: { id: 'buyer1', profile: { name: 'Ana', photo: null, badge: 'NONE' } },
        seller: { id: 'seller1', profile: { name: 'João', photo: null, badge: 'NONE' } },
      }
      mockPrisma.transaction.findUnique.mockResolvedValue(fullTx)

      await expect(service.findById('outsider', 'tx1')).rejects.toBeInstanceOf(
        TransactionForbiddenError,
      )
    })

    it('throws TransactionNotFoundError when not found', async () => {
      mockPrisma.transaction.findUnique.mockResolvedValue(null)

      await expect(service.findById('buyer1', 'tx-missing')).rejects.toBeInstanceOf(
        TransactionNotFoundError,
      )
    })
  })
})
