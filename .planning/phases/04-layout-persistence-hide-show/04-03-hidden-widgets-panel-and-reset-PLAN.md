---
phase: 04-layout-persistence-hide-show
plan: 03
type: execute
wave: 3
depends_on:
  - 04-02
files_modified:
  - client/src/components/widgets/HiddenWidgetsPanel.tsx
  - client/src/components/widgets/HiddenWidgetsPanel.test.tsx
  - client/src/components/widgets/widgetLabels.ts
autonomous: true
requirements:
  - CUST-01
  - CUST-02
must_haves:
  truths:
    - "HiddenWidgetsPanel lists every layout item with visible: false; each row has a 'Återvisa'-button"
    - "Clicking 'Återvisa' on a row calls showWidget(id) from JobsokLayoutContext"
    - "Reset-button at panel bottom opens ConfirmDialog (warning variant) with Swedish copy 'Återställ layout?' / 'Är du säker? Detta tar bort alla anpassningar för denna hub.'"
    - "On confirm, resetLayout() is called; on cancel, layout unchanged and no upsert fires"
    - "Panel closes on Escape key and on outside click"
    - "Panel renders 'Inga dolda widgets' empty state when no hidden widgets exist"
  artifacts:
    - path: "client/src/components/widgets/HiddenWidgetsPanel.tsx"
      provides: "Self-contained dropdown component (uses useJobsokLayout + useConfirmDialog internally)"
      exports: ["HiddenWidgetsPanel"]
    - path: "client/src/components/widgets/widgetLabels.ts"
      provides: "Widget ID → Swedish display name map (for aria-label + panel rows)"
      exports: ["WIDGET_LABELS"]
  key_links:
    - from: "client/src/components/widgets/HiddenWidgetsPanel.tsx"
      to: "client/src/components/widgets/JobsokLayoutContext.tsx (useJobsokLayout)"
      via: "Reads layout, calls showWidget + resetLayout"
      pattern: "useJobsokLayout\\(\\)"
    - from: "client/src/components/widgets/HiddenWidgetsPanel.tsx"
      to: "client/src/components/ui/ConfirmDialog.tsx (useConfirmDialog)"
      via: "await confirm({title, message, variant: 'warning'}) before reset"
      pattern: "useConfirmDialog\\(\\)"
---

<objective>
Build the "Återvisa dolda" dropdown panel. It opens from the "Anpassa vy" button (Plan 04 wires the trigger), lists every hidden widget with a per-row "Återvisa"-button, and has a "Återställ standardlayout"-button at the bottom that pops a ConfirmDialog before calling `resetLayout()`. Includes the Swedish widget label map (`WIDGET_LABELS`) used both by this panel and by Plan 04's hide-button aria-label interpolation.

Purpose: Plan 02 produced the layout-context plumbing; this plan produces the user-facing UI for unhiding widgets and resetting the layout. Without this panel, hidden widgets would be lost forever from the user's perspective.
Output: HiddenWidgetsPanel component (a11y-correct, dropdown-style with outside-click + Escape close), widgetLabels.ts dictionary, and full test coverage for restore + reset + cancel flows.
</objective>

<execution_context>
@C:/Users/Mikael/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/Mikael/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@CLAUDE.md
@.planning/phases/04-layout-persistence-hide-show/04-CONTEXT.md
@.planning/phases/04-layout-persistence-hide-show/04-RESEARCH.md
@.planning/phases/04-layout-persistence-hide-show/04-02-widget-hide-button-and-layout-context-PLAN.md
@client/src/components/widgets/JobsokLayoutContext.tsx
@client/src/components/widgets/registry.ts
@client/src/components/ui/ConfirmDialog.tsx
@client/src/main.tsx

<interfaces>
<!-- Existing exports the executor will consume -->

From Plan 04-02 (JobsokLayoutContext.tsx):
```typescript
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
export function useJobsokLayout(): JobsokLayoutValue
export function selectHiddenWidgets(layout: WidgetLayoutItem[]): WidgetLayoutItem[]
```

From client/src/components/ui/ConfirmDialog.tsx:
```typescript
export function useConfirmDialog(): {
  confirm: (options: {
    title: string
    message: string
    confirmText?: string
    cancelText?: string
    variant?: 'default' | 'danger' | 'warning' | 'info'
  }) => Promise<boolean>
}
// Note: ConfirmDialogProvider IS already mounted in client/src/main.tsx (verified — line 104).
// No need to add it.
```

From client/src/components/widgets/registry.ts:
```typescript
export const WIDGET_REGISTRY = { cv, 'cover-letter', interview, 'job-search',
                                  applications, spontaneous, salary, international }
export type WidgetId = keyof typeof WIDGET_REGISTRY
```

Phase 4 widget label map (NEW — to be created):
```typescript
export const WIDGET_LABELS: Record<WidgetId, string> = {
  cv:              'Mitt CV',
  'cover-letter':  'Personligt brev',
  interview:       'Intervjuträning',
  'job-search':    'Sök jobb',
  applications:    'Mina ansökningar',
  spontaneous:     'Spontanansökan',
  salary:          'Lön & förhandling',
  international:   'Internationellt',
}
```
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Create widgetLabels.ts + HiddenWidgetsPanel component (with tests)</name>
  <files>
    client/src/components/widgets/widgetLabels.ts,
    client/src/components/widgets/HiddenWidgetsPanel.tsx,
    client/src/components/widgets/HiddenWidgetsPanel.test.tsx
  </files>
  <read_first>
    - client/src/components/widgets/JobsokLayoutContext.tsx (Plan 02 — useJobsokLayout, selectHiddenWidgets, type JobsokLayoutValue)
    - client/src/components/widgets/registry.ts (WIDGET_REGISTRY keys, WidgetId type)
    - client/src/components/ui/ConfirmDialog.tsx (useConfirmDialog API + ConfirmDialogProvider already mounted in main.tsx)
    - client/src/main.tsx (verify ConfirmDialogProvider wraps app — line 104)
    - .planning/phases/04-layout-persistence-hide-show/04-CONTEXT.md §"UI-affordances" (locked: dropdown, auto-close on outside click; reset confirm copy)
    - .planning/phases/04-layout-persistence-hide-show/04-RESEARCH.md §"HiddenWidgetsPanel" + §"Pattern 4 / Pitfall E" (ConfirmDialogProvider scope)
    - lucide-react icon imports — RotateCcw or Plus or Eye for restore button (researcher recommends Plus or visual identity)
  </read_first>
  <behavior>
    Tests in `client/src/components/widgets/HiddenWidgetsPanel.test.tsx`. Mock useJobsokLayout to control layout state. Mock useConfirmDialog to control resolve.

    Wrap renders in ConfirmDialogProvider so useConfirmDialog inside HiddenWidgetsPanel resolves correctly (per Pitfall E, the provider IS in main.tsx but unit tests need their own).

    - Test 1: "lists every layout item with visible: false using its WIDGET_LABELS name"
      Mock layout: `[{id:'cv', visible:false, size:'L', order:0}, {id:'salary', visible:true, ...}, {id:'interview', visible:false, ...}]`.
      Render panel with isOpen=true. Expect getByText('Mitt CV') and getByText('Intervjuträning') present; queryByText('Lön & förhandling') is null.
    - Test 2: "renders 'Inga dolda widgets' empty state when no hidden widgets"
      Mock layout: all items visible:true. Render isOpen=true. Expect getByText(/Inga dolda widgets/i).
    - Test 3: "each row has a 'Återvisa'-button with aria-label='Återvisa widget {namn}'"
      Mock layout: cv hidden. Expect getByRole('button', { name: 'Återvisa widget Mitt CV' }) present.
    - Test 4: "clicking 'Återvisa' on a row calls showWidget(id) with that widget's id"
      Mock showWidget = vi.fn(). cv hidden. Click 'Återvisa widget Mitt CV'. Expect showWidget called once with 'cv'.
    - Test 5: "panel renders Reset button at bottom with text matching 'Återställ standardlayout'"
      Render. Expect getByRole('button', { name: /Återställ standardlayout/i }) present (always present, even with no hidden widgets).
    - Test 6: "clicking Reset opens ConfirmDialog with locked Swedish copy"
      Mock useConfirmDialog to spy on confirm() args. Click Reset button. Expect confirm called once with `{title: 'Återställ layout?', message: 'Är du säker? Detta tar bort alla anpassningar för denna hub.', variant: 'warning', confirmText: 'Återställ', cancelText: 'Avbryt'}`.
    - Test 7: "on confirm:true, resetLayout() is called"
      Mock useConfirmDialog.confirm resolves true. Mock resetLayout = vi.fn(). Click Reset. await microtasks. Expect resetLayout called once.
    - Test 8: "on confirm:false (cancel), resetLayout NOT called"
      Mock confirm resolves false. resetLayout = vi.fn(). Click Reset. await microtasks. Expect resetLayout NOT called.
    - Test 9: "panel closes on Escape key (calls onClose prop)"
      Render with isOpen=true, onClose=vi.fn(). fireEvent.keyDown(document, {key:'Escape'}). Expect onClose called.
    - Test 10: "panel closes on click outside the panel container (onClose called)"
      Render with isOpen=true, onClose=vi.fn(). fireEvent.mouseDown on document.body (outside panel). Expect onClose called once.
    - Test 11: "panel does NOT call onClose when clicking inside the panel"
      Render with onClose=vi.fn(). fireEvent.mouseDown on the panel container itself. Expect onClose NOT called.
    - Test 12: "panel does NOT render when isOpen=false"
      Render with isOpen=false. Expect queryByRole('region', { name: /dolda widgets/i }) null.
    - Test 13: "panel container has role='region' and aria-label='Dolda widgets'"
      Render isOpen=true. Expect getByRole('region', { name: 'Dolda widgets' }) present.
  </behavior>
  <action>
    **Step 1 — Verify ConfirmDialogProvider scope (preflight)**

    Run `grep -n "ConfirmDialogProvider" client/src/main.tsx`. Confirm it wraps the app at root level (line 104 per Plan 04-02 research — already verified). If somehow missing, this task STOPS and surfaces as a blocker — do NOT add it here (out of scope; Plan 04 root if needed).

    **Step 2 — Create widgetLabels.ts**

    New file `client/src/components/widgets/widgetLabels.ts`:

    ```typescript
    import type { WidgetId } from './registry'

    /**
     * Swedish display names for widgets — used in:
     *   - Hide-button aria-label: "Dölj widget {WIDGET_LABELS[id]}"  (Plan 04 wires this)
     *   - HiddenWidgetsPanel rows
     *   - Future: keyboard layout-edit announcements
     *
     * Keep in sync with WIDGET_REGISTRY keys (Phase 5 adds new widgets — extend this map).
     */
    export const WIDGET_LABELS: Record<WidgetId, string> = {
      cv:              'Mitt CV',
      'cover-letter':  'Personligt brev',
      interview:       'Intervjuträning',
      'job-search':    'Sök jobb',
      applications:    'Mina ansökningar',
      spontaneous:     'Spontanansökan',
      salary:          'Lön & förhandling',
      international:   'Internationellt',
    }
    ```

    **Step 3 — Create HiddenWidgetsPanel.tsx**

    New file `client/src/components/widgets/HiddenWidgetsPanel.tsx`:

    ```typescript
    import { useEffect, useRef } from 'react'
    import { Plus, RotateCcw } from 'lucide-react'
    import { useJobsokLayout, selectHiddenWidgets } from './JobsokLayoutContext'
    import { useConfirmDialog } from '@/components/ui/ConfirmDialog'
    import { WIDGET_LABELS } from './widgetLabels'
    import type { WidgetId } from './registry'

    interface HiddenWidgetsPanelProps {
      isOpen: boolean
      onClose: () => void
    }

    /**
     * Dropdown panel listing hidden widgets. Triggered by "Anpassa vy" button (Plan 04 wires).
     * Auto-closes on outside click + Escape key.
     * Reset button at bottom uses ConfirmDialog (warning variant) before calling resetLayout().
     */
    export function HiddenWidgetsPanel({ isOpen, onClose }: HiddenWidgetsPanelProps) {
      const { layout, showWidget, resetLayout } = useJobsokLayout()
      const { confirm } = useConfirmDialog()
      const containerRef = useRef<HTMLDivElement | null>(null)
      const hidden = selectHiddenWidgets(layout)

      // Outside click + Escape handlers
      useEffect(() => {
        if (!isOpen) return
        const onKey = (e: KeyboardEvent) => {
          if (e.key === 'Escape') onClose()
        }
        const onMouseDown = (e: MouseEvent) => {
          if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
            onClose()
          }
        }
        document.addEventListener('keydown', onKey)
        document.addEventListener('mousedown', onMouseDown)
        return () => {
          document.removeEventListener('keydown', onKey)
          document.removeEventListener('mousedown', onMouseDown)
        }
      }, [isOpen, onClose])

      const handleReset = async () => {
        const ok = await confirm({
          title: 'Återställ layout?',
          message: 'Är du säker? Detta tar bort alla anpassningar för denna hub.',
          confirmText: 'Återställ',
          cancelText: 'Avbryt',
          variant: 'warning',
        })
        if (ok) {
          resetLayout()
          onClose()
        }
      }

      if (!isOpen) return null

      return (
        <div
          ref={containerRef}
          role="region"
          aria-label="Dolda widgets"
          className={[
            'absolute right-0 top-full mt-2 z-30',
            'w-[280px] bg-[var(--surface)]',
            'border border-[var(--stone-150)] rounded-[12px]',
            'shadow-[0_4px_16px_rgb(0_0_0/0.08)] p-3',
          ].join(' ')}
        >
          {hidden.length === 0 ? (
            <p className="text-[12px] text-[var(--stone-600)] m-0 px-2 py-3">
              Inga dolda widgets
            </p>
          ) : (
            <ul className="list-none m-0 p-0 flex flex-col gap-1">
              {hidden.map((item) => {
                const label = WIDGET_LABELS[item.id as WidgetId] ?? item.id
                return (
                  <li key={item.id} className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-[7px] hover:bg-[var(--stone-100)]">
                    <span className="text-[13px] text-[var(--stone-800)]">{label}</span>
                    <button
                      type="button"
                      onClick={() => showWidget(item.id)}
                      aria-label={`Återvisa widget ${label}`}
                      className={[
                        'flex items-center gap-1 px-2 py-1',
                        'text-[12px] font-bold text-[var(--c-text)]',
                        'bg-[var(--c-bg)] rounded-[6px]',
                        'hover:bg-[var(--c-accent)]',
                        'focus:outline-none focus:shadow-[0_0_0_3px_var(--surface),0_0_0_4px_var(--c-solid)]',
                        'border-0 cursor-pointer',
                      ].join(' ')}
                    >
                      <Plus size={12} aria-hidden="true" />
                      Återvisa
                    </button>
                  </li>
                )
              })}
            </ul>
          )}

          {/* Divider */}
          <div className="h-px bg-[var(--stone-150)] my-3" />

          {/* Reset button (always visible, even with no hidden widgets) */}
          <button
            type="button"
            onClick={handleReset}
            className={[
              'w-full flex items-center justify-center gap-2 px-3 py-2',
              'text-[12px] font-bold text-[var(--stone-700)]',
              'bg-transparent border border-[var(--stone-150)] rounded-[7px]',
              'hover:bg-[var(--stone-100)] hover:text-[var(--stone-900)]',
              'focus:outline-none focus:shadow-[0_0_0_3px_var(--surface),0_0_0_4px_var(--c-solid)]',
              'cursor-pointer',
            ].join(' ')}
          >
            <RotateCcw size={12} aria-hidden="true" />
            Återställ standardlayout
          </button>
        </div>
      )
    }
    ```

    **Step 4 — Author HiddenWidgetsPanel.test.tsx**

    Create test file. Pattern:

    ```typescript
    import { describe, it, expect, vi, beforeEach } from 'vitest'
    import { render, screen, fireEvent, act } from '@testing-library/react'
    import { ConfirmDialogProvider } from '@/components/ui/ConfirmDialog'
    import { HiddenWidgetsPanel } from './HiddenWidgetsPanel'
    import { JobsokLayoutProvider, type JobsokLayoutValue } from './JobsokLayoutContext'
    import type { WidgetLayoutItem } from './types'

    // Mock useConfirmDialog so we can control resolution per test
    const mockConfirm = vi.fn()
    vi.mock('@/components/ui/ConfirmDialog', async (orig) => {
      const actual = await orig() as any
      return {
        ...actual,
        useConfirmDialog: () => ({ confirm: mockConfirm }),
      }
    })

    function renderPanel(opts: {
      layout: WidgetLayoutItem[]
      isOpen?: boolean
      onClose?: () => void
      showWidget?: (id: string) => void
      resetLayout?: () => void
    }) {
      const value: JobsokLayoutValue = {
        layout: opts.layout,
        editMode: true,
        setEditMode: vi.fn(),
        hideWidget: vi.fn(),
        showWidget: opts.showWidget ?? vi.fn(),
        updateSize: vi.fn(),
        resetLayout: opts.resetLayout ?? vi.fn(),
        isLoading: false,
      }
      return render(
        <ConfirmDialogProvider>
          <JobsokLayoutProvider value={value}>
            <HiddenWidgetsPanel
              isOpen={opts.isOpen ?? true}
              onClose={opts.onClose ?? vi.fn()}
            />
          </JobsokLayoutProvider>
        </ConfirmDialogProvider>
      )
    }

    beforeEach(() => mockConfirm.mockReset())

    // Implement Tests 1–13 here.
    ```

    For Test 6 (confirm dialog args), assert `mockConfirm.mock.calls[0][0]` matches the locked object exactly.

    For Tests 7–8, await `act(async () => { fireEvent.click(...) })` and use `await Promise.resolve()` after to flush microtasks, since `handleReset` is async.

    For Tests 9–11 (Escape, outside-click), use `fireEvent.keyDown(document, {key:'Escape'})` and `fireEvent.mouseDown(document.body)` respectively.

    Optional: keep the file under ~150 lines per CLAUDE.md. The 13 tests fit comfortably.
  </action>
  <verify>
    <automated>cd client && npm run test:run -- src/components/widgets/HiddenWidgetsPanel.test.tsx</automated>
    Type-check: `cd client && npx tsc --noEmit`.
    All Phase 4 tests so far: `cd client && npm run test:run -- src/components/widgets/ src/hooks/useWidgetLayout.test.ts`.
  </verify>
  <acceptance_criteria>
    - [ ] `client/src/components/widgets/widgetLabels.ts` exports `WIDGET_LABELS: Record<WidgetId, string>` with exactly 8 entries matching WIDGET_REGISTRY keys.
    - [ ] `client/src/components/widgets/HiddenWidgetsPanel.tsx` exports named `HiddenWidgetsPanel` component with props `{isOpen: boolean, onClose: () => void}`.
    - [ ] Panel renders `<div role="region" aria-label="Dolda widgets">` as outer container when `isOpen=true`.
    - [ ] Panel renders nothing (returns null) when `isOpen=false`.
    - [ ] For each hidden widget (visible:false), renders a `<li>` with the WIDGET_LABELS name + "Återvisa"-button (`aria-label="Återvisa widget {label}"`).
    - [ ] When no hidden widgets, renders Swedish empty state "Inga dolda widgets".
    - [ ] Reset button at bottom always rendered, with text "Återställ standardlayout".
    - [ ] Reset button onClick calls `useConfirmDialog().confirm({...})` with EXACT object: `{title: 'Återställ layout?', message: 'Är du säker? Detta tar bort alla anpassningar för denna hub.', confirmText: 'Återställ', cancelText: 'Avbryt', variant: 'warning'}`.
    - [ ] On confirm true, calls `resetLayout()` AND `onClose()`. On confirm false, calls neither.
    - [ ] Escape key calls onClose; outside-mouseDown calls onClose; inside click does NOT call onClose.
    - [ ] All 13 tests pass.
    - [ ] `cd client && npx tsc --noEmit` passes.
    - [ ] No regressions: existing widget tests still green.
  </acceptance_criteria>
  <done>
    HiddenWidgetsPanel is fully self-contained: it reads layout from context, calls the right mutators, and uses the existing ConfirmDialog with locked Swedish copy. Plan 04 only needs to render the panel (controlled by edit-mode state) — no further wiring needed inside the panel itself.
  </done>
</task>

</tasks>

<verification>
- HiddenWidgetsPanel.test.tsx runs 13 tests, all green.
- `cd client && npx tsc --noEmit` passes.
- `cd client && npm run test:run -- src/components/widgets/` shows no regressions in Plan 02 or Phase 2/3 tests.
- Locked Swedish confirm copy verified by exact string match in Test 6.
- ConfirmDialogProvider scope verified at start of task (line 104 main.tsx).
- Panel does NOT block reset when no hidden widgets (reset is always available — that's the design).
</verification>

<success_criteria>
CUST-01 (restore hidden widgets) + CUST-02 (reset to default) UI components ready:
1. User can see every hidden widget by name and click 'Återvisa' to bring it back.
2. User can reset the entire hub layout to defaults with one button + confirm protection.
3. Reset confirm dialog uses warning variant (amber styling) — not danger (red) — matching empathy framing.
4. Panel a11y: role=region with Swedish label, Escape closes, outside-click closes, full keyboard reachable.
</success_criteria>

<output>
After completion, create `.planning/phases/04-layout-persistence-hide-show/04-03-hidden-widgets-panel-and-reset-SUMMARY.md` documenting:
- Panel component file size (line count)
- Test count (13 expected; report actual)
- Verified ConfirmDialogProvider scope (main.tsx line N)
- Locked confirm copy verified verbatim
- Open question for Plan 04: who controls the panel's `isOpen` state — JobsokHub useState (recommended) or context? Default: useState in JobsokHub for simplicity.
- Empty state copy decision: "Inga dolda widgets" (chosen — neutral, action-implicit since reset is still available below)
</output>
