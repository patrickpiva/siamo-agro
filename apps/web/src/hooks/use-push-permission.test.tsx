import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { usePushPermission } from './use-push-permission'

// ---------------------------------------------------------------------------
// Regression: iOS Safari has no Web Notifications API outside an installed PWA,
// so `Notification` is an undeclared identifier there and reading it throws
// ReferenceError. This hook runs from Providers (which wraps the root layout),
// so the throw escaped app/error.tsx and replaced the whole app with Next's
// global "Application error" screen from the third page view onward.
//
// jsdom leaves Notification undefined too, which is why these cases reproduce
// the iOS failure faithfully.
// ---------------------------------------------------------------------------

function Probe() {
  const { shouldShowModal } = usePushPermission()
  return <span data-testid="flag">{String(shouldShowModal)}</span>
}

function grantFullPushSupport(permission: NotificationPermission = 'default') {
  Object.defineProperty(globalThis, 'Notification', {
    value: { permission, requestPermission: vi.fn() },
    configurable: true,
    writable: true,
  })
  Object.defineProperty(globalThis, 'PushManager', {
    value: function PushManager() {},
    configurable: true,
    writable: true,
  })
  Object.defineProperty(navigator, 'serviceWorker', {
    value: {},
    configurable: true,
  })
}

function removePushSupport() {
  Reflect.deleteProperty(globalThis, 'Notification')
  Reflect.deleteProperty(globalThis, 'PushManager')
  Reflect.deleteProperty(navigator, 'serviceWorker')
}

/**
 * The test environment only provides a partial Storage (no `clear`), so the
 * suite installs its own rather than depending on what jsdom happens to expose.
 */
function installLocalStorageStub() {
  const store = new Map<string, string>()
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    writable: true,
    value: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => {
        store.set(k, String(v))
      },
      removeItem: (k: string) => {
        store.delete(k)
      },
      clear: () => store.clear(),
      key: (i: number) => [...store.keys()][i] ?? null,
      get length() {
        return store.size
      },
    },
  })
}

beforeEach(() => {
  installLocalStorageStub()
  removePushSupport()
})

afterEach(() => {
  removePushSupport()
})

describe('usePushPermission — plataformas sem Notification API (iOS Safari)', () => {
  it('não lança quando o contador de sessões já passou do gatilho', () => {
    // 3 is the threshold that makes the hook evaluate shouldShow()
    localStorage.setItem('siamo:session-count', '5')
    expect(() => render(<Probe />)).not.toThrow()
  })

  it('não propõe o modal quando não há Notification', () => {
    localStorage.setItem('siamo:session-count', '5')
    render(<Probe />)
    expect(screen.getByTestId('flag').textContent).toBe('false')
  })

  it('não propõe o modal quando há Notification mas não há PushManager', () => {
    localStorage.setItem('siamo:session-count', '5')
    Object.defineProperty(globalThis, 'Notification', {
      value: { permission: 'default' },
      configurable: true,
      writable: true,
    })
    render(<Probe />)
    expect(screen.getByTestId('flag').textContent).toBe('false')
  })
})

describe('usePushPermission — plataformas com suporte completo', () => {
  it('propõe o modal a partir da terceira sessão', () => {
    localStorage.setItem('siamo:session-count', '5')
    grantFullPushSupport()
    render(<Probe />)
    expect(screen.getByTestId('flag').textContent).toBe('true')
  })

  it('não propõe o modal antes da terceira sessão', () => {
    localStorage.setItem('siamo:session-count', '0')
    grantFullPushSupport()
    render(<Probe />)
    expect(screen.getByTestId('flag').textContent).toBe('false')
  })

  it('não propõe o modal quando a permissão já foi concedida', () => {
    localStorage.setItem('siamo:session-count', '5')
    grantFullPushSupport('granted')
    render(<Probe />)
    expect(screen.getByTestId('flag').textContent).toBe('false')
  })

  it('não propõe o modal quando a permissão foi negada', () => {
    localStorage.setItem('siamo:session-count', '5')
    grantFullPushSupport('denied')
    render(<Probe />)
    expect(screen.getByTestId('flag').textContent).toBe('false')
  })
})
