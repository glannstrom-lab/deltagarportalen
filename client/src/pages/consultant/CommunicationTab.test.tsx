/**
 * Tester för CommunicationTab (KS7).
 *
 * `fetchData` kollade tidigare inte `error` på NÅGON av de tre frågorna
 * (deltagare/meddelanden/möten) — ett trasigt anrop gav bara `data:
 * undefined`, och "if (participantsData)"-grenen hoppades tyst över.
 * Resultatet var identiskt med en riktigt tom inkorg: "Inga meddelanden
 * ännu" + en "Nytt meddelande"-CTA, utan minsta antydan om att något gått
 * fel. Det här testet verifierar att felet nu syns och går att försöka om.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import i18n from '@/i18n/config'
import { CommunicationTab } from './CommunicationTab'

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

// KK3 (2026-09-12): skrivningarna går genom consultantService, inte direkt
// mot tabellerna. Servicen mockas här; supabase-mocken nedan täcker bara läsningar.
// vi.mock hoistas — mockobjekten måste skapas med vi.hoisted för att finnas då.
const { serviceMock, toastMock } = vi.hoisted(() => ({
  serviceMock: {
    sendMessage: vi.fn(async () => undefined),
    sendBulkMessage: vi.fn(async () => undefined),
    markMessagesAsRead: vi.fn(async () => undefined),
    createMeeting: vi.fn(async () => ({})),
    cancelMeeting: vi.fn(async () => undefined),
  },
  toastMock: { error: vi.fn(), success: vi.fn(), info: vi.fn(), warning: vi.fn() },
}))
vi.mock('@/services/consultantService', () => ({ consultantService: serviceMock }))
// Avbokningen går genom portalens dialog (useConfirmDialog), inte native confirm().
// Mockad så testet styr svaret: true = bekräftat, false = "Behåll".
const { confirmMock } = vi.hoisted(() => ({ confirmMock: vi.fn(async () => true) }))
vi.mock('@/components/ui/ConfirmDialog', () => ({ useConfirmDialog: () => ({ confirm: confirmMock }) }))
vi.mock('@/lib/toast', () => ({ notifications: toastMock }))

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(() => Promise.resolve({ data: { user: mockUser } })),
    },
    from: vi.fn((table: string) => {
      fromCallCount[table] = (fromCallCount[table] || 0) + 1
      return makeBuilder(tableResponses[table] ?? { data: [], error: null })
    }),
    // Realtime-kanalen (CommunicationTab.tsx: "Realtime — när någon
    // skickar/uppdaterar...") — bara stubbad så useEffect inte kraschar.
    channel: vi.fn(() => {
      const chan: Record<string, unknown> = {
        on: vi.fn(() => chan),
        subscribe: vi.fn(() => chan),
      }
      return chan
    }),
    removeChannel: vi.fn(),
  },
}))

function renderTab() {
  // KK4: deltagarlistan hämtas via den delade cachen — egen QueryClient per
  // render för testisolering (samma mönster som PlatserTab.test.tsx).
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <I18nextProvider i18n={i18n}>
          <CommunicationTab />
        </I18nextProvider>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

beforeEach(() => {
  fromCallCount = {}
  tableResponses = {
    consultant_dashboard_participants: { data: [], error: null },
    consultant_messages: { data: [], error: null },
    consultant_meetings: { data: [], error: null },
  }
})

describe('CommunicationTab — KS7: felläge skilt från "inga meddelanden ännu"', () => {
  it('visar ett eget felläge med orsak och "Försök igen" när deltagarhämtningen misslyckas', async () => {
    tableResponses.consultant_dashboard_participants = {
      data: null,
      error: { message: 'network down' },
    }
    renderTab()

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(/kunde inte hämtas/i)

    // Fel ska INTE se ut som den tomma inkorgen.
    expect(screen.queryByText('Inga meddelanden')).not.toBeInTheDocument()

    const retryButton = screen.getByRole('button', { name: /försök igen/i })
    expect(fromCallCount.consultant_dashboard_participants).toBe(1)

    tableResponses.consultant_dashboard_participants = { data: [], error: null }
    fireEvent.click(retryButton)

    await waitFor(() => {
      expect(fromCallCount.consultant_dashboard_participants).toBe(2)
    })
    await screen.findByText('Inga meddelanden')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('visar den riktiga tomma inkorgen (inte felläget) när hämtningen lyckas utan resultat', async () => {
    renderTab()

    await screen.findByText('Inga meddelanden')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})

describe('CommunicationTab — KK3: skrivvägarna går genom consultantService', () => {
  const participant = {
    participant_id: 'p1', first_name: 'Dana', last_name: 'Deltagare', email: 'dana@example.com',
    status: 'ACTIVE', last_login: null, next_meeting_scheduled: null, last_contact_at: null,
  }
  const inkommande = {
    id: 'm1', sender_id: 'p1', receiver_id: 'consultant-1', content: 'Hej, när ses vi?',
    is_read: false, created_at: '2026-09-10T10:00:00Z',
  }

  beforeEach(() => {
    Object.values(serviceMock).forEach((fn) => fn.mockClear())
    toastMock.error.mockClear()
    tableResponses.consultant_dashboard_participants = { data: [participant], error: null }
    tableResponses.consultant_messages = { data: [inkommande], error: null }
  })

  it('markerar olästa inkommande som lästa via servicen när tråden öppnas', async () => {
    renderTab()
    await waitFor(() => expect(serviceMock.markMessagesAsRead).toHaveBeenCalledWith(['m1']))
    expect(fromCallCount.consultant_messages).toBeGreaterThan(0)
  })

  it('skickar ett svar via consultantService.sendMessage (inte via supabase.insert)', async () => {
    renderTab()
    const ruta = await screen.findByPlaceholderText(/Skriv ditt svar/)
    fireEvent.change(ruta, { target: { value: 'Torsdag kl 10 passar.' } })
    fireEvent.keyDown(ruta, { key: 'Enter', ctrlKey: true })
    await waitFor(() => expect(serviceMock.sendMessage).toHaveBeenCalledWith('p1', 'Torsdag kl 10 passar.'))
    expect(toastMock.error).not.toHaveBeenCalled()
  })

  it('visar ett fel när servicen kastar — svaret sväljs inte', async () => {
    serviceMock.sendMessage.mockRejectedValueOnce(new Error('RLS says no'))
    renderTab()
    const ruta = await screen.findByPlaceholderText(/Skriv ditt svar/)
    fireEvent.change(ruta, { target: { value: 'Hej' } })
    fireEvent.keyDown(ruta, { key: 'Enter', ctrlKey: true })
    await waitFor(() => expect(toastMock.error).toHaveBeenCalledWith(expect.stringMatching(/kunde inte skickas/i)))
  })
})

describe('CommunicationTab — avbokning går genom portalens bekräftelsedialog', () => {
  const participant = {
    participant_id: 'p1', first_name: 'Dana', last_name: 'Deltagare', email: 'dana@example.com',
    status: 'ACTIVE', last_login: null, next_meeting_scheduled: null, last_contact_at: null,
  }
  const omTvaDagar = () => { const d = new Date(); d.setDate(d.getDate() + 2); d.setHours(10, 0, 0, 0); return d.toISOString() }
  const mote = {
    id: 'mote-1', consultant_id: 'consultant-1', participant_id: 'p1', scheduled_at: omTvaDagar(),
    duration_minutes: 30, meeting_type: 'video', status: 'scheduled', location: null, meeting_link: null, notes: null,
  }

  beforeEach(() => {
    Object.values(serviceMock).forEach((fn) => fn.mockClear())
    confirmMock.mockReset()
    tableResponses.consultant_dashboard_participants = { data: [participant], error: null }
    tableResponses.consultant_meetings = { data: [mote], error: null }
  })

  async function oppnaMotenOchKlickaAvboka() {
    renderTab()
    fireEvent.click(await screen.findByRole('button', { name: /Möten/ }))
    fireEvent.click(await screen.findByRole('button', { name: /Avboka mötet med Dana Deltagare/ }))
  }

  it('bekräftat i dialogen → consultantService.cancelMeeting anropas med mötets id', async () => {
    confirmMock.mockResolvedValueOnce(true)
    await oppnaMotenOchKlickaAvboka()
    await waitFor(() => expect(serviceMock.cancelMeeting).toHaveBeenCalledWith('mote-1'))
    expect(confirmMock).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Avboka mötet?',
      confirmText: 'Avboka',
      cancelText: 'Behåll',
      variant: 'warning',
      message: expect.stringContaining('Dana Deltagare'),
    }))
  })

  it('"Behåll" i dialogen → ingen avbokning och mötet står kvar', async () => {
    confirmMock.mockResolvedValueOnce(false)
    await oppnaMotenOchKlickaAvboka()
    await waitFor(() => expect(confirmMock).toHaveBeenCalled())
    expect(serviceMock.cancelMeeting).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: /Avboka mötet med Dana Deltagare/ })).toBeInTheDocument()
  })
})
