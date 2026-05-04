import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { buildApp } from './app.js'

describe('API Health', () => {
  let app: FastifyInstance

  beforeEach(async () => {
    app = await buildApp()
    await app.ready()
  })

  afterEach(async () => {
    await app.close()
  })

  it('GET /health returns 200', async () => {
    const response = await app.inject({ method: 'GET', url: '/health' })
    expect(response.statusCode).toBe(200)
    expect(response.json<{ status: string }>().status).toBe('ok')
  })
})
