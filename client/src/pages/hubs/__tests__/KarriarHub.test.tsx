import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import KarriarHub from '../KarriarHub'

const mockSummary = vi.fn()
vi.mock('@/hooks/useKarriarHubSummary', () => ({
  useKarriarHubSummary: () => mockSummary(),
  KARRIAR_HUB_KEY: (uid: string) => ['hub', 'karriar', uid],
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
      <MemoryRouter initialEntries={['/karriar']}>
        <KarriarHub />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

beforeEach(() => {
  trackingSpy.mockClear()
  mockSummary.mockReset()
  mockSummary.mockReturnValue({ data: undefined, isLoading: false })
})

describe('KarriarHub — feature-page', () => {
  it('tracks the hub visit', () => {
    renderHub()
    expect(trackingSpy).toHaveBeenCalledWith('karriar')
  })

  it('renders hero title "Planera min karriär"', () => {
    renderHub()
    expect(screen.getByRole('heading', { name: 'Planera min karriär' })).toBeInTheDocument()
  })

  it('renders feature-card links to sub-pages', () => {
    renderHub()
    expect(screen.getByRole('link', { name: /Karriärmål/ })).toHaveAttribute('href', '/career')
    expect(screen.getByRole('link', { name: /Intresseguide/ })).toHaveAttribute('href', '/interest-guide')
    expect(screen.getByRole('link', { name: /Kompetensanalys/ })).toHaveAttribute('href', '/skills-gap-analysis')
    expect(screen.getByRole('link', { name: /Personligt varumärke/ })).toHaveAttribute('href', '/personal-brand')
    expect(screen.getByRole('link', { name: /Utbildning/ })).toHaveAttribute('href', '/education')
  })

  it('renders career-goal status when set', () => {
    mockSummary.mockReturnValue({
      data: {
        careerGoals: { shortTerm: 'career-change', updatedAt: new Date().toISOString() },
        linkedinUrl: null,
        latestSkillsAnalysis: null,
        latestBrandAudit: null,
      },
      isLoading: false,
    })
    renderHub()
    expect(screen.getByText(/Aktivt: Byta karriär/)).toBeInTheDocument()
  })

  it('does NOT render legacy widget grid', () => {
    renderHub()
    expect(screen.queryByRole('button', { name: /Anpassa vy/i })).not.toBeInTheDocument()
  })
})
