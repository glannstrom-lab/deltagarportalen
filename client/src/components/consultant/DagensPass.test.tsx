import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const markAttendance = vi.fn()
let sessions: Array<Record<string, unknown>> = []
let fel: { message: string } | null = null

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => {
      const b: Record<string, unknown> = {}
      b.select = vi.fn(() => b)
      b.eq = vi.fn(() => b)
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

const idag = new Date().toISOString().slice(0, 10)
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

  it('visar status per pass och markerar närvaro via samma API som deltagarsidan', async () => {
    sessions = [
      pass({ id: 's1', participant_id: 'p1' }),
      pass({ id: 's2', participant_id: 'p2', absence_reason: 'sick', absence_note: 'feber' }),
      pass({ id: 's3', participant_id: 'p3', self_checkin_at: new Date().toISOString() }),
    ]
    markAttendance.mockResolvedValue({ ...sessions[0], attendance: 'present' })
    const namn: Record<string, string> = { p1: 'Dana', p2: 'Omar', p3: 'Lisa' }
    render(<MemoryRouter><DagensPass namnFor={(id) => namn[id]} /></MemoryRouter>)

    expect(await screen.findByText('Dana')).toBeTruthy()
    expect(screen.getByText('Anmäld frånvaro: sjuk — „feber”')).toBeTruthy()
    expect(screen.getByText(/^Incheckad \d{2}:\d{2}$/)).toBeTruthy()
    expect(screen.getAllByText('Väntar')).toHaveLength(1)

    const grupp = screen.getByRole('group', { name: 'Närvaro för Dana' })
    fireEvent.click(grupp.querySelector('button') as HTMLButtonElement)
    await waitFor(() => expect(markAttendance).toHaveBeenCalledWith('s1', { attendance: 'present' }))
    // Danas rad visar statusen (knapparna på de andra raderna heter också "Närvarande")
    const rad = screen.getByText('Dana').closest('li') as HTMLElement
    await waitFor(() => expect(within(rad).getByText('Närvarande').tagName).toBe('P'))
    // Markerat pass har inga knappar kvar
    expect(screen.queryByRole('group', { name: 'Närvaro för Dana' })).toBeNull()
  })
})
