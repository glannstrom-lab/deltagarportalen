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
 *
 * KK5: exportknappen (`handleExportData`) laddade tidigare ner journal, mål,
 * möten, meddelanden och placeringar för HELA historiken, inklusive
 * deltagare som brutit kopplingen till konsulenten — och utan undantag för
 * journalkategorin "Oro". Testerna nedan fångar Blob-innehållet via en
 * mockad `URL.createObjectURL` och verifierar att bara aktiva relationer
 * (en rad i `consultant_participants`) kommer med, och att "Oro" kräver ett
 * aktivt val.
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
    or: vi.fn(() => builder),
    maybeSingle: vi.fn(() => Promise.resolve(response)),
    // Gör kedjan awaitable direkt (`await supabase.from(...).select(...).eq(...)`)
    // — precis som den riktiga PostgrestFilterBuilder-formen. Utan detta
    // resolvar `Promise.all([...])` till builder-objekten själva i stället
    // för `{data, error}`, vilket hade dolt varje bugg i exportens filter.
    then: (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) =>
      Promise.resolve(response).then(resolve, reject),
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

describe('SettingsTab — KK5: exportens omfattning', () => {
  // jsdoms Blob saknar .text() (och URL.createObjectURL finns inte alls) —
  // fånga i stället de råa delarna som skickas till `new Blob([json], ...)`
  // och slå ihop dem själv, i stället för att bero på Blob-implementationen.
  let capturedJson: string | null

  beforeEach(() => {
    capturedJson = null
    const RealBlob = global.Blob
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test-mock av webb-API:t
    ;(global as any).Blob = vi.fn((parts: unknown[], options?: unknown) => {
      capturedJson = (parts as string[]).join('')
      return new RealBlob(parts as BlobPart[], options as BlobPropertyBag)
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test-mock av webb-API:t
    ;(URL as any).createObjectURL = vi.fn(() => 'blob:mock-url')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test-mock av webb-API:t
    ;(URL as any).revokeObjectURL = vi.fn()

    tableResponses.consultant_participants = {
      data: [{ participant_id: 'active-1' }],
      error: null,
    }
    tableResponses.consultant_journal = {
      data: [
        { id: 'j1', participant_id: 'active-1', category: 'GENERAL', content: 'Aktiv, allmän anteckning' },
        { id: 'j2', participant_id: 'active-1', category: 'CONCERN', content: 'Aktiv, orosanteckning' },
        { id: 'j3', participant_id: 'gone-1', category: 'GENERAL', content: 'Avslutad relation' },
      ],
      error: null,
    }
    tableResponses.consultant_goals = {
      data: [
        { id: 'g1', participant_id: 'active-1' },
        { id: 'g2', participant_id: 'gone-1' },
      ],
      error: null,
    }
    tableResponses.consultant_meetings = {
      data: [
        { id: 'm1', participant_id: 'active-1' },
        { id: 'm2', participant_id: 'gone-1' },
      ],
      error: null,
    }
    tableResponses.consultant_messages = {
      data: [
        { id: 'msg1', sender_id: 'consultant-1', receiver_id: 'active-1' },
        { id: 'msg2', sender_id: 'gone-1', receiver_id: 'consultant-1' },
      ],
      error: null,
    }
    tableResponses.consultant_placements = {
      data: [
        { id: 'pl1', participant_id: 'active-1' },
        { id: 'pl2', participant_id: 'gone-1' },
      ],
      error: null,
    }
    tableResponses.consultant_goal_templates = { data: [], error: null }
    tableResponses.consultant_job_collections = { data: [], error: null }
  })

  async function exportAndGetPayload() {
    capturedJson = null
    fireEvent.click(screen.getByRole('button', { name: /exportera all data/i }))
    await waitFor(() => {
      expect(capturedJson).not.toBeNull()
    })
    return JSON.parse(capturedJson!)
  }

  it('utelämnar avslutade relationer ur journal, mål, möten, meddelanden och placeringar', async () => {
    renderTab()
    await screen.findByRole('button', { name: /exportera all data/i })

    const payload = await exportAndGetPayload()

    expect(payload.goals.map((g: { id: string }) => g.id)).toEqual(['g1'])
    expect(payload.meetings.map((m: { id: string }) => m.id)).toEqual(['m1'])
    expect(payload.messages.map((m: { id: string }) => m.id)).toEqual(['msg1'])
    expect(payload.placements.map((p: { id: string }) => p.id)).toEqual(['pl1'])
  })

  it('utelämnar journalkategorin "Oro" som standard, men tar med den när kryssrutan väljs', async () => {
    renderTab()
    await screen.findByRole('button', { name: /exportera all data/i })

    const withoutConcern = await exportAndGetPayload()
    expect(withoutConcern.journal.map((j: { id: string }) => j.id)).toEqual(['j1'])

    fireEvent.click(screen.getByRole('checkbox', { name: /ta med orosanteckningar/i }))
    const withConcern = await exportAndGetPayload()
    // j3 (gone-1) ska ändå vara borta — kryssrutan rör bara kategorin, inte
    // vilka relationer som är aktiva.
    expect(withConcern.journal.map((j: { id: string }) => j.id).sort()).toEqual(['j1', 'j2'])
  })
})
