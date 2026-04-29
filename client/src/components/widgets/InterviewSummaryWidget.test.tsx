import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import InterviewSummaryWidget from './InterviewSummaryWidget'

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
        <InterviewSummaryWidget
          id="interview-summary"
          size="M"
          allowedSizes={['S', 'M']}
          {...props}
        />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('InterviewSummaryWidget', () => {
  it('renders "Tid för övning" empty state when cache has no sessions', () => {
    renderWithCache({ interviewSessions: [] })
    expect(screen.getAllByText('Tid för övning').length).toBeGreaterThan(0)
  })

  it('renders qualitative "Stark prestation" label when latest score=85 — no raw number', () => {
    const { container } = renderWithCache({
      interviewSessions: [{ id: 's1', score: 85, created_at: '2026-04-27' }],
    })
    expect(screen.getByText('Stark prestation')).toBeInTheDocument()
    // Pitfall: no raw \d+% rendered anywhere
    const text = container.textContent ?? ''
    expect(text).not.toMatch(/\d+%/)
    // Also no raw "85" visible as a primary KPI
    expect(text).not.toMatch(/\b85\b/)
  })

  it('renders "Bra framsteg" for score=70', () => {
    renderWithCache({
      interviewSessions: [{ id: 's1', score: 70, created_at: '2026-04-27' }],
    })
    expect(screen.getByText('Bra framsteg')).toBeInTheDocument()
  })

  it('renders "Bygger upp" for score=45', () => {
    renderWithCache({
      interviewSessions: [{ id: 's1', score: 45, created_at: '2026-04-27' }],
    })
    expect(screen.getByText('Bygger upp')).toBeInTheDocument()
  })

  it('forwards onHide to Widget (hide-button in editMode)', () => {
    renderWithCache(
      { interviewSessions: [{ id: 's1', score: 85, created_at: '2026-04-27' }] },
      { editMode: true, onHide: vi.fn() }
    )
    expect(screen.getByRole('button', { name: /Dölj widget Intervju/ })).toBeInTheDocument()
  })
})
