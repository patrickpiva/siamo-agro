import Link from 'next/link'
import type { Metadata } from 'next'
import { Send, Clock, Bell } from '@agrolink/ui/icons'
import { ProposalBlock } from '@agrolink/ui'

export const metadata: Metadata = { title: 'Proposta enviada — AgroLink' }

interface Props {
  searchParams: Promise<{
    sellerName?: string
    title?: string
    priceCents?: string
    qty?: string
    total?: string
    message?: string
  }>
}

export default async function PropostaEnviadaPage({ searchParams }: Props) {
  const p = await searchParams

  const sellerName = p.sellerName ?? 'Vendedor'
  const priceCents = Number(p.priceCents ?? 0)
  const qty = Number(p.qty ?? 1)
  const totalCents = Number(p.total ?? priceCents * qty)
  const message = p.message ?? null

  return (
    <div className="bg-background flex min-h-screen flex-col justify-between">
      <div>
        {/* Hero */}
        <div className="flex flex-col items-center px-6 pb-6 pt-12 text-center">
          <div className="mb-5 flex size-[88px] items-center justify-center rounded-full border-2 border-[#2563EB] bg-[rgba(37,99,235,0.08)] text-[#2563EB] dark:border-[#60A5FA] dark:bg-[rgba(59,130,246,0.1)] dark:text-[#60A5FA]">
            <Send size={40} strokeWidth={2} />
          </div>
          <h1 className="mb-2 text-[22px] font-medium">Proposta enviada!</h1>
          <p className="text-foreground/70 max-w-xs text-[14px] leading-[1.6]">
            Você será notificado assim que{' '}
            <span className="text-foreground font-medium">{sellerName}</span> responder.
          </p>
        </div>

        <div className="px-5">
          <ProposalBlock
            label="SUA PROPOSTA"
            priceCents={priceCents}
            unit="un"
            quantity={qty}
            totalCents={totalCents}
            message={message ?? undefined}
            className="mb-4"
          />

          {/* Info card */}
          <div className="bg-card border-border rounded-[12px] border p-[14px]">
            <div className="mb-3 flex items-start gap-[10px]">
              <Clock
                size={18}
                strokeWidth={1.8}
                className="text-accent dark:text-primary mt-[1px] shrink-0"
              />
              <p className="text-foreground/70 text-[12px] leading-[1.5]">
                Aguardando resposta de {sellerName} ·{' '}
                <span className="text-accent dark:text-primary font-mono font-medium">
                  PROPOSTA
                </span>
              </p>
            </div>
            <div className="flex items-start gap-[10px]">
              <Bell
                size={18}
                strokeWidth={1.8}
                className="text-muted-foreground mt-[1px] shrink-0"
              />
              <p className="text-muted-foreground text-[12px] leading-[1.5]">
                Você receberá uma notificação no WhatsApp quando {sellerName} responder.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTAs */}
      <div className="border-border bg-card flex flex-col gap-2 border-t px-5 py-4">
        <Link
          href="/transacoes"
          className="bg-muted border-border flex w-full items-center justify-center rounded-[12px] border py-[15px] text-[15px] font-medium transition-opacity active:opacity-70"
        >
          Ver minhas propostas enviadas
        </Link>
        <Link
          href="/feed"
          className="text-muted-foreground flex w-full items-center justify-center py-[10px] text-[13px]"
        >
          Voltar ao feed
        </Link>
      </div>
    </div>
  )
}
