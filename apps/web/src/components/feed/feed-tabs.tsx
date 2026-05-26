'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@agraia/ui'

export type FeedTab = 'matches' | 'recent' | 'region' | 'saved'

const TABS: { value: FeedTab; label: string }[] = [
  { value: 'matches', label: 'Matches para mim' },
  { value: 'recent', label: 'Recentes' },
  { value: 'region', label: 'Região' },
  { value: 'saved', label: 'Salvos' },
]

interface FeedTabsProps {
  activeTab: FeedTab
}

export function FeedTabs({ activeTab }: FeedTabsProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function navigate(tab: FeedTab) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tab)
    router.push(`/feed?${params.toString()}`)
  }

  return (
    <div className="flex gap-2 overflow-x-auto px-4 pb-2 pt-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {TABS.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          onClick={() => navigate(value)}
          className={cn(
            'min-h-0 min-w-0 shrink-0 whitespace-nowrap rounded-full px-[14px] py-[7px] text-[12px] transition-colors',
            activeTab === value
              ? 'feed-tab-active font-medium'
              : 'bg-muted text-fg-secondary hover:text-foreground',
          )}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
