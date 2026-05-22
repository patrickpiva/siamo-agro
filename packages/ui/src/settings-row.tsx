import type { ReactNode } from 'react'
import { ChevronRight } from './icons/index'
import { cn } from './lib/utils'

interface SettingsRowProps {
  icon: ReactNode
  title: string
  subtitle?: string
  rightElement?: ReactNode
  onClick?: () => void
  href?: string
  variant?: 'default' | 'danger'
  className?: string
}

export function SettingsRow({
  icon,
  title,
  subtitle,
  rightElement,
  onClick,
  href,
  variant = 'default',
  className,
}: SettingsRowProps) {
  const isDanger = variant === 'danger'
  const isClickable = !!onClick || !!href
  const showChevron = isClickable && rightElement === undefined

  const content = (
    <>
      {/* Icon container */}
      <div
        className={cn(
          'flex size-[36px] flex-shrink-0 items-center justify-center rounded-[10px]',
          isDanger ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground',
        )}
      >
        {icon}
      </div>

      {/* Text */}
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'text-[14px] font-medium',
            isDanger ? 'text-destructive' : 'text-foreground',
          )}
        >
          {title}
        </p>
        {subtitle && <p className="text-muted-foreground mt-[2px] text-[11px]">{subtitle}</p>}
      </div>

      {/* Right element or chevron */}
      <div className="flex flex-shrink-0 items-center gap-2">
        {rightElement ??
          (showChevron && (
            <ChevronRight size={16} strokeWidth={1.8} className="text-muted-foreground" />
          ))}
      </div>
    </>
  )

  const baseClass = cn(
    'border-border flex items-center gap-[14px] border-b px-4 py-[14px] last:border-b-0',
    isClickable && 'cursor-pointer transition-colors active:bg-muted/50',
    className,
  )

  if (href) {
    return (
      <a href={href} className={baseClass}>
        {content}
      </a>
    )
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cn(baseClass, 'w-full text-left')}>
        {content}
      </button>
    )
  }

  return <div className={baseClass}>{content}</div>
}
