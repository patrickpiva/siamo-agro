'use client'

import useEmblaCarousel from 'embla-carousel-react'
import Image from 'next/image'

interface Photo {
  id?: string
  url: string
  order: number
}

export function PhotoCarousel({ photos }: { photos: Photo[] }) {
  const [emblaRef] = useEmblaCarousel({ loop: true })

  if (photos.length === 0) return null

  return (
    <div className="relative overflow-hidden" ref={emblaRef}>
      <div className="flex">
        {photos.map((photo, i) => (
          <div key={photo.id ?? i} className="relative aspect-video flex-[0_0_100%]">
            <Image
              src={photo.url}
              alt={`Foto ${i + 1}`}
              fill
              className="object-cover"
              sizes="(max-width: 672px) 100vw, 672px"
              priority={i === 0}
            />
          </div>
        ))}
      </div>
      {photos.length > 1 && (
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
          {photos.map((_, i) => (
            <span key={i} className="h-1.5 w-1.5 rounded-full bg-white/70" />
          ))}
        </div>
      )}
    </div>
  )
}
