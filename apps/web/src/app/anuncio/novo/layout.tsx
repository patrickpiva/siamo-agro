import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/server-auth'

export default async function WizardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession()
  if (!session) redirect('/entrar')
  return <>{children}</>
}
