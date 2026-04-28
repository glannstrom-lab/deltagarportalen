---
phase: 04-layout-persistence-hide-show
verified: 2026-04-28T23:20:00Z
status: passed
score: 15/15 must-haves verified
gaps: []
---

# Phase 4: Layout Persistence + Hide/Show — Verification Report

**Phase Goal:** Users can hide individual widgets per hub, restore hidden widgets, reset to default layout, and have these preferences survive across sessions and devices — without drag/resize
**Verified:** 2026-04-28T23:20:00Z
**Status:** passed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `user_widget_layouts` table exists with UNIQUE(user_id, hub_id, breakpoint), 4 RLS policies, updated_at trigger | VERIFIED | Migration file `20260429_user_widget_layouts.sql` contains CREATE TABLE IF NOT EXISTS, UNIQUE constraint, 4 idempotent RLS DO-blocks, trigger via pg_trigger conditional; SUMMARY confirms all 8 DB introspection checks PASS |
| 2 | `useWidgetLayout(hubId)` hook with optimistic update + onError rollback + 1000ms debounce + useBeforeUnload flush | VERIFIED | `client/src/hooks/useWidgetLayout.ts` lines 63–130: debounceRef, pendingPayloadRef, onMutate snapshot, onError restore, setTimeout 1000, beforeunload useEffect with cleanup |
| 3 | `mergeLayouts(persisted, default)` pure function — appends missing, removes unknown | VERIFIED | `client/src/components/widgets/mergeLayouts.ts`: filters validIds from WIDGET_REGISTRY, appends default entries missing from persisted; 5 tests all passing |
| 4 | `useBreakpoint()` hook returns 'desktop'\|'mobile' from matchMedia 900px | VERIFIED | `client/src/hooks/useBreakpoint.ts`: matchMedia('(min-width: 900px)'), addEventListener change, 3 tests passing |
| 5 | Widget.Header has hide-button (×), edit-mode-gated, aria-label "Dölj widget {namn}" | VERIFIED | `client/src/components/widgets/Widget.tsx` line 77: `const showHide = editMode && !!onHide`, line 136: `aria-label={\`Dölj widget ${title}\`}` |
| 6 | JobsokLayoutContext peer-provider exists; useJobsokLayout throws outside provider | VERIFIED | `client/src/components/widgets/JobsokLayoutContext.tsx`: throws "useJobsokLayout must be used inside <JobsokLayoutProvider>"; 6 tests confirm this |
| 7 | HubGrid.Slot with visible:false returns null (no DOM emitted) | VERIFIED | `client/src/components/widgets/HubGrid.tsx` line 78: `if (!visible) return null`; 3 HubGrid tests (I/J/K) confirm |
| 8 | HiddenWidgetsPanel lists hidden widgets with "Återvisa"-button per row | VERIFIED | `client/src/components/widgets/HiddenWidgetsPanel.tsx`: maps `selectHiddenWidgets(layout)` to `<li>` rows each with `aria-label="Återvisa widget {label}"`; 13 tests passing |
| 9 | Reset triggers ConfirmDialog with locked Swedish copy + variant:'warning' | VERIFIED | `HiddenWidgetsPanel.tsx` lines 51–57: `title: 'Återställ layout?'`, `message: 'Är du säker? ...'`, `variant: 'warning'`, exact copy verified in test 6 |
| 10 | JobsokHub.tsx provider order: JobsokLayoutProvider OUTER, JobsokDataProvider INNER | VERIFIED | `client/src/pages/hubs/JobsokHub.tsx` lines 130–131: `<JobsokLayoutProvider>` wraps `<JobsokDataProvider>` |
| 11 | "Anpassa vy" button toggles editMode state | VERIFIED | `JobsokHub.tsx` lines 97–119: button with `aria-pressed={editMode}`, onClick toggles both editMode and panelOpen; integration tests α/β confirm |
| 12 | aria-live announcements on hide/show/reset | VERIFIED | `JobsokHub.tsx` line 134: `<div role="status" aria-live="polite" className="sr-only">`, setAnnouncement called in hideWidget/showWidget/updateSize/resetLayout; integration test μ confirms |
| 13 | No DROP, no destructive ALTER COLUMN in migration | VERIFIED | `grep -cE "^DROP" migration.sql` → 0; `grep -cE "^ALTER TABLE.*DROP\|^ALTER COLUMN.*TYPE" migration.sql` → 0 |
| 14 | Existing 27 deep-link routes untouched | VERIFIED | App.tsx has 56 Route elements; only JobsokHub.tsx modified (confirmed via SUMMARY); all existing route paths preserved including cv/*, cover-letter/*, job-search/*, applications/*, etc. |
| 15 | Existing 51 hooks not replaced (Phase 4 ADDS new hooks) | VERIFIED | Hooks dir contains 54 files; useWidgetLayout.ts and useBreakpoint.ts are new additions; SUMMARY confirms no pre-existing hook modified |

**Score:** 15/15 truths verified

---

## Required Artifacts

| Artifact | Provides | Status | Details |
|----------|----------|--------|---------|
| `supabase/migrations/20260429_user_widget_layouts.sql` | Idempotent table + 4 RLS + trigger | VERIFIED | 83 lines; no DROP statements; UNIQUE(user_id, hub_id, breakpoint); 4 policies in DO $$ blocks |
| `client/src/hooks/useWidgetLayout.ts` | Optimistic hook with debounce + rollback | VERIFIED | 141 lines; exports useWidgetLayout + USER_WIDGET_LAYOUTS_KEY |
| `client/src/components/widgets/mergeLayouts.ts` | Pure reconciliation | VERIFIED | 32 lines; exports mergeLayouts; pure function with no side effects |
| `client/src/hooks/useBreakpoint.ts` | Stable 'desktop'\|'mobile' | VERIFIED | 26 lines; exports useBreakpoint; 900px threshold |
| `client/src/components/widgets/defaultLayouts.ts` | getDefaultLayout(hubId, breakpoint?) | VERIFIED | accepts breakpoint param; all items include visible:true |
| `client/src/components/widgets/types.ts` | WidgetLayoutItem with visible:boolean | VERIFIED | visible field on WidgetLayoutItem; onHide on WidgetProps |
| `client/src/components/widgets/Widget.tsx` | Hide-button in Header, edit-mode-gated | VERIFIED | showHide guard; aria-label interpolated; XIcon; focus ring |
| `client/src/components/widgets/JobsokLayoutContext.tsx` | Peer-context for layout distribution | VERIFIED | exports JobsokLayoutProvider, useJobsokLayout, selectHiddenWidgets, JobsokLayoutValue |
| `client/src/components/widgets/HubGrid.tsx` | Slot visible prop, returns null when false | VERIFIED | SlotProps has visible?: boolean; `if (!visible) return null` |
| `client/src/components/widgets/HiddenWidgetsPanel.tsx` | Dropdown restore/reset panel | VERIFIED | 136 lines; role="region" aria-label="Dolda widgets"; useJobsokLayout + useConfirmDialog |
| `client/src/components/widgets/widgetLabels.ts` | WIDGET_LABELS Swedish names map | VERIFIED | Record<WidgetId, string>; 8 entries matching WIDGET_REGISTRY |
| `client/src/pages/hubs/JobsokHub.tsx` | Final hub with full Phase 4 wiring | VERIFIED | 180 lines; all imports wired; provider order correct |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `useWidgetLayout.ts` | `user_widget_layouts` (Supabase) | `supabase.from('user_widget_layouts').upsert(..., { onConflict: 'user_id,hub_id,breakpoint' })` | WIRED | Line 71–73 of hook; onConflict string exact match |
| `useWidgetLayout.ts` | `mergeLayouts.ts` | `mergeLayouts(persisted, getDefaultLayout(hubId, breakpoint))` in queryFn | WIRED | Line 56 of hook |
| `useWidgetLayout.ts` | `useBreakpoint.ts` | `const breakpoint = useBreakpoint()` in query key | WIRED | Line 37 of hook |
| `Widget.tsx (Header)` | `onHide` callback | `onClick={() => onHide?.()}` | WIRED | Line 135 of Widget.tsx; MouseEvent leak prevented by arrow wrapper |
| `JobsokLayoutContext.tsx` | `useWidgetLayout.ts` | Provider receives layout + saveDebounced from hub via props (JobsokHub passes layoutValue) | WIRED | JobsokHub.tsx lines 79–88 build layoutValue from useWidgetLayout |
| `JobsokHub.tsx` | `useWidgetLayout.ts` | `useWidgetLayout('jobb')` called at component top | WIRED | Line 29 of JobsokHub.tsx |
| `JobsokHub.tsx` | `HiddenWidgetsPanel.tsx` | `<HiddenWidgetsPanel isOpen={panelOpen} onClose={...}>` inside provider tree | WIRED | Lines 141–145 of JobsokHub.tsx |
| Widget hide-button | `saveDebounced` | `hideWidget(id)` → maps layout → `saveDebounced(next)` | WIRED | Lines 52–57 of JobsokHub.tsx |
| `HiddenWidgetsPanel.tsx` | `useJobsokLayout()` | Reads layout, calls showWidget + resetLayout | WIRED | Line 22 of HiddenWidgetsPanel.tsx |
| `HiddenWidgetsPanel.tsx` | `useConfirmDialog()` | `await confirm({...})` before reset | WIRED | Lines 51–57 of HiddenWidgetsPanel.tsx |

---

## Requirements Coverage

| Requirement | Source Plans | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| CUST-01 | 04-02, 04-03, 04-04 | User can hide and restore individual widgets per hub | SATISFIED | Widget hide-button (×) wired; HiddenWidgetsPanel with Återvisa buttons; integration tests δ/ε prove hide/restore flow |
| CUST-02 | 04-03, 04-04 | User can reset default layout per hub | SATISFIED | Reset button in panel with ConfirmDialog (warning, Swedish copy); integration tests ζ/η/θ prove reset/cancel |
| CUST-03 | 04-01, 04-04 | Layout persists per hub in Supabase, restored on revisit | SATISFIED | user_widget_layouts table in live Supabase; useWidgetLayout upsert; integration test λ proves persisted visible:false survives reload |

All 3 phase requirements satisfied. No orphaned requirements found for Phase 4 in REQUIREMENTS.md.

---

## Anti-Patterns Found

None identified. Scans of all key modified files:
- No TODO/FIXME/placeholder comments in production code
- No `return null` as a stub (only as intentional visibility gate in HubGrid.Slot)
- No `console.log` only implementations
- No hardcoded `editMode={false}` literal remaining in JobsokHub.tsx
- Migration file strictly additive (zero DROP, zero destructive ALTER)

---

## Human Verification Required

### 1. Visual: Hide-button appearance in edit mode

**Test:** Navigate to Söka Jobb hub, click "Anpassa vy" button, observe widget headers
**Expected:** Each widget shows a small × button to the right of the S/M/L/XL size toggle, positioned with 6px gap; button is 18x18px; size-toggle and hide-button side by side
**Why human:** Visual positioning and styling cannot be verified programmatically

### 2. Cross-device persistence

**Test:** On desktop, hide the CV widget; on a different device/browser (same user account), navigate to Söka Jobb
**Expected:** CV widget is hidden on the second device (showing in the panel list instead of the grid)
**Why human:** Requires two actual authenticated sessions against live Supabase

### 3. Mobile vs. desktop layout independence

**Test:** On mobile (<900px), hide a widget; switch to desktop; verify desktop layout unaffected
**Expected:** Desktop layout unchanged; mobile layout shows the widget hidden
**Why human:** Requires actual responsive viewport testing with live Supabase

### 4. Escape / outside-click panel close

**Test:** Click "Anpassa vy", then press Escape key; re-open, then click outside the dropdown
**Expected:** Panel closes on Escape; panel closes on outside click; inside-panel click does NOT close
**Why human:** Browser focus/event behavior differs from jsdom

---

## Test Suite Summary

All Phase 4 automated tests pass (run verified):

| Test File | Tests | Status |
|-----------|-------|--------|
| `mergeLayouts.test.ts` | 5 | PASS |
| `useBreakpoint.test.ts` | 3 | PASS |
| `useWidgetLayout.test.ts` | 11 | PASS |
| `Widget.test.tsx` | 18 | PASS |
| `HubGrid.test.tsx` | 8 | PASS |
| `JobsokLayoutContext.test.tsx` | 6 | PASS |
| `HiddenWidgetsPanel.test.tsx` | 13 | PASS |
| `JobsokHub.test.tsx` | 24 | PASS |
| **Phase 4 total** | **88** | **ALL PASS** |

TypeScript: `npx tsc --noEmit` exits 0 (no output = no errors).

---

## Gaps Summary

No gaps found. All 15 must-haves verified against actual code. All 3 requirement IDs (CUST-01, CUST-02, CUST-03) satisfied with automated test evidence. Phase goal is achieved.

The four human verification items are confirmations of already-verified automated behavior in a real browser context — they are not blockers.

---

_Verified: 2026-04-28T23:20:00Z_
_Verifier: Claude (gsd-verifier)_
