import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AuthService } from './service.js'
import {
  OtpRateLimitError,
  OtpInvalidError,
  OtpMaxAttemptsError,
  RefreshTokenInvalidError,
} from './errors.js'
import type { WhatsAppAdapter } from '../../adapters/whatsapp/index.js'

// ─── Mocks ───────────────────────────────────────────────────────────────────

// vi.hoisted garante que as variáveis existam quando vi.mock() for executado (ambos são hoisted)
const { mockBcryptHash, mockBcryptCompare } = vi.hoisted(() => ({
  mockBcryptHash: vi.fn((value: string) => Promise.resolve(`hashed:${value}`)),
  mockBcryptCompare: vi.fn((plain: string, hash: string) =>
    Promise.resolve(hash === `hashed:${plain}`),
  ),
}))

vi.mock('bcryptjs', () => ({
  default: {
    hash: mockBcryptHash,
    compare: mockBcryptCompare,
  },
}))

vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn(() => 'mock.access.token'),
    verify: vi.fn(() => ({ id: 'user-1', phone: '+5511999990001' })),
  },
}))

// crypto.randomInt mock — retorna sempre o mesmo código nos testes
vi.mock('node:crypto', () => ({
  randomInt: vi.fn(() => 123456),
  randomBytes: vi.fn(() => ({ toString: () => 'mock-refresh-token-raw-hex' })),
  timingSafeEqual: vi.fn((a: Buffer, b: Buffer) => a.equals(b)),
}))

const now = new Date()
const inFiveMin = new Date(now.getTime() + 5 * 60 * 1000)

const mockOtpCode = {
  id: 'otp-1',
  phone: '+5511999990001',
  code: 'hashed:123456',
  expiresAt: inFiveMin,
  attempts: 0,
  usedAt: null,
  createdAt: now,
  updatedAt: now,
}

const mockUser = {
  id: 'user-1',
  phone: '+5511999990001',
  email: null,
  passwordHash: null,
  status: 'ACTIVE' as const,
  createdAt: now,
  updatedAt: now,
  profile: null,
}

const mockRefreshToken = {
  id: 'rt-1',
  userId: 'user-1',
  tokenHash: 'hashed:mock-refresh-token-raw-hex',
  expiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
  revokedAt: null,
  createdAt: now,
  updatedAt: now,
}

// Prisma mock
const mockOtpCodeDb = {
  count: vi.fn(),
  create: vi.fn(),
  findFirst: vi.fn(),
  update: vi.fn(),
}

const mockUserDb = {
  findUnique: vi.fn(),
  create: vi.fn(),
}

const mockRefreshTokenDb = {
  create: vi.fn(),
  findUnique: vi.fn(),
  findMany: vi.fn(),
  update: vi.fn(),
  updateMany: vi.fn(),
}

const mockTransaction = vi.fn()

const mockPrisma = {
  otpCode: mockOtpCodeDb,
  user: mockUserDb,
  refreshToken: mockRefreshTokenDb,
  $transaction: mockTransaction,
}

// WhatsApp adapter mock
const mockWhatsApp: WhatsAppAdapter = {
  sendOtp: vi.fn(async () => {}),
}

// ─── Setup ────────────────────────────────────────────────────────────────────

describe('AuthService', () => {
  let service: AuthService

  beforeEach(() => {
    vi.clearAllMocks()
    vi.unstubAllEnvs()
    service = new AuthService(mockPrisma as never, mockWhatsApp, 'test-secret')
  })

  // ─── requestOtp ─────────────────────────────────────────────────────────────

  describe('requestOtp', () => {
    it('retorna expiresIn 300 quando telefone válido e dentro do rate limit', async () => {
      mockOtpCodeDb.count.mockResolvedValue(0)
      mockOtpCodeDb.create.mockResolvedValue(mockOtpCode)

      const result = await service.requestOtp('+5511999990001')

      expect(result).toEqual({ expiresIn: 300 })
      expect(mockOtpCodeDb.create).toHaveBeenCalledOnce()
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockWhatsApp.sendOtp).toHaveBeenCalledOnce()
    })

    it('nunca expõe o código OTP na resposta', async () => {
      mockOtpCodeDb.count.mockResolvedValue(0)
      mockOtpCodeDb.create.mockResolvedValue(mockOtpCode)

      const result = await service.requestOtp('+5511999990001')

      // A resposta não deve conter nenhum campo além de expiresIn
      expect(result).not.toHaveProperty('code')
      expect(result).not.toHaveProperty('phone')
      expect(Object.keys(result)).toEqual(['expiresIn'])
    })

    it('lança OtpRateLimitError quando já existem 3 requests nos últimos 15 min', async () => {
      mockOtpCodeDb.count.mockResolvedValue(3)

      await expect(service.requestOtp('+5511999990001')).rejects.toBeInstanceOf(OtpRateLimitError)

      expect(mockOtpCodeDb.create).not.toHaveBeenCalled()
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockWhatsApp.sendOtp).not.toHaveBeenCalled()
    })

    it('OtpRateLimitError tem statusCode 429', async () => {
      mockOtpCodeDb.count.mockResolvedValue(3)

      const error = await service.requestOtp('+5511999990001').catch((e: unknown) => e)
      expect(error).toBeInstanceOf(OtpRateLimitError)
      expect((error as OtpRateLimitError).statusCode).toBe(429)
    })
  })

  // ─── verifyOtp ──────────────────────────────────────────────────────────────

  describe('verifyOtp', () => {
    beforeEach(() => {
      // Por padrão a transaction executa o callback diretamente
      mockTransaction.mockImplementation(async (fn: (tx: typeof mockPrisma) => Promise<unknown>) =>
        fn(mockPrisma),
      )
    })

    it('happy path: retorna tokens e usuário existente', async () => {
      mockOtpCodeDb.findFirst.mockResolvedValue(mockOtpCode)
      mockOtpCodeDb.update.mockResolvedValue({ ...mockOtpCode, attempts: 1 })
      mockUserDb.findUnique.mockResolvedValue({ ...mockUser, profile: { id: 'p-1' } })
      mockRefreshTokenDb.create.mockResolvedValue(mockRefreshToken)

      const result = await service.verifyOtp('+5511999990001', '123456')

      expect(result.accessToken).toBe('mock.access.token')
      // Formato <recordId>.<segredo> — lookup por PK no refresh
      expect(result.refreshToken).toBe('rt-1.mock-refresh-token-raw-hex')
      expect(result.needsOnboarding).toBe(false)
      expect(result.user.id).toBe('user-1')
    })

    it('needsOnboarding=true quando usuário novo sem perfil', async () => {
      mockOtpCodeDb.findFirst.mockResolvedValue(mockOtpCode)
      mockOtpCodeDb.update.mockResolvedValue({ ...mockOtpCode, attempts: 1 })
      // Primeiro findUnique retorna null (não existe), depois create retorna user sem profile
      mockUserDb.findUnique.mockResolvedValue(null)
      mockUserDb.create.mockResolvedValue({ ...mockUser, profile: null })
      mockRefreshTokenDb.create.mockResolvedValue(mockRefreshToken)

      const result = await service.verifyOtp('+5511999990001', '123456')

      expect(result.needsOnboarding).toBe(true)
      expect(mockUserDb.create).toHaveBeenCalledOnce()
    })

    it('lança OtpInvalidError quando não há OTP válido', async () => {
      mockOtpCodeDb.findFirst.mockResolvedValue(null)

      await expect(service.verifyOtp('+5511999990001', '123456')).rejects.toBeInstanceOf(
        OtpInvalidError,
      )
    })

    it('lança OtpMaxAttemptsError quando attempts >= 5', async () => {
      mockOtpCodeDb.findFirst.mockResolvedValue({ ...mockOtpCode, attempts: 5 })

      await expect(service.verifyOtp('+5511999990001', '123456')).rejects.toBeInstanceOf(
        OtpMaxAttemptsError,
      )

      // Não deve tentar update nem criar tokens
      expect(mockOtpCodeDb.update).not.toHaveBeenCalled()
    })

    it('lança OtpInvalidError (após increment) quando código errado', async () => {
      mockOtpCodeDb.findFirst.mockResolvedValue(mockOtpCode)
      mockOtpCodeDb.update.mockResolvedValue({ ...mockOtpCode, attempts: 1 })

      // bcrypt.compare retornará false para código errado
      mockBcryptCompare.mockResolvedValueOnce(false)

      await expect(service.verifyOtp('+5511999990001', '999999')).rejects.toBeInstanceOf(
        OtpInvalidError,
      )

      // Deve ter incrementado attempts antes de verificar
      expect(mockOtpCodeDb.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { attempts: { increment: 1 } } }),
      )
    })

    it('incrementa attempts antes de verificar o código (previne timing abuse)', async () => {
      const callOrder: string[] = []
      mockOtpCodeDb.findFirst.mockResolvedValue(mockOtpCode)
      mockOtpCodeDb.update
        .mockImplementationOnce(() => {
          callOrder.push('increment')
          return Promise.resolve({ ...mockOtpCode, attempts: 1 })
        })
        .mockImplementationOnce(() => {
          callOrder.push('markUsed')
          return Promise.resolve({ ...mockOtpCode, usedAt: new Date() })
        })
      mockUserDb.findUnique.mockResolvedValue(mockUser)
      mockRefreshTokenDb.create.mockResolvedValue(mockRefreshToken)

      await service.verifyOtp('+5511999990001', '123456')

      expect(callOrder[0]).toBe('increment')
      expect(callOrder[1]).toBe('markUsed')
    })

    it('OTP expirado: findFirst retorna null (filtro expiresAt: gt now)', async () => {
      // Quando o OTP está expirado, o findFirst com expiresAt > now não o encontrará
      mockOtpCodeDb.findFirst.mockResolvedValue(null)

      await expect(service.verifyOtp('+5511999990001', '123456')).rejects.toBeInstanceOf(
        OtpInvalidError,
      )
    })

    it('resposta de OTP inválido não vaza informação (mesmo erro para não-encontrado e expirado)', async () => {
      // Caso 1: OTP não existe
      mockOtpCodeDb.findFirst.mockResolvedValue(null)
      const err1 = await service.verifyOtp('+5511999990001', '123456').catch((e: unknown) => e)

      // Ambos devem ser OtpInvalidError com a mesma mensagem
      expect(err1).toBeInstanceOf(OtpInvalidError)
      expect((err1 as OtpInvalidError).code).toBe('OTP_INVALID')
    })
  })

  // ─── refreshAccessToken ──────────────────────────────────────────────────────

  describe('refreshAccessToken', () => {
    beforeEach(() => {
      // Rotação roda em $transaction com callback
      mockTransaction.mockImplementation(async (fn: (tx: typeof mockPrisma) => Promise<unknown>) =>
        fn(mockPrisma),
      )
    })

    describe('formato novo (<id>.<segredo>)', () => {
      it('faz lookup por PK (sem scan) e retorna novos tokens', async () => {
        mockRefreshTokenDb.findUnique.mockResolvedValue(mockRefreshToken)
        mockUserDb.findUnique.mockResolvedValue(mockUser)
        mockRefreshTokenDb.update.mockResolvedValue({ ...mockRefreshToken, revokedAt: new Date() })
        mockRefreshTokenDb.create.mockResolvedValue({ ...mockRefreshToken, id: 'rt-2' })

        const result = await service.refreshAccessToken('rt-1.mock-refresh-token-raw-hex')

        expect(mockRefreshTokenDb.findUnique).toHaveBeenCalledWith({ where: { id: 'rt-1' } })
        expect(mockRefreshTokenDb.findMany).not.toHaveBeenCalled()
        expect(result.accessToken).toBe('mock.access.token')
        expect(result.refreshToken).toBe('rt-2.mock-refresh-token-raw-hex')
      })

      it('lança RefreshTokenInvalidError quando o segredo não bate', async () => {
        mockRefreshTokenDb.findUnique.mockResolvedValue(mockRefreshToken)
        mockBcryptCompare.mockResolvedValueOnce(false)

        await expect(service.refreshAccessToken('rt-1.segredo-errado')).rejects.toBeInstanceOf(
          RefreshTokenInvalidError,
        )
      })

      it('aceita token revogado há pouco (grace window de refresh concorrente) sem re-revogar', async () => {
        mockRefreshTokenDb.findUnique.mockResolvedValue({
          ...mockRefreshToken,
          revokedAt: new Date(Date.now() - 10_000), // 10s atrás — dentro da janela de 60s
        })
        mockUserDb.findUnique.mockResolvedValue(mockUser)
        mockRefreshTokenDb.create.mockResolvedValue({ ...mockRefreshToken, id: 'rt-2' })

        const result = await service.refreshAccessToken('rt-1.mock-refresh-token-raw-hex')

        expect(result.refreshToken).toBe('rt-2.mock-refresh-token-raw-hex')
        expect(mockRefreshTokenDb.update).not.toHaveBeenCalled()
        expect(mockRefreshTokenDb.updateMany).not.toHaveBeenCalled()
      })

      it('reuso fora da grace window revoga a família inteira e rejeita', async () => {
        mockRefreshTokenDb.findUnique.mockResolvedValue({
          ...mockRefreshToken,
          revokedAt: new Date(Date.now() - 5 * 60_000), // 5 min atrás — fora da janela
        })

        await expect(
          service.refreshAccessToken('rt-1.mock-refresh-token-raw-hex'),
        ).rejects.toBeInstanceOf(RefreshTokenInvalidError)

        expect(mockRefreshTokenDb.updateMany).toHaveBeenCalledWith(
          expect.objectContaining({ where: { userId: 'user-1', revokedAt: null } }),
        )
        expect(mockRefreshTokenDb.create).not.toHaveBeenCalled()
      })
    })

    describe('formato legado (hex sem id)', () => {
      it('retorna novos tokens via scan limitado', async () => {
        mockRefreshTokenDb.findMany.mockResolvedValue([mockRefreshToken])
        mockUserDb.findUnique.mockResolvedValue(mockUser)
        mockRefreshTokenDb.update.mockResolvedValue({ ...mockRefreshToken, revokedAt: new Date() })
        mockRefreshTokenDb.create.mockResolvedValue({ ...mockRefreshToken, id: 'rt-2' })

        const result = await service.refreshAccessToken('mock-refresh-token-raw-hex')

        expect(result.accessToken).toBe('mock.access.token')
        expect(result.refreshToken).toBe('rt-2.mock-refresh-token-raw-hex')
      })

      it('lança RefreshTokenInvalidError quando token não encontrado', async () => {
        mockRefreshTokenDb.findMany.mockResolvedValue([])

        await expect(service.refreshAccessToken('invalid-token')).rejects.toBeInstanceOf(
          RefreshTokenInvalidError,
        )
      })

      it('revoga o token antigo ao emitir novo (rotação)', async () => {
        mockRefreshTokenDb.findMany.mockResolvedValue([mockRefreshToken])
        mockUserDb.findUnique.mockResolvedValue(mockUser)
        mockRefreshTokenDb.update.mockResolvedValue({ ...mockRefreshToken, revokedAt: new Date() })
        mockRefreshTokenDb.create.mockResolvedValue({ ...mockRefreshToken, id: 'rt-2' })

        await service.refreshAccessToken('mock-refresh-token-raw-hex')

        expect(mockRefreshTokenDb.update).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { id: 'rt-1' },
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            data: expect.objectContaining({ revokedAt: expect.any(Date) }),
          }),
        )
      })
    })
  })

  // ─── Contas demo ─────────────────────────────────────────────────────────────

  describe('contas demo', () => {
    beforeEach(() => {
      // Limpeza fica no beforeEach raiz (vi.unstubAllEnvs) — sem teardown aqui
      vi.stubEnv('DEMO_PHONES', '+5511999990001,+5511999990002')
      vi.stubEnv('DEMO_OTP', '654321')
      mockTransaction.mockImplementation(async (fn: (tx: typeof mockPrisma) => Promise<unknown>) =>
        fn(mockPrisma),
      )
    })

    it('requestOtp não grava OTP nem envia WhatsApp', async () => {
      const result = await service.requestOtp('+5511999990001')

      expect(result).toEqual({ expiresIn: 300 })
      expect(mockOtpCodeDb.create).not.toHaveBeenCalled()
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockWhatsApp.sendOtp).not.toHaveBeenCalled()
    })

    it('verifyOtp emite sessão com o código demo sem tocar na tabela de OTP', async () => {
      mockUserDb.findUnique.mockResolvedValue({ ...mockUser, profile: { id: 'p-1' } })
      mockRefreshTokenDb.create.mockResolvedValue(mockRefreshToken)

      const result = await service.verifyOtp('+5511999990001', '654321')

      expect(result.accessToken).toBe('mock.access.token')
      expect(result.refreshToken).toBe('rt-1.mock-refresh-token-raw-hex')
      expect(mockOtpCodeDb.findFirst).not.toHaveBeenCalled()
    })

    it('verifyOtp lança OtpInvalidError com código demo errado', async () => {
      await expect(service.verifyOtp('+5511999990001', '000000')).rejects.toBeInstanceOf(
        OtpInvalidError,
      )
    })

    it('bypass desativado quando DEMO_OTP está vazio', async () => {
      vi.stubEnv('DEMO_OTP', '')

      await expect(service.verifyOtp('+5511999990001', '654321')).rejects.toBeInstanceOf(
        OtpInvalidError,
      )
    })
  })

  // ─── logout ──────────────────────────────────────────────────────────────────

  describe('logout', () => {
    it('revoga o refresh token do usuário', async () => {
      mockRefreshTokenDb.findMany.mockResolvedValue([mockRefreshToken])
      mockRefreshTokenDb.update.mockResolvedValue({ ...mockRefreshToken, revokedAt: new Date() })

      await service.logout('user-1', 'mock-refresh-token-raw-hex')

      expect(mockRefreshTokenDb.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'rt-1' },
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          data: expect.objectContaining({ revokedAt: expect.any(Date) }),
        }),
      )
    })

    it('não lança erro se refresh token não encontrado (logout idempotente)', async () => {
      mockRefreshTokenDb.findMany.mockResolvedValue([])

      await expect(service.logout('user-1', 'unknown-token')).resolves.not.toThrow()
    })
  })
})
