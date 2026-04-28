---
phase: 03-data-wiring-wcag
plan: 03
subsystem: widget-data-wiring
tags: [react-context, tdd, hub-01, data-01, data-02, a11y-04, wcag, anti-shaming]

# Dependency graph
requires:
  - phase: 03-data-wiring-wcag
    plan: 02
    provides: "JobsokDataContext + useJobsokWidgetData + Wave 0 TDD stub files"
provides:
  - "8 widgets wired to JobsokDataContext — no MOCK constants remain as source of truth"
  - "ApplicationsWidget showClosed toggle (A11Y-04) — closed segment hidden by default"
  - "saveInterviewSessionWithScore — DATA-01 score persistence path"
  - "personalBrandAuditsApi — DATA-02 append-only audit history"
  - "BrandAuditTab: history append after each audit save"
affects:
  - 03-04-wcag-hardening (widgets are now data-wired; WCAG hardening operates on real renders)
  - 05-full-hub-coverage (SalaryWidget/InternationalWidget empty-state from context slice)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Loading/empty/filled tri-branch per widget: cv===undefined→header-only, null/[]→empty-state, data→filled"
    - "A11Y-04 showClosed toggle: useState(false) hides deEmphasized segments; button reveals"
    - "Segment color mapping: context segments (no color) mapped to StackedBarSegment (with color) in widget"
    - "DATA-01 score path: create session → capture id → update with score+breakdown (null skips update)"
    - "DATA-02 append-only: separate service file targets PLURAL table; inner try/catch isolates from existing upsert"
    - "Hub test stub summary: STUB_SUMMARY provides real data so widget-state assertions pass in hub tests"

key-files:
  created:
    - client/src/services/interviewService.test.ts
    - client/src/services/personalBrandAuditsApi.ts
    - client/src/services/personalBrandAuditsApi.test.ts
  modified:
    - client/src/components/widgets/CvWidget.tsx
    - client/src/components/widgets/CoverLetterWidget.tsx
    - client/src/components/widgets/InterviewWidget.tsx
    - client/src/components/widgets/JobSearchWidget.tsx
    - client/src/components/widgets/ApplicationsWidget.tsx
    - client/src/components/widgets/SpontaneousWidget.tsx
    - client/src/components/widgets/SalaryWidget.tsx
    - client/src/components/widgets/InternationalWidget.tsx
    - client/src/components/widgets/CvWidget.test.tsx
    - client/src/components/widgets/CoverLetterWidget.test.tsx
    - client/src/components/widgets/InterviewWidget.test.tsx
    - client/src/components/widgets/JobSearchWidget.test.tsx
    - client/src/components/widgets/ApplicationsWidget.test.tsx
    - client/src/components/widgets/SpontaneousWidget.test.tsx
    - client/src/services/interviewService.ts
    - client/src/pages/personal-brand/BrandAuditTab.tsx
    - client/src/pages/hubs/__tests__/JobsokHub.test.tsx

key-decisions:
  - "Segment color mapping done in ApplicationsWidget (not in context/loader) — keeps JobsokSummary type display-agnostic"
  - "SalaryWidget renders empty state unconditionally in Phase 3 — salary slice always undefined/null (table absent, Plan 01 verified)"
  - "InternationalWidget: keeps existing empty-state JSX, adds context read for future Phase 5 filled branch"
  - "JobsokHub.test.tsx updated with STUB_SUMMARY: previously tested mock amber chip; now tests real data amber chip (pending_response key)"
  - "saveInterviewSessionWithScore uses cast to satisfy cloudStorage InterviewSession type (different from interviewService InterviewSession)"

# Metrics
duration: 9min
completed: 2026-04-28
---

# Phase 3 Plan 03: Widget Data Wiring Summary

**8 widgets wired to JobsokDataContext (HUB-01), A11Y-04 closed-toggle implemented, DATA-01 score persistence added, DATA-02 audit history appended — 510 tests passing, TypeScript clean**

## Performance

- **Duration:** ~9 min
- **Started:** 2026-04-28T21:17:00Z
- **Completed:** 2026-04-28T21:29:00Z
- **Tasks:** 3
- **Files created:** 3
- **Files modified:** 17

## Accomplishments

### Task 1: Wire 8 Widgets to JobsokDataContext (commit `be84ab1`)

Per-widget wiring (slice each widget reads from):

| Widget | Slice | Empty-state heading |
|--------|-------|---------------------|
| CvWidget | `useJobsokWidgetData('cv')` | "Ditt CV väntar" |
| CoverLetterWidget | `useJobsokWidgetData('coverLetters')` | "Inga brev ännu" |
| InterviewWidget | `useJobsokWidgetData('interviewSessions')` | "Redo att öva?" |
| JobSearchWidget | `useJobsokSummary()` | "Inga sparade sökningar" |
| ApplicationsWidget | `useJobsokWidgetData('applicationStats')` | "Inga ansökningar ännu" |
| SpontaneousWidget | `useJobsokWidgetData('spontaneousCount')` | "Inget i pipeline" |
| SalaryWidget | `useJobsokWidgetData('salary')` | "Vad är din lön värd?" |
| InternationalWidget | `useJobsokWidgetData('international')` | "Arbetar du mot utlandsjobb?" |

All 8 widgets follow the loading/empty/filled tri-branch pattern. No MOCK constants remain as source of truth.

**A11Y-04 evidence (ApplicationsWidget):**
- `useState(false)` for `showClosed`
- `visibleSegments` filtered to exclude `deEmphasized` segments by default
- Button rendered: `"Visa avslutade ({closedCount})"` when hidden and count > 0
- Test: `ApplicationsWidget.test.tsx` — `'hides closed segment by default (A11Y-04)'` + `'reveals closed segment when toggle is clicked (A11Y-04)'`

**Widget test results:**
- 6 widget test files with real tests (no `it.skip`): CvWidget, CoverLetterWidget, InterviewWidget, JobSearchWidget, ApplicationsWidget, SpontaneousWidget
- 42 widget tests passing

### Task 2: Interview Score Persistence (commit `e9844e1`)

- `client/src/services/interviewService.ts`: `saveInterviewSessionWithScore(session, score, breakdown)` added
- Flow: `interviewSessionsApi.create(...)` → capture `id` → `interviewSessionsApi.update(id, { score, score_breakdown })`
- `score === null` skips update call (backward-compat preserved)
- Existing `saveInterviewSession(session)` unchanged, unmodified
- `client/src/services/interviewService.test.ts`: 2/2 tests passing

### Task 3: Personal Brand Audit History (commit `522751a`)

- `client/src/services/personalBrandAuditsApi.ts` created — exports `personalBrandAuditsApi.create` and `.getLatest`
- Targets PLURAL table `personal_brand_audits` — NEVER singular (Pitfall C avoided)
- `client/src/pages/personal-brand/BrandAuditTab.tsx`: 1 additional `personalBrandAuditsApi.create(...)` call after existing `personalBrandApi.saveAuditAnswers` call, wrapped in inner try/catch (non-blocking)
- Existing `saveAuditAnswers` upsert flow unchanged
- `client/src/services/personalBrandAuditsApi.test.ts`: 2/2 tests passing

## Pitfall Guards

### Pitfall A Guard: CONFIRMED CLEAN

```
grep -l "from '@/lib/supabase'" client/src/components/widgets/*Widget.tsx
→ CLEAN — no widget files import supabase directly
```

### Pitfall C Guard: CONFIRMED

```
from('personal_brand_audits')  ← PLURAL only
```
File does NOT contain `from('personal_brand_audit')` (singular).

## Widget Test Summary

```
✓ src/components/widgets/CvWidget.test.tsx (2 tests)
✓ src/components/widgets/CoverLetterWidget.test.tsx (2 tests)
✓ src/components/widgets/InterviewWidget.test.tsx (3 tests)
✓ src/components/widgets/JobSearchWidget.test.tsx (2 tests)
✓ src/components/widgets/ApplicationsWidget.test.tsx (4 tests)
✓ src/components/widgets/SpontaneousWidget.test.tsx (2 tests)
↓ src/components/widgets/SalaryWidget.test.tsx (2 skipped — Wave 0 stubs, Phase 5)
↓ src/components/widgets/InternationalWidget.test.tsx (1 skipped — Wave 0 stub, Phase 5)
```

## Full Test Suite

```
Test Files: 2 failed (pre-existing) | 43 passed | 2 skipped
Tests: 21 failed (pre-existing) | 510 passed | 3 skipped
```

Pre-existing failures (out of scope — deferred):
- `src/pages/Dashboard.test.tsx` — 20 failures: missing `useDashboardDataQuery` export in mock
- `src/test/integration/register-flow.test.tsx` — 1 failure: password strength integration test

Both were failing before Plan 03 execution (confirmed by git stash verification).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Added segment color mapping in ApplicationsWidget**
- **Found during:** Task 1
- **Issue:** `JobsokSummary.applicationStats.segments` type has no `color` field, but `StackedBarSegment` requires it. Direct pass-through would cause TypeScript error.
- **Fix:** Added `SEGMENT_COLORS` map inside `ApplicationsWidget` to assign colors by segment label before passing to `StackedBar`.
- **Files modified:** `client/src/components/widgets/ApplicationsWidget.tsx`
- **Commit:** `be84ab1`

**2. [Rule 1 - Bug] Updated JobsokHub.test.tsx stub to provide STUB_SUMMARY**
- **Found during:** Task 1 (running full test suite)
- **Issue:** Hub test expected `'1 ansökan väntar på ditt svar'` (from old MOCK data). After wiring, widgets read from context — with `data: undefined`, no amber chip renders.
- **Fix:** Changed `useJobsokHubSummary` mock from `{ data: undefined }` to `{ data: STUB_SUMMARY }` where STUB_SUMMARY includes `pending_response: 1` in `byStatus`. Amber chip now renders from real data path.
- **Files modified:** `client/src/pages/hubs/__tests__/JobsokHub.test.tsx`
- **Commit:** `be84ab1`

## Deferred Items

- `src/pages/Dashboard.test.tsx`: Missing `useDashboardDataQuery` export — pre-existing issue, out of scope
- `src/test/integration/register-flow.test.tsx`: Password strength indicator test — pre-existing issue, out of scope

## Self-Check: PASSED

- FOUND: client/src/services/personalBrandAuditsApi.ts
- FOUND: client/src/services/personalBrandAuditsApi.test.ts (2 passing tests)
- FOUND: client/src/services/interviewService.test.ts (2 passing tests)
- Commits verified: be84ab1 (widgets), e9844e1 (interview score), 522751a (brand audits)
- 8 widgets contain JobsokDataContext import: CONFIRMED (8/8)
- Pitfall A guard: CLEAN (no supabase imports in widget files)
- Pitfall C guard: CLEAN (only PLURAL table name in personalBrandAuditsApi.ts)
- A11Y-04: showClosed toggle implemented and tested
- TypeScript: zero errors
- Full suite: 510 passing, 21 pre-existing failures

---
*Phase: 03-data-wiring-wcag*
*Completed: 2026-04-28*
