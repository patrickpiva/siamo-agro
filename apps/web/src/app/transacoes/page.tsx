import { MessageCircle } from 'lucide-react'
import { EmptyState } from '@agrolink/ui'

// Sprint 4 placeholder — replace with real transactions list when API is ready
export default function TransacoesPage() {
  return (
    <div className="bg-background flex min-h-screen flex-col pb-[80px]">
      <header className="flex items-center justify-center px-4 py-3">
        <p className="text-[15px] font-medium">Negócios</p>
      </header>
      <EmptyState
        icon={<MessageCircle size={28} strokeWidth={1.3} />}
        iconVariant="muted"
        title="Nenhuma transação ainda"
        description="Suas negociações aparecem aqui assim que você aceitar ou enviar uma proposta."
        actions={[{ label: 'Explorar anúncios', variant: 'primary', href: '/busca' }]}
      />
    </div>
  )
}
