import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/server-auth'
import { WizardShell } from '@/components/listing-wizard/wizard-shell'

export const metadata = { title: 'Criar anúncio' }

export default async function NovoAnuncioPage() {
  const session = await getServerSession()
  if (!session) redirect('/entrar')

  return <WizardShell />
}
