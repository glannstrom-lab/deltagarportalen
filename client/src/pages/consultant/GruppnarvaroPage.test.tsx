/**
 * GruppnarvaroPage — närvaro för ett helt pass på en skärm (RK36; omtaget steg 4).
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
  pass({ id: 's', participant_id: 'sara', self_checkin_at: '2026-09-28T06:58:00Z' }),
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
    { participant_id: 'sara', first_name: 'Sara', last_name: 'Prov' },
  ])
  m.markera.mockImplementation(async (id: string, input: { attendance: string | null }) => ({ id, attendance: input.attendance }))
})
afterEach(() => cleanup())

describe('Gruppnärvaro', () => {
  it('hämtar passen för datumet i adressen och visar hela passet', async () => {
    rita(GRUPP)
    expect(await screen.findByRole('heading', { name: 'Jobbsökarverkstad' })).toBeInTheDocument()
    expect(m.hamta).toHaveBeenCalledWith('2026-09-28')
    expect(screen.getByText(/Måndag 28 september 2026 · 09:00–12:00 · 5 deltagare/)).toBeInTheDocument()
    expect(screen.queryByText('Motivationsgrupp')).not.toBeInTheDocument()
    expect(screen.getByText('1 av 5 markerade.')).toBeInTheDocument()
  })

  it('incheckning och anmälan blir FÖRSLAG — inget sparas, inget är valt, förrän konsulenten bekräftar', async () => {
    rita(GRUPP)
    const sara = await screen.findByRole('radiogroup', { name: 'Närvaro för Sara Prov' })
    const omar = screen.getByRole('radiogroup', { name: 'Närvaro för Omar Demo' })
    // Förslaget står i ord, men radiogruppen har inget valt — ett förval som ser sparat ut vore en lögn.
    for (const g of [sara, omar]) {
      expect(within(g).getAllByRole('radio').every((r) => r.getAttribute('aria-checked') === 'false')).toBe(true)
    }
    expect(screen.getByText(/Förslag: Här · inte sparat än/)).toBeInTheDocument()
    expect(screen.getByText(/Förslag: Giltig · inte sparat än/)).toBeInTheDocument()
    expect(m.markera).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Bekräfta alla förslag (2)' }))
    await waitFor(() => expect(m.markera).toHaveBeenCalledTimes(2))
    expect(m.markera).toHaveBeenCalledWith('s', { attendance: 'present' })
    expect(m.markera).toHaveBeenCalledWith('o', { attendance: 'absent_valid' })
    expect(await screen.findByRole('status')).toHaveTextContent('2 förslag bekräftade.')
  })

  it('"Markera resten" tar bara de omarkerade utan förslag — aldrig den som anmält frånvaro', async () => {
    m.hamta.mockResolvedValue([...PASS, pass({ id: 'q', participant_id: 'qasim', absence_reason: 'other' })])
    rita(GRUPP)
    const knapp = await screen.findByRole('button', { name: 'Markera resten som närvarande (2)' })
    fireEvent.click(knapp)
    await waitFor(() => expect(m.markera).toHaveBeenCalledTimes(2))
    expect(m.markera).toHaveBeenCalledWith('a', { attendance: 'present' })
    expect(m.markera).toHaveBeenCalledWith('l', { attendance: 'present' })
    expect(m.markera).not.toHaveBeenCalledWith('q', expect.anything())
    expect(await screen.findByRole('status')).toHaveTextContent('2 deltagare markerade som närvarande.')
  })

  it('namnger den som inte gick att spara, och fortsätter med resten', async () => {
    m.markera.mockImplementation(async (id: string, input: { attendance: string | null }) => {
      if (id === 'a') throw new Error('nekad')
      return { id, attendance: input.attendance }
    })
    rita(GRUPP)
    fireEvent.click(await screen.findByRole('button', { name: /Markera resten som närvarande/ }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Kunde inte spara för Anna Exempel')
    expect(screen.getByRole('status')).toHaveTextContent('1 deltagare markerad som närvarande.')
  })

  it('ett val sparas efter en paus; piltangenten passerar "Ogiltig" utan att skriva den', async () => {
    rita(GRUPP)
    const lisa = await screen.findByRole('radiogroup', { name: 'Närvaro för Lisa Fiktiv' })
    fireEvent.click(within(lisa).getByRole('radio', { name: /Här/ }))
    // Här → Giltig → Ogiltig → Sjuk med pilen, snabbt
    fireEvent.keyDown(within(lisa).getByRole('radio', { name: /Här/ }), { key: 'ArrowRight' })
    fireEvent.keyDown(within(lisa).getByRole('radio', { name: /^Giltig/ }), { key: 'ArrowRight' })
    fireEvent.keyDown(within(lisa).getByRole('radio', { name: /Ogiltig/ }), { key: 'ArrowRight' })
    expect(within(lisa).getByRole('radio', { name: /Sjuk/ })).toHaveAttribute('aria-checked', 'true')
    await waitFor(() => expect(m.markera).toHaveBeenCalledTimes(1))
    expect(m.markera).toHaveBeenCalledWith('l', { attendance: 'sick_certified' })
    expect(m.markera).not.toHaveBeenCalledWith('l', { attendance: 'absent_invalid' })
  })

  it('ogiltig fäller ut en rad om vad som hände; Ångra nollställer; ett redan markerat pass ändras inte här', async () => {
    rita(GRUPP)
    const lisa = await screen.findByRole('radiogroup', { name: 'Närvaro för Lisa Fiktiv' })
    fireEvent.click(within(lisa).getByRole('radio', { name: /Ogiltig/ }))
    await waitFor(() => expect(m.markera).toHaveBeenCalledWith('l', { attendance: 'absent_invalid' }))
    expect(await screen.findByLabelText(/Vad hände med Lisa\?/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Ångra: Lisa Fiktiv' }))
    await waitFor(() => expect(m.markera).toHaveBeenLastCalledWith('l', { attendance: null }))

    expect(screen.queryByRole('radiogroup', { name: 'Närvaro för Erik Testsson' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Ångra: Erik Testsson' })).not.toBeInTheDocument()
    const erik = screen.getAllByTestId('narvaro-rad').find((r) => r.getAttribute('data-pass') === 'e') as HTMLElement
    expect(erik).toHaveTextContent('Ändras på deltagarsidan')
    expect(erik.querySelector('[data-status="narvarande"]')).not.toBeNull()
  })

  it('kundtypens ord kommer via props', async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={[GRUPP]}>
          <Routes>
            <Route
              path="/consultant/pass/grupp"
              element={<GruppnarvaroPage alternativ={[
                { varde: 'present', etikett: 'Närvarande', status: 'narvarande' },
                { varde: 'absent_valid', etikett: 'Godtagbar', status: 'giltig' },
              ]} />}
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )
    const anna = await screen.findByRole('radiogroup', { name: 'Närvaro för Anna Exempel' })
    expect(within(anna).getAllByRole('radio').map((r) => r.textContent)).toEqual(['Närvarande', 'Godtagbar'])
    expect(screen.getByText(/Förslag: Godtagbar · inte sparat än/)).toBeInTheDocument()
  })

  it('utan valt pass listas dagens pass att välja bland', async () => {
    rita('/consultant/pass/grupp?datum=2026-09-28')
    const lank = await screen.findByRole('link', { name: /Jobbsökarverkstad/ })
    expect(lank).toHaveTextContent('09:00–12:00 · 5 deltagare')
    expect(lank).toHaveTextContent('1 av 5 markerade')
    expect(lank).toHaveTextContent('2 förslag att bekräfta')
    expect(screen.getByRole('link', { name: /Motivationsgrupp/ })).toBeInTheDocument()
  })

  it('ett fel vid hämtning är ett eget läge med "Försök igen"', async () => {
    m.hamta.mockRejectedValueOnce(new Error('timeout'))
    rita(GRUPP)
    expect(await screen.findByText('Passen kunde inte hämtas')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Försök igen/ }))
    expect(await screen.findByRole('heading', { name: 'Jobbsökarverkstad' })).toBeInTheDocument()
  })
})
