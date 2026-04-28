# Phase 3: Data Wiring + WCAG — Research

**Researched:** 2026-04-28
**Domain:** React Query cache architecture, Supabase schema (additive), WCAG 2.1 AA widget accessibility, empathy-review process
**Confidence:** HIGH — all findings grounded in direct codebase reading

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Phase scope (sharp boundary):**
- Only the 8 widgets on JobsokHub (Söka Jobb) receive real data in Phase 3.
- HUB-02/03/04 (Karriär/Resurser/Min Vardag widget sets) move to Phase 5.
- REQUIREMENTS.md traceability updated as a housekeeping task so HUB-02..04 map to Phase 5.

**Inviolable (Mikael's explicit preference):**
- No DROP, no destructive ALTER COLUMN, original 27 deep-link routes untouched.
- Only ADD COLUMN and new tables are permitted.
- Existing 51 hooks in `client/src/hooks/` must not break — Phase 3 builds on top of them.

**Data layer = hybrid hub-loader:**
- `useJobsokHubSummary(userId)` does `Promise.all` of 5–8 Supabase selects, distributes via React Query cache.
- Per-widget hooks read from cache; no widget makes its own Supabase calls.
- EXPLAIN ANALYZE first (Plan 01 blocker) before loader design is finalized.

**DATA-01 schema:**
`ALTER TABLE interview_sessions ADD COLUMN score NUMERIC(4,1) DEFAULT NULL, ADD COLUMN score_breakdown JSONB DEFAULT NULL;`
Existing RLS unchanged. Append-only (each session is a row). Nullable score.

**DATA-02 schema:**
New table `personal_brand_audits` (separate from the existing `personal_brand_audit` upsert table).
Schema: `(id UUID, user_id UUID, score NUMERIC(4,1), dimensions JSONB, summary TEXT, created_at TIMESTAMPTZ)`.
4 RLS policies on `auth.uid() = user_id`. Append-only (each audit run is a row).

**Empathy-review = two-step ship gate (A11Y-05):**
- Step 1: Pre-implementation copy review before data is wired.
- Step 2: Post-implementation screenshot review after all 8 widgets render live data.
- Both `arbetskonsulent` + `langtidsarbetssokande` agents must sign off.
- Iteration budget: 1 review + max 1 revision per agent.
- Sign-off file: `.planning/phases/03-data-wiring-wcag/03-EMPATHY-REVIEW.md`.

**WCAG implementation must cover:**
- A11Y-01: keyboard navigation full hub (Pitfalls 9, 17).
- A11Y-02: prefers-reduced-motion (Pitfall 13) — tokens.css is already reduced-motion-aware.
- A11Y-03: milestone framing instead of percentages (Pitfall 11) — Phase 2 UI-SPEC already locks copy.
- A11Y-04: closed applications hidden by default.

### Claude's Discretion

- Exact queryKey strings (suggested: `['hub', 'jobsok', userId]`, `['interview-sessions', userId]`, `['personal-brand', userId]`)
- Exact skeleton-loading pattern per widget (Phase 2 UI-SPEC provides the frame)
- Which existing hooks become cache-readers vs. remain as-is — determined by code reading
- WCAG test strategy: Vitest-axe + manual NVDA + keyboard-only smoke test (no Playwright unless already present)
- Exact `aria-live` regions for size-toggle and layout changes (Phase 2 UI-SPEC has the frame)
- How sparkline for Interview trend renders (existing Sparkline primitive suffices)

### Deferred Ideas (OUT OF SCOPE)

- HUB-02/03/04 widget sets (Karriär/Resurser/Min Vardag) — Phase 5.
- Hub-summary RPC / materialized view — document if EXPLAIN ANALYZE shows >50ms, implement in v1.1.
- Per-widget hooks replacing existing deep-link hooks — consolidation in v1.1 after all hubs wired.
- Internationalized audit trend — i18next exists but English is not a v1.0 requirement.
- WCAG audit of the 27 original deep-link pages — separate audit project.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| HUB-01 | Söka Jobb visar 8 widgets med riktig data | Hub-loader architecture, existing hook inventory, cache key strategy |
| HUB-02 | Traceability fix — moved to Phase 5 | Out of scope; tracked in Deferred |
| HUB-03 | Traceability fix — moved to Phase 5 | Out of scope; tracked in Deferred |
| HUB-04 | Traceability fix — moved to Phase 5 | Out of scope; tracked in Deferred |
| DATA-01 | Interview session score persisted in Supabase | Existing `interview_sessions` schema confirmed, ADD COLUMN path clear |
| DATA-02 | Personal Brand audit score persisted in Supabase | Existing `personal_brand_audit` table confirmed (upsert/non-append); new append-only `personal_brand_audits` table needed |
| A11Y-01 | Keyboard navigation of full hub | `<button>` elements exist (Phase 2); `aria-live` region exists; focus management, focus-trap on size-toggle gaps identified |
| A11Y-02 | prefers-reduced-motion for all animations | `tokens.css` already compliant; Framer Motion requires `useReducedMotion()` check |
| A11Y-03 | Milestone framing, no raw percentages | Phase 2 copy already locked; ApplicationsWidget: closed-by-default filter needed for live data |
| A11Y-04 | Closed/rejected applications hidden by default | `useApplications` hook query key identified; filter logic in ApplicationsWidget |
| A11Y-05 | Empathy-review sign-off by both agents | Two-step process: pre-data copy review + post-data screenshot review |
</phase_requirements>

---

## Summary

Phase 3 has one central challenge — replacing eight `const MOCK = {...}` blocks with live Supabase data without triggering the N+1 query waterfall (Pitfall 3) or breaking the 51 existing hooks (Pitfall 18). The solution is a hub-level summary loader (`useJobsokHubSummary`) that fires a single `Promise.all` of 5–8 targeted Supabase selects, populates the React Query cache under both hub-summary and deep-link query keys simultaneously, and lets each widget read from cache with no direct Supabase access.

Two schema migrations land in this phase: a non-destructive `ADD COLUMN score NUMERIC(4,1)` on the existing `interview_sessions` table, and a new append-only `personal_brand_audits` table. A critical discovery: a `personal_brand_audit` table already exists (upsert pattern, `total_score INTEGER`) from migration `20260322183304`. The new `personal_brand_audits` table is intentionally separate — it provides the append-only history row that the widget needs for trend display, while the existing table retains its current upsert behavior for the `BrandAuditTab` page.

WCAG implementation for Phase 3 is largely structural: `tokens.css` already handles `prefers-reduced-motion` automatically for any animation using `--motion-*` tokens, Phase 2 locked all empathy-safe copy in UI-SPEC, and the `WidgetErrorBoundary` already isolates failures. The gaps are: (1) a formal keyboard-navigation audit of the hub shell proving Tab order is logical and the live-region announcement is correct for screen readers, (2) confirming Framer Motion uses `useReducedMotion()`, and (3) adding a closed-applications filter to `ApplicationsWidget` before data wires.

**Primary recommendation:** Write `useJobsokHubSummary` first, with EXPLAIN ANALYZE results as the gate. All other plans depend on this query being performant before wiring begins.

---

## Standard Stack

### Core (all already installed — no new packages needed)

| Library | Version | Purpose | Phase 3 Role |
|---------|---------|---------|--------------|
| @tanstack/react-query | ^5.90.21 | Server state + cache | Hub-loader + per-widget cache-reads |
| @supabase/supabase-js | ^2.97.0 | DB access + RLS | 5–8 parallel selects in hub-loader; 2 migrations |
| framer-motion | ^12.36.0 | Widget mount animations | Must add `useReducedMotion()` check |
| vitest | (client/vitest.config.ts) | Test framework | A11Y unit tests + data-layer tests |
| @testing-library/react | (installed, per setup.ts) | Component testing | Widget data wiring tests |

### No New Packages Needed

Phase 3 adds no npm dependencies. All required libraries are installed. The `vitest-axe` package is NOT currently installed (verified by searching `client/package.json` — no axe entries found). The CONTEXT.md decision is WCAG testing via Vitest + manual NVDA + keyboard-only smoke test, so no axe installation is required unless planned as Claude's Discretion.

---

## Architecture Patterns

### Pattern 1: Hub-Level Summary Loader

**What:** `useJobsokHubSummary()` fires `Promise.all` of 5–8 Supabase selects in a single `useQuery`. On success, it writes to the React Query cache under BOTH the hub key AND the deep-link page keys, so navigating from hub to `/applications` is an instant cache-hit.

**When to use:** Called once in `JobsokHub.tsx` at mount. All 8 widget components read from cache via `queryClient.getQueryData(...)` — no widget calls Supabase.

**Key implementation shape:**

```typescript
// client/src/hooks/useJobsokHubSummary.ts
export const JOBSOK_HUB_KEY = (userId: string) => ['hub', 'jobsok', userId] as const

export function useJobsokHubSummary() {
  const queryClient = useQueryClient()
  const userId = useAuthUser()?.id ?? ''

  return useQuery({
    queryKey: JOBSOK_HUB_KEY(userId),
    enabled: !!userId,
    staleTime: 60_000,          // 60s — hub data fades slower than widget actions
    queryFn: async () => {
      const [cv, coverLetters, interviewSessions, applicationStats, spontaneousCount] =
        await Promise.all([
          supabase.from('cvs').select('id, updated_at, completion_pct').eq('user_id', userId).maybeSingle(),
          supabase.from('cover_letters').select('id, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(1),
          supabase.from('interview_sessions').select('score, created_at').eq('user_id', userId).eq('completed', true).order('created_at', { ascending: false }).limit(8),
          supabase.from('job_applications').select('status').eq('user_id', userId),
          supabase.from('spontaneous_companies').select('id').eq('user_id', userId),
          // salary_data and international_targets: if tables absent, these selects return empty — widgets show empty state
        ])

      const summary = buildHubSummary(cv.data, coverLetters.data, interviewSessions.data, applicationStats.data, spontaneousCount.data)

      // Populate deep-link cache keys so navigating from hub is instant
      queryClient.setQueryData(['application-stats'], summary.applicationStats)
      queryClient.setQueryData(['cv-versions'], summary.cvVersions)
      queryClient.setQueryData(['cover-letters'], summary.coverLetters)

      return summary
    },
  })
}
```

**Why `setQueryData` for deep-link cache sync:**
- `useApplications` uses queryKey `['application-stats']` for stats (verified in `useApplications.ts:QUERY_KEYS.stats`)
- `useDocuments` uses `['cv-versions']` and `['cover-letters']` (verified in `useDocuments.ts`)
- Writing to these keys at hub mount means the deep-link pages hit cache on first navigation, no re-fetch

**EXPLAIN ANALYZE gate (Plan 01 blocker):**
Run before designing the loader:
```sql
EXPLAIN ANALYZE SELECT id, updated_at FROM cvs WHERE user_id = auth.uid();
EXPLAIN ANALYZE SELECT id, created_at FROM cover_letters WHERE user_id = auth.uid() ORDER BY created_at DESC LIMIT 1;
EXPLAIN ANALYZE SELECT score, created_at FROM interview_sessions WHERE user_id = auth.uid() AND completed = true ORDER BY created_at DESC LIMIT 8;
EXPLAIN ANALYZE SELECT status FROM job_applications WHERE user_id = auth.uid();
EXPLAIN ANALYZE SELECT id FROM spontaneous_companies WHERE user_id = auth.uid();
```
If cumulative time >50ms → document as Phase 5 RPC candidate. For Phase 3, proceed with `Promise.all`.

### Pattern 2: Per-Widget Data Read via WidgetContext

**What:** Each widget gets data from `JobsokHub.tsx` via props or WidgetContext — no per-widget `useQuery` with Supabase calls.

**Phase 2 established pattern:** `JobsokHub.tsx` passes `size` and `onSizeChange` to each widget. Phase 3 extends the pattern with a `data` prop (or via context if the widget prop interface would become too wide).

**Two implementation options (Claude's discretion):**
1. **Direct data prop:** `<Component id={item.id} size={...} data={hubSummary[item.id]} />`
   — Requires updating `WidgetProps` type to include `data?: unknown`
   — Simple but couples hub data shape to WidgetProps

2. **Extended WidgetContext:** Hub writes summary into a new `JobsokDataContext`, widget reads via `useJobsokWidgetData(id)`
   — More encapsulated; consistent with Phase 2's WidgetContext pattern for size
   — Preferred if 3+ widgets need shared sub-data from the same hub fetch

**Constraint:** Do NOT add per-widget `useQuery` calls. The mock constants (`const MOCK = {...}`) are replaced by data from the hub summary or an empty-state fallback.

### Pattern 3: Additive Schema Migrations

**What:** Two migrations, both strictly additive, no DROP or destructive ALTER.

**Migration A — DATA-01:**
```sql
-- File: supabase/migrations/20260429_interview_score.sql
ALTER TABLE interview_sessions
  ADD COLUMN IF NOT EXISTS score NUMERIC(4,1) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS score_breakdown JSONB DEFAULT NULL;
```
Run with: `npx supabase db query --linked -f supabase/migrations/20260429_interview_score.sql`

**Migration B — DATA-02:**
```sql
-- File: supabase/migrations/20260429_personal_brand_audits.sql
CREATE TABLE IF NOT EXISTS personal_brand_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score NUMERIC(4,1) NOT NULL,
  dimensions JSONB NOT NULL DEFAULT '{}',
  summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pba_user ON personal_brand_audits(user_id);
CREATE INDEX IF NOT EXISTS idx_pba_created ON personal_brand_audits(created_at DESC);
ALTER TABLE personal_brand_audits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pba_select" ON personal_brand_audits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "pba_insert" ON personal_brand_audits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "pba_update" ON personal_brand_audits FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "pba_delete" ON personal_brand_audits FOR DELETE USING (auth.uid() = user_id);
```
Run with: `npx supabase db query --linked -f supabase/migrations/20260429_personal_brand_audits.sql`

**Critical distinction:** `personal_brand_audits` (new, append-only) is different from `personal_brand_audit` (existing, upsert-based from `20260322183304_personal_brand_tables.sql`). The existing table is used by `BrandAuditTab.tsx` via `personalBrandApi.saveAuditAnswers()` — do not modify it. The new table adds score history that the widget reads.

### Pattern 4: ApplicationsWidget Closed-Applications Filter (A11Y-04)

**What:** The `ApplicationsWidget` currently hardcodes `MOCK.segments` including `avslutade`. When wired to live data, closed/rejected applications must be hidden by default.

**Implementation:** Filter from the live data before passing to `StackedBar`:
```typescript
// In ApplicationsWidget with real data:
const visibleSegments = showClosed
  ? allSegments
  : allSegments.filter(s => s.label !== 'avslutade')

// Default: showClosed = false
const [showClosed, setShowClosed] = useState(false)
```
A soft "Visa avslutade (N)" link below the bar expands them. This satisfies A11Y-04 without hiding data permanently.

### Pattern 5: WCAG Keyboard Navigation (A11Y-01)

**What Phase 2 established (confirmed in VERIFICATION.md):**
- `role="group" aria-label="Välj widgetstorlek"` on toggle buttons ✓
- `aria-pressed` per button ✓
- `role="status" aria-live="polite" className="sr-only"` for size-change announcements ✓
- All widget footer links are `<Link>` (keyboard focusable) ✓

**Phase 3 gaps to address:**

1. **Focus ring on widget card itself:** Widget.Root (`div`) must have `tabIndex={0}` to be reachable by keyboard when not in edit mode, OR the first focusable child (size toggle) must be reachable via Tab from the previous widget.

2. **Tab order across hub sections:** `HubGrid.Section` renders `<section aria-label>` + widgets in DOM order. Tab moves focus through all focusable elements in DOM order — this is correct as long as the widget size-toggle group has `tabIndex` managed correctly (roving tabindex within the group).

3. **Screen reader live-region during layout changes (Pitfall 17):** Phase 2 `JobsokHub.tsx` already has the `aria-live="polite"` region at line 43. Phase 3 must ensure this region is NOT re-mounted when the hub rerenders after data loads (stable ref, not conditional).

4. **Focus management when widget data loads:** When a widget transitions from skeleton to data, focus must not jump. Ensure no `autoFocus` or `focus()` calls in widget render paths.

### Pattern 6: prefers-reduced-motion (A11Y-02)

**Already handled by tokens.css:**
```css
/* tokens.css:129-134 (verified) */
@media (prefers-reduced-motion: reduce) {
  :root {
    --motion-fast:     0.01ms;
    --motion-standard: 0.01ms;
    --motion-slow:     0.01ms;
  }
}
```
Any widget animation using `var(--motion-fast)` etc. is automatically compliant.

**Framer Motion gap to verify:** `InterviewWidget.tsx` and `CoverLetterWidget.tsx` may use Framer Motion from `framer-motion ^12.36.0`. Check: does each animated component use `useReducedMotion()` hook and pass `initial={false}` when true?

```typescript
// Required pattern in any widget using Framer Motion:
import { motion, useReducedMotion } from 'framer-motion'

export default function SomeWidget(props: WidgetProps) {
  const shouldReduce = useReducedMotion()
  // ...
  return (
    <motion.div
      initial={shouldReduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: shouldReduce ? 0 : 0.3 }}
    >
      {/* content */}
    </motion.div>
  )
}
```

### Pattern 7: Empathy-Review Two-Step Process (A11Y-05)

**Step 1 — Pre-implementation copy review:**
- Render each widget's data shape as a Markdown table: state, heading, body text, CTA, empty-state copy.
- Feed to `arbetskonsulent` and `langtidsarbetssokande` agents.
- Output: list of copy changes. Block: apply changes before data wiring commits land.

**Step 2 — Post-implementation screenshot review:**
- Each widget in three states: filled (real user data), empty (new account), error (WidgetErrorBoundary triggered).
- Same two agents review: PASS / FLAG / BLOCK verdict per widget per state.
- BLOCK = revision task before Phase 3 ships.

**Sign-off artifact:** `.planning/phases/03-data-wiring-wcag/03-EMPATHY-REVIEW.md`
Format:
```markdown
## Pre-Implementation Copy Review
| Widget | Agent | Date | Verdict | Changes Applied |
| ...    | ...   | ...  | PASS/BLOCK | ... |

## Post-Implementation Screenshot Review
| Widget | State | Agent | Verdict | Notes |
| ...    | ...   | ...   | ...     | ...   |

## Final Sign-Off
arbetskonsulent: APPROVED — [date] — commit SHA [sha]
langtidsarbetssokande: APPROVED — [date] — commit SHA [sha]
```

### Recommended File Structure (Phase 3 new files)

```
client/src/
├── hooks/
│   ├── useJobsokHubSummary.ts     # Hub-level data loader (HUB-01 core)
│   ├── useInterviewSessions.ts    # DATA-01: last 8 scores, widget + deep-link
│   └── usePersonalBrandAudits.ts  # DATA-02: last audit score from new table
├── services/
│   └── personalBrandAuditsApi.ts  # insert to personal_brand_audits
supabase/migrations/
│   ├── 20260429_interview_score.sql          # DATA-01: ADD COLUMN
│   └── 20260429_personal_brand_audits.sql    # DATA-02: new table
.planning/phases/03-data-wiring-wcag/
│   └── 03-EMPATHY-REVIEW.md      # A11Y-05 sign-off artifact
```

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Parallel Supabase fetches | Custom Promise chain manager | `Promise.all([...])` inside `useQuery.queryFn` | React Query handles dedup, error, retry |
| Deep-link cache population | Separate hook that re-fetches | `queryClient.setQueryData(deepLinkKey, data)` in hub loader | Zero extra network calls |
| Motion sensitivity detection | Custom CSS variable reader | `useReducedMotion()` from framer-motion / `window.matchMedia('(prefers-reduced-motion: reduce)')` | Browser API, authoritative |
| Skeleton loading | Custom shimmer animation | Existing `animate-pulse` Tailwind utility + `bg-stone-200` (established in Phase 2 UI-SPEC) | Already in design system |
| RLS policy boilerplate | Custom auth middleware | Standard 4-policy pattern (select/insert/update/delete on `auth.uid() = user_id`) | Every table in this project uses this pattern |
| Score history trend | recharts / visx | Existing `Sparkline.tsx` primitive (Phase 2 Phase hand-rolled SVG polyline) | 160 KB saved; primitive already built |
| Closed-applications default filter | New state management layer | `useState(false)` in `ApplicationsWidget` + soft toggle link | Simple local state suffices |
| Test assertions for ARIA attributes | Custom DOM traversal | `@testing-library/react` `getByRole`, `queryByRole`, `within` | Already installed; handles ARIA semantics |

---

## Common Pitfalls

### Pitfall A: N+1 Supabase Waterfall (Pitfall 3 from PITFALLS.md)

**What goes wrong:** If any widget gets its own `useQuery` hitting Supabase directly, hub mount fires 8+ parallel requests, each going through RLS evaluation. Visual stagger disorients NPF users.

**How to avoid:** Hub-loader is the ONLY Supabase caller for widget data. Widget files replace `const MOCK = {...}` with reads from props/context. The data shape passed to each widget must match what it currently renders — no widget API changes required beyond receiving data instead of constants.

**Warning sign:** Any `import { supabase }` added to a `*Widget.tsx` file in Phase 3.

### Pitfall B: Breaking Existing Deep-Link Hooks

**What goes wrong:** Changing `queryKey` in `useApplications`, `useDocuments`, or `useJobMatching` breaks cache sharing with the deep-link pages those hooks serve.

**Existing query keys (verified):**
- `useApplications`: `['applications', filters, sort]` (main), `['application-stats']` (stats)
- `useDocuments`: `['cv-versions']` (CVs), `['cover-letters']` (letters)
- `useJobMatching`: reads from `cvApi` + `interestApi` — not directly a simple cache key

**How to avoid:** Hub-loader writes to these EXACT existing keys via `queryClient.setQueryData`. Do not change the keys in the existing hooks.

### Pitfall C: personal_brand_audit vs personal_brand_audits Naming Collision

**What goes wrong:** The existing table is `personal_brand_audit` (singular, upsert, from 2026-03-22 migration). The new Phase 3 table is `personal_brand_audits` (plural, append-only). Confusion between these two will cause either data duplication in the wrong table or loss of existing audit answers.

**How to avoid:**
- `personalBrandApi.saveAuditAnswers()` in `cloudStorage.ts` continues writing to `personal_brand_audit` (existing, untouched).
- New `personalBrandAuditsApi.insert()` in `personalBrandAuditsApi.ts` writes to `personal_brand_audits` (new).
- Widget reads from `personal_brand_audits` (new) for score/history.
- `BrandAuditTab.tsx` continues to use the existing API unchanged.

### Pitfall D: Screen Reader Over-Announcement on Layout (Pitfall 17)

**What goes wrong:** If the `aria-live="polite"` region in `JobsokHub.tsx` is inside a component that re-renders on hub data load, it may emit spurious announcements as the component tree stabilizes.

**Verified Phase 2 state:** `JobsokHub.tsx:43` renders `<div role="status" aria-live="polite" className="sr-only">`. This is at the hub page level, outside the `HubGrid.Section` loop. Phase 3 must NOT move this element or wrap it in a conditional that causes remounting.

**How to avoid:** Keep the live region as a stable element in `JobsokHub.tsx`. Only update the `announcement` state string after explicit user action (size change). Do not tie it to data loading state.

### Pitfall E: staleTime Mismatch Between Hub Loader and Deep-Link Hooks

**What goes wrong:** Hub loader sets `staleTime: 60_000`. `useDocuments` has `staleTime: 5 * 60 * 1000` (5 min). If the user edits their CV on the `/cv` page, the hub widget may show stale data for 60 seconds, but the deep-link page re-fetches immediately.

**Acceptable tradeoff:** 60s stale data on the hub widget is acceptable — the hub is a summary view, not the editing surface. Document this in the plan so it is a deliberate decision, not an oversight.

**Not acceptable:** Using `staleTime: 0` on the hub loader (causes re-fetch every hub visit, eliminating cache benefits) or using `staleTime: Infinity` (widget never refreshes even after user edits data).

### Pitfall F: Salary and International Widgets Need Graceful No-Data State

**What goes wrong:** `SalaryWidget` and `InternationalWidget` were designed with mock data. Their data sources (`salary_data`, `international_targets`) do NOT appear to have dedicated tables in the migration files reviewed. If these tables do not exist in the live database, the hub-loader selects will fail.

**Verified:** No `salary_data` or `international_targets` table found in migration scans. `spontaneous_companies` table DOES exist (`20260408150000_spontaneous_companies.sql`).

**Resolution path:** For `SalaryWidget` and `InternationalWidget`, the hub-loader should either:
1. Query the tables conditionally (try-catch within the Promise.all), falling back to `null` data, OR
2. Skip those two tables from the hub-loader in Phase 3 and leave those widgets in their current empty-state mode (valid: both already display meaningful empty states per UI-SPEC)

The second option is simpler and safer for Phase 3 scope. Document this as a Phase 5 item.

---

## Code Examples

### Hub Loader: Promise.all Pattern

```typescript
// Source: CONTEXT.md decision + codebase direct reading
// client/src/hooks/useJobsokHubSummary.ts

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useSupabase } from '@/hooks/useSupabase'

export function useJobsokHubSummary() {
  const { user } = useSupabase()
  const userId = user?.id ?? ''
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: ['hub', 'jobsok', userId],
    enabled: !!userId,
    staleTime: 60_000,
    queryFn: async () => {
      const [cvResult, lettersResult, sessionsResult, appStatsResult, spontaneousResult] =
        await Promise.all([
          supabase.from('cvs').select('id, updated_at, completion_pct').eq('user_id', userId).maybeSingle(),
          supabase.from('cover_letters').select('id, title, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(3),
          supabase.from('interview_sessions').select('score, created_at').eq('user_id', userId).eq('completed', true).not('score', 'is', null).order('created_at', { ascending: false }).limit(8),
          supabase.from('job_applications').select('status').eq('user_id', userId),
          supabase.from('spontaneous_companies').select('id').eq('user_id', userId),
        ])

      // Populate deep-link cache keys — must match EXACT keys in existing hooks
      if (appStatsResult.data) {
        const stats = computeStats(appStatsResult.data)
        queryClient.setQueryData(['application-stats'], stats)
      }
      if (cvResult.data) {
        queryClient.setQueryData(['cv-versions'], [cvResult.data])
      }
      if (lettersResult.data) {
        queryClient.setQueryData(['cover-letters'], lettersResult.data)
      }

      return {
        cv: cvResult.data,
        coverLetters: lettersResult.data ?? [],
        interviewSessions: sessionsResult.data ?? [],
        applicationStats: appStatsResult.data ?? [],
        spontaneousCount: spontaneousResult.data?.length ?? 0,
      }
    },
  })
}
```

### Widget Replacing MOCK with Real Data

```typescript
// Before (Phase 2):
const MOCK = { total: 12, segments: [...] }
export default function ApplicationsWidget(...) {
  // uses MOCK.total, MOCK.segments
}

// After (Phase 3):
export default function ApplicationsWidget({ id, size, onSizeChange, allowedSizes, editMode, data }: WidgetProps & { data?: HubApplicationData }) {
  const { compact, minimal } = useWidgetSize(size)
  const [showClosed, setShowClosed] = useState(false)

  if (!data) {
    // Empty state per UI-SPEC
    return <Widget ...><EmptyState heading="Inga ansökningar ännu" body="Lägg till din första ansökan..." cta="Lägg till ansökan" href="/applications" /></Widget>
  }

  const visibleSegments = showClosed ? data.segments : data.segments.filter(s => !s.deEmphasized)
  // ...render with real data...
}
```

### DATA-01: Saving Score After Interview Session

```typescript
// client/src/services/interviewService.ts — extend existing saveSession flow
// After migration adds score + score_breakdown columns:

async function saveSessionWithScore(sessionId: string, score: number, breakdown: ScoreBreakdown) {
  const { error } = await supabase
    .from('interview_sessions')
    .update({
      score: score,              // NUMERIC(4,1) — e.g. 84.0
      score_breakdown: breakdown, // JSONB — per-question scores + feedback
    })
    .eq('id', sessionId)
    .eq('user_id', user.id)     // RLS guard redundant but explicit
  if (error) throw error
}
```

### DATA-02: Inserting Personal Brand Audit Score

```typescript
// client/src/services/personalBrandAuditsApi.ts (new file)
// Does NOT touch existing personalBrandApi in cloudStorage.ts

export async function insertBrandAudit(score: number, dimensions: Record<string, number>, summary?: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('personal_brand_audits')    // new table (plural)
    .insert({
      user_id: user.id,
      score,                          // NUMERIC(4,1)
      dimensions,                     // JSONB: { online: 80, content: 60, network: 70, consistency: 75 }
      summary,
    })
  if (error) throw error
}
```

### A11Y: Skeleton Loading Pattern (per Phase 2 UI-SPEC)

```typescript
// Widget skeleton while hub-loader is pending
function WidgetSkeleton({ size }: { size: WidgetSize }) {
  return (
    <div className="bg-white border border-[var(--stone-150)] rounded-[12px] p-[14px_16px]">
      <div className="flex gap-2 mb-3">
        <div className="w-[26px] h-[26px] rounded-[7px] bg-stone-200 animate-pulse" />
        <div className="h-[13px] w-24 bg-stone-200 animate-pulse rounded" />
      </div>
      <div className="h-[32px] w-16 bg-stone-200 animate-pulse rounded mb-2" />
      <div className="h-[12px] w-32 bg-stone-200 animate-pulse rounded" />
    </div>
  )
}
```

---

## State of the Art

| Old Approach | Current Approach | Impact for Phase 3 |
|--------------|------------------|-------------------|
| Per-widget `useEffect` + Supabase calls | Hub-level `useQuery` with `Promise.all` | Single RLS evaluation pass; no N+1 |
| `queryClient.setQueryData` as optimization | `queryClient.setQueryData` as cache-sharing contract | Deep-link pages get instant cache-hit |
| motion animation unconditional | `useReducedMotion()` + `--motion-*` tokens at 0.01ms | Pitfall 13 addressed at token level |
| `total_score INTEGER` in `personal_brand_audit` | New `personal_brand_audits` with `NUMERIC(4,1)` | Half-point resolution; append-only history |
| Interview sessions without score column | `interview_sessions` + `score NUMERIC(4,1)` + `score_breakdown JSONB` | Sparkline trend data available per session |

---

## Open Questions

1. **Do `salary_data` and `international_targets` tables exist in the live DB?**
   - What we know: No migrations creating these tables found in the scanned migration files.
   - What's unclear: They may have been created outside the migrations directory, or the data is expected from an external API.
   - Recommendation: Plan 01 EXPLAIN ANALYZE task should also verify table existence. If absent, wire `SalaryWidget` and `InternationalWidget` to their empty states only; leave as Phase 5.

2. **Does `useJobMatching` share a stable query key the hub-loader can populate?**
   - What we know: `useJobMatching` (line 1-11 of file) computes matches client-side from `cvApi` + `interestApi` — it is not a simple Supabase select.
   - What's unclear: Whether `JobSearchWidget` in Phase 3 should use the real job-matching computation or a simpler "saved searches / recent matches" query.
   - Recommendation: Use a lighter query for the widget — `platsbanken_saved_jobs` count — and link to `/job-search` for full matching. The complex matching logic stays on the deep-link page.

3. **Is `BrandAuditTab.tsx` wiring to the new append-only table in Phase 3 or only the widget?**
   - What we know: `BrandAuditTab` currently uses `personalBrandApi.saveAuditAnswers()` writing to `personal_brand_audit` (existing upsert table). Phase 3 CONTEXT says "BrandAuditTab-sidan (originalsidan) gets persistens too — existing localStorage-backup retained as fallback."
   - Recommendation: In Phase 3, add a call to `insertBrandAudit()` at the end of the existing `saveAuditAnswers` flow in `BrandAuditTab.tsx`. This is a one-line addition — does not change the existing upsert logic.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest (client/vitest.config.ts) — jsdom environment |
| Config file | `client/vitest.config.ts` (exists, confirmed) |
| Quick run command | `cd client && npm run test:run -- --reporter=verbose src/hooks/useJobsokHubSummary.test.ts` |
| Full suite command | `cd client && npm run test:run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| HUB-01 (loader) | `useJobsokHubSummary` fires Promise.all, populates hub summary | unit | `npm run test:run -- src/hooks/useJobsokHubSummary.test.ts` | ❌ Wave 0 |
| HUB-01 (cache sync) | After hub-loader resolves, `queryClient.getQueryData(['application-stats'])` is populated | unit | same test file | ❌ Wave 0 |
| HUB-01 (widget data) | `ApplicationsWidget` renders real total from hub summary (not MOCK) | unit | `npm run test:run -- src/components/widgets/ApplicationsWidget.test.tsx` | ❌ Wave 0 |
| HUB-01 (CV widget) | `CvWidget` renders milestone label from real completion_pct | unit | `npm run test:run -- src/components/widgets/CvWidget.test.tsx` | ❌ Wave 0 |
| HUB-01 (interview widget) | `InterviewWidget` renders real score from hub summary | unit | `npm run test:run -- src/components/widgets/InterviewWidget.test.tsx` | ❌ Wave 0 |
| DATA-01 (migration) | `interview_sessions.score` column exists with correct type | manual SQL | `npx supabase db query --linked "SELECT column_name, data_type FROM information_schema.columns WHERE table_name='interview_sessions' AND column_name='score';" --output table` | N/A (manual) |
| DATA-01 (RLS) | Authenticated user can UPDATE score on own session, cannot on other user's | manual SQL | `npx supabase db query --linked "EXPLAIN SELECT * FROM interview_sessions WHERE user_id = auth.uid();" --output table` | N/A (manual) |
| DATA-01 (persistence) | `saveSessionWithScore()` inserts score; subsequent query returns it | unit | `npm run test:run -- src/services/interviewService.test.ts` | ❌ Wave 0 |
| DATA-02 (migration) | `personal_brand_audits` table exists with correct schema | manual SQL | `npx supabase db query --linked "SELECT column_name, data_type FROM information_schema.columns WHERE table_name='personal_brand_audits';" --output table` | N/A (manual) |
| DATA-02 (RLS) | Authenticated user can INSERT and SELECT own audits | manual SQL | `npx supabase db query --linked "EXPLAIN SELECT * FROM personal_brand_audits WHERE user_id = auth.uid();" --output table` | N/A (manual) |
| DATA-02 (persistence) | `insertBrandAudit()` inserts row; widget sees latest score | unit | `npm run test:run -- src/services/personalBrandAuditsApi.test.ts` | ❌ Wave 0 |
| A11Y-01 (keyboard) | All widget size toggles reachable via Tab; pressing Enter changes size | unit | `npm run test:run -- src/pages/hubs/__tests__/JobsokHub.test.tsx` (extend existing 10 tests) | ✅ exists |
| A11Y-01 (screen reader) | Single `aria-live="polite"` announcement on size change, not 7 | unit | same JobsokHub.test.tsx | ✅ exists (test already verifies announcement text) |
| A11Y-02 (reduced motion) | Framer Motion animations do not fire when `prefers-reduced-motion: reduce` | unit | `npm run test:run -- src/components/widgets/__tests__/reduced-motion.test.tsx` | ❌ Wave 0 |
| A11Y-03 (no raw %) | No widget renders a number followed by "%" as primary KPI text | unit | `npm run test:run -- src/components/widgets/__tests__/anti-shaming.test.tsx` | ❌ Wave 0 |
| A11Y-04 (closed hidden) | `ApplicationsWidget` with real data hides closed segment by default; toggle shows them | unit | `npm run test:run -- src/components/widgets/ApplicationsWidget.test.tsx` | ❌ Wave 0 |
| A11Y-05 (empathy sign-off) | `.planning/phases/03-data-wiring-wcag/03-EMPATHY-REVIEW.md` exists with both agent verdicts and commit SHA | manual file check | Readable by `gsd-verifier` as part of Phase gate | ❌ Wave 0 (artefact) |

### Sampling Rate

- **Per task commit:** `cd client && npm run test:run -- src/hooks/useJobsokHubSummary.test.ts src/components/widgets/ApplicationsWidget.test.tsx` (data-layer subset)
- **Per wave merge:** `cd client && npm run test:run` (full suite)
- **Phase gate:** Full suite green + manual migration verification SQL passes + `03-EMPATHY-REVIEW.md` signed off by both agents

### Wave 0 Gaps

The following test files and artifacts must be created before or as part of Plan 01:

- [ ] `client/src/hooks/useJobsokHubSummary.test.ts` — covers HUB-01 loader + cache-sync behavior
- [ ] `client/src/components/widgets/ApplicationsWidget.test.tsx` — covers HUB-01 widget data + A11Y-04 closed-filter
- [ ] `client/src/components/widgets/CvWidget.test.tsx` — covers HUB-01 CV milestone rendering
- [ ] `client/src/components/widgets/InterviewWidget.test.tsx` — covers HUB-01 score rendering + DATA-01 persistence
- [ ] `client/src/services/interviewService.test.ts` — covers DATA-01 persistence
- [ ] `client/src/services/personalBrandAuditsApi.test.ts` — covers DATA-02 persistence
- [ ] `client/src/components/widgets/__tests__/reduced-motion.test.tsx` — covers A11Y-02
- [ ] `client/src/components/widgets/__tests__/anti-shaming.test.tsx` — covers A11Y-03 (assert no "%" string as primary KPI)
- [ ] `.planning/phases/03-data-wiring-wcag/03-EMPATHY-REVIEW.md` — A11Y-05 sign-off artifact

**Existing tests that extend (not replace):**
- `client/src/pages/hubs/__tests__/JobsokHub.test.tsx` — already 10 tests; add keyboard-navigation assertions for A11Y-01

**Supabase mock setup:** `client/src/test/setup.ts` already has `createMockSupabaseClient()` with chainable `.from().select()...` mock. New tests should use this helper and extend its `.from()` mock to return fixture data for `cvs`, `cover_letters`, `interview_sessions`, `job_applications`, `spontaneous_companies`.

---

## Sources

### Primary (HIGH confidence — direct code reading)

- `client/src/main.tsx:64-76` — QueryClient config (staleTime 5min, gcTime 10min, retry 1, refetchOnWindowFocus false)
- `client/src/hooks/useApplications.ts` — QUERY_KEYS verified: `['applications', filters, sort]`, `['application-stats']`
- `client/src/hooks/useDocuments.ts` — QUERY_KEYS verified: `['cv-versions']`, `['cover-letters']`
- `client/src/hooks/useJobMatching.ts` — confirmed client-side computation from cvApi + interestApi (no simple Supabase select key)
- `client/src/components/widgets/registry.ts` — all 8 widgets confirmed lazy() pattern
- `client/src/pages/hubs/JobsokHub.tsx` — Phase 2 hub page structure, `aria-live` region at line 43
- `client/src/components/widgets/CvWidget.tsx` — MOCK_CV block identified; `milestoneLabel()` function already correct
- `client/src/components/widgets/ApplicationsWidget.tsx` — MOCK block + StackedBar + `deEmphasized: true` on avslutade
- `client/src/components/widgets/InterviewWidget.tsx` — MOCK block with score + Sparkline trend
- `client/src/components/widgets/JobSearchWidget.tsx` — MOCK block; qualitative labels already enforced via TypeScript union
- `client/src/components/widgets/SpontaneousWidget.tsx`, `SalaryWidget.tsx`, `InternationalWidget.tsx` — MOCK blocks reviewed
- `supabase/migrations/20260227130000_add_new_features.sql` — `interview_sessions` schema confirmed; columns: id, mock_interview_id, user_id, start_time, end_time, answers, completed, created_at
- `supabase/migrations/20260322183304_personal_brand_tables.sql` — `personal_brand_audit` table confirmed (existing, upsert, `total_score INTEGER`)
- `supabase/migrations/20260408150000_spontaneous_companies.sql` — `spontaneous_companies` table exists
- `client/src/styles/tokens.css:129-134` — `prefers-reduced-motion` sets `--motion-*` to 0.01ms
- `client/src/test/setup.ts` — `createMockSupabaseClient()` helper available for tests
- `client/vitest.config.ts` — jsdom environment, `@testing-library/jest-dom`, coverage config

### Secondary (MEDIUM confidence — planning document reading)

- `.planning/phases/03-data-wiring-wcag/03-CONTEXT.md` — locked decisions
- `.planning/phases/02-static-widget-grid/02-VERIFICATION.md` — Phase 2 delivered 27 tests across 4 files, all passing
- `.planning/phases/02-static-widget-grid/02-UI-SPEC.md` — copywriting contract, empty state copy, accessibility contract
- `.planning/research/PITFALLS.md` — Pitfalls 3, 4, 9, 11, 13, 17, 18 directly apply

### Tertiary (LOW confidence — requires validation)

- Salary and international tables: not found in migration files; may exist live or may need Wave 0 plan to determine
- `useJobMatching` query key for cache-sharing: computation is client-side, not a cacheable Supabase key — LOW confidence that hub-loader can pre-populate this

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new packages; all libraries verified installed
- Hub-loader architecture: HIGH — grounded in verified React Query patterns + existing hook key inspection
- Schema migrations: HIGH — existing tables verified line-by-line in migration files
- WCAG implementation: HIGH — tokens.css, Phase 2 aria contract, and existing live-region all verified
- Salary/International data sources: LOW — tables not found in migrations; requires Plan 01 verification

**Research date:** 2026-04-28
**Valid until:** 2026-05-28 (stable stack; Phase 3 should begin immediately)
