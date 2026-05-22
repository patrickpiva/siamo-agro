import { WifiOff } from 'lucide-react'
import { ErrorScreen } from '@agrolink/ui'

interface NetworkErrorProps {
  onRetry?: () => void
}

export function NetworkError({ onRetry }: NetworkErrorProps) {
  return (
    <ErrorScreen
      code="SEM CONEXÃO"
      icon={<WifiOff size={22} strokeWidth={1.8} />}
      iconVariant="blue"
      title="Verifique sua internet"
      message="Modo offline disponível com dados salvos no aparelho."
      compact
      actions={onRetry ? [{ label: 'VER CACHE', variant: 'secondary-mono', onClick: onRetry }] : []}
    />
  )
}
