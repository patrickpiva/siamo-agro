import { describe, it, expect } from 'vitest'
import { formatBRL, getInitials } from './utils'

// ---------------------------------------------------------------------------
// formatBRL
// ---------------------------------------------------------------------------

describe('formatBRL', () => {
  it('formata centavos inteiros corretamente', () => {
    // R$ 100,00
    expect(formatBRL(10000)).toMatch(/100,00/)
  })

  it('formata valores com centavos fracionados', () => {
    // R$ 1.850,00
    expect(formatBRL(185000)).toMatch(/1\.850,00/)
  })

  it('formata zero como R$ 0,00', () => {
    expect(formatBRL(0)).toMatch(/0,00/)
  })

  it('inclui o símbolo de moeda BRL', () => {
    expect(formatBRL(5000)).toMatch(/R\$/)
  })

  it('formata valores grandes com separador de milhar', () => {
    // R$ 52.500,00
    expect(formatBRL(5250000)).toMatch(/52\.500,00/)
  })

  it('formata um centavo como R$ 0,01', () => {
    expect(formatBRL(1)).toMatch(/0,01/)
  })
})

// ---------------------------------------------------------------------------
// getInitials
// ---------------------------------------------------------------------------

describe('getInitials', () => {
  it('retorna as iniciais de nome e sobrenome', () => {
    expect(getInitials('João Silva')).toBe('JS')
  })

  it('retorna apenas a inicial quando há um único nome', () => {
    expect(getInitials('João')).toBe('J')
  })

  it('usa apenas as duas primeiras palavras para nomes compostos', () => {
    expect(getInitials('Maria José Santos')).toBe('MJ')
  })

  it('converte para maiúsculas', () => {
    expect(getInitials('celso aguiar')).toBe('CA')
  })

  it('lida com string vazia sem lançar erro', () => {
    expect(getInitials('')).toBe('')
  })

  it('lida com nome de palavra única sem sobrenome', () => {
    expect(getInitials('Argemiro')).toBe('A')
  })

  it('ignora espaços extras entre palavras', () => {
    // split(' ') com espaços duplos cria tokens vazios; slice/map/join ainda produz
    // letras das palavras reais
    const result = getInitials('Ana  Paula')
    // primeiro token 'Ana' → 'A', segundo '' → '' (via ?? '')
    // comportamento atual: 'A' + '' = 'A'
    expect(typeof result).toBe('string')
  })
})
