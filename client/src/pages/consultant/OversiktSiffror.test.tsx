/**
 * OversiktSiffror — nyckeltalen, Målöversikt och Senaste aktivitet under
 * Rapporter (flyttade från Översikt i omtaget "Kvarter", steg 3, 2026-10-11).
 * Testerna följde med från OverviewTab.test.tsx och OverviewTab.rollspel.test.tsx:
 *
 * KSL14 "Snitt ATS-poäng" ersatt av avtalsläget (leverantör) / planläget (kommun).
 * KV6-S "Profilen ändrades senast", aldrig "Loggade in" (last_login = profiles.updated_at).
 * RK6   veckan är måndag–söndag även på en söndag.
 * RK23  en Oro-anteckning heter "Oro noterad".
 * RK24  målkategorierna räknas med samma regel som Rapporter och PDF:en.
 * RK26  dag + klockslag, och "1 aktiv" / "1 oläst meddelande" i singular.
 * Inga mål → en invit, inte två nollor. Ett läsfel → en rad, aldrig nollor.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import i18n from '@/i18n/config'
import { calculateGoalCategories } from './analytics'

const rg = vi.hoisted(() => ({ varde: 'kommun' as 'kommun' | 'leverantor' | null }))
vi.mock('@/components/consultant/useRegelverk', () => ({ useRegelverk: () => rg.varde }))

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

describe('OversiktSiffror — KSL14: avtalsläget/planläget i stället för snitt ATS', () => {
  const plan = (o: Record<string, unknown> = {}) => ({
    id: 'pl1', participant_id: 'p1', consultant_id: 'k1', org_id: null, status: 'active', start_date: '2026-08-01', end_date: null,
    weekly_hours_target: 1, ...o,
  })

  it('"Snitt ATS-poäng" finns inte längre', async () => {
    rg.varde = 'kommun'
    rita()
    await screen.findByText('Planläget')
    expect(screen.queryByText('Snitt ATS-poäng')).not.toBeInTheDocument()
  })

  it('kommun: planläget räknar aktiva deltagare med en aktiv plan', async () => {
    rg.varde = 'kommun'
    tabeller.svar.consultant_dashboard_participants = {
      data: [deltagare({ participant_id: 'p1' }), deltagare({ participant_id: 'p2' }), deltagare({ participant_id: 'p3', status: 'INACTIVE' })],
      error: null,
    }
    tabeller.svar.activity_plans = { data: [plan(), plan({ id: 'x', participant_id: 'p3' }), plan({ id: 'y', participant_id: 'p2', consultant_id: 'kollega' })], error: null }
    rita()
    expect(await screen.findByText('1 av 2')).toBeInTheDocument()
    expect(screen.getByText('aktiva deltagare har en aktivitetsplan')).toBeInTheDocument()
  })

  it('leverantör: avtalsläget är hur många planer som nådde timkravet förra veckan', async () => {
    rg.varde = 'leverantor'
    tabeller.svar.activity_plans = { data: [plan()], error: null }
    // Ingen närvaro förra veckan mot kravet → under timkravet.
    tabeller.svar.activity_sessions = { data: [], error: null }
    rita()
    expect(await screen.findByText('Avtalsläget')).toBeInTheDocument()
    expect(await screen.findByText('0 av 1')).toBeInTheDocument()
    expect(screen.queryByText('Planläget')).not.toBeInTheDocument()
  })

  it('leverantör utan en enda bedömd vecka: "—" och en rad om varför, aldrig 0', async () => {
    rg.varde = 'leverantor'
    tabeller.svar.activity_plans = { data: [], error: null }
    rita()
    expect(await screen.findByText('Ingen avslutad vecka att bedöma')).toBeInTheDocument()
  })

  it('kundtypen laddar: inget kundtypsspecifikt kort', async () => {
    rg.varde = null
    rita()
    expect(await screen.findByText('Hämtar kundtypen')).toBeInTheDocument()
    expect(screen.queryByText('Planläget')).not.toBeInTheDocument()
    expect(screen.queryByText('Avtalsläget')).not.toBeInTheDocument()
  })

  it('kunde inte planerna hämtas: "—" och en rad om felet, resten av siffrorna står kvar', async () => {
    rg.varde = 'kommun'
    tabeller.svar.activity_plans = { data: null, error: { message: 'timeout' } }
    rita()
    expect(await screen.findByText('Planerna kunde inte hämtas')).toBeInTheDocument()
    expect(screen.getByText('Oro noterad')).toBeInTheDocument()
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
      expect(screen.queryByText('Planläget')).not.toBeInTheDocument()
    })
  }
})
