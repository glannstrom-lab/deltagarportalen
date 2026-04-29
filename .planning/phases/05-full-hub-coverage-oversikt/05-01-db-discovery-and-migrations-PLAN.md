---
phase: 05-full-hub-coverage-oversikt
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - supabase/migrations/20260429_phase5_onboarded_hubs.sql
  - supabase/migrations/20260429_phase5_linkedin_url.sql
  - .planning/phases/05-full-hub-coverage-oversikt/05-DB-DISCOVERY.md
  - client/src/components/widgets/HiddenWidgetsPanel.tsx
  - client/src/components/widgets/HiddenWidgetsPanel.test.tsx
  - client/src/pages/hubs/JobsokHub.tsx
autonomous: true
requirements: [HUB-02, HUB-03, HUB-04, HUB-05]
must_haves:
  truths:
    - "Live DB introspection results documented in 05-DB-DISCOVERY.md for: profiles columns (career_goals, linkedin_url, onboarded_hubs), skills_analyses, personal_brand_audits, network_contacts, diary_entries, mood_logs, calendar_events, consultant_participants, ai_team_sessions, article_reading_progress, exercises*, exercise_progress*"
    - "profiles.onboarded_hubs TEXT[] DEFAULT '{}' exists in live DB after migration applied"
    - "profiles.linkedin_url TEXT exists in live DB (verified existing OR added via additive migration)"
    - "HiddenWidgetsPanel is hub-agnostic — accepts layout/onShowWidget/onResetLayout as props (no useJobsokLayout import)"
    - "JobsokHub.tsx still works after HiddenWidgetsPanel refactor — all 24 JobsokHub.test.tsx tests green"
    - "All migrations are idempotent (ADD COLUMN IF NOT EXISTS, CREATE TABLE IF NOT EXISTS) — re-running causes zero schema changes"
  artifacts:
    - path: "supabase/migrations/20260429_phase5_onboarded_hubs.sql"
      provides: "Idempotent ALTER TABLE adding profiles.onboarded_hubs TEXT[]"
      contains: "ADD COLUMN IF NOT EXISTS onboarded_hubs"
    - path: ".planning/phases/05-full-hub-coverage-oversikt/05-DB-DISCOVERY.md"
      provides: "Source of truth for which tables/columns Plan 02-05 hub-loaders may select from"
      contains: "## profiles"
    - path: "client/src/components/widgets/HiddenWidgetsPanel.tsx"
      provides: "Hub-agnostic panel — props-based API consumable by all 5 hub pages"
      exports: ["HiddenWidgetsPanel"]
  key_links:
    - from: "client/src/components/widgets/HiddenWidgetsPanel.tsx"
      to: "props (no context)"
      via: "interface HiddenWidgetsPanelProps with layout/onShowWidget/onResetLayout"
      pattern: "layout:\\s*WidgetLayoutItem\\[\\]"
    - from: "client/src/pages/hubs/JobsokHub.tsx"
      to: "client/src/components/widgets/HiddenWidgetsPanel.tsx"
      via: "passes layout/showWidget/resetLayout as props"
      pattern: "<HiddenWidgetsPanel[\\s\\S]*?layout=\\{"
    - from: "supabase/migrations/20260429_phase5_onboarded_hubs.sql"
      to: "live DB profiles table"
      via: "manual apply via npx supabase db query --linked -f"
      pattern: "ADD COLUMN IF NOT EXISTS onboarded_hubs"
---

<objective>
Establish the foundation for Phase 5: (1) verify live-DB schema for every table the next four plans will read from, recording results in `05-DB-DISCOVERY.md`; (2) ship two additive idempotent migrations (`profiles.onboarded_hubs` for Översikt onboarding detection, and `profiles.linkedin_url` if missing); (3) refactor `HiddenWidgetsPanel` from JobsokLayout-locked to props-based so Plans 02-05 can reuse it across Karriär/Resurser/Min Vardag/Översikt without context-namespace conflicts.

Purpose: Plan 02 cannot start until (a) we know which exact tables/columns each hub-loader can SELECT, (b) `onboarded_hubs` exists for Översikt detection, and (c) `HiddenWidgetsPanel` is unhooked from `useJobsokLayout` (per RESEARCH.md Pitfall A — calling `useJobsokLayout` inside KarriarHub will throw).

Output: `05-DB-DISCOVERY.md` artifact, two SQL migrations applied to live DB, `HiddenWidgetsPanel` props-based, `JobsokHub.tsx` updated to pass props, all 24 existing `JobsokHub.test.tsx` tests still green.
</objective>

<execution_context>
@C:/Users/Mikael/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/Mikael/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@CLAUDE.md
@.planning/STATE.md
@.planning/ROADMAP.md
@.planning/REQUIREMENTS.md
@.planning/phases/05-full-hub-coverage-oversikt/05-CONTEXT.md
@.planning/phases/05-full-hub-coverage-oversikt/05-RESEARCH.md
@.planning/phases/05-full-hub-coverage-oversikt/05-VALIDATION.md
@.planning/phases/04-layout-persistence-hide-show/04-04-jobsokhub-wiring-and-integration-tests-SUMMARY.md
@client/src/components/widgets/HiddenWidgetsPanel.tsx
@client/src/components/widgets/HiddenWidgetsPanel.test.tsx
@client/src/components/widgets/JobsokLayoutContext.tsx
@client/src/pages/hubs/JobsokHub.tsx
@client/src/components/widgets/types.ts

<interfaces>
<!-- Existing exports from JobsokLayoutContext.tsx (Plan 01 does NOT modify these): -->
```typescript
export interface JobsokLayoutValue {
  layout: WidgetLayoutItem[]
  editMode: boolean
  setEditMode: (next: boolean) => void
  hideWidget: (id: string) => void
  showWidget: (id: string) => void
  updateSize: (id: string, size: WidgetSize) => void
  resetLayout: () => void
  isLoading: boolean
}
export function useJobsokLayout(): JobsokLayoutValue
export function selectHiddenWidgets(layout: WidgetLayoutItem[]): WidgetLayoutItem[]
```

<!-- Existing CURRENT HiddenWidgetsPanel signature (Plan 01 REPLACES this): -->
```typescript
// CURRENT — hub-locked (DO NOT keep this shape):
interface HiddenWidgetsPanelProps {
  isOpen: boolean
  onClose: () => void
}
// Internally calls useJobsokLayout() + selectHiddenWidgets(layout) — both must go.
```

<!-- TARGET HiddenWidgetsPanel signature for Plan 01 (props-based, hub-agnostic): -->
```typescript
import type { WidgetLayoutItem } from './types'
interface HiddenWidgetsPanelProps {
  isOpen: boolean
  onClose: () => void
  layout: WidgetLayoutItem[]
  onShowWidget: (id: string) => void
  onResetLayout: () => void
}
// Internal logic: const hidden = layout.filter(item => item.visible === false)
// (replaces selectHiddenWidgets(layout) call — same behavior, no import needed)
// Replace `showWidget(item.id)` calls with `onShowWidget(item.id)`.
// Replace `resetLayout()` call with `onResetLayout()`.
```

<!-- HiddenWidgetsPanel.test.tsx is CURRENTLY structured around useJobsokLayout. -->
<!-- Plan 01 must rewrite the test to render <HiddenWidgetsPanel layout={fixture} onShowWidget={vi.fn()} onResetLayout={vi.fn()} ...> directly — no provider needed for the panel test. -->

<!-- JobsokHub.tsx CURRENT call site (line ~141-144, see file): -->
```tsx
<HiddenWidgetsPanel isOpen={panelOpen} onClose={() => setPanelOpen(false)} />
```
<!-- TARGET call site for Plan 01 (passes layout + mutator props): -->
```tsx
<HiddenWidgetsPanel
  isOpen={panelOpen}
  onClose={() => setPanelOpen(false)}
  layout={effectiveLayout}
  onShowWidget={showWidget}
  onResetLayout={resetLayout}
/>
```

<!-- Migration filename convention: YYYYMMDD_phase5_*.sql (matches 20260429_user_widget_layouts.sql etc.) -->
<!-- INVIOLABLE per CLAUDE.md: never `npx supabase db push`; always `npx supabase db query --linked -f`. -->
<!-- INVIOLABLE per CONTEXT.md: only ADD COLUMN IF NOT EXISTS / CREATE TABLE IF NOT EXISTS — no DROP, no destructive ALTER. -->
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Live DB introspection — write 05-DB-DISCOVERY.md</name>
  <read_first>
    - .planning/phases/05-full-hub-coverage-oversikt/05-RESEARCH.md (DB-Discovery Checklist section near end — 8 SQL queries)
    - CLAUDE.md §"Supabase-migrationer" (db query --linked syntax)
  </read_first>
  <files>.planning/phases/05-full-hub-coverage-oversikt/05-DB-DISCOVERY.md</files>
  <action>
    Run live-DB introspection against the linked Supabase project to confirm the exact schema each Plan 02-05 hub-loader will SELECT from. Use `npx supabase db query --linked "SQL" --output json` for each query and capture the results. Discovery results drive Plan 02-05 hub-loader queries — guesses are forbidden.

    Run these 12 SQL queries (one per `db query --linked` invocation) and record the result rows in 05-DB-DISCOVERY.md:

    1. Profile columns (verifies career_goals JSONB, linkedin_url existence, onboarded_hubs absence):
       `SELECT column_name, data_type, column_default FROM information_schema.columns WHERE table_name = 'profiles' AND column_name IN ('career_goals', 'linkedin_url', 'onboarded_hubs') ORDER BY column_name;`

    2. skills_analyses schema:
       `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'skills_analyses' ORDER BY ordinal_position;`

    3. personal_brand_audits (PLURAL — Phase 3 table) schema:
       `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'personal_brand_audits' ORDER BY ordinal_position;`

    4. network_contacts schema (CONTEXT.md notes 'already exists' — verify columns):
       `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'network_contacts' ORDER BY ordinal_position;`

    5. diary_entries schema:
       `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'diary_entries' ORDER BY ordinal_position;`

    6. mood_logs schema:
       `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'mood_logs' ORDER BY ordinal_position;`

    7. calendar_events schema:
       `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'calendar_events' ORDER BY ordinal_position;`

    8. consultant_participants schema (resolve consultant_id vs participant_id ambiguity):
       `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'consultant_participants' ORDER BY ordinal_position;`

    9. ai_team_sessions schema:
       `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'ai_team_sessions' ORDER BY ordinal_position;`

    10. article_reading_progress schema:
        `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'article_reading_progress' ORDER BY ordinal_position;`

    11. Exercises tables (Pitfall G — verify if any progress table exists):
        `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name ILIKE '%exercise%' ORDER BY table_name;`

    12. Career-goal-related tables (verify reuse of profiles.career_goals JSONB vs. career_plans):
        `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND (table_name ILIKE '%career%' OR table_name ILIKE '%goal%') ORDER BY table_name;`

    Write the results to `.planning/phases/05-full-hub-coverage-oversikt/05-DB-DISCOVERY.md` with this structure:

    ```markdown
    # Phase 5 — Live DB Discovery

    **Run:** {ISO date}
    **Project:** linked Supabase project (deltagarportalen)
    **Purpose:** Source of truth for Plan 02-05 hub-loader SELECT queries.

    ## profiles
    | column | type | default |
    |--------|------|---------|
    | career_goals | jsonb | ... |
    | linkedin_url | {present? type?} | ... |
    | onboarded_hubs | {NOT YET — added in Task 2} | — |

    ## skills_analyses
    | column | type |
    | ... | ... |

    ... (one section per table from queries 2-10)

    ## Exercises tables (query 11)
    {list of matching table names, or "no exercise progress table — Övningar widget will be static-content per RESEARCH.md Pitfall G"}

    ## Career tables (query 12)
    {list of matching tables}

    ## Plan-loader implications

    - Karriär hub-loader: {locked SELECT shapes for the 3 tables}
    - Resurser hub-loader: {locked SELECT shapes — note any static-content widgets}
    - Min Vardag hub-loader: {locked SELECT shapes — note consultant_participants exact column name}
    - Översikt hub-loader: {note that profiles.onboarded_hubs is added in Task 2}
    ```

    Concrete SELECT shapes recorded here are referenced by Plans 02-05's hub-loader tasks. Plans 02-05 do NOT re-run discovery — they consume this file.

    Per CLAUDE.md, use `--output json` (table is also acceptable for human review). If Powershell quoting breaks the inline SQL, use `db query --linked -f` with a tmp .sql file (clean up after).
  </action>
  <verify>
    <automated>test -f .planning/phases/05-full-hub-coverage-oversikt/05-DB-DISCOVERY.md && grep -E '^## (profiles|skills_analyses|personal_brand_audits|network_contacts|diary_entries|mood_logs|calendar_events|consultant_participants|ai_team_sessions|article_reading_progress)' .planning/phases/05-full-hub-coverage-oversikt/05-DB-DISCOVERY.md | wc -l | grep -E '^\s*1[0-9]\s*$'</automated>
  </verify>
  <done>
    - `05-DB-DISCOVERY.md` exists, has at least 10 `## {table}` sections (queries 1-10), plus exercises/career sections from queries 11-12
    - Each table section has a markdown table with `column | type` rows from live DB
    - Plan-loader implications section names every hub and the SELECT shape it will use
    - linkedin_url status (present or absent) is unambiguous in profiles section
  </done>
</task>

<task type="auto">
  <name>Task 2: Idempotent migrations — onboarded_hubs (always) + linkedin_url (if missing)</name>
  <read_first>
    - .planning/phases/05-full-hub-coverage-oversikt/05-DB-DISCOVERY.md (Task 1 output — read profiles section to determine linkedin_url status)
    - supabase/migrations/20260429_user_widget_layouts.sql (idempotent migration template)
    - CLAUDE.md §"Supabase-migrationer" (apply with `db query --linked -f`)
  </read_first>
  <files>supabase/migrations/20260429_phase5_onboarded_hubs.sql, supabase/migrations/20260429_phase5_linkedin_url.sql</files>
  <action>
    Create and apply additive idempotent migrations. Two files (linkedin_url file is optional based on Task 1 result).

    **File 1 (always create + apply): `supabase/migrations/20260429_phase5_onboarded_hubs.sql`**

    ```sql
    -- Phase 5 Plan 01 — additive: profiles.onboarded_hubs for Översikt onboarding detection.
    -- Idempotent: safe to re-run. INVIOLABLE per CONTEXT.md: ADD COLUMN IF NOT EXISTS only.
    -- Apply: npx supabase db query --linked -f supabase/migrations/20260429_phase5_onboarded_hubs.sql

    ALTER TABLE profiles
      ADD COLUMN IF NOT EXISTS onboarded_hubs TEXT[] DEFAULT '{}';

    COMMENT ON COLUMN profiles.onboarded_hubs IS
      'Hub IDs the user has visited at least once. Used by Översikt for onboarding detection. Appended by hub-page mount effect. Values: jobb, karriar, resurser, min-vardag, oversikt.';
    ```

    **File 2 (create + apply ONLY IF Task 1 confirms linkedin_url is absent): `supabase/migrations/20260429_phase5_linkedin_url.sql`**

    ```sql
    -- Phase 5 Plan 01 — additive: profiles.linkedin_url. Idempotent.
    -- Apply: npx supabase db query --linked -f supabase/migrations/20260429_phase5_linkedin_url.sql

    ALTER TABLE profiles
      ADD COLUMN IF NOT EXISTS linkedin_url TEXT;

    COMMENT ON COLUMN profiles.linkedin_url IS
      'User-supplied LinkedIn profile URL. Read by Karriär LinkedIn widget and applicationsApi.';
    ```

    If Task 1's discovery shows linkedin_url already exists (data_type = 'text'): skip File 2 entirely. Document in 05-DB-DISCOVERY.md "Plan-loader implications" that no linkedin_url migration was needed.

    Apply each file:
    - `npx supabase db query --linked -f supabase/migrations/20260429_phase5_onboarded_hubs.sql`
    - (only if needed) `npx supabase db query --linked -f supabase/migrations/20260429_phase5_linkedin_url.sql`

    Verify each column landed:
    - `npx supabase db query --linked "SELECT column_name, data_type, column_default FROM information_schema.columns WHERE table_name = 'profiles' AND column_name IN ('onboarded_hubs', 'linkedin_url');" --output table`

    Update 05-DB-DISCOVERY.md profiles section to reflect post-migration state (onboarded_hubs now PRESENT, linkedin_url confirmed PRESENT).

    DO NOT use `npx supabase db push` — explicitly forbidden (CLAUDE.md). Each migration applied individually via `db query --linked -f`.
  </action>
  <verify>
    <automated>test -f supabase/migrations/20260429_phase5_onboarded_hubs.sql && grep -q 'ADD COLUMN IF NOT EXISTS onboarded_hubs' supabase/migrations/20260429_phase5_onboarded_hubs.sql && ! grep -iE '(DROP|ALTER COLUMN.*TYPE|db push)' supabase/migrations/20260429_phase5_*.sql</automated>
  </verify>
  <done>
    - `20260429_phase5_onboarded_hubs.sql` exists with ADD COLUMN IF NOT EXISTS (verified via grep)
    - Migration files contain ZERO destructive keywords (DROP, ALTER COLUMN ... TYPE, db push)
    - `db query --linked -f ... onboarded_hubs.sql` executed successfully against live DB
    - Post-migration verification SELECT confirms profiles.onboarded_hubs returns `data_type = ARRAY` (or `text[]`) with `column_default = '{}'::text[]`
    - linkedin_url either was already present (no file 2 needed) OR file 2 applied and post-migration verification confirms it
    - 05-DB-DISCOVERY.md profiles section reflects post-migration state
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 3: Refactor HiddenWidgetsPanel to props-based + update JobsokHub call site</name>
  <read_first>
    - client/src/components/widgets/HiddenWidgetsPanel.tsx (current implementation, lines 1-135)
    - client/src/components/widgets/HiddenWidgetsPanel.test.tsx (current tests — must be rewritten for props-based)
    - client/src/components/widgets/JobsokLayoutContext.tsx (do NOT modify — `useJobsokLayout` and `selectHiddenWidgets` stay)
    - client/src/pages/hubs/JobsokHub.tsx (lines 138-145 — call site that needs updating)
    - .planning/phases/05-full-hub-coverage-oversikt/05-RESEARCH.md §"HiddenWidgetsPanel (hub-agnostisk refaktorering)" (target shape) and §"Pitfall A"
  </read_first>
  <behavior>
    - Test 1: HiddenWidgetsPanel renders with `layout=[]` + `isOpen=true` and shows "Inga dolda widgets" + Återställ-button (no provider needed)
    - Test 2: With `layout=[{id:'cv',visible:false,size:'M',order:0}]`, panel renders one Återvisa button labelled "Återvisa widget Mitt CV"
    - Test 3: Clicking Återvisa button calls `onShowWidget('cv')` exactly once
    - Test 4: Clicking Återställ standardlayout, confirming dialog, calls `onResetLayout()` exactly once and `onClose()` exactly once
    - Test 5: Pressing Escape calls `onClose()` exactly once when isOpen=true
    - Test 6: HiddenWidgetsPanel.tsx does NOT import `useJobsokLayout` or `selectHiddenWidgets` (grep guard)
  </behavior>
  <files>client/src/components/widgets/HiddenWidgetsPanel.tsx, client/src/components/widgets/HiddenWidgetsPanel.test.tsx, client/src/pages/hubs/JobsokHub.tsx</files>
  <action>
    Rewrite `HiddenWidgetsPanel` to props-based and update its single existing consumer (JobsokHub) so the panel becomes hub-agnostic. Plans 02-05 will then pass their own hub-specific layout + mutators.

    **Step A — rewrite `client/src/components/widgets/HiddenWidgetsPanel.tsx`:**

    Replace the import block:
    ```typescript
    // REMOVE these two imports:
    // import { useJobsokLayout, selectHiddenWidgets } from './JobsokLayoutContext'
    // (selectHiddenWidgets is replaced by inline filter — no import needed)

    // KEEP existing imports for useEffect, useRef, lucide icons, useConfirmDialog, WIDGET_LABELS, WidgetId
    // ADD:
    import type { WidgetLayoutItem } from './types'
    ```

    Replace the props interface:
    ```typescript
    interface HiddenWidgetsPanelProps {
      isOpen: boolean
      onClose: () => void
      layout: WidgetLayoutItem[]
      onShowWidget: (id: string) => void
      onResetLayout: () => void
    }
    ```

    Replace the function body's first lines (was: `const { layout, showWidget, resetLayout } = useJobsokLayout(); const hidden = selectHiddenWidgets(layout)`):
    ```typescript
    export function HiddenWidgetsPanel({
      isOpen, onClose, layout, onShowWidget, onResetLayout,
    }: HiddenWidgetsPanelProps) {
      const { confirm } = useConfirmDialog()
      const containerRef = useRef<HTMLDivElement | null>(null)
      const hidden = layout.filter(item => item.visible === false)
      // ... rest of body unchanged EXCEPT:
      //   - showWidget(item.id) -> onShowWidget(item.id)
      //   - resetLayout() -> onResetLayout()
    }
    ```

    Update both call sites in the JSX (Återvisa button onClick + handleReset's resetLayout call) to use the prop callbacks.

    **Step B — rewrite `client/src/components/widgets/HiddenWidgetsPanel.test.tsx` (TDD):**

    The current test wraps in `JobsokLayoutProvider`. New test renders the component directly with a fixture layout:

    ```typescript
    import { describe, it, expect, vi, beforeEach } from 'vitest'
    import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
    import userEvent from '@testing-library/user-event'
    import { ConfirmDialogProvider } from '@/components/ui/ConfirmDialog'
    import { HiddenWidgetsPanel } from './HiddenWidgetsPanel'
    import type { WidgetLayoutItem } from './types'

    function renderPanel(props: Partial<React.ComponentProps<typeof HiddenWidgetsPanel>> = {}) {
      const onClose = vi.fn()
      const onShowWidget = vi.fn()
      const onResetLayout = vi.fn()
      const result = render(
        <ConfirmDialogProvider>
          <HiddenWidgetsPanel
            isOpen={true}
            onClose={onClose}
            layout={props.layout ?? []}
            onShowWidget={onShowWidget}
            onResetLayout={onResetLayout}
            {...props}
          />
        </ConfirmDialogProvider>
      )
      return { ...result, onClose, onShowWidget, onResetLayout }
    }

    // Tests cover behaviors 1-6 from the <behavior> block above
    ```

    For Test 4 (reset confirm flow), use `userEvent.click` on the Återställ button, then `await screen.findByRole('button', { name: /Återställ/ })` (the ConfirmDialog button) and click it; assert `onResetLayout` and `onClose` were called.

    Test 5 (Escape) uses `fireEvent.keyDown(document, { key: 'Escape' })`.

    Test 6 (import guard) reads the panel file via fs.readFileSync at test time and asserts the source string does NOT contain `useJobsokLayout` or `selectHiddenWidgets`. Use `path.join(__dirname, 'HiddenWidgetsPanel.tsx')`.

    **Step C — update `client/src/pages/hubs/JobsokHub.tsx`:**

    Update the panel render block (around lines 140-145) to pass the new props:
    ```tsx
    <HiddenWidgetsPanel
      isOpen={panelOpen}
      onClose={() => setPanelOpen(false)}
      layout={effectiveLayout}
      onShowWidget={showWidget}
      onResetLayout={resetLayout}
    />
    ```

    No other JobsokHub.tsx changes. JobsokLayoutContext.tsx is NOT modified (selectHiddenWidgets stays exported for any future consumers — it just is no longer used by HiddenWidgetsPanel).

    **Verification:**
    - `cd client && npm run test:run -- src/components/widgets/HiddenWidgetsPanel.test.tsx` — 6 new tests green
    - `cd client && npm run test:run -- src/pages/hubs/__tests__/JobsokHub.test.tsx` — all 24 tests still green (Phase 4 regression suite)
    - `cd client && npx tsc --noEmit` — zero TS errors
  </action>
  <verify>
    <automated>cd client && npm run test:run -- src/components/widgets/HiddenWidgetsPanel.test.tsx src/pages/hubs/__tests__/JobsokHub.test.tsx --reporter=dot 2>&1 | tail -5</automated>
  </verify>
  <done>
    - `HiddenWidgetsPanel.tsx` does not import `useJobsokLayout` or `selectHiddenWidgets` (grep returns 0 hits)
    - `HiddenWidgetsPanel.tsx` accepts `layout`, `onShowWidget`, `onResetLayout` props (TypeScript signature updated)
    - `HiddenWidgetsPanel.test.tsx` has 6 tests covering behaviors 1-6, all passing
    - `JobsokHub.test.tsx` 24 tests all passing (Phase 4 regression — no behavior change visible from outside)
    - `npx tsc --noEmit` reports zero errors
  </done>
</task>

</tasks>

<verification>
- `npm run test:run -- src/components/widgets/HiddenWidgetsPanel.test.tsx src/pages/hubs/__tests__/JobsokHub.test.tsx` — green
- `grep -E '(useJobsokLayout|selectHiddenWidgets)' client/src/components/widgets/HiddenWidgetsPanel.tsx` — 0 matches
- `grep -E '(DROP|ALTER COLUMN.*TYPE)' supabase/migrations/20260429_phase5_*.sql` — 0 matches
- `npx supabase db query --linked "SELECT column_name FROM information_schema.columns WHERE table_name='profiles' AND column_name='onboarded_hubs';"` — returns one row
- `wc -l .planning/phases/05-full-hub-coverage-oversikt/05-DB-DISCOVERY.md` — > 30 lines
</verification>

<success_criteria>
- 05-DB-DISCOVERY.md provides locked SELECT shapes for every table Plan 02-05 will read from
- profiles.onboarded_hubs and profiles.linkedin_url confirmed present in live DB
- HiddenWidgetsPanel is hub-agnostic — Plans 02-05 can pass their own hub-specific layout + mutators without context-namespace conflicts
- All Phase 4 regression tests still green (zero behavior change for JobsokHub end users)
- Migrations are additive only (no DROP/ALTER COLUMN) and idempotent (re-runnable)
</success_criteria>

<output>
After completion, create `.planning/phases/05-full-hub-coverage-oversikt/05-01-db-discovery-and-migrations-SUMMARY.md` summarizing: (a) DB-discovery results (key facts Plan 02-05 must know), (b) migrations applied + verification SQL output, (c) HiddenWidgetsPanel before/after import diff, (d) JobsokHub.test.tsx test count before/after (must match).
</output>
