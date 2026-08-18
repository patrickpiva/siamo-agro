import Link from 'next/link'
import type { Route } from 'next'
import type { ReactNode } from 'react'
import { ChevronRight } from '@siamo/ui/icons'
import { cn } from '@siamo/ui'

interface ChoiceCardProps {
  href: Route
  variant: 'primary' | 'secondary'
  /** Ícone com stroke `currentColor` — herda a cor do card. */
  icon: ReactNode
  title: string
  subtitle: string
}

/**
 * Escolha grande da primeira dobra (96px). Primária usa o padrão CTA invertido
 * (`bg-cta-bg`/`text-cta-fg`), secundária é um card neutro.
 */
export function ChoiceCard({ href, variant, icon, title, subtitle }: ChoiceCardProps) {
  const isPrimary = variant === 'primary'
  return (
    <Link
      href={href}
      aria-label={`${title} — ${subtitle}`}
      className={cn(
        'flex min-h-[96px] items-center gap-[18px] rounded-[22px] px-[22px] py-6 transition-transform active:scale-[0.98]',
        isPrimary ? 'bg-cta-bg text-cta-fg' : 'bg-card border-border text-foreground border',
      )}
    >
      <div
        className={cn(
          'flex size-14 shrink-0 items-center justify-center rounded-[16px]',
          isPrimary
            ? 'text-cta-fg bg-[rgba(198,232,69,0.15)] dark:bg-[rgba(10,10,10,0.12)]'
            : 'bg-primary-subtle text-accent dark:text-primary dark:bg-[rgba(198,232,69,0.12)]',
        )}
      >
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-[21px] font-bold leading-[1.1] tracking-[-0.4px]">{title}</p>
        <p
          className={cn(
            'mt-1 text-[13px] leading-[1.3]',
            isPrimary
              ? 'text-[rgba(198,232,69,0.65)] dark:text-[#1a3010]'
              : 'text-muted-foreground',
          )}
        >
          {subtitle}
        </p>
      </div>
      <ChevronRight
        size={24}
        strokeWidth={2.2}
        className={cn('shrink-0', isPrimary ? 'opacity-45' : 'text-muted-foreground opacity-60')}
      />
    </Link>
  )
}
