'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, BottomCTA, ProgressIndicator, SectionLabel } from '@siamo/ui'
import { Navigation, ChevronRight } from '@siamo/ui/icons'
import { StatusBar } from '@/components/layout/status-bar'
import { ScreenHeader } from '@/components/layout/screen-header'
import { useOnboardingStore } from '@/stores/onboarding'
import { cn } from '@siamo/ui'

interface LocationData {
  latitude: number
  longitude: number
  city: string
  state: string
  cep?: string
  source: 'gps' | 'manual'
}

const inputClass =
  'w-full bg-bg-elevated border border-border rounded-[12px] px-4 py-[14px] text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent-forest dark:focus:border-accent-lime focus:bg-primary-subtle dark:focus:bg-accent-lime/[0.04] transition-colors min-h-0'

// ─── Geocode helpers ─────────────────────────────────────────────────────────
// Chamadas diretas a ViaCEP e Nominatim. Públicas, sem chave, sem proxy.

interface ViaCepResponse {
  cep?: string
  localidade?: string
  uf?: string
  erro?: boolean
}

async function lookupCep(cep: string): Promise<{ city: string; state: string } | null> {
  try {
    const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
      signal: AbortSignal.timeout(5_000),
    })
    if (!res.ok) return null
    const data = (await res.json()) as ViaCepResponse
    if (data.erro || !data.localidade || !data.uf) return null
    return { city: data.localidade, state: data.uf }
  } catch {
    return null
  }
}

interface NominatimReverse {
  address?: { city?: string; town?: string; village?: string; state?: string }
}

const STATE_UF: Record<string, string> = {
  Acre: 'AC',
  Alagoas: 'AL',
  Amapá: 'AP',
  Amazonas: 'AM',
  Bahia: 'BA',
  Ceará: 'CE',
  'Distrito Federal': 'DF',
  'Espírito Santo': 'ES',
  Goiás: 'GO',
  Maranhão: 'MA',
  'Mato Grosso': 'MT',
  'Mato Grosso do Sul': 'MS',
  'Minas Gerais': 'MG',
  Pará: 'PA',
  Paraíba: 'PB',
  Paraná: 'PR',
  Pernambuco: 'PE',
  Piauí: 'PI',
  'Rio de Janeiro': 'RJ',
  'Rio Grande do Norte': 'RN',
  'Rio Grande do Sul': 'RS',
  Rondônia: 'RO',
  Roraima: 'RR',
  'Santa Catarina': 'SC',
  'São Paulo': 'SP',
  Sergipe: 'SE',
  Tocantins: 'TO',
}

async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<{ city: string; state: string } | null> {
  try {
    const url = new URL('https://nominatim.openstreetmap.org/reverse')
    url.searchParams.set('lat', lat.toString())
    url.searchParams.set('lon', lng.toString())
    url.searchParams.set('format', 'json')
    const res = await fetch(url.toString(), {
      headers: { 'User-Agent': 'AgraIA/1.0 (agraiabr@gmail.com)' },
      signal: AbortSignal.timeout(5_000),
    })
    if (!res.ok) return null
    const data = (await res.json()) as NominatimReverse
    const city = data.address?.city ?? data.address?.town ?? data.address?.village
    const stateName = data.address?.state
    if (!city || !stateName) return null
    const uf = STATE_UF[stateName]
    if (!uf) return null
    return { city, state: uf }
  } catch {
    return null
  }
}

export default function CadastroLocalizacaoPage() {
  const router = useRouter()
  const { setLocation } = useOnboardingStore()

  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [cep, setCep] = useState('')
  const [latLng, setLatLng] = useState<{ lat: number; lng: number } | null>(null)
  const [gpsLoading, setGpsLoading] = useState(false)
  const [gpsError, setGpsError] = useState('')

  const isValid = city.trim().length >= 2 && state.trim().length === 2

  async function handleGps() {
    setGpsError('')
    setGpsLoading(true)
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 }),
      )
      const { latitude, longitude } = position.coords
      setLatLng({ lat: latitude, lng: longitude })

      const reverse = await reverseGeocode(latitude, longitude)
      if (reverse) {
        setCity(reverse.city)
        setState(reverse.state)
      }
    } catch {
      setGpsError('Não foi possível obter sua localização. Informe manualmente.')
    } finally {
      setGpsLoading(false)
    }
  }

  async function handleCepBlur() {
    const digits = cep.replace(/\D/g, '')
    if (digits.length !== 8) return
    const result = await lookupCep(digits)
    if (result) {
      setCity(result.city)
      setState(result.state)
    }
  }

  function handleSubmit() {
    if (!isValid) return
    const location: LocationData = {
      latitude: latLng?.lat ?? 0,
      longitude: latLng?.lng ?? 0,
      city: city.trim(),
      state: state.trim().toUpperCase(),
      cep: cep || undefined,
      source: latLng ? 'gps' : 'manual',
    }
    setLocation(location)
    router.push('/cadastro/foto')
  }

  return (
    <main className="bg-background mx-auto flex min-h-screen max-w-[430px] flex-col">
      <StatusBar />
      <ScreenHeader backHref="/cadastro/dados" />
      <ProgressIndicator current={3} total={5} />

      <div className="flex-1 px-5">
        <h1 className="mb-2 text-2xl font-medium leading-tight tracking-[-0.3px]">
          Onde você está?
        </h1>
        <p className="text-fg-secondary mb-6 text-sm leading-relaxed">
          Usamos sua localização para encontrar oportunidades próximas. Você pode ajustar isso
          depois.
        </p>

        <button
          type="button"
          onClick={() => {
            void handleGps()
          }}
          disabled={gpsLoading}
          className={cn(
            'mb-5 flex w-full items-center gap-3.5 rounded-[14px] p-[18px]',
            'bg-primary-subtle dark:bg-accent-lime/10 border-accent-lime/50 dark:border-accent-lime/30 border',
            'transition-opacity hover:opacity-90',
            'focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2',
            'disabled:opacity-70',
          )}
        >
          <div className="bg-accent-lime text-foreground flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[12px]">
            <Navigation size={22} strokeWidth={1.8} />
          </div>
          <div className="flex-1 text-left">
            <p className="text-accent-forest dark:text-accent-lime text-[14px] font-medium">
              {gpsLoading ? 'Obtendo localização…' : 'Usar minha localização atual'}
            </p>
            <p className="text-fg-secondary text-[11px]">
              Mais rápido e preciso · permissão necessária
            </p>
          </div>
          <ChevronRight
            size={20}
            strokeWidth={1.8}
            className="text-accent-forest dark:text-accent-lime flex-shrink-0"
          />
        </button>

        {gpsError && (
          <p className="text-destructive mb-4 text-xs" role="alert">
            {gpsError}
          </p>
        )}

        <div className="mb-5 flex items-center gap-2.5">
          <div className="bg-border h-px flex-1" />
          <span className="text-muted-foreground font-mono text-[11px] tracking-[0.5px]">
            OU INFORME MANUALMENTE
          </span>
          <div className="bg-border h-px flex-1" />
        </div>

        <SectionLabel optional>CEP</SectionLabel>
        <div className="mb-4">
          <input
            type="text"
            inputMode="numeric"
            value={cep}
            onChange={(e) => setCep(e.target.value.replace(/\D/g, '').slice(0, 8))}
            onBlur={() => {
              void handleCepBlur()
            }}
            placeholder="00000-000"
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-[1fr_80px] gap-3">
          <div>
            <SectionLabel>CIDADE</SectionLabel>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="São Paulo"
              className={inputClass}
            />
          </div>
          <div>
            <SectionLabel>UF</SectionLabel>
            <input
              type="text"
              value={state}
              onChange={(e) => setState(e.target.value.slice(0, 2))}
              placeholder="SP"
              maxLength={2}
              className={cn(inputClass, 'uppercase')}
            />
          </div>
        </div>
      </div>

      <BottomCTA>
        <Button
          variant={isValid ? 'cta' : 'cta-disabled'}
          disabled={!isValid}
          onClick={handleSubmit}
        >
          Continuar
        </Button>
      </BottomCTA>
    </main>
  )
}
