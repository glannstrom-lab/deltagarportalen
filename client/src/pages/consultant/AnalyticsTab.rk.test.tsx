/**
 * Rapporter-fliken, fynden från rollspelet 2026-09-27:
 *
 * RK9  "Excel" var tabbseparerad text med ändelsen .xlsx (Excel varnar/vägrar).
 *      Nu riktig CSV (BOM, `;`, CRLF) med ändelsen .csv — och knappen heter CSV.
 * RK13 Tomläget för Placeringar pekade på en knapp "högst upp" som inte finns
 *      där; den bor på deltagarsidan sedan 2026-09-02.
 * RK19 Översiktens "Exportera rapport" leder hit med ?rapport=1; dialogen ska
 *      då öppnas när siffrorna är inne.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import i18n from '@/i18n/config'

type TableResponse = { data: unknown; error: unknown }
function makeBuilder(response: TableResponse) {
  const builder: Record<string, unknown> = {}
  for (const m of ['select', 'eq', 'neq', 'gt', 'gte', 'lte', 'lt', 'order', 'limit', 'range', 'in', 'or', 'not', 'is', 'filter', 'match']) builder[m] = vi.fn(() => builder)
  builder.then = (ok: (v: TableResponse) => unknown, fel?: (e: unknown) => unknown) => Promise.resolve(response).then(ok, fel)
  return builder
}

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'consultant-1' } } })) },
    from: vi.fn(() => makeBuilder({ data: [], error: null })),
  },
}))
vi.mock('@/services/orgApi', () => ({ orgApi: { myMemberships: vi.fn(() => Promise.resolve([])) } }))
vi.mock('@/components/consultant/InsightsPanel', () => ({ InsightsPanel: () => null }))
vi.mock('@/components/consultant/IvoUnderlagSektion', () => ({ IvoUnderlagSektion: () => null }))
vi.mock('@/components/consultant/AvtalskravKort', () => ({ AvtalskravKort: () => null }))
vi.mock('@/components/consultant/ReportGeneratorDialog', () => ({
  ReportGeneratorDialog: ({ isOpen }: { isOpen: boolean }) => (isOpen ? <div role="dialog" aria-label="Rapportdialog" /> : null),
}))

import { AnalyticsTab } from './AnalyticsTab'

function Plats() {
  const l = useLocation()
  return <output data-testid="plats">{l.pathname + l.search}</output>
}

function renderTab(url = '/consultant/analytics') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[url]}>
        <I18nextProvider i18n={i18n}>
          <Routes>
            <Route path="/consultant/analytics" element={<><AnalyticsTab /><Plats /></>} />
          </Routes>
        </I18nextProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

let nedladdad: { namn: string; blob: Blob } | null
const skapaUrl = vi.fn((b: Blob) => { nedladdad = { namn: '', blob: b }; return 'blob:test' })
const origCreate = URL.createObjectURL
const origRevoke = URL.revokeObjectURL

beforeEach(() => {
  nedladdad = null
  URL.createObjectURL = skapaUrl as unknown as typeof URL.createObjectURL
  URL.revokeObjectURL = vi.fn()
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
    if (nedladdad) nedladdad.namn = this.download
  })
})
afterEach(() => {
  URL.createObjectURL = origCreate
  URL.revokeObjectURL = origRevoke
  vi.restoreAllMocks()
})

const lasText = (b: Blob) => new Promise<string>((ok) => { const r = new FileReader(); r.onload = () => ok(String(r.result)); r.readAsText(b) })

describe('RK9: exporten är det knappen säger', () => {
  it('knappen heter CSV och filen är en riktig CSV — BOM, semikolon, CRLF, .csv', async () => {
    renderTab()
    const knapp = await screen.findByRole('button', { name: 'CSV' })
    expect(screen.queryByRole('button', { name: 'Excel' })).not.toBeInTheDocument()
    fireEvent.click(knapp)

    expect(nedladdad).not.toBeNull()
    expect(nedladdad!.namn).toMatch(/\.csv$/)
    expect(nedladdad!.blob.type).toMatch(/^text\/csv/)
    const rå = await new Promise<string>((ok) => { const r = new FileReader(); r.onload = () => ok(String(r.result)); r.readAsBinaryString(nedladdad!.blob) })
    expect(rå.slice(0, 3)).toBe('\xef\xbb\xbf') // UTF-8-BOM, annars läser Excel å/ä/ö fel
    const text = await lasText(nedladdad!.blob)
    expect(text).not.toContain('\t')
    expect(text).toContain(';')
    expect(text).toContain('\r\n')
  })
})

describe('RK13: tomläget för Placeringar pekar dit knappen faktiskt finns', () => {
  it('ingen hänvisning till en knapp "högst upp"; länk till Deltagare och förklaring om Platser', async () => {
    renderTab()
    expect(await screen.findByText(/Inga placeringar registrerade än/)).toBeInTheDocument()
    expect(screen.queryByText(/högst upp/)).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Deltagare' })).toHaveAttribute('href', '/consultant/participants')
    expect(screen.getByRole('link', { name: 'Platser' })).toHaveAttribute('href', '/consultant/platser')
  })
})

describe('RK19: ?rapport=1 öppnar rapportdialogen', () => {
  it('öppnar dialogen när datan är inne och tar bort parametern', async () => {
    renderTab('/consultant/analytics?rapport=1')
    expect(await screen.findByRole('dialog', { name: 'Rapportdialog' })).toBeInTheDocument()
    await waitFor(() => expect(screen.getByTestId('plats')).toHaveTextContent(/^\/consultant\/analytics$/))
  })

  it('utan parametern öppnas ingen dialog av sig själv', async () => {
    renderTab()
    await screen.findByRole('button', { name: 'CSV' })
    expect(screen.queryByRole('dialog', { name: 'Rapportdialog' })).not.toBeInTheDocument()
  })
})
