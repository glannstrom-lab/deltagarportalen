---
phase: 04-layout-persistence-hide-show
plan: 04
type: execute
wave: 4
depends_on:
  - 04-03
files_modified:
  - client/src/pages/hubs/JobsokHub.tsx
  - client/src/pages/hubs/__tests__/JobsokHub.test.tsx
  - client/src/components/widgets/widgetLabels.ts
autonomous: true
requirements:
  - CUST-01
  - CUST-02
  - CUST-03
must_haves:
  truths:
    - "JobsokHub renders 'Anpassa vy' button in PageLayout actions slot — toggles edit-mode on click"
    - "Edit-mode is hub-local useState (not Zustand) — locked CONTEXT.md decision"
    - "JobsokLayoutProvider wraps JobsokDataProvider (layout outer, data inner)"
    - "Each widget receives onHide={() => hideWidget(id)} when editMode=true; nothing otherwise"
    - "Hidden widgets (visible:false) are filtered before rendering — HubGrid.Slot.visible prop drives this"
    - "On hide → saveDebounced fires after 1000ms → next reload shows the widget still hidden"
    - "On reset confirm → resetLayout calls save() with default layout for current breakpoint → next reload shows default"
    - "Mobile and desktop persist independently (per-breakpoint upsert key from Plan 01)"
    - "aria-live region announces 'Widget {namn} dold', 'Widget {namn} återvisad', 'Layout återställd'"
  artifacts:
    - path: "client/src/pages/hubs/JobsokHub.tsx"
      provides: "Final hub page with full Phase 4 wiring"
      contains: "JobsokLayoutProvider"
    - path: "client/src/pages/hubs/__tests__/JobsokHub.test.tsx"
      provides: "Integration tests covering hide → reload → still hidden, reset → default, mobile/desktop independence"
  key_links:
    - from: "client/src/pages/hubs/JobsokHub.tsx"
      to: "client/src/hooks/useWidgetLayout.ts"
      via: "useWidgetLayout('jobb') in component, derives state for provider value"
      pattern: "useWidgetLayout\\('jobb'\\)"
    - from: "client/src/pages/hubs/JobsokHub.tsx"
      to: "client/src/components/widgets/HiddenWidgetsPanel.tsx"
      via: "Renders panel beneath 'Anpassa vy' button when isOpen"
      pattern: "<HiddenWidgetsPanel"
    - from: "Widget hide-button"
      to: "useWidgetLayout.saveDebounced"
      via: "hideWidget(id) → updates layout in provider value → saveDebounced(newLayout)"
      pattern: "saveDebounced"
---

<objective>
Final wiring: replace JobsokHub's hardcoded `editMode={false}` and local `sizes` state with the full Phase 4 stack — useWidgetLayout hook (Plan 01), JobsokLayoutProvider (Plan 02), HiddenWidgetsPanel (Plan 03). Add the "Anpassa vy" button to the PageLayout actions slot. Wire announcements. Add 5 integration tests proving the end-to-end flow: hide → persist → reload → still hidden, reset → default, mobile/desktop independence.

Purpose: Plans 01–03 produced isolated primitives. Plan 04 composes them into the actual user-visible feature. After this plan, CUST-01, CUST-02, CUST-03 are all satisfied for JobsokHub. Phase 5 will replicate the pattern documented here for the other 4 hubs.
Output: JobsokHub.tsx fully integrated; 5 new integration tests in JobsokHub.test.tsx green; existing 8 tests still green; aria-live announcements wired.
</objective>

<execution_context>
@C:/Users/Mikael/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/Mikael/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@CLAUDE.md
@.planning/phases/04-layout-persistence-hide-show/04-CONTEXT.md
@.planning/phases/04-layout-persistence-hide-show/04-RESEARCH.md
@.planning/phases/04-layout-persistence-hide-show/04-01-migration-and-layout-hook-PLAN.md
@.planning/phases/04-layout-persistence-hide-show/04-02-widget-hide-button-and-layout-context-PLAN.md
@.planning/phases/04-layout-persistence-hide-show/04-03-hidden-widgets-panel-and-reset-PLAN.md
@.planning/phases/02-static-widget-grid/02-UI-SPEC.md
@client/src/pages/hubs/JobsokHub.tsx
@client/src/pages/hubs/__tests__/JobsokHub.test.tsx
@client/src/components/layout/PageLayout.tsx
@client/src/components/widgets/HubGrid.tsx
@client/src/components/widgets/JobsokLayoutContext.tsx
@client/src/components/widgets/HiddenWidgetsPanel.tsx
@client/src/components/widgets/widgetLabels.ts
@client/src/hooks/useWidgetLayout.ts

<interfaces>
<!-- Everything Plan 04 wires together — exports already in place -->

From Plan 04-01 (useWidgetLayout):
```typescript
export function useWidgetLayout(hubId: HubId): {
  layout: WidgetLayoutItem[]
  isLoading: boolean
  saveDebounced: (widgets: WidgetLayoutItem[]) => void
  flushNow: () => void
  save: (widgets: WidgetLayoutItem[]) => void
}
```

From Plan 04-02 (JobsokLayoutContext):
```typescript
export function JobsokLayoutProvider({ value: JobsokLayoutValue, children })
export interface JobsokLayoutValue {
  layout: WidgetLayoutItem[]
  editMode: boolean
  setEditMode: (next: boolean) => void
  hideWidget: (id: string) => void
  showWidget: (id: string) => void
  updateSize: (id: string, size: WidgetSize) => void
  resetLayout: () => void
  isLoading: boolean
}
```

From Plan 04-03 (HiddenWidgetsPanel):
```typescript
export function HiddenWidgetsPanel({ isOpen: boolean, onClose: () => void })
// Reads useJobsokLayout() + useConfirmDialog() internally
```

From Plan 04-03 (widgetLabels.ts):
```typescript
export const WIDGET_LABELS: Record<WidgetId, string>
```

From client/src/components/layout/PageLayout.tsx (existing):
```typescript
interface PageLayoutProps {
  title: string
  subtitle?: string
  domain?: string
  showTabs?: boolean
  actions?: React.ReactNode  // <-- Plan 04 puts "Anpassa vy" button here
  children: React.ReactNode
}
```

Current JobsokHub.tsx structure (from file Read):
```typescript
export default function JobsokHub() {
  const sections = useMemo(() => getJobbSections(), [])
  const [sizes, setSizes] = useState<Record<string, WidgetSize>>(...)  // REPLACE
  const [announcement, setAnnouncement] = useState('')
  const { data: summary } = useJobsokHubSummary()

  return (
    <PageLayout title=... domain="activity" showTabs={false}>
      <JobsokDataProvider value={summary}>
        <div role="status" aria-live="polite" className="sr-only">{announcement}</div>
        {sections.map(section => (
          <HubGrid.Section ...>
            {section.items.map(item => {
              ...
              <HubGrid.Slot key={item.id} size={currentSize}>
                <Component editMode={false} ... />  // <-- REPLACE with editMode + onHide
              </HubGrid.Slot>
            })}
          </HubGrid.Section>
        ))}
      </JobsokDataProvider>
    </PageLayout>
  )
}
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Wire JobsokHub.tsx — providers, edit-mode, hide-button per widget, panel, announcements</name>
  <files>
    client/src/pages/hubs/JobsokHub.tsx
  </files>
  <read_first>
    - client/src/pages/hubs/JobsokHub.tsx (current — replace, don't append)
    - client/src/components/widgets/JobsokLayoutContext.tsx (Plan 02 — provider value shape)
    - client/src/hooks/useWidgetLayout.ts (Plan 01 — hook return shape)
    - client/src/components/widgets/HiddenWidgetsPanel.tsx (Plan 03 — props {isOpen, onClose})
    - client/src/components/widgets/widgetLabels.ts (Plan 03 — WIDGET_LABELS for announcements)
    - client/src/components/widgets/HubGrid.tsx (Plan 02 — Slot now accepts visible prop)
    - .planning/phases/04-layout-persistence-hide-show/04-CONTEXT.md §"UI-affordances" (locked: edit-mode-state hub-local useState; layout outer / data inner provider order)
    - .planning/phases/02-static-widget-grid/02-UI-SPEC.md §"Hub Page Header Contract" (ghost button styling for "Anpassa vy")
    - lucide-react: SlidersHorizontal or Settings2 icon (researcher recommended) for Anpassa vy button
  </read_first>
  <action>
    **Step 1 — Read current JobsokHub.tsx and Replace structurally**

    Replace the entire file `client/src/pages/hubs/JobsokHub.tsx` with the structure below. Keep imports from current file where reused.

    ```typescript
    import { useCallback, useMemo, useState, useEffect, useRef } from 'react'
    import { useTranslation } from 'react-i18next'
    import { SlidersHorizontal } from 'lucide-react'
    import { PageLayout } from '@/components/layout/PageLayout'
    import { HubGrid } from '@/components/widgets/HubGrid'
    import { WIDGET_REGISTRY, type WidgetId } from '@/components/widgets/registry'
    import { getJobbSections, getDefaultLayout } from '@/components/widgets/defaultLayouts'
    import type { WidgetSize, WidgetLayoutItem } from '@/components/widgets/types'
    import { useJobsokHubSummary } from '@/hooks/useJobsokHubSummary'
    import { JobsokDataProvider } from '@/components/widgets/JobsokDataContext'
    import { JobsokLayoutProvider, type JobsokLayoutValue } from '@/components/widgets/JobsokLayoutContext'
    import { HiddenWidgetsPanel } from '@/components/widgets/HiddenWidgetsPanel'
    import { WIDGET_LABELS } from '@/components/widgets/widgetLabels'
    import { useWidgetLayout } from '@/hooks/useWidgetLayout'
    import { useBreakpoint } from '@/hooks/useBreakpoint'

    /**
     * Söka jobb hub — Phase 4: layout persistence + hide/show.
     * Provider order (locked from 04-CONTEXT.md):
     *   <JobsokLayoutProvider>  ← outer (resolves layout first)
     *     <JobsokDataProvider>  ← inner (data fetch can read visible-widget set)
     */
    export default function JobsokHub() {
      const { t } = useTranslation()
      const sections = useMemo(() => getJobbSections(), [])
      const breakpoint = useBreakpoint()

      // Phase 4: persisted layout from Supabase
      const { layout, isLoading, saveDebounced, save } = useWidgetLayout('jobb')

      // Edit-mode is hub-local (locked decision: useState, not Zustand)
      const [editMode, setEditMode] = useState(false)
      const [panelOpen, setPanelOpen] = useState(false)
      const [announcement, setAnnouncement] = useState('')

      // Build a Map<id, WidgetLayoutItem> for quick lookups in render
      const layoutById = useMemo(() => {
        const m = new Map<string, WidgetLayoutItem>()
        for (const item of layout) m.set(item.id, item)
        return m
      }, [layout])

      // Mutators — produce a new layout array and call saveDebounced
      const hideWidget = useCallback((id: string) => {
        const next = layout.map(w => w.id === id ? { ...w, visible: false } : w)
        saveDebounced(next)
        const label = WIDGET_LABELS[id as WidgetId] ?? id
        setAnnouncement(`Widget ${label} dold`)
      }, [layout, saveDebounced])

      const showWidget = useCallback((id: string) => {
        const next = layout.map(w => w.id === id ? { ...w, visible: true } : w)
        saveDebounced(next)
        const label = WIDGET_LABELS[id as WidgetId] ?? id
        setAnnouncement(`Widget ${label} återvisad`)
      }, [layout, saveDebounced])

      const updateSize = useCallback((id: string, size: WidgetSize) => {
        const next = layout.map(w => w.id === id ? { ...w, size } : w)
        saveDebounced(next)
        setAnnouncement(`Widgeten är nu ${size}-storlek.`)
      }, [layout, saveDebounced])

      const resetLayout = useCallback(() => {
        const fresh = getDefaultLayout('jobb', breakpoint)
        // Use save (non-debounced) for reset — user-initiated, immediate persist
        save(fresh)
        setAnnouncement('Layout återställd')
      }, [breakpoint, save])

      const layoutValue: JobsokLayoutValue = useMemo(() => ({
        layout,
        editMode,
        setEditMode,
        hideWidget,
        showWidget,
        updateSize,
        resetLayout,
        isLoading,
      }), [layout, editMode, hideWidget, showWidget, updateSize, resetLayout, isLoading])

      // PHASE 3 carry-over: hub-summary loader unchanged
      const { data: summary } = useJobsokHubSummary()

      // "Anpassa vy" button — actions slot (PageLayout already supports this)
      const customizeButton = (
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setEditMode(prev => !prev)
              setPanelOpen(prev => !prev)
            }}
            aria-pressed={editMode}
            aria-expanded={panelOpen}
            aria-controls="hidden-widgets-panel"
            className={[
              'inline-flex items-center gap-2 px-3 py-1.5',
              'text-[13px] font-bold rounded-[8px] border',
              editMode
                ? 'bg-[var(--c-bg)] text-[var(--c-text)] border-[var(--c-solid)]'
                : 'bg-transparent text-[var(--header-text)] border-[var(--header-border)]',
              'hover:bg-[var(--c-bg)] hover:text-[var(--c-text)]',
              'focus:outline-none focus:shadow-[0_0_0_3px_var(--header-bg),0_0_0_4px_var(--c-solid)]',
              'cursor-pointer',
            ].join(' ')}
          >
            <SlidersHorizontal size={14} aria-hidden="true" />
            Anpassa vy
          </button>
          <div id="hidden-widgets-panel">
            <HiddenWidgetsPanel
              isOpen={panelOpen}
              onClose={() => setPanelOpen(false)}
            />
          </div>
        </div>
      )

      return (
        <PageLayout
          title={t('nav.hubs.jobb', 'Söka jobb')}
          subtitle={t('hubs.jobb.subtitle', 'Hitta lediga tjänster, skapa ansökningsmaterial och håll koll på dina ansökningar')}
          domain="activity"
          showTabs={false}
          actions={customizeButton}
        >
          <JobsokLayoutProvider value={layoutValue}>
            <JobsokDataProvider value={summary}>
              {/* Live region for screen readers — single source per UI-SPEC */}
              {/* Pitfall F: NOT conditionally rendered (kept here, OUTSIDE data-conditional) */}
              <div role="status" aria-live="polite" className="sr-only">
                {announcement}
              </div>

              {sections.map(section => (
                <HubGrid.Section key={section.title} title={section.title}>
                  {section.items.map(item => {
                    const entry = WIDGET_REGISTRY[item.id as WidgetId]
                    if (!entry) return null
                    const Component = entry.component
                    const persisted = layoutById.get(item.id)
                    const currentSize: WidgetSize = persisted?.size ?? entry.defaultSize
                    const isVisible = persisted?.visible !== false

                    return (
                      <HubGrid.Slot
                        key={item.id}
                        size={currentSize}
                        visible={isVisible}
                      >
                        <Component
                          id={item.id}
                          size={currentSize}
                          onSizeChange={(newSize) => updateSize(item.id, newSize)}
                          allowedSizes={entry.allowedSizes}
                          editMode={editMode}
                          onHide={() => hideWidget(item.id)}
                        />
                      </HubGrid.Slot>
                    )
                  })}
                </HubGrid.Section>
              ))}
            </JobsokDataProvider>
          </JobsokLayoutProvider>
        </PageLayout>
      )
    }
    ```

    **Step 2 — Type-check + visual verification**

    Run `cd client && npx tsc --noEmit`. Fix any type breakage immediately (most likely: WidgetProps onHide already added in Plan 02, persisted size type narrowing).

    Run `cd client && npm run dev` is OUT OF SCOPE here — visual verification happens in Task 2 via tests.

    **CRITICAL — what NOT to do:**
    - Do NOT remove the existing `aria-live` region — Pitfall F requires it stays at the same DOM position OUTSIDE data-conditional rendering.
    - Do NOT change provider order — must be `JobsokLayoutProvider` OUTER, `JobsokDataProvider` INNER (locked from CONTEXT.md). Reversing this breaks the data-fetch-depends-on-visible-widgets pattern documented for Phase 5 replication.
    - Do NOT introduce a new aria-live region inside the panel or HubGrid — re-use the single hub-level one.
    - Do NOT remove or modify `useJobsokHubSummary` call — Phase 3 contract.
  </action>
  <verify>
    <automated>cd client && npx tsc --noEmit</automated>
    The type-check is the primary verification for Task 1; behavioral verification follows in Task 2's integration tests.
  </verify>
  <acceptance_criteria>
    - [ ] `client/src/pages/hubs/JobsokHub.tsx` imports `useWidgetLayout`, `useBreakpoint`, `JobsokLayoutProvider`, `HiddenWidgetsPanel`, `WIDGET_LABELS`, `getDefaultLayout`.
    - [ ] Component calls `useWidgetLayout('jobb')` and uses returned `layout`, `saveDebounced`, `save`, `isLoading`.
    - [ ] Component has hub-local `useState<boolean>(false)` for both `editMode` and `panelOpen` — NOT Zustand.
    - [ ] `editMode={false}` hardcoded literal is REMOVED — replaced with `editMode={editMode}` state read.
    - [ ] Each widget receives `onHide={() => hideWidget(item.id)}` (always — visibility of the button is editMode-gated by Widget.tsx in Plan 02).
    - [ ] Each widget receives `onSizeChange={(newSize) => updateSize(item.id, newSize)}` — calls saveDebounced.
    - [ ] HubGrid.Slot receives `visible={persisted?.visible !== false}` (defaults to true if not persisted yet).
    - [ ] Provider order is `<JobsokLayoutProvider><JobsokDataProvider>{children}</JobsokDataProvider></JobsokLayoutProvider>` — outer/inner exactly per locked decision.
    - [ ] Existing aria-live `<div role="status" aria-live="polite" className="sr-only">` remains at same DOM position (just inside JobsokDataProvider, before sections.map).
    - [ ] PageLayout receives `actions={customizeButton}` with the "Anpassa vy" button + relative-positioned HiddenWidgetsPanel.
    - [ ] "Anpassa vy" button has `aria-pressed={editMode}`, `aria-expanded={panelOpen}`, `aria-controls="hidden-widgets-panel"`.
    - [ ] Clicking "Anpassa vy" toggles BOTH editMode and panelOpen.
    - [ ] resetLayout uses `save(getDefaultLayout('jobb', breakpoint))` — non-debounced, breakpoint-aware.
    - [ ] hideWidget / showWidget / updateSize / resetLayout all set the announcement via `setAnnouncement(...)`.
    - [ ] Announcement strings are Swedish: `Widget {label} dold`, `Widget {label} återvisad`, `Widgeten är nu {size}-storlek.`, `Layout återställd`.
    - [ ] `cd client && npx tsc --noEmit` passes.
  </acceptance_criteria>
  <done>
    JobsokHub.tsx is the single composition point for everything Phase 4 built. Plan 04-04 Task 2 will verify the runtime behavior with integration tests.
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Integration tests — hide/persist/reload, reset, mobile/desktop independence, panel flow</name>
  <files>
    client/src/pages/hubs/__tests__/JobsokHub.test.tsx
  </files>
  <read_first>
    - client/src/pages/hubs/__tests__/JobsokHub.test.tsx (existing test file — extend, do NOT rewrite)
    - client/src/pages/hubs/JobsokHub.tsx (just-completed Task 1)
    - client/src/hooks/useWidgetLayout.test.ts (Plan 01 — see how supabase + useAuth are mocked there)
    - client/src/hooks/useJobsokHubSummary.test.ts (existing — useAuth mock pattern reused here)
    - client/src/components/widgets/__tests__/JobsokLayoutContext.test.tsx (Plan 02 — harness pattern)
  </read_first>
  <behavior>
    Tests added to existing `client/src/pages/hubs/__tests__/JobsokHub.test.tsx`. The existing 8 tests must continue to pass.

    Mock strategy:
    - Existing mock for `useJobsokHubSummary` stays.
    - Existing mock for `useAuth` is updated to return `{user: {id: 'test-user'}, ...}` so useWidgetLayout's `enabled: !!userId` resolves true.
    - Mock `@/lib/supabase` to return controllable `from(...).select(...).maybeSingle()` and `from(...).upsert(...)` spies.
    - Mock `useBreakpoint` to return 'desktop' (default) — override per test.
    - Mock `window.matchMedia` to satisfy useBreakpoint internally if not mocked.
    - Wrap renders in `ConfirmDialogProvider` so panel reset works.

    New integration tests:

    - Test α: "Anpassa vy button is rendered in PageLayout actions slot"
      Render hub. Expect getByRole('button', { name: /Anpassa vy/i }) present.
    - Test β: "Clicking 'Anpassa vy' toggles editMode (verified via aria-pressed)"
      Click button. Expect aria-pressed='true' afterward. Click again. aria-pressed='false'.
    - Test γ: "When editMode is on, each widget renders its hide button"
      Click 'Anpassa vy' to enable edit-mode. Expect getAllByRole('button', { name: /^Dölj widget / }) length === 8 (one per widget).
    - Test δ: "Clicking a widget's hide button removes it from DOM and adds it to hidden-widgets-panel"
      Click 'Anpassa vy'. Click hide on 'Mitt CV'. Expect:
        - queryByRole('heading', { level: 3, name: 'CV' }) becomes null.
        - The HiddenWidgetsPanel (now open since panelOpen toggled with editMode) shows getByText('Mitt CV') in its list with a 'Återvisa widget Mitt CV' button.
    - Test ε: "Clicking 'Återvisa widget {namn}' restores the widget to the grid"
      Continuing from δ: click 'Återvisa widget Mitt CV'. Expect getByRole('heading', { level: 3, name: 'CV' }) reappears.
    - Test ζ: "Clicking 'Återställ standardlayout' opens ConfirmDialog with locked Swedish copy"
      Click 'Anpassa vy'. Click 'Återställ standardlayout' button. Expect dialog title 'Återställ layout?' visible AND message 'Är du säker? Detta tar bort alla anpassningar för denna hub.' visible.
    - Test η: "On dialog confirm, layout resets and all 8 widgets visible again"
      From ζ, click confirm. await waitFor. Expect all 8 widget headings present.
    - Test θ: "On dialog cancel, layout unchanged"
      Hide CV. Click reset. Click cancel in dialog. Expect CV still hidden (heading still absent).
    - Test ι: "Hide action calls supabase upsert with breakpoint='desktop' in payload (Pitfall 6)"
      Mock supabase.upsert spy. Mock useBreakpoint→'desktop'. Click Anpassa vy. Click hide on CV. Advance timers 1000ms via vi.useFakeTimers + vi.advanceTimersByTime (or wait for mutation). Inspect upsert.mock.calls[0][0] → expect `breakpoint: 'desktop'`.
    - Test κ: "Mobile hide does NOT affect desktop key (per-breakpoint independence)"
      Render with useBreakpoint mocked to 'mobile'. Hide a widget. Verify upsert payload has `breakpoint: 'mobile'`. Verify no upsert was made with `breakpoint: 'desktop'`. (Single render: assert all upsert calls have breakpoint='mobile'.)
    - Test λ: "Initial render shows widget hidden when persisted state has visible:false"
      Mock supabase select to return `{data: {widgets: [{id:'cv', size:'L', order:0, visible:false}], updated_at:'2026-01-01'}}`. Render hub. Wait for query to resolve. Assert queryByRole('heading', {level:3, name:'CV'}) is null. (This proves CUST-03 round-trip: persisted hidden state survives reload.)
    - Test μ: "aria-live region announces widget-hidden text"
      Click Anpassa vy. Click hide on CV. Inspect the role=status region's textContent. Expect "Widget Mitt CV dold".

    Total: 12 new tests (α–μ). Use vi.useFakeTimers when timers matter (Tests ι, κ); plain real timers otherwise.
  </behavior>
  <action>
    **Step 1 — Update existing mocks in JobsokHub.test.tsx**

    Modify the existing `vi.mock('@/hooks/useSupabase', ...)` to return a logged-in user:
    ```typescript
    vi.mock('@/hooks/useSupabase', () => ({
      useAuth: () => ({ user: { id: 'test-user' }, profile: null, loading: false, isAuthenticated: true }),
    }))
    ```

    Add NEW supabase mock at top of file (above the existing useJobsokHubSummary mock):
    ```typescript
    const upsertSpy = vi.fn().mockResolvedValue({ error: null })
    const selectChain = {
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    }
    vi.mock('@/lib/supabase', () => ({
      supabase: {
        from: vi.fn(() => ({
          select: vi.fn(() => selectChain),
          upsert: upsertSpy,
        })),
      },
    }))
    ```

    Add `vi.mock('@/hooks/useBreakpoint', () => ({ useBreakpoint: () => 'desktop' }))` — override per-test using `vi.mocked(useBreakpoint).mockReturnValue(...)`.

    Add window.matchMedia stub (jsdom doesn't include it):
    ```typescript
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: query.includes('900'),
        media: query, onchange: null,
        addEventListener: vi.fn(), removeEventListener: vi.fn(),
        addListener: vi.fn(), removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })
    ```

    Wrap `renderHub()` with ConfirmDialogProvider:
    ```typescript
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
    ```

    Reset spies in beforeEach:
    ```typescript
    beforeEach(() => {
      vi.spyOn(console, 'error').mockImplementation(() => {})
      upsertSpy.mockClear()
      selectChain.maybeSingle.mockResolvedValue({ data: null, error: null })
    })
    ```

    **Step 2 — Implement the 12 new tests (α–μ)**

    Add new `describe('JobsokHub Phase 4 — layout persistence + hide/show', () => { ... })` block. Each test follows from <behavior>.

    Patterns:
    - For Test δ (hide flow): use `await userEvent.click(...)` for the Anpassa vy button + hide button; then `await waitFor(() => expect(...).toBeNull())` for the heading removal because optimistic cache update is sync but React rerender is microtask-deferred.
    - For Test ι/κ (timers): `vi.useFakeTimers({ shouldAdvanceTime: true })` at start; use `await act(async () => { vi.advanceTimersByTime(1100) })` to flush debounce; `vi.useRealTimers()` in afterEach.
    - For Test ζ/η (ConfirmDialog): the dialog renders via portal-like absolute positioning inside ConfirmDialogProvider — find by `getByRole('dialog')` or by title text.
    - For Test λ (initial persisted hidden): override `selectChain.maybeSingle.mockResolvedValueOnce({ data: { widgets: [{id:'cv', size:'L', order:0, visible:false}], updated_at:'2026-01-01' }, error: null })` BEFORE rendering. Then assert CV heading absent.
    - For Test κ (mobile): `vi.mocked(useBreakpoint).mockReturnValueOnce('mobile')` before renderHub.

    Tests should be defensive: every async operation is awaited or wrapped in waitFor/act. No `setTimeout` polling — use the testing library's built-in async helpers.

    **Step 3 — Verify existing 8 tests still pass**

    Run `cd client && npm run test:run -- src/pages/hubs/__tests__/JobsokHub.test.tsx`. Both old + new tests must be green.
  </action>
  <verify>
    <automated>cd client && npm run test:run -- src/pages/hubs/__tests__/JobsokHub.test.tsx</automated>
    Plus full Phase 4 suite: `cd client && npm run test:run -- src/components/widgets/ src/hooks/useWidgetLayout.test.ts src/pages/hubs/`.
    Plus type-check: `cd client && npx tsc --noEmit`.
  </verify>
  <acceptance_criteria>
    - [ ] All 12 new integration tests (α–μ) pass.
    - [ ] All 8 pre-existing JobsokHub.test.tsx tests still pass (no regressions).
    - [ ] All Plan 01/02/03 tests still pass (mergeLayouts, useWidgetLayout, useBreakpoint, Widget, HubGrid, JobsokLayoutContext, HiddenWidgetsPanel).
    - [ ] Test δ proves CUST-01 hide flow (widget removed from grid, appears in panel).
    - [ ] Test ε proves CUST-01 restore flow.
    - [ ] Tests ζ/η/θ prove CUST-02 reset with confirm/cancel.
    - [ ] Test λ proves CUST-03 round-trip (persisted hidden state survives reload).
    - [ ] Tests ι/κ prove Pitfall 6 per-breakpoint upsert key.
    - [ ] Test μ proves aria-live announcement wiring.
    - [ ] `cd client && npx tsc --noEmit` passes.
    - [ ] No `console.error` warnings beyond the muted ones in beforeEach.
  </acceptance_criteria>
  <done>
    Phase 4 success criteria are demonstrably met by automated tests:
      1. User can hide widget; hidden widget can be re-added; state survives reload (Tests δ, ε, λ).
      2. User can reset hub to default with one action + confirm protection (Tests ζ, η).
      3. Layout per hub is stored in Supabase per-breakpoint and would restore correctly cross-device (Tests ι, κ + Plan 01 Task 3 RLS verification).
  </done>
</task>

</tasks>

<verification>
- All tasks complete and acceptance criteria met.
- Full Phase 4 test suite green: `cd client && npm run test:run -- src/components/widgets/ src/hooks/useWidgetLayout.test.ts src/pages/hubs/`.
- `cd client && npm run test:run` (full suite) shows no regressions in any other test file.
- `cd client && npx tsc --noEmit` passes.
- Inviolable rule honored: no destructive DDL in migration; original 27 deep-link routes untouched (only JobsokHub modified); existing tables untouched (only new user_widget_layouts added); existing 51 hooks unchanged (Plan 04 ADDS useWidgetLayout + useBreakpoint, doesn't replace anything).
</verification>

<success_criteria>
Phase 4 ROADMAP success criteria all satisfied for JobsokHub:
1. **CUST-01**: User can hide any widget on JobsokHub via the × button (visible in edit-mode); hidden widgets appear in the "Anpassa vy" dropdown panel with per-row "Återvisa"-buttons; state survives page reload (proven by Test λ persisted-hidden round-trip).
2. **CUST-02**: User can reset JobsokHub layout to default with the bottom button in the panel; ConfirmDialog (warning variant, Swedish copy) prevents accidental reset; on confirm all widgets restored to default sizes and visibility.
3. **CUST-03**: Layout (sizes + visibility) per hub stored in Supabase user_widget_layouts table with per-breakpoint upsert key; cross-device sync works because each device's breakpoint maps to a separate row; mobile and desktop layouts are independent (Tests ι, κ verify this).

Pattern documented for Phase 5 replication: pattern is "wrap hub with `<JobsokLayoutProvider value={layoutValue}>` + add `actions={customizeButton}` to PageLayout". Other hubs (Karriär/Resurser/Min Vardag/Översikt) replicate by renaming the provider/hook/labels per hub when their widgets exist.
</success_criteria>

<output>
After completion, create `.planning/phases/04-layout-persistence-hide-show/04-04-jobsokhub-wiring-and-integration-tests-SUMMARY.md` documenting:
- JobsokHub.tsx final line count
- Test counts: existing (8) + new (12) = 20 in JobsokHub.test.tsx; full Phase 4 suite test count
- Provider order verified: JobsokLayoutProvider OUTER, JobsokDataProvider INNER
- Pattern abstraction notes for Phase 5 (what's reusable, what's hub-specific)
- Final answer to research Open Question 3 (`updated_at` conflict detection): Phase 4 ships without timestamp comparison; relies on `onSettled: invalidateQueries` to re-fetch after every mutation, which is the documented v1.0 simplified strategy.
- Final answer to research Open Question 2 (`useBeforeUnload` flush): Phase 4 fires `flushNow()` synchronously inside the beforeunload listener which calls `mutation.mutate()` — but the mutation's HTTP request itself is async and may be cut off if the tab closes within the request. Documented limitation; users with sub-1000ms actions before tab close may lose the last change. Acceptable trade-off; documented in SUMMARY.
- Confirm: HUB success criteria 1, 2, 3 all met by automated tests (Tests δ/ε/λ, Tests ζ/η, Tests ι/κ).
</output>
