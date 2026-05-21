import { cn } from './lib/utils'

type BubbleVariant = 'mine' | 'theirs' | 'system'

interface ChatBubbleProps {
  variant: BubbleVariant
  content: string
  timestamp?: string
  className?: string
}

export function ChatBubble({ variant, content, timestamp, className }: ChatBubbleProps) {
  if (variant === 'system') {
    return (
      <div
        className={cn(
          'bubble-system self-center rounded-[6px] px-[10px] py-1 font-mono text-[11px]',
          className,
        )}
      >
        {content}
      </div>
    )
  }

  const isMine = variant === 'mine'

  return (
    <div
      className={cn(
        'flex max-w-[76%] flex-col',
        isMine ? 'items-end self-end' : 'items-start self-start',
        className,
      )}
    >
      <div
        className={cn(
          'rounded-[16px] px-[14px] py-[10px] text-[13px] leading-[1.55]',
          isMine ? 'bubble-mine' : 'bubble-theirs',
        )}
      >
        {content}
      </div>
      {timestamp && (
        <span className="text-muted-foreground mt-1 font-mono text-[10px]">{timestamp}</span>
      )}
    </div>
  )
}
