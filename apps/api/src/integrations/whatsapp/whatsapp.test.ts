import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { withRetry, NonRetryableError } from './retry.js'
import { MockAdapter } from './mock.adapter.js'
import { TwilioAdapter } from './twilio.adapter.js'

// ─── Mock da DLQ para não precisar de Redis nos testes ────────────────────────

vi.mock('./dlq.js', () => ({
  enqueueDlq: vi.fn().mockResolvedValue(undefined),
}))

import { enqueueDlq } from './dlq.js'

const mockEnqueueDlq = vi.mocked(enqueueDlq)

// ─── withRetry ────────────────────────────────────────────────────────────────

describe('withRetry', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('retorna o resultado na primeira tentativa bem-sucedida', async () => {
    const fn = vi.fn().mockResolvedValue('ok')

    const result = await withRetry(fn)

    expect(result).toBe('ok')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('faz retry em falha transitória e retorna na segunda tentativa', async () => {
    const fn = vi.fn().mockRejectedValueOnce(new Error('network error')).mockResolvedValueOnce('ok')

    const promise = withRetry(fn, { baseDelayMs: 100 })
    await vi.runAllTimersAsync()
    const result = await promise

    expect(result).toBe('ok')
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('lança o erro após esgotar as 3 tentativas', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('persistent error'))

    const promise = withRetry(fn, { baseDelayMs: 100 })
    const assertion = expect(promise).rejects.toThrow('persistent error')
    await vi.runAllTimersAsync()
    await assertion

    expect(fn).toHaveBeenCalledTimes(3)
  })

  it('NÃO retenta em NonRetryableError (erro permanente)', async () => {
    const fn = vi.fn().mockRejectedValue(new NonRetryableError('invalid number'))

    await expect(withRetry(fn)).rejects.toBeInstanceOf(NonRetryableError)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('lança timeout quando a fn demora mais que timeoutMs', async () => {
    const fn = vi.fn(
      () => new Promise<never>(() => {}), // nunca resolve
    )

    const promise = withRetry(fn, { maxAttempts: 1, timeoutMs: 500 })
    const assertion = expect(promise).rejects.toThrow('timeout')
    await vi.advanceTimersByTimeAsync(600)
    await assertion
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('aplica backoff exponencial: 500ms → 1000ms entre tentativas', async () => {
    const delays: number[] = []
    const originalSetTimeout = globalThis.setTimeout

    // Intercepta os timeouts para capturar os delays reais
    vi.spyOn(globalThis, 'setTimeout').mockImplementation((fn, delay, ...args) => {
      if (typeof delay === 'number' && delay >= 100) delays.push(delay)

      return originalSetTimeout(fn, delay, ...args)
    })

    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('e1'))
      .mockRejectedValueOnce(new Error('e2'))
      .mockResolvedValueOnce('ok')

    const promise = withRetry(fn, { baseDelayMs: 500 })
    await vi.runAllTimersAsync()
    await promise

    // Primeiro retry: 500ms, segundo retry: 1000ms
    const backoffDelays = delays.filter((d) => d === 500 || d === 1000)
    expect(backoffDelays).toContain(500)
    expect(backoffDelays).toContain(1000)
  })
})

// ─── MockAdapter ──────────────────────────────────────────────────────────────

describe('MockAdapter', () => {
  let adapter: MockAdapter

  beforeEach(() => {
    adapter = new MockAdapter()
  })

  it('sendOtp registra a chamada com phone e code corretos', async () => {
    await adapter.sendOtp('+5511999990001', '654321')

    const calls = adapter.getCalls()
    expect(calls).toHaveLength(1)
    expect(calls[0]).toMatchObject({
      method: 'sendOtp',
      phone: '+5511999990001',
      template: 'otp',
      params: { code: '654321' },
    })
  })

  it('sendOtp renderiza o template correto no body', async () => {
    await adapter.sendOtp('+5511999990001', '654321')

    const [call] = adapter.getCalls()
    expect(call?.renderedBody).toContain('654321')
    expect(call?.renderedBody).toContain('AgroLink')
    expect(call?.renderedBody).toContain('5 minutos')
  })

  it('sendNotification registra template e params corretamente', async () => {
    await adapter.sendNotification('+5511999990001', 'new_match', {
      listing: 'Pulverização de soja',
      url: 'https://agrolink.com.br/matches/123',
    })

    const calls = adapter.getCalls()
    expect(calls).toHaveLength(1)
    expect(calls[0]).toMatchObject({
      method: 'sendNotification',
      template: 'new_match',
      params: { listing: 'Pulverização de soja' },
    })
  })

  it('sendNotification new_proposal inclui name, amount e url no body', async () => {
    await adapter.sendNotification('+5511999990001', 'new_proposal', {
      name: 'João Silva',
      listing: 'Colheita de milho',
      amount: '1.500,00',
      url: 'https://agrolink.com.br/proposals/456',
    })

    const [call] = adapter.getCalls()
    expect(call?.renderedBody).toContain('João Silva')
    expect(call?.renderedBody).toContain('R$ 1.500,00')
    expect(call?.renderedBody).toContain('Colheita de milho')
  })

  it('clearCalls reseta o histórico', async () => {
    await adapter.sendOtp('+5511999990001', '111111')
    adapter.clearCalls()

    expect(adapter.getCalls()).toHaveLength(0)
  })

  it('getCalls retorna cópia imutável (não afeta estado interno)', async () => {
    await adapter.sendOtp('+5511999990001', '111111')
    const calls = adapter.getCalls()

    // Mutação na cópia não deve afetar o adapter
    ;(calls as unknown[]).push('intruso')
    expect(adapter.getCalls()).toHaveLength(1)
  })
})

// ─── TwilioAdapter ────────────────────────────────────────────────────────────

describe('TwilioAdapter', () => {
  const ENV = {
    TWILIO_ACCOUNT_SID: 'ACtest123',
    TWILIO_AUTH_TOKEN: 'token456',
    TWILIO_WHATSAPP_FROM: 'whatsapp:+14155238886',
  }

  let fetchSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    mockEnqueueDlq.mockResolvedValue(undefined)

    // Configura as env vars para o adapter não entrar em modo stub
    for (const [key, value] of Object.entries(ENV)) {
      process.env[key] = value
    }

    fetchSpy = vi.fn()
    globalThis.fetch = fetchSpy
  })

  afterEach(() => {
    vi.useRealTimers()
    for (const key of Object.keys(ENV)) {
      delete process.env[key]
    }
  })

  it('sendOtp chama a URL correta da Twilio API', async () => {
    fetchSpy.mockResolvedValue({ ok: true, json: vi.fn() })

    const adapter = new TwilioAdapter()
    await adapter.sendOtp('+5511999990001', '123456')

    expect(fetchSpy).toHaveBeenCalledOnce()
    const [url] = fetchSpy.mock.calls[0] as [string]
    expect(url).toBe(
      `https://api.twilio.com/2010-04-01/Accounts/${ENV.TWILIO_ACCOUNT_SID}/Messages.json`,
    )
  })

  it('sendOtp envia To como whatsapp:{phone} e Body com o código', async () => {
    fetchSpy.mockResolvedValue({ ok: true, json: vi.fn() })

    const adapter = new TwilioAdapter()
    await adapter.sendOtp('+5511999990001', '123456')

    const init = fetchSpy.mock.calls[0]?.[1] as Parameters<typeof fetch>[1]
    const body = new URLSearchParams(init?.body as string)

    expect(body.get('To')).toBe('whatsapp:+5511999990001')
    expect(body.get('From')).toBe(ENV.TWILIO_WHATSAPP_FROM)
    expect(body.get('Body')).toContain('123456')
  })

  it('sendOtp usa Authorization Basic com base64 correto', async () => {
    fetchSpy.mockResolvedValue({ ok: true, json: vi.fn() })

    const adapter = new TwilioAdapter()
    await adapter.sendOtp('+5511999990001', '123456')

    const init = fetchSpy.mock.calls[0]![1] as Parameters<typeof fetch>[1]
    const headers = (init as NonNullable<Parameters<typeof fetch>[1]>).headers as Record<
      string,
      string
    >
    const expectedAuth = `Basic ${Buffer.from(`${ENV.TWILIO_ACCOUNT_SID}:${ENV.TWILIO_AUTH_TOKEN}`).toString('base64')}`

    expect(headers['Authorization']).toBe(expectedAuth)
  })

  it('retry em falha transitória: chama fetch 3 vezes antes de desistir', async () => {
    fetchSpy
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: vi.fn().mockResolvedValue({ message: 'server error' }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: vi.fn().mockResolvedValue({ message: 'server error' }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: vi.fn().mockResolvedValue({ message: 'server error' }),
      })

    const adapter = new TwilioAdapter()
    const promise = adapter.sendOtp('+5511999990001', '123456')
    const assertion = expect(promise).rejects.toThrow('Twilio 500')
    await vi.runAllTimersAsync()
    await assertion

    expect(fetchSpy).toHaveBeenCalledTimes(3)
  })

  it('enfileira na DLQ após esgotar todas as tentativas', async () => {
    fetchSpy.mockResolvedValue({
      ok: false,
      status: 500,
      json: vi.fn().mockResolvedValue({ message: 'server error' }),
    })

    const adapter = new TwilioAdapter()
    const promise = adapter.sendOtp('+5511999990001', '123456')
    const assertion = expect(promise).rejects.toThrow()
    await vi.runAllTimersAsync()
    await assertion

    expect(mockEnqueueDlq).toHaveBeenCalledOnce()
    expect(mockEnqueueDlq).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: 'twilio',
        method: 'sendOtp',
        attemptsMade: 3,
      }),
    )
  })

  it('NÃO retenta em erro 4xx (NonRetryableError)', async () => {
    fetchSpy.mockResolvedValue({
      ok: false,
      status: 400,
      json: vi.fn().mockResolvedValue({ message: 'invalid number' }),
    })

    const adapter = new TwilioAdapter()
    await expect(adapter.sendOtp('+5511999990001', '123456')).rejects.toThrow()

    // Apenas 1 tentativa — não retentou
    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  it('modo stub: não chama fetch quando env vars ausentes', async () => {
    delete process.env['TWILIO_ACCOUNT_SID']

    const adapter = new TwilioAdapter()
    await adapter.sendOtp('+5511999990001', '123456')

    expect(fetchSpy).not.toHaveBeenCalled()
  })
})
