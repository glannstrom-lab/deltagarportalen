import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ResurserHub from '../ResurserHub'

const mockSummary = vi.fn()
vi.mock('@/hooks/useResurserHubSummary', () => ({
  useResurserHubSummary: () => mockSummary(),
  RESURSER_HUB_KEY: (uid: string) => ['hub', 'resurser', uid],
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
      <MemoryRouter initialEntries={['/resurser']}>
        <ResurserHub />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

beforeEach(() => {
  trackingSpy.mockClear()
  mockSummary.mockReset()
  mockSummary.mockReturnValue({ data: undefined, isLoading: false })
})

describe('ResurserHub — feature-page', () => {
  it('tracks the hub visit', () => {
    renderHub()
    expect(trackingSpy).toHaveBeenCalledWith('resurser')
  })

  it('renders hero title "Hantera resurser"', () => {
    renderHub()
    expect(screen.getByRole('heading', { name: 'Hantera resurser' })).toBeInTheDocument()
  })

  it('renders feature-card links to sub-pages', () => {
    renderHub()
    expect(screen.getByRole('link', { name: /Kunskapsbank/ })).toHaveAttribute('href', '/knowledge-base')
    expect(screen.getByRole('link', { name: /Mina dokument/ })).toHaveAttribute('href', '/resources')
    expect(screen.getByRole('link', { name: /Utskriftsmaterial/ })).toHaveAttribute('href', '/print-resources')
    expect(screen.getByRole('link', { name: /Externa resurser/ })).toHaveAttribute('href', '/externa-resurser')
    expect(screen.getByRole('link', { name: /AI-team/ })).toHaveAttribute('href', '/ai-team')
    expect(screen.getByRole('link', { name: /Nätverk/ })).toHaveAttribute('href', '/nätverk')
  })

  it('does NOT render legacy widget grid', () => {
    renderHub()
    expect(screen.queryByRole('button', { name: /Anpassa vy/i })).not.toBeInTheDocument()
  })
})
