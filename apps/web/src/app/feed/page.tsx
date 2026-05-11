import type { Metadata } from 'next'
import { Wheat } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Feed',
}

export default function FeedPage() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center p-6">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="bg-primary/10 flex h-20 w-20 items-center justify-center rounded-full">
          <Wheat className="text-primary h-10 w-10" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-bold">Em breve</h1>
        <p className="text-muted-foreground max-w-xs">
          O feed de oportunidades está sendo construído. Você será notificado quando estiver
          disponível.
        </p>
        <a
          href="/perfil"
          className="bg-primary text-primary-foreground hover:bg-primary/90 mt-4 inline-flex h-12 items-center justify-center rounded-md px-6 text-sm font-medium transition-colors"
        >
          Ver meu perfil
        </a>
      </div>
    </main>
  )
}
