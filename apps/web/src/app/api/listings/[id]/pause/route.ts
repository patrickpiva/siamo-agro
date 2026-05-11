import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001'

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cookieStore = await cookies()
  const token = cookieStore.get('access_token')?.value
  if (!token) return NextResponse.json({ error: { message: 'Não autenticado' } }, { status: 401 })

  const res = await fetch(`${API_URL}/api/v1/listings/${id}/pause`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  })

  const json: unknown = await res.json()
  return NextResponse.json(json, { status: res.status })
}
