import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001'

async function getToken() {
  const cookieStore = await cookies()
  return cookieStore.get('access_token')?.value
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const res = await fetch(`${API_URL}/api/v1/listings/${id}`, { cache: 'no-store' })
  const json: unknown = await res.json()
  return NextResponse.json(json, { status: res.status })
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const token = await getToken()
  if (!token) return NextResponse.json({ error: { message: 'Não autenticado' } }, { status: 401 })

  const body: unknown = await request.json()
  const res = await fetch(`${API_URL}/api/v1/listings/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  })

  const json: unknown = await res.json()
  return NextResponse.json(json, { status: res.status })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const token = await getToken()
  if (!token) return NextResponse.json({ error: { message: 'Não autenticado' } }, { status: 401 })

  const res = await fetch(`${API_URL}/api/v1/listings/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })

  const json: unknown = await res.json()
  return NextResponse.json(json, { status: res.status })
}
