/**
 * Tester för OverviewTab.
 *
 * KS7: ett misslyckat anrop mot consultant_dashboard_participants ska ge ett
 * synligt felläge med "Försök igen" — INTE samma skärm som en konsulent utan
 * deltagare (KPI-korten skulle annars visa 0/0/0/0, identiskt med ett fel).
 *
 * KV5: "CV-kvalitet"-kortet delade ord med AnalyticsTab men mätte något helt
 * annat (snitt ATS-poäng, med null räknat som 0). Här verifieras att kortet
 * nu heter något som beskriver vad det mäter, och att null INTE räknas som 0.
 *
 * KV6-S: aktivitetsflödets "Loggade in"-rad byggs av `last_login`, som i
 * verkligheten är `profiles.updated_at` (vyns alias) — inte en inloggning.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
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

const mockUser = { id: 'consultant-1', email: 'consultant@example.com' }

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(() => Promise.resolve({ data: { user: mockUser } })),
    },
    from: vi.fn((table: string) => {
      fromCallCount[table] = (fromCallCount[table] || 0) + 1
      return makeBuilder(tableResponses[table] ?? { data: [], error: null })
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
  return render(
    <MemoryRouter>
      <I18nextProvider i18n={i18n}>
        <OverviewTab />
      </I18nextProvider>
    </MemoryRouter>
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
    tableResponses.consultant_dashboard_participants = {
      data: null,
      error: { message: 'network down' },
    }
    renderTab()

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(/kunde inte hämtas/i)

    // Fel ska INTE se ut som "allt klart, noll deltagare" — KPI-rutnätet
    // (t.ex. "Behöver kontakt") får inte finnas i DOM:en samtidigt.
    expect(screen.queryByText(/Behöver kontakt/i)).not.toBeInTheDocument()

    const retryButton = screen.getByRole('button', { name: /försök igen/i })
    expect(fromCallCount.consultant_dashboard_participants).toBe(1)

    // Nästa försök lyckas — felläget ska försvinna och KPI-korten visas.
    tableResponses.consultant_dashboard_participants = { data: [], error: null }
    fireEvent.click(retryButton)

    await waitFor(() => {
      expect(fromCallCount.consultant_dashboard_participants).toBe(2)
    })
    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })
  })
})

describe('OverviewTab — KV5: snitt ATS-poäng räknar inte null som 0', () => {
  it('räknar snittet över dem som HAR en poäng, och namnger kortet efter vad det mäter', async () => {
    tableResponses.consultant_dashboard_participants = {
      data: [
        makeParticipant({ participant_id: 'p1', ats_score: 80 }),
        makeParticipant({ participant_id: 'p2', ats_score: 60 }),
        // Två utan poäng — om de räknades som 0 skulle snittet bli 35, inte 70.
        makeParticipant({ participant_id: 'p3', ats_score: null }),
        makeParticipant({ participant_id: 'p4', ats_score: null }),
      ],
      error: null,
    }
    renderTab()

    await screen.findByText('Snitt ATS-poäng')
    expect(screen.getByText('70%')).toBeInTheDocument()
  })

  it('visar "—" och en förklarande rad — aldrig 0% — när ingen deltagare har en poäng', async () => {
    tableResponses.consultant_dashboard_participants = {
      data: [
        makeParticipant({ participant_id: 'p1', ats_score: null }),
        makeParticipant({ participant_id: 'p2', ats_score: null }),
      ],
      error: null,
    }
    renderTab()

    await screen.findByText('Snitt ATS-poäng')
    expect(screen.getByText('—')).toBeInTheDocument()
    expect(screen.getByText('Ingen ATS-poäng ännu')).toBeInTheDocument()
    expect(screen.queryByText('0%')).not.toBeInTheDocument()
  })
})

describe('OverviewTab — KV6-S: "Loggade in" påstod något portalen inte mäter', () => {
  it('visar "Profilen ändrades senast" i stället för "Loggade in"', async () => {
    tableResponses.consultant_dashboard_participants = {
      data: [
        makeParticipant({
          participant_id: 'p1',
          last_login: '2026-08-30T09:00:00.000Z',
        }),
      ],
      error: null,
    }
    // Inga journalanteckningar → aktivitetsflödet faller tillbaka på
    // inloggningsdata (se OverviewTab.tsx: "If no journal entries...").
    // Namnet förekommer flera gånger på sidan (attention-listan, Min dag,
    // aktivitetsflödet) — det är beskrivningstexten under namnet som är
    // det unika här.
    renderTab()

    await screen.findByText('Profilen ändrades senast')
    expect(screen.queryByText('Loggade in')).not.toBeInTheDocument()
  })
})
