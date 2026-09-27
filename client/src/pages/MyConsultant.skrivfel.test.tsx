/**
 * RD1/RD26 (rollspelet 2026-09-27): på Min konsulent tömdes fältet även när
 * meddelandet nekades (RLS 403), och ingen felrad visades. `handleSend` hade
 * `try/finally` utan `catch`.
 *
 * Mutation: töm fältet före `kor()` (som förut) → första testet faller.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
vi.mock('@/lib/supabase', () => ({ supabase: { from: () => ({}) } }))
vi.mock('@/services/konsulentMeddelandeApi', () => ({ konsulentMeddelandeApi: {} }))
vi.mock('@/stores/authStore', () => {
  const state = { user: { id: 'u1' }, profile: { first_name: 'Anna' } }
  return { useAuthStore: Object.assign(() => state, { getState: () => state }) }
})

import { MessagesSection } from './MyConsultant'

afterEach(cleanup)

const konsulent = { id: 'k1', first_name: 'Demo', last_name: 'Konsulent', email: 'k@example.com', phone: null, avatar_url: null } as never

function skriv(text: string) {
  const ruta = screen.getByLabelText('Skriv ett meddelande')
  fireEvent.change(ruta, { target: { value: text } })
  return ruta
}

describe('Min konsulent — meddelandet försvinner inte tyst (RD1/RD26)', () => {
  it('ett nekat meddelande står kvar i fältet, med en felrad', async () => {
    const skicka = vi.fn().mockRejectedValue(new Error('42501'))
    render(<MemoryRouter><MessagesSection messages={[]} consultant={konsulent} onSendMessage={skicka} loading={false} /></MemoryRouter>)
    const ruta = skriv('Kan vi ses på tisdag?')
    fireEvent.click(screen.getByRole('button', { name: 'Skicka meddelande' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Din text är kvar')
    expect(ruta).toHaveValue('Kan vi ses på tisdag?')
  })

  it('Försök igen skickar samma text och tömmer fältet när det går fram', async () => {
    const skicka = vi.fn().mockRejectedValueOnce(new Error('nät')).mockResolvedValueOnce(undefined)
    render(<MemoryRouter><MessagesSection messages={[]} consultant={konsulent} onSendMessage={skicka} loading={false} /></MemoryRouter>)
    const ruta = skriv('Hej!')
    fireEvent.click(screen.getByRole('button', { name: 'Skicka meddelande' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Försök igen' }))
    await waitFor(() => expect(skicka).toHaveBeenCalledTimes(2))
    expect(skicka).toHaveBeenLastCalledWith('Hej!')
    await waitFor(() => expect(ruta).toHaveValue(''))
  })
})
