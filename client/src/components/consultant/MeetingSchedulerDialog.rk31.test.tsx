/**
 * RK31 (rollspelet 2026-09-27): Boka möte lät konsulenten välja en helgdag
 * utan ett ord och varnade inte när mötet krockade med deltagarens pass.
 * Varningar, inte spärrar — mötet går fortfarande att boka.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getUser: async () => ({ data: { user: { id: 'k1' } } }) },
    from: () => ({ select: () => ({ eq: async () => ({ data: [], error: null }) }), insert: async () => ({ error: null }) }),
  },
}))

const passForDeltagareDag = vi.fn()
vi.mock('@/services/aktivitetApi', () => ({
  aktivitetsplanApi: { passForDeltagareDag: (...a: unknown[]) => passForDeltagareDag(...a) },
}))

import { MeetingSchedulerDialog } from './MeetingSchedulerDialog'

const anna = { participant_id: 'p1', first_name: 'Anna', last_name: 'Andersson', email: 'anna@example.com' }

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 8, 23, 8, 0, 0)) // onsdag 23 sep 2026
  passForDeltagareDag.mockImplementation(async (_id: string, datum: string) =>
    datum === '2026-09-24' ? [{ date: datum, start_time: '09:00', end_time: '12:00', title: 'Jobbsökarverkstad' }] : [])
})
afterEach(() => { cleanup(); vi.clearAllMocks(); vi.useRealTimers() })

describe('RK31 — Boka möte varnar', () => {
  it('för en lördag, men låter den gå att välja', async () => {
    render(<MeetingSchedulerDialog isOpen onClose={vi.fn()} onSuccess={vi.fn()} preselectedParticipant={anna} />)
    expect(screen.queryByTestId('motes-varningar')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: '26' }))
    expect(await screen.findByText(/^Lördag — stämmer dagen\?/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '10:00' }))
    expect(screen.getByRole('button', { name: /Fortsätt/ })).toBeEnabled()
  })

  it('när mötet krockar med deltagarens pass', async () => {
    render(<MeetingSchedulerDialog isOpen onClose={vi.fn()} onSuccess={vi.fn()} preselectedParticipant={anna} />)
    fireEvent.click(screen.getByRole('button', { name: '24' }))
    fireEvent.click(screen.getByRole('button', { name: '10:00' }))
    expect(await screen.findByText('Krockar med deltagarens pass Jobbsökarverkstad 09:00–12:00.')).toBeInTheDocument()
    expect(passForDeltagareDag).toHaveBeenCalledWith('p1', '2026-09-24')
    // En tid efter passet krockar inte.
    fireEvent.click(screen.getByRole('button', { name: '13:00' }))
    expect(screen.queryByText(/Krockar med/)).toBeNull()
  })

  it('säger till när passen inte gick att hämta, i stället för att tiga', async () => {
    passForDeltagareDag.mockRejectedValue(new Error('nätet'))
    render(<MeetingSchedulerDialog isOpen onClose={vi.fn()} onSuccess={vi.fn()} preselectedParticipant={anna} />)
    expect(await screen.findByText(/Deltagarens pass den dagen kunde inte hämtas/)).toBeInTheDocument()
  })
})
