import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import CareerGoalSummaryWidget from './CareerGoalSummaryWidget'

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
    qc.setQueryData(['hub', 'karriar', 'u1'], cacheData)
  }
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <CareerGoalSummaryWidget
          id="karriar-mal-summary"
          size="M"
          allowedSizes={['S', 'M']}
          {...props}
        />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('CareerGoalSummaryWidget', () => {
  it('renders "Inget mål satt" empty state when cache has no careerGoals', () => {
    renderWithCache({ careerGoals: null })
    expect(screen.getByText('Inget mål satt')).toBeInTheDocument()
  })

  it('renders shortTerm when present', () => {
    renderWithCache({
      careerGoals: { shortTerm: 'Få första intervjun' },
    })
    expect(screen.getByText('Få första intervjun')).toBeInTheDocument()
  })

  it('truncates shortTerm to 50 chars when longer', () => {
    const longGoal = 'a'.repeat(60)
    renderWithCache({
      careerGoals: { shortTerm: longGoal },
    })
    // Should render 50 a's followed by ellipsis
    const expected = 'a'.repeat(50) + '…'
    expect(screen.getByText(expected)).toBeInTheDocument()
  })

  it('forwards onHide to Widget (hide-button in editMode)', () => {
    renderWithCache(
      { careerGoals: { shortTerm: 'Test' } },
      { editMode: true, onHide: vi.fn() }
    )
    expect(screen.getByRole('button', { name: /Dölj widget Karriärmål/ })).toBeInTheDocument()
  })
})
