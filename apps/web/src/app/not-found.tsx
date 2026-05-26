'use client'

import { useRouter } from 'next/navigation'
import { HelpCircle, ArrowLeft } from 'lucide-react'
import { ErrorScreen } from '@agraia/ui'

export default function NotFound() {
  const router = useRouter()

  return (
    <div className="bg-background flex min-h-screen flex-col">
      <ErrorScreen
        code="ERRO 404"
        icon={<HelpCircle size={32} strokeWidth={1.5} />}
        iconVariant="red"
        title="Anúncio não encontrado"
        message="Este anúncio pode ter sido removido pelo vendedor ou está temporariamente indisponível."
        actions={[
          {
            label: 'Voltar',
            icon: <ArrowLeft size={14} strokeWidth={2} />,
            variant: 'secondary',
            onClick: () => router.back(),
          },
          {
            label: 'Ver feed',
            variant: 'primary',
            href: '/feed',
          },
        ]}
      />
    </div>
  )
}
