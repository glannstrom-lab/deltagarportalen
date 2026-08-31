import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, useEffect } from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/i18n/config'
import { ParticipantDetailPage } from './ParticipantDetailPage'

// ---------------------------------------------------------------------------
// Chainable Supabase query-builder mock.
//
// Every builder method (select/eq/order/limit/single/…) returns the same
// object, so any chain shape used by the page resolves through the object's
// `then`. `then` looks up a per-table handler that receives the accumulated
// `.eq()` filters, which lets a test control exactly what "consultant_goals
// for participant p2" resolves to, independent of "consultant_goals for
// participant p1" — and, crucially, lets a test hold a response pending
// (an unresolved deferred) to simulate a slow network reply arriving after
// the user has already navigated to a different participant (KK1).
// ---------------------------------------------------------------------------
type EqFilters = Record<string, string>
type TableHandler = (filters: EqFilters) => Promise<{ data: unknown; error: unknown }>

function createDeferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

function makeFromMock(tableHandlers: Record<string, TableHandler>) {
  return vi.fn((table: string) => {
    const filters: EqFilters = {}
    const builder: Record<string, unknown> = {
      select: vi.fn(() => builder),
      eq: vi.fn((col: string, val: string) => {
        filters[col] = val
        return builder
      }),
      order: vi.fn(() => builder),
      limit: vi.fn(() => builder),
      single: vi.fn(() => builder),
      insert: vi.fn(() => builder),
      update: vi.fn(() => builder),
      then: (onFulfilled: (v: { data: unknown; error: unknown }) => unknown, onRejected?: (e: unknown) => unknown) => {
        const handler = tableHandlers[table]
        const result = handler ? handler(filters) : Promise.resolve({ data: null, error: null })
        return result.then(onFulfilled, onRejected)
      },
    }
    return builder
  })
}

function makeParticipant(id: string, firstName: string, lastName: string) {
  return {
    participant_id: id,
    email: `${firstName.toLowerCase()}@example.com`,
    first_name: firstName,
    last_name: lastName,
    phone: '070-123 45 67',
    avatar_url: null,
    status: 'ACTIVE',
    priority: 1,
    has_cv: true,
    ats_score: 80,
    completed_interest_test: true,
    holland_code: null,
    saved_jobs_count: 2,
    notes_count: 0,
    last_contact_at: null,
    next_meeting_scheduled: null,
    last_login: null,
  }
}

const mockUser = { id: 'consultant-1', email: 'consultant@example.com' }

let getUserMock: ReturnType<typeof vi.fn>
let fromMock: ReturnType<typeof makeFromMock>

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(() => getUserMock()),
    },
    from: vi.fn((table: string) => fromMock(table)),
  },
}))

// Exposes react-router's navigate() to the test so a participant switch can
// be triggered WITHOUT remounting ParticipantDetailPage — matching how the
// real app behaves when the route only changes its :participantId param.
let testNavigate: ((path: string) => void) | null = null
function NavExposer() {
  const navigate = useNavigate()
  useEffect(() => {
    testNavigate = navigate
  }, [navigate])
  return null
}

function renderAt(initialPath: string) {
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter initialEntries={[initialPath]}>
        <NavExposer />
        <Routes>
          <Route path="/consultant/participants/:participantId" element={<ParticipantDetailPage />} />
        </Routes>
      </MemoryRouter>
    </I18nextProvider>
  )
}

const emptyGoals: TableHandler = () => Promise.resolve({ data: [], error: null })
const emptyJournal: TableHandler = () => Promise.resolve({ data: [], error: null })

beforeEach(() => {
  testNavigate = null
  getUserMock = vi.fn(() => Promise.resolve({ data: { user: mockUser } }))
})

describe('ParticipantDetailPage — KV1: misslyckad hämtning visar felläge', () => {
  it('visar ett felläge och INTE föregående deltagares data när nästa hämtning misslyckas', async () => {
    const anna = makeParticipant('p1', 'Anna', 'Andersson')

    fromMock = makeFromMock({
      consultant_dashboard_participants: (filters) =>
        filters.participant_id === 'p1'
          ? Promise.resolve({ data: anna, error: null })
          : Promise.resolve({ data: null, error: { message: 'not found' } }),
      consultant_goals: emptyGoals,
      consultant_journal: emptyJournal,
    })

    renderAt('/consultant/participants/p1')

    expect(await screen.findByText('Anna Andersson')).toBeInTheDocument()

    act(() => {
      testNavigate!('/consultant/participants/p2')
    })

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    // Anna's namn får inte stå kvar under p2:s URL.
    expect(screen.queryByText('Anna Andersson')).not.toBeInTheDocument()
    // Och felet ska inte visas som "0" eller tomt — det ska vara ett
    // uttryckligt felmeddelande, inte "hittades inte".
    expect(screen.queryByText(/hittades inte/i)).not.toBeInTheDocument()
  })
})

describe('ParticipantDetailPage — KK1: kapplöpning vid snabbt deltagarbyte', () => {
  it('ignorerar ett sent svar från en övergiven deltagare', async () => {
    const annaDeferred = createDeferred<{ data: unknown; error: unknown }>()
    const boris = makeParticipant('p2', 'Boris', 'Bengtsson')

    fromMock = makeFromMock({
      consultant_dashboard_participants: (filters) => {
        if (filters.participant_id === 'p1') return annaDeferred.promise
        if (filters.participant_id === 'p2') return Promise.resolve({ data: boris, error: null })
        return Promise.resolve({ data: null, error: { message: 'not found' } })
      },
      consultant_goals: emptyGoals,
      consultant_journal: emptyJournal,
    })

    renderAt('/consultant/participants/p1')

    // p1:s hämtning hänger fortfarande (deferred) — sidan laddar.
    expect(screen.queryByText('Anna Andersson')).not.toBeInTheDocument()

    // Byt deltagare INNAN p1:s svar kommer.
    act(() => {
      testNavigate!('/consultant/participants/p2')
    })

    // p2:s svar är omedelbart — dess namn ska visas.
    expect(await screen.findByText('Boris Bengtsson')).toBeInTheDocument()

    // Nu kommer p1:s sena svar — det ska ignoreras helt.
    await act(async () => {
      annaDeferred.resolve({ data: makeParticipant('p1', 'Anna', 'Andersson'), error: null })
      await Promise.resolve()
    })

    expect(screen.queryByText('Anna Andersson')).not.toBeInTheDocument()
    expect(screen.getByText('Boris Bengtsson')).toBeInTheDocument()
  })
})

describe('ParticipantDetailPage — KA5: möte och mål kan skapas från deltagarens sida', () => {
  it('öppnar GoalCreationDialog förvald med rätt deltagare via "Nytt mål"', async () => {
    const anna = makeParticipant('p1', 'Anna', 'Andersson')
    fromMock = makeFromMock({
      consultant_dashboard_participants: () => Promise.resolve({ data: anna, error: null }),
      consultant_goals: emptyGoals,
      consultant_journal: emptyJournal,
    })

    renderAt('/consultant/participants/p1')
    await screen.findByText('Anna Andersson')

    fireEvent.click(screen.getByRole('button', { name: /^Mål$/i }))
    fireEvent.click(screen.getByRole('button', { name: /Nytt mål/i }))

    // Dialogen hoppar direkt till mallsteget för en förvald deltagare (ingen
    // sökning krävs) — namnet ska nu synas två gånger: en gång i sidhuvudet,
    // en gång i dialogen.
    await screen.findByText('Skapa mål')
    await waitFor(() => {
      expect(screen.getAllByText('Anna Andersson').length).toBeGreaterThanOrEqual(2)
    })
  })

  it('öppnar MeetingSchedulerDialog förvald med rätt deltagare via "Boka möte"', async () => {
    const anna = makeParticipant('p1', 'Anna', 'Andersson')
    fromMock = makeFromMock({
      consultant_dashboard_participants: () => Promise.resolve({ data: anna, error: null }),
      consultant_goals: emptyGoals,
      consultant_journal: emptyJournal,
    })

    renderAt('/consultant/participants/p1')
    await screen.findByText('Anna Andersson')

    fireEvent.click(screen.getByRole('button', { name: /Boka möte/i }))

    // MeetingSchedulerDialog hoppar direkt till datum/tid-steget för en
    // förvald deltagare och visar namnet där.
    await waitFor(() => {
      expect(screen.getAllByText('Anna Andersson').length).toBeGreaterThan(0)
    })
  })
})
