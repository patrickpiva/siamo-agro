import { AppError } from '@agrolink/shared'

export class ListingNotFoundError extends AppError {
  constructor(id: string) {
    super(`Listing not found: ${id}`, 'LISTING_NOT_FOUND', 404)
  }
}
