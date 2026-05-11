'use client'

import { useState, useCallback, useId } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { X, Upload, AlertCircle } from 'lucide-react'
import { validateFile } from '@/lib/upload'

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface ImageItem {
  id: string
  file: File
  preview: string
  progress: number
  error: string | null
  status: 'pending' | 'uploading' | 'done' | 'error'
  url: string | null
}

interface ImageUploadProps {
  maxImages?: number
  onChange?: (items: ImageItem[]) => void
  disabled?: boolean
}

// ─── SortableImage ────────────────────────────────────────────────────────────

interface SortableImageProps {
  item: ImageItem
  onRemove: () => void
  disabled?: boolean
}

function SortableImage({ item, onRemove, disabled }: SortableImageProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled,
  })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
      }}
      className="bg-muted border-border group relative aspect-square touch-none overflow-hidden rounded-lg border"
      {...attributes}
      {...listeners}
    >
      {/* Thumbnail */}
      <img
        src={item.preview}
        alt=""
        className="pointer-events-none h-full w-full select-none object-cover"
        draggable={false}
      />

      {/* Overlay escuro ao fazer drag */}
      {isDragging && <div className="absolute inset-0 bg-black/20" />}

      {/* Botão remover */}
      {!disabled && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity focus:opacity-100 group-hover:opacity-100"
          aria-label="Remover imagem"
        >
          <X className="h-3 w-3" />
        </button>
      )}

      {/* Progress bar */}
      {item.status === 'uploading' && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
          <div
            className="bg-primary h-full transition-all duration-150"
            style={{ width: `${item.progress}%` }}
          />
        </div>
      )}

      {/* Indicador de erro */}
      {item.status === 'error' && (
        <div className="bg-destructive/20 absolute inset-0 flex items-center justify-center">
          <AlertCircle className="text-destructive h-6 w-6" />
        </div>
      )}

      {/* Tooltip de erro */}
      {item.error && (
        <p className="bg-destructive text-destructive-foreground absolute bottom-0 left-0 right-0 line-clamp-2 px-1 py-0.5 text-[10px] leading-tight">
          {item.error}
        </p>
      )}
    </div>
  )
}

// ─── ImageUpload ──────────────────────────────────────────────────────────────

export function ImageUpload({ maxImages = 8, onChange, disabled }: ImageUploadProps) {
  const [items, setItems] = useState<ImageItem[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const inputId = useId()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      const fileArray = Array.from(files)
      const remaining = maxImages - items.length
      if (remaining <= 0) return

      const toAdd = fileArray.slice(0, remaining).map((file): ImageItem => {
        const error = validateFile(file)
        return {
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          file,
          preview: URL.createObjectURL(file),
          progress: 0,
          error,
          status: error ? 'error' : 'pending',
          url: null,
        }
      })

      const next = [...items, ...toAdd]
      setItems(next)
      onChange?.(next)
    },
    [items, maxImages, onChange],
  )

  const removeItem = useCallback(
    (id: string) => {
      setItems((prev) => {
        const item = prev.find((i) => i.id === id)
        if (item) URL.revokeObjectURL(item.preview)
        const next = prev.filter((i) => i.id !== id)
        onChange?.(next)
        return next
      })
    },
    [onChange],
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return
      setItems((prev) => {
        const oldIndex = prev.findIndex((i) => i.id === active.id)
        const newIndex = prev.findIndex((i) => i.id === over.id)
        const next = arrayMove(prev, oldIndex, newIndex)
        onChange?.(next)
        return next
      })
    },
    [onChange],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      if (disabled) return
      addFiles(e.dataTransfer.files)
    },
    [addFiles, disabled],
  )

  const canAdd = !disabled && items.length < maxImages

  return (
    <div className="space-y-3">
      {/* Zona de drop */}
      {canAdd && (
        <label
          htmlFor={inputId}
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragOver(true)
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          className={[
            'flex min-h-[120px] cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-colors',
            isDragOver
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50 hover:bg-muted/50',
          ].join(' ')}
        >
          <Upload className="text-muted-foreground h-8 w-8" />
          <span className="text-muted-foreground px-4 text-center text-sm">
            Arraste imagens ou toque para selecionar
            <br />
            <span className="text-xs">JPG, PNG ou WebP — máx. 5MB por imagem</span>
          </span>
          <input
            id={inputId}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            capture="environment"
            className="sr-only"
            onChange={(e) => e.target.files && addFiles(e.target.files)}
            disabled={disabled}
          />
        </label>
      )}

      {/* Grid de thumbnails com drag-and-drop */}
      {items.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map((i) => i.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {items.map((item) => (
                <SortableImage
                  key={item.id}
                  item={item}
                  onRemove={() => removeItem(item.id)}
                  disabled={disabled}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Contador */}
      {items.length > 0 && (
        <p className="text-muted-foreground text-right text-xs">
          {items.length}/{maxImages} imagens
        </p>
      )}
    </div>
  )
}
