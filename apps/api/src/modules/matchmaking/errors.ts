import { AppError } from '@agraia/shared'

export class MatchesListingNotFoundError extends AppError {
  constructor(id: string) {
    super(`Listing not found: ${id}`, 'LISTING_NOT_FOUND', 404)
  }
}

export class MatchesForbiddenError extends AppError {
  constructor() {
    super('Você não tem permissão para ver os matches deste anúncio', 'MATCHES_FORBIDDEN', 403)
  }
}
