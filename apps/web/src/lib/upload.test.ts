import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { validateFile, uploadImages } from './upload'

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

    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        if (String(url).includes('/presigned')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                data: {
                  uploads: [
                    {
                      uploadUrl: 'https://storage.example.com/upload/file1',
                      publicUrl: 'https://storage.example.com/public/file1.jpg',
                      key: 'listings/user1/file1.jpg',
                    },
                  ],
                },
              }),
          })
        }
        if (String(url).includes('/confirm')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                data: { urls: ['https://storage.example.com/public/file1.jpg'] },
              }),
          })
        }
        return Promise.reject(new Error('URL inesperada'))
      }),
    )
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('rejeita arquivo com tipo inválido antes de fazer requisição', async () => {
    const file = new File(['x'], 'doc.pdf', { type: 'application/pdf' })
    await expect(uploadImages([file], 'listing', 'token')).rejects.toThrow('tipo inválido')
    expect(fetch).not.toHaveBeenCalled()
  })

  it('rejeita arquivo acima de 5MB antes de fazer requisição', async () => {
    const bigData = new Uint8Array(5 * 1024 * 1024 + 1)
    const file = new File([bigData], 'grande.jpg', { type: 'image/jpeg' })
    await expect(uploadImages([file], 'listing', 'token')).rejects.toThrow('5MB')
    expect(fetch).not.toHaveBeenCalled()
  })

  it('solicita presigned URL com kind e count corretos', async () => {
    const file = new File(['x'], 'foto.jpg', { type: 'image/jpeg' })
    await uploadImages([file], 'listing', 'my-token').catch(() => {})

    const presignedCall = (fetch as ReturnType<typeof vi.fn>).mock.calls.find((args) =>
      String(args[0]).includes('/presigned'),
    )
    expect(presignedCall).toBeDefined()
    const init = presignedCall![1] as { body: string }
    const body = JSON.parse(init.body) as { kind: string; count: number }
    expect(body.kind).toBe('listing')
    expect(body.count).toBe(1)
  })

  it('envia Authorization header nas requisições', async () => {
    const file = new File(['x'], 'foto.jpg', { type: 'image/jpeg' })
    await uploadImages([file], 'listing', 'bearer-xyz').catch(() => {})

    const presignedCall = (fetch as ReturnType<typeof vi.fn>).mock.calls.find((args) =>
      String(args[0]).includes('/presigned'),
    )
    const init = presignedCall![1] as { headers: Record<string, string> }
    expect(init.headers['Authorization']).toBe('Bearer bearer-xyz')
  })
})
