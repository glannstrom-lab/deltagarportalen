---
phase: 03-data-wiring-wcag
plan: 02
subsystem: hub-data-loader
tags: [react-query, supabase, context, tdd, wave-0-stubs, hub-loader, promise-all]

# Dependency graph
requires:
  - phase: 03-data-wiring-wcag
    plan: 01
    provides: "EXPLAIN ANALYZE PASS verdict (4.211ms), completed_at schema discovery, salary_data/international_targets absent"
provides:
  - "useJobsokHubSummary hook: single Promise.all of 5 parallel selects (HUB-01)"
  - "JobsokDataContext: JobsokDataProvider + useJobsokWidgetData + useJobsokSummary"
  - "Cache-sync: ['application-stats'], ['cv-versions'], ['cover-letters'] populated after loader resolves"
  - "JobsokHub.tsx: loader mounted once, context wraps all widget slots"
  - "Wave 0: 9 test stub files (loader + 8 widgets) ready for Plan 03 TDD wiring"
affects:
  - 03-03-widget-data-wiring (widgets can now read from useJobsokWidgetData(slice))
  - 03-04-wcag-hardening (context already in tree; no structural change needed)
  - 05-full-hub-coverage (SalaryWidget/InternationalWidget empty-state deferred here)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Hub-level single entry-point: useJobsokHubSummary fires Promise.all, widgets are pure context-readers"
    - "Deep-link cache-sync: setQueryData writes to ['application-stats'], ['cv-versions'], ['cover-letters'] after loader resolves"
    - "JobsokDataContext pattern: JobsokDataProvider wraps PageLayout children; useJobsokWidgetData<K>(slice) returns typed slice"
    - "Wave 0 TDD stubs: test files created before production code for scaffolded TDD in Plan 03"
    - "Test fix pattern: mock hook + add QueryClientProvider when wiring hooks that need React Query"

key-files:
  created:
    - client/src/hooks/useJobsokHubSummary.ts
    - client/src/hooks/useJobsokHubSummary.test.ts
    - client/src/components/widgets/JobsokDataContext.tsx
    - client/src/components/widgets/CvWidget.test.tsx
    - client/src/components/widgets/CoverLetterWidget.test.tsx
    - client/src/components/widgets/InterviewWidget.test.tsx
    - client/src/components/widgets/JobSearchWidget.test.tsx
    - client/src/components/widgets/ApplicationsWidget.test.tsx
    - client/src/components/widgets/SpontaneousWidget.test.tsx
    - client/src/components/widgets/SalaryWidget.test.tsx
    - client/src/components/widgets/InternationalWidget.test.tsx
  modified:
    - client/src/pages/hubs/JobsokHub.tsx
    - client/src/pages/hubs/__tests__/JobsokHub.test.tsx

key-decisions:
  - "interview_sessions filter: used .not('completed_at', 'is', null) NOT .eq('completed', true) — schema discovery from Plan 01 applied"
  - "salary_data / international_targets excluded from Promise.all — tables absent from live DB (Plan 01 verified). Widgets stay in current empty-state mode."
  - "useJobsokHubSummary mocked in JobsokHub.test.tsx (not unmocked) — hub tests verify UI/layout, not data loading; loader tested independently in its own test file"
  - "JobsokDataProvider wraps all PageLayout children — aria-live region stays inside provider (Pitfall D: React does not unmount children when provider value changes)"

# Metrics
duration: 5min
completed: 2026-04-28
---

# Phase 3 Plan 02: Hub Summary Loader Summary

**Single hub-level Promise.all loader with cache-sync to 3 deep-link keys, JobsokDataContext distribution, 9 Wave 0 TDD stub files, and JobsokHub.tsx wired — 3/3 loader tests passing, all 10 hub integration tests passing**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-04-28T21:08:29Z
- **Completed:** 2026-04-28T21:13:23Z
- **Tasks:** 3
- **Files created:** 11
- **Files modified:** 2

## Accomplishments

### Task 1: Wave 0 Test Stubs (commit `82d5059`)
9 stub test files created:
- `client/src/hooks/useJobsokHubSummary.test.ts` — 3 skipped (Promise.all + 2 cache-sync)
- `client/src/components/widgets/CvWidget.test.tsx` — 2 skipped
- `client/src/components/widgets/CoverLetterWidget.test.tsx` — 2 skipped
- `client/src/components/widgets/InterviewWidget.test.tsx` — 3 skipped (incl. DATA-01 sparkline)
- `client/src/components/widgets/JobSearchWidget.test.tsx` — 1 skipped
- `client/src/components/widgets/ApplicationsWidget.test.tsx` — 3 skipped (incl. A11Y-04 hide-closed)
- `client/src/components/widgets/SpontaneousWidget.test.tsx` — 1 skipped
- `client/src/components/widgets/SalaryWidget.test.tsx` — 2 skipped
- `client/src/components/widgets/InternationalWidget.test.tsx` — 1 skipped

All compile; suite stays green. Skipped tests do not fail.

### Task 2: Loader Hook + Context + Tests (commit `addaa44`)
- `useJobsokHubSummary.ts`: Promise.all of 5 selects, staleTime 60s, setQueryData for 3 deep-link keys
- `JobsokDataContext.tsx`: JobsokDataProvider, useJobsokWidgetData<K>, useJobsokSummary
- Loader test: **3/3 passing** (Promise.all calls verified, cache-sync for all 3 keys verified)
- TypeScript: zero errors

### Task 3: JobsokHub Wiring (commit `5f0815b`)
- `JobsokHub.tsx`: imports added, `const { data: summary } = useJobsokHubSummary()` mounted once
- `<JobsokDataProvider value={summary}>` wraps all PageLayout children
- aria-live region preserved inside provider (Pitfall D compliant)
- `JobsokHub.test.tsx` fixed: QueryClientProvider wrapper + mocked loader + mocked useAuth
- **10/10 existing hub tests still pass**
- TypeScript: zero errors
- Pitfall A guard: confirmed clean — no widget file imports `@/lib/supabase`

## Loader Test Result

```
✓ src/hooks/useJobsokHubSummary.test.ts (3 tests)
  ✓ fires Promise.all of 5 supabase selects on mount (HUB-01 loader)
  ✓ populates [application-stats] cache key after loader resolves (HUB-01 cache-sync)
  ✓ populates [cv-versions] and [cover-letters] cache keys after loader resolves
```

**3/3 passing** — Promise.all + all 3 cache-sync assertions verified.

## Pitfall A Guard: Active

```
grep -l "from '@/lib/supabase'" client/src/components/widgets/*.tsx
→ CLEAN — no widget files import supabase directly
```

No widget file imports Supabase. The hub-page is the single entry point for Phase 3 data loading.

## JobsokHub Test Result

```
✓ src/pages/hubs/__tests__/JobsokHub.test.tsx (10 tests) 727ms
```

**10/10 passing** — existing integration tests unaffected after wiring.

## JobsokSummary Type Shape (for Plan 03)

```typescript
interface JobsokSummary {
  cv: { id: string; updated_at: string; completion_pct?: number } | null
  coverLetters: Array<{ id: string; title?: string; created_at: string }>
  interviewSessions: Array<{ id: string; score: number | null; created_at: string }>
  applicationStats: {
    total: number
    byStatus: Record<string, number>
    segments: Array<{ label: string; count: number; deEmphasized?: boolean }>
  }
  spontaneousCount: number
  salary?: { median: number; low: number; high: number; roleLabel: string } | null
  international?: { countries: string[] } | null
}
```

**Widget access pattern for Plan 03:**
```typescript
// Single slice
const cv = useJobsokWidgetData('cv')          // JobsokSummary['cv'] | undefined
const letters = useJobsokWidgetData('coverLetters')
const sessions = useJobsokWidgetData('interviewSessions')
const stats = useJobsokWidgetData('applicationStats')
const count = useJobsokWidgetData('spontaneousCount')

// Multiple slices (e.g. JobSearchWidget)
const summary = useJobsokSummary()            // JobsokSummary | undefined
```

`undefined` = loader pending (show skeleton). Typed slice = loader resolved (show data).

## Wave 0 Deliverables from 03-VALIDATION.md

9 of 14 Wave 0 items satisfied:
- Loader test file with 3 named behaviors
- 8 widget test files with named behaviors (incl. A11Y-04 hide-closed in ApplicationsWidget)
- Remaining 5 (services, anti-shaming, reduced-motion, empathy-review) → Plans 03-05

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Applied schema correction from Plan 01 to interview_sessions filter**
- **Found during:** Task 2 (implementing queryFn)
- **Issue:** Plan action block specified `.eq('completed', true)` but live DB has `completed_at TIMESTAMPTZ` (not a boolean column). Documented in 03-01-SUMMARY.md as a key decision.
- **Fix:** Used `.not('completed_at', 'is', null)` to filter completed sessions. Added code comment explaining the deviation.
- **Files modified:** `client/src/hooks/useJobsokHubSummary.ts`
- **Commit:** `addaa44`

**2. [Rule 3 - Blocking] Added QueryClientProvider + mocks to JobsokHub.test.tsx**
- **Found during:** Task 3 (running JobsokHub.test.tsx after wiring)
- **Issue:** useJobsokHubSummary calls useQueryClient() which requires QueryClientProvider. Test rendered without it, causing "No QueryClient set" error.
- **Fix:** Added QueryClientProvider wrapper to renderHub(), mocked useJobsokHubSummary to return no-op, mocked useSupabase.useAuth. Tests now verify UI/layout only (correct separation of concerns — loader tested separately).
- **Files modified:** `client/src/pages/hubs/__tests__/JobsokHub.test.tsx`
- **Commit:** `5f0815b`

## Issues Encountered

None beyond the deviations documented above. All were auto-fixed per Rules 1 and 3.

## Next Phase Readiness

- **Plan 03 (widget data wiring) is unblocked:**
  - Each widget can read from `useJobsokWidgetData(slice)` — no Supabase imports needed
  - Wave 0 stub files are ready for TDD wiring (Plan 03 replaces MOCK constants test-first)
  - `JobsokSummary` type shape is defined and stable
- **Pitfall A guard is enforced:** architectural property — widgets are pure context-readers

## Self-Check: PASSED

- FOUND: client/src/hooks/useJobsokHubSummary.ts
- FOUND: client/src/hooks/useJobsokHubSummary.test.ts (3 passing tests)
- FOUND: client/src/components/widgets/JobsokDataContext.tsx
- FOUND: client/src/pages/hubs/JobsokHub.tsx (contains useJobsokHubSummary() + JobsokDataProvider)
- FOUND: all 9 stub files (grepped it.skip — present in each)
- Commits verified: 82d5059 (stubs), addaa44 (hook+context+tests), 5f0815b (hub wiring)
- Pitfall A guard: CLEAN (no widget imports supabase)
- TypeScript: zero errors
- JobsokHub tests: 10/10 passing

---
*Phase: 03-data-wiring-wcag*
*Completed: 2026-04-28*
