---
phase: 04-layout-persistence-hide-show
plan: 03
subsystem: ui, widgets, accessibility
tags: [react, typescript, vitest, tdd, accessibility, dropdown, confirm-dialog, aria]

# Dependency graph
requires:
  - phase: 04-layout-persistence-hide-show
    plan: 02
    provides: JobsokLayoutContext (useJobsokLayout, selectHiddenWidgets, JobsokLayoutValue, JobsokLayoutProvider)
  - phase: 02-static-widget-grid
    provides: ConfirmDialogProvider (main.tsx line 104), useConfirmDialog hook
provides:
  - HiddenWidgetsPanel component (dropdown, Escape+outside-click close, a11y role=region)
  - WIDGET_LABELS: Record<WidgetId, string> — 8 Swedish display names for all hub widgets
affects:
  - 04-04 (JobsokHub renders <HiddenWidgetsPanel isOpen={...} onClose={...}>; controls isOpen via useState)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - TDD RED-GREEN — test file authored before implementation, confirmed fail then pass
    - Controlled dropdown — isOpen prop + onClose callback; no internal open state
    - useEffect event-listener cleanup — Escape keydown + mousedown outside-click; attached only when isOpen=true
    - useConfirmDialog await pattern — async handleReset awaits confirm() Promise before calling resetLayout()
    - vi.mock partial override — useConfirmDialog mocked per-module while spreading real ConfirmDialogProvider

key-files:
  created:
    - client/src/components/widgets/widgetLabels.ts
    - client/src/components/widgets/HiddenWidgetsPanel.tsx
    - client/src/components/widgets/HiddenWidgetsPanel.test.tsx

key-decisions:
  - "Panel isOpen controlled by caller (Plan 04 — JobsokHub useState), not internal context — maximum composability"
  - "Empty state copy: 'Inga dolda widgets' — neutral, action-implicit since Reset button is always visible below"
  - "Reset button always rendered (even when no hidden widgets) — user may want to reset sizes without hiding any widget"
  - "onClose called after resetLayout() on confirm:true — panel closes automatically after successful reset"
  - "WIDGET_LABELS uses Record<WidgetId, string> (not Partial) — exhaustive, TypeScript enforces all 8 keys present"

# Metrics
duration: ~2 min
completed: 2026-04-28
---

# Phase 4 Plan 03: HiddenWidgetsPanel + Reset Summary

**Dropdown panel listing hidden widgets with per-row Återvisa-button and bottom Reset-button triggering ConfirmDialog (warning variant, locked Swedish copy) before calling resetLayout() — 13 tests, all passing, zero TypeScript errors**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-04-28T22:49:31Z
- **Completed:** 2026-04-28T22:51:49Z
- **Tasks:** 1 (TDD)
- **Files created:** 3

## Accomplishments

### Task 1: widgetLabels.ts + HiddenWidgetsPanel component (TDD)

**widgetLabels.ts:**
- `WIDGET_LABELS: Record<WidgetId, string>` — exactly 8 entries matching all WIDGET_REGISTRY keys
- Swedish names: cv→'Mitt CV', cover-letter→'Personligt brev', interview→'Intervjuträning', job-search→'Sök jobb', applications→'Mina ansökningar', spontaneous→'Spontanansökan', salary→'Lön & förhandling', international→'Internationellt'
- Imports `WidgetId` from `./registry` — TypeScript enforces exhaustive coverage

**HiddenWidgetsPanel.tsx (106 lines):**
- Props: `{ isOpen: boolean; onClose: () => void }` — fully controlled
- Calls `useJobsokLayout()` for `layout`, `showWidget`, `resetLayout`
- Calls `useConfirmDialog()` for `confirm`
- `selectHiddenWidgets(layout)` filters to visible:false items; maps to `<li>` rows
- Each row: Swedish label + `<button aria-label="Återvisa widget {label}">` calling `showWidget(item.id)`
- Empty state: `<p>Inga dolda widgets</p>` when no hidden items
- Reset button: always rendered; async `handleReset` awaits `confirm({...})` with locked copy; calls `resetLayout()` + `onClose()` on true
- `useEffect` attaches/removes keydown (Escape→onClose) + mousedown (outside→onClose) only while `isOpen=true`
- Outer container: `role="region" aria-label="Dolda widgets"`
- Returns `null` when `isOpen=false`

**HiddenWidgetsPanel.test.tsx (13 tests):**
- `vi.mock` partial override of `@/components/ui/ConfirmDialog` — `useConfirmDialog` returns `mockConfirm`; real `ConfirmDialogProvider` preserved
- `renderPanel()` helper wraps in `<ConfirmDialogProvider><JobsokLayoutProvider value={...}>`
- Test 6 verifies locked confirm copy with exact object match
- Tests 7–8 use `act(async () => {...})` + `await Promise.resolve()` to flush microtask queue
- Tests 9–10 use `fireEvent.keyDown/mouseDown(document, ...)` for global handler coverage

## Test Counts

| File | Tests | Status |
|------|-------|--------|
| `HiddenWidgetsPanel.test.tsx` | 13 | All pass |
| **Widget directory total** | **106 pass, 3 skip** | No regressions |

## Verified Properties

- **ConfirmDialogProvider scope:** `client/src/main.tsx` line 104 — wraps entire app tree. Confirmed by `grep -n "ConfirmDialogProvider"`.
- **Locked confirm copy:** Verified verbatim in Test 6 — `title: 'Återställ layout?'`, `message: 'Är du säker? Detta tar bort alla anpassningar för denna hub.'`, `confirmText: 'Återställ'`, `cancelText: 'Avbryt'`, `variant: 'warning'`
- **TypeScript:** `npx tsc --noEmit` exits 0 — zero errors

## Component Metrics

| File | Line Count |
|------|-----------|
| `widgetLabels.ts` | 21 |
| `HiddenWidgetsPanel.tsx` | 106 |
| `HiddenWidgetsPanel.test.tsx` | 188 |

## Open Question for Plan 04

**Who controls `isOpen` state?** → `useState` in `JobsokHub` (recommended). Simple boolean toggled by the "Anpassa vy" button. No need to lift this into context — edit-mode state is already there, but panel open/close is transient UI.

## Task Commits

1. **Task 1: HiddenWidgetsPanel + WIDGET_LABELS** — `0c1dff6` (feat)

## Deviations from Plan

None — plan executed exactly as written.

## Next Phase Readiness

- Plan 04 (JobsokHub wiring): Render `<HiddenWidgetsPanel isOpen={panelOpen} onClose={() => setPanelOpen(false)} />` inside hub; toggle `panelOpen` from "Anpassa vy" button; wrap with `<JobsokLayoutProvider value={...}>`
- No blockers

---
*Phase: 04-layout-persistence-hide-show*
*Completed: 2026-04-28*

## Self-Check: PASSED

- [x] `client/src/components/widgets/widgetLabels.ts` exists — 8 entries, Record<WidgetId, string>
- [x] `client/src/components/widgets/HiddenWidgetsPanel.tsx` exists — exports named HiddenWidgetsPanel
- [x] `client/src/components/widgets/HiddenWidgetsPanel.test.tsx` exists — 13 tests
- [x] All 13 HiddenWidgetsPanel tests pass
- [x] 106 widget-directory tests pass (3 skipped pre-existing)
- [x] `npx tsc --noEmit` exits 0
- [x] Commit `0c1dff6` present in git log
- [x] ConfirmDialogProvider at main.tsx line 104 confirmed
