import Link from 'next/link'
import { getInitials } from '@siamo/ui'
import type { ContinueThread } from '@/lib/home-state'

/** "Continue de onde parou" — conversa em andamento com contador de mensagens novas. */
export function ContinueCard({ thread }: { thread: ContinueThread }) {
  return (
    <Link
      href={`/transacoes/${thread.transactionId}`}
      className="bg-card border-border mx-4 mb-3 flex items-center gap-3 rounded-[16px] border p-[14px]"
    >
      <div className="text-accent dark:text-primary flex size-[42px] shrink-0 items-center justify-center rounded-full bg-[#C8D4B8] text-[14px] font-medium dark:bg-[#2d4a2a]">
        {getInitials(thread.counterpartyName)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-medium">{thread.counterpartyName}</p>
        {thread.lastMessage && (
          <p className="text-muted-foreground truncate text-[12px]">{thread.lastMessage}</p>
        )}
      </div>
      {thread.newCount > 0 && (
        <span className="shrink-0 rounded-[5px] bg-[rgba(37,99,235,0.1)] px-[7px] py-[3px] font-mono text-[9px] font-medium text-[#2563EB] dark:bg-[rgba(59,130,246,0.15)] dark:text-[#60A5FA]">
          {thread.newCount} {thread.newCount === 1 ? 'NOVA' : 'NOVAS'}
        </span>
      )}
    </Link>
  )
}
