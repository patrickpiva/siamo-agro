import { describe, it, expect, vi, afterEach } from 'vitest'
import { msUntilNextBusinessHours } from './queue.js'

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Mock the Intl.DateTimeFormat.prototype.format to return a specific BRT hour.
 * The function under test calls `new Intl.DateTimeFormat(...).format(new Date())`
 * and parses the result as an integer hour.
 */
function mockBRTHour(hour: number) {
  vi.spyOn(Intl.DateTimeFormat.prototype, 'format').mockReturnValue(String(hour))
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('msUntilNextBusinessHours', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ── Within business hours ──────────────────────────────────────────────────

  it('returns 0 at 10:00 BRT (mid-morning)', () => {
    mockBRTHour(10)
    expect(msUntilNextBusinessHours()).toBe(0)
  })

  it('returns 0 at exactly 08:00 BRT (start of window)', () => {
    mockBRTHour(8)
    expect(msUntilNextBusinessHours()).toBe(0)
  })

  it('returns 0 at 19:00 BRT (still within window)', () => {
    mockBRTHour(19)
    expect(msUntilNextBusinessHours()).toBe(0)
  })

  it('returns 0 at 14:00 BRT (afternoon)', () => {
    mockBRTHour(14)
    expect(msUntilNextBusinessHours()).toBe(0)
  })

  // ── Outside business hours — before opening ────────────────────────────────

  it('returns positive ms at 06:00 BRT (before business hours)', () => {
    mockBRTHour(6)
    expect(msUntilNextBusinessHours()).toBeGreaterThan(0)
  })

  it('returns positive ms at 00:00 BRT (midnight)', () => {
    mockBRTHour(0)
    expect(msUntilNextBusinessHours()).toBeGreaterThan(0)
  })

  it('calculates correct delay for 06:00 BRT → 08:00 (2 h + 10 min buffer)', () => {
    mockBRTHour(6)
    // hoursUntil = 8 - 6 = 2 → (2 * 60 + 10) * 60 * 1000 = 8_400_000 ms
    expect(msUntilNextBusinessHours()).toBe(8_400_000)
  })

  it('calculates correct delay for 07:00 BRT → 08:00 (1 h + 10 min buffer)', () => {
    mockBRTHour(7)
    // hoursUntil = 8 - 7 = 1 → (1 * 60 + 10) * 60 * 1000 = 4_200_000 ms
    expect(msUntilNextBusinessHours()).toBe(4_200_000)
  })

  // ── Outside business hours — after closing ─────────────────────────────────

  it('returns positive ms at 20:00 BRT (first hour after window)', () => {
    mockBRTHour(20)
    expect(msUntilNextBusinessHours()).toBeGreaterThan(0)
  })

  it('returns positive ms at 23:00 BRT (late night)', () => {
    mockBRTHour(23)
    expect(msUntilNextBusinessHours()).toBeGreaterThan(0)
  })

  it('calculates correct delay for 22:00 BRT → next 08:00 (10 h + 10 min buffer)', () => {
    mockBRTHour(22)
    // hoursUntil = 32 - 22 = 10 → (10 * 60 + 10) * 60 * 1000 = 36_600_000 ms
    expect(msUntilNextBusinessHours()).toBe(36_600_000)
  })

  it('calculates correct delay for 20:00 BRT → next 08:00 (12 h + 10 min buffer)', () => {
    mockBRTHour(20)
    // hoursUntil = 32 - 20 = 12 → (12 * 60 + 10) * 60 * 1000 = 43_800_000 ms
    expect(msUntilNextBusinessHours()).toBe(43_800_000)
  })

  it('calculates correct delay for 00:00 BRT → 08:00 (8 h + 10 min buffer)', () => {
    mockBRTHour(0)
    // hoursUntil = 8 - 0 = 8 → (8 * 60 + 10) * 60 * 1000 = 29_400_000 ms
    expect(msUntilNextBusinessHours()).toBe(29_400_000)
  })

  // ── Boundary precision ─────────────────────────────────────────────────────

  it('20:00 is the first hour that requires a delay (exclusive upper bound)', () => {
    mockBRTHour(19)
    const within = msUntilNextBusinessHours()
    mockBRTHour(20)
    const outside = msUntilNextBusinessHours()
    expect(within).toBe(0)
    expect(outside).toBeGreaterThan(0)
  })
})
