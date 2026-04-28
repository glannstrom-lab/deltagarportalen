---
phase: 03-data-wiring-wcag
plan: 02
type: execute
wave: 2
depends_on: [03-01-db-perf-migrations-traceability-PLAN]
files_modified:
  - client/src/hooks/useJobsokHubSummary.ts
  - client/src/hooks/useJobsokHubSummary.test.ts
  - client/src/components/widgets/JobsokDataContext.tsx
  - client/src/pages/hubs/JobsokHub.tsx
  - client/src/components/widgets/__tests__/widget-stubs.ts
autonomous: true
requirements: [HUB-01]
must_haves:
  truths:
    - "Calling useJobsokHubSummary() in a component fires exactly one Promise.all of 5 parallel Supabase selects (cvs, cover_letters, interview_sessions, job_applications, spontaneous_companies) — no per-widget Supabase calls"
    - "After the loader resolves, queryClient.getQueryData(['application-stats']) returns the computed stats object (deep-link cache populated)"
    - "After the loader resolves, queryClient.getQueryData(['cv-versions']) returns the cv array and queryClient.getQueryData(['cover-letters']) returns the letters array"
    - "JobsokHub.tsx mounts the loader once and passes its data to all 8 widget slots via JobsokDataContext (not via prop drilling)"
    - "Widgets read data via useJobsokWidgetData(id) — context returns the slice for that widget, or undefined if loader not yet resolved (skeleton state)"
    - "9 widget test stub files exist (one per widget + the loader itself) so Plan 03 can replace MOCK constants test-first"
  artifacts:
    - path: "client/src/hooks/useJobsokHubSummary.ts"
      provides: "Hub-summary loader with cache-sync to deep-link keys"
      contains: "export function useJobsokHubSummary"
    - path: "client/src/hooks/useJobsokHubSummary.test.ts"
      provides: "Loader unit tests — Promise.all + cache-sync behavior"
      contains: "queryClient.getQueryData"
    - path: "client/src/components/widgets/JobsokDataContext.tsx"
      provides: "Context provider + useJobsokWidgetData(id) hook"
      contains: "createContext"
  key_links:
    - from: "client/src/hooks/useJobsokHubSummary.ts"
      to: "queryClient.setQueryData"
      via: "deep-link cache sync"
      pattern: "queryClient\\.setQueryData\\(\\['application-stats'\\]"
    - from: "client/src/pages/hubs/JobsokHub.tsx"
      to: "useJobsokHubSummary"
      via: "single mount-time call"
      pattern: "useJobsokHubSummary\\(\\)"
    - from: "client/src/components/widgets/JobsokDataContext.tsx"
      to: "WidgetContext (Phase 2 size context)"
      via: "parallel-but-separate context (does not replace size context)"
      pattern: "JobsokDataContext"
---

<objective>
Build the single source of truth for JobsokHub data: a `useJobsokHubSummary()` hook that fires one `Promise.all` of 5 parallel Supabase selects, populates the React Query cache under both the hub key AND the existing deep-link keys (so navigating from the hub to `/applications` is an instant cache-hit), and distributes the data to each of the 8 widgets via a new `JobsokDataContext`. Also create the Wave 0 test stubs for all widgets that Plan 03 will wire — TDD-style, the test files exist before the production code is touched.

Purpose: Eliminate Pitfall 3 (N+1 query waterfall) by guaranteeing widgets never call Supabase directly. The hub-page is the single Supabase entry-point; widgets are pure cache-readers.

Output: Loader hook, context, JobsokHub.tsx wired to use both, loader test passing, 9 widget test stub files (loader + 8 widgets) ready for Plan 03 to fill in.
</objective>

<execution_context>
@C:/Users/Mikael/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/Mikael/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/03-data-wiring-wcag/03-CONTEXT.md
@.planning/phases/03-data-wiring-wcag/03-RESEARCH.md
@.planning/phases/03-data-wiring-wcag/03-VALIDATION.md
@.planning/phases/03-data-wiring-wcag/03-01-SUMMARY.md
@.planning/research/PITFALLS.md
@CLAUDE.md
@client/src/hooks/useApplications.ts
@client/src/hooks/useDocuments.ts
@client/src/hooks/useSupabase.ts
@client/src/main.tsx
@client/src/pages/hubs/JobsokHub.tsx
@client/src/components/widgets/Widget.tsx
@client/src/components/widgets/registry.ts
@client/src/components/widgets/types.ts
@client/src/components/widgets/defaultLayouts.ts
@client/src/test/setup.ts

<interfaces>
<!-- LOCKED React Query cache keys (verified by reading the existing hooks) -->
<!-- These keys are the contract — DO NOT change them in this plan; the hub-loader writes INTO them -->

From client/src/hooks/useApplications.ts (line 34-46):
```typescript
const QUERY_KEYS = {
  applications: ['applications'] as const,
  stats: ['application-stats'] as const,
  // ... others not relevant for hub-loader
}
```

From client/src/hooks/useDocuments.ts (lines 32, 46):
```typescript
queryKey: ['cv-versions']        // returns CVVersion[]
queryKey: ['cover-letters']      // returns CoverLetter[]
```

<!-- Existing types from useDocuments.ts -->
```typescript
export interface CVVersion {
  id: string
  name: string
  created_at: string
  data?: any
}

export interface CoverLetter {
  id: string
  title?: string
  company_name?: string
  job_title?: string
  created_at: string
  content?: string
}
```

<!-- Existing Phase 2 WidgetContext is in Widget.tsx — DO NOT modify it -->
<!-- It carries size/onSizeChange/allowedSizes/editMode. Phase 3 adds a SEPARATE context for data. -->

<!-- main.tsx QueryClient defaults (verified): -->
<!--   defaultOptions: { queries: { staleTime: 5*60*1000, gcTime: 10*60*1000, retry: 1, refetchOnWindowFocus: false } } -->
<!-- Hub-loader overrides staleTime to 60_000 (60s) — see CONTEXT.md decision -->

<!-- useSupabase doesn't export a `user` helper; auth uses useAuth() from useSupabase.ts -->
<!-- Existing pattern: import { useAuth } from '@/hooks/useSupabase' — returns { user, profile, loading, isAuthenticated } -->

<!-- Existing supabase client export (verified): client/src/lib/supabase.ts exports `supabase` -->

<!-- DB-PERFORMANCE.md from Plan 01 will tell whether SalaryWidget/InternationalWidget tables exist -->
<!-- If salary_data and international_targets are absent: hub-loader does NOT query them; widgets stay in current empty-state mode -->
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Wave 0 — create test stub files for loader and 8 widgets</name>
  <files>
    client/src/hooks/useJobsokHubSummary.test.ts,
    client/src/components/widgets/CvWidget.test.tsx,
    client/src/components/widgets/CoverLetterWidget.test.tsx,
    client/src/components/widgets/InterviewWidget.test.tsx,
    client/src/components/widgets/JobSearchWidget.test.tsx,
    client/src/components/widgets/ApplicationsWidget.test.tsx,
    client/src/components/widgets/SpontaneousWidget.test.tsx,
    client/src/components/widgets/SalaryWidget.test.tsx,
    client/src/components/widgets/InternationalWidget.test.tsx
  </files>
  <read_first>
    - .planning/phases/03-data-wiring-wcag/03-VALIDATION.md (Wave 0 Requirements list — these stubs satisfy it)
    - client/src/test/setup.ts (createMockSupabaseClient helper structure)
    - client/src/components/widgets/Widget.test.tsx (Phase 2 testing pattern — render style, react-router wrapping, etc.)
    - client/src/pages/hubs/__tests__/JobsokHub.test.tsx (mount-pattern with QueryClientProvider)
    - client/src/components/widgets/CvWidget.tsx (component being tested — to know what props/MOCK fields exist)
  </read_first>
  <behavior>
    Each stub file must:
    - Import vitest's `describe`/`it`/`expect`
    - Have at least ONE skipped (`it.skip(...)`) test that names the behavior Plan 03 will implement
    - NOT contain implementation assertions yet (Plan 03 fills these in)
    - Be syntactically valid so `npm run test:run` passes (skipped tests don't fail the suite)

    Loader test (useJobsokHubSummary.test.ts) must include 3 skipped tests:
    - `it.skip('fires Promise.all of 5 supabase selects on mount')`
    - `it.skip('populates ['application-stats'] cache key after loader resolves')`
    - `it.skip('populates ['cv-versions'] and ['cover-letters'] cache keys after loader resolves')`

    Each of the 8 widget tests includes a single skipped test:
    - `it.skip('renders real data from JobsokDataContext (Plan 03 wires this)')`
    - For ApplicationsWidget specifically, ALSO include: `it.skip('hides closed applications by default (A11Y-04)')`

    No mocks, no rendering — these are scaffolds. Production code import statements must compile (import the component, but don't render it).
  </behavior>
  <action>
    Create `client/src/hooks/useJobsokHubSummary.test.ts` with this EXACT content:

    ```typescript
    import { describe, it } from 'vitest'

    /**
     * HUB-01 loader tests — Wave 0 stubs (Plan 03 fills implementation).
     * Each it.skip names a behavior Plan 03's wiring task must satisfy.
     */
    describe('useJobsokHubSummary', () => {
      it.skip('fires Promise.all of 5 supabase selects on mount (HUB-01 loader)', () => {
        // Plan 03 wires real assertions
      })

      it.skip('populates [application-stats] cache key after loader resolves (HUB-01 cache-sync)', () => {
        // After loader resolves, queryClient.getQueryData(['application-stats']) returns stats
      })

      it.skip('populates [cv-versions] and [cover-letters] cache keys after loader resolves (HUB-01 cache-sync)', () => {
        // Deep-link cache pre-populated for instant /cv and /cover-letter navigation
      })
    })
    ```

    Create `client/src/components/widgets/CvWidget.test.tsx` with this EXACT content:

    ```typescript
    import { describe, it } from 'vitest'
    import CvWidget from './CvWidget'

    /**
     * HUB-01 widget data wiring — Wave 0 stub (Plan 03 fills implementation).
     */
    describe('CvWidget — data wiring', () => {
      it.skip('renders milestone label from JobsokDataContext data.cv.completion_pct (HUB-01)', () => {
        // Plan 03 replaces MOCK_CV with context read
        void CvWidget
      })

      it.skip('shows empty state when context returns no cv (A11Y-03 milestone framing — no raw %)', () => {
        // Empty state per UI-SPEC: "Ditt CV väntar"
      })
    })
    ```

    Create `client/src/components/widgets/CoverLetterWidget.test.tsx`:

    ```typescript
    import { describe, it } from 'vitest'
    import CoverLetterWidget from './CoverLetterWidget'

    describe('CoverLetterWidget — data wiring', () => {
      it.skip('renders draft count from JobsokDataContext.coverLetters.length (HUB-01)', () => {
        void CoverLetterWidget
      })

      it.skip('shows last edited from coverLetters[0].title + relative date', () => {})
    })
    ```

    Create `client/src/components/widgets/InterviewWidget.test.tsx`:

    ```typescript
    import { describe, it } from 'vitest'
    import InterviewWidget from './InterviewWidget'

    describe('InterviewWidget — data wiring', () => {
      it.skip('renders latest score from interviewSessions[0].score (HUB-01)', () => {
        void InterviewWidget
      })

      it.skip('renders sparkline trend from last 8 interviewSessions scores (DATA-01)', () => {})

      it.skip('shows "Ingen poäng" when score column is null on latest session (Plan 01 nullable contract)', () => {})
    })
    ```

    Create `client/src/components/widgets/JobSearchWidget.test.tsx`:

    ```typescript
    import { describe, it } from 'vitest'
    import JobSearchWidget from './JobSearchWidget'

    describe('JobSearchWidget — data wiring', () => {
      it.skip('renders top-3 matches with qualitative labels only — no raw % (A11Y-03)', () => {
        void JobSearchWidget
      })
    })
    ```

    Create `client/src/components/widgets/ApplicationsWidget.test.tsx`:

    ```typescript
    import { describe, it } from 'vitest'
    import ApplicationsWidget from './ApplicationsWidget'

    describe('ApplicationsWidget — data wiring', () => {
      it.skip('renders total + per-status segments from applicationStats (HUB-01)', () => {
        void ApplicationsWidget
      })

      it.skip('hides closed applications by default (A11Y-04)', () => {
        // Default: showClosed=false. Toggle reveals.
      })

      it.skip('shows soft "Visa avslutade (N)" link when closed segment is hidden', () => {})
    })
    ```

    Create `client/src/components/widgets/SpontaneousWidget.test.tsx`:

    ```typescript
    import { describe, it } from 'vitest'
    import SpontaneousWidget from './SpontaneousWidget'

    describe('SpontaneousWidget — data wiring', () => {
      it.skip('renders pipeline count from spontaneousCompanies.length (HUB-01)', () => {
        void SpontaneousWidget
      })
    })
    ```

    Create `client/src/components/widgets/SalaryWidget.test.tsx`:

    ```typescript
    import { describe, it } from 'vitest'
    import SalaryWidget from './SalaryWidget'

    describe('SalaryWidget — data wiring (conditional)', () => {
      it.skip('renders salary KPI when salary_data table exists in DB-PERFORMANCE.md', () => {
        void SalaryWidget
      })

      it.skip('renders empty state when no role configured (Phase 3 default)', () => {})
    })
    ```

    Create `client/src/components/widgets/InternationalWidget.test.tsx`:

    ```typescript
    import { describe, it } from 'vitest'
    import InternationalWidget from './InternationalWidget'

    describe('InternationalWidget — data wiring', () => {
      it.skip('renders empty-state by default in Phase 3 (no international_targets table assumed)', () => {
        void InternationalWidget
      })
    })
    ```

    Verify all stubs compile and the suite still passes:
    ```bash
    cd client && npm run test:run 2>&1 | tail -20
    ```

    Expected: all existing 27 tests still pass + new skipped tests are reported but do not fail.
  </action>
  <verify>
    <automated>cd client && npm run test:run 2>&1 | grep -E "(failed|passed)" | tail -5</automated>
  </verify>
  <acceptance_criteria>
    - All 9 stub files exist at the listed paths
    - Each stub file contains at least one `it.skip(...)` block (verifiable: `grep -l "it\.skip" client/src/hooks/useJobsokHubSummary.test.ts client/src/components/widgets/*.test.tsx` returns 9 paths)
    - useJobsokHubSummary.test.ts contains at least 3 `it.skip` calls (verifiable: `grep -c "it\.skip" client/src/hooks/useJobsokHubSummary.test.ts` returns 3 or more)
    - ApplicationsWidget.test.tsx contains the literal string `'hides closed applications by default (A11Y-04)'`
    - InterviewWidget.test.tsx contains the literal string `'sparkline trend from last 8 interviewSessions scores (DATA-01)'`
    - `cd client && npm run test:run` exits 0 (suite still green; skipped tests do not fail)
    - Each widget stub imports its component (e.g. `CvWidget.test.tsx` imports `./CvWidget`) — verifiable by `grep -E "^import.*from './[A-Z]"` returning a match in each
  </acceptance_criteria>
  <done>
    Wave 0 deliverables from 03-VALIDATION.md are satisfied (9 of 14 — remaining 5 are services/anti-shaming/reduced-motion/empathy-review created in Plans 03–05). Plan 03 has scaffolding to fill in test-first.
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Implement useJobsokHubSummary hook + JobsokDataContext + fill the loader test</name>
  <files>
    client/src/hooks/useJobsokHubSummary.ts,
    client/src/hooks/useJobsokHubSummary.test.ts,
    client/src/components/widgets/JobsokDataContext.tsx
  </files>
  <read_first>
    - client/src/hooks/useApplications.ts (QUERY_KEYS = { stats: ['application-stats'] } — line 34–46. The loader writes to this exact key)
    - client/src/hooks/useDocuments.ts (queryKeys ['cv-versions'] line 32, ['cover-letters'] line 46. The loader writes to these exact keys)
    - client/src/lib/supabase.ts (supabase client export; the auth session shape)
    - client/src/hooks/useSupabase.ts (useAuth() returns { user, profile, loading, isAuthenticated })
    - client/src/main.tsx lines 64–76 (QueryClient default options — context for what we override)
    - client/src/test/setup.ts (createMockSupabaseClient helper for tests)
    - .planning/phases/03-data-wiring-wcag/03-RESEARCH.md "Hub Loader: Promise.all Pattern" code example
    - .planning/phases/03-data-wiring-wcag/03-01-SUMMARY.md (verdict on whether salary_data/international_targets exist — informs whether to include them)
  </read_first>
  <behavior>
    The loader hook must, on mount:
    1. Read user via `useAuth()`; if no user, return `{ data: undefined, isLoading: false, isError: false }` (loader is a no-op for logged-out users — JobsokHub gates on auth at the page level already, but the loader must be safe).
    2. Fire ONE `useQuery` with key `['hub', 'jobsok', userId]`, staleTime 60_000.
    3. Inside `queryFn`, fire `Promise.all` of 5 parallel selects: cvs, cover_letters, interview_sessions (with `.eq('completed', true)` and `.limit(8)`), job_applications (status only — for stats), spontaneous_companies.
    4. After resolution, call `queryClient.setQueryData(['application-stats'], computedStats)` where computedStats is `{ total, byStatus: { saved: N, applied: N, interview: N, ... } }`.
    5. Also call `queryClient.setQueryData(['cv-versions'], cvAsArray)` and `queryClient.setQueryData(['cover-letters'], lettersArray)`.
    6. Return the assembled `JobsokSummary` object.

    `JobsokDataContext` exports:
    - `<JobsokDataProvider value={summary}>` — wraps children
    - `useJobsokWidgetData(widgetId): WidgetSlice | undefined` — returns the slice for the given widget id (e.g. 'cv', 'applications'), or `undefined` if the loader hasn't resolved yet (skeleton state)

    The 3 skipped tests in useJobsokHubSummary.test.ts become real:
    - Test 1: mock supabase, call the hook (via renderHook with QueryClientProvider wrapper), wait for `result.current.data` to resolve, assert `supabase.from` was called 5 times with the expected table names.
    - Test 2: same setup; after resolution, assert `queryClient.getQueryData(['application-stats'])` is not undefined and contains a `byStatus` field.
    - Test 3: same setup; assert `queryClient.getQueryData(['cv-versions'])` is an array and `queryClient.getQueryData(['cover-letters'])` is an array.

    Do NOT include salary_data or international_targets in the Promise.all unless 03-01-SUMMARY.md confirms those tables exist. If absent, the loader skips them and the corresponding widgets stay in their existing empty-state behavior (Pattern 2 / Pitfall F from research).
  </behavior>
  <action>
    Create `client/src/components/widgets/JobsokDataContext.tsx`:

    ```typescript
    import { createContext, useContext, type ReactNode } from 'react'

    /** Shape of the data the loader emits. Each field maps to a widget's slice. */
    export interface JobsokSummary {
      cv: { id: string; updated_at: string; completion_pct?: number } | null
      coverLetters: Array<{ id: string; title?: string; created_at: string }>
      interviewSessions: Array<{ id: string; score: number | null; created_at: string }>
      applicationStats: {
        total: number
        byStatus: Record<string, number>
        segments: Array<{ label: string; count: number; deEmphasized?: boolean }>
      }
      spontaneousCount: number
      // salary + international are optional — loader omits if tables don't exist
      salary?: { median: number; low: number; high: number; roleLabel: string } | null
      international?: { countries: string[] } | null
    }

    const JobsokDataContext = createContext<JobsokSummary | undefined>(undefined)

    export function JobsokDataProvider({ value, children }: { value: JobsokSummary | undefined; children: ReactNode }) {
      return <JobsokDataContext.Provider value={value}>{children}</JobsokDataContext.Provider>
    }

    /** Returns the data slice for a widget, or undefined while loader is pending. */
    export function useJobsokWidgetData<K extends keyof JobsokSummary>(slice: K): JobsokSummary[K] | undefined {
      const ctx = useContext(JobsokDataContext)
      if (!ctx) return undefined
      return ctx[slice]
    }

    /** Returns the entire summary (for widgets needing multiple slices, e.g. JobSearchWidget). */
    export function useJobsokSummary(): JobsokSummary | undefined {
      return useContext(JobsokDataContext)
    }
    ```

    Create `client/src/hooks/useJobsokHubSummary.ts`:

    ```typescript
    import { useQuery, useQueryClient } from '@tanstack/react-query'
    import { useAuth } from '@/hooks/useSupabase'
    import { supabase } from '@/lib/supabase'
    import type { JobsokSummary } from '@/components/widgets/JobsokDataContext'

    /** Stable query key — exported so tests and DevTools can target it. */
    export const JOBSOK_HUB_KEY = (userId: string) => ['hub', 'jobsok', userId] as const

    type AppRow = { status: string }

    function buildApplicationStats(rows: AppRow[]) {
      const byStatus: Record<string, number> = {}
      for (const r of rows) byStatus[r.status] = (byStatus[r.status] ?? 0) + 1
      // segments mirror Phase 2 ApplicationsWidget MOCK shape (anti-shaming: closed segment de-emphasized)
      const segments = [
        { label: 'aktiva',        count: byStatus['saved']     ?? 0 },
        { label: 'svar inväntas', count: byStatus['applied']   ?? 0 },
        { label: 'intervju',      count: byStatus['interview'] ?? 0 },
        { label: 'avslutade',     count: (byStatus['rejected'] ?? 0) + (byStatus['closed'] ?? 0), deEmphasized: true },
      ]
      return { total: rows.length, byStatus, segments }
    }

    export function useJobsokHubSummary() {
      const { user } = useAuth()
      const userId = user?.id ?? ''
      const queryClient = useQueryClient()

      return useQuery<JobsokSummary>({
        queryKey: JOBSOK_HUB_KEY(userId),
        enabled: !!userId,
        staleTime: 60_000,
        queryFn: async () => {
          const [cvR, lettersR, sessionsR, appsR, sponR] = await Promise.all([
            supabase.from('cvs').select('id, updated_at, completion_pct').eq('user_id', userId).maybeSingle(),
            supabase.from('cover_letters').select('id, title, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(3),
            supabase.from('interview_sessions').select('id, score, created_at').eq('user_id', userId).eq('completed', true).order('created_at', { ascending: false }).limit(8),
            supabase.from('job_applications').select('status').eq('user_id', userId),
            supabase.from('spontaneous_companies').select('id').eq('user_id', userId),
          ])

          const summary: JobsokSummary = {
            cv: cvR.data ?? null,
            coverLetters: lettersR.data ?? [],
            interviewSessions: sessionsR.data ?? [],
            applicationStats: buildApplicationStats((appsR.data as AppRow[] | null) ?? []),
            spontaneousCount: sponR.data?.length ?? 0,
          }

          // Deep-link cache sync — write to EXACT keys used by useDocuments + useApplications
          queryClient.setQueryData(['application-stats'], summary.applicationStats)
          queryClient.setQueryData(['cv-versions'], summary.cv ? [summary.cv] : [])
          queryClient.setQueryData(['cover-letters'], summary.coverLetters)

          return summary
        },
      })
    }
    ```

    Replace `client/src/hooks/useJobsokHubSummary.test.ts` skipped tests with real assertions. Use the existing `createMockSupabaseClient()` helper from `client/src/test/setup.ts`. Mock `@/hooks/useSupabase` to return a fixed user. Mock `@/lib/supabase` to return a chainable mock that returns fixture data per table.

    Implementation pattern for the test file:

    ```typescript
    import { describe, it, expect, vi, beforeEach } from 'vitest'
    import { renderHook, waitFor } from '@testing-library/react'
    import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
    import type { ReactNode } from 'react'

    vi.mock('@/hooks/useSupabase', () => ({
      useAuth: () => ({ user: { id: 'test-user-id' }, profile: null, loading: false, isAuthenticated: true }),
    }))

    const fromMock = vi.fn()
    vi.mock('@/lib/supabase', () => ({
      supabase: { from: (...args: unknown[]) => fromMock(...args) },
    }))

    function makeBuilder(data: unknown) {
      const builder: any = {
        select: vi.fn(() => builder),
        eq: vi.fn(() => builder),
        order: vi.fn(() => builder),
        limit: vi.fn(() => Promise.resolve({ data, error: null })),
        maybeSingle: vi.fn(() => Promise.resolve({ data, error: null })),
        // For job_applications + spontaneous_companies the chain ends after .eq
        then: (resolve: (v: { data: unknown; error: null }) => unknown) => resolve({ data, error: null }),
      }
      return builder
    }

    function wrapper({ children }: { children: ReactNode }) {
      const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
      ;(wrapper as any).qc = qc
      return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    }

    describe('useJobsokHubSummary', () => {
      beforeEach(() => {
        fromMock.mockReset()
        // Per-table fixtures
        fromMock.mockImplementation((table: string) => {
          if (table === 'cvs')                  return makeBuilder({ id: 'cv1', updated_at: '2026-04-25', completion_pct: 75 })
          if (table === 'cover_letters')        return makeBuilder([{ id: 'cl1', title: 'Klarna', created_at: '2026-04-26' }])
          if (table === 'interview_sessions')   return makeBuilder([{ id: 's1', score: 84, created_at: '2026-04-27' }])
          if (table === 'job_applications')     return makeBuilder([{ status: 'saved' }, { status: 'applied' }, { status: 'rejected' }])
          if (table === 'spontaneous_companies')return makeBuilder([{ id: 'c1' }, { id: 'c2' }])
          return makeBuilder([])
        })
      })

      it('fires Promise.all of 5 supabase selects on mount (HUB-01 loader)', async () => {
        const { useJobsokHubSummary } = await import('./useJobsokHubSummary')
        const { result } = renderHook(() => useJobsokHubSummary(), { wrapper })
        await waitFor(() => expect(result.current.isSuccess).toBe(true))
        expect(fromMock).toHaveBeenCalledWith('cvs')
        expect(fromMock).toHaveBeenCalledWith('cover_letters')
        expect(fromMock).toHaveBeenCalledWith('interview_sessions')
        expect(fromMock).toHaveBeenCalledWith('job_applications')
        expect(fromMock).toHaveBeenCalledWith('spontaneous_companies')
        expect(fromMock).toHaveBeenCalledTimes(5)
      })

      it('populates [application-stats] cache key after loader resolves (HUB-01 cache-sync)', async () => {
        const { useJobsokHubSummary } = await import('./useJobsokHubSummary')
        const { result } = renderHook(() => useJobsokHubSummary(), { wrapper })
        await waitFor(() => expect(result.current.isSuccess).toBe(true))
        const stats = (wrapper as any).qc.getQueryData(['application-stats'])
        expect(stats).toBeDefined()
        expect(stats).toHaveProperty('byStatus')
        expect(stats.byStatus).toMatchObject({ saved: 1, applied: 1, rejected: 1 })
      })

      it('populates [cv-versions] and [cover-letters] cache keys after loader resolves', async () => {
        const { useJobsokHubSummary } = await import('./useJobsokHubSummary')
        const { result } = renderHook(() => useJobsokHubSummary(), { wrapper })
        await waitFor(() => expect(result.current.isSuccess).toBe(true))
        const cvs = (wrapper as any).qc.getQueryData(['cv-versions'])
        const letters = (wrapper as any).qc.getQueryData(['cover-letters'])
        expect(Array.isArray(cvs)).toBe(true)
        expect(Array.isArray(letters)).toBe(true)
      })
    })
    ```

    Run the test and confirm green:
    ```bash
    cd client && npm run test:run -- src/hooks/useJobsokHubSummary.test.ts
    ```
  </action>
  <verify>
    <automated>cd client && npm run test:run -- src/hooks/useJobsokHubSummary.test.ts 2>&1 | grep -E "(passed|failed)"</automated>
  </verify>
  <acceptance_criteria>
    - File `client/src/hooks/useJobsokHubSummary.ts` exists
    - File contains literal `export function useJobsokHubSummary()`
    - File contains literal `Promise.all` (verifiable: `grep -c "Promise\.all" client/src/hooks/useJobsokHubSummary.ts` returns >=1)
    - File contains exactly 5 `supabase.from(` calls inside the queryFn (verifiable: `grep -c "supabase\.from(" client/src/hooks/useJobsokHubSummary.ts` returns 5)
    - File contains `queryClient.setQueryData(['application-stats']` (verifiable via grep)
    - File contains `queryClient.setQueryData(['cv-versions']` (verifiable via grep)
    - File contains `queryClient.setQueryData(['cover-letters']` (verifiable via grep)
    - File `client/src/components/widgets/JobsokDataContext.tsx` exists
    - File contains `export function useJobsokWidgetData`
    - File contains `export function JobsokDataProvider`
    - `cd client && npm run test:run -- src/hooks/useJobsokHubSummary.test.ts` exits 0 with 3 passing tests (no skipped, no failed)
    - `cd client && npx tsc --noEmit` exits 0 (no TypeScript errors introduced)
  </acceptance_criteria>
  <done>
    HUB-01 loader is implemented and tested. Cache-sync to deep-link keys is verified by passing tests. Plan 03 can replace MOCK constants in widgets with `useJobsokWidgetData(...)` reads.
  </done>
</task>

<task type="auto">
  <name>Task 3: Wire JobsokHub.tsx to mount the loader and provide JobsokDataContext to widget slots</name>
  <files>client/src/pages/hubs/JobsokHub.tsx</files>
  <read_first>
    - client/src/pages/hubs/JobsokHub.tsx (current Phase 2 structure — sections, sizes state, announcement live-region)
    - client/src/pages/hubs/__tests__/JobsokHub.test.tsx (existing 10 tests — confirm they still pass after wiring)
    - client/src/components/widgets/JobsokDataContext.tsx (just created — provider API)
    - client/src/hooks/useJobsokHubSummary.ts (just created — hook API)
    - .planning/research/PITFALLS.md Pitfall D ("Screen Reader Over-Announcement on Layout") — the aria-live region MUST stay stable, NOT inside a conditional that remounts on data load
  </read_first>
  <action>
    Modify `client/src/pages/hubs/JobsokHub.tsx` to:

    1. Add imports at top:
       ```typescript
       import { useJobsokHubSummary } from '@/hooks/useJobsokHubSummary'
       import { JobsokDataProvider } from '@/components/widgets/JobsokDataContext'
       ```

    2. Inside the `JobsokHub` function body, AFTER the existing `useState`/`useCallback` lines but BEFORE the `return`, add:
       ```typescript
       const { data: summary } = useJobsokHubSummary()
       ```
       Note: we deliberately do NOT destructure `isLoading` or `isError` here. Widget-level skeleton/empty handling is per-widget (Plan 03). At the hub level, we only need to provide the data downstream.

    3. Wrap the existing `<PageLayout>...</PageLayout>` block's CHILDREN (everything inside PageLayout's open and close tags) with `<JobsokDataProvider value={summary}>...</JobsokDataProvider>`.

       The aria-live region (`<div role="status" aria-live="polite" className="sr-only">{announcement}</div>`) MUST stay where it is — it is INSIDE PageLayout's children but it must NOT be conditionally rendered or remounted when `summary` changes. Wrapping the entire children in JobsokDataProvider is fine because the provider does not unmount its children when its value changes (React preserves the tree).

    4. Do NOT remove or modify the existing announcement/sizes state — Phase 2 keyboard contract stays.

    5. Do NOT change the section iteration or HubGrid.Section/HubGrid.Slot structure — only add the loader + provider wrapper.

    Final structure (illustrative — adapt to current file):

    ```typescript
    export default function JobsokHub() {
      const { t } = useTranslation()
      const sections = useMemo(() => getJobbSections(), [])
      const [sizes, setSizes] = useState<Record<string, WidgetSize>>(/* unchanged */)
      const [announcement, setAnnouncement] = useState('')
      const handleSizeChange = useCallback(/* unchanged */, [])

      // PHASE 3: hub-summary loader. Single Supabase entry-point for all 8 widgets.
      const { data: summary } = useJobsokHubSummary()

      return (
        <PageLayout title={...} subtitle={...} domain="activity" showTabs={false}>
          <JobsokDataProvider value={summary}>
            {/* Live region — stable, NOT remounted on data load (Pitfall D) */}
            <div role="status" aria-live="polite" className="sr-only">
              {announcement}
            </div>

            {sections.map(section => (
              <HubGrid.Section key={section.title} title={section.title}>
                {section.items.map(item => { /* unchanged */ })}
              </HubGrid.Section>
            ))}
          </JobsokDataProvider>
        </PageLayout>
      )
    }
    ```

    Run the existing JobsokHub test suite to confirm no regression:
    ```bash
    cd client && npm run test:run -- src/pages/hubs/__tests__/JobsokHub.test.tsx
    ```

    Run the full suite:
    ```bash
    cd client && npm run test:run
    ```

    Run TypeScript check:
    ```bash
    cd client && npx tsc --noEmit
    ```

    All three must succeed. If JobsokHub.test.tsx fails because the test renders without QueryClientProvider, the test itself needs a QueryClientProvider wrapper added — fix the test, not the production code (the production code is correct: it expects to run inside the app's main.tsx QueryClientProvider).
  </action>
  <verify>
    <automated>cd client && npm run test:run 2>&1 | grep -E "(Tests|failed|passed)" | tail -5 && npx tsc --noEmit 2>&1 | tail -5</automated>
  </verify>
  <acceptance_criteria>
    - File `client/src/pages/hubs/JobsokHub.tsx` contains literal import `from '@/hooks/useJobsokHubSummary'`
    - File contains literal import `from '@/components/widgets/JobsokDataContext'`
    - File contains exactly one call to `useJobsokHubSummary()` (verifiable: `grep -c "useJobsokHubSummary()" client/src/pages/hubs/JobsokHub.tsx` returns 1)
    - File contains `<JobsokDataProvider value={summary}>` wrapping the page children (verifiable via grep)
    - File still contains the original `<div role="status" aria-live="polite" className="sr-only">` (Pitfall D: stable live region)
    - `cd client && npm run test:run -- src/pages/hubs/__tests__/JobsokHub.test.tsx` exits 0
    - `cd client && npm run test:run` exits 0 (full suite green)
    - `cd client && npx tsc --noEmit` exits 0
    - No new Supabase imports added directly to widget files (verifiable: `grep -l "from '@/lib/supabase'" client/src/components/widgets/*.tsx` returns no matches — Pitfall A guard)
  </acceptance_criteria>
  <done>
    JobsokHub mounts the loader once and provides data via context. Plan 03 can read from context in each widget without adding any Supabase imports. The Pitfall A guard (no widget calls Supabase directly) is now an enforced architectural property of this phase.
  </done>
</task>

</tasks>

<verification>
- Loader hook test: 3 tests passing (Promise.all + 2 cache-sync assertions)
- Widget stub tests: 9 files exist, all skipped tests reported but suite green
- JobsokHub regression test: existing 10 tests still passing after wiring
- TypeScript: zero errors
- Full suite: green
- Architectural guard: no widget file imports `@/lib/supabase` (Pitfall A)
</verification>

<success_criteria>
- HUB-01 (loader half): single hub-level entry point fires Promise.all of 5 selects
- HUB-01 (cache-sync half): three deep-link keys populated after loader resolves — verified by passing tests
- Wave 0 of 03-VALIDATION.md: 9 of 14 stub files created (loader + 8 widgets)
- JobsokHub wiring: loader mounted, context provider wraps children, aria-live region preserved (Pitfall D)
- Plan 03 unblocked: each widget can now replace MOCK constants with `useJobsokWidgetData(slice)` reads
</success_criteria>

<output>
After completion, create `.planning/phases/03-data-wiring-wcag/03-02-SUMMARY.md` with:
- Loader test result (3/3 passing)
- Confirmation that no widget file imports supabase (Pitfall A guard active)
- Confirmation that the existing JobsokHub.test.tsx 10 tests still pass
- The 9 stub file paths created in Wave 0
- Note for Plan 03 on the JobsokSummary type shape so downstream tasks know what each widget can read
</output>
