import { randomBytes, randomInt } from 'node:crypto'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import type { PrismaClient } from '@agraia/db'
import type { WhatsAppAdapter } from '../../adapters/whatsapp/index.js'
import {
  OtpRateLimitError,
  OtpInvalidError,
  OtpMaxAttemptsError,
  RefreshTokenInvalidError,
} from './errors.js'
import type { AuthUser } from './schema.js'

// ─── Constantes ───────────────────────────────────────────────────────────────

const OTP_EXPIRES_SECONDS = 5 * 60 // 5 minutos
const OTP_RATE_LIMIT_MAX = 3 // máx requests por janela
const OTP_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000 // 15 minutos
const OTP_MAX_ATTEMPTS = 5
const BCRYPT_ROUNDS = 10
const ACCESS_TOKEN_TTL = '15m'
const REFRESH_TOKEN_EXPIRES_DAYS = 30

// ─── Tipos internos ───────────────────────────────────────────────────────────

interface JwtPayload {
  id: string
  phone: string
}

interface VerifyOtpResult {
  accessToken: string
  refreshToken: string
  user: AuthUser
  needsOnboarding: boolean
}

interface RefreshResult {
  accessToken: string
  refreshToken: string
}

// ─── AuthService ──────────────────────────────────────────────────────────────

export class AuthService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly whatsapp: WhatsAppAdapter,
    private readonly jwtSecret: string,
  ) {}

  // ── OTP Request ─────────────────────────────────────────────────────────────

  async requestOtp(phone: string): Promise<{ expiresIn: number }> {
    // Demo accounts: skip rate limit, DB write and WhatsApp delivery
    if (this.isDemoPhone(phone)) {
      console.info(`[auth] OTP demo solicitado para ${this.maskPhone(phone)} — sem envio`)
      return { expiresIn: OTP_EXPIRES_SECONDS }
    }

    await this.enforceRateLimit(phone)

    const code = randomInt(100_000, 999_999).toString()
    const codeHash = await bcrypt.hash(code, BCRYPT_ROUNDS)
    const expiresAt = new Date(Date.now() + OTP_EXPIRES_SECONDS * 1000)

    await this.prisma.otpCode.create({
      data: { phone, code: codeHash, expiresAt },
    })

    // Auditoria: logamos apenas que um OTP foi solicitado — nunca o código
    console.info(`[auth] OTP solicitado para ${this.maskPhone(phone)}`)

    await this.whatsapp.sendOtp(phone, code)

    return { expiresIn: OTP_EXPIRES_SECONDS }
  }

  // ── OTP Verify ──────────────────────────────────────────────────────────────

  async verifyOtp(phone: string, code: string): Promise<VerifyOtpResult> {
    // Demo accounts: fixed OTP, skip the entire OTP table flow
    if (this.isDemoPhone(phone)) {
      if (!this.demoOtp || code !== this.demoOtp) throw new OtpInvalidError()
      return this.issueSessionForPhone(phone)
    }

    const result = await this.prisma.$transaction(async (tx) => {
      // Busca o OTP mais recente, válido e não usado
      const otp = await tx.otpCode.findFirst({
        where: {
          phone,
          usedAt: null,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: 'desc' },
      })

      if (!otp) {
        // Auditoria: sem exposição do motivo exato
        console.info(`[auth] OTP inválido/expirado para ${this.maskPhone(phone)}`)
        throw new OtpInvalidError()
      }

      if (otp.attempts >= OTP_MAX_ATTEMPTS) {
        console.info(`[auth] OTP bloqueado (max tentativas) para ${this.maskPhone(phone)}`)
        throw new OtpMaxAttemptsError()
      }

      // Incrementa tentativas ANTES de verificar (previne timing abuse)
      await tx.otpCode.update({
        where: { id: otp.id },
        data: { attempts: { increment: 1 } },
      })

      const isValid = await bcrypt.compare(code, otp.code)

      if (!isValid) {
        console.info(
          `[auth] Tentativa incorreta ${otp.attempts + 1}/${OTP_MAX_ATTEMPTS} para ${this.maskPhone(phone)}`,
        )
        throw new OtpInvalidError()
      }

      // Marca OTP como usado
      await tx.otpCode.update({
        where: { id: otp.id },
        data: { usedAt: new Date() },
      })

      // Busca ou cria o usuário
      let user = await tx.user.findUnique({
        where: { phone },
        include: { profile: true },
      })

      if (!user) {
        user = await tx.user.create({
          data: { phone, status: 'ACTIVE' },
          include: { profile: true },
        })
      }

      const needsOnboarding = !user.profile

      // Gera tokens
      const accessToken = this.signAccessToken({ id: user.id, phone: user.phone ?? '' })
      const { raw: refreshToken, hash: refreshTokenHash } = await this.generateRefreshToken()

      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRES_DAYS)

      await tx.refreshToken.create({
        data: {
          userId: user.id,
          tokenHash: refreshTokenHash,
          expiresAt,
        },
      })

      console.info(`[auth] Login bem-sucedido para user ${user.id}`)

      return {
        accessToken,
        refreshToken,
        needsOnboarding,
        user: {
          id: user.id,
          phone: user.phone,
          status: user.status,
          createdAt: user.createdAt.toISOString(),
        } satisfies AuthUser,
      }
    })

    return result
  }

  // ── Refresh Token ───────────────────────────────────────────────────────────

  async refreshAccessToken(rawRefreshToken: string): Promise<RefreshResult> {
    // Busca todos os refresh tokens ativos do usuário e tenta fazer bcrypt.compare
    // É caro em teoria, mas na prática cada usuário tem poucos tokens ativos
    const activeTokens = await this.prisma.refreshToken.findMany({
      where: {
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      // Sem filtro de userId: precisamos encontrar o token pelo hash
      // Limitamos a busca para evitar full table scan em produção
      // Em escala: armazenar o userId encriptado no token opaco
      orderBy: { createdAt: 'desc' },
      take: 1000, // guard em caso de volume extremo
    })

    let matchedToken: (typeof activeTokens)[number] | null = null

    for (const record of activeTokens) {
      const matches = await bcrypt.compare(rawRefreshToken, record.tokenHash)
      if (matches) {
        matchedToken = record
        break
      }
    }

    if (!matchedToken) {
      throw new RefreshTokenInvalidError()
    }

    // Rotação: revoga o token atual e emite um novo par
    const user = await this.prisma.user.findUnique({
      where: { id: matchedToken.userId },
    })

    if (!user || user.status !== 'ACTIVE') {
      throw new RefreshTokenInvalidError()
    }

    const { raw: newRefreshToken, hash: newRefreshTokenHash } = await this.generateRefreshToken()

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRES_DAYS)

    await this.prisma.$transaction([
      this.prisma.refreshToken.update({
        where: { id: matchedToken.id },
        data: { revokedAt: new Date() },
      }),
      this.prisma.refreshToken.create({
        data: {
          userId: user.id,
          tokenHash: newRefreshTokenHash,
          expiresAt,
        },
      }),
    ])

    const accessToken = this.signAccessToken({
      id: user.id,
      phone: user.phone ?? '',
    })

    return { accessToken, refreshToken: newRefreshToken }
  }

  // ── Logout ──────────────────────────────────────────────────────────────────

  async logout(userId: string, rawRefreshToken: string): Promise<void> {
    const activeTokens = await this.prisma.refreshToken.findMany({
      where: { userId, revokedAt: null },
    })

    for (const record of activeTokens) {
      const matches = await bcrypt.compare(rawRefreshToken, record.tokenHash)
      if (matches) {
        await this.prisma.refreshToken.update({
          where: { id: record.id },
          data: { revokedAt: new Date() },
        })
        break
      }
    }
  }

  // ── Helpers privados ────────────────────────────────────────────────────────

  /** Issues a full session (tokens + user record) for a phone, bypassing OTP. */
  private async issueSessionForPhone(phone: string): Promise<VerifyOtpResult> {
    return this.prisma.$transaction(async (tx) => {
      let user = await tx.user.findUnique({
        where: { phone },
        include: { profile: true },
      })

      if (!user) {
        user = await tx.user.create({
          data: { phone, status: 'ACTIVE' },
          include: { profile: true },
        })
      }

      const needsOnboarding = !user.profile
      const accessToken = this.signAccessToken({ id: user.id, phone: user.phone ?? '' })
      const { raw: refreshToken, hash: refreshTokenHash } = await this.generateRefreshToken()

      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRES_DAYS)

      await tx.refreshToken.create({
        data: { userId: user.id, tokenHash: refreshTokenHash, expiresAt },
      })

      console.info(`[auth] Login demo para user ${user.id}`)

      return {
        accessToken,
        refreshToken,
        needsOnboarding,
        user: {
          id: user.id,
          phone: user.phone,
          status: user.status,
          createdAt: user.createdAt.toISOString(),
        } satisfies AuthUser,
      }
    })
  }

  private isDemoPhone(phone: string): boolean {
    const list = process.env['DEMO_PHONES'] ?? ''
    if (!list) return false
    return list
      .split(',')
      .map((p) => p.trim())
      .includes(phone)
  }

  private get demoOtp(): string {
    return process.env['DEMO_OTP'] ?? ''
  }

  private async enforceRateLimit(phone: string): Promise<void> {
    const windowStart = new Date(Date.now() - OTP_RATE_LIMIT_WINDOW_MS)

    const count = await this.prisma.otpCode.count({
      where: {
        phone,
        createdAt: { gte: windowStart },
      },
    })

    if (count >= OTP_RATE_LIMIT_MAX) {
      console.info(`[auth] Rate limit atingido para ${this.maskPhone(phone)}`)
      throw new OtpRateLimitError(this.maskPhone(phone))
    }
  }

  private signAccessToken(payload: JwtPayload): string {
    return jwt.sign(payload, this.jwtSecret, { expiresIn: ACCESS_TOKEN_TTL })
  }

  private async generateRefreshToken(): Promise<{ raw: string; hash: string }> {
    const raw = randomBytes(48).toString('hex') // 96 chars hexadecimais
    const hash = await bcrypt.hash(raw, BCRYPT_ROUNDS)
    return { raw, hash }
  }

  /** Mascara o telefone para logs: +55119****5678 */
  private maskPhone(phone: string): string {
    if (phone.length < 8) return '***'
    return `${phone.slice(0, 5)}****${phone.slice(-4)}`
  }
}
