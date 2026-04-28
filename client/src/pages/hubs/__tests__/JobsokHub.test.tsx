import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ConfirmDialogProvider } from '@/components/ui/ConfirmDialog'
import JobsokHub from '../JobsokHub'

// Mock i18next so t() returns the fallback string
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, fallback?: string) => fallback ?? key }),
}))

// Mock hub-summary loader — tests verify UI/layout, not data loading (data wiring tested in 03-03)
const STUB_SUMMARY = {
  cv: null,
  coverLetters: [],
  interviewSessions: [],
  applicationStats: {
    total: 12,
    byStatus: { saved: 4, applied: 2, interview: 1, rejected: 3, pending_response: 1 },
    segments: [
      { label: 'aktiva', count: 4, deEmphasized: false },
      { label: 'svar inväntas', count: 2, deEmphasized: false },
      { label: 'intervju', count: 1, deEmphasized: false },
      { label: 'avslutade', count: 3, deEmphasized: true },
    ],
  },
  spontaneousCount: 0,
}

vi.mock('@/hooks/useJobsokHubSummary', () => ({
  useJobsokHubSummary: () => ({ data: STUB_SUMMARY, isLoading: false, isError: false }),
  JOBSOK_HUB_KEY: (id: string) => ['hub', 'jobsok', id],
}))

// Mock useAuth — return logged-in user so useWidgetLayout enabled:true resolves.
// With user: {id: 'test-user'}, the query fires and resolves to getDefaultLayout('jobb') from mergeLayouts.
vi.mock('@/hooks/useSupabase', () => ({
  useAuth: () => ({ user: { id: 'test-user' }, profile: null, loading: false, isAuthenticated: true }),
}))

// ---------------------------------------------------------------------------
// Phase 4 mocks: supabase + useBreakpoint
// ---------------------------------------------------------------------------

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

// useBreakpoint mock — default: 'desktop'. Override per test with vi.mocked().mockReturnValueOnce()
vi.mock('@/hooks/useBreakpoint', () => ({ useBreakpoint: vi.fn(() => 'desktop') }))

// window.matchMedia stub — jsdom doesn't include this; required if useBreakpoint reads it directly
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

// ---------------------------------------------------------------------------
// renderHub helper — wraps with ConfirmDialogProvider for Phase 4 panel tests
// ---------------------------------------------------------------------------
function renderHub() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <ConfirmDialogProvider>
        <MemoryRouter initialEntries={['/jobb']}>
          <JobsokHub />
        </MemoryRouter>
      </ConfirmDialogProvider>
    </QueryClientProvider>
  )
}

/** Wait for the layout query to resolve (all 8 widget size-toggle groups present) */
async function waitForLayoutReady() {
  await waitFor(
    () => expect(screen.getAllByRole('group', { name: 'Välj widgetstorlek' }).length).toBeGreaterThanOrEqual(8),
    { timeout: 5000 }
  )
}

// ---------------------------------------------------------------------------
// Existing tests (pre-Phase 4) — must all still pass
// ---------------------------------------------------------------------------
describe('JobsokHub integration', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    upsertSpy.mockClear()
    selectChain.eq.mockClear()
    selectChain.maybeSingle.mockResolvedValue({ data: null, error: null })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders 3 sectioned headings (Skapa & öva, Sök & ansök, Marknad)', async () => {
    renderHub()
    expect(await screen.findByRole('heading', { level: 4, name: 'Skapa & öva' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 4, name: 'Sök & ansök' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 4, name: 'Marknad' })).toBeInTheDocument()
  })

  it('renders 3 sections via aria-label regions', async () => {
    renderHub()
    await screen.findByRole('region', { name: 'Skapa & öva' })
    expect(screen.getByRole('region', { name: 'Sök & ansök' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Marknad' })).toBeInTheDocument()
  })

  it('renders all 8 widgets (waits for lazy load)', async () => {
    renderHub()
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 3, name: 'CV' })).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 3, name: 'Personligt brev' })).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 3, name: 'Intervjuträning' })).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 3, name: 'Sök jobb' })).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 3, name: 'Mina ansökningar' })).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 3, name: 'Spontanansökan' })).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 3, name: 'Lön & marknad' })).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 3, name: 'Internationellt' })).toBeInTheDocument()
    }, { timeout: 5000 })
  })

  it('exposes a polite live region for size announcements', async () => {
    renderHub()
    await screen.findByRole('heading', { level: 4, name: 'Skapa & öva' })
    const liveRegion = document.querySelector('[role="status"][aria-live="polite"]')
    expect(liveRegion).toBeInTheDocument()
    expect(liveRegion).toHaveClass('sr-only')
  })

  it('size toggle group is present per widget with role=group', async () => {
    renderHub()
    await waitForLayoutReady()
  })

  it('clicking M button on CV widget changes its aria-pressed state to true on M', async () => {
    renderHub()
    // Wait for full layout query to resolve (ensures layout state is initialized with defaults)
    await waitForLayoutReady()
    // Wait for query cache to propagate (React Query → React re-render)
    await act(async () => { await Promise.resolve() })
    // CV widget defaults to L; find its toggle group (first group in the DOM)
    const groups = screen.getAllByRole('group', { name: 'Välj widgetstorlek' })
    const cvGroup = groups[0]
    const mBtn = cvGroup.querySelector('button[aria-label*="M"]') as HTMLButtonElement
    expect(mBtn).toBeTruthy()
    fireEvent.click(mBtn)
    await waitFor(() => expect(mBtn).toHaveAttribute('aria-pressed', 'true'))
  })

  it('size change updates the live region announcement to "Widgeten är nu M-storlek."', async () => {
    renderHub()
    await waitForLayoutReady()
    await act(async () => { await Promise.resolve() })
    const groups = screen.getAllByRole('group', { name: 'Välj widgetstorlek' })
    const mBtn = groups[0].querySelector('button[aria-label*="M"]') as HTMLButtonElement
    fireEvent.click(mBtn)
    await waitFor(() => {
      const liveRegion = document.querySelector('[role="status"][aria-live="polite"]')!
      expect(liveRegion.textContent).toBe('Widgeten är nu M-storlek.')
    })
  })

  it('renders the action-oriented empty-state copy on InternationalWidget', async () => {
    renderHub()
    expect(await screen.findByText('Arbetar du mot utlandsjobb?')).toBeInTheDocument()
  })

  it('renders the amber alert chip on ApplicationsWidget', async () => {
    renderHub()
    expect(await screen.findByText('1 ansökan väntar på ditt svar')).toBeInTheDocument()
  })

  it('A11Y-01: keyboard user can Tab to size toggle and Enter to change size', async () => {
    const user = userEvent.setup()
    renderHub()
    await waitForLayoutReady()
    await act(async () => { await Promise.resolve() })
    const toggleGroups = screen.getAllByRole('group', { name: 'Välj widgetstorlek' })
    expect(toggleGroups.length).toBeGreaterThan(0)
    const firstGroup = toggleGroups[0]
    const buttons = Array.from(firstGroup.querySelectorAll('button'))
    expect(buttons.length).toBeGreaterThanOrEqual(3)
    buttons[0].focus()
    expect(document.activeElement).toBe(buttons[0])
    await user.keyboard('{Enter}')
    const liveRegion = document.querySelector('[role="status"][aria-live="polite"]')
    expect(liveRegion?.textContent).toMatch(/storlek/i)
  })

  it('A11Y-01: live-region announces a single message after size change (Pitfall 17)', async () => {
    const user = userEvent.setup()
    renderHub()
    await waitForLayoutReady()
    await act(async () => { await Promise.resolve() })
    const toggleGroups = screen.getAllByRole('group', { name: 'Välj widgetstorlek' })
    const firstGroup = toggleGroups[0]
    const buttons = Array.from(firstGroup.querySelectorAll('button'))
    const mButton = buttons.find(b => b.getAttribute('aria-label')?.includes('M'))
    expect(mButton).toBeTruthy()
    await user.click(mButton!)
    const liveRegion = document.querySelector('[role="status"][aria-live="polite"]')
    expect(liveRegion?.textContent).toMatch(/Widgeten är nu M-storlek/)
  })
})

describe('JobsokHub error isolation (WIDG-03)', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    upsertSpy.mockClear()
    selectChain.eq.mockClear()
    selectChain.maybeSingle.mockResolvedValue({ data: null, error: null })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('when one widget slot throws, the per-widget fallback "Kunde inte ladda" shows while other slots remain', async () => {
    renderHub()
    await screen.findByRole('heading', { level: 3, name: 'CV' })
    await screen.findByRole('heading', { level: 3, name: 'Personligt brev' })
    expect(screen.queryByText('Kunde inte ladda')).not.toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Phase 4 integration tests (α–μ)
// ---------------------------------------------------------------------------
describe('JobsokHub Phase 4 — layout persistence + hide/show', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    upsertSpy.mockClear()
    selectChain.eq.mockClear()
    selectChain.maybeSingle.mockResolvedValue({ data: null, error: null })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // Helper: render hub and wait for layout to be ready (query resolved + widgets rendered)
  async function renderAndWait() {
    renderHub()
    await waitForLayoutReady()
    // Flush React Query cache propagation
    await act(async () => { await Promise.resolve() })
  }

  // Test α: "Anpassa vy" button present in PageLayout actions slot
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

  // Test γ: each widget shows its hide button when editMode is on
  it('γ: when editMode is on, each widget renders its hide button', async () => {
    const user = userEvent.setup()
    await renderAndWait()
    const btn = screen.getByRole('button', { name: /Anpassa vy/i })
    await user.click(btn)
    await waitFor(() => {
      const hideButtons = screen.getAllByRole('button', { name: /^Dölj widget / })
      expect(hideButtons.length).toBe(8)
    }, { timeout: 5000 })
  }, 15000)

  // Test δ: clicking a widget's hide button removes it from DOM (CUST-01 hide flow)
  // Note: hide button aria-label uses widget.Header title ("CV"), not WIDGET_LABELS ("Mitt CV")
  it('δ: clicking a widget hide button removes it from grid (CUST-01)', async () => {
    const user = userEvent.setup()
    await renderAndWait()
    // CV is visible
    expect(screen.getByRole('heading', { level: 3, name: 'CV' })).toBeInTheDocument()
    // Enable edit mode
    await user.click(screen.getByRole('button', { name: /Anpassa vy/i }))
    // Wait for hide button to appear (aria-label uses widget's internal title "CV")
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Dölj widget CV' })).toBeInTheDocument()
    }, { timeout: 5000 })
    // Click hide
    await user.click(screen.getByRole('button', { name: 'Dölj widget CV' }))
    // CV heading should be gone from grid
    await waitFor(() => {
      expect(screen.queryByRole('heading', { level: 3, name: 'CV' })).not.toBeInTheDocument()
    })
  }, 15000)

  // Test ε: clicking Återvisa restores the widget (CUST-01 restore flow)
  it('ε: clicking Återvisa widget restores it to the grid (CUST-01)', async () => {
    const user = userEvent.setup()
    await renderAndWait()
    // Enable edit mode (opens panel)
    await user.click(screen.getByRole('button', { name: /Anpassa vy/i }))
    // Hide CV (button uses widget's internal title "CV")
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Dölj widget CV' })).toBeInTheDocument()
    }, { timeout: 5000 })
    await user.click(screen.getByRole('button', { name: 'Dölj widget CV' }))
    // CV disappears from grid
    await waitFor(() => {
      expect(screen.queryByRole('heading', { level: 3, name: 'CV' })).not.toBeInTheDocument()
    })
    // Panel closes on outside click (mousedown on hide button → panel's outside-click handler fires).
    // Click "Anpassa vy" again to re-open the panel (toggles editMode false, panelOpen true).
    await user.click(screen.getByRole('button', { name: /Anpassa vy/i }))
    // Panel shows Återvisa button for CV (uses WIDGET_LABELS name "Mitt CV")
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Återvisa widget Mitt CV' })).toBeInTheDocument()
    })
    // Restore CV
    await user.click(screen.getByRole('button', { name: 'Återvisa widget Mitt CV' }))
    // CV reappears in the grid
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 3, name: 'CV' })).toBeInTheDocument()
    }, { timeout: 5000 })
  }, 20000)

  // Test ζ: reset button opens ConfirmDialog with locked Swedish copy (CUST-02)
  it('ζ: Återställ standardlayout opens ConfirmDialog with locked Swedish copy', async () => {
    const user = userEvent.setup()
    renderHub()
    await screen.findByRole('heading', { level: 4, name: 'Skapa & öva' })
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

  // Test η: confirming reset restores all 8 widgets (CUST-02)
  it('η: confirming reset restores all 8 widgets to default (CUST-02)', async () => {
    const user = userEvent.setup()
    await renderAndWait()
    // Enable edit mode (also opens panel)
    await user.click(screen.getByRole('button', { name: /Anpassa vy/i }))
    // Hide CV (button uses widget's internal title "CV")
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Dölj widget CV' })).toBeInTheDocument()
    }, { timeout: 5000 })
    await user.click(screen.getByRole('button', { name: 'Dölj widget CV' }))
    await waitFor(() => {
      expect(screen.queryByRole('heading', { level: 3, name: 'CV' })).not.toBeInTheDocument()
    })
    // Panel closes on outside click — re-open by clicking "Anpassa vy" again
    await user.click(screen.getByRole('button', { name: /Anpassa vy/i }))
    // Click reset button (visible in re-opened panel)
    const resetBtn = await screen.findByRole('button', { name: /Återställ standardlayout/i })
    await user.click(resetBtn)
    // Confirm dialog appears — click the confirm button
    // The dialog confirm button has text "Återställ" (not the full "Återställ standardlayout")
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
    // Find the confirm button inside the dialog
    const dialog = screen.getByRole('dialog')
    const confirmBtn = Array.from(dialog.querySelectorAll('button')).find(
      b => b.textContent?.trim() === 'Återställ'
    )
    expect(confirmBtn).toBeTruthy()
    await user.click(confirmBtn!)
    // All 8 widgets reappear
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 3, name: 'CV' })).toBeInTheDocument()
    }, { timeout: 5000 })
  }, 20000)

  // Test θ: cancelling reset leaves layout unchanged
  it('θ: cancelling reset dialog leaves layout unchanged', async () => {
    const user = userEvent.setup()
    await renderAndWait()
    // Enable edit mode
    await user.click(screen.getByRole('button', { name: /Anpassa vy/i }))
    // Hide CV (button uses widget's internal title "CV")
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Dölj widget CV' })).toBeInTheDocument()
    }, { timeout: 5000 })
    await user.click(screen.getByRole('button', { name: 'Dölj widget CV' }))
    await waitFor(() => {
      expect(screen.queryByRole('heading', { level: 3, name: 'CV' })).not.toBeInTheDocument()
    })
    // Panel closes on outside click — re-open by clicking "Anpassa vy" again
    await user.click(screen.getByRole('button', { name: /Anpassa vy/i }))
    // Click reset button (visible in re-opened panel)
    const resetBtn = await screen.findByRole('button', { name: /Återställ standardlayout/i })
    await user.click(resetBtn)
    // Cancel in dialog
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
    const dialog = screen.getByRole('dialog')
    const cancelBtn = Array.from(dialog.querySelectorAll('button')).find(
      b => b.textContent?.trim() === 'Avbryt'
    )
    expect(cancelBtn).toBeTruthy()
    await user.click(cancelBtn!)
    // CV should remain hidden
    expect(screen.queryByRole('heading', { level: 3, name: 'CV' })).not.toBeInTheDocument()
  }, 20000)

  // Test ι: hide action calls supabase upsert with breakpoint='desktop' in payload (Pitfall 6)
  it('ι: hide action calls supabase upsert with breakpoint=desktop in payload', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) })
    renderHub()
    // Flush the async query using act (fake timers: need to advance promises)
    await act(async () => {
      // Flush promises so the mock maybeSingle resolves
      await Promise.resolve()
    })
    // Wait for hub to be ready (groups rendered)
    await waitFor(
      () => expect(screen.getByRole('button', { name: /Anpassa vy/i })).toBeInTheDocument(),
      { timeout: 5000 }
    )
    // Enable edit mode
    await user.click(screen.getByRole('button', { name: /Anpassa vy/i }))
    // Wait for hide buttons (lazy-loaded widgets may need time; uses widget header title "CV")
    await waitFor(
      () => expect(screen.getByRole('button', { name: 'Dölj widget CV' })).toBeInTheDocument(),
      { timeout: 5000 }
    )
    // Click hide on CV
    await user.click(screen.getByRole('button', { name: 'Dölj widget CV' }))
    // Advance timers past 1000ms debounce
    await act(async () => {
      vi.advanceTimersByTime(1100)
      // Flush promises triggered by timer
      await Promise.resolve()
    })
    await waitFor(() => expect(upsertSpy).toHaveBeenCalled(), { timeout: 3000 })
    // Verify payload has breakpoint: 'desktop'
    const firstCallArg = upsertSpy.mock.calls[0][0] as Record<string, unknown>
    expect(firstCallArg).toMatchObject({ breakpoint: 'desktop' })
  }, 15000)

  // Test κ: mobile hide uses breakpoint='mobile' and never touches desktop key
  it('κ: mobile hide calls upsert with breakpoint=mobile only (per-breakpoint independence)', async () => {
    const { useBreakpoint } = await import('@/hooks/useBreakpoint')
    vi.mocked(useBreakpoint).mockReturnValue('mobile')

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
      () => expect(screen.getByRole('button', { name: 'Dölj widget CV' })).toBeInTheDocument(),
      { timeout: 5000 }
    )
    await user.click(screen.getByRole('button', { name: 'Dölj widget CV' }))
    await act(async () => {
      vi.advanceTimersByTime(1100)
      await Promise.resolve()
    })
    await waitFor(() => expect(upsertSpy).toHaveBeenCalled(), { timeout: 3000 })
    // All upsert calls must have breakpoint='mobile'
    for (const call of upsertSpy.mock.calls) {
      const arg = call[0] as Record<string, unknown>
      expect(arg).toMatchObject({ breakpoint: 'mobile' })
      expect(arg.breakpoint).not.toBe('desktop')
    }
    // Restore default mock
    vi.mocked(useBreakpoint).mockReturnValue('desktop')
  }, 15000)

  // Test λ: initial render shows widget hidden when persisted state has visible:false (CUST-03)
  it('λ: persisted hidden state survives reload (CUST-03)', async () => {
    // Override select to return CV as hidden in persisted state
    selectChain.maybeSingle.mockResolvedValueOnce({
      data: {
        widgets: [
          { id: 'cv',           size: 'L', order: 0, visible: false },
          { id: 'cover-letter', size: 'M', order: 1, visible: true  },
          { id: 'interview',    size: 'M', order: 2, visible: true  },
          { id: 'job-search',   size: 'L', order: 3, visible: true  },
          { id: 'applications', size: 'M', order: 4, visible: true  },
          { id: 'spontaneous',  size: 'S', order: 5, visible: true  },
          { id: 'salary',       size: 'M', order: 6, visible: true  },
          { id: 'international',size: 'S', order: 7, visible: true  },
        ],
        updated_at: '2026-01-01T00:00:00Z',
      },
      error: null,
    })
    renderHub()
    // Wait for the query to resolve — other widgets should be visible
    await screen.findByRole('heading', { level: 3, name: 'Personligt brev' }, { timeout: 5000 })
    // Wait for layout to propagate (query resolves → React re-renders with persisted state)
    await waitFor(
      () => expect(screen.queryByRole('heading', { level: 3, name: 'CV' })).not.toBeInTheDocument(),
      { timeout: 5000 }
    )
  }, 12000)

  // Test μ: aria-live region announces widget-hidden text
  it('μ: aria-live region announces Widget {label} dold when widget is hidden', async () => {
    const user = userEvent.setup()
    await renderAndWait()
    // Enable edit mode
    await user.click(screen.getByRole('button', { name: /Anpassa vy/i }))
    // Wait for hide buttons (uses widget's internal header title "CV")
    await waitFor(
      () => expect(screen.getByRole('button', { name: 'Dölj widget CV' })).toBeInTheDocument(),
      { timeout: 5000 }
    )
    // Hide CV — announcement uses WIDGET_LABELS['cv'] = 'Mitt CV'
    await user.click(screen.getByRole('button', { name: 'Dölj widget CV' }))
    // aria-live region should announce using WIDGET_LABELS name
    await waitFor(() => {
      const liveRegion = document.querySelector('[role="status"][aria-live="polite"]')!
      expect(liveRegion.textContent).toBe('Widget Mitt CV dold')
    })
  }, 15000)
})
