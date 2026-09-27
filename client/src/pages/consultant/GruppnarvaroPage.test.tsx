/**
 * GruppnarvaroPage — närvaro för ett helt pass på en skärm (RK36).
 *
 * Motprov (körda): (1) låt massknappen ta alla pass (ta bort filtret
 * kanMarkerasNarvarandeIMassa) → testet med anmäld frånvaro faller. (2) svälj
 * felet i allaNarvarande → testet "namnger den som inte gick att spara" faller.
 * (3) hämta dagens pass i stället för `datum` → datumtestet faller.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { PassIdag } from '@/lib/dagensPass'

const m = vi.hoisted(() => ({ hamta: vi.fn(), markera: vi.fn(), deltagare: vi.fn() }))

vi.mock('@/lib/dagensPass', async () => {
  const faktisk = await vi.importActual<typeof import('@/lib/dagensPass')>('@/lib/dagensPass')
  return { ...faktisk, hamtaDagensPass: m.hamta }
})
vi.mock('@/services/aktivitetApi', async () => {
  const faktisk = await vi.importActual<typeof import('@/services/aktivitetApi')>('@/services/aktivitetApi')
  return { ...faktisk, aktivitetsplanApi: { ...faktisk.aktivitetsplanApi, markAttendance: m.markera } }
})
vi.mock('./consultantParticipantsQuery', () => ({ fetchCachedConsultantParticipants: m.deltagare }))

import { GruppnarvaroPage } from './GruppnarvaroPage'

const pass = (o: Partial<PassIdag>): PassIdag => ({
  id: 's', participant_id: 'anna', plan_id: 'p', date: '2026-09-28', start_time: '09:00:00', end_time: '12:00:00',
  title: 'Jobbsökarverkstad', attendance: null, self_checkin_at: null, ...o,
})

const PASS = [
  pass({ id: 'a', participant_id: 'anna' }),
  pass({ id: 'l', participant_id: 'lisa' }),
  pass({ id: 'o', participant_id: 'omar', absence_reason: 'child_care', absence_note: 'Förskolan stängd' }),
  pass({ id: 'e', participant_id: 'erik', attendance: 'present' }),
  pass({ id: 'x', participant_id: 'anna', title: 'Motivationsgrupp', start_time: '13:00:00', end_time: '15:00:00' }),
]

function rita(url: string) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[url]}>
        <Routes>
          <Route path="/consultant/pass/grupp" element={<GruppnarvaroPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

const GRUPP = '/consultant/pass/grupp?datum=2026-09-28&start=09%3A00&slut=12%3A00&titel=Jobbs%C3%B6karverkstad'

beforeEach(() => {
  vi.clearAllMocks()
  m.hamta.mockResolvedValue(PASS)
  m.deltagare.mockResolvedValue([
    { participant_id: 'anna', first_name: 'Anna', last_name: 'Exempel' },
    { participant_id: 'lisa', first_name: 'Lisa', last_name: 'Fiktiv' },
    { participant_id: 'omar', first_name: 'Omar', last_name: 'Demo' },
    { participant_id: 'erik', first_name: 'Erik', last_name: 'Testsson' },
  ])
  m.markera.mockImplementation(async (id: string, input: { attendance: string | null }) => ({ id, attendance: input.attendance }))
})
afterEach(() => cleanup())

describe('Gruppnärvaro', () => {
  it('hämtar passen för datumet i adressen och visar hela passet', async () => {
    rita(GRUPP)
    expect(await screen.findByRole('heading', { name: 'Jobbsökarverkstad' })).toBeInTheDocument()
    expect(m.hamta).toHaveBeenCalledWith('2026-09-28')
    expect(screen.getByText(/28 september 2026 · 09:00–12:00 · 4 deltagare/)).toBeInTheDocument()
    expect(screen.queryByText('Motivationsgrupp')).not.toBeInTheDocument()
  })

  it('"alla omarkerade" markerar bara de omarkerade — inte den som anmält frånvaro', async () => {
    rita(GRUPP)
    const knapp = await screen.findByRole('button', { name: 'Markera alla omarkerade som närvarande (2)' })
    fireEvent.click(knapp)
    await waitFor(() => expect(m.markera).toHaveBeenCalledTimes(2))
    expect(m.markera).toHaveBeenCalledWith('a', { attendance: 'present' })
    expect(m.markera).toHaveBeenCalledWith('l', { attendance: 'present' })
    expect(await screen.findByRole('status')).toHaveTextContent('2 deltagare markerade som närvarande.')
    // Omars anmälan står kvar att bedöma, med knapparna
    expect(screen.getByText(/Anmäld frånvaro: vård av barn/)).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Närvaro för Omar Demo' })).toBeInTheDocument()
  })

  it('namnger den som inte gick att spara, och fortsätter med resten', async () => {
    m.markera.mockImplementation(async (id: string, input: { attendance: string | null }) => {
      if (id === 'a') throw new Error('nekad')
      return { id, attendance: input.attendance }
    })
    rita(GRUPP)
    fireEvent.click(await screen.findByRole('button', { name: /Markera alla omarkerade/ }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Kunde inte spara för Anna Exempel')
    expect(screen.getByRole('status')).toHaveTextContent('1 deltagare markerad som närvarande.')
  })

  it('en enskild markering kan ångras på samma skärm; ett redan markerat pass har inga knappar här', async () => {
    rita(GRUPP)
    const lisa = await screen.findByRole('group', { name: 'Närvaro för Lisa Fiktiv' })
    fireEvent.click(within(lisa).getByRole('button', { name: 'Frånvaro, ogiltig' }))
    await waitFor(() => expect(m.markera).toHaveBeenCalledWith('l', { attendance: 'absent_invalid' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Ångra markeringen för Lisa Fiktiv' }))
    await waitFor(() => expect(m.markera).toHaveBeenLastCalledWith('l', { attendance: null }))
    expect(screen.queryByRole('group', { name: 'Närvaro för Erik Testsson' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Ångra markeringen för Erik Testsson' })).not.toBeInTheDocument()
  })

  it('utan valt pass listas dagens pass att välja bland', async () => {
    rita('/consultant/pass/grupp?datum=2026-09-28')
    const lank = await screen.findByRole('link', { name: /Jobbsökarverkstad/ })
    expect(lank).toHaveTextContent('09:00–12:00 · 4 deltagare')
    expect(screen.getByRole('link', { name: /Motivationsgrupp/ })).toBeInTheDocument()
  })

  it('ett fel vid hämtning är ett eget läge med "Försök igen"', async () => {
    m.hamta.mockRejectedValueOnce(new Error('timeout'))
    rita(GRUPP)
    expect(await screen.findByText('Passen kunde inte hämtas')).toBeInTheDocument()
  })
})
