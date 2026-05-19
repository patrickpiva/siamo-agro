'use client'

import * as React from 'react'
import { Camera, User } from './icons/index'
import { cn } from './lib/utils'

interface AvatarUploadProps {
  avatarUrl?: string | null
  name?: string
  onFileSelect: (file: File) => void
  disabled?: boolean
  className?: string
}

function getInitials(name?: string): string {
  if (!name) return '?'
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

/**
 * AvatarUpload — círculo 120px com foto ou iniciais.
 * Botão câmera flutuante abre seletor de arquivo (câmera ou galeria).
 */
export function AvatarUpload({
  avatarUrl,
  name,
  onFileSelect,
  disabled,
  className,
}: AvatarUploadProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) onFileSelect(file)
    // Reset para permitir selecionar o mesmo arquivo novamente
    e.target.value = ''
  }

  return (
    <div className={cn('relative mx-auto size-[120px]', className)}>
      {/* Avatar */}
      <div
        className="border-accent-lime bg-accent-forest flex h-full w-full items-center justify-center overflow-hidden rounded-full border-2"
        style={{ boxShadow: '0 0 0 4px hsl(var(--primary-subtle))' }}
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt={name ?? 'Avatar'} className="h-full w-full object-cover" />
        ) : name ? (
          <span className="text-accent-foreground select-none text-[40px] font-medium leading-none">
            {getInitials(name)}
          </span>
        ) : (
          <User size={48} strokeWidth={1.5} className="text-accent-foreground/60" />
        )}
      </div>

      {/* Botão câmera */}
      <button
        type="button"
        aria-label="Alterar foto de perfil"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        style={{ width: 36, height: 36, minWidth: 0, minHeight: 0 }}
        className={cn(
          'absolute bottom-[-2px] right-[-2px] rounded-full',
          'bg-cta-bg text-cta-fg',
          'flex items-center justify-center',
          'border-background border-[3px]',
          'transition-transform active:scale-90',
          'disabled:pointer-events-none disabled:opacity-50',
        )}
      >
        <Camera size={16} strokeWidth={1.8} />
      </button>

      {/* Input oculto */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={handleFileChange}
        disabled={disabled}
        aria-hidden="true"
      />
    </div>
  )
}
