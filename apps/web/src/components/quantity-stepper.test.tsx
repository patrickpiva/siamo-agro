import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { QuantityStepper } from '@agrolink/ui'

// ---------------------------------------------------------------------------
// QuantityStepper — testa o fix de skip (stale closure + onClick duplo)
// ---------------------------------------------------------------------------

describe('QuantityStepper', () => {
  let onChange: ReturnType<typeof vi.fn>

  beforeEach(() => {
    onChange = vi.fn()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('incrementa em 1 num único pointerDown', () => {
    render(<QuantityStepper value={1} onChange={onChange} unit="un" />)
    fireEvent.pointerDown(screen.getByLabelText('Aumentar quantidade'))
    fireEvent.pointerUp(screen.getByLabelText('Aumentar quantidade'))
    // Deve chamar onChange exatamente uma vez com valor 2
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith(2)
  })

  it('decrementa em 1 num único pointerDown', () => {
    render(<QuantityStepper value={3} onChange={onChange} unit="un" />)
    fireEvent.pointerDown(screen.getByLabelText('Diminuir quantidade'))
    fireEvent.pointerUp(screen.getByLabelText('Diminuir quantidade'))
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith(2)
  })

  it('não ultrapassa o valor mínimo', () => {
    render(<QuantityStepper value={1} onChange={onChange} min={1} unit="un" />)
    // Botão deve estar desabilitado
    expect(screen.getByLabelText('Diminuir quantidade')).toBeDisabled()
    fireEvent.pointerDown(screen.getByLabelText('Diminuir quantidade'))
    expect(onChange).not.toHaveBeenCalled()
  })

  it('não ultrapassa o valor máximo', () => {
    render(<QuantityStepper value={5} onChange={onChange} max={5} unit="un" />)
    expect(screen.getByLabelText('Aumentar quantidade')).toBeDisabled()
    fireEvent.pointerDown(screen.getByLabelText('Aumentar quantidade'))
    expect(onChange).not.toHaveBeenCalled()
  })

  it('incrementa repetidamente ao segurar (hold-to-repeat)', () => {
    const { rerender } = render(<QuantityStepper value={1} onChange={onChange} unit="un" />)

    fireEvent.pointerDown(screen.getByLabelText('Aumentar quantidade'))
    // Primeiro disparo imediato: 1 → 2
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenLastCalledWith(2)

    // Simula re-render com novo valor (como faria o pai)
    rerender(<QuantityStepper value={2} onChange={onChange} unit="un" />)

    // Avança o intervalo uma vez (150ms)
    vi.advanceTimersByTime(150)
    expect(onChange).toHaveBeenCalledTimes(2)
    expect(onChange).toHaveBeenLastCalledWith(3)

    // Avança mais uma vez
    rerender(<QuantityStepper value={3} onChange={onChange} unit="un" />)
    vi.advanceTimersByTime(150)
    expect(onChange).toHaveBeenCalledTimes(3)
    expect(onChange).toHaveBeenLastCalledWith(4)

    fireEvent.pointerUp(screen.getByLabelText('Aumentar quantidade'))
  })

  it('para de incrementar ao soltar o botão', () => {
    render(<QuantityStepper value={1} onChange={onChange} unit="un" />)
    fireEvent.pointerDown(screen.getByLabelText('Aumentar quantidade'))
    fireEvent.pointerUp(screen.getByLabelText('Aumentar quantidade'))
    const callsAfterRelease = onChange.mock.calls.length
    vi.advanceTimersByTime(500)
    // Nenhuma chamada extra após soltar
    expect(onChange).toHaveBeenCalledTimes(callsAfterRelease)
  })

  it('para de incrementar ao arrastar para fora do botão', () => {
    render(<QuantityStepper value={1} onChange={onChange} unit="un" />)
    fireEvent.pointerDown(screen.getByLabelText('Aumentar quantidade'))
    fireEvent.pointerLeave(screen.getByLabelText('Aumentar quantidade'))
    const callsAfterLeave = onChange.mock.calls.length
    vi.advanceTimersByTime(500)
    expect(onChange).toHaveBeenCalledTimes(callsAfterLeave)
  })

  it('exibe o valor e a unidade', () => {
    render(<QuantityStepper value={7} onChange={onChange} unit="sacas" />)
    expect(screen.getByText('7')).toBeInTheDocument()
    expect(screen.getByText('sacas')).toBeInTheDocument()
  })
})
