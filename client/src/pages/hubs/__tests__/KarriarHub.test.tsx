import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ConfirmDialogProvider } from '@/components/ui/ConfirmDialog'
import KarriarHub from '../KarriarHub'

// Mock i18next so t() returns the fallback string
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, fallback?: string) => fallback ?? key }),
}))

// Mock hub-summary loader — tests verify UI/layout, not data loading
const STUB_SUMMARY = {
  careerGoals: { shortTerm: 'Senior UX' },
  linkedinUrl: null,
  latestSkillsAnalysis: null,
  latestBrandAudit: null,
}

vi.mock('@/hooks/useKarriarHubSummary', () => ({
  useKarriarHubSummary: () => ({ data: STUB_SUMMARY, isLoading: false, isError: false }),
  KARRIAR_HUB_KEY: (id: string) => ['hub', 'karriar', id],
}))

// Plan 05 (HUB-05): mock useOnboardedHubsTracking so the real hook does not
// hit supabase.update.
vi.mock('@/hooks/useOnboardedHubsTracking', () => ({
  useOnboardedHubsTracking: vi.fn(),
}))

// Mock useAuth — return logged-in user so useWidgetLayout enabled:true resolves
vi.mock('@/hooks/useSupabase', () => ({
  useAuth: () => ({ user: { id: 'test-user' }, profile: null, loading: false, isAuthenticated: true }),
}))

// Mock useInterestProfile — InterestGuideWidget reads this directly (Pitfall F)
vi.mock('@/hooks/useInterestProfile', () => ({
  useInterestProfile: () => ({
    profile: {
      hasResult: false,
      riasecScores: null,
      dominantTypes: [],
      recommendedOccupations: [],
      completedAt: null,
    },
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }),
}))

// Supabase mock — default: select returns null (no persisted layout), upsert resolves ok
const upsertSpy = vi.fn().mockResolvedValue({ error: null })
const selectChain = {
  eq: vi.fn().mockReturnThis(),
  maybeSingle: vi.fn<[], Promise<{ data: unknown; error: null }>>().mockResolvedValue({ data: null, error: null }),
}

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => selectChain),
      upsert: upsertSpy,
    })),
  },
}))

// useBreakpoint mock
vi.mock('@/hooks/useBreakpoint', () => ({ useBreakpoint: vi.fn(() => 'desktop') }))

// window.matchMedia stub
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

// renderHub helper
function renderHub() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <ConfirmDialogProvider>
        <MemoryRouter initialEntries={['/karriar']}>
          <KarriarHub />
        </MemoryRouter>
      </ConfirmDialogProvider>
    </QueryClientProvider>
  )
}

/** Wait for layout query to resolve — 6 widget size-toggle groups present */
async function waitForLayoutReady() {
  await waitFor(
    () => expect(screen.getAllByRole('group', { name: 'Välj widgetstorlek' }).length).toBeGreaterThanOrEqual(6),
    { timeout: 5000 }
  )
}

// ---------------------------------------------------------------------------
// Tests α–λ (Phase 5 Karriär integration)
// ---------------------------------------------------------------------------
describe('KarriarHub integration — α–λ', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    upsertSpy.mockClear()
    selectChain.eq.mockClear()
    selectChain.maybeSingle.mockResolvedValue({ data: null, error: null })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  async function renderAndWait() {
    renderHub()
    await waitForLayoutReady()
    await act(async () => { await Promise.resolve() })
  }

  // Test α: "Anpassa vy" button present
  it('α: Anpassa vy button is rendered in PageLayout actions slot', async () => {
    renderHub()
    const btn = await screen.findByRole('button', { name: /Anpassa vy/i })
    expect(btn).toBeInTheDocument()
  })

  // Test β: clicking toggles editMode (aria-pressed)
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

  // Test γ: 6 hide buttons appear in edit mode (one per widget)
  it('γ: when editMode is on, each widget renders its hide button (6 total)', async () => {
    const user = userEvent.setup()
    await renderAndWait()
    const btn = screen.getByRole('button', { name: /Anpassa vy/i })
    await user.click(btn)
    await waitFor(() => {
      const hideButtons = screen.getAllByRole('button', { name: /^Dölj widget / })
      expect(hideButtons.length).toBe(6)
    }, { timeout: 5000 })
  }, 15000)

  // Test δ: clicking hide button removes widget from grid (CUST-01 hide flow)
  it('δ: clicking a widget hide button removes it from grid (CUST-01)', async () => {
    const user = userEvent.setup()
    await renderAndWait()
    // Karriärmål widget is visible
    expect(screen.getByRole('heading', { level: 3, name: 'Karriärmål' })).toBeInTheDocument()
    // Enable edit mode
    await user.click(screen.getByRole('button', { name: /Anpassa vy/i }))
    // Wait for hide button (uses widget's internal title "Karriärmål")
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Dölj widget Karriärmål' })).toBeInTheDocument()
    }, { timeout: 5000 })
    // Click hide
    await user.click(screen.getByRole('button', { name: 'Dölj widget Karriärmål' }))
    // Karriärmål heading should be gone
    await waitFor(() => {
      expect(screen.queryByRole('heading', { level: 3, name: 'Karriärmål' })).not.toBeInTheDocument()
    })
  }, 15000)

  // Test ε: clicking Återvisa restores hidden widget (CUST-01 restore flow)
  it('ε: clicking Återvisa widget restores it to the grid (CUST-01)', async () => {
    const user = userEvent.setup()
    await renderAndWait()
    // Enable edit mode
    await user.click(screen.getByRole('button', { name: /Anpassa vy/i }))
    // Hide Karriärmål
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Dölj widget Karriärmål' })).toBeInTheDocument()
    }, { timeout: 5000 })
    await user.click(screen.getByRole('button', { name: 'Dölj widget Karriärmål' }))
    await waitFor(() => {
      expect(screen.queryByRole('heading', { level: 3, name: 'Karriärmål' })).not.toBeInTheDocument()
    })
    // Re-open panel
    await user.click(screen.getByRole('button', { name: /Anpassa vy/i }))
    // Panel shows Återvisa button using WIDGET_LABELS name "Karriärmål"
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Återvisa widget Karriärmål' })).toBeInTheDocument()
    })
    // Restore
    await user.click(screen.getByRole('button', { name: 'Återvisa widget Karriärmål' }))
    // Karriärmål reappears
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 3, name: 'Karriärmål' })).toBeInTheDocument()
    }, { timeout: 5000 })
  }, 20000)

  // Test ζ: Återställ button opens ConfirmDialog (CUST-02)
  it('ζ: Återställ standardlayout opens ConfirmDialog with locked Swedish copy', async () => {
    const user = userEvent.setup()
    renderHub()
    await screen.findByRole('heading', { level: 2, name: 'Utforska' })
    // Open panel
    await user.click(screen.getByRole('button', { name: /Anpassa vy/i }))
    // Click reset
    const resetBtn = await screen.findByRole('button', { name: /Återställ standardlayout/i })
    await user.click(resetBtn)
    // Dialog appears with locked copy
    await waitFor(() => {
      expect(screen.getByText('Återställ layout?')).toBeInTheDocument()
      expect(screen.getByText('Är du säker? Detta tar bort alla anpassningar för denna hub.')).toBeInTheDocument()
    })
  })

  // Test η: confirming reset restores all 6 widgets (CUST-02)
  it('η: confirming reset restores all 6 widgets to default (CUST-02)', async () => {
    const user = userEvent.setup()
    await renderAndWait()
    // Enable edit mode
    await user.click(screen.getByRole('button', { name: /Anpassa vy/i }))
    // Hide Karriärmål
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Dölj widget Karriärmål' })).toBeInTheDocument()
    }, { timeout: 5000 })
    await user.click(screen.getByRole('button', { name: 'Dölj widget Karriärmål' }))
    await waitFor(() => {
      expect(screen.queryByRole('heading', { level: 3, name: 'Karriärmål' })).not.toBeInTheDocument()
    })
    // Re-open panel
    await user.click(screen.getByRole('button', { name: /Anpassa vy/i }))
    const resetBtn = await screen.findByRole('button', { name: /Återställ standardlayout/i })
    await user.click(resetBtn)
    // Confirm
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
    const dialog = screen.getByRole('dialog')
    const confirmBtn = Array.from(dialog.querySelectorAll('button')).find(
      b => b.textContent?.trim() === 'Återställ'
    )
    expect(confirmBtn).toBeTruthy()
    await user.click(confirmBtn!)
    // Karriärmål reappears
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 3, name: 'Karriärmål' })).toBeInTheDocument()
    }, { timeout: 5000 })
  }, 20000)

  // Test θ: cancelling reset leaves layout unchanged
  it('θ: cancelling reset dialog leaves layout unchanged', async () => {
    const user = userEvent.setup()
    await renderAndWait()
    // Enable edit mode
    await user.click(screen.getByRole('button', { name: /Anpassa vy/i }))
    // Hide Karriärmål
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Dölj widget Karriärmål' })).toBeInTheDocument()
    }, { timeout: 5000 })
    await user.click(screen.getByRole('button', { name: 'Dölj widget Karriärmål' }))
    await waitFor(() => {
      expect(screen.queryByRole('heading', { level: 3, name: 'Karriärmål' })).not.toBeInTheDocument()
    })
    // Re-open panel
    await user.click(screen.getByRole('button', { name: /Anpassa vy/i }))
    const resetBtn = await screen.findByRole('button', { name: /Återställ standardlayout/i })
    await user.click(resetBtn)
    // Cancel
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
    const dialog = screen.getByRole('dialog')
    const cancelBtn = Array.from(dialog.querySelectorAll('button')).find(
      b => b.textContent?.trim() === 'Avbryt'
    )
    expect(cancelBtn).toBeTruthy()
    await user.click(cancelBtn!)
    // Karriärmål should remain hidden
    expect(screen.queryByRole('heading', { level: 3, name: 'Karriärmål' })).not.toBeInTheDocument()
  }, 20000)

  // Test ι: upsert payload contains hub_id='karriar' and breakpoint='desktop'
  it('ι: hide action calls supabase upsert with hub_id=karriar and breakpoint=desktop in payload', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) })
    renderHub()
    await act(async () => { await Promise.resolve() })
    await waitFor(
      () => expect(screen.getByRole('button', { name: /Anpassa vy/i })).toBeInTheDocument(),
      { timeout: 5000 }
    )
    await user.click(screen.getByRole('button', { name: /Anpassa vy/i }))
    await waitFor(
      () => expect(screen.getByRole('button', { name: 'Dölj widget Karriärmål' })).toBeInTheDocument(),
      { timeout: 5000 }
    )
    await user.click(screen.getByRole('button', { name: 'Dölj widget Karriärmål' }))
    await act(async () => {
      vi.advanceTimersByTime(1100)
      await Promise.resolve()
    })
    await waitFor(() => expect(upsertSpy).toHaveBeenCalled(), { timeout: 3000 })
    const firstCallArg = upsertSpy.mock.calls[0][0] as Record<string, unknown>
    expect(firstCallArg).toMatchObject({ hub_id: 'karriar', breakpoint: 'desktop' })
  }, 15000)

  // Test κ: with mocked fetch, all 6 widget icons render (HUB-02 acceptance)
  it('κ: all 6 Karriär widgets render (HUB-02 acceptance)', async () => {
    renderHub()
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 3, name: 'Karriärmål' })).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 3, name: 'Intresseguide' })).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 3, name: 'Kompetensgap' })).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 3, name: 'Personligt varumärke' })).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 3, name: 'Utbildning' })).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 3, name: 'LinkedIn' })).toBeInTheDocument()
    }, { timeout: 5000 })
  })

  // Test λ: aria-live announces "Widget Karriärmål dold" when Karriärmål is hidden
  it('λ: aria-live region announces Widget Karriärmål dold when karriar-mal is hidden', async () => {
    const user = userEvent.setup()
    await renderAndWait()
    // Enable edit mode
    await user.click(screen.getByRole('button', { name: /Anpassa vy/i }))
    // Wait for hide button
    await waitFor(
      () => expect(screen.getByRole('button', { name: 'Dölj widget Karriärmål' })).toBeInTheDocument(),
      { timeout: 5000 }
    )
    // Hide Karriärmål — announcement uses WIDGET_LABELS['karriar-mal'] = 'Karriärmål'
    await user.click(screen.getByRole('button', { name: 'Dölj widget Karriärmål' }))
    await waitFor(() => {
      const liveRegion = document.querySelector('[role="status"][aria-live="polite"]')!
      expect(liveRegion.textContent).toBe('Widget Karriärmål dold')
    })
  }, 15000)
})
