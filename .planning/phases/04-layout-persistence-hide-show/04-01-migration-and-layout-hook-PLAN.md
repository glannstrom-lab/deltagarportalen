---
phase: 04-layout-persistence-hide-show
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - supabase/migrations/20260429_user_widget_layouts.sql
  - client/src/components/widgets/types.ts
  - client/src/components/widgets/defaultLayouts.ts
  - client/src/components/widgets/mergeLayouts.ts
  - client/src/components/widgets/mergeLayouts.test.ts
  - client/src/hooks/useBreakpoint.ts
  - client/src/hooks/useWidgetLayout.ts
  - client/src/hooks/useWidgetLayout.test.ts
autonomous: true
requirements:
  - CUST-03
must_haves:
  truths:
    - "Migration creates user_widget_layouts table with unique key (user_id, hub_id, breakpoint)"
    - "Four RLS policies (select/insert/update/delete) enforce auth.uid() = user_id"
    - "useWidgetLayout(hubId) returns persisted layout merged with default; staleTime: Infinity"
    - "Mutation upserts on (user_id, hub_id, breakpoint); onMutate snapshots; onError rolls back; debounce 1000ms"
    - "mergeLayouts appends widgets in default but not persisted; removes widgets not in WIDGET_REGISTRY"
    - "useBreakpoint returns stable 'desktop' | 'mobile' matching the 900px HubGrid breakpoint"
  artifacts:
    - path: "supabase/migrations/20260429_user_widget_layouts.sql"
      provides: "Idempotent CREATE TABLE + 4 idempotent RLS policies + updated_at trigger"
      contains: "CREATE TABLE IF NOT EXISTS user_widget_layouts"
    - path: "client/src/hooks/useWidgetLayout.ts"
      provides: "React Query hook with optimistic update + rollback + 1000ms debounce + beforeunload flush"
      exports: ["useWidgetLayout", "USER_WIDGET_LAYOUTS_KEY"]
    - path: "client/src/components/widgets/mergeLayouts.ts"
      provides: "Pure reconciliation function (Pitfall 7)"
      exports: ["mergeLayouts"]
    - path: "client/src/hooks/useBreakpoint.ts"
      provides: "Stable 'desktop' | 'mobile' keyed off matchMedia(min-width: 900px)"
      exports: ["useBreakpoint"]
    - path: "client/src/components/widgets/defaultLayouts.ts"
      provides: "getDefaultLayout(hubId, breakpoint) — extended signature"
      contains: "breakpoint: 'desktop' | 'mobile'"
  key_links:
    - from: "client/src/hooks/useWidgetLayout.ts"
      to: "user_widget_layouts (Supabase)"
      via: "supabase.from('user_widget_layouts').upsert(..., { onConflict: 'user_id,hub_id,breakpoint' })"
      pattern: "user_widget_layouts.*upsert"
    - from: "client/src/hooks/useWidgetLayout.ts"
      to: "client/src/components/widgets/mergeLayouts.ts"
      via: "queryFn calls mergeLayouts(persisted, getDefaultLayout(hubId, breakpoint))"
      pattern: "mergeLayouts\\("
    - from: "client/src/hooks/useWidgetLayout.ts"
      to: "client/src/hooks/useBreakpoint.ts"
      via: "queryKey includes breakpoint dim"
      pattern: "useBreakpoint\\(\\)"
---

<objective>
Lay the persistence foundation for Phase 4: idempotent migration creating `user_widget_layouts`, the `useWidgetLayout(hubId)` React Query hook with optimistic update/rollback/debounce, the pure `mergeLayouts` reconciliation function (Pitfall 7), the `useBreakpoint` hook (Pitfall 6), and an extended `getDefaultLayout(hubId, breakpoint)` signature.

Purpose: Without persistence + reconciliation + per-breakpoint keying, the rest of Phase 4 cannot save anything safely. This plan IS the contract every later plan binds to.
Output: Migration file ready to apply via `db query --linked -f`, hook + utilities exported, full test coverage for the hook (CUST-03 + Pitfalls 5/6/7/15) and mergeLayouts (Pitfall 7 reconciliation).
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
@.planning/phases/04-layout-persistence-hide-show/04-CONTEXT.md
@.planning/phases/04-layout-persistence-hide-show/04-RESEARCH.md
@.planning/phases/04-layout-persistence-hide-show/04-VALIDATION.md
@.planning/research/PITFALLS.md
@client/src/components/widgets/types.ts
@client/src/components/widgets/defaultLayouts.ts
@client/src/components/widgets/registry.ts
@client/src/hooks/useJobsokHubSummary.ts
@client/src/hooks/useSupabase.ts
@supabase/migrations/20260227130000_add_new_features.sql

<interfaces>
<!-- Existing types/exports the executor will extend or consume -->

From client/src/components/widgets/types.ts:
```typescript
export type WidgetSize = 'S' | 'M' | 'L' | 'XL'
export interface WidgetLayoutItem {
  id: string
  size: WidgetSize
  order: number
}
export type { HubId } from '@/components/layout/navigation'
```

Phase 4 EXTENDS WidgetLayoutItem with `visible: boolean`. New shape:
```typescript
export interface WidgetLayoutItem {
  id: string
  size: WidgetSize
  order: number
  visible: boolean   // NEW — defaults to true
}
```

From client/src/components/widgets/registry.ts:
```typescript
export const WIDGET_REGISTRY = { cv, 'cover-letter', interview, 'job-search',
                                  applications, spontaneous, salary, international } as const
export type WidgetId = keyof typeof WIDGET_REGISTRY
```

From client/src/hooks/useSupabase.ts:
```typescript
export function useAuth(): { user: { id: string } | null, profile, loading, isAuthenticated }
```

From client/src/hooks/useJobsokHubSummary.ts (PATTERN to mirror):
```typescript
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useSupabase'
import { supabase } from '@/lib/supabase'

export const JOBSOK_HUB_KEY = (userId: string) => ['hub', 'jobsok', userId] as const
export function useJobsokHubSummary() {
  const { user } = useAuth()
  const userId = user?.id ?? ''
  return useQuery({ queryKey: JOBSOK_HUB_KEY(userId), enabled: !!userId, staleTime: 60_000, queryFn: ... })
}
```

From client/src/components/widgets/defaultLayouts.ts (CURRENT signature to extend):
```typescript
export function getDefaultLayout(hubId: HubId): WidgetLayoutItem[]
// Phase 4 extends to:
export function getDefaultLayout(hubId: HubId, breakpoint?: 'desktop' | 'mobile'): WidgetLayoutItem[]
```

From supabase/migrations/20260227130000_add_new_features.sql (RLS PATTERN):
```sql
CREATE POLICY "Users can view their interview sessions"
  ON interview_sessions FOR SELECT USING (user_id = auth.uid());
-- Phase 4 must use idempotent DO $$ BEGIN ... EXCEPTION WHEN duplicate_object THEN NULL; END $$
-- because DROP POLICY IF EXISTS is FORBIDDEN by inviolable rule (no destructive DDL).
```
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Migration + types + mergeLayouts pure utility (with tests)</name>
  <files>
    supabase/migrations/20260429_user_widget_layouts.sql,
    client/src/components/widgets/types.ts,
    client/src/components/widgets/mergeLayouts.ts,
    client/src/components/widgets/mergeLayouts.test.ts,
    client/src/components/widgets/defaultLayouts.ts
  </files>
  <read_first>
    - .planning/research/PITFALLS.md (Pitfall 7 — reconciliation; Pitfall G — destructive SQL)
    - .planning/phases/04-layout-persistence-hide-show/04-RESEARCH.md §"Migration: user_widget_layouts Table" + §"mergeLayouts Function" + §"defaultLayouts.ts Extension"
    - .planning/phases/04-layout-persistence-hide-show/04-CONTEXT.md §Schema-design (locked: per-breakpoint upsert key, JSONB shape `{id, size, visible}`)
    - supabase/migrations/20260227130000_add_new_features.sql (RLS pattern — but DROP POLICY antipattern that Phase 4 must NOT replicate)
    - CLAUDE.md §"Supabase-migrationer" (apply with `db query --linked -f`, NEVER `db push`)
    - client/src/components/widgets/types.ts (existing WidgetLayoutItem to extend with `visible`)
    - client/src/components/widgets/defaultLayouts.ts (existing getDefaultLayout to extend with breakpoint param)
    - client/src/components/widgets/registry.ts (WIDGET_REGISTRY keys used by mergeLayouts)
  </read_first>
  <behavior>
    Tests FIRST in `client/src/components/widgets/mergeLayouts.test.ts`:

    - Test 1: "appends missing widgets from default to end of persisted"
      Input: persisted = `[{id: 'cv', size: 'L', order: 0, visible: true}]`,
             default = `[{id: 'cv', size: 'L', order: 0, visible: true}, {id: 'cover-letter', size: 'M', order: 1, visible: true}]`
      Expect: result has both 'cv' and 'cover-letter', cover-letter appended at end with visible: true
    - Test 2: "removes widgets not in WIDGET_REGISTRY"
      Input: persisted = `[{id: 'cv', size: 'L', order: 0, visible: true}, {id: 'unknown-widget', size: 'M', order: 1, visible: true}]`,
             default = `[{id: 'cv', size: 'L', order: 0, visible: true}]`
      Expect: 'unknown-widget' filtered out; only 'cv' remains
    - Test 3: "preserves user-set size and visibility for persisted widgets"
      Input: persisted = `[{id: 'cv', size: 'S', order: 0, visible: false}]` (user resized + hid),
             default = `[{id: 'cv', size: 'L', order: 0, visible: true}]` (default is L visible)
      Expect: result has cv at size 'S' visible: false (user state wins)
    - Test 4: "returns empty array when both inputs empty"
      Input: persisted = [], default = []
      Expect: []
    - Test 5: "appended default widgets get visible: true even if default item omits visible"
      Input: persisted = [], default = `[{id: 'cv', size: 'L', order: 0} as any]`  (no visible key)
      Expect: result[0].visible === true

    No tests for SQL — verified by manual SQL introspection in Task 3 acceptance.
  </behavior>
  <action>
    **Step 1 — Extend types.ts**

    Edit `client/src/components/widgets/types.ts` — add `visible: boolean` to WidgetLayoutItem:
    ```typescript
    export interface WidgetLayoutItem {
      id: string
      size: WidgetSize
      order: number
      visible: boolean  // Phase 4: defaults to true. Set to false when user hides via hide-button.
    }
    ```

    **Step 2 — Extend defaultLayouts.ts**

    Edit `client/src/components/widgets/defaultLayouts.ts` to (a) add `visible: true` to every existing layout item, and (b) accept optional breakpoint param:

    ```typescript
    export function getDefaultLayout(
      hubId: HubId,
      breakpoint: 'desktop' | 'mobile' = 'desktop'
    ): WidgetLayoutItem[] {
      const desktop: Record<HubId, WidgetLayoutItem[]> = {
        jobb: [
          { id: 'cv',           size: 'L', order: 0, visible: true },
          { id: 'cover-letter', size: 'M', order: 1, visible: true },
          { id: 'interview',    size: 'M', order: 2, visible: true },
          { id: 'job-search',   size: 'L', order: 3, visible: true },
          { id: 'applications', size: 'M', order: 4, visible: true },
          { id: 'spontaneous',  size: 'S', order: 5, visible: true },
          { id: 'salary',        size: 'M', order: 6, visible: true },
          { id: 'international', size: 'S', order: 7, visible: true },
        ],
        karriar:      [{ id: 'cv', size: 'S', order: 0, visible: true }],
        resurser:     [{ id: 'cv', size: 'S', order: 0, visible: true }],
        'min-vardag': [{ id: 'cv', size: 'S', order: 0, visible: true }],
        oversikt:     [{ id: 'cv', size: 'S', order: 0, visible: true }],
      }
      const base = desktop[hubId]
      if (breakpoint === 'mobile') {
        // Mobile cap: L→M, XL→M (mobile grid is 2-col)
        return base.map(item => ({
          ...item,
          size: (item.size === 'L' || item.size === 'XL') ? 'M' as const : item.size,
        }))
      }
      return base
    }
    ```

    Keep existing `getJobbSections()` exported function — it now propagates `visible: true` from the layout items.

    **Step 3 — Create mergeLayouts.ts (Pitfall 7)**

    New file `client/src/components/widgets/mergeLayouts.ts`:

    ```typescript
    import { WIDGET_REGISTRY } from './registry'
    import type { WidgetLayoutItem } from './types'

    /**
     * Reconcile persisted layout against current default.
     *
     * Pitfall 7: Phase 5 will add new widgets to defaults. Users with persisted layouts
     * must NOT lose access to new widgets, and old removed widget IDs must NOT crash render.
     *
     * Rules:
     *  - Persisted entries with IDs no longer in WIDGET_REGISTRY are dropped (deleted in code).
     *  - Default entries missing from persisted are appended at the end with visible: true.
     *  - Persisted entries with IDs still in registry keep user-set size and visibility.
     */
    export function mergeLayouts(
      persisted: WidgetLayoutItem[],
      defaultLayout: WidgetLayoutItem[]
    ): WidgetLayoutItem[] {
      const validIds = new Set(Object.keys(WIDGET_REGISTRY))
      const persistedIds = new Set(persisted.map(w => w.id))

      // Drop removed widgets, preserve user state for valid ones
      const valid = persisted.filter(w => validIds.has(w.id))

      // Append widgets that are in default but not yet in persisted (Phase 5 additions)
      const appended = defaultLayout
        .filter(w => !persistedIds.has(w.id))
        .map(w => ({ ...w, visible: w.visible ?? true }))

      return [...valid, ...appended]
    }
    ```

    **Step 4 — Write mergeLayouts.test.ts (the 5 cases from <behavior>)**

    Use vitest + the 5 cases. Mock WIDGET_REGISTRY by importing real registry (it has 8 known widget IDs). Use `unknown-widget` for Test 2 to test the filter.

    **Step 5 — Author migration SQL**

    Create `supabase/migrations/20260429_user_widget_layouts.sql`:

    ```sql
    -- Phase 4 — user_widget_layouts: per-breakpoint widget layout persistence
    -- Apply with: npx supabase db query --linked -f supabase/migrations/20260429_user_widget_layouts.sql
    -- DO NOT use `npx supabase db push` (per CLAUDE.md project rule).
    --
    -- INVIOLABLE: This migration is strictly additive. No DROP, no destructive ALTER.
    -- Idempotent — safe to run repeatedly.

    -- ============================================================
    -- TABLE
    -- ============================================================
    CREATE TABLE IF NOT EXISTS user_widget_layouts (
      id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      hub_id      TEXT        NOT NULL,
      breakpoint  TEXT        NOT NULL CHECK (breakpoint IN ('desktop', 'mobile')),
      widgets     JSONB       NOT NULL DEFAULT '[]'::jsonb,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (user_id, hub_id, breakpoint)
    );

    CREATE INDEX IF NOT EXISTS idx_uwl_user_hub
      ON user_widget_layouts(user_id, hub_id);

    ALTER TABLE user_widget_layouts ENABLE ROW LEVEL SECURITY;

    -- ============================================================
    -- updated_at trigger (conflict detection per Pitfall 5)
    -- ============================================================
    CREATE OR REPLACE FUNCTION update_uwl_timestamp()
    RETURNS TRIGGER LANGUAGE plpgsql AS $$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $$;

    -- Trigger: idempotent via CREATE OR REPLACE on the function +
    -- conditional creation of trigger
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trg_uwl_updated_at'
      ) THEN
        CREATE TRIGGER trg_uwl_updated_at
          BEFORE UPDATE ON user_widget_layouts
          FOR EACH ROW EXECUTE FUNCTION update_uwl_timestamp();
      END IF;
    END $$;

    -- ============================================================
    -- RLS policies — idempotent (DO blocks catch duplicate_object)
    -- 4 policies: select / insert / update / delete on auth.uid() = user_id
    -- ============================================================
    DO $$ BEGIN
      CREATE POLICY "Users can select own layouts"
        ON user_widget_layouts
        FOR SELECT
        USING (auth.uid() = user_id);
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    DO $$ BEGIN
      CREATE POLICY "Users can insert own layouts"
        ON user_widget_layouts
        FOR INSERT
        WITH CHECK (auth.uid() = user_id);
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    DO $$ BEGIN
      CREATE POLICY "Users can update own layouts"
        ON user_widget_layouts
        FOR UPDATE
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    DO $$ BEGIN
      CREATE POLICY "Users can delete own layouts"
        ON user_widget_layouts
        FOR DELETE
        USING (auth.uid() = user_id);
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    ```

    **CRITICAL — DO NOT INCLUDE:**
    - No `DROP POLICY ...` statements (the existing 20260227130000 file uses them — Phase 4 must NOT)
    - No `ALTER TABLE ... DROP COLUMN`
    - No `ALTER COLUMN ... TYPE` that changes type
    - No `DROP TABLE`
    - No `DROP TRIGGER` (use the conditional `pg_trigger` check instead)

    Run `grep -E "^DROP" supabase/migrations/20260429_user_widget_layouts.sql` — it MUST return zero matches before commit.
  </action>
  <verify>
    <automated>cd client && npm run test:run -- src/components/widgets/mergeLayouts.test.ts</automated>
    Plus a defensive grep on the migration file:
    `grep -cE "^DROP|^ALTER TABLE.*DROP|^ALTER COLUMN.*TYPE" supabase/migrations/20260429_user_widget_layouts.sql` MUST output `0`.
    Plus type-check: `cd client && npx tsc --noEmit` MUST pass.
  </verify>
  <acceptance_criteria>
    - [ ] `client/src/components/widgets/types.ts` exports `WidgetLayoutItem` with `visible: boolean` field.
    - [ ] `client/src/components/widgets/defaultLayouts.ts` exports `getDefaultLayout(hubId, breakpoint?)` and every layout item includes `visible: true`.
    - [ ] `client/src/components/widgets/mergeLayouts.ts` exports a pure `mergeLayouts(persisted, default)` function.
    - [ ] `client/src/components/widgets/mergeLayouts.test.ts` has 5 test cases, all passing.
    - [ ] `supabase/migrations/20260429_user_widget_layouts.sql` exists, contains `CREATE TABLE IF NOT EXISTS user_widget_layouts` with columns id/user_id/hub_id/breakpoint/widgets/created_at/updated_at + `UNIQUE (user_id, hub_id, breakpoint)` + `CHECK (breakpoint IN ('desktop','mobile'))`.
    - [ ] Migration has 4 RLS policies wrapped in `DO $$ BEGIN ... EXCEPTION WHEN duplicate_object THEN NULL; END $$` blocks.
    - [ ] Migration contains `CREATE INDEX IF NOT EXISTS idx_uwl_user_hub`.
    - [ ] `grep -cE "^DROP|^ALTER TABLE.*DROP|^ALTER COLUMN.*TYPE" supabase/migrations/20260429_user_widget_layouts.sql` returns `0`.
    - [ ] `cd client && npx tsc --noEmit` passes (no type breakage from adding `visible: boolean`).
  </acceptance_criteria>
  <done>
    Migration is byte-correct and idempotent. mergeLayouts handles all 4 reconciliation cases (add new, drop removed, preserve user state, empty inputs). Types export the new `visible` field; existing defaults use it.
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: useBreakpoint + useWidgetLayout hook + tests (CUST-03 + Pitfalls 5/6/15)</name>
  <files>
    client/src/hooks/useBreakpoint.ts,
    client/src/hooks/useWidgetLayout.ts,
    client/src/hooks/useWidgetLayout.test.ts
  </files>
  <read_first>
    - .planning/phases/04-layout-persistence-hide-show/04-RESEARCH.md §"useWidgetLayout Hook Skeleton" + §"Pattern 6: Breakpoint Detection" + §Pitfalls A/B/D
    - .planning/research/PITFALLS.md (Pitfall 5 race condition + rollback; Pitfall 6 per-breakpoint; Pitfall 15 infinite re-render)
    - client/src/hooks/useJobsokHubSummary.ts (PATTERN to mirror — useQuery + queryClient + useAuth)
    - client/src/hooks/useJobsokHubSummary.test.ts (mocking pattern for useAuth + supabase)
    - client/src/hooks/useSupabase.ts (useAuth shape)
    - client/src/lib/supabase.ts (supabase client export — verify default vs named)
    - client/src/components/widgets/types.ts (WidgetLayoutItem with `visible`)
    - client/src/components/widgets/mergeLayouts.ts (created in Task 1)
    - client/src/components/widgets/defaultLayouts.ts (now accepts breakpoint param)
  </read_first>
  <behavior>
    Tests in `client/src/hooks/useWidgetLayout.test.ts`. Mock `useAuth` returning `{user: {id: 'test-user-id'}}` and mock the supabase client.

    - Test 1: "useBreakpoint returns 'desktop' when matchMedia(min-width: 900px) matches"
      Mock window.matchMedia to return `{matches: true}`; renderHook → expect 'desktop'.
    - Test 2: "useBreakpoint returns 'mobile' when matchMedia does not match"
      Mock matches: false → expect 'mobile'.
    - Test 3: "useBreakpoint updates when matchMedia change event fires"
      Mock matches initially false then dispatch change with matches: true → expect rerender returns 'desktop'.
    - Test 4: "useWidgetLayout queryKey is ['user-widget-layouts', userId, hubId, breakpoint]"
      Render hook with hubId='jobb', mock breakpoint='desktop'. Spy on queryClient or read query state. Assert key shape.
    - Test 5: "useWidgetLayout queryFn calls supabase.from('user_widget_layouts').select with eq filters for user_id, hub_id, breakpoint"
      Mock supabase.from to return chained spies. Trigger query. Assert eq called with ('user_id', 'test-user-id'), ('hub_id', 'jobb'), ('breakpoint', 'desktop').
    - Test 6: "queryFn passes persisted to mergeLayouts and returns the merged result"
      Mock supabase to return `{data: {widgets: [{id: 'cv', size: 'S', order: 0, visible: false}], updated_at: '...'}}`. Expect hook's `layout` to include the persisted cv with size 'S' visible: false PLUS appended other 7 default widgets (since default jobb has 8).
    - Test 7: "saveDebounced does not fire upsert before 1000ms elapse"
      Use vi.useFakeTimers(). Call saveDebounced. Advance 999ms. Assert upsert NOT called. Advance 1ms more. Assert upsert called once.
    - Test 8: "rapid saveDebounced calls collapse into ONE upsert (latest payload wins)"
      Call saveDebounced(payloadA), advance 500ms, call saveDebounced(payloadB), advance 1000ms. Assert exactly 1 upsert with payloadB.
    - Test 9: "upsert payload contains user_id, hub_id, breakpoint, widgets (no other DB-shape values)"
      Mock supabase upsert spy. Trigger save. Assert upsert called with object whose keys are exactly these 4.
    - Test 10: "upsert is called with onConflict: 'user_id,hub_id,breakpoint'"
      Spy second arg of upsert. Assert `{ onConflict: 'user_id,hub_id,breakpoint' }`.
    - Test 11: "Pitfall 5 — onError rolls back to snapshot (optimistic rollback)"
      Initial query state = layout A. Mutate to layout B (optimistic). Reject upsert. Assert query cache reverts to layout A.
    - Test 12: "Pitfall 6 — mobile save uses breakpoint='mobile' in payload, does not affect desktop key"
      Mock useBreakpoint to return 'mobile'. Trigger save. Assert upsert payload `breakpoint === 'mobile'`. Assert query for `['user-widget-layouts', userId, 'jobb', 'desktop']` is untouched (separate cache entry).
    - Test 13: "Pitfall 15 — query data reference equality stable when no actual change"
      Render hook. Read `layout` reference. Trigger React re-render without state change. Assert reference equality holds (no infinite loop trigger).
    - Test 14: "useBeforeUnload listener registered and removed on unmount"
      Spy on window.addEventListener('beforeunload', ...) and window.removeEventListener. Render hook. Assert add called. Unmount. Assert remove called.
  </behavior>
  <action>
    **Step 1 — Create useBreakpoint.ts**

    New file `client/src/hooks/useBreakpoint.ts`:

    ```typescript
    import { useEffect, useState } from 'react'

    /**
     * Stable 'desktop' | 'mobile' keyed off (min-width: 900px) — matches
     * HubGrid's CSS breakpoint exactly. Critical for Pitfall 6 (per-breakpoint
     * upsert key cannot drift).
     */
    export function useBreakpoint(): 'desktop' | 'mobile' {
      const [bp, setBp] = useState<'desktop' | 'mobile'>(() => {
        if (typeof window === 'undefined') return 'desktop'
        return window.matchMedia('(min-width: 900px)').matches ? 'desktop' : 'mobile'
      })

      useEffect(() => {
        if (typeof window === 'undefined') return
        const mq = window.matchMedia('(min-width: 900px)')
        const handler = (e: MediaQueryListEvent) => {
          setBp(e.matches ? 'desktop' : 'mobile')
        }
        mq.addEventListener('change', handler)
        return () => mq.removeEventListener('change', handler)
      }, [])

      return bp
    }
    ```

    **Step 2 — Create useWidgetLayout.ts**

    New file `client/src/hooks/useWidgetLayout.ts`:

    ```typescript
    import { useCallback, useEffect, useRef } from 'react'
    import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
    import { useAuth } from '@/hooks/useSupabase'
    import { supabase } from '@/lib/supabase'
    import { useBreakpoint } from '@/hooks/useBreakpoint'
    import { mergeLayouts } from '@/components/widgets/mergeLayouts'
    import { getDefaultLayout } from '@/components/widgets/defaultLayouts'
    import type { WidgetLayoutItem, HubId } from '@/components/widgets/types'

    export const USER_WIDGET_LAYOUTS_KEY = (
      userId: string,
      hubId: HubId,
      breakpoint: 'desktop' | 'mobile'
    ) => ['user-widget-layouts', userId, hubId, breakpoint] as const

    interface LayoutCache {
      widgets: WidgetLayoutItem[]
      updated_at: string | null
    }

    export function useWidgetLayout(hubId: HubId) {
      const { user } = useAuth()
      const userId = user?.id ?? ''
      const breakpoint = useBreakpoint()
      const queryClient = useQueryClient()
      const queryKey = USER_WIDGET_LAYOUTS_KEY(userId, hubId, breakpoint)

      const query = useQuery<LayoutCache>({
        queryKey,
        enabled: !!userId,
        staleTime: Infinity,
        queryFn: async () => {
          const { data, error } = await supabase
            .from('user_widget_layouts')
            .select('widgets, updated_at')
            .eq('user_id', userId)
            .eq('hub_id', hubId)
            .eq('breakpoint', breakpoint)
            .maybeSingle()
          if (error) throw error
          const persisted = (data?.widgets as WidgetLayoutItem[] | null) ?? []
          const defaults = getDefaultLayout(hubId, breakpoint)
          return {
            widgets: mergeLayouts(persisted, defaults),
            updated_at: data?.updated_at ?? null,
          }
        },
      })

      const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
      const pendingPayloadRef = useRef<WidgetLayoutItem[] | null>(null)

      const mutation = useMutation({
        mutationFn: async (widgets: WidgetLayoutItem[]) => {
          const { error } = await supabase
            .from('user_widget_layouts')
            .upsert(
              { user_id: userId, hub_id: hubId, breakpoint, widgets },
              { onConflict: 'user_id,hub_id,breakpoint' }
            )
          if (error) throw error
        },
        onMutate: async (newWidgets) => {
          await queryClient.cancelQueries({ queryKey })
          const snapshot = queryClient.getQueryData<LayoutCache>(queryKey)
          queryClient.setQueryData<LayoutCache>(queryKey, (old) =>
            old ? { ...old, widgets: newWidgets } : { widgets: newWidgets, updated_at: null }
          )
          return { snapshot }
        },
        onError: (_err, _vars, context) => {
          if (context?.snapshot) {
            queryClient.setQueryData(queryKey, context.snapshot)
          }
        },
        onSettled: () => {
          queryClient.invalidateQueries({ queryKey })
        },
      })

      const flushNow = useCallback(() => {
        if (debounceRef.current) {
          clearTimeout(debounceRef.current)
          debounceRef.current = null
        }
        if (pendingPayloadRef.current) {
          mutation.mutate(pendingPayloadRef.current)
          pendingPayloadRef.current = null
        }
      }, [mutation])

      const saveDebounced = useCallback(
        (widgets: WidgetLayoutItem[]) => {
          pendingPayloadRef.current = widgets
          // Optimistic cache write happens in onMutate when timer fires —
          // but we ALSO want immediate UI update, so update cache here too.
          queryClient.setQueryData<LayoutCache>(queryKey, (old) =>
            old ? { ...old, widgets } : { widgets, updated_at: null }
          )
          if (debounceRef.current) clearTimeout(debounceRef.current)
          debounceRef.current = setTimeout(() => {
            const payload = pendingPayloadRef.current
            if (payload) {
              mutation.mutate(payload)
              pendingPayloadRef.current = null
            }
            debounceRef.current = null
          }, 1000)
        },
        [mutation, queryClient, queryKey]
      )

      // Pitfall 5 — flush pending save when tab is closing
      useEffect(() => {
        const handler = () => flushNow()
        window.addEventListener('beforeunload', handler)
        return () => window.removeEventListener('beforeunload', handler)
      }, [flushNow])

      return {
        layout: query.data?.widgets ?? [],
        isLoading: query.isLoading,
        saveDebounced,
        flushNow,
        // Direct mutation for non-debounced operations (e.g. reset)
        save: mutation.mutate,
      }
    }
    ```

    **Step 3 — Write useWidgetLayout.test.ts**

    Mirror the mocking strategy of `client/src/hooks/useJobsokHubSummary.test.ts`:
    - vi.mock('@/hooks/useSupabase', () => ({ useAuth: () => ({ user: { id: 'test-user-id' } }) }))
    - vi.mock('@/lib/supabase', () => ({ supabase: { from: vi.fn() ... } }))
    - Use `@tanstack/react-query`'s QueryClientProvider in a wrapper
    - Use `@testing-library/react`'s renderHook + act

    Implement all 14 tests from <behavior>. For tests requiring matchMedia mocking, use:
    ```typescript
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: query.includes('900') ? true : false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    })
    ```

    For useBreakpoint Test 3 (change event), capture the listener via the addEventListener mock and invoke it manually.

    For Pitfall 6 mobile-vs-desktop test (Test 12), render two hook instances with different mocked breakpoints; verify their queryKeys differ at the breakpoint position.
  </action>
  <verify>
    <automated>cd client && npm run test:run -- src/hooks/useWidgetLayout.test.ts src/components/widgets/mergeLayouts.test.ts</automated>
    Type-check: `cd client && npx tsc --noEmit` MUST pass.
  </verify>
  <acceptance_criteria>
    - [ ] `client/src/hooks/useBreakpoint.ts` exports `useBreakpoint(): 'desktop' | 'mobile'`.
    - [ ] `client/src/hooks/useWidgetLayout.ts` exports `useWidgetLayout(hubId)` returning `{layout, isLoading, saveDebounced, flushNow, save}`.
    - [ ] `useWidgetLayout` exports `USER_WIDGET_LAYOUTS_KEY(userId, hubId, breakpoint)` keyfn returning `['user-widget-layouts', userId, hubId, breakpoint] as const`.
    - [ ] queryFn fetches with `eq('user_id', userId)`, `eq('hub_id', hubId)`, `eq('breakpoint', breakpoint)` + `.maybeSingle()`.
    - [ ] queryFn calls `mergeLayouts(persisted, getDefaultLayout(hubId, breakpoint))` before returning.
    - [ ] mutation upserts with `{user_id, hub_id, breakpoint, widgets}` payload only (no extra fields).
    - [ ] mutation upsert second arg is `{ onConflict: 'user_id,hub_id,breakpoint' }`.
    - [ ] `onMutate` snapshots prior cache; `onError` restores it; `onSettled` invalidates.
    - [ ] `saveDebounced` waits 1000ms before firing; rapid calls collapse to one upsert with last payload.
    - [ ] `useEffect` registers a `beforeunload` listener that calls `flushNow`; cleanup removes it.
    - [ ] All 14 tests in useWidgetLayout.test.ts pass.
    - [ ] All 5 tests in mergeLayouts.test.ts continue to pass.
    - [ ] `cd client && npx tsc --noEmit` passes.
  </acceptance_criteria>
  <done>
    Hook satisfies CUST-03 (persisted layout cross-session/device), Pitfall 5 (debounce + rollback + flush), Pitfall 6 (per-breakpoint upsert), Pitfall 15 (stable references, no infinite loop), and surfaces a stable API the next plans (02/03/04) can call without further plumbing.
  </done>
</task>

<task type="auto">
  <name>Task 3: Apply migration to remote DB and verify schema</name>
  <files>(no source files — applies migration to live Supabase)</files>
  <read_first>
    - CLAUDE.md §"Supabase-migrationer" (apply with `db query --linked -f`, NEVER `db push`)
    - supabase/migrations/20260429_user_widget_layouts.sql (file authored in Task 1)
    - .planning/phases/04-layout-persistence-hide-show/04-VALIDATION.md §"Migration Verification"
  </read_first>
  <action>
    **Step 1 — Apply migration**

    From the project root:
    ```bash
    npx supabase db query --linked -f supabase/migrations/20260429_user_widget_layouts.sql
    ```

    Expected: command exits 0; no errors. (If `supabase login` / `link` is required, the executor stops and surfaces the auth gate to the user — do NOT silently fail.)

    **Step 2 — Verify columns**

    ```bash
    npx supabase db query --linked "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'user_widget_layouts' ORDER BY ordinal_position;" --output table
    ```

    Expect 7 rows in this order: id (uuid), user_id (uuid), hub_id (text), breakpoint (text), widgets (jsonb), created_at (timestamp with time zone), updated_at (timestamp with time zone).

    **Step 3 — Verify unique constraint**

    ```bash
    npx supabase db query --linked "SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = 'user_widget_layouts'::regclass AND contype = 'u';" --output table
    ```

    Expect at least one row whose definition contains `UNIQUE (user_id, hub_id, breakpoint)` (Postgres may name it `user_widget_layouts_user_id_hub_id_breakpoint_key`).

    **Step 4 — Verify CHECK constraint on breakpoint**

    ```bash
    npx supabase db query --linked "SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = 'user_widget_layouts'::regclass AND contype = 'c';" --output table
    ```

    Expect a CHECK constraint whose definition contains `breakpoint = ANY (ARRAY['desktop'::text, 'mobile'::text])` or equivalent.

    **Step 5 — Verify 4 RLS policies**

    ```bash
    npx supabase db query --linked "SELECT policyname, cmd FROM pg_policies WHERE tablename = 'user_widget_layouts' ORDER BY cmd;" --output table
    ```

    Expect exactly 4 rows: SELECT, INSERT, UPDATE, DELETE — all named "Users can ... own layouts".

    **Step 6 — Verify trigger**

    ```bash
    npx supabase db query --linked "SELECT tgname FROM pg_trigger WHERE tgrelid = 'user_widget_layouts'::regclass AND NOT tgisinternal;" --output table
    ```

    Expect: `trg_uwl_updated_at`.

    **Step 7 — Verify RLS enabled**

    ```bash
    npx supabase db query --linked "SELECT relrowsecurity FROM pg_class WHERE relname = 'user_widget_layouts';" --output table
    ```

    Expect: `t` (true).

    **Step 8 — Idempotency proof**

    Re-run the migration:
    ```bash
    npx supabase db query --linked -f supabase/migrations/20260429_user_widget_layouts.sql
    ```

    Expect: command still exits 0, no "already exists" error fatal-ed (DO blocks swallow duplicate_object).

    Document any deviations from expected output in the plan SUMMARY. If any expected column/index/policy is missing, do NOT mark the task done — fix the migration in Task 1 and re-run from Step 1.

    **Fallback for blocked auth**: If `supabase db query --linked` returns an auth error or "not linked" error that the executor cannot resolve autonomously, surface it as an authentication checkpoint to the user with the exact retry command. (Note: in Phase 3 Plan 01, `db query --linked -f` worked autonomously per project history — same pattern expected here.)
  </action>
  <verify>
    <automated>npx supabase db query --linked "SELECT count(*) FROM information_schema.columns WHERE table_name='user_widget_layouts';" --output csv | tail -n 1 | grep -q "^7$"</automated>
    Plus manual confirmation in the SUMMARY of all 8 verification queries' output (columns, unique, check, 4 policies, trigger, RLS-enabled, idempotency re-run).
  </verify>
  <acceptance_criteria>
    - [ ] Migration command exited 0.
    - [ ] `user_widget_layouts` has exactly 7 columns: id, user_id, hub_id, breakpoint, widgets, created_at, updated_at.
    - [ ] Unique constraint on (user_id, hub_id, breakpoint) exists.
    - [ ] CHECK constraint restricts breakpoint to 'desktop' | 'mobile'.
    - [ ] 4 RLS policies exist (one each for SELECT/INSERT/UPDATE/DELETE).
    - [ ] Trigger `trg_uwl_updated_at` exists.
    - [ ] `relrowsecurity = t` on the table.
    - [ ] Re-running migration succeeds (idempotency confirmed).
  </acceptance_criteria>
  <done>
    Live Supabase DB has the table, constraints, indices, RLS policies, and trigger that match the migration file. Subsequent plans can rely on the persisted layer.
  </done>
</task>

</tasks>

<verification>
- All 3 tasks complete and acceptance criteria met.
- `cd client && npm run test:run -- src/components/widgets/mergeLayouts.test.ts src/hooks/useWidgetLayout.test.ts` shows 19 passing tests.
- `cd client && npx tsc --noEmit` passes (no type errors from adding `visible` field).
- Migration applied to remote DB and verified via 8 introspection queries.
- `grep -cE "^DROP|^ALTER TABLE.*DROP|^ALTER COLUMN.*TYPE" supabase/migrations/20260429_user_widget_layouts.sql` returns `0` (inviolable rule honored).
- Existing tests still pass: `cd client && npm run test:run -- src/components/widgets/`.
</verification>

<success_criteria>
CUST-03 foundation laid:
1. Persistence table exists in live Supabase with correct schema, RLS, and indices.
2. `useWidgetLayout(hubId)` hook is the single API for read+save with optimistic update + rollback + 1000ms debounce + beforeunload flush.
3. `mergeLayouts` reconciliation handles new-widget addition (Pitfall 7) and removed-widget cleanup.
4. Per-breakpoint keying (Pitfall 6) prevents mobile saves from clobbering desktop layout.
5. No regressions in Phase 2/3 tests.
</success_criteria>

<output>
After completion, create `.planning/phases/04-layout-persistence-hide-show/04-01-migration-and-layout-hook-SUMMARY.md` documenting:
- Migration application output (col list, policy list, trigger, idempotency re-run result)
- Test counts (mergeLayouts: 5 passing, useWidgetLayout: 14 passing)
- Any schema deviations from spec (expected: none)
- Final exports table: useWidgetLayout, USER_WIDGET_LAYOUTS_KEY, useBreakpoint, mergeLayouts
- Any open questions for Plan 02 (e.g. confirmed `visible` default behavior, edge cases observed)
</output>
