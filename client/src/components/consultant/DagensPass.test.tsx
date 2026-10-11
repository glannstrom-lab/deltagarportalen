import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const markAttendance = vi.fn()
let sessions: Array<Record<string, unknown>> = []
let fel: { message: string } | null = null

// lib/dagensPass.ts hämtar sedan 2026-09-22 bara pass ur den inloggade
// konsulentens egna planer: auth.getUser → activity_plans → activity_sessions.
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getUser: async () => ({ data: { user: { id: 'k1' } }, error: null }) },
    from: vi.fn((tabell: string) => {
      const b: Record<string, unknown> = {}
      b.select = vi.fn(() => b)
      b.eq = vi.fn(() => (tabell === 'activity_plans' ? Promise.resolve({ data: [{ id: 'pl' }], error: null }) : b))
      b.in = vi.fn(() => b)
      b.order = vi.fn(() => Promise.resolve({ data: sessions, error: fel }))
      return b
    }),
  },
}))
vi.mock('@/services/aktivitetApi', () => ({
  aktivitetsplanApi: { markAttendance: (...a: unknown[]) => markAttendance(...a) },
}))
vi.mock('@/lib/toast', () => ({ notifications: { error: vi.fn(), success: vi.fn() } }))

import { DagensPass } from './DagensPass'

// Lokalt datum, inte UTC: toISOString() ger gårdagen mellan 00:00 och 02:00 svensk tid,
// och då har passet (slut 23:59 'i går') redan passerat → 'Saknar närvaro' i stället för 'Väntar'.
const idag = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` })()
const pass = (o: Record<string, unknown>) => ({
  id: 's1', participant_id: 'p1', plan_id: 'pl', date: idag, start_time: '09:00:00', end_time: '23:59:00',
  title: 'Verkstad', attendance: null, self_checkin_at: null, absence_reason: null, absence_note: null, ...o,
})

beforeEach(() => { markAttendance.mockReset(); sessions = []; fel = null })

describe('DagensPass (F9) — dagens pass överst i Min dag', () => {
  it('tomt underlag är en invit, inte en nolla', async () => {
    render(<MemoryRouter><DagensPass namnFor={() => 'Dana'} /></MemoryRouter>)
    expect(await screen.findByText(/Inga pass i dag/)).toBeTruthy()
    expect(screen.queryByText('0')).toBeNull()
  })

  it('felläge säger att hämtningen misslyckades och erbjuder ett nytt försök', async () => {
    fel = { message: 'nej' }
    render(<MemoryRouter><DagensPass namnFor={() => 'Dana'} /></MemoryRouter>)
    expect(await screen.findByRole('alert')).toHaveTextContent(/kunde inte hämtas/)
    expect(screen.getByRole('button', { name: /Försök igen/ })).toBeTruthy()
  })

  it('ett ensamt pass markeras i raden: förslag i ord, inget förval, sparas efter konsulentens klick', async () => {
    sessions = [
      pass({ id: 's1', participant_id: 'p1', title: 'Verkstad' }),
      pass({ id: 's2', participant_id: 'p2', title: 'Samtal', start_time: '10:00:00', absence_reason: 'sick', absence_note: 'feber' }),
      pass({ id: 's3', participant_id: 'p3', title: 'Praktik', start_time: '11:00:00', self_checkin_at: new Date().toISOString() }),
    ]
    markAttendance.mockImplementation(async (id: string, input: { attendance: string | null }) => ({ id, attendance: input.attendance }))
    const namn: Record<string, string> = { p1: 'Dana', p2: 'Omar', p3: 'Lisa' }
    render(<MemoryRouter><DagensPass namnFor={(id) => namn[id]} /></MemoryRouter>)

    expect(await screen.findByText('Dana')).toBeTruthy()
    expect(screen.getByText('Anmälde frånvaro: sjuk — „feber”')).toBeTruthy()
    expect(screen.getByText(/^Checkade in själv \d{2}:\d{2}$/)).toBeTruthy()
    expect(screen.getByText(/Förslag: Sjuk · inte sparat än/)).toBeTruthy()
    expect(screen.getByText(/09:00–23:59 · Verkstad/)).toBeTruthy()
    expect(markAttendance).not.toHaveBeenCalled()

    const grupp = screen.getByRole('radiogroup', { name: 'Närvaro för Dana' })
    fireEvent.click(within(grupp).getByRole('radio', { name: /Här/ }))
    await waitFor(() => expect(markAttendance).toHaveBeenCalledWith('s1', { attendance: 'present' }))
    const rad = screen.getByText('Dana').closest('[data-testid="narvaro-rad"]') as HTMLElement
    await waitFor(() => expect(rad.querySelector('[data-status="narvarande"]')).not.toBeNull())
    expect(within(rad).getByRole('button', { name: 'Ångra: Dana' })).toBeTruthy()
  })
})
