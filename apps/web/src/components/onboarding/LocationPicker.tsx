'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useGeolocation } from '@/hooks/use-geolocation'
import { useViaCep } from '@/hooks/use-viacep'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { OnboardingLocation } from '@/lib/onboarding-store'

// CSS do MapLibre — carregado dinamicamente junto com o SDK para evitar SSR issues
// O import real acontece dentro do useEffect (somente no cliente)

interface LocationPickerProps {
  onLocationSelect: (location: OnboardingLocation) => void
  initialLocation?: OnboardingLocation | null
}

// ─── Nominatim geocode (OpenStreetMap — gratuito, sem key) ───────────────────

async function geocodeCity(
  city: string,
  state: string,
): Promise<{ lat: number; lng: number } | null> {
  try {
    const url = new URL('https://nominatim.openstreetmap.org/search')
    url.searchParams.set('city', city)
    url.searchParams.set('state', state)
    url.searchParams.set('country', 'BR')
    url.searchParams.set('format', 'json')
    url.searchParams.set('limit', '1')

    const res = await fetch(url.toString(), {
      headers: { 'User-Agent': 'AgroLink/1.0 (agrolinkbr@gmail.com)' },
      signal: AbortSignal.timeout(5_000),
    })

    if (!res.ok) return null

    const data = (await res.json()) as Array<{ lat: string; lon: string }>
    if (!data[0]) return null

    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
  } catch {
    return null
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function LocationPicker({ onLocationSelect, initialLocation }: LocationPickerProps) {
  const { state: geoState, request: requestGeo } = useGeolocation()
  const { state: cepState, lookup: lookupCep } = useViaCep()

  const [mode, setMode] = useState<'loading' | 'map' | 'cep'>('loading')
  const [cep, setCep] = useState('')
  const [city, setCity] = useState(initialLocation?.city ?? '')
  const [uf, setUf] = useState(initialLocation?.state ?? '')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [confirmedLocation, setConfirmedLocation] = useState<OnboardingLocation | null>(
    initialLocation ?? null,
  )
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<unknown>(null)

  // Inicializa: tenta geolocation
  useEffect(() => {
    requestGeo()
  }, [requestGeo])

  // Reage ao resultado do geo
  useEffect(() => {
    if (geoState.status === 'success') {
      setMode('map')
      // Carrega MapLibre dinamicamente para não afetar o bundle SSR
      void (async () => {
        try {
          const maplibregl = await import('maplibre-gl')
          await import('maplibre-gl/dist/maplibre-gl.css')

          if (!mapRef.current) return

          const maptilerKey = process.env['NEXT_PUBLIC_MAPTILER_KEY']
          const style = maptilerKey
            ? `https://api.maptiler.com/maps/streets-v2/style.json?key=${maptilerKey}`
            : 'https://demotiles.maplibre.org/style.json'

          const map = new maplibregl.Map({
            container: mapRef.current,
            style,
            center: [geoState.lng, geoState.lat],
            zoom: 12,
          })

          const marker = new maplibregl.Marker({ draggable: true })
            .setLngLat([geoState.lng, geoState.lat])
            .addTo(map)

          // Geocode reverso simplificado usando Nominatim
          const fetchCityFromCoords = async (lat: number, lng: number) => {
            try {
              const url = new URL('https://nominatim.openstreetmap.org/reverse')
              url.searchParams.set('lat', lat.toString())
              url.searchParams.set('lon', lng.toString())
              url.searchParams.set('format', 'json')

              const res = await fetch(url.toString(), {
                headers: { 'User-Agent': 'AgroLink/1.0 (agrolinkbr@gmail.com)' },
                signal: AbortSignal.timeout(5_000),
              })
              if (!res.ok) return

              const data = (await res.json()) as {
                address?: { city?: string; town?: string; state?: string }
              }
              const cityName = data.address?.city ?? data.address?.town ?? ''
              const stateName = data.address?.state ?? ''

              // Extrai a sigla do estado (simplificado)
              const stateMap: Record<string, string> = {
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
              const stateUf = stateMap[stateName] ?? ''

              if (cityName && stateUf) {
                const loc: OnboardingLocation = { lat, lng, city: cityName, state: stateUf }
                setConfirmedLocation(loc)
                setCity(cityName)
                setUf(stateUf)
                onLocationSelect(loc)
              }
            } catch {
              // fallback silencioso
            }
          }

          // Busca cidade para a posição inicial
          await fetchCityFromCoords(geoState.lat, geoState.lng)

          // Atualiza quando o marker é arrastado
          marker.on('dragend', () => {
            const lngLat = marker.getLngLat()
            void fetchCityFromCoords(lngLat.lat, lngLat.lng)
          })

          mapInstanceRef.current = map
        } catch {
          setMode('cep')
        }
      })()
    } else if (geoState.status === 'error') {
      setMode('cep')
    }
  }, [geoState, onLocationSelect])

  // Reage ao resultado do ViaCEP
  useEffect(() => {
    if (cepState.status === 'success') {
      const { localidade, uf: stateUf } = cepState.result
      setCity(localidade)
      setUf(stateUf)
      setErrorMsg(null)

      // Geocode pelo nome da cidade
      void (async () => {
        const coords = await geocodeCity(localidade, stateUf)
        if (coords) {
          const loc: OnboardingLocation = { ...coords, city: localidade, state: stateUf }
          setConfirmedLocation(loc)
          onLocationSelect(loc)
        } else {
          setErrorMsg('Não foi possível determinar as coordenadas. Informe manualmente.')
        }
      })()
    } else if (cepState.status === 'error') {
      setErrorMsg(cepState.message)
    }
  }, [cepState, onLocationSelect])

  const handleManualConfirm = useCallback(async () => {
    if (!city || !uf) {
      setErrorMsg('Informe a cidade e o estado')
      return
    }
    setErrorMsg(null)
    const coords = await geocodeCity(city, uf)
    if (coords) {
      const loc: OnboardingLocation = { ...coords, city, state: uf }
      setConfirmedLocation(loc)
      onLocationSelect(loc)
    } else {
      setErrorMsg('Não foi possível determinar as coordenadas para essa cidade.')
    }
  }, [city, uf, onLocationSelect])

  // ── Render ────────────────────────────────────────────────────────────────

  if (mode === 'loading') {
    return (
      <div className="text-muted-foreground flex h-48 items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="border-primary h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" />
          <span className="text-sm">Buscando localização…</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {mode === 'map' ? (
        <>
          <p className="text-muted-foreground text-sm">
            Arraste o marcador para ajustar sua localização.
          </p>
          <div ref={mapRef} className="h-64 w-full overflow-hidden rounded-lg border" />
          {confirmedLocation && (
            <div className="bg-primary-subtle rounded-lg p-3 text-sm">
              <span className="font-medium">
                {confirmedLocation.city} — {confirmedLocation.state}
              </span>
            </div>
          )}
          <button
            type="button"
            className="text-muted-foreground text-sm underline underline-offset-2"
            onClick={() => setMode('cep')}
          >
            Não está correto? Informe o CEP manualmente
          </button>
        </>
      ) : (
        <>
          <p className="text-muted-foreground text-sm">
            Sua localização é usada para conectar você a clientes e prestadores próximos.
          </p>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cep-input">CEP</Label>
            <Input
              id="cep-input"
              inputMode="numeric"
              maxLength={9}
              placeholder="00000-000"
              value={cep}
              onChange={(e) => setCep(e.target.value)}
              onBlur={() => {
                if (cep.replace(/\D/g, '').length === 8) {
                  void lookupCep(cep)
                }
              }}
            />
          </div>

          {(city || uf) && (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="city-input">Cidade</Label>
                <Input
                  id="city-input"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="São Paulo"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="uf-input">Estado</Label>
                <Input
                  id="uf-input"
                  value={uf}
                  onChange={(e) => setUf(e.target.value.toUpperCase().slice(0, 2))}
                  placeholder="SP"
                  maxLength={2}
                />
              </div>
            </div>
          )}

          {!city && !uf && (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="city-input-manual">Cidade</Label>
                <Input
                  id="city-input-manual"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Ex: Uberlândia"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="uf-input-manual">Estado</Label>
                <Input
                  id="uf-input-manual"
                  value={uf}
                  onChange={(e) => setUf(e.target.value.toUpperCase().slice(0, 2))}
                  placeholder="MG"
                  maxLength={2}
                />
              </div>
            </div>
          )}

          {errorMsg && <p className="text-destructive text-sm">{errorMsg}</p>}

          {cepState.status === 'loading' && (
            <p className="text-muted-foreground text-sm">Consultando CEP…</p>
          )}

          {!confirmedLocation && city && uf && (
            <button
              type="button"
              className="text-primary text-sm font-medium underline underline-offset-2"
              onClick={() => void handleManualConfirm()}
            >
              Confirmar cidade: {city} — {uf}
            </button>
          )}

          {confirmedLocation && (
            <div className="bg-primary-subtle rounded-lg p-3 text-sm">
              <span className="font-medium">
                ✓ {confirmedLocation.city} — {confirmedLocation.state}
              </span>
            </div>
          )}
        </>
      )}
    </div>
  )
}
