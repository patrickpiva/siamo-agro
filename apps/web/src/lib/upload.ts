import { requestPresignedUrls, confirmUpload } from '@/actions/upload'
export type { UploadSlot } from '@/actions/upload'

const MAX_SIZE_BYTES = 5 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export interface UploadProgressCallback {
  (index: number, progress: number): void
}

// ─── Validação ────────────────────────────────────────────────────────────────

export function validateFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return `${file.name}: tipo inválido. Use JPG, PNG ou WebP.`
  }
  if (file.size > MAX_SIZE_BYTES) {
    return `${file.name}: tamanho máximo é 5MB.`
  }
  return null
}

// ─── Compressão ───────────────────────────────────────────────────────────────

async function compressImage(file: File): Promise<File> {
  const imageCompression = (await import('browser-image-compression')).default
  return imageCompression(file, {
    maxSizeMB: 4.9,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    initialQuality: 0.85,
    fileType: file.type,
  })
}

// ─── Storage upload (direct to S3/Supabase, no auth needed) ──────────────────

function uploadToStorage(
  uploadUrl: string,
  file: File,
  onProgress?: (pct: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    })
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve()
      else reject(new Error(`Upload falhou com status ${xhr.status}`))
    })
    xhr.addEventListener('error', () => reject(new Error('Erro de rede ao enviar imagem')))
    xhr.open('PUT', uploadUrl)
    xhr.setRequestHeader('Content-Type', file.type)
    xhr.send(file)
  })
}

// ─── Pipeline principal ───────────────────────────────────────────────────────

export async function uploadImages(
  files: File[],
  kind: 'listing' | 'profile',
  onProgress?: UploadProgressCallback,
): Promise<string[]> {
  // 1. Validar
  const errors = files.map(validateFile).filter(Boolean) as string[]
  if (errors.length > 0) throw new Error(errors.join('\n'))

  // 2. Comprimir
  const compressed = await Promise.all(files.map(compressImage))

  // 3. Obter presigned URLs (via Server Action — lê cookie httpOnly)
  const presignedResult = await requestPresignedUrls(kind, compressed.length)
  if (!presignedResult.ok) throw new Error(presignedResult.error)
  const slots = presignedResult.slots

  // 4. Upload paralelo com progresso
  await Promise.all(
    compressed.map((file, i) =>
      uploadToStorage(slots[i]!.uploadUrl, file, (pct) => onProgress?.(i, pct)),
    ),
  )

  // 5. Confirmar e retornar URLs definitivas
  const confirmResult = await confirmUpload(slots.map((s) => s.key))
  if (!confirmResult.ok) throw new Error(confirmResult.error)
  return confirmResult.urls
}
