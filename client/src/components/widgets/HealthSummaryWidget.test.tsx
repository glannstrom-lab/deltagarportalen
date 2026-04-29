import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import HealthSummaryWidget from './HealthSummaryWidget'

vi.mock('@/hooks/useSupabase', () => ({
  useAuth: () => ({
    user: { id: 'u1' },
    profile: null,
    loading: false,
    isAuthenticated: true,
  }),
}))

function renderWithCache(cacheData: unknown, props: Record<string, unknown> = {}) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  if (cacheData !== undefined) {
    qc.setQueryData(['hub', 'min-vardag', 'u1'], cacheData)
  }
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <HealthSummaryWidget
          id="halsa-summary"
          size="M"
          allowedSizes={['S', 'M']}
          {...props}
        />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('HealthSummaryWidget', () => {
  it('renders "Logga ditt mående" empty state when no logs in cache', () => {
    renderWithCache({ recentMoodLogs: [] })
    expect(screen.getByText('Logga ditt mående')).toBeInTheDocument()
  })

  it('renders streak label "Loggat 5 dagar" when 5 consecutive days of logs in cache', () => {
    renderWithCache({
      recentMoodLogs: [
        { mood_level: 4, energy_level: 3, log_date: '2026-04-29' },
        { mood_level: 3, energy_level: 3, log_date: '2026-04-28' },
        { mood_level: 4, energy_level: 4, log_date: '2026-04-27' },
        { mood_level: 3, energy_level: 3, log_date: '2026-04-26' },
        { mood_level: 4, energy_level: 4, log_date: '2026-04-25' },
      ],
    })
    expect(screen.getByText('Loggat 5 dagar')).toBeInTheDocument()
  })

  it('renders "Loggat 1 dag" (singular) for streak=1', () => {
    renderWithCache({
      recentMoodLogs: [{ mood_level: 4, energy_level: 3, log_date: '2026-04-29' }],
    })
    expect(screen.getByText('Loggat 1 dag')).toBeInTheDocument()
  })

  it('forwards onHide to Widget (hide-button in editMode)', () => {
    renderWithCache(
      { recentMoodLogs: [] },
      { editMode: true, onHide: vi.fn() }
    )
    expect(screen.getByRole('button', { name: /Dölj widget Hälsa/ })).toBeInTheDocument()
  })
})
