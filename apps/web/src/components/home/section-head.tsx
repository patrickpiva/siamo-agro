import Link from 'next/link'
import type { Route } from 'next'

interface SectionHeadProps {
  title: string
  href?: Route
  linkLabel?: string
  /** id para ancoragem via PendingAnchor (scroll suave). */
  id?: string
}

/** Cabeçalho das seções abaixo da dobra ("Oportunidades perto" · VER TODAS →). */
export function SectionHead({ title, href, linkLabel = 'VER TODAS', id }: SectionHeadProps) {
  return (
    <div id={id} className="flex items-center justify-between px-5 pb-3 pt-[6px]">
      <h2 className="text-[16px] font-medium">{title}</h2>
      {href && (
        <Link
          href={href}
          className="text-accent dark:text-primary font-mono text-[12px] font-medium"
        >
          {linkLabel} →
        </Link>
      )}
    </div>
  )
}
