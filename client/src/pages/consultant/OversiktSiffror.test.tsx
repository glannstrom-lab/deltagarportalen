/**
 * OversiktSiffror — nyckeltalen, Målöversikt och Senaste aktivitet under
 * Rapporter (flyttade från Översikt i omtaget "Kvarter", steg 3, 2026-10-11).
 * Testerna följde med från OverviewTab.test.tsx och OverviewTab.rollspel.test.tsx:
 *
 * KV5   ATS-snittet räknas över dem som HAR en poäng; ingen poäng → "—", aldrig 0 %.
 * KV6-S "Profilen ändrades senast", aldrig "Loggade in" (last_login = profiles.updated_at).
 * RK6   veckan är måndag–söndag även på en söndag.
 * RK23  en Oro-anteckning heter "Oro noterad".
 * RK24  målkategorierna räknas med samma regel som Rapporter och PDF:en.
 * RK26  dag + klockslag, och "1 aktiv" / "1 oläst meddelande" i singular.
 * Inga mål → en invit, inte två nollor. Ett läsfel → en rad, aldrig nollor.
 *
 * Motprov (kört): räkna `ats_score ?? 0` över alla → KV5-testet faller (35 %).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import i18n from '@/i18n/config'
import { calculateGoalCategories } from './analytics'

type Svar = { data: unknown; error: unknown }
const tabeller = vi.hoisted(() => ({
  svar: {} as Record<string, { data: unknown; error: unknown }>,
  byggare: {} as Record<string, Array<Record<string, ReturnType<typeof vi.fn>>>>,
}))
function bygg(t: string, svar: Svar) {
  const b: Record<string, unknown> = {}
  for (const m of ['select', 'eq', 'neq', 'gt', 'gte', 'lte', 'lt', 'order', 'limit', 'range', 'in', 'or', 'not', 'is']) b[m] = vi.fn(() => b)
  b.then = (ok: (v: Svar) => unknown, fel?: (e: unknown) => unknown) => Promise.resolve(svar).then(ok, fel)
  ;(tabeller.byggare[t] ??= []).push(b as Record<string, ReturnType<typeof vi.fn>>)
  return b
}

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'k1' } } })) },
    from: vi.fn((t: string) => bygg(t, tabeller.svar[t] ?? { data: [], error: null })),
  },
}))

import { OversiktSiffror } from './OversiktSiffror'

const NU = new Date(2026, 8, 27, 14, 0) // söndag 27 sep 2026

const deltagare = (o: Record<string, unknown> = {}) => ({
  participant_id: 'p1', email: 'a@x.se', first_name: 'Anna', last_name: 'Demo', status: 'ACTIVE',
  has_cv: true, ats_score: 70, last_contact_at: null, last_login: null, saved_jobs_count: 0, ...o,
})

const mal = [
  { id: 'g1', title: 'Gå en utbildning i truck', status: 'ACTIVE', participant_id: 'p1', deadline: null },
  { id: 'g2', title: 'Påbörja utbildning i svenska', status: 'ACTIVE', participant_id: 'p1', deadline: null },
  { id: 'g3', title: 'Skicka ansökningar', status: 'ACTIVE', participant_id: 'p1', deadline: null },
  { id: 'g4', title: 'Söka jobb inom lager', status: 'ACTIVE', participant_id: 'p1', deadline: null },
  { id: 'g5', title: 'Uppdatera CV', status: 'ACTIVE', participant_id: 'p1', deadline: null },
  { id: 'g6', title: 'Ringa kontakt på lagret', status: 'ACTIVE', participant_id: 'p1', deadline: null },
]

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(NU)
  for (const k of Object.keys(tabeller.byggare)) delete tabeller.byggare[k]
  tabeller.svar = {
    consultant_dashboard_participants: { data: [deltagare()], error: null },
    consultant_goals: { data: mal, error: null },
    consultant_messages: { data: [{ id: 'm1' }], error: null },
    consultant_journal: {
      data: [
        { id: 'j1', category: 'CONCERN', participant_id: 'p1', created_at: new Date(2026, 8, 27, 10, 30).toISOString(), profiles: { first_name: 'Anna', last_name: 'Demo' } },
        { id: 'j2', category: 'GENERAL', participant_id: 'p1', created_at: new Date(2026, 8, 22, 9, 15).toISOString(), profiles: { first_name: 'Anna', last_name: 'Demo' } },
      ],
      error: null,
    },
  }
})
afterEach(() => vi.useRealTimers())

function rita() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <I18nextProvider i18n={i18n}>
          <OversiktSiffror />
        </I18nextProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('OversiktSiffror — KV5: snitt ATS-poäng', () => {
  it('räknar snittet över dem som HAR en poäng', async () => {
    tabeller.svar.consultant_dashboard_participants = {
      data: [deltagare({ participant_id: 'a', ats_score: 80 }), deltagare({ participant_id: 'b', ats_score: 60 }), deltagare({ participant_id: 'c', ats_score: null }), deltagare({ participant_id: 'd', ats_score: null })],
      error: null,
    }
    rita()
    await screen.findByText('Snitt ATS-poäng')
    expect(screen.getByText('70%')).toBeInTheDocument()
  })

  it('visar "—" och en förklarande rad — aldrig 0 % — när ingen har en poäng', async () => {
    tabeller.svar.consultant_dashboard_participants = { data: [deltagare({ ats_score: null })], error: null }
    rita()
    await screen.findByText('Snitt ATS-poäng')
    expect(screen.getByText('—')).toBeInTheDocument()
    expect(screen.getByText('Ingen ATS-poäng ännu')).toBeInTheDocument()
    expect(screen.queryByText('0%')).not.toBeInTheDocument()
  })
})

describe('OversiktSiffror — rollspelet 2026-09-27', () => {
  it('RK23: en Oro-anteckning heter "Oro noterad"', async () => {
    rita()
    expect(await screen.findByText('Oro noterad')).toBeInTheDocument()
    expect(screen.queryByText('Fråga uppmärksammad')).not.toBeInTheDocument()
  })

  it('RK26: dag och klockslag; singular för ett', async () => {
    rita()
    await screen.findByText('Oro noterad')
    expect(screen.getByText('i dag 10:30').tagName).toBe('TIME')
    expect(screen.getByText('22 sep 09:15').tagName).toBe('TIME')
    expect(screen.getByText('1 aktiv')).toBeInTheDocument()
    expect(screen.getByText('1 oläst meddelande')).toBeInTheDocument()
  })

  it('RK24: målkategorierna i samma ordning som Rapporter och PDF:en', async () => {
    rita()
    await screen.findByText('Oro noterad')
    const forvantat = calculateGoalCategories(mal).map((c) => c.category)
    const visat = Array.from(screen.getByTestId('malkategorier').children).map((rad) => rad.querySelector('span')?.firstChild?.textContent?.trim())
    expect(visat).toEqual(forvantat)
  })

  it('RK6: veckans möten frågas måndag 21/9–söndag 27/9 när det är söndag 27/9', async () => {
    rita()
    await screen.findByText('Oro noterad')
    const fragan = tabeller.byggare.consultant_meetings.find((b) => b.lte.mock.calls.length > 0)!
    expect(fragan.gte).toHaveBeenCalledWith('scheduled_at', new Date(2026, 8, 21, 0, 0, 0, 0).toISOString())
    expect(fragan.lte).toHaveBeenCalledWith('scheduled_at', new Date(2026, 8, 27, 23, 59, 59, 999).toISOString())
  })
})

describe('OversiktSiffror — tomt och fel', () => {
  it('KV6-S: utan journal visas "Profilen ändrades senast", aldrig "Loggade in"', async () => {
    tabeller.svar.consultant_journal = { data: [], error: null }
    tabeller.svar.consultant_dashboard_participants = { data: [deltagare({ last_login: '2026-08-30T09:00:00.000Z' })], error: null }
    rita()
    expect(await screen.findByText('Profilen ändrades senast')).toBeInTheDocument()
    expect(screen.queryByText('Loggade in')).not.toBeInTheDocument()
  })

  it('inga mål → en invit, inte två nollor', async () => {
    tabeller.svar.consultant_goals = { data: [], error: null }
    rita()
    expect(await screen.findByText(/Inga mål satta än/)).toBeInTheDocument()
  })

  for (const tabell of ['consultant_meetings', 'consultant_goals', 'consultant_messages', 'consultant_journal']) {
    it(`fel i ${tabell} → en rad om felet, inga siffror`, async () => {
      tabeller.svar[tabell] = { data: null, error: { message: 'timeout' } }
      rita()
      expect(await screen.findByRole('alert')).toHaveTextContent('Siffrorna kunde inte hämtas')
      expect(screen.queryByText('Snitt ATS-poäng')).not.toBeInTheDocument()
    })
  }
})
