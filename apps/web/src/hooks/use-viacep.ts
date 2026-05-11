'use client'

import { useState, useCallback } from 'react'

export interface ViaCepResult {
  cep: string
  logradouro: string
  bairro: string
  localidade: string // cidade
  uf: string // estado (2 letras)
  erro?: boolean
}

export type ViaCepState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; result: ViaCepResult }
  | { status: 'error'; message: string }

export function useViaCep() {
  const [state, setState] = useState<ViaCepState>({ status: 'idle' })

  const lookup = useCallback(async (cep: string) => {
    const digits = cep.replace(/\D/g, '')

    if (digits.length !== 8) {
      setState({ status: 'error', message: 'CEP deve ter 8 dígitos' })
      return
    }

    setState({ status: 'loading' })

    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`, {
        signal: AbortSignal.timeout(8_000),
      })

      if (!res.ok) {
        setState({ status: 'error', message: 'Erro ao consultar CEP' })
        return
      }

      const data = (await res.json()) as ViaCepResult

      if (data.erro) {
        setState({ status: 'error', message: 'CEP não encontrado' })
        return
      }

      setState({ status: 'success', result: data })
    } catch {
      setState({ status: 'error', message: 'Erro de conexão ao consultar CEP' })
    }
  }, [])

  const reset = useCallback(() => setState({ status: 'idle' }), [])

  return { state, lookup, reset }
}
