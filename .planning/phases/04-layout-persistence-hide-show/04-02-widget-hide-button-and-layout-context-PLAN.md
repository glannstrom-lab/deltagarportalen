---
phase: 04-layout-persistence-hide-show
plan: 02
type: execute
wave: 2
depends_on:
  - 04-01
files_modified:
  - client/src/components/widgets/Widget.tsx
  - client/src/components/widgets/Widget.test.tsx
  - client/src/components/widgets/JobsokLayoutContext.tsx
  - client/src/components/widgets/HubGrid.tsx
  - client/src/components/widgets/HubGrid.test.tsx
autonomous: true
requirements:
  - CUST-01
must_haves:
  truths:
    - "Hide button (×) renders in Widget.Header only when editMode=true AND onHide is provided"
    - "Hide button has aria-label='Dölj widget {title}' (Swedish, interpolated)"
    - "Clicking hide button calls onHide(); button is keyboard-operable (button element + Enter)"
    - "JobsokLayoutContext provides {layout, editMode, hideWidget, showWidget, setEditMode, resetLayout} to descendants"
    - "Widgets with visible: false are not rendered (filter applied at hub-level via context — but HubGrid.Slot also accepts a visible prop for safety)"
  artifacts:
    - path: "client/src/components/widgets/JobsokLayoutContext.tsx"
      provides: "Peer-context to JobsokDataContext — layout state distribution"
      exports: ["JobsokLayoutProvider", "useJobsokLayout", "JobsokLayoutValue"]
    - path: "client/src/components/widgets/Widget.tsx"
      provides: "Extended Widget compound with optional onHide + hide-button slot in Header"
      contains: "aria-label={`Dölj widget"
  key_links:
    - from: "client/src/components/widgets/Widget.tsx (Widget.Header)"
      to: "WidgetContextValue.onHide"
      via: "Hide button onClick={onHide}"
      pattern: "onHide\\(\\)"
    - from: "client/src/components/widgets/JobsokLayoutContext.tsx"
      to: "client/src/hooks/useWidgetLayout.ts"
      via: "Provider receives layout + saveDebounced from hub via props"
      pattern: "JobsokLayoutProvider"
---

<objective>
Add the hide-affordance to the Widget compound (× button in Header, edit-mode-gated, fully a11y-compliant) and create the `JobsokLayoutContext` peer-provider that distributes layout state + edit-mode to descendants. This plan does NOT yet wire the context into JobsokHub — that happens in Plan 04. Plan 03 builds the panel that consumes hidden widgets from this context.

Purpose: Plan 01 produced the persistence machinery; Plan 02 produces the UI primitives. Without these, the hub wiring in Plan 04 has nothing to wire.
Output: Widget.tsx with hide-button (Pattern 4), JobsokLayoutContext.tsx (Pattern 3), HubGrid extended to filter visible:false slots, and tests for both — extending existing Widget.test.tsx and HubGrid.test.tsx.
</objective>

<execution_context>
@C:/Users/Mikael/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/Mikael/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@CLAUDE.md
@.planning/phases/04-layout-persistence-hide-show/04-CONTEXT.md
@.planning/phases/04-layout-persistence-hide-show/04-RESEARCH.md
@.planning/phases/02-static-widget-grid/02-UI-SPEC.md
@.planning/phases/04-layout-persistence-hide-show/04-01-migration-and-layout-hook-PLAN.md
@client/src/components/widgets/Widget.tsx
@client/src/components/widgets/Widget.test.tsx
@client/src/components/widgets/HubGrid.tsx
@client/src/components/widgets/HubGrid.test.tsx
@client/src/components/widgets/JobsokDataContext.tsx
@client/src/components/widgets/types.ts

<interfaces>
<!-- Existing context patterns the executor will mirror -->

From client/src/components/widgets/JobsokDataContext.tsx (pattern to mirror):
```typescript
const JobsokDataContext = createContext<JobsokSummary | undefined>(undefined)
export function JobsokDataProvider({ value, children }) { ... }
export function useJobsokWidgetData<K extends keyof JobsokSummary>(slice: K) { ... }
```

From Plan 04-01 (now available):
```typescript
import type { WidgetLayoutItem } from '@/components/widgets/types'  // includes `visible: boolean`
import { useWidgetLayout } from '@/hooks/useWidgetLayout'  // returns { layout, saveDebounced, save, ... }
```

Current Widget.tsx WidgetContextValue (must extend):
```typescript
interface WidgetContextValue {
  size: WidgetSize
  onSizeChange?: (newSize: WidgetSize) => void
  allowedSizes: WidgetSize[]
  editMode: boolean
  // NEW: onHide?: () => void
  // NEW: hideLabel?: string  (for aria-label interpolation)
}
```

Current WidgetProps (must extend):
```typescript
export interface WidgetProps {
  id: string
  size: WidgetSize
  onSizeChange?: (newSize: WidgetSize) => void
  allowedSizes?: WidgetSize[]
  editMode?: boolean
  className?: string
  // NEW: onHide?: () => void
}
```
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Extend Widget compound with hide-button + tests</name>
  <files>
    client/src/components/widgets/types.ts,
    client/src/components/widgets/Widget.tsx,
    client/src/components/widgets/Widget.test.tsx
  </files>
  <read_first>
    - client/src/components/widgets/Widget.tsx (current compound — Header has size-toggle group on right)
    - client/src/components/widgets/Widget.test.tsx (existing tests — extend, do NOT rewrite)
    - .planning/phases/02-static-widget-grid/02-UI-SPEC.md §"Widget.Header" + §"Size Toggle Group" + §"Accessibility Contract" (focus ring spec, button styling)
    - .planning/phases/04-layout-persistence-hide-show/04-RESEARCH.md §"Pattern 4: Hide-Button in Widget.Header"
    - .planning/phases/04-layout-persistence-hide-show/04-CONTEXT.md §"UI-affordances" (locked: small ×, edit-mode-only, aria-label="Dölj widget {namn}")
    - lucide-react X icon import pattern in existing widgets (e.g. ApplicationsWidget.tsx)
  </read_first>
  <behavior>
    Tests added to existing `client/src/components/widgets/Widget.test.tsx` (do NOT delete existing tests):

    - Test A: "renders hide button when editMode=true AND onHide provided"
      Render Widget with editMode=true, onHide=fn. Expect `getByRole('button', { name: /^Dölj widget Test Widget$/ })` to be present.
    - Test B: "does NOT render hide button when editMode=false (even if onHide provided)"
      Render with editMode=false, onHide=fn. Expect `queryByRole('button', { name: /^Dölj widget/ })` to be null.
    - Test C: "does NOT render hide button when editMode=true but onHide is undefined"
      Render with editMode=true, onHide=undefined. Expect `queryByRole('button', { name: /^Dölj widget/ })` to be null.
    - Test D: "clicking hide button calls onHide exactly once"
      Render with editMode=true, onHide=spy. fireEvent.click(hide button). Expect spy called once with no args.
    - Test E: "hide button is a native <button type='button'>"
      Render with editMode=true, onHide=fn. Hide button getByRole('button', {name: /Dölj/}) — assert .tagName === 'BUTTON' and .type === 'button'.
    - Test F: "hide button is keyboard-activatable (Enter)"
      Render. Focus hide button. fireEvent.keyDown with Enter. Native <button> handles this — verify by spying click via Enter (use `fireEvent.click` after focus to simulate; Enter on button fires click natively in browsers — in jsdom we just assert it's a button which gives us keyboard semantics for free).
    - Test G: "aria-label interpolates the title prop"
      Render with title='Mitt CV'. Expect button name to be exactly "Dölj widget Mitt CV".
    - Test H: "size-toggle group still renders alongside hide button"
      Render with editMode=true, onHide=fn. Both `getByRole('group', { name: 'Välj widgetstorlek' })` AND `getByRole('button', { name: /Dölj/ })` are present.
  </behavior>
  <action>
    **Step 1 — Extend types.ts**

    Edit `client/src/components/widgets/types.ts` — add `onHide` to `WidgetProps`:
    ```typescript
    export interface WidgetProps {
      id: string
      size: WidgetSize
      onSizeChange?: (newSize: WidgetSize) => void
      allowedSizes?: WidgetSize[]
      editMode?: boolean
      className?: string
      /** Phase 4: when provided AND editMode=true, renders the hide-button (×) in Header */
      onHide?: () => void
    }
    ```

    **Step 2 — Extend Widget.tsx**

    Edit `client/src/components/widgets/Widget.tsx`:

    a) Update `WidgetContextValue` interface:
    ```typescript
    interface WidgetContextValue {
      size: WidgetSize
      onSizeChange?: (newSize: WidgetSize) => void
      allowedSizes: WidgetSize[]
      editMode: boolean
      onHide?: () => void  // NEW
    }
    ```

    b) Update `WidgetRoot` to accept `onHide` from `WidgetRootProps` (already extends WidgetProps so it's inherited) and pass to context:
    ```typescript
    function WidgetRoot({
      id, size, onSizeChange, allowedSizes = ['S', 'M', 'L'],
      editMode = false, onHide, className, children,
    }: WidgetRootProps) {
      return (
        <WidgetContext.Provider value={{ size, onSizeChange, allowedSizes, editMode, onHide }}>
          <div ...>{children}</div>
        </WidgetContext.Provider>
      )
    }
    ```

    c) Update `WidgetHeader`:
    - Import `X` from lucide-react: `import { X as XIcon } from 'lucide-react'`
    - Read `onHide` from useWidgetContext()
    - Render hide button after the size-toggle group (so size-toggle is left of hide-×, mirroring nav-hub-sketch.html intent), wrapped in a flex container:

    ```typescript
    function WidgetHeader({ icon: Icon, title }: WidgetHeaderProps) {
      const { size, onSizeChange, allowedSizes, editMode, onHide } = useWidgetContext()
      const showHide = editMode && !!onHide
      const toggleGroupClass = [
        'flex gap-[1px] bg-[var(--stone-150)] rounded-[6px] p-[1px]',
        'transition-opacity duration-[var(--motion-fast)]',
        editMode ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus-within:opacity-100',
      ].join(' ')

      return (
        <div className="flex items-center justify-between mb-[10px]">
          <div className="flex items-center gap-[8px]">
            <div className="w-[26px] h-[26px] rounded-[7px] bg-[var(--c-bg)] text-[var(--c-text)] flex items-center justify-center flex-shrink-0">
              <Icon size={14} aria-hidden="true" />
            </div>
            <h3 className="text-[13px] font-bold leading-[1.3] text-[var(--stone-900)] m-0">
              {title}
            </h3>
          </div>

          <div className="flex items-center gap-[6px]">
            {/* Size toggle group (existing) */}
            <div role="group" aria-label="Välj widgetstorlek" className={toggleGroupClass}>
              {allowedSizes.map((s) => {
                const isActive = s === size
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => onSizeChange?.(s)}
                    aria-pressed={isActive}
                    aria-label={`Sätt storlek till ${s}`}
                    className={[
                      'w-[18px] h-[18px] text-[9px] font-bold rounded-[5px]',
                      'cursor-pointer border-0',
                      isActive
                        ? 'bg-white text-[var(--c-text)]'
                        : 'bg-transparent text-[var(--stone-700)]',
                    ].join(' ')}
                  >
                    {s}
                  </button>
                )
              })}
            </div>

            {/* Phase 4: hide button — only when editMode && onHide */}
            {showHide && (
              <button
                type="button"
                onClick={onHide}
                aria-label={`Dölj widget ${title}`}
                className={[
                  'w-[18px] h-[18px] flex items-center justify-center',
                  'rounded-[5px] text-[var(--stone-500)]',
                  'hover:bg-[var(--stone-150)] hover:text-[var(--stone-800)]',
                  'focus:outline-none',
                  'focus:shadow-[0_0_0_3px_var(--c-bg),0_0_0_4px_var(--c-solid)]',
                  'border-0 bg-transparent cursor-pointer',
                ].join(' ')}
              >
                <XIcon size={12} aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      )
    }
    ```

    **Step 3 — Extend Widget.test.tsx**

    Append the 8 new test cases (A–H) to the existing `describe('Widget compound', ...)` block. Helper signature already supports `onHide` via Partial spread. Add a small wrapper test for clarity:

    ```typescript
    it('renders hide button when editMode=true AND onHide provided', () => {
      const onHide = vi.fn()
      render(
        <Widget id="t" size="M" editMode onHide={onHide}>
          <Widget.Header icon={FileUser} title="Test Widget" />
          <Widget.Body>x</Widget.Body>
        </Widget>
      )
      expect(screen.getByRole('button', { name: 'Dölj widget Test Widget' })).toBeInTheDocument()
    })
    // ... B–H following same pattern
    ```
  </action>
  <verify>
    <automated>cd client && npm run test:run -- src/components/widgets/Widget.test.tsx</automated>
    Plus type-check: `cd client && npx tsc --noEmit`.
    Plus existing tests still pass: `cd client && npm run test:run -- src/components/widgets/`.
  </verify>
  <acceptance_criteria>
    - [ ] `WidgetProps` includes optional `onHide?: () => void`.
    - [ ] `WidgetContextValue` includes `onHide?: () => void`.
    - [ ] `WidgetRoot` passes `onHide` into the context provider value.
    - [ ] `WidgetHeader` renders the hide button only when `editMode && onHide`.
    - [ ] Hide button is `<button type="button">` with `aria-label="Dölj widget {title}"` (Swedish, interpolated).
    - [ ] Hide button uses focus ring `box-shadow: 0 0 0 3px var(--c-bg), 0 0 0 4px var(--c-solid)`.
    - [ ] Hide button calls `onHide()` on click.
    - [ ] Hide button is positioned after size-toggle in a flex container with `gap-[6px]`.
    - [ ] All 8 new test cases (A–H) pass.
    - [ ] All existing Widget.test.tsx cases still pass (no regressions).
    - [ ] `cd client && npx tsc --noEmit` passes.
  </acceptance_criteria>
  <done>
    Widget compound has the hide-affordance ready to wire. Hub-level providers (Plan 04) inject `onHide` per widget.
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Create JobsokLayoutContext peer-provider + extend HubGrid filter</name>
  <files>
    client/src/components/widgets/JobsokLayoutContext.tsx,
    client/src/components/widgets/HubGrid.tsx,
    client/src/components/widgets/HubGrid.test.tsx,
    client/src/components/widgets/__tests__/JobsokLayoutContext.test.tsx
  </files>
  <read_first>
    - client/src/components/widgets/JobsokDataContext.tsx (pattern to mirror — peer-provider)
    - client/src/components/widgets/HubGrid.tsx (current — Slot has no visibility filter)
    - client/src/components/widgets/HubGrid.test.tsx (extend with visibility test)
    - .planning/phases/04-layout-persistence-hide-show/04-RESEARCH.md §"Pattern 3: JobsokLayoutContext Peer-Context" + §"Pattern 5: HubGrid Visibility Filter"
    - client/src/hooks/useWidgetLayout.ts (Plan 01) — its return shape `{layout, saveDebounced, save, flushNow, isLoading}`
    - client/src/components/widgets/types.ts (WidgetLayoutItem with `visible`)
  </read_first>
  <behavior>
    Tests in NEW `client/src/components/widgets/__tests__/JobsokLayoutContext.test.tsx`:

    - Test 1: "useJobsokLayout returns context value when wrapped in provider"
      Render hook with provider value `{layout: [...], editMode: false, hideWidget: vi.fn(), showWidget: vi.fn(), setEditMode: vi.fn(), resetLayout: vi.fn()}`. Expect hook returns same shape.
    - Test 2: "useJobsokLayout throws clear error when used outside provider"
      Render hook without provider. Expect throw with message containing "JobsokLayoutProvider".
    - Test 3: "hideWidget marks layout item visible: false"
      Render provider with computed value where `hideWidget` calls a stateSetter. Use a minimal harness component that calls hideWidget('cv') and reads layout — assert resulting layout has `cv.visible === false`.
    - Test 4: "showWidget marks layout item visible: true"
      Same harness — start with cv hidden, call showWidget('cv'), assert cv.visible === true.
    - Test 5: "setEditMode toggles editMode in context"
      Harness with React state for editMode + setter passed in. Assert context reflects updates.

    Tests added to existing `client/src/components/widgets/HubGrid.test.tsx`:

    - Test I: "Slot accepts visible prop and renders nothing when visible=false"
      Render `<HubGrid.Slot size="M" visible={false}><div>hidden</div></HubGrid.Slot>` inside HubGrid.
      Expect `queryByText('hidden')` to be null AND no grid cell `<div>` element produced (component returns null).
    - Test J: "Slot renders children when visible=true (default)"
      `<HubGrid.Slot size="M"><div>shown</div></HubGrid.Slot>`. Expect `getByText('shown')` present.
    - Test K: "Slot renders children when visible omitted (defaults to true)"
      Same as J without explicit visible prop.
  </behavior>
  <action>
    **Step 1 — Create JobsokLayoutContext.tsx**

    New file `client/src/components/widgets/JobsokLayoutContext.tsx`:

    ```typescript
    import { createContext, useContext, type ReactNode } from 'react'
    import type { WidgetLayoutItem } from './types'

    /**
     * Layout state distributed to widgets in the JobsokHub.
     * Peer to JobsokDataContext (data layer); both wrap the hub in JobsokHub.tsx.
     *
     * Provider order (locked from 04-CONTEXT.md):
     *   <JobsokLayoutProvider>     ← outer (resolves first)
     *     <JobsokDataProvider>     ← inner (data fetch can depend on visible widgets)
     *       {children}
     *     </JobsokDataProvider>
     *   </JobsokLayoutProvider>
     */
    export interface JobsokLayoutValue {
      layout: WidgetLayoutItem[]
      editMode: boolean
      setEditMode: (next: boolean) => void
      hideWidget: (id: string) => void
      showWidget: (id: string) => void
      updateSize: (id: string, size: WidgetLayoutItem['size']) => void
      resetLayout: () => void
      isLoading: boolean
    }

    const JobsokLayoutContext = createContext<JobsokLayoutValue | null>(null)

    export function JobsokLayoutProvider({
      value,
      children,
    }: {
      value: JobsokLayoutValue
      children: ReactNode
    }) {
      return (
        <JobsokLayoutContext.Provider value={value}>
          {children}
        </JobsokLayoutContext.Provider>
      )
    }

    export function useJobsokLayout(): JobsokLayoutValue {
      const ctx = useContext(JobsokLayoutContext)
      if (!ctx) {
        throw new Error('useJobsokLayout must be used inside <JobsokLayoutProvider>')
      }
      return ctx
    }

    /** Helper for hidden-widgets-panel: returns layout items with visible: false */
    export function selectHiddenWidgets(layout: WidgetLayoutItem[]): WidgetLayoutItem[] {
      return layout.filter(item => item.visible === false)
    }
    ```

    **Step 2 — Extend HubGrid.tsx Slot with visible prop**

    Edit `client/src/components/widgets/HubGrid.tsx`:

    ```typescript
    interface SlotProps {
      size: WidgetSize
      children: ReactNode
      fallback?: ReactNode
      /** Phase 4: when false, slot renders nothing (widget is hidden by user) */
      visible?: boolean
    }

    function Slot({ size, children, fallback, visible = true }: SlotProps) {
      if (!visible) return null
      // ... rest unchanged (skeleton + WidgetErrorBoundary + Suspense)
    }
    ```

    **Step 3 — Author JobsokLayoutContext tests**

    Create `client/src/components/widgets/__tests__/JobsokLayoutContext.test.tsx`. Use a small harness component:

    ```typescript
    import { describe, it, expect, vi } from 'vitest'
    import { render, screen, fireEvent } from '@testing-library/react'
    import { useState } from 'react'
    import {
      JobsokLayoutProvider, useJobsokLayout, selectHiddenWidgets,
      type JobsokLayoutValue
    } from '../JobsokLayoutContext'
    import type { WidgetLayoutItem } from '../types'

    function Harness({ initial }: { initial: WidgetLayoutItem[] }) {
      const [layout, setLayout] = useState(initial)
      const [editMode, setEditMode] = useState(false)

      const value: JobsokLayoutValue = {
        layout,
        editMode,
        setEditMode,
        hideWidget: (id) =>
          setLayout(prev => prev.map(w => w.id === id ? { ...w, visible: false } : w)),
        showWidget: (id) =>
          setLayout(prev => prev.map(w => w.id === id ? { ...w, visible: true } : w)),
        updateSize: (id, size) =>
          setLayout(prev => prev.map(w => w.id === id ? { ...w, size } : w)),
        resetLayout: () => setLayout(initial),
        isLoading: false,
      }

      return (
        <JobsokLayoutProvider value={value}>
          <Reader />
        </JobsokLayoutProvider>
      )
    }

    function Reader() {
      const ctx = useJobsokLayout()
      return (
        <div>
          <span data-testid="cv-visible">{String(ctx.layout.find(l => l.id === 'cv')?.visible)}</span>
          <span data-testid="edit-mode">{String(ctx.editMode)}</span>
          <button onClick={() => ctx.hideWidget('cv')}>hide-cv</button>
          <button onClick={() => ctx.showWidget('cv')}>show-cv</button>
          <button onClick={() => ctx.setEditMode(true)}>edit-on</button>
        </div>
      )
    }
    ```

    Implement Tests 1-5 using this harness. For Test 2 (throw without provider), use `expect(() => render(<Reader />)).toThrow(/JobsokLayoutProvider/)` and silence console.error temporarily.

    Add a small selectHiddenWidgets helper test:
    - Test 6: "selectHiddenWidgets returns only items with visible: false"
      Input: `[{id:'cv', visible:false, ...}, {id:'cl', visible:true, ...}]`
      Expect: array length 1, item id 'cv'.

    **Step 4 — Extend HubGrid.test.tsx**

    Append Tests I/J/K to existing `describe('HubGrid', ...)` block. Use minimal child elements (`<div>hidden</div>`).

    For Test I, wrap Slot inside HubGrid root so the existing context for grid layout exists. Confirm via `container.querySelector` that no grid-cell div is produced when visible=false (component returns `null` outright).
  </action>
  <verify>
    <automated>cd client && npm run test:run -- src/components/widgets/HubGrid.test.tsx src/components/widgets/__tests__/JobsokLayoutContext.test.tsx</automated>
    Type-check: `cd client && npx tsc --noEmit`.
    Plan 01 + Plan 02 tests together: `cd client && npm run test:run -- src/components/widgets/ src/hooks/useWidgetLayout.test.ts`.
  </verify>
  <acceptance_criteria>
    - [ ] `client/src/components/widgets/JobsokLayoutContext.tsx` exists with exports `JobsokLayoutProvider`, `useJobsokLayout`, `selectHiddenWidgets`, `JobsokLayoutValue`.
    - [ ] `JobsokLayoutValue` interface fields: `layout`, `editMode`, `setEditMode`, `hideWidget`, `showWidget`, `updateSize`, `resetLayout`, `isLoading` — types match the action's interface block.
    - [ ] `useJobsokLayout()` throws when used outside provider with message containing "JobsokLayoutProvider".
    - [ ] `HubGrid.Slot` accepts optional `visible?: boolean` prop (default true).
    - [ ] When `visible={false}`, `HubGrid.Slot` returns null (no DOM emitted).
    - [ ] All 6 JobsokLayoutContext tests pass.
    - [ ] All 3 new HubGrid tests (I/J/K) pass.
    - [ ] All existing HubGrid.test.tsx and Widget.test.tsx tests still pass.
    - [ ] `cd client && npx tsc --noEmit` passes.
  </acceptance_criteria>
  <done>
    Plan 03's HiddenWidgetsPanel can call `selectHiddenWidgets(layout)` to populate its list. Plan 04's JobsokHub.tsx can wrap children with `<JobsokLayoutProvider value={...}>` and pass per-widget `onHide={() => hideWidget(id)}` to each Widget.
  </done>
</task>

</tasks>

<verification>
- All 2 tasks complete and acceptance criteria met.
- `cd client && npm run test:run -- src/components/widgets/` shows new tests passing alongside existing.
- `cd client && npx tsc --noEmit` passes.
- No regressions in Phase 2/3 widget tests.
- Hide button only appears when `editMode=true && onHide provided` — never otherwise.
- `JobsokLayoutContext` mirrors `JobsokDataContext` structure (compound with provider + hook).
</verification>

<success_criteria>
CUST-01 building blocks ready:
1. Hide-button is keyboard-accessible, has correct Swedish aria-label, fires onHide handler.
2. JobsokLayoutContext is the single source of truth for layout state in the hub tree.
3. HubGrid.Slot can hide a widget purely by `visible={false}` prop — no DOM emitted.
4. Plan 03 + Plan 04 can compose these primitives without re-implementing context plumbing.
</success_criteria>

<output>
After completion, create `.planning/phases/04-layout-persistence-hide-show/04-02-widget-hide-button-and-layout-context-SUMMARY.md` documenting:
- Final exports from JobsokLayoutContext.tsx
- Total Widget.test.tsx test count (existing + 8 new)
- Total HubGrid.test.tsx test count (existing + 3 new)
- Visual confirmation: hide button placement (right side, after size-toggle, with gap-[6px])
- Confirmation hide button is hidden by default (editMode=false default carried from Phase 2)
- Any deviation from research-recommended interface (e.g. extra exports, signature changes)
</output>
