// Sprint 4: Propostas recebidas para um anúncio
interface PropostasListPageProps {
  params: Promise<{ id: string }>
}

export default async function PropostasListPage({ params }: PropostasListPageProps) {
  const { id: _id } = await params
  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center">
      <p className="text-muted-foreground text-sm">Propostas do anúncio — em breve</p>
    </div>
  )
}
