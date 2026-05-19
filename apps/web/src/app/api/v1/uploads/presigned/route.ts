import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001'

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const token = cookieStore.get('access_token')?.value
  if (!token) return NextResponse.json({ error: { message: 'Não autenticado' } }, { status: 401 })

  const body: unknown = await request.json()
  const res = await fetch(`${API_URL}/api/v1/uploads/presigned`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  })

  const json: unknown = await res.json()
  return NextResponse.json(json, { status: res.status })
}
