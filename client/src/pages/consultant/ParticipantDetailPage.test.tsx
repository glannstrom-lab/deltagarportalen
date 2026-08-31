import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, useEffect } from 'react'
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react'
import { MemoryRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/i18n/config'
import { ConfirmDialogProvider } from '@/components/ui/ConfirmDialog'
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
// KJ1 (2026-08-31): utökad med `CallInfo` så en handler kan se VILKEN
// operation som körs (insert/update/delete har inga .eq()-filter av sig
// själva — journalens insert() bär t.ex. inga filter alls), och läsa
// payloaden som skickades in. Bakåtkompatibelt: en handler som ignorerar den
// andra parametern (som `emptyGoals`/`emptyJournal`) fungerar oförändrat.
type CallInfo = { insert: boolean; update: boolean; delete: boolean; payload: unknown }
type TableHandler = (filters: EqFilters, info: CallInfo) => Promise<{ data: unknown; error: unknown }>

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
    const info: CallInfo = { insert: false, update: false, delete: false, payload: undefined }
    const builder: Record<string, unknown> = {
      select: vi.fn(() => builder),
      eq: vi.fn((col: string, val: string) => {
        filters[col] = val
        return builder
      }),
      order: vi.fn(() => builder),
      limit: vi.fn(() => builder),
      single: vi.fn(() => builder),
      insert: vi.fn((payload: unknown) => {
        info.insert = true
        info.payload = payload
        return builder
      }),
      update: vi.fn((payload: unknown) => {
        info.update = true
        info.payload = payload
        return builder
      }),
      delete: vi.fn(() => {
        info.delete = true
        return builder
      }),
      then: (onFulfilled: (v: { data: unknown; error: unknown }) => unknown, onRejected?: (e: unknown) => unknown) => {
        const handler = tableHandlers[table]
        const result = handler ? handler(filters, info) : Promise.resolve({ data: null, error: null })
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
      {/* ParticipantJournal (KJ1) bekräftar radering via useConfirmDialog. */}
      <ConfirmDialogProvider>
        <MemoryRouter initialEntries={[initialPath]}>
          <NavExposer />
          <Routes>
            <Route path="/consultant/participants/:participantId" element={<ParticipantDetailPage />} />
          </Routes>
        </MemoryRouter>
      </ConfirmDialogProvider>
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

describe('ParticipantDetailPage — journal (KJ1, 2026-08-31): ParticipantJournal ersätter den bara textarean', () => {
  it('sparar en ny anteckning MED VALD KATEGORI (inte hårdkodad GENERAL) och den dyker upp i listan', async () => {
    const anna = makeParticipant('p1', 'Anna', 'Andersson')
    let insertedRow: Record<string, unknown> | null = null

    fromMock = makeFromMock({
      consultant_dashboard_participants: () => Promise.resolve({ data: anna, error: null }),
      consultant_goals: emptyGoals,
      consultant_journal: (_filters, info) => {
        if (info.insert) {
          insertedRow = info.payload as Record<string, unknown>
          return Promise.resolve({
            data: { id: 'new-entry', ...insertedRow, created_at: '2026-08-31T09:00:00.000Z' },
            error: null,
          })
        }
        // Hämtningen (SELECT) — tom lista innan tillägget.
        return Promise.resolve({ data: [], error: null })
      },
    })

    renderAt('/consultant/participants/p1')
    await screen.findByText('Anna Andersson')

    fireEvent.click(screen.getByRole('button', { name: /^Dagbok$/i }))
    fireEvent.click(screen.getByRole('button', { name: /Ny anteckning/i }))
    fireEvent.click(screen.getByRole('radio', { name: /^Oro$/i }))
    fireEvent.change(screen.getByPlaceholderText('Skriv din anteckning här...'), {
      target: { value: 'Verkar nedstämd efter avslaget, bör följas upp.' },
    })
    fireEvent.click(screen.getByRole('button', { name: /^Spara$/i }))

    await screen.findByText('Verkar nedstämd efter avslaget, bör följas upp.')

    expect(insertedRow).not.toBeNull()
    expect(insertedRow).toMatchObject({
      consultant_id: 'consultant-1',
      participant_id: 'p1',
      content: 'Verkar nedstämd efter avslaget, bör följas upp.',
      category: 'CONCERN',
    })
  })

  it('ett nekat INSERT (42501 — konsulenten saknar aktiv relation) visas som ett fel, sväljs inte tyst', async () => {
    const anna = makeParticipant('p1', 'Anna', 'Andersson')

    fromMock = makeFromMock({
      consultant_dashboard_participants: () => Promise.resolve({ data: anna, error: null }),
      consultant_goals: emptyGoals,
      consultant_journal: (_filters, info) => {
        if (info.insert) {
          return Promise.resolve({
            data: null,
            error: { code: '42501', message: 'new row violates row-level security policy' },
          })
        }
        return Promise.resolve({ data: [], error: null })
      },
    })

    renderAt('/consultant/participants/p1')
    await screen.findByText('Anna Andersson')

    fireEvent.click(screen.getByRole('button', { name: /^Dagbok$/i }))
    fireEvent.click(screen.getByRole('button', { name: /Ny anteckning/i }))
    fireEvent.change(screen.getByPlaceholderText('Skriv din anteckning här...'), {
      target: { value: 'Ett kritiskt observandum.' },
    })
    fireEvent.click(screen.getByRole('button', { name: /^Spara$/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/inte längre en aktiv koppling/i)
    // Felet får inte se ut som tom data: texten användaren skrev finns kvar,
    // och den låtsas INTE ha sparats.
    expect(screen.getByPlaceholderText('Skriv din anteckning här...')).toHaveValue('Ett kritiskt observandum.')
    expect(screen.queryByText('Ett kritiskt observandum.', { selector: 'p.whitespace-pre-wrap' })).not.toBeInTheDocument()
  })

  it('ett nekat DELETE (tyst RLS-nollträff — 0 rader påverkade) visas som ett fel, anteckningen försvinner INTE tyst', async () => {
    const anna = makeParticipant('p1', 'Anna', 'Andersson')
    const existingRow = {
      id: 'entry-9',
      content: 'En anteckning som redan fanns.',
      category: 'GENERAL',
      created_at: '2026-08-30T08:00:00.000Z',
    }

    fromMock = makeFromMock({
      consultant_dashboard_participants: () => Promise.resolve({ data: anna, error: null }),
      consultant_goals: emptyGoals,
      consultant_journal: (_filters, info) => {
        if (info.delete) {
          // RLS filtrerade bort raden (t.ex. bruten relation) — Postgrest
          // ger INGET fel här, bara ett tomt data-set.
          return Promise.resolve({ data: [], error: null })
        }
        return Promise.resolve({ data: [existingRow], error: null })
      },
    })

    renderAt('/consultant/participants/p1')
    await screen.findByText('Anna Andersson')

    fireEvent.click(screen.getByRole('button', { name: /^Dagbok$/i }))
    await screen.findByText('En anteckning som redan fanns.')

    fireEvent.click(screen.getByRole('button', { name: /Ta bort anteckningen/i }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: /^Ta bort$/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/inte längre en aktiv koppling/i)
    // Anteckningen ska fortfarande stå kvar — raderingen låtsas inte ha lyckats.
    expect(screen.getByText('En anteckning som redan fanns.')).toBeInTheDocument()
  })

  it('ett fel vid HÄMTNING av journalen visas som fel, inte som tom lista', async () => {
    const anna = makeParticipant('p1', 'Anna', 'Andersson')

    fromMock = makeFromMock({
      consultant_dashboard_participants: () => Promise.resolve({ data: anna, error: null }),
      consultant_goals: emptyGoals,
      consultant_journal: () => Promise.resolve({ data: null, error: { message: 'network error' } }),
    })

    renderAt('/consultant/participants/p1')
    await screen.findByText('Anna Andersson')

    fireEvent.click(screen.getByRole('button', { name: /^Dagbok$/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/kunde inte hämtas/i)
    expect(screen.queryByText(/Här samlas anteckningarna/i)).not.toBeInTheDocument()
  })
})
