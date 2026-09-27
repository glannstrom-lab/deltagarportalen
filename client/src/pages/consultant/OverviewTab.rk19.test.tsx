/**
 * RK19 (rollspelet 2026-09-27): "Exportera rapport" på Översikt gjorde
 * ingenting synligt. Översikten byggde en egen, tunnare rapportdata och
 * renderade dialogen bara när den fanns. Nu leder knappen till Rapporter, där
 * siffrorna räknas, och dialogen öppnas där (?rapport=1, se AnalyticsTab.rk.test.tsx).
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import i18n from '@/i18n/config'

type TableResponse = { data: unknown; error: unknown }
function makeBuilder(response: TableResponse) {
  const builder: Record<string, unknown> = {}
  for (const m of ['select', 'eq', 'neq', 'gt', 'gte', 'lte', 'lt', 'order', 'limit', 'range', 'in', 'or', 'not', 'is']) builder[m] = vi.fn(() => builder)
  builder.then = (ok: (v: TableResponse) => unknown, fel?: (e: unknown) => unknown) => Promise.resolve(response).then(ok, fel)
  return builder
}

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'consultant-1' } } })) },
    from: vi.fn(() => makeBuilder({ data: [], error: null })),
  },
}))

import { OverviewTab } from './OverviewTab'

function Plats() {
  const l = useLocation()
  return <output data-testid="plats">{l.pathname + l.search}</output>
}

describe('RK19: Exportera rapport på Översikt', () => {
  it('leder till Rapporter och ber den öppna rapportdialogen', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/consultant']}>
          <I18nextProvider i18n={i18n}>
            <Routes>
              <Route path="/consultant" element={<OverviewTab />} />
              <Route path="/consultant/analytics" element={<Plats />} />
            </Routes>
          </I18nextProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    )
    fireEvent.click(await screen.findByRole('button', { name: 'Exportera rapport' }))
    expect(await screen.findByTestId('plats')).toHaveTextContent('/consultant/analytics?rapport=1')
  })
})
