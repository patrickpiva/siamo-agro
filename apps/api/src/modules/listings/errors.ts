import { AppError } from '@siamo/shared'

export class ListingNotFoundError extends AppError {
  constructor(id: string) {
    super(`Anúncio não encontrado: ${id}`, 'LISTING_NOT_FOUND', 404)
  }
}

export class ListingForbiddenError extends AppError {
  constructor() {
    super('Sem permissão para modificar este anúncio', 'LISTING_FORBIDDEN', 403)
  }
}

export class ListingInvalidCategoryError extends AppError {
  constructor(category: string, kind: string) {
    super(
      `Categoria "${category}" inválida para o tipo de anúncio "${kind}"`,
      'LISTING_INVALID_CATEGORY',
      422,
    )
  }
}

export class ListingProfileNotFoundError extends AppError {
  constructor() {
    super(
      'Perfil não encontrado. Complete o cadastro antes de publicar um anúncio.',
      'LISTING_PROFILE_NOT_FOUND',
      403,
    )
  }
}

export class ListingPhotoOwnershipError extends AppError {
  constructor() {
    super('Uma ou mais fotos não pertencem ao usuário autenticado', 'LISTING_PHOTO_FORBIDDEN', 403)
  }
}

/**
 * `radiusKm` was sent but no origin point could be resolved — neither explicit
 * lat/lng nor a location on the requesting user's profile.
 *
 * Deliberately an error rather than silently dropping the filter: a distance
 * filter that quietly does nothing shows the user far-away listings while their
 * UI still reads "within 50 km".
 */
export class ListingLocationRequiredError extends AppError {
  constructor() {
    super(
      'Filtro de distância exige uma localização. Envie lat/lng ou cadastre sua localização no perfil.',
      'LISTING_LOCATION_REQUIRED',
      422,
    )
  }
}

/**
 * `minMatchScore` was sent on an anonymous request. A match score only exists
 * relative to a specific viewer's profile, so there is nothing to filter on.
 */
export class ListingMatchFilterUnauthenticatedError extends AppError {
  constructor() {
    super('Filtro por score de match exige login.', 'LISTING_MATCH_FILTER_UNAUTHENTICATED', 401)
  }
}
