/**
 * Översikt — fynden från rollspelet 2026-09-27:
 *
 * RK23 En Oro-anteckning hette "Fråga uppmärksammad" i Senaste aktivitet.
 * RK24 Målöversikten räknade kategorier med egna nyckelord och visade andra
 *      kategorier i en annan ordning än Rapporter och PDF:en ur samma mål.
 * RK26 Senaste aktivitet visade bara klockslaget ("10:30") utan dag, och
 *      "1 aktiva" / "1 olästa meddelanden".
 *
 * Motprov (körda): återställ t('…concernNoted') → RK23 faller; återställ den
 * egna nyckelordsloopen → RK24 faller (Kompetensutveckling saknas); återställ
 * toLocaleTimeString → RK26 faller; återställ t('…activeCount') → "1 aktiv" faller.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import i18n from '@/i18n/config'
import { calculateGoalCategories } from './analytics'

type TableResponse = { data: unknown; error: unknown }
function makeBuilder(response: TableResponse) {
  const builder: Record<string, unknown> = {}
  for (const m of ['select', 'eq', 'neq', 'gt', 'gte', 'lte', 'lt', 'order', 'limit', 'range', 'in', 'or', 'not', 'is']) builder[m] = vi.fn(() => builder)
  builder.then = (ok: (v: TableResponse) => unknown, fel?: (e: unknown) => unknown) => Promise.resolve(response).then(ok, fel)
  return builder
}

const svar = vi.hoisted(() => ({ tabeller: {} as Record<string, { data: unknown; error: unknown }> }))

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'consultant-1' } } })) },
    from: vi.fn((t: string) => makeBuilder(svar.tabeller[t] ?? { data: [], error: null })),
  },
}))
vi.mock('@/components/consultant/DagensPass', () => ({ DagensPass: () => null }))

import { OverviewTab } from './OverviewTab'

const NU = new Date(2026, 8, 27, 14, 0) // sön 27 sep 2026

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
  svar.tabeller = {
    consultant_dashboard_participants: {
      data: [{
        participant_id: 'p1', email: 'a@x.se', first_name: 'Anna', last_name: 'Demo', status: 'ACTIVE',
        has_cv: true, ats_score: 70, last_contact_at: new Date(2026, 8, 26).toISOString(), last_login: null, saved_jobs_count: 0,
      }],
      error: null,
    },
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

function renderTab() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <I18nextProvider i18n={i18n}>
          <OverviewTab />
        </I18nextProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('Översikt — rollspelet 2026-09-27', () => {
  it('RK23: en Oro-anteckning heter "Oro noterad", inte "Fråga uppmärksammad"', async () => {
    renderTab()
    expect(await screen.findByText('Oro noterad')).toBeInTheDocument()
    expect(screen.queryByText('Fråga uppmärksammad')).not.toBeInTheDocument()
  })

  it('RK26: Senaste aktivitet visar dag och klockslag, inte bara klockslag', async () => {
    renderTab()
    await screen.findByText('Oro noterad')
    expect(screen.getByText('i dag 10:30').tagName).toBe('TIME')
    expect(screen.getByText('22 sep 09:15').tagName).toBe('TIME')
  })

  it('RK26: ett av något böjs i singular — "1 aktiv", "1 oläst meddelande"', async () => {
    renderTab()
    expect(await screen.findByText('1 aktiv')).toBeInTheDocument()
    expect(screen.getByText('1 oläst meddelande')).toBeInTheDocument()
    expect(screen.queryByText('1 aktiva')).not.toBeInTheDocument()
  })

  it('RK24: målkategorierna är desamma, i samma ordning, som Rapporter och PDF:en räknar', async () => {
    renderTab()
    await screen.findByText('Oro noterad')
    const forvantat = calculateGoalCategories(mal).map((c) => c.category)
    expect(forvantat[0]).toBe('Jobbansökningar')
    expect(forvantat).toContain('Kompetensutveckling')
    const rubrik = screen.getByText('Vanligaste målkategorierna')
    const lista = rubrik.nextElementSibling as HTMLElement
    const visat = Array.from(lista.children).map((rad) => rad.querySelector('span')?.firstChild?.textContent?.trim())
    expect(visat).toEqual(forvantat)
  })
})
