import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import JobsokSummaryWidget from './JobsokSummaryWidget'

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
    qc.setQueryData(['hub', 'jobsok', 'u1'], cacheData)
  }
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <JobsokSummaryWidget
          id="jobsok-summary"
          size="M"
          allowedSizes={['S', 'M']}
          {...props}
        />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('JobsokSummaryWidget', () => {
  it('renders empty state "Kom igång / Börja söka jobb idag" when cache is undefined', () => {
    renderWithCache(undefined)
    expect(screen.getByText('Kom igång')).toBeInTheDocument()
    expect(screen.getByText(/Börja söka jobb idag/)).toBeInTheDocument()
  })

  it('renders count when cache has applicationStats.total=12', () => {
    renderWithCache({ applicationStats: { total: 12 } })
    expect(screen.getByText(/12 aktiva ansökningar/)).toBeInTheDocument()
  })

  it('forwards onHide to Widget (hide-button in editMode)', () => {
    renderWithCache({ applicationStats: { total: 5 } }, { editMode: true, onHide: vi.fn() })
    expect(screen.getByRole('button', { name: /Dölj widget Söka jobb/ })).toBeInTheDocument()
  })
})
