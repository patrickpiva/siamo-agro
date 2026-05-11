'use client'

import { useState, useCallback } from 'react'

export type GeolocationState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; lat: number; lng: number }
  | { status: 'error'; reason: 'denied' | 'unavailable' | 'timeout' }

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({ status: 'idle' })

  const request = useCallback(() => {
    if (!navigator.geolocation) {
      setState({ status: 'error', reason: 'unavailable' })
      return
    }

    setState({ status: 'loading' })

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setState({
          status: 'success',
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        })
      },
      (err) => {
        switch (err.code) {
          case GeolocationPositionError.PERMISSION_DENIED:
            setState({ status: 'error', reason: 'denied' })
            break
          case GeolocationPositionError.TIMEOUT:
            setState({ status: 'error', reason: 'timeout' })
            break
          default:
            setState({ status: 'error', reason: 'unavailable' })
        }
      },
      { timeout: 10_000, enableHighAccuracy: false },
    )
  }, [])

  return { state, request }
}
