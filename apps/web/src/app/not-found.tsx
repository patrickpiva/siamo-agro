'use client'

import { useRouter } from 'next/navigation'
import { HelpCircle, ArrowLeft } from 'lucide-react'
import { ErrorScreen } from '@siamo/ui'

export default function NotFound() {
  const router = useRouter()

  return (
    <div className="bg-background flex min-h-screen flex-col">
      <ErrorScreen
        code="ERRO 404"
        icon={<HelpCircle size={32} strokeWidth={1.5} />}
        iconVariant="red"
        title="Página não encontrada"
        message="O endereço que você acessou não existe ou o conteúdo foi removido."
        actions={[
          {
            label: 'Voltar',
            icon: <ArrowLeft size={14} strokeWidth={2} />,
            variant: 'secondary',
            onClick: () => router.back(),
          },
          {
            label: 'Ir para o início',
            variant: 'primary',
            href: '/',
          },
        ]}
      />
    </div>
  )
}
