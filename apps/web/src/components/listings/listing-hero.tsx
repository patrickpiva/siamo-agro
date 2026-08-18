'use client'

import Image from 'next/image'
import useEmblaCarousel from 'embla-carousel-react'
import { KindBadge } from '@siamo/ui'
import { cn } from '@siamo/ui'
import { CATEGORY_ICONS } from '@siamo/ui/icons'

const CATEGORY_BG: Record<string, string> = {
  COFFEE: 'bg-[#D4B896] dark:bg-[#3d2817]',
  CORN: 'bg-[#C8D4B8] dark:bg-[#2d4a2a]',
  SOY: 'bg-[#C8B888] dark:bg-[#4a4220]',
  LIVESTOCK: 'bg-[#C8D0B8] dark:bg-[#2d3a1a]',
  DAIRY: 'bg-[#C8D0B8] dark:bg-[#2d3a1a]',
  TRACTOR: 'bg-[#D8D8E8] dark:bg-[#2a2a3a]',
  HARVESTER: 'bg-[#D8D8E8] dark:bg-[#2a2a3a]',
}

interface ListingHeroProps {
  photos: { url: string; alt?: string }[]
  kind: string
  category?: string
  height?: number
  className?: string
}

export function ListingHero({ photos, kind, category, height = 220, className }: ListingHeroProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, dragFree: false })

  const selectedIndex = typeof emblaApi !== 'undefined' ? (emblaApi.selectedScrollSnap?.() ?? 0) : 0

  if (photos.length === 0) {
    const CategoryIcon = category
      ? CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS]
      : undefined
    const categoryBg = category ? (CATEGORY_BG[category] ?? 'bg-muted') : 'bg-muted'
    return (
      <div
        className={cn('relative mx-4 overflow-hidden rounded-[14px]', categoryBg, className)}
        style={{ height }}
      >
        {CategoryIcon && (
          <div className="absolute inset-0 flex items-center justify-center opacity-40">
            <CategoryIcon size={64} strokeWidth={1.5} className="text-foreground" />
          </div>
        )}
        <div className="absolute left-[14px] top-[14px] flex gap-[6px]">
          <KindBadge kind={kind} />
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn('relative mx-4 overflow-hidden rounded-[14px]', className)}
      style={{ height }}
    >
      {/* Carousel */}
      <div className="h-full overflow-hidden" ref={emblaRef}>
        <div className="flex h-full">
          {photos.map((photo, i) => (
            <div key={i} className="relative h-full min-w-full flex-shrink-0">
              <Image
                src={photo.url}
                alt={photo.alt ?? ''}
                fill
                sizes="(max-width: 480px) 100vw, 448px"
                className="object-cover"
                priority={i === 0}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Kind badge */}
      <div className="absolute left-[14px] top-[14px] flex gap-[6px]">
        <KindBadge kind={kind} />
      </div>

      {/* Counter */}
      {photos.length > 1 && (
        <span className="absolute right-[14px] top-[14px] rounded-[5px] bg-black/75 px-[10px] py-[5px] text-[11px] font-medium text-white">
          {selectedIndex + 1} / {photos.length}
        </span>
      )}

      {/* Dots */}
      {photos.length > 1 && (
        <div className="absolute bottom-[14px] left-1/2 flex -translate-x-1/2 gap-[5px]">
          {photos.map((_, i) => (
            <span
              key={i}
              className={cn(
                'size-[6px] rounded-full',
                i === selectedIndex ? 'bg-white' : 'bg-white/50',
              )}
            />
          ))}
        </div>
      )}
    </div>
  )
}
