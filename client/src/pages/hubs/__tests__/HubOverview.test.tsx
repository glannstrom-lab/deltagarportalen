import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import HubOverview from '../HubOverview'
import type { OversiktSummary } from '@/hooks/useOversiktHubSummary'

const mockSummary = vi.fn<() => { data: OversiktSummary | undefined; isLoading: boolean }>()
vi.mock('@/hooks/useOversiktHubSummary', () => ({
  useOversiktHubSummary: () => mockSummary(),
  OVERSIKT_HUB_KEY: (uid: string) => ['hub', 'oversikt', uid],
}))

const trackingSpy = vi.fn()
vi.mock('@/hooks/useOnboardedHubsTracking', () => ({
  useOnboardedHubsTracking: (id: string) => trackingSpy(id),
}))

vi.mock('@/hooks/useSupabase', () => ({
  useAuth: () => ({ user: { id: 'u1' }, profile: null, loading: false, isAuthenticated: true }),
}))

function emptySummary(profileFullName: string | null = 'Mikael Andersson'): OversiktSummary {
  return {
    profile: {
      onboarded_hubs: ['oversikt'],
      full_name: profileFullName,
      profile_image_url: null,
    },
    jobsok: undefined,
    karriar: undefined,
    resurser: undefined,
    minVardag: undefined,
  }
}

function renderHub() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/oversikt']}>
        <HubOverview />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

beforeEach(() => {
  trackingSpy.mockClear()
  mockSummary.mockReset()
})

describe('HubOverview — minimal launchpad', () => {
  it('renders firstName from profile.full_name', () => {
    mockSummary.mockReturnValue({ data: emptySummary('Mikael Andersson'), isLoading: false })
    renderHub()
    expect(screen.getByRole('heading', { name: 'Hej Mikael' })).toBeInTheDocument()
  })

  it('falls back to "Välkommen tillbaka" when full_name is null', () => {
    mockSummary.mockReturnValue({ data: emptySummary(null), isLoading: false })
    renderHub()
    expect(screen.getByRole('heading', { name: 'Välkommen tillbaka' })).toBeInTheDocument()
  })

  it('calls useOnboardedHubsTracking with hub id "oversikt"', () => {
    mockSummary.mockReturnValue({ data: emptySummary(), isLoading: false })
    renderHub()
    expect(trackingSpy).toHaveBeenCalledWith('oversikt')
  })

  it('renders the launchpad question "Vad vill du göra idag?"', () => {
    mockSummary.mockReturnValue({ data: emptySummary(), isLoading: false })
    renderHub()
    expect(screen.getByText('Vad vill du göra idag?')).toBeInTheDocument()
  })

  it('renders 4 hub cards with action-oriented titles', () => {
    mockSummary.mockReturnValue({ data: emptySummary(), isLoading: false })
    renderHub()
    expect(screen.getByRole('link', { name: /Hitta och söka jobb/ })).toHaveAttribute('href', '/jobb')
    expect(screen.getByRole('link', { name: /Planera min karriär/ })).toHaveAttribute('href', '/karriar')
    expect(screen.getByRole('link', { name: /Hantera resurser/ })).toHaveAttribute('href', '/resurser')
    expect(screen.getByRole('link', { name: /Mina vardagliga rutiner/ })).toHaveAttribute('href', '/min-vardag')
  })

  it('renders profile avatar + "Besök din profil" link', () => {
    mockSummary.mockReturnValue({ data: emptySummary(), isLoading: false })
    renderHub()
    // Two elements link to /profile (avatar circle + text label) — both legitimate
    const profileLinks = screen.getAllByRole('link', { name: /Besök din profil/ })
    expect(profileLinks.length).toBeGreaterThanOrEqual(1)
    profileLinks.forEach((l) => expect(l).toHaveAttribute('href', '/profile'))
    // Initial fallback when no image: first letter of firstName
    expect(screen.getByText('M')).toBeInTheDocument()
  })

  it('renders empty-state activity ("Inga händelser än") when sub-hub data is missing', () => {
    mockSummary.mockReturnValue({ data: emptySummary(), isLoading: false })
    renderHub()
    const empties = screen.getAllByText(/Inga händelser än — börja utforska/)
    expect(empties).toHaveLength(4)
  })

  it('renders activity row when career goal is set', () => {
    const sum = emptySummary()
    sum.karriar = {
      careerGoals: { shortTerm: 'career-change', updatedAt: new Date().toISOString() },
      linkedinUrl: null,
      latestSkillsAnalysis: null,
      latestBrandAudit: null,
    } as unknown as OversiktSummary['karriar']
    mockSummary.mockReturnValue({ data: sum, isLoading: false })
    renderHub()
    expect(screen.getByText(/Du satte målet/)).toBeInTheDocument()
    expect(screen.getByText('Byta karriär')).toBeInTheDocument()
  })

  it('does NOT render legacy widget grid, status row, or activity feed', () => {
    mockSummary.mockReturnValue({ data: emptySummary(), isLoading: false })
    renderHub()
    expect(screen.queryByRole('button', { name: /Anpassa vy/i })).not.toBeInTheDocument()
    expect(screen.queryByText('Min status')).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Senaste aktivitet' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'En idé för idag' })).not.toBeInTheDocument()
  })

  it('does NOT render the page-tagg "Översikt · din samlade vy"', () => {
    mockSummary.mockReturnValue({ data: emptySummary(), isLoading: false })
    renderHub()
    expect(screen.queryByText(/din samlade vy/i)).not.toBeInTheDocument()
  })

  it('renders date disc on the right with day-of-month', () => {
    mockSummary.mockReturnValue({ data: emptySummary(), isLoading: false })
    renderHub()
    const today = new Date()
    expect(screen.getByText(String(today.getDate()))).toBeInTheDocument()
  })
})
