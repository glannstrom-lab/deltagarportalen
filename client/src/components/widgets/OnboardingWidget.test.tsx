import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import OnboardingWidget from './OnboardingWidget'
import { OversiktDataProvider, type OversiktSummary } from './OversiktDataContext'

vi.mock('@/hooks/useSupabase', () => ({
  useAuth: () => ({
    user: { id: 'u1' },
    profile: null,
    loading: false,
    isAuthenticated: true,
  }),
}))

function renderWithSummary(summary: OversiktSummary | undefined, props: Record<string, unknown> = {}) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <OversiktDataProvider value={summary}>
          <OnboardingWidget id="onboarding-xl" size="XL" allowedSizes={['XL']} {...props} />
        </OversiktDataProvider>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('OnboardingWidget', () => {
  it("Test A — new user (onboarded_hubs=[]): renders 'Välkommen till din portal' + 4 quick-link CTAs", () => {
    const summary: OversiktSummary = {
      profile: { onboarded_hubs: [], full_name: null },
      jobsok: undefined,
      karriar: undefined,
      resurser: undefined,
      minVardag: undefined,
    }
    renderWithSummary(summary)
    expect(screen.getByText(/Välkommen till din portal/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Söka jobb →/ })).toHaveAttribute('href', '/jobb')
    expect(screen.getByRole('link', { name: /Karriär →/ })).toHaveAttribute('href', '/karriar')
    expect(screen.getByRole('link', { name: /Resurser →/ })).toHaveAttribute('href', '/resurser')
    expect(screen.getByRole('link', { name: /Min Vardag →/ })).toHaveAttribute('href', '/min-vardag')
  })

  it("Test B — returning user (onboarded_hubs=['jobb'], no apps): renders neutral 'Hej' greeting and contextual next-step CTA", () => {
    // Plan 06 BLOCK B1 (langtidsarbetssokande, 2026-04-29):
    // No-apps branch must use neutral "Hej {firstName}" — NOT "Bra jobbat".
    // Pairing praise with a zero-applications body triggered anxiety in users
    // with avslags-trötthet. Praise heading is reserved for branches with
    // something to praise (no-diary / default).
    const summary: OversiktSummary = {
      profile: { onboarded_hubs: ['jobb'], full_name: null },
      jobsok: undefined,
      karriar: undefined,
      resurser: undefined,
      minVardag: undefined,
    }
    renderWithSummary(summary)
    // No-apps branch → neutral "Hej där" greeting (no "Bra jobbat" praise here)
    expect(screen.getByText('Hej där')).toBeInTheDocument()
    // Body softened from "Du har inte sökt något jobb än. Vill du börja idag?"
    expect(screen.getByText('Vill du ta första steget idag?')).toBeInTheDocument()
    // Next-step CTA visible (footer link)
    expect(screen.getByRole('link', { name: /Öppna Söka jobb →/ })).toBeInTheDocument()
  })

  it("Test C — no-apps branch: full_name='Anna Karlsson' produces 'Hej Anna' (neutral, no praise)", () => {
    // Plan 06 BLOCK B1 fix — see Test B docstring.
    const summary: OversiktSummary = {
      profile: { onboarded_hubs: ['jobb'], full_name: 'Anna Karlsson' },
      jobsok: undefined,
      karriar: undefined,
      resurser: undefined,
      minVardag: undefined,
    }
    renderWithSummary(summary)
    expect(screen.getByText('Hej Anna')).toBeInTheDocument()
    // Confirm the praise heading is NOT used on this branch
    expect(screen.queryByText('Bra jobbat Anna!')).not.toBeInTheDocument()
  })

  it("Test D — no-diary branch (apps>0, diary=0): full_name='Anna Karlsson' keeps 'Bra jobbat Anna!' praise heading", () => {
    // Praise heading is preserved on branches where there's something to praise.
    const summary: OversiktSummary = {
      profile: { onboarded_hubs: ['jobb'], full_name: 'Anna Karlsson' },
      jobsok: {
        cv: null,
        coverLetters: [],
        interviewSessions: [],
        applicationStats: {
          total: 5,
          byStatus: { saved: 0, applied: 5, interview: 0, rejected: 0, pending_response: 0 },
          segments: [],
        },
        spontaneousCount: 0,
      },
      karriar: undefined,
      resurser: undefined,
      minVardag: {
        recentMoodLogs: [],
        diaryEntryCount: 0,
        latestDiaryEntry: null,
        upcomingEvents: [],
        networkContactsCount: 0,
        consultant: null,
      },
    }
    renderWithSummary(summary)
    expect(screen.getByText('Bra jobbat Anna!')).toBeInTheDocument()
    expect(screen.getByText(/Reflektera över din vecka i dagboken/)).toBeInTheDocument()
  })

  it('forwards onHide to Widget so hide-button appears in editMode (Pitfall B regression)', () => {
    const summary: OversiktSummary = {
      profile: { onboarded_hubs: [], full_name: null },
      jobsok: undefined,
      karriar: undefined,
      resurser: undefined,
      minVardag: undefined,
    }
    const onHide = vi.fn()
    renderWithSummary(summary, { editMode: true, onHide })
    expect(screen.getByRole('button', { name: /Dölj widget Välkommen/ })).toBeInTheDocument()
  })
})
