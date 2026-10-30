import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const callAI = vi.hoisted(() => vi.fn())
vi.mock('@/services/aiApi', () => ({ callAI: (...a: unknown[]) => callAI(...a) }))

const voice = vi.hoisted(() => ({
  isRecording: false,
  isSupported: true,
  toggleRecording: vi.fn(),
  stopRecording: vi.fn(),
  onTranscript: undefined as undefined | ((t: string) => void),
}))
vi.mock('@/hooks/useVoiceInput', () => ({
  useVoiceInput: (o: { onTranscript?: (t: string) => void }) => {
    voice.onTranscript = o.onTranscript
    return {
      isRecording: voice.isRecording,
      isSupported: voice.isSupported,
      toggleRecording: voice.toggleRecording,
      stopRecording: voice.stopRecording,
    }
  },
}))

import { PrataSaSkriverVi } from './PrataSaSkriverVi'

describe('PrataSaSkriverVi', () => {
  beforeEach(() => {
    callAI.mockReset()
    voice.toggleRecording.mockReset()
    voice.stopRecording.mockReset()
    voice.isRecording = false
    voice.isSupported = true
  })

  it('säger vart ljudet går INNAN mikrofonen kan slås på, och knappen pekar på raden', () => {
    render(<PrataSaSkriverVi text="" onApply={vi.fn()} />)
    const info = screen.getByText(/skickar din webbläsare ljudet till sin leverantör/i)
    expect(info.textContent).toMatch(/Google/)
    const knapp = screen.getByRole('button', { name: /prata in text/i })
    expect(knapp.getAttribute('aria-describedby')).toBe(info.id)
    expect(voice.toggleRecording).not.toHaveBeenCalled()
  })

  it('visar ett lugnt besked och ingen mikrofonknapp där taligenkänning saknas', () => {
    voice.isSupported = false
    render(<PrataSaSkriverVi text="" onApply={vi.fn()} />)
    expect(screen.getByText(/kan inte skriva ner tal/i)).toBeTruthy()
    expect(screen.queryByRole('button', { name: /prata in text/i })).toBeNull()
  })

  it('visar inspelningsläge i en live-region och en stoppknapp med text', () => {
    voice.isRecording = true
    render(<PrataSaSkriverVi text="" onApply={vi.fn()} />)
    const lyssnar = screen.getByText(/jag lyssnar/i)
    expect(lyssnar.closest('[aria-live="polite"]')).toBeTruthy()
    expect(screen.getByRole('button', { name: /sluta prata/i })).toBeTruthy()
  })

  it('visar original och städad text bredvid varandra, och ändrar inget förrän man väljer', async () => {
    callAI.mockResolvedValue({ rensning: { rensad: 'Jag har jobbat på lager.' } })
    const onApply = vi.fn()
    const { rerender } = render(<PrataSaSkriverVi text="Hej." onApply={onApply} />)
    await userEvent.click(screen.getByRole('button', { name: /prata in text/i }))
    expect(voice.toggleRecording).toHaveBeenCalledTimes(1)
    act(() => voice.onTranscript?.('eh jag har jobbat på lager'))
    rerender(<PrataSaSkriverVi text="Hej." onApply={onApply} />)
    await userEvent.click(screen.getByRole('button', { name: /städa texten/i }))
    await screen.findByText('Jag har jobbat på lager.')
    expect(screen.getByText('eh jag har jobbat på lager')).toBeTruthy()
    expect(onApply).not.toHaveBeenCalled()
    await userEvent.click(screen.getByRole('button', { name: /använd den städade/i }))
    expect(onApply).toHaveBeenCalledWith('Hej. Jag har jobbat på lager.')
  })

  it('kan använda originalet, och ett fel i städningen lämnar det inpratade kvar', async () => {
    callAI.mockImplementation(async () => { throw new Error('nere') })
    const onApply = vi.fn()
    const { rerender } = render(<PrataSaSkriverVi text="" onApply={onApply} />)
    act(() => voice.onTranscript?.('jag är noggrann'))
    rerender(<PrataSaSkriverVi text="" onApply={onApply} />)
    await userEvent.click(screen.getByRole('button', { name: /städa texten/i }))
    await waitFor(() => expect(screen.getByText(/gick inte att städa texten/i)).toBeTruthy())
    expect(onApply).not.toHaveBeenCalled()
    await userEvent.click(screen.getByRole('button', { name: /använd som den är/i }))
    expect(onApply).toHaveBeenCalledWith('jag är noggrann')
  })
})
