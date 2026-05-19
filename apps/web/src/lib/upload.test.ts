import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { validateFile, uploadImages } from './upload'
import { requestPresignedUrls, confirmUpload } from '@/actions/upload'

// Auth and API calls are encapsulated in Server Actions — mock at module level
vi.mock('@/actions/upload', () => ({
  requestPresignedUrls: vi.fn(),
  confirmUpload: vi.fn(),
}))

// ─── validateFile ──────────────────────────────────────────────────────────────

describe('validateFile', () => {
  it('aceita JPG', () => {
    const file = new File(['x'], 'foto.jpg', { type: 'image/jpeg' })
    expect(validateFile(file)).toBeNull()
  })

  it('aceita PNG', () => {
    const file = new File(['x'], 'foto.png', { type: 'image/png' })
    expect(validateFile(file)).toBeNull()
  })

  it('aceita WebP', () => {
    const file = new File(['x'], 'foto.webp', { type: 'image/webp' })
    expect(validateFile(file)).toBeNull()
  })

  it('rejeita arquivo não-imagem com mensagem clara', () => {
    const file = new File(['x'], 'doc.pdf', { type: 'application/pdf' })
    const err = validateFile(file)
    expect(err).toContain('tipo inválido')
    expect(err).toContain('doc.pdf')
  })

  it('rejeita arquivo acima de 5MB com mensagem clara', () => {
    const bigData = new Uint8Array(5 * 1024 * 1024 + 1)
    const file = new File([bigData], 'grande.jpg', { type: 'image/jpeg' })
    const err = validateFile(file)
    expect(err).toContain('5MB')
    expect(err).toContain('grande.jpg')
  })

  it('aceita arquivo exatamente no limite de 5MB', () => {
    const data = new Uint8Array(5 * 1024 * 1024)
    const file = new File([data], 'limite.jpg', { type: 'image/jpeg' })
    expect(validateFile(file)).toBeNull()
  })
})

// ─── uploadImages ──────────────────────────────────────────────────────────────

describe('uploadImages', () => {
  beforeEach(() => {
    vi.mock('browser-image-compression', () => ({
      default: vi.fn().mockImplementation((file: File) => Promise.resolve(file)),
    }))

    // Default happy-path Server Action responses
    vi.mocked(requestPresignedUrls).mockResolvedValue({
      ok: true,
      slots: [
        {
          uploadUrl: 'https://storage.example.com/upload/file1',
          publicUrl: 'https://storage.example.com/public/file1.jpg',
          key: 'listings/user1/file1.jpg',
        },
      ],
    })
    vi.mocked(confirmUpload).mockResolvedValue({
      ok: true,
      urls: ['https://storage.example.com/public/file1.jpg'],
    })

    const xhrMock = {
      open: vi.fn(),
      send: vi.fn().mockImplementation(function (this: { load: EventListener }) {
        setTimeout(() => {
          Object.defineProperty(this, 'status', { value: 200, writable: true })
          this.load?.({} as Event)
        }, 0)
      }),
      setRequestHeader: vi.fn(),
      upload: { addEventListener: vi.fn() },
      addEventListener: vi.fn().mockImplementation(function (
        this: Record<string, EventListener>,
        event: string,
        cb: EventListener,
      ) {
        this[event] = cb
      }),
      status: 200,
    }
    vi.stubGlobal(
      'XMLHttpRequest',
      vi.fn(() => xhrMock),
    )
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('rejeita arquivo com tipo inválido antes de fazer requisição', async () => {
    const file = new File(['x'], 'doc.pdf', { type: 'application/pdf' })
    await expect(uploadImages([file], 'listing')).rejects.toThrow('tipo inválido')
    expect(requestPresignedUrls).not.toHaveBeenCalled()
  })

  it('rejeita arquivo acima de 5MB antes de fazer requisição', async () => {
    const bigData = new Uint8Array(5 * 1024 * 1024 + 1)
    const file = new File([bigData], 'grande.jpg', { type: 'image/jpeg' })
    await expect(uploadImages([file], 'listing')).rejects.toThrow('5MB')
    expect(requestPresignedUrls).not.toHaveBeenCalled()
  })

  it('solicita presigned URL com kind e count corretos', async () => {
    const file = new File(['x'], 'foto.jpg', { type: 'image/jpeg' })
    await uploadImages([file], 'listing')

    expect(requestPresignedUrls).toHaveBeenCalledOnce()
    expect(requestPresignedUrls).toHaveBeenCalledWith('listing', 1)
  })

  it('confirma upload com as keys retornadas pelo presigned', async () => {
    const file = new File(['x'], 'foto.jpg', { type: 'image/jpeg' })
    const urls = await uploadImages([file], 'listing')

    expect(confirmUpload).toHaveBeenCalledOnce()
    expect(confirmUpload).toHaveBeenCalledWith(['listings/user1/file1.jpg'])
    expect(urls).toEqual(['https://storage.example.com/public/file1.jpg'])
  })
})
