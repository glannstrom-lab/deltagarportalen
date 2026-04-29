import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import CvStatusSummaryWidget from './CvStatusSummaryWidget'

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
        <CvStatusSummaryWidget
          id="cv-status-summary"
          size="M"
          allowedSizes={['S', 'M']}
          {...props}
        />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('CvStatusSummaryWidget', () => {
  it('renders "Inget CV" empty state when cache has no cv slice', () => {
    renderWithCache({ cv: null })
    expect(screen.getByText('Inget CV')).toBeInTheDocument()
  })

  it('renders "CV uppdaterat" with locale date when cv slice present', () => {
    renderWithCache({
      cv: { id: 'cv-1', updated_at: '2026-04-25T10:00:00Z' },
    })
    expect(screen.getByText('CV uppdaterat')).toBeInTheDocument()
    // Swedish-locale date: 2026-04-25
    expect(screen.getByText(/2026-04-25/)).toBeInTheDocument()
  })

  it('forwards onHide to Widget (hide-button in editMode)', () => {
    renderWithCache({ cv: null }, { editMode: true, onHide: vi.fn() })
    expect(screen.getByRole('button', { name: /Dölj widget CV/ })).toBeInTheDocument()
  })
})
