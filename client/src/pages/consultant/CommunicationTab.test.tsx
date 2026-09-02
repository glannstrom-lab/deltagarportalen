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
  return render(
    <MemoryRouter>
      <I18nextProvider i18n={i18n}>
        <CommunicationTab />
      </I18nextProvider>
    </MemoryRouter>
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
