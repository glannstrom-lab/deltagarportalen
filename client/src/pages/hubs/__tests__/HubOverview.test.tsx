import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import HubOverview from '../HubOverview'
import type { OversiktSummary } from '@/hooks/useOversiktHubSummary'

// Mock the data hook — tests exercise the static page logic, not the loader.
const mockSummary = vi.fn<() => { data: OversiktSummary | undefined; isLoading: boolean }>()
vi.mock('@/hooks/useOversiktHubSummary', () => ({
  useOversiktHubSummary: () => mockSummary(),
  OVERSIKT_HUB_KEY: (uid: string) => ['hub', 'oversikt', uid],
}))

// Tracking hook — no-op; assert it was called with 'oversikt'.
const trackingSpy = vi.fn()
vi.mock('@/hooks/useOnboardedHubsTracking', () => ({
  useOnboardedHubsTracking: (id: string) => trackingSpy(id),
}))

// Auth — needed indirectly by some children.
vi.mock('@/hooks/useSupabase', () => ({
  useAuth: () => ({ user: { id: 'u1' }, profile: null, loading: false, isAuthenticated: true }),
}))

function emptySummary(profileFullName: string | null = 'Mikael Andersson'): OversiktSummary {
  return {
    profile: { onboarded_hubs: ['oversikt'], full_name: profileFullName },
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

describe('HubOverview — clean rebuild', () => {
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

  it('renders 3 status cards: CV, Ansökningar, Mående', () => {
    mockSummary.mockReturnValue({ data: emptySummary(), isLoading: false })
    renderHub()
    const region = screen.getByRole('region', { name: 'Min status' })
    expect(within(region).getByText('CV')).toBeInTheDocument()
    expect(within(region).getByText('Ansökningar')).toBeInTheDocument()
    expect(within(region).getByText('Mående')).toBeInTheDocument()
  })

  it('renders empty-state values when all sub-hub data is undefined', () => {
    mockSummary.mockReturnValue({ data: emptySummary(), isLoading: false })
    renderHub()
    expect(screen.getByText('Inget CV')).toBeInTheDocument()
    expect(screen.getByText('Inga än')).toBeInTheDocument()
    expect(screen.getByText('Inte loggat')).toBeInTheDocument()
  })

  it('Nästa-steg block proposes CV when CV is missing', () => {
    mockSummary.mockReturnValue({ data: emptySummary(), isLoading: false })
    renderHub()
    expect(screen.getByRole('heading', { name: 'Vill du börja med ditt CV idag?' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Öppna CV/ })).toHaveAttribute('href', '/cv')
  })

  it('renders activity feed empty-state when nothing has happened', () => {
    mockSummary.mockReturnValue({ data: emptySummary(), isLoading: false })
    renderHub()
    expect(screen.getByText('Här samlas din historik')).toBeInTheDocument()
  })

  it('renders 4 hub link cards (Söka jobb, Karriär, Resurser, Min Vardag)', () => {
    mockSummary.mockReturnValue({ data: emptySummary(), isLoading: false })
    renderHub()
    expect(screen.getByRole('link', { name: /Söka jobb/ })).toHaveAttribute('href', '/jobb')
    expect(screen.getByRole('link', { name: /Karriär/ })).toHaveAttribute('href', '/karriar')
    expect(screen.getByRole('link', { name: /Resurser/ })).toHaveAttribute('href', '/resurser')
    expect(screen.getByRole('link', { name: /Min Vardag/ })).toHaveAttribute('href', '/min-vardag')
  })

  it('does NOT render the legacy widget grid (no Anpassa-vy button, no Idag/Aktivitet sections)', () => {
    mockSummary.mockReturnValue({ data: emptySummary(), isLoading: false })
    renderHub()
    expect(screen.queryByRole('button', { name: /Anpassa vy/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Idag' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Aktivitet' })).not.toBeInTheDocument()
  })
})
