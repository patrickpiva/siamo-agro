import { describe, it, expect, vi } from 'vitest'
import { UploadsService } from './service.js'
import { UploadConfirmFailedError, UploadStorageNotConfiguredError } from './errors.js'
import type { StorageAdapter, StorageBucket } from './service.js'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeBucket(overrides: Partial<StorageBucket> = {}): StorageBucket {
  return {
    createSignedUploadUrl: vi.fn().mockResolvedValue({
      data: { signedUrl: 'https://storage.example.com/upload?token=abc', token: 'abc', path: '' },
      error: null,
    }),
    createSignedUrl: vi.fn().mockResolvedValue({
      data: { signedUrl: 'https://storage.example.com/signed' },
      error: null,
    }),
    getPublicUrl: vi.fn().mockReturnValue({
      data: { publicUrl: 'https://storage.example.com/public/listings/user1/file.jpg' },
    }),
    ...overrides,
  }
}

function makeStorage(bucket?: StorageBucket): StorageAdapter {
  const b = bucket ?? makeBucket()
  return { from: vi.fn().mockReturnValue(b) }
}

// ─── UploadsService ───────────────────────────────────────────────────────────

describe('UploadsService', () => {
  const userId = 'user-abc'

  // ── presigned ─────────────────────────────────────────────────────────────

  describe('presigned', () => {
    it('gera 1 upload item para kind listing', async () => {
      const storage = makeStorage()
      const service = new UploadsService(storage)

      const result = await service.presigned(userId, { kind: 'listing', count: 1 })

      expect(result).toHaveLength(1)
      expect(result[0]!.uploadUrl).toContain('https://')
      expect(result[0]!.publicUrl).toContain('https://')
      expect(result[0]!.key).toMatch(/^listings\//)
    })

    it('gera 8 upload items em paralelo', async () => {
      const storage = makeStorage()
      const service = new UploadsService(storage)

      const result = await service.presigned(userId, { kind: 'listing', count: 8 })

      expect(result).toHaveLength(8)
      expect(storage.from).toHaveBeenCalledTimes(16) // createSignedUploadUrl + getPublicUrl por item
    })

    it('usa bucket "profiles" para kind profile', async () => {
      const storage = makeStorage()
      const service = new UploadsService(storage)

      await service.presigned(userId, { kind: 'profile', count: 1 })

      expect(storage.from).toHaveBeenCalledWith('profiles')
    })

    it('inclui userId no path gerado', async () => {
      const bucket = makeBucket()
      const storage = makeStorage(bucket)
      const service = new UploadsService(storage)

      const result = await service.presigned(userId, { kind: 'listing', count: 1 })

      expect(result[0]!.key).toContain(userId)
    })

    it('lança UploadStorageNotConfiguredError se storage retorna erro', async () => {
      const bucket = makeBucket({
        createSignedUploadUrl: vi
          .fn()
          .mockResolvedValue({ data: null, error: { message: 'fail' } }),
      })
      const service = new UploadsService(makeStorage(bucket))

      await expect(service.presigned(userId, { kind: 'listing', count: 1 })).rejects.toBeInstanceOf(
        UploadStorageNotConfiguredError,
      )
    })
  })

  // ── confirm ───────────────────────────────────────────────────────────────

  describe('confirm', () => {
    it('retorna URLs públicas para keys válidas', async () => {
      const storage = makeStorage()
      const service = new UploadsService(storage)

      const urls = await service.confirm(['listings/user-abc/file1.jpg'])

      expect(urls).toHaveLength(1)
      expect(urls[0]).toContain('https://')
    })

    it('usa o bucket correto com base no prefixo da key', async () => {
      const storage = makeStorage()
      const service = new UploadsService(storage)

      await service.confirm(['profiles/user-abc/photo.jpg'])

      expect(storage.from).toHaveBeenCalledWith('profiles')
    })

    it('lança UploadConfirmFailedError se arquivo não existe', async () => {
      const bucket = makeBucket({
        createSignedUrl: vi.fn().mockResolvedValue({ data: null, error: { message: 'not found' } }),
      })
      const service = new UploadsService(makeStorage(bucket))

      await expect(service.confirm(['listings/user-abc/missing.jpg'])).rejects.toBeInstanceOf(
        UploadConfirmFailedError,
      )
    })

    it('processa múltiplas keys, lançando erro apenas para a inválida', async () => {
      let callCount = 0
      const bucket = makeBucket({
        createSignedUrl: vi.fn().mockImplementation(() => {
          callCount++
          if (callCount === 2)
            return Promise.resolve({ data: null, error: { message: 'not found' } })
          return Promise.resolve({ data: { signedUrl: 'https://ok' }, error: null })
        }),
      })
      const service = new UploadsService(makeStorage(bucket))

      await expect(
        service.confirm(['listings/u/f1.jpg', 'listings/u/f2.jpg', 'listings/u/f3.jpg']),
      ).rejects.toBeInstanceOf(UploadConfirmFailedError)
    })
  })
})
