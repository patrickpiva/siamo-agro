import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h2 className="text-2xl font-bold">Página não encontrada</h2>
      <Link href="/" className="text-green-700 underline hover:text-green-800">
        Voltar ao início
      </Link>
    </main>
  )
}
