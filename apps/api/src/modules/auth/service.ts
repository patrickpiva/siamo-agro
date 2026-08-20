import { randomBytes, randomInt, timingSafeEqual } from 'node:crypto'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import type { Prisma, PrismaClient } from '@siamo/db'
import type { WhatsAppAdapter } from '../../integrations/whatsapp/types.js'
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
// Janela em que um token já rotacionado segue aceito: requests concorrentes do
// middleware (várias abas/fetches com o mesmo cookie) disparam refresh em paralelo;
// sem a janela, o segundo request invalidaria a sessão (logout aleatório).
const REFRESH_GRACE_WINDOW_MS = 60_000

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
      if (!this.demoOtpMatches(code)) throw new OtpInvalidError()
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
      const refreshToken = await this.createRefreshToken(tx, user.id)

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
    const matchedToken = await this.findRefreshToken(rawRefreshToken)
    if (!matchedToken) throw new RefreshTokenInvalidError()

    if (matchedToken.revokedAt) {
      const sinceRevoke = Date.now() - matchedToken.revokedAt.getTime()
      if (sinceRevoke > REFRESH_GRACE_WINDOW_MS) {
        // Reuso fora da grace window = possível token vazado → revoga a família
        await this.prisma.refreshToken.updateMany({
          where: { userId: matchedToken.userId, revokedAt: null },
          data: { revokedAt: new Date() },
        })
        console.warn(
          `[auth] Reuso de refresh token revogado para user ${matchedToken.userId} — sessões revogadas`,
        )
        throw new RefreshTokenInvalidError()
      }
      // Dentro da grace window: refresh concorrente legítimo — emite novo par sem re-revogar
    }

    const user = await this.prisma.user.findUnique({
      where: { id: matchedToken.userId },
    })

    if (!user || user.status !== 'ACTIVE') {
      throw new RefreshTokenInvalidError()
    }

    // Rotação: revoga o token atual (se ainda ativo) e emite um novo par
    const newRefreshToken = await this.prisma.$transaction(async (tx) => {
      if (!matchedToken.revokedAt) {
        await tx.refreshToken.update({
          where: { id: matchedToken.id },
          data: { revokedAt: new Date() },
        })
      }
      return this.createRefreshToken(tx, user.id)
    })

    const accessToken = this.signAccessToken({
      id: user.id,
      phone: user.phone ?? '',
    })

    return { accessToken, refreshToken: newRefreshToken }
  }

  // ── Logout ──────────────────────────────────────────────────────────────────

  async logout(userId: string, rawRefreshToken: string): Promise<void> {
    const matched = await this.findRefreshToken(rawRefreshToken)
    // userId vem do JWT autenticado — impede revogar token de outro usuário
    if (!matched || matched.userId !== userId || matched.revokedAt) return

    await this.prisma.refreshToken.update({
      where: { id: matched.id },
      data: { revokedAt: new Date() },
    })
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
      const refreshToken = await this.createRefreshToken(tx, user.id)

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

  /**
   * Token opaco no formato `<recordId>.<segredo>`: o lookup vira um findUnique
   * por PK + 1 bcrypt.compare, em vez do scan O(n) com compare por hash que
   * degradava com o volume de tokens e servia de vetor de DoS.
   */
  private async createRefreshToken(
    tx: Prisma.TransactionClient | PrismaClient,
    userId: string,
  ): Promise<string> {
    const secret = randomBytes(32).toString('hex')
    const hash = await bcrypt.hash(secret, BCRYPT_ROUNDS)

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRES_DAYS)

    const record = await tx.refreshToken.create({
      data: { userId, tokenHash: hash, expiresAt },
    })

    return `${record.id}.${secret}`
  }

  /**
   * Resolve um refresh token cru (`<recordId>.<segredo>`) para o registro no banco:
   * findUnique por PK + 1 bcrypt.compare.
   *
   * O fallback para o formato legado (hex sem `.`) foi removido em 2026-08-20 — ele
   * fazia scan de até 1000 tokens com um bcrypt.compare por iteração. Como
   * `/auth/refresh` é público e **sem rate limit por IP** (ver CLAUDE.md §5), qualquer
   * string sem ponto custava dezenas de segundos de CPU: DoS não autenticado. Tokens
   * legados tinham TTL de 30 dias e expiraram em 2026-07-10, então o caminho já não
   * atendia tráfego legítimo.
   */
  private async findRefreshToken(raw: string) {
    const dotIdx = raw.indexOf('.')
    if (dotIdx <= 0) return null

    const id = raw.slice(0, dotIdx)
    const secret = raw.slice(dotIdx + 1)

    const record = await this.prisma.refreshToken.findUnique({ where: { id } })
    if (!record || record.expiresAt <= new Date()) return null

    const matches = await bcrypt.compare(secret, record.tokenHash)
    return matches ? record : null
  }

  /** Comparação em tempo constante — evita vazar o código demo por timing. */
  private demoOtpMatches(code: string): boolean {
    const expected = this.demoOtp
    if (!expected) return false
    const a = Buffer.from(code)
    const b = Buffer.from(expected)
    return a.length === b.length && timingSafeEqual(a, b)
  }

  /** Mascara o telefone para logs: +55119****5678 */
  private maskPhone(phone: string): string {
    if (phone.length < 8) return '***'
    return `${phone.slice(0, 5)}****${phone.slice(-4)}`
  }
}
