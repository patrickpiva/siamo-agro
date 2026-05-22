'use client'

import { useState } from 'react'
import { ChevronRight, ChevronUp } from '@agrolink/ui/icons'
import { cn } from '@agrolink/ui'

interface FaqItemProps {
  id: string
  question: string
  answer: string
  isOpen: boolean
  onToggle: (id: string) => void
}

export function FaqItem({ id, question, answer, isOpen, onToggle }: FaqItemProps) {
  const panelId = `faq-panel-${id}`

  return (
    <div className={cn('bg-card border-border overflow-hidden rounded-[12px] border', 'mx-4 mb-2')}>
      <button
        type="button"
        role="button"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => onToggle(id)}
        className="flex w-full items-center justify-between gap-3 px-4 py-[14px] text-left"
      >
        <span className="text-foreground flex-1 text-[13px]">{question}</span>
        {isOpen ? (
          <ChevronUp size={16} strokeWidth={1.8} className="text-muted-foreground flex-shrink-0" />
        ) : (
          <ChevronRight
            size={16}
            strokeWidth={1.8}
            className="text-muted-foreground flex-shrink-0"
          />
        )}
      </button>

      {isOpen && (
        <div id={panelId} role="region" className="border-border border-t px-4 pb-[14px] pt-3">
          <p className="text-muted-foreground text-[12px] leading-[1.6]">{answer}</p>
        </div>
      )}
    </div>
  )
}

export function FaqList({
  items,
}: {
  items: Array<{ id: string; question: string; answer: string }>
}) {
  const [openId, setOpenId] = useState<string | null>(null)

  function handleToggle(id: string) {
    setOpenId((prev) => (prev === id ? null : id))
  }

  return (
    <div>
      {items.map((item) => (
        <FaqItem
          key={item.id}
          id={item.id}
          question={item.question}
          answer={item.answer}
          isOpen={openId === item.id}
          onToggle={handleToggle}
        />
      ))}
    </div>
  )
}
