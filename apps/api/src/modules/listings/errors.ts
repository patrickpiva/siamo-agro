import { AppError } from '@agrolink/shared'

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
