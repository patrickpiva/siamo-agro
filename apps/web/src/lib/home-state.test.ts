import { describe, it, expect } from 'vitest'
import { resolveHomeState, countNewMessages, firstNameOf } from './home-state'

describe('resolveHomeState', () => {
  const base = { onboardingComplete: true, listingsCount: 2, transactionsCount: 3, pendingCount: 0 }

  it('FIRST_ACCESS quando onboarding incompleto (mesmo com anúncios)', () => {
    expect(resolveHomeState({ ...base, onboardingComplete: false })).toBe('FIRST_ACCESS')
  })

  it('FIRST_ACCESS quando sem anúncios e sem transações', () => {
    expect(resolveHomeState({ ...base, listingsCount: 0, transactionsCount: 0 })).toBe(
      'FIRST_ACCESS',
    )
  })

  it('onboarding incompleto vence pendência', () => {
    expect(
      resolveHomeState({
        onboardingComplete: false,
        listingsCount: 0,
        transactionsCount: 0,
        pendingCount: 5,
      }),
    ).toBe('FIRST_ACCESS')
  })

  it('RETURNING_PENDING quando há pendência e já houve atividade', () => {
    expect(resolveHomeState({ ...base, pendingCount: 1 })).toBe('RETURNING_PENDING')
  })

  it('RETURNING_PENDING conta atividade por transações mesmo sem anúncios', () => {
    expect(
      resolveHomeState({
        onboardingComplete: true,
        listingsCount: 0,
        transactionsCount: 1,
        pendingCount: 2,
      }),
    ).toBe('RETURNING_PENDING')
  })

  it('RETURNING_CLEAR quando onboarded, com atividade e sem pendência', () => {
    expect(resolveHomeState(base)).toBe('RETURNING_CLEAR')
  })
})

describe('countNewMessages', () => {
  // messages do mais recente para o mais antigo
  it('retorna 0 sem mensagens', () => {
    expect(countNewMessages([], 'me')).toBe(0)
  })

  it('retorna 0 quando a mais recente é minha', () => {
    expect(countNewMessages([{ senderId: 'me' }, { senderId: 'other' }], 'me')).toBe(0)
  })

  it('conta a sequência inicial da contraparte até a minha resposta', () => {
    const msgs = [
      { senderId: 'other' },
      { senderId: 'other' },
      { senderId: 'me' },
      { senderId: 'other' },
    ]
    expect(countNewMessages(msgs, 'me')).toBe(2)
  })

  it('conta todas quando o usuário nunca respondeu', () => {
    expect(countNewMessages([{ senderId: 'other' }, { senderId: 'other' }], 'me')).toBe(2)
  })
})

describe('firstNameOf', () => {
  it('extrai o primeiro nome', () => {
    expect(firstNameOf('João Silva')).toBe('João')
  })

  it('lida com nome único', () => {
    expect(firstNameOf('Marta')).toBe('Marta')
  })

  it('ignora espaços extras', () => {
    expect(firstNameOf('  João   Silva  ')).toBe('João')
  })

  it('string vazia não quebra', () => {
    expect(firstNameOf('')).toBe('')
  })
})
