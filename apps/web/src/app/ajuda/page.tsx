'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { ArrowLeft, Search } from '@siamo/ui/icons'
import { FaqList } from '@/components/help/faq-item'
import { WhatsAppSupportCard } from '@/components/help/whatsapp-support-card'

interface FaqItem {
  id: string
  question: string
  answer: string
}

export default function AjudaPage() {
  const [query, setQuery] = useState('')
  const [items, setItems] = useState<FaqItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load initial FAQ
  useEffect(() => {
    fetch('/api/proxy/help/faq')
      .then((r) => r.json())
      .then((json: { data: FaqItem[] }) => setItems(json.data))
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (!query.trim()) {
      // Reset to full list
      debounceRef.current = setTimeout(() => {
        fetch('/api/proxy/help/faq')
          .then((r) => r.json())
          .then((json: { data: FaqItem[] }) => setItems(json.data))
          .catch(() => {})
      }, 0)
      return
    }

    debounceRef.current = setTimeout(() => {
      fetch(`/api/proxy/help/faq/search?q=${encodeURIComponent(query)}`)
        .then((r) => r.json())
        .then((json: { data: FaqItem[] }) => setItems(json.data))
        .catch(() => {})
    }, 300)
  }, [query])

  return (
    <div className="bg-background min-h-screen pb-[80px]">
      <header className="flex items-center justify-between px-4 py-3">
        <Link
          href="/configuracoes"
          aria-label="Voltar"
          className="bg-muted flex size-12 items-center justify-center rounded-full"
        >
          <ArrowLeft size={18} strokeWidth={1.8} />
        </Link>
        <p className="text-[15px] font-medium">Ajuda</p>
        <div className="w-12" />
      </header>

      {/* Search */}
      <div className="mx-4 mb-4">
        <div className="bg-muted border-border flex items-center gap-2 rounded-[12px] border px-4 py-[12px]">
          <Search size={16} strokeWidth={1.8} className="text-muted-foreground flex-shrink-0" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Pesquisar na central de ajuda…"
            className="text-foreground placeholder:text-muted-foreground min-h-0 flex-1 bg-transparent text-[14px] outline-none"
          />
        </div>
      </div>

      {/* WhatsApp support */}
      <WhatsAppSupportCard />

      {/* FAQ */}
      <p className="text-muted-foreground px-5 pb-3 pt-2 font-mono text-[11px] tracking-[0.4px]">
        PERGUNTAS FREQUENTES
      </p>

      {isLoading ? (
        <div className="space-y-2 px-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-muted h-[52px] animate-pulse rounded-[12px]" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-muted-foreground px-5 text-[13px]">Nenhum resultado para "{query}".</p>
      ) : (
        <FaqList items={items} />
      )}

      {/* App version */}
      <p className="text-muted-foreground mt-8 px-5 text-center font-mono text-[11px]">
        AgraIA v1.0.0
      </p>
    </div>
  )
}
