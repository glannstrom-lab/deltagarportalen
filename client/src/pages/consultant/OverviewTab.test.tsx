/**
 * Tester för OverviewTab — Min dag som en vy (omtaget "Kvarter", steg 3, 2026-10-11).
 *
 * KS7: ett misslyckat anrop ska ge ett synligt felläge med "Försök igen" —
 * INTE samma skärm som en konsulent utan deltagare.
 *
 * Nyckeltalen (KV5, KV6-S, RK6, RK23/24/26, målöversikten) flyttade till
 * Rapporter — deras tester står i OversiktSiffror.test.tsx.
 *
 * Testerna hittar element på roll och testid, inte på löptext där det går.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import i18n from '@/i18n/config'
import { OverviewTab } from './OverviewTab'

// ---------------------------------------------------------------------------
// Generisk chainable Supabase-mock. Varje tabell svarar med ett kanoniskt
// resultat oavsett vilken kedja av .select/.eq/.gte/.lte/.order/.limit/.in/.or
// som körs — det räcker för att styra vad OverviewTab bygger sina KPI:er av,
// och `consultant_dashboard_participants` är den enda tabell vars `error`
// koden faktiskt kontrollerar (`if (participantsError) throw`).
// ---------------------------------------------------------------------------
type TableResponse = { data: unknown; error: unknown }

function makeBuilder(response: TableResponse) {
  const builder: Record<string, unknown> = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    gte: vi.fn(() => builder),
    lte: vi.fn(() => builder),
    order: vi.fn(() => builder),
    limit: vi.fn(() => builder),
    in: vi.fn(() => builder),
    or: vi.fn(() => builder),
    then: (onFulfilled: (v: TableResponse) => unknown, onRejected?: (e: unknown) => unknown) =>
      Promise.resolve(response).then(onFulfilled, onRejected),
  }
  return builder
}

let tableResponses: Record<string, TableResponse>
let fromCallCount: Record<string, number>
/** RK6: varje frågebyggare per tabell, så testet kan läsa vilka gränser som skickades. */
const byggare: Record<string, Array<Record<string, ReturnType<typeof vi.fn>>>> = {}

const mockUser = { id: 'consultant-1', email: 'consultant@example.com' }

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(() => Promise.resolve({ data: { user: mockUser } })),
    },
    from: vi.fn((table: string) => {
      fromCallCount[table] = (fromCallCount[table] || 0) + 1
      const b = makeBuilder(tableResponses[table] ?? { data: [], error: null })
      ;(byggare[table] ??= []).push(b as Record<string, ReturnType<typeof vi.fn>>)
      return b
    }),
  },
}))

function makeParticipant(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    participant_id: 'p1',
    email: 'anna@example.com',
    first_name: 'Anna',
    last_name: 'Andersson',
    status: 'ACTIVE',
    has_cv: true,
    ats_score: null,
    last_contact_at: null,
    last_login: null,
    saved_jobs_count: 0,
    ...overrides,
  }
}

function renderTab() {
  // KK4: OverviewTab läser deltagarlistan via den delade cachen
  // (fetchCachedConsultantParticipants) — en egen QueryClient per render
  // håller testerna isolerade (samma mönster som PlatserTab.test.tsx).
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <I18nextProvider i18n={i18n}>
          <OverviewTab />
        </I18nextProvider>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

beforeEach(() => {
  fromCallCount = {}
  tableResponses = {
    consultant_dashboard_participants: { data: [], error: null },
    consultant_meetings: { data: [], error: null },
    consultant_messages: { data: [], error: null },
    consultant_goals: { data: [], error: null },
    consultant_journal: { data: [], error: null },
  }
})

describe('OverviewTab — KS7: felläge skilt från "inga deltagare"', () => {
  it('visar ett eget felläge med orsak och "Försök igen" när hämtningen misslyckas', async () => {
    tableResponses.consultant_dashboard_participants = { data: null, error: { message: 'network down' } }
    renderTab()

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(/kunde inte hämtas/i)
    // Fel ska INTE se ut som en dag: Min dag finns inte i DOM:en samtidigt.
    expect(screen.queryByTestId('min-dag')).not.toBeInTheDocument()

    const retryButton = screen.getByRole('button', { name: /försök igen/i })
    expect(fromCallCount.consultant_dashboard_participants).toBe(1)
    tableResponses.consultant_dashboard_participants = { data: [], error: null }
    fireEvent.click(retryButton)
    await waitFor(() => expect(fromCallCount.consultant_dashboard_participants).toBe(2))
    await waitFor(() => expect(screen.queryByText('Översikten kunde inte hämtas')).not.toBeInTheDocument())
    expect(await screen.findByTestId('min-dag')).toBeInTheDocument()
  })
})

describe('OverviewTab — Min dag: ett hämtfel är inte "allt klart"', () => {
  // Före 2026-09-22 kväll kontrollerades bara deltagarvyns `error`. Föll
  // mötes- eller målfrågan blev `data` null → [] → en tom dag till en
  // konsulent som kanske hade tre möten. Mutation: ta bort
  // `if (meetingsError) throw meetingsError` → testet faller.
  for (const tabell of ['consultant_meetings', 'consultant_goals']) {
    it(`fel i ${tabell} ger felläget, inte en tom dag`, async () => {
      tableResponses.consultant_dashboard_participants = { data: [makeParticipant()], error: null }
      tableResponses[tabell] = { data: null, error: { message: 'timeout' } }
      renderTab()
      const alert = await screen.findByRole('alert')
      expect(alert).toHaveTextContent(/kunde inte hämtas/i)
      expect(screen.queryByTestId('mindag-tomt')).not.toBeInTheDocument()
    })
  }
})

/**
 * RR3/RK7/RK35 (rollspelet 2026-09-27) i den nya formen: det brådskande står
 * som ett nästa steg och en rad per person. Ogiltig frånvaro UTAN anteckning
 * är dagens viktigaste sak och blir nästa steg; mötet över gränsen blir en rad.
 * Motprov: skicka tomma brådskande-punkter till minDagPersoner → testet faller.
 */
describe('OverviewTab — det brådskande blir nästa steg och en rad per person', () => {
  const lokal = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

  it('ogiltig frånvaro utan anteckning blir nästa steg; möte över gränsen blir Jonas rad', async () => {
    const nu = new Date()
    const for33 = new Date(nu.getFullYear(), nu.getMonth(), nu.getDate() - 33, 10)
    const igar = new Date(nu.getFullYear(), nu.getMonth(), nu.getDate() - 1)
    tableResponses.consultant_dashboard_participants = {
      data: [
        makeParticipant({ participant_id: 'jonas', first_name: 'Jonas', last_name: 'Demo', last_contact_at: nu.toISOString() }),
        makeParticipant({ participant_id: 'anna', first_name: 'Anna', last_name: 'Exempel', last_contact_at: nu.toISOString() }),
      ],
      error: null,
    }
    tableResponses.consultant_meetings = {
      data: [
        { participant_id: 'jonas', scheduled_at: for33.toISOString(), meeting_type: 'video', status: 'completed' },
        { participant_id: 'anna', scheduled_at: igar.toISOString(), meeting_type: 'physical', status: 'completed' },
      ],
      error: null,
    }
    tableResponses.activity_sessions = {
      data: [{ id: 's1', plan_id: 'pl', participant_id: 'anna', date: lokal(igar), start_time: '09:00', end_time: '12:00', title: 'Verkstad', activity_type: 'jobsearch', attendance: 'absent_invalid' }],
      error: null,
    }
    tableResponses.activity_plans = { data: [{ id: 'pl', participant_id: 'anna', consultant_id: 'consultant-1', status: 'active', start_date: '2026-09-01', end_date: null }], error: null }
    renderTab()

    const steg = await screen.findByTestId('mindag-nasta-steg')
    expect(steg).toHaveAttribute('data-typ', 'franvaro_utan_anteckning')
    expect(within(steg).getByRole('heading', { level: 2 })).toHaveTextContent('Skriv en rad om Annas frånvaro')
    expect(within(steg).getByText(/Anna Exempel var inte på Verkstad i går/)).toBeInTheDocument()
    const jonas = screen.getByTestId('mindag-person-jonas')
    expect(jonas).toHaveAttribute('data-typ', 'mote_over_gransen')
    expect(within(jonas).getByText('Senaste möte 33 dagar sedan — gränsen är 14')).toBeInTheDocument()
    // Frånvaron står inte en gång till i listan (mockens möten ger Anna en mötesrad, inget annat).
    const anna = screen.queryByTestId('mindag-person-anna')
    if (anna) expect(anna).not.toHaveTextContent(/Var inte på/)
    expect(screen.getByTestId('mindag-antal')).toHaveTextContent(/^\S+ saker i dag\. Det som brådskar står först\./)
  })

  it('RK35: en ogiltig frånvaro MED anteckning står som den korta brådskande-raden', async () => {
    const nu = new Date()
    const igar = new Date(nu.getFullYear(), nu.getMonth(), nu.getDate() - 1)
    tableResponses.consultant_dashboard_participants = {
      data: [makeParticipant({ participant_id: 'anna', first_name: 'Anna', last_name: 'Exempel', last_contact_at: nu.toISOString() })],
      error: null,
    }
    tableResponses.activity_sessions = {
      data: [{ id: 's1', plan_id: 'pl', participant_id: 'anna', date: lokal(igar), start_time: '09:00', end_time: '12:00', title: 'Verkstad', activity_type: 'jobsearch', attendance: 'absent_invalid', attendance_note: 'Kom inte' }],
      error: null,
    }
    renderTab()
    const steg = await screen.findByTestId('mindag-nasta-steg')
    expect(steg).toHaveAttribute('data-typ', 'franvaro')
    expect(within(steg).getByText(/^Ogiltig frånvaro \d+ \w+\./)).toBeInTheDocument()
  })

  it('kan underlaget inte hämtas står det så — inget nästa steg, inget tomläge', async () => {
    tableResponses.consultant_dashboard_participants = { data: [makeParticipant({ last_contact_at: new Date().toISOString() })], error: null }
    tableResponses.activity_sessions = { data: null, error: { message: 'timeout' } }
    renderTab()
    expect(await screen.findByText(/Möten och frånvaro kunde inte hämtas/)).toBeInTheDocument()
    expect(screen.queryByTestId('mindag-nasta-steg')).not.toBeInTheDocument()
    expect(screen.queryByTestId('mindag-tomt')).not.toBeInTheDocument()
  })

  it('när inget väntar visas tomläget med bilden — och bara då', async () => {
    tableResponses.consultant_dashboard_participants = { data: [makeParticipant({ last_contact_at: new Date().toISOString() })], error: null }
    renderTab()
    const tomt = await screen.findByTestId('mindag-tomt')
    expect(tomt.querySelector('img')).toHaveAttribute('src', '/kontor/klart-900.webp')
    expect(screen.queryByTestId('mindag-nasta-steg')).not.toBeInTheDocument()
  })

  it('en ny konsulent utan deltagare får Kom igång i stället för en tom "allt klart"-dag', async () => {
    tableResponses.consultant_dashboard_participants = { data: [], error: null }
    renderTab()
    expect(await screen.findByTestId('mindag-ny')).toBeInTheDocument()
    expect(screen.queryByTestId('mindag-tomt')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Bjud in deltagare' })).toBeInTheDocument()
  })
})

/**
 * RK38 (rollspelet 2026-09-27): en journalanteckning är en kontakt.
 * Motprov (kört): använd `p.last_contact_at` i stället för senasteKontaktAt(p)
 * → testet faller (Anna får en rad "Aldrig kontaktad").
 */
describe('OverviewTab — RK38: en journalanteckning är en kontakt', () => {
  it('den som fått en anteckning i går får ingen kontaktrad', async () => {
    const igar = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    tableResponses.consultant_dashboard_participants = {
      data: [
        makeParticipant({ participant_id: 'anna', first_name: 'Anna', last_name: 'Antecknad', last_contact_at: null, last_note_date: igar }),
        makeParticipant({ participant_id: 'bo', first_name: 'Bo', last_name: 'Bortglömd', last_contact_at: null, last_note_date: null }),
      ],
      error: null,
    }
    renderTab()
    const steg = await screen.findByTestId('mindag-nasta-steg')
    // Bo är den enda punkten → hans kontakt blir nästa steg; Anna syns ingenstans.
    expect(steg).toHaveAttribute('data-typ', 'kontakt')
    expect(steg).toHaveTextContent('Hör av dig till Bo')
    expect(steg).toHaveTextContent('Aldrig kontaktad')
    expect(screen.queryByText(/Antecknad/)).not.toBeInTheDocument()
  })
})

describe('OverviewTab — en vy, en primärknapp', () => {
  it('nästa steg är den enda fyllda knappen', async () => {
    tableResponses.consultant_dashboard_participants = {
      data: [
        makeParticipant({ participant_id: 'a', first_name: 'A', last_contact_at: null }),
        makeParticipant({ participant_id: 'b', first_name: 'B', last_contact_at: null }),
      ],
      error: null,
    }
    renderTab()
    await screen.findByTestId('mindag-nasta-steg')
    expect(document.querySelectorAll('[data-variant="primary"]')).toHaveLength(1)
  })
})
