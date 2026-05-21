import { redirect } from 'next/navigation'

// /perfil (without id) redirects to /meu-perfil which handles
// auth + resolves the current user's profile id.
export default function PerfilRootPage() {
  redirect('/meu-perfil')
}
