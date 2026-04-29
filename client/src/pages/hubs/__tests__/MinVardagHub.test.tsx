import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import MinVardagHub from '../MinVardagHub'

const mockSummary = vi.fn()
vi.mock('@/hooks/useMinVardagHubSummary', () => ({
  useMinVardagHubSummary: () => mockSummary(),
  MIN_VARDAG_HUB_KEY: (uid: string) => ['hub', 'min-vardag', uid],
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
      <MemoryRouter initialEntries={['/min-vardag']}>
        <MinVardagHub />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

beforeEach(() => {
  trackingSpy.mockClear()
  mockSummary.mockReset()
  mockSummary.mockReturnValue({ data: undefined, isLoading: false })
})

describe('MinVardagHub — feature-page', () => {
  it('tracks the hub visit', () => {
    renderHub()
    expect(trackingSpy).toHaveBeenCalledWith('min-vardag')
  })

  it('renders hero title "Mina vardagliga rutiner"', () => {
    renderHub()
    expect(screen.getByRole('heading', { name: 'Mina vardagliga rutiner' })).toBeInTheDocument()
  })

  it('renders feature-card links to sub-pages', () => {
    renderHub()
    expect(screen.getByRole('link', { name: /Mående/ })).toHaveAttribute('href', '/wellness')
    expect(screen.getByRole('link', { name: /Dagbok/ })).toHaveAttribute('href', '/diary')
    expect(screen.getByRole('link', { name: /Kalender/ })).toHaveAttribute('href', '/calendar')
    expect(screen.getByRole('link', { name: /Övningar/ })).toHaveAttribute('href', '/exercises')
    expect(screen.getByRole('link', { name: /Min konsulent/ })).toHaveAttribute('href', '/my-consultant')
    expect(screen.getByRole('link', { name: /Nätverk/ })).toHaveAttribute('href', '/nätverk')
  })

  it('renders mood streak when data is present', () => {
    const today = new Date().toISOString().slice(0, 10)
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
    mockSummary.mockReturnValue({
      data: {
        recentMoodLogs: [
          { mood_level: 4, energy_level: 3, log_date: today },
          { mood_level: 3, energy_level: 3, log_date: yesterday },
        ],
        diaryEntryCount: 0,
        latestDiaryEntry: null,
        upcomingEvents: [],
        networkContactsCount: 0,
        consultant: null,
      },
      isLoading: false,
    })
    renderHub()
    expect(screen.getByText('2 dagar i rad')).toBeInTheDocument()
  })

  it('does NOT render legacy widget grid', () => {
    renderHub()
    expect(screen.queryByRole('button', { name: /Anpassa vy/i })).not.toBeInTheDocument()
  })
})
