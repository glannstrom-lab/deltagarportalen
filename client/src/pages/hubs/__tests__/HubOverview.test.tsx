import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ConfirmDialogProvider } from '@/components/ui/ConfirmDialog'
import HubOverview from '../HubOverview'

// Mock i18next so t() returns the fallback string
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, fallback?: string) => fallback ?? key }),
}))

// Mock the Översikt aggregator — controlled per test via mutable STUB_SUMMARY.
let stubProfile: { onboarded_hubs: string[]; full_name: string | null } = {
  onboarded_hubs: [],
  full_name: 'Anna Karlsson',
}
vi.mock('@/hooks/useOversiktHubSummary', () => ({
  useOversiktHubSummary: () => ({
    data: {
      profile: stubProfile,
      jobsok: undefined,
      karriar: undefined,
      resurser: undefined,
      minVardag: undefined,
    },
    isLoading: false,
  }),
  OVERSIKT_HUB_KEY: (id: string) => ['hub', 'oversikt', id],
}))

// Mock useOnboardedHubsTracking — also captures invocations for the ν test.
const trackingMock = vi.fn()
vi.mock('@/hooks/useOnboardedHubsTracking', () => ({
  useOnboardedHubsTracking: (hubId: string) => trackingMock(hubId),
}))

// useAuth — logged-in user
vi.mock('@/hooks/useSupabase', () => ({
  useAuth: () => ({
    user: { id: 'test-user' },
    profile: null,
    loading: false,
    isAuthenticated: true,
  }),
}))

// Supabase mock — default: select returns null, upsert resolves ok
const upsertSpy = vi.fn().mockResolvedValue({ error: null })
const selectChain = {
  eq: vi.fn().mockReturnThis(),
  maybeSingle: vi
    .fn<[], Promise<{ data: unknown; error: null }>>()
    .mockResolvedValue({ data: null, error: null }),
}

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => selectChain),
      upsert: upsertSpy,
    })),
  },
}))

vi.mock('@/hooks/useBreakpoint', () => ({ useBreakpoint: vi.fn(() => 'desktop') }))

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: (query as string).includes('900'),
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

function renderHub() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <ConfirmDialogProvider>
        <MemoryRouter initialEntries={['/oversikt']}>
          <HubOverview />
        </MemoryRouter>
      </ConfirmDialogProvider>
    </QueryClientProvider>
  )
}

/** Wait for layout query to resolve — 7 widget size-toggle groups (1 XL + 6 summary) */
async function waitForLayoutReady() {
  await waitFor(
    () =>
      expect(
        screen.getAllByRole('group', { name: 'Välj widgetstorlek' }).length
      ).toBeGreaterThanOrEqual(7),
    { timeout: 5000 }
  )
}

// ---------------------------------------------------------------------------
// Tests α–ν (Plan 05 / HUB-05 — Översikt integration)
// ---------------------------------------------------------------------------
describe('HubOverview integration — α–ν', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    upsertSpy.mockClear()
    selectChain.eq.mockClear()
    selectChain.maybeSingle.mockResolvedValue({ data: null, error: null })
    trackingMock.mockClear()
    stubProfile = { onboarded_hubs: [], full_name: 'Anna Karlsson' }
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  async function renderAndWait() {
    renderHub()
    await waitForLayoutReady()
    await act(async () => {
      await Promise.resolve()
    })
  }

  // α — Anpassa vy button
  it('α: Anpassa vy button is rendered in PageLayout actions slot', async () => {
    renderHub()
    const btn = await screen.findByRole('button', { name: /Anpassa vy/i })
    expect(btn).toBeInTheDocument()
  })

  // β — toggle editMode
  it('β: clicking Anpassa vy toggles editMode (aria-pressed)', async () => {
    const user = userEvent.setup()
    renderHub()
    const btn = await screen.findByRole('button', { name: /Anpassa vy/i })
    expect(btn).toHaveAttribute('aria-pressed', 'false')
    await user.click(btn)
    expect(btn).toHaveAttribute('aria-pressed', 'true')
    await user.click(btn)
    expect(btn).toHaveAttribute('aria-pressed', 'false')
  })

  // γ — 7 hide buttons in edit mode
  it('γ: when editMode is on, each widget renders its hide button (7 total)', async () => {
    const user = userEvent.setup()
    await renderAndWait()
    const btn = screen.getByRole('button', { name: /Anpassa vy/i })
    await user.click(btn)
    await waitFor(
      () => {
        const hideButtons = screen.getAllByRole('button', {
          name: /^Dölj widget /,
        })
        expect(hideButtons.length).toBe(7)
      },
      { timeout: 5000 }
    )
  }, 15000)

  // δ — hide widget removes from grid
  it('δ: clicking a widget hide button removes it from grid (CUST-01)', async () => {
    const user = userEvent.setup()
    await renderAndWait()
    expect(screen.getByRole('heading', { level: 3, name: 'Välkommen' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Anpassa vy/i }))
    await waitFor(
      () =>
        expect(
          screen.getByRole('button', { name: 'Dölj widget Välkommen' })
        ).toBeInTheDocument(),
      { timeout: 5000 }
    )
    await user.click(screen.getByRole('button', { name: 'Dölj widget Välkommen' }))
    await waitFor(() => {
      expect(
        screen.queryByRole('heading', { level: 3, name: 'Välkommen' })
      ).not.toBeInTheDocument()
    })
  }, 15000)

  // ε — Återvisa restores hidden widget
  it('ε: clicking Återvisa widget restores it to the grid (CUST-01)', async () => {
    const user = userEvent.setup()
    await renderAndWait()
    await user.click(screen.getByRole('button', { name: /Anpassa vy/i }))
    await waitFor(
      () =>
        expect(
          screen.getByRole('button', { name: 'Dölj widget Välkommen' })
        ).toBeInTheDocument(),
      { timeout: 5000 }
    )
    await user.click(screen.getByRole('button', { name: 'Dölj widget Välkommen' }))
    await waitFor(() => {
      expect(
        screen.queryByRole('heading', { level: 3, name: 'Välkommen' })
      ).not.toBeInTheDocument()
    })
    await user.click(screen.getByRole('button', { name: /Anpassa vy/i }))
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Återvisa widget Välkommen' })
      ).toBeInTheDocument()
    })
    await user.click(screen.getByRole('button', { name: 'Återvisa widget Välkommen' }))
    await waitFor(
      () =>
        expect(
          screen.getByRole('heading', { level: 3, name: 'Välkommen' })
        ).toBeInTheDocument(),
      { timeout: 5000 }
    )
  }, 20000)

  // ζ — Återställ standardlayout opens dialog
  it('ζ: Återställ standardlayout opens ConfirmDialog with locked Swedish copy', async () => {
    const user = userEvent.setup()
    renderHub()
    await screen.findByRole('heading', { level: 4, name: 'Idag' })
    await user.click(screen.getByRole('button', { name: /Anpassa vy/i }))
    const resetBtn = await screen.findByRole('button', {
      name: /Återställ standardlayout/i,
    })
    await user.click(resetBtn)
    await waitFor(() => {
      expect(screen.getByText('Återställ layout?')).toBeInTheDocument()
      expect(
        screen.getByText('Är du säker? Detta tar bort alla anpassningar för denna hub.')
      ).toBeInTheDocument()
    })
  })

  // η — confirm reset restores all 7 widgets
  it('η: confirming reset restores all 7 widgets to default (CUST-02)', async () => {
    const user = userEvent.setup()
    await renderAndWait()
    await user.click(screen.getByRole('button', { name: /Anpassa vy/i }))
    await waitFor(
      () =>
        expect(
          screen.getByRole('button', { name: 'Dölj widget Välkommen' })
        ).toBeInTheDocument(),
      { timeout: 5000 }
    )
    await user.click(screen.getByRole('button', { name: 'Dölj widget Välkommen' }))
    await waitFor(() => {
      expect(
        screen.queryByRole('heading', { level: 3, name: 'Välkommen' })
      ).not.toBeInTheDocument()
    })
    await user.click(screen.getByRole('button', { name: /Anpassa vy/i }))
    const resetBtn = await screen.findByRole('button', {
      name: /Återställ standardlayout/i,
    })
    await user.click(resetBtn)
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
    const dialog = screen.getByRole('dialog')
    const confirmBtn = Array.from(dialog.querySelectorAll('button')).find(
      b => b.textContent?.trim() === 'Återställ'
    )
    expect(confirmBtn).toBeTruthy()
    await user.click(confirmBtn!)
    await waitFor(
      () =>
        expect(
          screen.getByRole('heading', { level: 3, name: 'Välkommen' })
        ).toBeInTheDocument(),
      { timeout: 5000 }
    )
  }, 20000)

  // θ — cancel reset leaves layout unchanged
  it('θ: cancelling reset dialog leaves layout unchanged', async () => {
    const user = userEvent.setup()
    await renderAndWait()
    await user.click(screen.getByRole('button', { name: /Anpassa vy/i }))
    await waitFor(
      () =>
        expect(
          screen.getByRole('button', { name: 'Dölj widget Välkommen' })
        ).toBeInTheDocument(),
      { timeout: 5000 }
    )
    await user.click(screen.getByRole('button', { name: 'Dölj widget Välkommen' }))
    await waitFor(() => {
      expect(
        screen.queryByRole('heading', { level: 3, name: 'Välkommen' })
      ).not.toBeInTheDocument()
    })
    await user.click(screen.getByRole('button', { name: /Anpassa vy/i }))
    const resetBtn = await screen.findByRole('button', {
      name: /Återställ standardlayout/i,
    })
    await user.click(resetBtn)
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
    const dialog = screen.getByRole('dialog')
    const cancelBtn = Array.from(dialog.querySelectorAll('button')).find(
      b => b.textContent?.trim() === 'Avbryt'
    )
    expect(cancelBtn).toBeTruthy()
    await user.click(cancelBtn!)
    expect(
      screen.queryByRole('heading', { level: 3, name: 'Välkommen' })
    ).not.toBeInTheDocument()
  }, 20000)

  // ι — upsert payload contains hub_id='oversikt'
  it("ι: hide action calls supabase upsert with hub_id='oversikt' and breakpoint='desktop'", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) })
    renderHub()
    await act(async () => {
      await Promise.resolve()
    })
    await waitFor(
      () =>
        expect(screen.getByRole('button', { name: /Anpassa vy/i })).toBeInTheDocument(),
      { timeout: 5000 }
    )
    await user.click(screen.getByRole('button', { name: /Anpassa vy/i }))
    await waitFor(
      () =>
        expect(
          screen.getByRole('button', { name: 'Dölj widget Välkommen' })
        ).toBeInTheDocument(),
      { timeout: 5000 }
    )
    await user.click(screen.getByRole('button', { name: 'Dölj widget Välkommen' }))
    await act(async () => {
      vi.advanceTimersByTime(1100)
      await Promise.resolve()
    })
    await waitFor(() => expect(upsertSpy).toHaveBeenCalled(), { timeout: 3000 })
    const firstCallArg = upsertSpy.mock.calls[0][0] as Record<string, unknown>
    expect(firstCallArg).toMatchObject({ hub_id: 'oversikt', breakpoint: 'desktop' })
  }, 15000)

  // κ — all 7 widget headings render
  it('κ: all 7 Översikt widget headings render (HUB-05 acceptance)', async () => {
    renderHub()
    await waitFor(
      () => {
        expect(screen.getByRole('heading', { level: 3, name: 'Välkommen' })).toBeInTheDocument()
        expect(screen.getByRole('heading', { level: 3, name: 'Söka jobb' })).toBeInTheDocument()
        expect(screen.getByRole('heading', { level: 3, name: 'CV' })).toBeInTheDocument()
        expect(screen.getByRole('heading', { level: 3, name: 'Intervju' })).toBeInTheDocument()
        expect(screen.getByRole('heading', { level: 3, name: 'Karriärmål' })).toBeInTheDocument()
        expect(screen.getByRole('heading', { level: 3, name: 'Hälsa' })).toBeInTheDocument()
        expect(screen.getByRole('heading', { level: 3, name: 'Dagbok' })).toBeInTheDocument()
      },
      { timeout: 5000 }
    )
  })

  // λ — aria-live announces "Widget Välkommen dold"
  it('λ: aria-live region announces "Widget Välkommen dold" when onboarding-xl is hidden', async () => {
    const user = userEvent.setup()
    await renderAndWait()
    await user.click(screen.getByRole('button', { name: /Anpassa vy/i }))
    await waitFor(
      () =>
        expect(
          screen.getByRole('button', { name: 'Dölj widget Välkommen' })
        ).toBeInTheDocument(),
      { timeout: 5000 }
    )
    await user.click(screen.getByRole('button', { name: 'Dölj widget Välkommen' }))
    await waitFor(() => {
      const liveRegion = document.querySelector(
        '[role="status"][aria-live="polite"]'
      )!
      expect(liveRegion.textContent).toBe('Widget Välkommen dold')
    })
  }, 15000)

  // μ1 — new-user state when onboarded_hubs=[]
  it('μ1: OnboardingWidget renders "Välkommen till din portal" when onboarded_hubs=[]', async () => {
    stubProfile = { onboarded_hubs: [], full_name: 'Anna Karlsson' }
    renderHub()
    await waitFor(
      () => expect(screen.getByText(/Välkommen till din portal/)).toBeInTheDocument(),
      { timeout: 5000 }
    )
  })

  // μ2 — returning-user state when onboarded_hubs=['jobb']
  it("μ2: OnboardingWidget renders 'Bra jobbat Anna!' when onboarded_hubs=['jobb']", async () => {
    stubProfile = { onboarded_hubs: ['jobb'], full_name: 'Anna Karlsson' }
    renderHub()
    await waitFor(
      () => expect(screen.getByText('Bra jobbat Anna!')).toBeInTheDocument(),
      { timeout: 5000 }
    )
  })

  // ν — useOnboardedHubsTracking is invoked with 'oversikt'
  it("ν: useOnboardedHubsTracking is invoked once with 'oversikt' on mount", async () => {
    renderHub()
    await waitFor(() => expect(trackingMock).toHaveBeenCalled())
    expect(trackingMock).toHaveBeenCalledWith('oversikt')
  })
})
