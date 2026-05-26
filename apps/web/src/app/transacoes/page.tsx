import { MessageCircle } from 'lucide-react'
import { EmptyState } from '@agraia/ui'
import { prisma } from '@agraia/db'
import { getServerSession } from '@/lib/server-auth'
import { redirect } from 'next/navigation'
import { TransactionCard } from '@/components/transactions/transaction-card'

type StatusFilter = 'all' | 'PROPOSED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'

const FILTER_LABELS: Record<StatusFilter, string> = {
  all: 'Todos',
  PROPOSED: 'Propostas',
  IN_PROGRESS: 'Em andamento',
  COMPLETED: 'Concluídos',
  CANCELLED: 'Cancelados',
}

interface TransacoesPageProps {
  searchParams: Promise<{ status?: string }>
}

export default async function TransacoesPage({ searchParams }: TransacoesPageProps) {
  const session = await getServerSession()
  if (!session) redirect('/entrar')

  const { status: rawStatus } = await searchParams
  const statusFilter = (rawStatus as StatusFilter | undefined) ?? 'all'

  const transactions = await prisma.transaction.findMany({
    where: {
      OR: [{ buyerId: session.userId }, { sellerId: session.userId }],
      ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
    },
    include: {
      listing: { select: { title: true, kind: true } },
      buyer: { select: { id: true, profile: { select: { name: true, photo: true } } } },
      seller: { select: { id: true, profile: { select: { name: true, photo: true } } } },
    },
    orderBy: { updatedAt: 'desc' },
    take: 50,
  })

  const filters: StatusFilter[] = ['all', 'PROPOSED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']

  return (
    <div className="bg-background flex min-h-screen flex-col pb-[80px]">
      {/* Header */}
      <header className="flex items-center justify-center px-4 py-3">
        <p className="text-[15px] font-medium">Negócios</p>
      </header>

      {/* Filter pills */}
      <div className="flex gap-2 overflow-x-auto px-4 pb-2 pt-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {filters.map((f) => (
          <a
            key={f}
            href={f === 'all' ? '/transacoes' : `/transacoes?status=${f}`}
            className={`min-h-0 min-w-0 shrink-0 whitespace-nowrap rounded-full px-[14px] py-[7px] text-[12px] transition-colors ${
              statusFilter === f
                ? 'feed-tab-active font-medium'
                : 'bg-muted text-fg-secondary hover:text-foreground'
            }`}
          >
            {FILTER_LABELS[f]}
          </a>
        ))}
      </div>

      {/* List */}
      {transactions.length === 0 ? (
        <EmptyState
          icon={<MessageCircle size={28} strokeWidth={1.3} />}
          iconVariant="muted"
          title="Nenhuma transação ainda"
          description="Suas negociações aparecem aqui assim que você aceitar ou enviar uma proposta."
          actions={[{ label: 'Explorar anúncios', variant: 'primary', href: '/busca' }]}
        />
      ) : (
        <div className="flex flex-col gap-2 px-4 pt-1">
          {transactions.map((tx) => {
            const isBuyer = tx.buyerId === session.userId
            const counterpart = isBuyer ? tx.seller : tx.buyer
            return (
              <TransactionCard
                key={tx.id}
                id={tx.id}
                status={tx.status}
                listingTitle={tx.listing.title}
                listingKind={tx.listing.kind}
                amount={Number(tx.amount)}
                counterpartName={counterpart.profile?.name ?? '—'}
                counterpartPhoto={counterpart.profile?.photo ?? null}
                isBuyer={isBuyer}
                createdAt={tx.createdAt.toISOString()}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
