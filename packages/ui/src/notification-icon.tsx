import type { ComponentType } from 'react'
import { Send, CheckCircle, XCircle, Star, Users, Info } from './icons/index'
import { cn } from './lib/utils'

type NotificationType =
  | 'PROPOSAL_RECEIVED'
  | 'PROPOSAL_ACCEPTED'
  | 'PROPOSAL_REFUSED'
  | 'TRANSACTION_COMPLETED'
  | 'RATING_RECEIVED'
  | 'MATCH_FOUND'
  | 'COLLECTIVE_UPDATE'
  | 'SYSTEM'

type IconConfig = {
  Icon: ComponentType<{ size?: number; strokeWidth?: number }>
  className: string
}

const ICON_MAP: Record<NotificationType, IconConfig> = {
  PROPOSAL_RECEIVED: {
    Icon: Send,
    className: 'bg-blue-500/10 text-blue-500 dark:bg-blue-500/15 dark:text-[#60A5FA]',
  },
  PROPOSAL_ACCEPTED: {
    Icon: CheckCircle,
    className: 'bg-green-500/10 text-green-600 dark:bg-green-500/12 dark:text-[#22C55E]',
  },
  PROPOSAL_REFUSED: {
    Icon: XCircle,
    className: 'bg-red-500/10 text-red-500 dark:bg-red-500/12 dark:text-[#F87171]',
  },
  TRANSACTION_COMPLETED: {
    Icon: CheckCircle,
    className: 'bg-green-500/10 text-green-600 dark:bg-green-500/12 dark:text-[#22C55E]',
  },
  RATING_RECEIVED: {
    Icon: Star,
    className: 'bg-amber-400/10 text-amber-600 dark:bg-amber-400/12 dark:text-[#FBB024]',
  },
  MATCH_FOUND: {
    Icon: Star,
    className: 'bg-primary/10 text-accent dark:bg-primary/12 dark:text-primary',
  },
  COLLECTIVE_UPDATE: {
    Icon: Users,
    className: 'bg-muted text-muted-foreground',
  },
  SYSTEM: {
    Icon: Info,
    className: 'bg-muted text-muted-foreground',
  },
}

interface NotificationIconProps {
  type: NotificationType
  className?: string
}

export function NotificationIcon({ type, className }: NotificationIconProps) {
  const config = ICON_MAP[type] ?? ICON_MAP.SYSTEM
  const { Icon } = config

  return (
    <div
      className={cn(
        'flex size-[40px] flex-shrink-0 items-center justify-center rounded-full',
        config.className,
        className,
      )}
    >
      <Icon size={18} strokeWidth={1.8} />
    </div>
  )
}
