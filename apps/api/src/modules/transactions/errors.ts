import { AppError } from '@agraia/shared'

export class TransactionNotFoundError extends AppError {
  constructor(id: string) {
    super(`Transaction not found: ${id}`, 'TRANSACTION_NOT_FOUND', 404)
  }
}

export class TransactionForbiddenError extends AppError {
  constructor(reason: string) {
    super(reason, 'TRANSACTION_FORBIDDEN', 403)
  }
}

export class TransactionConflictError extends AppError {
  constructor(reason: string) {
    super(reason, 'TRANSACTION_CONFLICT', 409)
  }
}

export class TransactionInvalidStateError extends AppError {
  constructor(current: string, expected: string) {
    super(
      `Transação em estado '${current}', esperado '${expected}'`,
      'TRANSACTION_INVALID_STATE',
      422,
    )
  }
}
