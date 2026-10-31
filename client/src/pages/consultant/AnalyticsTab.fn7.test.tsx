/**
 * FN7: växeln "Mina deltagare / Hela enheten" i Rapporter. Bara chef/admin ser den;
 * en konsulent ser sidan precis som förut.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import i18n from '@/i18n/config'

function makeBuilder(response: { data: unknown; error: unknown }) {
  const builder: Record<string, unknown> = {}
  for (const m of ['select', 'eq', 'neq', 'gt', 'gte', 'lte', 'lt', 'order', 'limit', 'range', 'in', 'or', 'not', 'is', 'filter', 'match']) builder[m] = vi.fn(() => builder)
  builder.then = (ok: (v: unknown) => unknown, fel?: (e: unknown) => unknown) => Promise.resolve(response).then(ok, fel)
  return builder
}

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'u1' } } })) },
    from: vi.fn(() => makeBuilder({ data: [], error: null })),
  },
}))

const medlemskap = vi.fn()
vi.mock('@/services/orgApi', () => ({
  orgApi: {
    myMemberships: (...a: unknown[]) => medlemskap(...a),
    colleagues: vi.fn(() => Promise.resolve([])),
  },
}))
vi.mock('@/components/consultant/InsightsPanel', () => ({ InsightsPanel: () => null }))
vi.mock('@/components/consultant/IvoUnderlagSektion', () => ({ IvoUnderlagSektion: () => null }))
vi.mock('@/components/consultant/AvtalskravKort', () => ({ AvtalskravKort: () => null }))
vi.mock('@/components/consultant/GrundersattningKort', () => ({ GrundersattningKort: () => null }))
vi.mock('@/components/consultant/ReportGeneratorDialog', () => ({ ReportGeneratorDialog: () => null }))
vi.mock('@/components/consultant/EnhetensUtfall', async (orig) => ({
  ...(await orig<typeof import('@/components/consultant/EnhetensUtfall')>()),
  EnhetensUtfall: ({ orgId }: { orgId: string }) => <div data-testid="enhetens-utfall-stub">{orgId}</div>,
}))

import { AnalyticsTab } from './AnalyticsTab'

const rad = (role: string) => [{ org_id: 'org-9', user_id: 'u1', role, organization: { id: 'org-9', name: 'Enheten Nord', kind: 'kommun', is_demo: false } }]

function renderTab() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <I18nextProvider i18n={i18n}>
          <AnalyticsTab />
        </I18nextProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

beforeEach(() => medlemskap.mockReset())

describe('FN7 växeln i AnalyticsTab', () => {
  it('chef ser växeln och kan byta till hela enheten', async () => {
    medlemskap.mockResolvedValue(rad('chef'))
    renderTab()
    const knapp = await screen.findByText('Hela enheten')
    expect(screen.queryByTestId('enhetens-utfall-stub')).toBeNull()
    fireEvent.click(knapp)
    expect((await screen.findByTestId('enhetens-utfall-stub')).textContent).toBe('org-9')
    fireEvent.click(screen.getByText('Mina deltagare'))
    expect(screen.queryByTestId('enhetens-utfall-stub')).toBeNull()
  })

  it('konsulent ser ingen växel', async () => {
    medlemskap.mockResolvedValue(rad('konsulent'))
    renderTab()
    expect(await screen.findByTestId('rapporter-omfang')).toBeTruthy()
    expect(screen.queryByTestId('vyvaxel')).toBeNull()
    expect(screen.queryByText('Hela enheten')).toBeNull()
  })
})
