import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cookieStore = await cookies()
  const token = cookieStore.get('access_token')?.value

  if (!token) {
    return NextResponse.json(
      { data: null, error: { code: 'UNAUTHENTICATED', message: 'Não autenticado' } },
      { status: 401 },
    )
  }

  const search = req.nextUrl.searchParams.toString()
  const upstream = `${API_URL}/api/v1/listings/${id}/matches${search ? `?${search}` : ''}`

  const res = await fetch(upstream, {
    cache: 'no-store',
    headers: { Authorization: `Bearer ${token}` },
  })

  const json: unknown = await res.json()
  return NextResponse.json(json, { status: res.status })
}
