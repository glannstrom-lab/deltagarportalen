/**
 * Skav från rollspelet 2026-09-27 på Min konsulent.
 *
 * RD15: målet "Tre ansökningar per vecka" trunkerades till "Tre ansökninga…" på
 * mobil, och "0 av 1 mål avklarade" stod i rubrikposition.
 * Mutation: lägg tillbaka `truncate` eller räknaren → faller.
 *
 * RD23: "Tryck Enter för att skicka" på mobil, där Enter betyder ny rad.
 * Mutation: ta bort pekskärmsgrenen i handleKeyDown → faller.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('@/lib/supabase', () => ({ supabase: { from: () => ({}) } }))
vi.mock('@/services/konsulentMeddelandeApi', () => ({ konsulentMeddelandeApi: {} }))
vi.mock('@/stores/authStore', () => {
  const state = { user: { id: 'u1' }, profile: {} }
  return { useAuthStore: Object.assign(() => state, { getState: () => state }) }
})

import { GoalsSection, MessagesSection } from './MyConsultant'

const konsulent = { id: 'k1', first_name: 'Karin', last_name: 'K', email: 'k@example.com', phone: null, avatar_url: null } as never

function sattPekskarm(pek: boolean) {
  const mm = window.matchMedia as unknown as ReturnType<typeof vi.fn>
  mm.mockImplementation((query: string) => ({
    matches: pek && query === '(pointer: coarse)',
    media: query, onchange: null,
    addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
  }))
}

afterEach(() => {
  cleanup()
  sattPekskarm(false)
})

describe('Min konsulent — målen (RD15)', () => {
  const mal = [{ id: 'g1', title: 'Tre ansökningar per vecka', status: 'NOT_STARTED' as const }]

  it('visar hela målet, utan avkortning', () => {
    render(<GoalsSection goals={mal} />)
    const titel = screen.getByText('Tre ansökningar per vecka')
    expect(titel.className).not.toMatch(/\btruncate\b/)
  })

  it('har ingen räknare "0 av 1 mål" i rubriken', () => {
    render(<GoalsSection goals={mal} />)
    expect(screen.queryByText(/av 1 mål/)).toBeNull()
    expect(screen.getByText('Ej påbörjat')).toBeInTheDocument()
  })
})

describe('Min konsulent — Enter på mobil (RD23)', () => {
  it('pekskärm: Enter ger ny rad och skickar inte, och ingen rad säger "Tryck Enter"', () => {
    sattPekskarm(true)
    const skicka = vi.fn().mockResolvedValue(undefined)
    render(<MemoryRouter><MessagesSection messages={[]} consultant={konsulent} onSendMessage={skicka} loading={false} /></MemoryRouter>)
    const ruta = screen.getByLabelText('Skriv ett meddelande')
    fireEvent.change(ruta, { target: { value: 'Hej' } })
    fireEvent.keyDown(ruta, { key: 'Enter' })
    expect(skicka).not.toHaveBeenCalled()
    expect(screen.queryByText(/Tryck Enter/)).toBeNull()
  })

  it('dator: Enter skickar som förut', () => {
    const skicka = vi.fn().mockResolvedValue(undefined)
    render(<MemoryRouter><MessagesSection messages={[]} consultant={konsulent} onSendMessage={skicka} loading={false} /></MemoryRouter>)
    const ruta = screen.getByLabelText('Skriv ett meddelande')
    fireEvent.change(ruta, { target: { value: 'Hej' } })
    fireEvent.keyDown(ruta, { key: 'Enter' })
    expect(skicka).toHaveBeenCalledWith('Hej')
    expect(screen.getByText(/Tryck Enter/)).toBeInTheDocument()
  })
})
