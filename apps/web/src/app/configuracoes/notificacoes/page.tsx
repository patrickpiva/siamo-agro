'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell } from '@siamo/ui/icons'
import { WhatsAppLogo } from '@siamo/ui/icons'
import { SettingsGroup, SettingsRow } from '@siamo/ui'
import { ScreenHeader } from '@/components/layout/screen-header'

interface NotifPrefs {
  whatsapp: boolean
  push: boolean
  proposalReceived: boolean
  transactionUpdate: boolean
  matchFound: boolean
  ratingReceived: boolean
  collectiveUpdate: boolean
  weeklyTips: boolean
}

const DEFAULT_PREFS: NotifPrefs = {
  whatsapp: true,
  push: true,
  proposalReceived: true,
  transactionUpdate: true,
  matchFound: true,
  ratingReceived: true,
  collectiveUpdate: true,
  weeklyTips: false,
}

export default function NotificacoesPrefsPage() {
  const [prefs, setPrefs] = useState<NotifPrefs>(DEFAULT_PREFS)
  const [isLoading, setIsLoading] = useState(true)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    fetch('/api/proxy/me/notification-preferences', { credentials: 'include' })
      .then((r) => r.json())
      .then((json: { data: { preferences: NotifPrefs } }) => {
        setPrefs(json.data.preferences)
      })
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  function updatePref(key: keyof NotifPrefs, value: boolean) {
    const next = { ...prefs, [key]: value }
    setPrefs(next)

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      fetch('/api/proxy/me/notification-preferences', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value }),
      }).catch(() => {})
    }, 500)
  }

  if (isLoading) {
    return (
      <div className="bg-background flex min-h-screen flex-col">
        <ScreenHeader backHref="/configuracoes" title="Notificações" />
        <div className="space-y-2 px-4 pt-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-muted h-[56px] animate-pulse rounded-[12px]" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-background min-h-screen pb-[80px]">
      <ScreenHeader backHref="/configuracoes" title="Notificações" />

      {/* Canais */}
      <SettingsGroup label="CANAIS">
        <SettingsRow
          icon={<WhatsAppLogo size={18} className="text-[#25D366]" />}
          title="WhatsApp"
          subtitle="Receber mensagens no WhatsApp"
          rightElement={
            <button
              role="switch"
              aria-checked={prefs.whatsapp}
              aria-label="WhatsApp ativado"
              type="button"
              onClick={() => updatePref('whatsapp', !prefs.whatsapp)}
              style={{
                minHeight: '24px',
                minWidth: '44px',
                ...(!prefs.whatsapp ? { backgroundColor: 'hsl(var(--switch-off))' } : {}),
              }}
              className={`relative inline-flex h-[24px] w-[44px] flex-shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors ${prefs.whatsapp ? 'bg-primary' : ''}`}
            >
              <span
                style={{ transform: prefs.whatsapp ? 'translateX(20px)' : 'translateX(0)' }}
                className="pointer-events-none block h-5 w-5 rounded-full bg-white shadow transition-transform duration-200"
              />
            </button>
          }
        />
        <SettingsRow
          icon={<Bell size={18} strokeWidth={1.8} className="text-[#60A5FA]" />}
          title="Push"
          subtitle="Notificações no celular"
          rightElement={
            <button
              role="switch"
              aria-checked={prefs.push}
              aria-label="Push ativado"
              type="button"
              onClick={() => updatePref('push', !prefs.push)}
              style={{
                minHeight: '24px',
                minWidth: '44px',
                ...(!prefs.push ? { backgroundColor: 'hsl(var(--switch-off))' } : {}),
              }}
              className={`relative inline-flex h-[24px] w-[44px] flex-shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors ${prefs.push ? 'bg-primary' : ''}`}
            >
              <span
                style={{ transform: prefs.push ? 'translateX(20px)' : 'translateX(0)' }}
                className="pointer-events-none block h-5 w-5 rounded-full bg-white shadow transition-transform duration-200"
              />
            </button>
          }
        />
      </SettingsGroup>

      {/* Tipos */}
      <SettingsGroup label="TIPOS DE NOTIFICAÇÃO">
        {(
          [
            ['proposalReceived', 'Propostas recebidas'],
            ['transactionUpdate', 'Atualizações de transações'],
            ['matchFound', 'Novos matches'],
            ['ratingReceived', 'Avaliações recebidas'],
            ['collectiveUpdate', 'Compras coletivas'],
          ] as [keyof NotifPrefs, string][]
        ).map(([key, label]) => (
          <SettingsRow
            key={key}
            icon={<Bell size={18} strokeWidth={1.8} />}
            title={label}
            rightElement={
              <button
                role="switch"
                aria-checked={prefs[key]}
                aria-label={`${label} ativado`}
                type="button"
                onClick={() => updatePref(key, !prefs[key])}
                style={{
                  minHeight: '24px',
                  minWidth: '44px',
                  ...(!prefs[key] ? { backgroundColor: 'hsl(var(--switch-off))' } : {}),
                }}
                className={`relative inline-flex h-[24px] w-[44px] flex-shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors ${prefs[key] ? 'bg-primary' : ''}`}
              >
                <span
                  style={{ transform: prefs[key] ? 'translateX(20px)' : 'translateX(0)' }}
                  className="pointer-events-none block h-5 w-5 rounded-full bg-white shadow transition-transform duration-200"
                />
              </button>
            }
          />
        ))}
      </SettingsGroup>

      {/* Marketing */}
      <SettingsGroup label="COMUNICAÇÕES">
        <SettingsRow
          icon={<Bell size={18} strokeWidth={1.8} />}
          title="Dicas e tendências"
          subtitle="Conteúdo semanal do agronegócio"
          rightElement={
            <button
              role="switch"
              aria-checked={prefs.weeklyTips}
              aria-label="Dicas semanais ativado"
              type="button"
              onClick={() => updatePref('weeklyTips', !prefs.weeklyTips)}
              style={{
                minHeight: '24px',
                minWidth: '44px',
                ...(!prefs.weeklyTips ? { backgroundColor: 'hsl(var(--switch-off))' } : {}),
              }}
              className={`relative inline-flex h-[24px] w-[44px] flex-shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors ${prefs.weeklyTips ? 'bg-primary' : ''}`}
            >
              <span
                style={{ transform: prefs.weeklyTips ? 'translateX(20px)' : 'translateX(0)' }}
                className="pointer-events-none block h-5 w-5 rounded-full bg-white shadow transition-transform duration-200"
              />
            </button>
          }
        />
      </SettingsGroup>

      <p className="text-muted-foreground px-5 pt-3 text-[11px]">
        Desativar um canal externo (WhatsApp, Push) não remove as notificações do centro de
        notificações.
      </p>
    </div>
  )
}
