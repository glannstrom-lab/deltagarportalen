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

describe('HubOverview — instrumentpanel (steg 3, 2026-08-17)', () => {
  // Sidan var en "minimal launchpad": hälsning + fyra hub-kort i 2×2.
  // Med den tvåradiga toppnaven upprepade korten rad 1, och sidan hämtade
  // redan all data den nu visar utan att rendera något av den.
  // Testerna nedan är omskrivna mot den nya strukturen — inte sänkta.

  it('renders firstName from profile.full_name', () => {
    mockSummary.mockReturnValue({ data: emptySummary('Mikael Andersson'), isLoading: false })
    renderHub()
    expect(screen.getByText(/Mikael/)).toBeInTheDocument()
  })

  it('faller tillbaka på tidsanpassad hälsning utan namn', () => {
    mockSummary.mockReturnValue({ data: emptySummary(null), isLoading: false })
    renderHub()
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  })

  it('calls useOnboardedHubsTracking with hub id "oversikt"', () => {
    mockSummary.mockReturnValue({ data: emptySummary(), isLoading: false })
    renderHub()
    expect(trackingSpy).toHaveBeenCalledWith('oversikt')
  })

  it('visar nyckeltalsremsan i stället för fyra hub-kort', () => {
    mockSummary.mockReturnValue({ data: emptySummary(), isLoading: false })
    renderHub()
    for (const etikett of ['Ansökningar', 'Ditt CV', 'Personliga brev', 'Intervjuövning']) {
      expect(screen.getByText(etikett)).toBeInTheDocument()
    }
  })

  it('hub-korten är borta — de upprepade toppnavens rad 1', () => {
    mockSummary.mockReturnValue({ data: emptySummary(), isLoading: false })
    renderHub()
    expect(screen.queryByText('Hitta och söka jobb')).not.toBeInTheDocument()
    expect(screen.queryByText('Planera min karriär')).not.toBeInTheDocument()
  })

  it('frågan "Vad vill du göra idag?" är borta — den besvaras av navigationen', () => {
    mockSummary.mockReturnValue({ data: emptySummary(), isLoading: false })
    renderHub()
    expect(screen.queryByText(/Vad vill du göra idag/i)).not.toBeInTheDocument()
  })

  it('utan data visas tankstreck, aldrig nollor (B31)', () => {
    mockSummary.mockReturnValue({ data: emptySummary(), isLoading: false })
    renderHub()
    expect(screen.getAllByText('—').length).toBe(5)
    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })

  it('does NOT render legacy widget grid, status row, or activity feed', () => {
    mockSummary.mockReturnValue({ data: emptySummary(), isLoading: false })
    renderHub()
    expect(screen.queryByText(/Anpassa vyn/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Senaste aktivitet/i)).not.toBeInTheDocument()
  })

  it('does NOT render the page-tagg "Översikt · din samlade vy"', () => {
    mockSummary.mockReturnValue({ data: emptySummary(), isLoading: false })
    renderHub()
    expect(screen.queryByText(/din samlade vy/i)).not.toBeInTheDocument()
  })

  it('visar dagens datum i hälsningsraden', () => {
    mockSummary.mockReturnValue({ data: emptySummary(), isLoading: false })
    renderHub()
    expect(screen.getByText(new RegExp(String(new Date().getDate())))).toBeInTheDocument()
  })
})
