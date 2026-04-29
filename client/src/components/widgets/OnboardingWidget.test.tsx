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

  it("Test B — returning user (onboarded_hubs=['jobb']): renders 'Bra jobbat' greeting and contextual next-step CTA", () => {
    const summary: OversiktSummary = {
      profile: { onboarded_hubs: ['jobb'], full_name: null },
      jobsok: undefined,
      karriar: undefined,
      resurser: undefined,
      minVardag: undefined,
    }
    renderWithSummary(summary)
    expect(screen.getByText(/Bra jobbat/)).toBeInTheDocument()
    // Greeting fallback "där" since full_name is null
    expect(screen.getByText(/Bra jobbat där/)).toBeInTheDocument()
    // Next-step CTA visible (footer link)
    expect(screen.getByRole('link', { name: /Öppna Söka jobb →/ })).toBeInTheDocument()
  })

  it("Test C — full_name='Anna Karlsson' produces 'Bra jobbat Anna!' heading", () => {
    const summary: OversiktSummary = {
      profile: { onboarded_hubs: ['jobb'], full_name: 'Anna Karlsson' },
      jobsok: undefined,
      karriar: undefined,
      resurser: undefined,
      minVardag: undefined,
    }
    renderWithSummary(summary)
    expect(screen.getByText('Bra jobbat Anna!')).toBeInTheDocument()
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
