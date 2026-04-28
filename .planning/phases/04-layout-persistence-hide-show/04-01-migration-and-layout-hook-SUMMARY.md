---
phase: 04-layout-persistence-hide-show
plan: 01
subsystem: database, ui, hooks
tags: [supabase, react-query, typescript, vitest, rls, jsonb, optimistic-update, debounce]

# Dependency graph
requires:
  - phase: 03-data-wiring-wcag
    provides: useJobsokHubSummary pattern, QueryClient setup, JobsokDataContext peer-context pattern
  - phase: 02-static-widget-grid
    provides: WidgetLayoutItem type, getDefaultLayout, WIDGET_REGISTRY, defaultLayouts.ts
provides:
  - user_widget_layouts Supabase table with UNIQUE(user_id,hub_id,breakpoint) + 4 RLS policies + updated_at trigger
  - useWidgetLayout(hubId) hook: React Query read + optimistic upsert + 1000ms debounce + rollback
  - mergeLayouts(persisted, default) pure reconciliation (Pitfall 7)
  - useBreakpoint() stable 'desktop'|'mobile' at 900px (Pitfall 6)
  - WidgetLayoutItem extended with `visible: boolean`
  - getDefaultLayout(hubId, breakpoint?) extended signature
affects:
  - 04-02 (hide-button UI binds to useWidgetLayout.saveDebounced)
  - 04-03 (återvisa-panel uses layout.filter(w => !w.visible))
  - 04-04 (JobsokHub wiring uses useWidgetLayout + USER_WIDGET_LAYOUTS_KEY)
  - 05-layout-persistence-other-hubs (replicates this pattern)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - React Query staleTime:Infinity for user-preference data that only changes on explicit action
    - onMutate/onError/onSettled optimistic update + rollback pattern for Supabase upserts
    - Debounce via useRef (pendingPayloadRef + debounceRef) with beforeunload flush
    - Per-breakpoint query key for mobile/desktop isolation
    - Idempotent SQL migration via CREATE TABLE IF NOT EXISTS + DO $$ BEGIN...EXCEPTION WHEN duplicate_object blocks
    - vi.resetModules() + dynamic import for matchMedia hook isolation in vitest

key-files:
  created:
    - supabase/migrations/20260429_user_widget_layouts.sql
    - client/src/components/widgets/mergeLayouts.ts
    - client/src/components/widgets/mergeLayouts.test.ts
    - client/src/hooks/useBreakpoint.ts
    - client/src/hooks/useBreakpoint.test.ts
    - client/src/hooks/useWidgetLayout.ts
    - client/src/hooks/useWidgetLayout.test.ts
  modified:
    - client/src/components/widgets/types.ts (added visible: boolean to WidgetLayoutItem)
    - client/src/components/widgets/defaultLayouts.ts (added breakpoint param + visible: true to all items)

key-decisions:
  - "useWidgetLayout uses staleTime: Infinity — layout only changes on explicit user action, not on window focus or interval"
  - "saveDebounced does immediate optimistic cache write + 1000ms debounce for DB write (dual-write pattern for instant UI feedback)"
  - "useBreakpoint tests require vi.resetModules() + separate test file to re-read window.matchMedia in useState initializer"
  - "Pitfall 5 rollback test uses mutation.save() (not saveDebounced) to bypass debounce and test onError path directly"
  - "Migration trigger uses conditional pg_trigger existence check instead of DROP TRIGGER IF EXISTS (inviolable no-DROP rule)"

patterns-established:
  - "Pattern: Per-breakpoint query key ['user-widget-layouts', userId, hubId, breakpoint] prevents mobile/desktop cache collision"
  - "Pattern: mergeLayouts always called in queryFn — raw Supabase data never returned directly to React Query cache"
  - "Pattern: useBreakpoint hook isolated in its own test file with vi.resetModules() to avoid matchMedia module caching"

requirements-completed: [CUST-03]

# Metrics
duration: 15min
completed: 2026-04-28
---

# Phase 4 Plan 01: Migration + Layout Hook Summary

**Supabase `user_widget_layouts` table (UNIQUE per-breakpoint key, 4 RLS policies, trigger) + `useWidgetLayout` React Query hook with optimistic upsert/rollback/debounce + `mergeLayouts` reconciliation (Pitfall 7) + `useBreakpoint` (Pitfall 6) — 19 tests passing**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-04-28T22:28:20Z
- **Completed:** 2026-04-28T22:43:00Z
- **Tasks:** 3 (2 TDD, 1 DB verification)
- **Files modified:** 9

## Accomplishments

- `user_widget_layouts` table created in live Supabase with correct schema: 7 columns, UNIQUE(user_id,hub_id,breakpoint), CHECK(breakpoint IN ('desktop','mobile')), 4 RLS policies, trg_uwl_updated_at trigger, RLS enabled — all verified via introspection queries
- Migration is strictly additive (zero DROP statements confirmed by grep), idempotency confirmed via second run
- `useWidgetLayout(hubId)` hook provides the complete persistence API: staleTime:Infinity query, 1000ms debounced upsert with optimistic update, onMutate snapshot + onError rollback + onSettled invalidate, beforeunload flush
- `mergeLayouts` pure function handles all 4 reconciliation scenarios (append missing, drop removed, preserve user state, empty inputs)
- `useBreakpoint` returns stable 'desktop'|'mobile' keyed off matchMedia(900px), matching HubGrid CSS breakpoint
- 19 tests: mergeLayouts (5) + useBreakpoint (3) + useWidgetLayout (11), all passing

## Task Commits

1. **Task 1: Migration + types + mergeLayouts pure utility (with tests)** - `136de8b` (feat)
2. **Task 2: useBreakpoint + useWidgetLayout hook + tests** - `c40b5d9` (feat)
3. **Task 3: Apply migration to remote DB** - (no commit needed — migration file committed in Task 1, DB-only operation)

## Migration Verification Results

| Check | Result |
|-------|--------|
| Migration applied (exit 0) | PASS |
| 7 columns (id, user_id, hub_id, breakpoint, widgets, created_at, updated_at) | PASS |
| UNIQUE (user_id, hub_id, breakpoint) constraint | PASS |
| CHECK (breakpoint IN ('desktop','mobile')) | PASS |
| 4 RLS policies (SELECT/INSERT/UPDATE/DELETE) | PASS |
| Trigger trg_uwl_updated_at | PASS |
| relrowsecurity = true | PASS |
| Idempotency (second run exits 0) | PASS |

## Files Created/Modified

- `supabase/migrations/20260429_user_widget_layouts.sql` — Idempotent CREATE TABLE + 4 RLS policies + trigger (strictly additive)
- `client/src/components/widgets/types.ts` — Added `visible: boolean` to WidgetLayoutItem
- `client/src/components/widgets/defaultLayouts.ts` — Added `breakpoint?` param + `visible: true` to all layout items
- `client/src/components/widgets/mergeLayouts.ts` — Pure reconciliation function (Pitfall 7)
- `client/src/components/widgets/mergeLayouts.test.ts` — 5 tests for all reconciliation cases
- `client/src/hooks/useBreakpoint.ts` — Stable 'desktop'|'mobile' via matchMedia(900px)
- `client/src/hooks/useBreakpoint.test.ts` — 3 tests (desktop, mobile, change event)
- `client/src/hooks/useWidgetLayout.ts` — React Query hook with full CUST-03 persistence API
- `client/src/hooks/useWidgetLayout.test.ts` — 11 tests covering debounce, payload shape, rollback, Pitfalls 5/6/15

## Decisions Made

- `saveDebounced` does an immediate optimistic cache write (for instant UI feedback) AND a 1000ms debounced DB write — this dual-write pattern means the UI never waits for the network
- The Pitfall 5 rollback test uses `result.current.save()` (direct mutation, no debounce) instead of `saveDebounced()` to test the onError path without timer complexity
- `useBreakpoint.test.ts` is a separate file from `useWidgetLayout.test.ts` because `vi.resetModules()` is needed between tests to re-read `window.matchMedia` in the `useState` initializer; mixing this with the main test file's module cache caused false positives
- Migration trigger uses a conditional `IF NOT EXISTS` check in a DO block instead of `DROP TRIGGER IF EXISTS` (which would violate the inviolable no-DROP rule)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] useBreakpoint test module isolation**
- **Found during:** Task 2 (useWidgetLayout + useBreakpoint tests)
- **Issue:** The plan specified all useBreakpoint tests in `useWidgetLayout.test.ts`, but vitest module caching meant the `useState` initializer always read the first test's `window.matchMedia` value ('desktop') for subsequent tests
- **Fix:** Moved useBreakpoint tests to `useBreakpoint.test.ts` (separate file) with `vi.resetModules()` in `afterEach` — gives each test a fresh module import that re-executes the `useState` initializer with the current mock
- **Files modified:** `client/src/hooks/useBreakpoint.test.ts` (new), `client/src/hooks/useWidgetLayout.test.ts` (removed 3 useBreakpoint test cases)
- **Verification:** 3 useBreakpoint tests now pass reliably including the change-event test
- **Committed in:** c40b5d9 (Task 2 commit)

**2. [Rule 1 - Bug] Pitfall 5 rollback test used vi.useFakeTimers() incompatibly with waitFor**
- **Found during:** Task 2 (useWidgetLayout test for onError rollback)
- **Issue:** The plan's test spec mixed vi.useFakeTimers() with waitFor() — Testing Library's waitFor uses real setTimeout internally, so fake timers caused it to time out. Mid-test switch from vi.useRealTimers() also caused issues.
- **Fix:** Rewrote Pitfall 5 test to use real timers throughout, calling `result.current.save()` directly (no debounce) and using `waitFor` at each stage (optimistic applied → upsert called → cache restored)
- **Files modified:** `client/src/hooks/useWidgetLayout.test.ts`
- **Verification:** Test now passes consistently in ~85ms
- **Committed in:** c40b5d9 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (both Rule 1 — test implementation bugs)
**Impact on plan:** Both auto-fixes were necessary to make tests actually work in vitest. No scope creep; all 14 specified test behaviors are covered, just with a slightly different file structure and timer approach.

## Issues Encountered

- `vi.useFakeTimers()` + `waitFor()` (Testing Library) are incompatible — waitFor uses real setTimeout internally. Resolution: use `act(async () => { vi.runAllTimersAsync() })` or switch to real timers for the verification phase of each test. Documented in test comments.
- `makeReadBuilder` didn't expose `.upsert` — the mutation path goes through `from('user_widget_layouts').upsert(...)` directly, not chained after `.select()`. The Pitfall 5 test needed `(b as Record<string, unknown>).upsert = upsertMock` on the builder.

## Export Summary

| Export | From | Used By |
|--------|------|---------|
| `useWidgetLayout(hubId)` | hooks/useWidgetLayout.ts | 04-02, 04-03, 04-04 |
| `USER_WIDGET_LAYOUTS_KEY(userId, hubId, bp)` | hooks/useWidgetLayout.ts | 04-04 (cache invalidation) |
| `useBreakpoint()` | hooks/useBreakpoint.ts | useWidgetLayout (internal), 04-04 |
| `mergeLayouts(persisted, default)` | components/widgets/mergeLayouts.ts | useWidgetLayout queryFn |
| `getDefaultLayout(hubId, breakpoint?)` | components/widgets/defaultLayouts.ts | useWidgetLayout queryFn, 04-04 |

## Next Phase Readiness

- Plan 02 (hide-button UI) can bind to `useWidgetLayout.saveDebounced(newLayout)` with the `save` function signature unchanged
- Plan 03 (återvisa-panel) can filter `layout.filter(w => !w.visible)` — the `visible` field is guaranteed on every WidgetLayoutItem
- Plan 04 (JobsokHub wiring) wraps with `<JobsokLayoutProvider>` and replaces hub-local `sizes` state with `layout` from this hook
- No blockers for Plan 02

---
*Phase: 04-layout-persistence-hide-show*
*Completed: 2026-04-28*
