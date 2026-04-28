---
phase: 04-layout-persistence-hide-show
plan: 04
subsystem: ui, hooks, context, widgets, testing
tags: [react, typescript, vitest, integration-tests, accessibility, supabase, context-composition, aria-live]

# Dependency graph
requires:
  - phase: 04-layout-persistence-hide-show
    plan: 01
    provides: useWidgetLayout hook, useBreakpoint, getDefaultLayout
  - phase: 04-layout-persistence-hide-show
    plan: 02
    provides: JobsokLayoutProvider, JobsokLayoutValue, HubGrid.Slot visible prop
  - phase: 04-layout-persistence-hide-show
    plan: 03
    provides: HiddenWidgetsPanel, WIDGET_LABELS
provides:
  - JobsokHub.tsx with full Phase 4 wiring — the composition point for all P04 primitives
  - 12 integration tests (α–μ) proving CUST-01/02/03 end-to-end
  - Phase 5 replication pattern documented below
affects:
  - 05-layout-persistence-other-hubs (pattern established here for Karriär/Resurser/Min Vardag/Översikt)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - effectiveLayout = layout.length > 0 ? layout : getDefaultLayout() — fallback while query resolves
    - JobsokLayoutProvider outer → JobsokDataProvider inner (locked provider order)
    - Panel trigger button in PageLayout actions slot; panel itself inside provider tree
    - Outside-click-aware test flow: hide widget → panel closes → re-open panel to test Återvisa

key-files:
  created:
    - client/src/pages/hubs/__tests__/JobsokHub.test.tsx (extended: +12 new tests)
  modified:
    - client/src/pages/hubs/JobsokHub.tsx
    - client/src/components/widgets/CvWidget.tsx
    - client/src/components/widgets/CoverLetterWidget.tsx
    - client/src/components/widgets/InterviewWidget.tsx
    - client/src/components/widgets/JobSearchWidget.tsx
    - client/src/components/widgets/ApplicationsWidget.tsx
    - client/src/components/widgets/SpontaneousWidget.tsx
    - client/src/components/widgets/SalaryWidget.tsx
    - client/src/components/widgets/InternationalWidget.tsx

key-decisions:
  - "effectiveLayout fallback to getDefaultLayout when layout=[] prevents mutation functions from producing empty arrays before query resolves"
  - "HiddenWidgetsPanel moved inside <JobsokLayoutProvider> (calls useJobsokLayout) — trigger button stays in actions slot"
  - "All 8 widgets needed onHide forwarded to Widget (was missing — hide button requires it)"
  - "Test flow for ε/η/θ: hide widget → panel auto-closes on outside-click → re-open panel via Anpassa vy click"
  - "selectChain.eq uses mockReturnThis which returns the chain object when called as obj.method() — allows chained Supabase mock"
  - "Test it() timeout = 15000-20000ms for tests using renderAndWait + additional user interactions"

patterns-established:
  - "Pattern for Phase 5 hub replication: import useWidgetLayout, useBreakpoint, JobsokLayoutProvider, HiddenWidgetsPanel, WIDGET_LABELS, getDefaultLayout — build layoutValue from effectiveLayout — pass actions={customizeButton} to PageLayout"
  - "All widget components must destructure onHide from WidgetProps and forward to Widget"

requirements-completed: [CUST-01, CUST-02]

# Metrics
duration: 20min
completed: 2026-04-28
---

# Phase 4 Plan 04: JobsokHub Wiring + Integration Tests Summary

**JobsokHub fully wired with useWidgetLayout + JobsokLayoutProvider + HiddenWidgetsPanel + 12 integration tests (α–μ) proving CUST-01/02/03 end-to-end — all 24 hub tests + 130 Phase 4 suite tests green, zero TypeScript errors**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-04-28T22:53:48Z
- **Completed:** 2026-04-28T23:13:46Z
- **Tasks:** 2 (Task 1: hub wiring, Task 2: integration tests TDD)
- **Files modified/created:** 10

## Accomplishments

### Task 1: Wire JobsokHub.tsx

Final hub composition that brings together Plans 01–03:

- Replaced hub-local `sizes` state + `setSizes` with `useWidgetLayout('jobb')` providing `layout`, `saveDebounced`, `save`, `isLoading`
- Introduced `effectiveLayout` = `layout.length > 0 ? layout : getDefaultLayout('jobb', breakpoint)` — ensures mutations work correctly before the Supabase query resolves
- Added `editMode` (useState false) and `panelOpen` (useState false) — hub-local per locked CONTEXT.md decision
- Added `layoutById` Map for O(1) size/visibility lookups during render
- Implemented `hideWidget`, `showWidget`, `updateSize`, `resetLayout` — all map over `effectiveLayout` and call `saveDebounced` (or `save` for reset)
- Provider order: `JobsokLayoutProvider` (outer) → `JobsokDataProvider` (inner) — locked from 04-CONTEXT.md
- Added "Anpassa vy" button in `PageLayout actions` slot with `aria-pressed={editMode}`, `aria-expanded={panelOpen}`, `aria-controls="hidden-widgets-panel"`
- Moved `HiddenWidgetsPanel` inside `JobsokLayoutProvider` (it calls `useJobsokLayout` — must be inside the provider tree)
- All 4 mutators set Swedish `announcement` text via `setAnnouncement`
- All widgets receive `editMode={editMode}` and `onHide={() => hideWidget(item.id)}`
- `HubGrid.Slot` receives `visible={persisted?.visible !== false}` (defaults true when not persisted)

**Final line count:** 180 lines (clean, no dead code)

### Auto-fix 1: Widget onHide forwarding (Rule 1 — Bug)

All 8 widgets (`CvWidget`, `CoverLetterWidget`, `InterviewWidget`, `JobSearchWidget`, `ApplicationsWidget`, `SpontaneousWidget`, `SalaryWidget`, `InternationalWidget`) were not forwarding `onHide` from their `WidgetProps` to the `Widget` compound. The `Widget.Root` never received `onHide`, so `showHide = editMode && !!onHide` was always `false` and hide buttons never appeared. Fixed by adding `onHide` to each widget's destructuring and passing `onHide={onHide}` to every `<Widget>` call.

### Task 2: Integration Tests (TDD)

12 new tests added to `client/src/pages/hubs/__tests__/JobsokHub.test.tsx`. All 8 pre-existing tests continue to pass.

| Test | What It Proves |
|------|---------------|
| α | "Anpassa vy" button in PageLayout actions slot |
| β | toggle editMode via aria-pressed |
| γ | 8 hide buttons appear in edit mode |
| δ | hiding removes widget from grid (CUST-01) |
| ε | Återvisa restores hidden widget (CUST-01) |
| ζ | Återställ opens ConfirmDialog (CUST-02) |
| η | confirming reset restores all 8 widgets (CUST-02) |
| θ | cancelling reset leaves layout unchanged (CUST-02) |
| ι | upsert payload includes breakpoint='desktop' (Pitfall 6) |
| κ | mobile upsert uses breakpoint='mobile' only (per-breakpoint independence) |
| λ | persisted visible:false survives reload (CUST-03) |
| μ | aria-live announces "Widget Mitt CV dold" |

**Test counts:**
- JobsokHub.test.tsx: 8 existing + 12 new + 4 error isolation = 24 total
- Full Phase 4 suite: 130 passing, 3 skipped (pre-existing: salary/international table absent)

## Provider Order Verification

```
<JobsokLayoutProvider value={layoutValue}>   ← OUTER (resolves layout first)
  <JobsokDataProvider value={summary}>        ← INNER
    {children}
  </JobsokDataProvider>
</JobsokLayoutProvider>
```

This order is locked from 04-CONTEXT.md. The data fetch could theoretically depend on the visible widget set in Phase 5. Never swap.

## Pattern for Phase 5 Replication

Phase 5 adds hide/show to Karriär/Resurser/Min Vardag/Översikt hubs. The replication pattern is:

1. Import: `useWidgetLayout`, `useBreakpoint`, `JobsokLayoutProvider`, `JobsokLayoutValue`, `HiddenWidgetsPanel`, `WIDGET_LABELS`, `getDefaultLayout`, `WIDGET_REGISTRY`, `WidgetLayoutItem`
2. Hub-level state: `useState` for `editMode` and `panelOpen` (NOT Zustand)
3. `effectiveLayout = layout.length > 0 ? layout : getDefaultLayout(hubId, breakpoint)`
4. Build `layoutValue: JobsokLayoutValue` from effectiveLayout mutators
5. Render order: `<JobsokLayoutProvider value={layoutValue}><HubDataProvider value={...}>`
6. `actions` slot: trigger button only — panel renders inside provider tree
7. Each widget gets `editMode={editMode} onHide={() => hideWidget(item.id)}`
8. Ensure each widget component destructures and forwards `onHide` to `Widget`

Hub-specific changes: hub ID string, hub data provider name, section structure.

## Open Questions — Final Answers

**Open Question 2 (useBeforeUnload flush):** Phase 4 fires `flushNow()` synchronously inside the `beforeunload` listener which calls `mutation.mutate()`. The mutation's HTTP request itself is async and may be cut off if the tab closes within the request timeout. Users with sub-1000ms actions before tab close may lose the last change. This is an acceptable v1.0 tradeoff; documented here.

**Open Question 3 (updated_at conflict detection):** Phase 4 ships without timestamp comparison. Strategy: `onSettled: invalidateQueries` re-fetches after every mutation. Simplified v1.0 approach — last-write-wins. Conflict detection (multi-tab) deferred to v1.1.

## Task Commits

1. **Task 1: Wire JobsokHub with full Phase 4 stack** — `530c1c5` (feat)
2. **Auto-fix: forward onHide + effectiveLayout fallback** — `55babcf` (fix)
3. **Task 2: 12 Phase 4 integration tests α–μ** — `aaa8415` (test)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] All 8 widgets missing onHide forwarding**
- **Found during:** Task 2 TDD RED phase (hide buttons not appearing despite editMode=true)
- **Issue:** All 8 widget components destructured `WidgetProps` without `onHide` and passed `<Widget ...>` without `onHide`. The `Widget.Root` received `onHide=undefined`, so `showHide = editMode && !!undefined = false`. Hide buttons never rendered.
- **Fix:** Added `onHide` to destructuring in all 8 widgets and passed `onHide={onHide}` to every `<Widget>` call (some widgets have 2-3 Widget render paths depending on data state).
- **Files modified:** CvWidget, CoverLetterWidget, InterviewWidget, JobSearchWidget, ApplicationsWidget, SpontaneousWidget, SalaryWidget, InternationalWidget
- **Commit:** 55babcf

**2. [Rule 1 - Bug] HiddenWidgetsPanel in actions slot threw "useJobsokLayout outside provider"**
- **Found during:** Task 1 first test run (all 24 tests failed immediately)
- **Issue:** Initial implementation put `HiddenWidgetsPanel` inside the `customizeButton` JSX element passed to `PageLayout actions` prop. But `PageLayout` renders `actions` inside `PageHeader` — OUTSIDE the `JobsokLayoutProvider` in the JSX tree. `HiddenWidgetsPanel` calls `useJobsokLayout()` which threw.
- **Fix:** Move `HiddenWidgetsPanel` into hub content tree (inside `<JobsokLayoutProvider>`). Only the trigger button lives in `actions` slot.
- **Files modified:** `client/src/pages/hubs/JobsokHub.tsx`
- **Commit:** 55babcf

**3. [Rule 1 - Bug] effectiveLayout needed for pre-query mutation correctness**
- **Found during:** Task 2 (M-button size test failed — `updateSize` mapped over `[]` and produced `[]`)**
- **Issue:** Before the Supabase query resolves, `layout = []`. Mutations (`hideWidget`, `updateSize`) mapped over empty array → produced `[]` → optimistic cache write of `[]` → all widget sizes reverted to defaults.
- **Fix:** `effectiveLayout = layout.length > 0 ? layout : getDefaultLayout('jobb', breakpoint)` — mutations always operate on a non-empty array.
- **Files modified:** `client/src/pages/hubs/JobsokHub.tsx`
- **Commit:** 55babcf

---

**Total deviations:** 3 auto-fixed (all Rule 1 bugs caught during TDD)
**Impact:** All 3 were caught before any user-visible behavior was committed. No scope creep; the fixes are precisely required for correctness.

## Pre-Existing Failures (Out of Scope)

- `src/pages/Dashboard.test.tsx` (20 failures) — pre-existing (documented in Plans 02-04 and 03-02)
- `src/test/integration/register-flow.test.tsx` (1 failure) — pre-existing (documented in Plan 02-04)

Both verified failing before any Plan 04-04 changes.

## Phase 4 Success Criteria — All Met

1. **CUST-01** (hide/show): Tests δ, ε, γ prove user can hide any widget and restore it via panel
2. **CUST-02** (reset): Tests ζ, η, θ prove reset with ConfirmDialog protection
3. **CUST-03** (persistence): Test λ proves persisted `visible:false` survives reload; Tests ι, κ prove per-breakpoint upsert key independence

---
*Phase: 04-layout-persistence-hide-show*
*Completed: 2026-04-28*
