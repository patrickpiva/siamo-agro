import { AppError } from '@agrolink/shared'

// OTP request
export class OtpRateLimitError extends AppError {
  constructor(phone: string) {
    super(`Muitas tentativas para ${phone}. Aguarde 15 minutos.`, 'OTP_RATE_LIMIT', 429)
  }
}

// OTP verify — mensagens intencionalmente genéricas para não vazar informações
export class OtpInvalidError extends AppError {
  constructor() {
    super('Código inválido ou expirado.', 'OTP_INVALID', 400)
  }
}

export class OtpMaxAttemptsError extends AppError {
  constructor() {
    super('Número de tentativas excedido. Solicite um novo código.', 'OTP_MAX_ATTEMPTS', 429)
  }
}

// Refresh token
export class RefreshTokenInvalidError extends AppError {
  constructor() {
    super('Refresh token inválido ou expirado.', 'REFRESH_TOKEN_INVALID', 401)
  }
}
