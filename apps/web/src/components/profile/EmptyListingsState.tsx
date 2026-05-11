import { ClipboardList } from 'lucide-react'

interface EmptyListingsStateProps {
  isOwn?: boolean
}

export function EmptyListingsState({ isOwn }: EmptyListingsStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      <div className="bg-muted flex h-14 w-14 items-center justify-center rounded-full">
        <ClipboardList className="text-muted-foreground h-7 w-7" aria-hidden="true" />
      </div>
      <div>
        <p className="font-medium">Nenhum anúncio ainda</p>
        <p className="text-muted-foreground mt-1 text-sm">
          {isOwn
            ? 'Crie seu primeiro anúncio para aparecer para outros usuários.'
            : 'Este usuário ainda não publicou anúncios.'}
        </p>
      </div>
      {isOwn && (
        <button
          type="button"
          className="bg-primary text-primary-foreground hover:bg-primary/90 mt-2 inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium transition-colors"
        >
          Criar anúncio
        </button>
      )}
    </div>
  )
}
