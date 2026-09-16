import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { User, Phone, MapPin, Bell, Moon, Shield, HelpCircle, Info } from '@siamo/ui/icons'
import { SettingsRow, SettingsGroup, ReputationSeal, getInitials } from '@siamo/ui'
import { ScreenHeader } from '@/components/layout/screen-header'
import { getServerSession } from '@/lib/server-auth'
import { prisma } from '@siamo/db'
import { LogoutButton } from './logout-button'

export const metadata: Metadata = { title: 'Configurações' }

export default async function ConfiguracoesPage() {
  const session = await getServerSession()
  if (!session) redirect('/entrar')

  const profile = await prisma.profile.findUnique({
    where: { userId: session.userId },
    include: { location: true },
  })

  if (!profile) redirect('/cadastro/perfil')

  const initials = getInitials(profile.name)
  const locationLabel = profile.location
    ? `${profile.location.city}, ${profile.location.state}`
    : 'Não definida'

  return (
    <div className="bg-background min-h-screen pb-[80px]">
      {/* Header */}
      <ScreenHeader backHref="/meu-perfil" title="Configurações" />

      {/* Profile strip */}
      <Link href="/perfil" className="mx-4 mb-4 block">
        <div className="bg-card border-border flex items-center gap-3 rounded-[14px] border p-4">
          <div className="bg-accent flex size-[48px] flex-shrink-0 items-center justify-center overflow-hidden rounded-full">
            {profile.photo ? (
              <img src={profile.photo} alt={profile.name} className="h-full w-full object-cover" />
            ) : (
              <span className="text-accent-foreground text-[18px] font-medium">{initials}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-foreground truncate text-[15px] font-medium">{profile.name}</p>
            <div className="mt-0.5 flex items-center gap-2">
              {profile.badge !== 'NONE' ? (
                <ReputationSeal tier={profile.badge} />
              ) : (
                <span className="text-muted-foreground text-[12px]">
                  {profile.currentRating.toFixed(1)} ★ · {profile.ratingCount} avaliações
                </span>
              )}
            </div>
          </div>
          <span className="text-muted-foreground text-[13px]">Ver perfil</span>
        </div>
      </Link>

      {/* Conta */}
      <SettingsGroup label="CONTA">
        <SettingsRow
          icon={<User size={18} strokeWidth={1.8} />}
          title="Editar perfil"
          subtitle="Nome, bio, foto"
          href="/perfil/editar"
        />
        <SettingsRow
          icon={<Phone size={18} strokeWidth={1.8} />}
          title="WhatsApp"
          subtitle={session.phone}
          rightElement={
            <span className="text-muted-foreground font-mono text-[12px]">Verificado</span>
          }
        />
        <SettingsRow
          icon={<MapPin size={18} strokeWidth={1.8} />}
          title="Localização"
          subtitle={locationLabel}
          href="/perfil/editar"
        />
      </SettingsGroup>

      {/* Preferências */}
      <SettingsGroup label="PREFERÊNCIAS">
        <SettingsRow
          icon={<Bell size={18} strokeWidth={1.8} />}
          title="Notificações"
          subtitle="WhatsApp, push, tipos"
          href="/configuracoes/notificacoes"
        />
        <SettingsRow
          icon={<Moon size={18} strokeWidth={1.8} />}
          title="Aparência"
          subtitle="Tema, tamanho de texto"
          href="/configuracoes/aparencia"
        />
      </SettingsGroup>

      {/* Privacidade */}
      <SettingsGroup label="PRIVACIDADE E SEGURANÇA">
        <SettingsRow
          icon={<Shield size={18} strokeWidth={1.8} />}
          title="Privacidade e LGPD"
          subtitle="Consentimentos, seus dados"
          href="/configuracoes/privacidade"
        />
      </SettingsGroup>

      {/* Suporte */}
      <SettingsGroup label="SUPORTE">
        <SettingsRow
          icon={<HelpCircle size={18} strokeWidth={1.8} />}
          title="Ajuda"
          subtitle="FAQ, fale conosco"
          href="/ajuda"
        />
        <SettingsRow
          icon={<Info size={18} strokeWidth={1.8} />}
          title="Sobre o Siamo"
          rightElement={<span className="text-muted-foreground font-mono text-[12px]">v1.0.0</span>}
        />
      </SettingsGroup>

      {/* Logout — extra bottom room so the button clears the tab bar, which is
          64 px plus the home-indicator safe area on iOS. */}
      <div className="mx-4 mb-[env(safe-area-inset-bottom,0px)] mt-2 pb-6">
        <LogoutButton />
      </div>
    </div>
  )
}
