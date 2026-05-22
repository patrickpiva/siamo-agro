'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@agrolink/ui'

type NotifTab = 'all' | 'proposals' | 'transactions' | 'matches'

const TABS: { value: NotifTab; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'proposals', label: 'Propostas' },
  { value: 'transactions', label: 'Transações' },
  { value: 'matches', label: 'Matches' },
]

export function NotificationFilterTabs() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const active = (searchParams.get('type') ?? 'all') as NotifTab

  function handleChange(value: NotifTab) {
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'all') {
      params.delete('type')
    } else {
      params.set('type', value)
    }
    router.push(`/notificacoes?${params.toString()}`, { scroll: false })
  }

  return (
    <div
      role="tablist"
      aria-label="Filtrar notificações"
      className="flex gap-2 overflow-x-auto px-5 pb-4 pt-2"
      style={{ scrollbarWidth: 'none' }}
    >
      {TABS.map((tab) => (
        <button
          key={tab.value}
          role="tab"
          type="button"
          aria-selected={active === tab.value}
          onClick={() => handleChange(tab.value)}
          className={cn(
            'flex-shrink-0 rounded-full px-[14px] py-[7px] text-[12px] transition-colors',
            active === tab.value
              ? 'bg-cta-bg text-cta-fg font-medium'
              : 'bg-muted text-fg-secondary',
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
