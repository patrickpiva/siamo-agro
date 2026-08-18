'use client'

import { Share2 } from '@siamo/ui/icons'

interface ShareButtonProps {
  title: string
  url: string
}

export function ShareButton({ title, url }: ShareButtonProps) {
  async function handleShare() {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, url })
      } catch {
        // User cancelled or share failed — silently ignore
      }
    } else {
      await navigator.clipboard.writeText(url)
      // Basic fallback: copy link to clipboard
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleShare()}
      className="bg-card border-border flex items-center justify-center gap-[6px] rounded-[12px] border py-3 text-[13px] font-medium"
    >
      <Share2 size={16} strokeWidth={1.8} />
      Compartilhar
    </button>
  )
}
