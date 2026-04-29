import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import JobsokHub from '../JobsokHub'

const mockSummary = vi.fn()
vi.mock('@/hooks/useJobsokHubSummary', () => ({
  useJobsokHubSummary: () => mockSummary(),
  JOBSOK_HUB_KEY: (uid: string) => ['hub', 'jobsok', uid],
}))

const trackingSpy = vi.fn()
vi.mock('@/hooks/useOnboardedHubsTracking', () => ({
  useOnboardedHubsTracking: (id: string) => trackingSpy(id),
}))

vi.mock('@/hooks/useSupabase', () => ({
  useAuth: () => ({ user: { id: 'u1' }, profile: null, loading: false, isAuthenticated: true }),
}))

function renderHub() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/jobb']}>
        <JobsokHub />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

beforeEach(() => {
  trackingSpy.mockClear()
  mockSummary.mockReset()
  mockSummary.mockReturnValue({ data: undefined, isLoading: false })
})

describe('JobsokHub — feature-page', () => {
  it('tracks the hub visit', () => {
    renderHub()
    expect(trackingSpy).toHaveBeenCalledWith('jobb')
  })

  it('renders hero title "Hitta och söka jobb"', () => {
    renderHub()
    expect(screen.getByRole('heading', { name: 'Hitta och söka jobb' })).toBeInTheDocument()
  })

  it('renders feature-card links to sub-pages', () => {
    renderHub()
    expect(screen.getByRole('link', { name: /Sök jobb/ })).toHaveAttribute('href', '/job-search')
    expect(screen.getByRole('link', { name: /Mina ansökningar/ })).toHaveAttribute('href', '/applications')
    expect(screen.getByRole('link', { name: /Spontanansökan/ })).toHaveAttribute('href', '/spontanansökan')
    expect(screen.getByRole('link', { name: /^CV/ })).toHaveAttribute('href', '/cv')
    expect(screen.getByRole('link', { name: /Personligt brev/ })).toHaveAttribute('href', '/cover-letter')
    expect(screen.getByRole('link', { name: /Intervjuträning/ })).toHaveAttribute('href', '/interview-simulator')
  })

  it('shows status pill with active count when applications exist', () => {
    mockSummary.mockReturnValue({
      data: {
        applicationStats: { total: 5 },
        cv: null,
        coverLetters: [],
        interviewSessions: [],
        spontaneousCount: 0,
      },
      isLoading: false,
    })
    renderHub()
    expect(screen.getByText('5 aktiva')).toBeInTheDocument()
  })

  it('shows empty state status when no application data', () => {
    renderHub()
    expect(screen.getByText('Inga än')).toBeInTheDocument()
  })

  it('does NOT render legacy widget grid or Anpassa-vy', () => {
    renderHub()
    expect(screen.queryByRole('button', { name: /Anpassa vy/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Skapa & öva' })).not.toBeInTheDocument()
  })
})
