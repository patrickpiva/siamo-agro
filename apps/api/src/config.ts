import { AppError } from '@siamo/shared'

export class MissingEnvError extends AppError {
  constructor(name: string) {
    super(`Variável de ambiente obrigatória ausente: ${name}`, 'CONFIG_MISSING_ENV', 500)
  }
}

/**
 * Em produção JWT_SECRET é obrigatório — sem fallback. Um fallback silencioso
 * permitiria forjar tokens com um segredo público caso a env suma do ambiente.
 * Em dev/test cai no segredo de desenvolvimento.
 */
export function getJwtSecret(): string {
  const secret = process.env['JWT_SECRET']
  if (secret) return secret
  if (process.env['NODE_ENV'] === 'production') throw new MissingEnvError('JWT_SECRET')
  return 'dev-secret-change-in-production'
}
