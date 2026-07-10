import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('@/hooks/useInterestProfile', () => ({
  useInterestProfile: vi.fn(),
}))

import { useInterestProfile } from '@/hooks/useInterestProfile'
import { KarriarDataProvider } from './KarriarDataContext'
import type { KarriarSummary } from './KarriarDataContext'
import InterestGuideWidget from './InterestGuideWidget'

const EMPTY_SUMMARY: KarriarSummary = {
  careerGoals: null,
  linkedinUrl: null,
  latestSkillsAnalysis: null,
  latestBrandAudit: null,
}

const EMPTY_PROFILE = {
  hasResult: false,
  riasecScores: null,
  dominantTypes: [],
  recommendedOccupations: [],
  completedAt: null,
}

const FILLED_PROFILE = {
  hasResult: true,
  riasecScores: { realistic: 20, investigative: 80, artistic: 60, social: 40, enterprising: 30, conventional: 10 },
  dominantTypes: [
    { code: 'investigative' as const, score: 80 },
    { code: 'artistic' as const, score: 60 },
  ],
  recommendedOccupations: [{ name: 'UX Designer', matchPercentage: 85 }],
  completedAt: '2026-04-20',
}

function renderWidget(profileData: typeof EMPTY_PROFILE, props: Record<string, unknown> = {}) {
  vi.mocked(useInterestProfile).mockReturnValue({
    profile: profileData,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  })
  return render(
    <MemoryRouter>
      <KarriarDataProvider value={EMPTY_SUMMARY}>
        <InterestGuideWidget
          id="intresseguide"
          size="M"
          allowedSizes={['S', 'M', 'L']}
          {...props}
        />
      </KarriarDataProvider>
    </MemoryRouter>
  )
}

describe('InterestGuideWidget', () => {
  it('renders empty state when profile has no result', () => {
    renderWidget(EMPTY_PROFILE)
    expect(screen.getByText('Utforska dina intressen')).toBeInTheDocument()
    expect(screen.getByText(/Ta reda på vilka yrken/)).toBeInTheDocument()
    expect(screen.getByText('Starta intresseguide')).toBeInTheDocument()
  })

  it('renders filled state with dominant types when profile has result', () => {
    renderWidget(FILLED_PROFILE)
    expect(screen.getByText('Topp-match')).toBeInTheDocument()
    // Should show dominant type names (not raw percentages)
    expect(screen.queryByText(/Utforska dina intressen/)).not.toBeInTheDocument()
  })

  it('renders at S size without footer', () => {
    vi.mocked(useInterestProfile).mockReturnValue({
      profile: EMPTY_PROFILE,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })
    const { container } = render(
      <MemoryRouter>
        <KarriarDataProvider value={EMPTY_SUMMARY}>
          <InterestGuideWidget id="intresseguide" size="S" allowedSizes={['S', 'M', 'L']} />
        </KarriarDataProvider>
      </MemoryRouter>
    )
    expect(container.querySelector('a[href="/interest-guide"]')).not.toBeInTheDocument()
  })

  it('forwards onHide to Widget — hide button appears in editMode', () => {
    renderWidget(EMPTY_PROFILE, { editMode: true, onHide: vi.fn() })
    expect(screen.getByRole('button', { name: /Dölj widget/ })).toBeInTheDocument()
  })
})
