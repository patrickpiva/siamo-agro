'use client'

import { RefreshCw, AlertCircle } from 'lucide-react'
import { ErrorScreen } from '@agraia/ui'

interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorPageProps) {
  const errorId = error.digest ? `${error.digest} · ${new Date().toISOString()}` : undefined

  return (
    <div className="bg-background flex min-h-screen flex-col">
      <ErrorScreen
        code="ERRO 500"
        icon={<AlertCircle size={22} strokeWidth={1.8} />}
        iconVariant="amber"
        title="Algo deu errado"
        message="Nossos servidores estão com problemas. Tente novamente em alguns minutos."
        compact
        actions={[
          {
            label: 'RETRY',
            icon: <RefreshCw size={12} strokeWidth={2.5} />,
            variant: 'amber-mono',
            onClick: reset,
          },
        ]}
        errorId={errorId}
      />
    </div>
  )
}
