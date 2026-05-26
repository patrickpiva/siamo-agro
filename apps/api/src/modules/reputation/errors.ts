import { AppError } from '@agraia/shared'

export class RatingNotAllowedError extends AppError {
  constructor(reason: string) {
    super(reason, 'RATING_NOT_ALLOWED', 422)
  }
}

export class RatingConflictError extends AppError {
  constructor() {
    super('Você já avaliou esta transação', 'RATING_CONFLICT', 409)
  }
}

export class ProfileNotFoundError extends AppError {
  constructor(id: string) {
    super(`Profile not found: ${id}`, 'PROFILE_NOT_FOUND', 404)
  }
}
