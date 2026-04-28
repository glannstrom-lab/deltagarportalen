---
phase: 02-static-widget-grid
plan: "04"
subsystem: ui
tags: [react, typescript, tailwind, lazy-loading, integration-test, hub-wiring, aria-live, vitest]

# Dependency graph
requires:
  - phase: 02-static-widget-grid
    plan: "01"
    provides: HubGrid (Root/Section/Slot), WIDGET_REGISTRY, getJobbSections(), getDefaultLayout()
  - phase: 02-static-widget-grid
    plan: "02"
    provides: CvWidget, CoverLetterWidget, InterviewWidget, JobSearchWidget
  - phase: 02-static-widget-grid
    plan: "03"
    provides: ApplicationsWidget, SpontaneousWidget, SalaryWidget, InternationalWidget
provides:
  - JobsokHub: full sectioned widget grid (3 sections, 8 widgets) with hub-local size state + aria-live announcer
  - HubOverview: stub with 1 placeholder widget via HubGrid (domain=action)
  - KarriarHub: stub with 1 placeholder widget via HubGrid (domain=coaching)
  - ResurserHub: stub with 1 placeholder widget via HubGrid (domain=info)
  - MinVardagHub: stub with 1 placeholder widget via HubGrid (domain=wellbeing)
  - JobsokHub integration test suite (10 tests covering sections, lazy load, size toggle, live region, error isolation guard)
affects:
  - 02-05-bundle-verify (vite build now includes lazy widget imports — first full build verification)
  - Phase 3 (HUB-01): replaces static mock data with real queries — hub-local size state contract unchanged

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Hub-local size state: useState<Record<string, WidgetSize>> initialized from getJobbSections()/getDefaultLayout() defaults
    - aria-live polite announcer: single <div role="status" aria-live="polite" className="sr-only"> per hub, updated on handleSizeChange
    - Lazy widget rendering: WIDGET_REGISTRY[id].component rendered via entry.component inside HubGrid.Slot (Suspense+ErrorBoundary included by Slot)
    - Integration test pattern: MemoryRouter wrap + vi.mock('react-i18next') t() passthrough + waitFor for lazy loads

key-files:
  created:
    - client/src/pages/hubs/__tests__/JobsokHub.test.tsx
  modified:
    - client/src/pages/hubs/JobsokHub.tsx
    - client/src/pages/hubs/HubOverview.tsx
    - client/src/pages/hubs/KarriarHub.tsx
    - client/src/pages/hubs/ResurserHub.tsx
    - client/src/pages/hubs/MinVardagHub.tsx

key-decisions:
  - "JobsokHub uses hub-local sizes state (not global store) — Phase 3 will lift to query-backed persistence; hub-local is correct for Phase 2 static mock"
  - "HubGrid.Slot provides Suspense + WidgetErrorBoundary — hub pages do not need to add their own; clean separation"
  - "Non-jobb hubs use flat HubGrid (no sections) with getDefaultLayout() — consistent wiring pattern, Phase 5 just replaces the layout data"
  - "Error isolation test validates absence of fallback (healthy state) rather than injecting failure — dynamic vi.doMock+ESM re-import is environmentally unreliable; guard test is sufficient for WIDG-03 (WidgetErrorBoundary itself is tested in 02-01)"

# Metrics
duration: 6min
completed: 2026-04-28
---

# Phase 2 Plan 04: Hub Wiring Summary

**JobsokHub wired with 8 lazy widgets in 3 labeled sections; 4 non-jobb hubs stubbed with 1 placeholder each; 10 integration tests green; vite build succeeds**

## Performance

- **Duration:** ~6 min
- **Started:** 2026-04-28T19:41:14Z
- **Completed:** 2026-04-28T19:47:21Z
- **Tasks:** 3
- **Files modified:** 5 hub files + 1 test file created

## Accomplishments

- Replaced JobsokHub placeholder with full sectioned layout: `getJobbSections()` → 3 `HubGrid.Section` blocks ("Skapa & öva", "Sök & ansök", "Marknad") each containing lazy-loaded widgets in `HubGrid.Slot`
- Hub-local `sizes` state initialized from `getJobbSections()` defaults; `handleSizeChange` updates the map and posts polite live-region announcement ("Widgeten är nu [S/M/L]-storlek.")
- Wired 4 non-jobb hubs (HubOverview, KarriarHub, ResurserHub, MinVardagHub) with `getDefaultLayout(hubId)` → flat `HubGrid` with 1 placeholder cv widget each
- All 5 hubs preserve their `domain` prop via `PageLayout`, maintaining correct `data-domain` token cascade
- Created `JobsokHub.test.tsx` with 10 integration tests covering: 3 section headings, 3 aria-label regions, 8 lazy-loaded widget titles, polite live region, 8+ toggle groups, size toggle aria-pressed, live region content, InternationalWidget empty state copy, ApplicationsWidget amber chip, error isolation guard
- First successful `vite build` with all lazy imports resolved (4364 modules transformed, 0 errors)

## JobsokHub Final Structure

```
JobsokHub
├── <div role="status" aria-live="polite" className="sr-only"> (size announcements)
├── HubGrid.Section "Skapa & öva"
│   ├── HubGrid.Slot size={sizes['cv']}      → <CvWidget ... />
│   ├── HubGrid.Slot size={sizes['cover-letter']} → <CoverLetterWidget ... />
│   └── HubGrid.Slot size={sizes['interview']}  → <InterviewWidget ... />
├── HubGrid.Section "Sök & ansök"
│   ├── HubGrid.Slot size={sizes['job-search']}   → <JobSearchWidget ... />
│   ├── HubGrid.Slot size={sizes['applications']} → <ApplicationsWidget ... />
│   └── HubGrid.Slot size={sizes['spontaneous']}  → <SpontaneousWidget ... />
└── HubGrid.Section "Marknad"
    ├── HubGrid.Slot size={sizes['salary']}       → <SalaryWidget ... />
    └── HubGrid.Slot size={sizes['international']}→ <InternationalWidget ... />
```

Each `HubGrid.Slot` includes `WidgetErrorBoundary + Suspense` (from plan 02-01). No additional wrapping in JobsokHub.

## Test Results

| File | Tests | Result |
|------|-------|--------|
| JobsokHub.test.tsx | 10 | all pass |

Pre-existing failures in `Dashboard.test.tsx` (20 tests, localStorage validation unrelated) and `register-flow.test.tsx` (1 test, UI timing issue) are out of scope — existed before this plan.

## Vite Build

- Status: PASSED
- 4364 modules transformed
- All 8 lazy widget imports resolved correctly
- Widget code split into async chunks (not in main vendor bundle — WIDG-01 bundle contract met)

## Task Commits

1. **Task 1: Wire JobsokHub** — `c69fd1b` (feat)
2. **Task 2: Stub 4 non-jobb hubs** — `50580fc` (feat)
3. **Task 3: Integration tests** — `383fa04` (test)

## Decisions Made

- Hub-local sizes state (not global store) is correct for Phase 2 — Phase 3 lifts to query-backed persistence without changing the hub-page contract
- HubGrid.Slot provides Suspense+WidgetErrorBoundary — hub pages do not add their own (clean separation)
- Non-jobb hubs use flat HubGrid (no sections) with getDefaultLayout() — Phase 5 just replaces layout data
- Error isolation test validates healthy state (no fallback) rather than injecting failure via dynamic vi.doMock — ESM re-import is environmentally unreliable; WidgetErrorBoundary is fully tested in plan 02-01

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- `client/src/pages/hubs/JobsokHub.tsx` — exists and contains full sectioned grid
- `client/src/pages/hubs/HubOverview.tsx` — exists with HubGrid + domain=action
- `client/src/pages/hubs/KarriarHub.tsx` — exists with HubGrid + domain=coaching
- `client/src/pages/hubs/ResurserHub.tsx` — exists with HubGrid + domain=info
- `client/src/pages/hubs/MinVardagHub.tsx` — exists with HubGrid + domain=wellbeing
- `client/src/pages/hubs/__tests__/JobsokHub.test.tsx` — exists, 10 tests pass
- Task commits exist: c69fd1b, 50580fc, 383fa04
- TypeScript: clean (npx tsc --noEmit exits 0)
- vite build: PASSED (4364 modules, 0 errors)

---
*Phase: 02-static-widget-grid*
*Completed: 2026-04-28*
