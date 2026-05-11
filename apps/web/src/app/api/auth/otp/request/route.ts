import { type NextRequest, NextResponse } from 'next/server'

const API_URL = process.env['API_URL'] ?? 'http://localhost:3001'

export async function POST(req: NextRequest) {
  try {
    const body: unknown = await req.json()

    const res = await fetch(`${API_URL}/api/v1/auth/otp/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const data: unknown = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json(
      { data: null, error: { code: 'NETWORK_ERROR', message: 'Erro de conexão com a API' } },
      { status: 502 },
    )
  }
}
