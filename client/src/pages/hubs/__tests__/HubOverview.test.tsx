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

describe('HubOverview — fyra kategorier (förslag A, 2026-08-18)', () => {
  // Sidans tre skepnader, i ordning:
  //   1. "minimal launchpad" — hälsning + fyra hub-kort i 2×2 (till 2026-08-17)
  //   2. instrumentpanel — nyckeltalsremsa + sex ytor (2026-08-17)
  //   3. fyra kategorier med innehåll i varje (2026-08-18, beslut Mikael)
  //
  // Kategorierna är tillbaka, men inte som korten i (1): de bär nu innehåll —
  // vad du gjort under varje rubrik — i stället för att upprepa toppnavens
  // rad 1. Testerna nedan är omskrivna mot den strukturen, inte sänkta.

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

  it('visar de fyra kategorierna med innehåll under varje', () => {
    mockSummary.mockReturnValue({ data: emptySummary(), isLoading: false })
    renderHub()
    for (const rubrik of ['Söka jobb', 'Karriär', 'Resurser', 'Din vardag']) {
      expect(screen.getByRole('heading', { level: 2, name: rubrik })).toBeInTheDocument()
    }
    // Innehåll, inte bara rubriker: raderna pekar på verktygen.
    for (const rad of ['Dina ansökningar', 'Ditt CV', 'Din dagbok', 'Kunskapsbank']) {
      expect(screen.getByText(rad)).toBeInTheDocument()
    }
  })

  it('kategorierna upprepar inte toppnavens hubbrubriker ordagrant', () => {
    // De gamla hub-korten hette "Hitta och söka jobb" / "Planera min karriär"
    // och sa samma sak som navigationens rad 1 med fler ord.
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

  it('utan data visas inviter, aldrig nollor (B31)', () => {
    // Regeln är densamma som för nyckeltalsremsan, i den form kategorierna
    // kräver: en rad utan underlag visar en invit — aldrig en nolla, och inte
    // heller ett tankstreck, eftersom raden har plats för en hel mening.
    mockSummary.mockReturnValue({ data: emptySummary(), isLoading: false })
    renderHub()
    expect(screen.queryByText('0')).not.toBeInTheDocument()
    expect(screen.getByText(/hitta ditt första jobb/i)).toBeInTheDocument()
    expect(screen.getByText(/skapa ditt CV/i)).toBeInTheDocument()
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
