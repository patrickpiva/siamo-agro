import { UploadStorageNotConfiguredError, UploadConfirmFailedError } from './errors.js'
import type { PresignedBody } from './schema.js'

// ─── Storage adapter interface (testável) ─────────────────────────────────────

export interface StorageBucket {
  createSignedUploadUrl(
    path: string,
    options?: { upsert?: boolean },
  ): Promise<{
    data: { signedUrl: string; token: string; path: string } | null
    error: { message: string } | null
  }>
  createSignedUrl(
    path: string,
    expiresIn: number,
  ): Promise<{
    data: { signedUrl: string } | null
    error: { message: string } | null
  }>
  getPublicUrl(path: string): { data: { publicUrl: string } }
}

export interface StorageAdapter {
  from: (bucket: string) => StorageBucket
}

export interface PresignedUploadItem {
  uploadUrl: string
  publicUrl: string
  key: string
}

// ─── UploadsService ───────────────────────────────────────────────────────────

export class UploadsService {
  constructor(private readonly storage: StorageAdapter) {}

  // ── Presigned ────────────────────────────────────────────────────────────────

  async presigned(userId: string, body: PresignedBody): Promise<PresignedUploadItem[]> {
    const bucket = body.kind === 'listing' ? 'listings' : 'profiles'

    return Promise.all(
      Array.from({ length: body.count }, async () => {
        const fileId = crypto.randomUUID().replace(/-/g, '')
        const path = `${userId}/${fileId}.jpg`

        const { data, error } = await this.storage
          .from(bucket)
          .createSignedUploadUrl(path, { upsert: true })

        if (error || !data) throw new UploadStorageNotConfiguredError()

        const {
          data: { publicUrl },
        } = this.storage.from(bucket).getPublicUrl(path)

        return { uploadUrl: data.signedUrl, publicUrl, key: `${bucket}/${path}` }
      }),
    )
  }

  // ── Confirm ──────────────────────────────────────────────────────────────────

  async confirm(keys: string[]): Promise<string[]> {
    return Promise.all(
      keys.map(async (key) => {
        const slashIdx = key.indexOf('/')
        const bucket = key.slice(0, slashIdx)
        const path = key.slice(slashIdx + 1)

        const { error } = await this.storage.from(bucket).createSignedUrl(path, 60)
        if (error) throw new UploadConfirmFailedError(key)

        const {
          data: { publicUrl },
        } = this.storage.from(bucket).getPublicUrl(path)

        return publicUrl
      }),
    )
  }
}
