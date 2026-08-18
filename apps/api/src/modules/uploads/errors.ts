import { AppError } from '@siamo/shared'

export class UploadStorageNotConfiguredError extends AppError {
  constructor() {
    super(
      'Storage não configurado: defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY',
      'UPLOAD_STORAGE_NOT_CONFIGURED',
      500,
    )
  }
}

export class UploadStorageError extends AppError {
  constructor(detail: string) {
    super(`Erro no storage: ${detail}`, 'UPLOAD_STORAGE_ERROR', 500)
  }
}

export class UploadConfirmFailedError extends AppError {
  constructor(key: string) {
    super(`Arquivo não encontrado no storage: ${key}`, 'UPLOAD_CONFIRM_FAILED', 422)
  }
}
