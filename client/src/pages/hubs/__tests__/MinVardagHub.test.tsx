import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ConfirmDialogProvider } from '@/components/ui/ConfirmDialog'
import MinVardagHub from '../MinVardagHub'

// Mock i18next so t() returns the fallback string
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, fallback?: string) => fallback ?? key }),
}))

// Mock hub-summary loader — tests verify UI/layout, not data loading
const STUB_SUMMARY = {
  recentMoodLogs: [{ mood_level: 4, energy_level: 3, log_date: '2026-04-27' }],
  diaryEntryCount: 0,
  latestDiaryEntry: null,
  upcomingEvents: [],
  networkContactsCount: 0,
  consultant: null,
}

vi.mock('@/hooks/useMinVardagHubSummary', () => ({
  useMinVardagHubSummary: () => ({
    data: STUB_SUMMARY,
    isLoading: false,
    isError: false,
  }),
  MIN_VARDAG_HUB_KEY: (id: string) => ['hub', 'min-vardag', id],
}))

// Mock useAuth — return logged-in user so useWidgetLayout enabled:true resolves
vi.mock('@/hooks/useSupabase', () => ({
  useAuth: () => ({
    user: { id: 'test-user' },
    profile: null,
    loading: false,
    isAuthenticated: true,
  }),
}))

// Supabase mock — default: select returns null (no persisted layout), upsert resolves ok
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

function renderHub() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <ConfirmDialogProvider>
        <MemoryRouter initialEntries={['/min-vardag']}>
          <MinVardagHub />
        </MemoryRouter>
      </ConfirmDialogProvider>
    </QueryClientProvider>
  )
}

/** Wait for layout query to resolve — 5 widget size-toggle groups present */
async function waitForLayoutReady() {
  await waitFor(
    () =>
      expect(
        screen.getAllByRole('group', { name: 'Välj widgetstorlek' }).length
      ).toBeGreaterThanOrEqual(5),
    { timeout: 5000 }
  )
}

// ---------------------------------------------------------------------------
// Tests α–λ (Phase 5 Min Vardag integration)
// ---------------------------------------------------------------------------
describe('MinVardagHub integration — α–λ', () => {
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
    await act(async () => {
      await Promise.resolve()
    })
  }

  // Test α
  it('α: Anpassa vy button is rendered in PageLayout actions slot', async () => {
    renderHub()
    const btn = await screen.findByRole('button', { name: /Anpassa vy/i })
    expect(btn).toBeInTheDocument()
  })

  // Test β
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

  // Test γ — 5 hide buttons in edit mode
  it('γ: when editMode is on, each widget renders its hide button (5 total)', async () => {
    const user = userEvent.setup()
    await renderAndWait()
    const btn = screen.getByRole('button', { name: /Anpassa vy/i })
    await user.click(btn)
    await waitFor(
      () => {
        const hideButtons = screen.getAllByRole('button', {
          name: /^Dölj widget /,
        })
        expect(hideButtons.length).toBe(5)
      },
      { timeout: 5000 }
    )
  }, 15000)

  // Test δ — hide widget removes from grid
  it('δ: clicking a widget hide button removes it from grid (CUST-01)', async () => {
    const user = userEvent.setup()
    await renderAndWait()
    expect(screen.getByRole('heading', { level: 3, name: 'Hälsa' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Anpassa vy/i }))
    await waitFor(
      () => {
        expect(
          screen.getByRole('button', { name: 'Dölj widget Hälsa' })
        ).toBeInTheDocument()
      },
      { timeout: 5000 }
    )
    await user.click(screen.getByRole('button', { name: 'Dölj widget Hälsa' }))
    await waitFor(() => {
      expect(
        screen.queryByRole('heading', { level: 3, name: 'Hälsa' })
      ).not.toBeInTheDocument()
    })
  }, 15000)

  // Test ε — Återvisa restores hidden widget
  it('ε: clicking Återvisa widget restores it to the grid (CUST-01)', async () => {
    const user = userEvent.setup()
    await renderAndWait()
    await user.click(screen.getByRole('button', { name: /Anpassa vy/i }))
    await waitFor(
      () => {
        expect(
          screen.getByRole('button', { name: 'Dölj widget Hälsa' })
        ).toBeInTheDocument()
      },
      { timeout: 5000 }
    )
    await user.click(screen.getByRole('button', { name: 'Dölj widget Hälsa' }))
    await waitFor(() => {
      expect(
        screen.queryByRole('heading', { level: 3, name: 'Hälsa' })
      ).not.toBeInTheDocument()
    })
    await user.click(screen.getByRole('button', { name: /Anpassa vy/i }))
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Återvisa widget Hälsa' })
      ).toBeInTheDocument()
    })
    await user.click(screen.getByRole('button', { name: 'Återvisa widget Hälsa' }))
    await waitFor(
      () => {
        expect(
          screen.getByRole('heading', { level: 3, name: 'Hälsa' })
        ).toBeInTheDocument()
      },
      { timeout: 5000 }
    )
  }, 20000)

  // Test ζ
  it('ζ: Återställ standardlayout opens ConfirmDialog with locked Swedish copy', async () => {
    const user = userEvent.setup()
    renderHub()
    await screen.findByRole('heading', { level: 4, name: 'Mig själv' })
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

  // Test η — confirm reset restores all 5 widgets
  it('η: confirming reset restores all 5 widgets to default (CUST-02)', async () => {
    const user = userEvent.setup()
    await renderAndWait()
    await user.click(screen.getByRole('button', { name: /Anpassa vy/i }))
    await waitFor(
      () => {
        expect(
          screen.getByRole('button', { name: 'Dölj widget Hälsa' })
        ).toBeInTheDocument()
      },
      { timeout: 5000 }
    )
    await user.click(screen.getByRole('button', { name: 'Dölj widget Hälsa' }))
    await waitFor(() => {
      expect(
        screen.queryByRole('heading', { level: 3, name: 'Hälsa' })
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
      () => {
        expect(
          screen.getByRole('heading', { level: 3, name: 'Hälsa' })
        ).toBeInTheDocument()
      },
      { timeout: 5000 }
    )
  }, 20000)

  // Test θ — cancel reset leaves layout unchanged
  it('θ: cancelling reset dialog leaves layout unchanged', async () => {
    const user = userEvent.setup()
    await renderAndWait()
    await user.click(screen.getByRole('button', { name: /Anpassa vy/i }))
    await waitFor(
      () => {
        expect(
          screen.getByRole('button', { name: 'Dölj widget Hälsa' })
        ).toBeInTheDocument()
      },
      { timeout: 5000 }
    )
    await user.click(screen.getByRole('button', { name: 'Dölj widget Hälsa' }))
    await waitFor(() => {
      expect(
        screen.queryByRole('heading', { level: 3, name: 'Hälsa' })
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
      screen.queryByRole('heading', { level: 3, name: 'Hälsa' })
    ).not.toBeInTheDocument()
  }, 20000)

  // Test ι — upsert payload contains hub_id='min-vardag'
  it('ι: hide action calls supabase upsert with hub_id=min-vardag and breakpoint=desktop in payload', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) })
    renderHub()
    await act(async () => {
      await Promise.resolve()
    })
    await waitFor(
      () => expect(screen.getByRole('button', { name: /Anpassa vy/i })).toBeInTheDocument(),
      { timeout: 5000 }
    )
    await user.click(screen.getByRole('button', { name: /Anpassa vy/i }))
    await waitFor(
      () =>
        expect(
          screen.getByRole('button', { name: 'Dölj widget Hälsa' })
        ).toBeInTheDocument(),
      { timeout: 5000 }
    )
    await user.click(screen.getByRole('button', { name: 'Dölj widget Hälsa' }))
    await act(async () => {
      vi.advanceTimersByTime(1100)
      await Promise.resolve()
    })
    await waitFor(() => expect(upsertSpy).toHaveBeenCalled(), { timeout: 3000 })
    const firstCallArg = upsertSpy.mock.calls[0][0] as Record<string, unknown>
    expect(firstCallArg).toMatchObject({ hub_id: 'min-vardag', breakpoint: 'desktop' })
  }, 15000)

  // Test κ — all 5 widget headings + icons render
  it('κ: all 5 Min Vardag widgets render (HUB-04 acceptance)', async () => {
    renderHub()
    await waitFor(
      () => {
        expect(screen.getByRole('heading', { level: 3, name: 'Hälsa' })).toBeInTheDocument()
        expect(screen.getByRole('heading', { level: 3, name: 'Dagbok' })).toBeInTheDocument()
        expect(screen.getByRole('heading', { level: 3, name: 'Kalender' })).toBeInTheDocument()
        expect(screen.getByRole('heading', { level: 3, name: 'Nätverk' })).toBeInTheDocument()
        expect(
          screen.getByRole('heading', { level: 3, name: 'Min konsulent' })
        ).toBeInTheDocument()
      },
      { timeout: 5000 }
    )
  })

  // Test λ — aria-live announces widget hidden
  it('λ: aria-live region announces "Widget Hälsa dold" when halsa is hidden', async () => {
    const user = userEvent.setup()
    await renderAndWait()
    await user.click(screen.getByRole('button', { name: /Anpassa vy/i }))
    await waitFor(
      () =>
        expect(
          screen.getByRole('button', { name: 'Dölj widget Hälsa' })
        ).toBeInTheDocument(),
      { timeout: 5000 }
    )
    await user.click(screen.getByRole('button', { name: 'Dölj widget Hälsa' }))
    await waitFor(() => {
      const liveRegion = document.querySelector(
        '[role="status"][aria-live="polite"]'
      )!
      expect(liveRegion.textContent).toBe('Widget Hälsa dold')
    })
  }, 15000)
})
