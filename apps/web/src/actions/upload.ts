'use server'

import { cookies } from 'next/headers'

export type UploadSlot = {
  uploadUrl: string
  publicUrl: string
  key: string
}

type PresignedResult = { ok: true; slots: UploadSlot[] } | { ok: false; error: string }
type ConfirmResult = { ok: true; urls: string[] } | { ok: false; error: string }

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001'

async function getToken(): Promise<string | null> {
  return (await cookies()).get('access_token')?.value ?? null
}

export async function requestPresignedUrls(
  kind: 'listing' | 'profile',
  count: number,
): Promise<PresignedResult> {
  const token = await getToken()
  if (!token) return { ok: false, error: 'Não autenticado. Faça login para continuar.' }

  try {
    const res = await fetch(`${API_URL}/api/v1/uploads/presigned`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ kind, count }),
    })
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: { message?: string } }
      return {
        ok: false,
        error: body.error?.message ?? `Erro ${res.status} ao obter URLs de upload`,
      }
    }
    const { data } = (await res.json()) as { data: { uploads: UploadSlot[] } }
    return { ok: true, slots: data.uploads }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Erro de conexão com o servidor',
    }
  }
}

export async function confirmUpload(keys: string[]): Promise<ConfirmResult> {
  const token = await getToken()
  if (!token) return { ok: false, error: 'Não autenticado.' }

  try {
    const res = await fetch(`${API_URL}/api/v1/uploads/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ keys }),
    })
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: { message?: string } }
      return { ok: false, error: body.error?.message ?? 'Falha ao confirmar uploads' }
    }
    const { data } = (await res.json()) as { data: { urls: string[] } }
    return { ok: true, urls: data.urls }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Erro de conexão com o servidor',
    }
  }
}
