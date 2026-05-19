import { AppError } from '@agrolink/shared'

export class ProfileAlreadyExistsError extends AppError {
  constructor() {
    super('Perfil já existe para este usuário', 'PROFILE_ALREADY_EXISTS', 409)
  }
}

export class ProfileNotFoundError extends AppError {
  constructor() {
    super('Perfil não encontrado', 'PROFILE_NOT_FOUND', 404)
  }
}
