/**
 * Tester för SettingsTab.
 *
 * KS7: `loadSettings` läste tidigare aldrig ut `error` från
 * `consultant_settings`-frågan — ett trasigt anrop gav `settingsData:
 * undefined`, vilket är EXAKT samma form som "ingen sparad rad ännu", och
 * sidan visade tyst defaultinställningarna som om laddningen lyckats.
 *
 * KV7: notisinställningarna sparas i `consultant_settings.notifications`,
 * men portalen har ingen cron/edge-funktion som läser kolumnen (enda cronen
 * i client/vercel.json är jobbevakningen; ingen träff på "consultant_settings"
 * i supabase/functions). Rutan under rubriken ska säga det rakt ut — samma
 * ärliga märkning som Team-sektionen redan använder ("kommer i en senare
 * version").
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/i18n/config'
import { SettingsTab } from './SettingsTab'

type TableResponse = { data: unknown; error: unknown }

function makeBuilder(response: TableResponse) {
  const builder: Record<string, unknown> = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    maybeSingle: vi.fn(() => Promise.resolve(response)),
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
      return makeBuilder(tableResponses[table] ?? { data: null, error: null })
    }),
  },
}))

function renderTab() {
  return render(
    <MemoryRouter>
      <I18nextProvider i18n={i18n}>
        <SettingsTab />
      </I18nextProvider>
    </MemoryRouter>
  )
}

beforeEach(() => {
  fromCallCount = {}
  tableResponses = {
    consultant_settings: { data: null, error: null },
  }
})

describe('SettingsTab — KS7: felläge skilt från "inställningarna laddade tomma"', () => {
  it('visar ett eget felläge med orsak och "Försök igen" när hämtningen misslyckas', async () => {
    tableResponses.consultant_settings = {
      data: null,
      error: { message: 'network down' },
    }
    renderTab()

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(/kunde inte hämtas/i)

    // Felet får inte se ut som en lyckad laddning med defaultvärden —
    // notisinställningarna (som annars alltid renderas) ska inte synas.
    expect(screen.queryByText('Ny deltagare tilldelad', { exact: false })).not.toBeInTheDocument()

    expect(fromCallCount.consultant_settings).toBe(1)

    tableResponses.consultant_settings = { data: null, error: null }
    fireEvent.click(screen.getByRole('button', { name: /försök igen/i }))

    await waitFor(() => {
      expect(fromCallCount.consultant_settings).toBe(2)
    })
    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })
  })
})

describe('SettingsTab — KV7: notisinställningarna levereras inte än', () => {
  it('märker notisinställningarna som "kommande" — de sparas men skickas inte', async () => {
    renderTab()

    await screen.findByText('Notiser')
    expect(
      screen.getByText(/de här aviseringarna skickas inte ännu/i)
    ).toBeInTheDocument()
  })
})
