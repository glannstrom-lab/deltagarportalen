# Phase 4: Layout Persistence + Hide/Show - Research

**Researched:** 2026-04-28
**Domain:** Supabase upsert persistence, React Query optimistic updates, widget visibility state, a11y for hide/show controls
**Confidence:** HIGH — grounded in actual Phase 2/3 codebase, locked CONTEXT.md decisions, and verified existing code patterns

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Schema: `user_widget_layouts` table, columns `(id UUID PK, user_id UUID FK auth.users, hub_id TEXT, breakpoint TEXT, widgets JSONB, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ)`. Upsert key: `(user_id, hub_id, breakpoint)`.
- `widgets` JSONB shape: array of `{id: string, size: 'S'|'M'|'L'|'XL', visible: boolean}` — NO application data values in layout.
- `updated_at` trigger for conflict detection: if `server.updated_at > client.updated_at`, reject and re-fetch.
- `useWidgetLayout(hubId)` hook: `useQuery staleTime: Infinity`, `useMutation` with `onMutate`/`onError`/`onSettled` rollback (Pitfall 5), debounce 1000ms, `useBeforeUnload` flush.
- `mergeLayouts(persisted, defaultLayout)` reconciliation on hub-mount (Pitfall 7).
- `getDefaultLayout(hubId)` extended with `breakpoint` parameter (`'desktop' | 'mobile'`).
- Hide-button: small × in Widget.Header, visible in edit-mode only. `aria-label="Dölj widget {namn}"`.
- "Anpassa vy"-button in hub-header activates edit-mode for the hub — already exists as non-functional placeholder in Phase 2.
- "Återvisa"-panel: dropdown from "Anpassa vy" listing `visible: false` widgets. Auto-close on outside click.
- Reset-button at the bottom of the återvisa-panel. ConfirmDialog (variant: `'warning'`) before reset.
- ConfirmDialog text: `title: "Återställ layout?"`, `message: "Är du säker? Detta tar bort alla anpassningar för denna hub."`.
- `aria-live="polite"` announcements: "Widget dold", "Widget återvisad", "Layout återställd".
- Only JobsokHub gets persistence in Phase 4. Pattern documented in `04-SUMMARY.md` for Phase 5 replication.
- `JobsokLayoutProvider` wraps `JobsokDataProvider` (layout outer, data inner — layout must resolve first since data-fetch can depend on visible widgets).
- Strict additive migration ONLY: `CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`. No DROP, no destructive ALTER COLUMN.
- Run migration with `npx supabase db query --linked -f <file>`. NEVER `db push`.

### Claude's Discretion
- Exact CSS for "Anpassa vy" toggle states (active/inactive — use Phase 2 ghost-button style).
- Exact Swedish copy for reset confirm (start from: "Är du säker?" not "Are you sure?").
- Whether to use Zustand or `useState` for edit-mode state in JobsokHub (default: `useState` — hub-local).
- Test strategy for optimistic-update rollback (default: vitest with mock supabase rejecting next upsert).
- Exact queryKey strings (proposal: `['user-widget-layouts', userId, hubId, breakpoint]`).

### Deferred Ideas (OUT OF SCOPE)
- Drag-and-drop reordering (DRAG-01, v1.1).
- Keyboard-accessible sorting (DRAG-02, v1.1).
- Add-widget-from-catalog (CAT-01, v1.1).
- Per-breakpoint UI toggle exposed to user (DRAG-03, v1.1).
- Layout persistence for Karriär/Resurser/Min Vardag/Översikt (Phase 5).
- Smart contextual Översikt suggestions (SMART-01, v1.1).
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CUST-01 | Användaren kan dölja och återvisa enskilda widgets per hub | Hide × button in Widget.Header (edit-mode-gated); "Återvisa"-panel listing `visible: false` entries; `mergeLayouts` preserves hidden state across reload |
| CUST-02 | Användaren kan återställa default-layout per hub | Reset-button in återvisa-panel; ConfirmDialog (warning variant, already installed); mutation sets `widgets` to `getDefaultLayout(hubId, breakpoint)` then upserts |
| CUST-03 | Användarens layout (storlekar, dolda widgets) sparas per hub i Supabase och återställs vid återbesök | `user_widget_layouts` table; upsert key `(user_id, hub_id, breakpoint)`; `useWidgetLayout` with React Query + Supabase; `mergeLayouts` reconciliation on load |
</phase_requirements>

---

## Summary

Phase 4 adds three user-visible capabilities to JobsokHub: hiding individual widgets, restoring them from a panel, and persisting both visibility state and widget sizes across sessions and devices. The entire change is **strictly additive** — one new Supabase table, one new hook, one new context layer, and incremental extension of the existing Widget compound component and HubGrid.

The implementation follows three precisely established Phase 2/3 patterns. The data layer mirrors `useJobsokHubSummary` (React Query, `staleTime`, `queryClient.setQueryData`). The context layer mirrors `JobsokDataContext` (peer-context, provider wraps in hub page). The widget extension mirrors the Phase 2 size-toggle pattern (edit-mode-gated controls, `aria-pressed`, `aria-live` announcement region already in place).

The most critical correctness constraints are: (1) per-breakpoint upsert key to prevent mobile writes clobbering desktop layout (Pitfall 6), (2) `mergeLayouts` reconciliation so future widget additions appear for users with existing persisted layouts (Pitfall 7), and (3) React Query `onMutate`/`onError` rollback to handle failed upserts gracefully (Pitfall 5). All three are locked decisions.

**Primary recommendation:** Implement in four sequential plans — migration + hook, Widget.Header hide-button, återvisa-panel + reset, JobsokHub wiring. Each plan is independently testable and non-regressive.

---

## Standard Stack

### Core (all already installed — no new dependencies needed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@tanstack/react-query` | ^5.x (already in project) | `useQuery` + `useMutation` for layout persistence | Phase 3 established pattern; all cache key + staleTime conventions already locked |
| `@supabase/supabase-js` | already in project | Upsert to `user_widget_layouts` | All RLS patterns, `anon` client usage, migration workflow already established |
| `react` (hooks) | 19 | `useState` (edit-mode), `useRef` (debounce), `useCallback` | Phase 2/3 already on React 19 |
| `lucide-react` | ^0.574.0 (already in project) | `X` icon for hide-button, `Settings2` or `SlidersHorizontal` for "Anpassa vy" active state | Already the project icon library |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| ConfirmDialog (`client/src/components/ui/ConfirmDialog.tsx`) | in-tree | Reset confirm | Already installed; `useConfirmDialog()` hook; `variant: 'warning'` for reset |
| `useFocusTrap` | in-tree (used by ConfirmDialog) | Focus management inside dialog | Already wired inside ConfirmDialog — no extra setup |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| React Query mutation | Direct `supabase.from(...).upsert()` in `useEffect` | No optimistic update, no rollback, no loading state — ruled out |
| `useState` for edit-mode | Zustand store | edit-mode is hub-local UI state, not cross-component; `useState` is correct for Phase 4 scope (locked decision) |
| Single layout JSONB blob | Per-breakpoint rows (chosen) | Single blob creates Pitfall 6 cross-device clobber — per-row is mandatory |

**Installation:** No new packages needed. All dependencies are already present.

---

## Architecture Patterns

### Recommended File Structure (new files only)

```
client/src/
├── hooks/
│   └── useWidgetLayout.ts          # NEW: React Query hook for layout persistence
├── components/widgets/
│   ├── JobsokLayoutContext.tsx      # NEW: peer-context (mirrors JobsokDataContext)
│   ├── HiddenWidgetsPanel.tsx      # NEW: "Återvisa dolda" dropdown panel
│   └── defaultLayouts.ts           # EXTEND: add breakpoint param to getDefaultLayout
├── pages/hubs/
│   └── JobsokHub.tsx               # EXTEND: wrap with JobsokLayoutProvider, wire edit-mode
supabase/migrations/
└── 20260429_user_widget_layouts.sql  # NEW: additive migration
```

### Pattern 1: Per-Breakpoint Layout Hook (`useWidgetLayout`)

**What:** React Query hook that reads/writes `user_widget_layouts` for the active hub and detected breakpoint. Returns `layout`, `updateLayout`, `resetLayout`, `isLoading`.

**When to use:** Called once in `JobsokHub` (or future hub pages). Provides layout to `JobsokLayoutProvider`.

**Key implementation details from locked decisions:**
- `staleTime: Infinity` — layout only changes when user acts, not on window focus or interval
- `queryKey: ['user-widget-layouts', userId, hubId, breakpoint]`
- `useMutation` with `onMutate` (optimistic), `onError` (rollback to snapshot), `onSettled` (invalidate)
- Debounce 1000ms using `useRef` — single stable ref, NOT a new ref per render
- `useBeforeUnload` flushes pending debounce synchronously
- Conflict detection: if `server.updated_at > payload.updated_at`, re-fetch (do not overwrite)

```typescript
// Pattern: onMutate optimistic snapshot (Pitfall 5)
onMutate: async (newWidgets) => {
  await queryClient.cancelQueries({ queryKey })
  const snapshot = queryClient.getQueryData(queryKey)
  queryClient.setQueryData(queryKey, (old) => ({ ...old, widgets: newWidgets }))
  return { snapshot }
},
onError: (_err, _vars, context) => {
  if (context?.snapshot) queryClient.setQueryData(queryKey, context.snapshot)
},
onSettled: () => queryClient.invalidateQueries({ queryKey }),
```

### Pattern 2: `mergeLayouts(persisted, defaultLayout)` Reconciliation

**What:** Pure function run on hub-mount. Takes persisted JSONB array and `getDefaultLayout(hubId, breakpoint)`. Returns merged array where: (a) widgets missing from persisted are appended in default position, (b) widgets no longer in `WIDGET_REGISTRY` are removed from active layout (but preserved in DB with `visible: false`).

**When to use:** Called inside `useWidgetLayout` queryFn after fetching from Supabase, before returning to React Query cache.

```typescript
// Source: Pitfall 7 reconciliation pattern (PITFALLS.md)
function mergeLayouts(
  persisted: WidgetLayoutItem[],
  defaultLayout: WidgetLayoutItem[]
): WidgetLayoutItem[] {
  const validIds = new Set(Object.keys(WIDGET_REGISTRY))
  const persistedIds = new Set(persisted.map(w => w.id))
  // Remove unknown widget IDs
  const valid = persisted.filter(w => validIds.has(w.id))
  // Append widgets from default that are missing from persisted
  const missing = defaultLayout.filter(w => !persistedIds.has(w.id))
  return [...valid, ...missing.map(w => ({ ...w, visible: true }))]
}
```

### Pattern 3: `JobsokLayoutContext` Peer-Context

**What:** Context + provider that distributes layout state to widgets. Mirrors `JobsokDataContext` structure exactly. Provides `layout`, `updateVisibility`, `updateSize`, `editMode`, `setEditMode`.

**When to use:** Wrap JobsokHub children with `<JobsokLayoutProvider>` OUTSIDE `<JobsokDataProvider>` (layout resolves first — order is locked decision).

```typescript
// Provider order in JobsokHub (locked from CONTEXT.md)
<JobsokLayoutProvider value={layoutState}>
  <JobsokDataProvider value={summary}>
    {/* widgets */}
  </JobsokDataProvider>
</JobsokLayoutProvider>
```

### Pattern 4: Hide-Button in Widget.Header

**What:** Extend `Widget.Header` with an optional hide-button (× icon) visible only when `editMode=true`. The button calls `onHide()` prop passed through `WidgetContext`. Extend `WidgetProps` with `onHide?: () => void`.

**Critical a11y requirements (mirrors Phase 2 size-toggle pattern):**
- Element: `<button type="button">` — not div, not span
- `aria-label="Dölj widget {title}"` — interpolated title from Widget.Header's `title` prop
- Focus ring: `box-shadow: 0 0 0 3px var(--c-bg), 0 0 0 4px var(--c-solid)` (existing focus token)
- After click: updates `aria-live="polite"` region with "Widget dold" (region already exists in JobsokHub)

**Extend `WidgetContextValue` to carry `onHide`:**
```typescript
interface WidgetContextValue {
  size: WidgetSize
  onSizeChange?: (newSize: WidgetSize) => void
  allowedSizes: WidgetSize[]
  editMode: boolean
  onHide?: () => void      // NEW for Phase 4
}
```

### Pattern 5: HubGrid Visibility Filter

**What:** `HubGrid.Section` and `JobsokHub` must filter `visible: false` widgets before rendering slots.

**Where:** In `JobsokHub.tsx`, the `sections.map` that iterates `section.items` must filter by `visible !== false`. `HubGrid.Slot` itself does not need to know about visibility — filtering happens at the hub level.

```typescript
// In JobsokHub.tsx render loop — filter before mapping to Slot
section.items
  .filter(item => layout.find(l => l.id === item.id)?.visible !== false)
  .map(item => <HubGrid.Slot ...>)
```

### Pattern 6: Breakpoint Detection

**What:** Detect desktop vs mobile breakpoint using a stable `useMediaQuery` hook or direct `window.matchMedia`. The breakpoint string must be stable across renders to avoid cache key thrash.

**Implementation (no new library needed):**
```typescript
// Simple hook — returns stable 'desktop' | 'mobile'
function useBreakpoint(): 'desktop' | 'mobile' {
  const [bp, setBp] = useState<'desktop' | 'mobile'>(
    () => window.innerWidth >= 900 ? 'desktop' : 'mobile'
  )
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 900px)')
    const handler = (e: MediaQueryListEvent) => setBp(e.matches ? 'desktop' : 'mobile')
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return bp
}
```

The 900px breakpoint matches the existing HubGrid CSS breakpoint (`min-[900px]:grid-cols-4`) — consistency is critical for Pitfall 6.

### Anti-Patterns to Avoid

- **Storing application data in `widgets` JSONB:** Layout stores `{id, size, visible}` only. No cv data, no application counts. (Security — PITFALLS.md security table.)
- **`onLayoutChange` or `onVisibilityChange` triggering direct Supabase write:** All writes go through debounced mutation. (Pitfall 5.)
- **Single layout blob without breakpoint column:** Schema MUST be `(user_id, hub_id, breakpoint)` upsert key. (Pitfall 6.)
- **Skipping `mergeLayouts`:** Persisted layout treated as complete truth causes new widgets to be invisible for existing users. (Pitfall 7.)
- **Comparing layout objects by reference in `useEffect`:** Use `isEqual` or a stable comparison before calling `setLayout` to avoid Pitfall 15 infinite re-render.
- **`useEffect` cleanup not flushing debounce:** Implement `useBeforeUnload` and flush debounce in cleanup. (Pitfall 5.)
- **Not resetting to `queryKey` snapshot in `onError`:** Without rollback, UI shows new state but DB has old state — divergence manifests on reload.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Confirm before reset | Custom modal component | `useConfirmDialog()` from existing `ConfirmDialog.tsx` | Already installed, a11y-correct (focus trap, `aria-modal`, `aria-labelledby`, Escape handling), Swedish defaults |
| Focus trap in dropdown | Custom focus management | Reuse `useFocusTrap` hook (already in `@/hooks/useFocusTrap`) | Focus trap is deceptively complex — roving focus, Escape key, restore on close |
| Optimistic update state | Hand-rolled `useState` + `try/catch` | React Query `useMutation` `onMutate`/`onError`/`onSettled` | Handles race conditions, loading state, error boundaries, DevTools visibility |
| Breakpoint detection | New library | `window.matchMedia` in small hook | Must match existing HubGrid 900px breakpoint; no library needed |
| Widget ID validation | Runtime whitelist check | `Object.keys(WIDGET_REGISTRY)` in `mergeLayouts` | Registry is already the single source of truth |

**Key insight:** Every non-trivial UI pattern needed in Phase 4 is already solved by an existing in-tree component or the established React Query mutation pattern. The phase is additive, not net-new.

---

## Common Pitfalls

### Pitfall A: Mobile upsert clobbers desktop layout (Pitfall 6)
**What goes wrong:** User hides widget on mobile → upsert fires without breakpoint in key → desktop layout overwrites to mobile state.
**Why it happens:** Upsert without composite key `(user_id, hub_id, breakpoint)` — single row per user per hub.
**How to avoid:** Schema enforces unique constraint on `(user_id, hub_id, breakpoint)`. Upsert payload always includes `breakpoint: 'desktop' | 'mobile'`. `useBreakpoint()` hook provides stable value.
**Warning signs:** Single `user_id + hub_id` unique constraint without `breakpoint`; `breakpoint` not in upsert payload.

### Pitfall B: Failed upsert leaves UI in diverged state (Pitfall 5)
**What goes wrong:** Network blip during hide action → upsert fails → UI shows widget hidden but DB has it visible → on reload widget reappears.
**Why it happens:** No `onError` rollback in `useMutation`.
**How to avoid:** `onMutate` stores previous layout snapshot. `onError` restores it via `queryClient.setQueryData`. `onSettled` invalidates to re-sync.
**Warning signs:** `useMutation` has no `onError` handler; no snapshot stored in `onMutate` context.

### Pitfall C: New widgets invisible for users with existing layouts (Pitfall 7)
**What goes wrong:** Phase 5 adds a new widget to `jobb` hub. Users with persisted layouts never see it because persisted layout is treated as complete truth.
**Why it happens:** No `mergeLayouts` reconciliation.
**How to avoid:** `mergeLayouts(persisted, getDefaultLayout(hubId, breakpoint))` appends missing widgets at bottom. Unit test covers this case explicitly.
**Warning signs:** No `mergeLayouts` function; `queryFn` returns raw Supabase data without reconciliation.

### Pitfall D: Infinite re-render on visibility state sync (Pitfall 15)
**What goes wrong:** `setLayout` in `useEffect` compares object references → always sees new array → infinite re-render → hub freezes.
**Why it happens:** Layout array reconstructed on each render; reference equality always fails.
**How to avoid:** Store last-written layout in `useRef`. Only call `setLayout` when deep-equal check (via `JSON.stringify` or `isEqual`) confirms actual change.
**Warning signs:** `onLayoutChange` / `onVisibilityChange` prints to console on every render without user interaction.

### Pitfall E: ConfirmDialog not in provider scope
**What goes wrong:** `useConfirmDialog()` throws `"must be used within ConfirmDialogProvider"` when reset button is clicked.
**Why it happens:** `ConfirmDialogProvider` not wrapping the hub or app root.
**How to avoid:** Check whether `ConfirmDialogProvider` already wraps the app root (check `client/src/main.tsx` or `App.tsx`). If not, add it there — not per-hub. Phase 4 plan must verify this before implementing the reset button.
**Warning signs:** Runtime error on first reset attempt.

### Pitfall F: `aria-live` region remounted on data load
**What goes wrong:** Announcement region re-mounts when data loads, losing the queued announcement.
**Why it happens:** Region is rendered conditionally inside `if (summary)` or re-mounted when `JobsokDataProvider` re-renders.
**How to avoid:** The `aria-live="polite"` `<div>` already exists in `JobsokHub.tsx` (line 51) OUTSIDE the conditional data-dependent render. Phase 4 extends this same region — does not add a new one.
**Warning signs:** Two `role="status"` regions in the DOM; announcements not read by screen readers.

### Pitfall G: Destructive SQL in migration
**What goes wrong:** Migration uses `DROP POLICY`, `ALTER COLUMN ... TYPE`, or `DROP TABLE` — live DB data loss.
**Why it happens:** Copy-paste from existing migration `20260227130000_add_new_features.sql` which uses `DROP POLICY IF EXISTS` (line 32-36).
**How to avoid:** Phase 4 migration uses ONLY `CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`, `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`, `CREATE POLICY IF NOT EXISTS` (or `DO $$ BEGIN ... EXCEPTION WHEN duplicate_object`). Do NOT use `DROP POLICY` — use the safe idempotent form.
**Warning signs:** Any `DROP` statement in the migration file.

---

## Code Examples

### Migration: `user_widget_layouts` Table

```sql
-- Source: locked decision from 04-CONTEXT.md + RLS pattern from 20260227130000
-- Run with: npx supabase db query --linked -f supabase/migrations/20260429_user_widget_layouts.sql
-- NEVER: npx supabase db push

CREATE TABLE IF NOT EXISTS user_widget_layouts (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hub_id      TEXT        NOT NULL,
  breakpoint  TEXT        NOT NULL CHECK (breakpoint IN ('desktop', 'mobile')),
  widgets     JSONB       NOT NULL DEFAULT '[]',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, hub_id, breakpoint)
);

CREATE INDEX IF NOT EXISTS idx_uwl_user_hub ON user_widget_layouts(user_id, hub_id);

ALTER TABLE user_widget_layouts ENABLE ROW LEVEL SECURITY;

-- updated_at trigger (conflict detection per Pitfall 5 / locked decision)
CREATE OR REPLACE FUNCTION update_uwl_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_uwl_updated_at ON user_widget_layouts;
CREATE TRIGGER trg_uwl_updated_at
  BEFORE UPDATE ON user_widget_layouts
  FOR EACH ROW EXECUTE FUNCTION update_uwl_timestamp();

-- 4 RLS policies — pattern from 20260227130000 (auth.uid() = user_id)
-- Use DO block to avoid error if policies already exist
DO $$ BEGIN
  CREATE POLICY "Users can select own layouts" ON user_widget_layouts
    FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert own layouts" ON user_widget_layouts
    FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own layouts" ON user_widget_layouts
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete own layouts" ON user_widget_layouts
    FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
```

### `useWidgetLayout` Hook Skeleton

```typescript
// Source: locked decisions from 04-CONTEXT.md + Phase 3 useJobsokHubSummary pattern
export function useWidgetLayout(hubId: HubId) {
  const { user } = useAuth()
  const userId = user?.id ?? ''
  const breakpoint = useBreakpoint()
  const queryClient = useQueryClient()
  const queryKey = ['user-widget-layouts', userId, hubId, breakpoint] as const

  const query = useQuery({
    queryKey,
    enabled: !!userId,
    staleTime: Infinity,                   // layout only changes on user action
    queryFn: async () => {
      const { data } = await supabase
        .from('user_widget_layouts')
        .select('widgets, updated_at')
        .eq('user_id', userId)
        .eq('hub_id', hubId)
        .eq('breakpoint', breakpoint)
        .maybeSingle()
      const persisted = (data?.widgets as WidgetLayoutItem[] | null) ?? []
      const defaultLayout = getDefaultLayout(hubId, breakpoint)
      return { widgets: mergeLayouts(persisted, defaultLayout), updated_at: data?.updated_at ?? null }
    },
  })

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const mutation = useMutation({
    mutationFn: async (widgets: WidgetLayoutItem[]) => {
      const { error } = await supabase.from('user_widget_layouts').upsert(
        { user_id: userId, hub_id: hubId, breakpoint, widgets },
        { onConflict: 'user_id,hub_id,breakpoint' }
      )
      if (error) throw error
    },
    onMutate: async (newWidgets) => {
      await queryClient.cancelQueries({ queryKey })
      const snapshot = queryClient.getQueryData(queryKey)
      queryClient.setQueryData(queryKey, (old: typeof query.data) =>
        old ? { ...old, widgets: newWidgets } : old
      )
      return { snapshot }
    },
    onError: (_err, _vars, context) => {
      if (context?.snapshot) queryClient.setQueryData(queryKey, context.snapshot)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  })

  const saveDebounced = useCallback((widgets: WidgetLayoutItem[]) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => mutation.mutate(widgets), 1000)
  }, [mutation])

  // Flush on tab close
  useEffect(() => {
    const flush = () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
        // synchronous save not possible in beforeunload — rely on persisted optimistic state
      }
    }
    window.addEventListener('beforeunload', flush)
    return () => window.removeEventListener('beforeunload', flush)
  }, [])

  return { layout: query.data?.widgets ?? [], isLoading: query.isLoading, saveDebounced, mutation }
}
```

### `defaultLayouts.ts` Extension

```typescript
// Extend signature: add breakpoint param (backward-compatible default)
export function getDefaultLayout(
  hubId: HubId,
  breakpoint: 'desktop' | 'mobile' = 'desktop'
): WidgetLayoutItem[] {
  // Mobile default: same widgets but sizes capped at M (L→M, XL→M)
  const base = desktopDefaults[hubId]
  if (breakpoint === 'mobile') {
    return base.map(item => ({
      ...item,
      size: (item.size === 'L' || item.size === 'XL') ? 'M' : item.size,
    }))
  }
  return base
}
```

### Widget.Header — Hide-Button Extension

```typescript
// Extend WidgetContextValue with onHide
// In Widget.Header render:
{editMode && onHide && (
  <button
    type="button"
    onClick={onHide}
    aria-label={`Dölj widget ${title}`}
    className={[
      'w-[18px] h-[18px] flex items-center justify-center',
      'rounded-[5px] text-[var(--stone-500)]',
      'hover:bg-[var(--stone-150)] hover:text-[var(--stone-800)]',
      'focus:outline-none focus:shadow-[0_0_0_3px_var(--c-bg),0_0_0_4px_var(--c-solid)]',
    ].join(' ')}
  >
    <X size={12} aria-hidden="true" />
  </button>
)}
```

### HiddenWidgetsPanel — Återvisa + Reset

```typescript
// Dropdown from "Anpassa vy" button
// Key a11y: role="dialog" or role="menu"? Use role="region" + aria-label
// Auto-close: useEffect with document click listener + Escape key
// Reset: useConfirmDialog().confirm({ variant: 'warning', title: 'Återställ layout?', message: 'Är du säker? ...' })
```

### `mergeLayouts` Function

```typescript
export function mergeLayouts(
  persisted: WidgetLayoutItem[],
  defaultLayout: WidgetLayoutItem[]
): WidgetLayoutItem[] {
  const validIds = new Set(Object.keys(WIDGET_REGISTRY))
  const persistedMap = new Map(persisted.map(w => [w.id, w]))
  // Keep persisted entries that are still in registry (removes deleted widgets)
  const valid = persisted.filter(w => validIds.has(w.id))
  // Append default entries for widgets not yet in persisted layout
  const appended = defaultLayout
    .filter(w => !persistedMap.has(w.id))
    .map(w => ({ ...w, visible: true }))
  return [...valid, ...appended]
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `localStorage` for layout | Supabase `user_widget_layouts` | Phase 4 | Cross-device sync (CUST-03) |
| Hub-local `sizes` state (Phase 2/3 `useState`) | Persisted `widgets` array with `size` + `visible` | Phase 4 | Sizes survive across sessions |
| All widgets always rendered | Filter by `visible: false` before rendering | Phase 4 | Users control their own view |
| `getDefaultLayout(hubId)` returns desktop-only | `getDefaultLayout(hubId, breakpoint)` | Phase 4 | Per-breakpoint defaults prevent mobile layout clobber |

**No longer valid for Phase 4:**
- `editMode={false}` hardcoded in `JobsokHub.tsx` (line 69) — must become dynamic state
- `sizes` local `useState` in `JobsokHub.tsx` — replaced by `useWidgetLayout` layout items

---

## Open Questions

1. **Is `ConfirmDialogProvider` already in app root?**
   - What we know: `ConfirmDialog.tsx` exists and `useConfirmDialog()` requires the provider. Not confirmed whether provider is in `App.tsx` or `main.tsx`.
   - What's unclear: Where exactly the provider is placed — needs a quick `grep` for `ConfirmDialogProvider` in `App.tsx` / `main.tsx` before Plan 3 (reset implementation).
   - Recommendation: Plan 1 pre-check task — read `App.tsx` and `main.tsx` to confirm scope. If not present, add it in the migration plan.

2. **`useBeforeUnload` flush strategy**
   - What we know: The debounced save cannot fire synchronously in `beforeunload` (async not awaitable). Optimistic update already reflects correct state in cache.
   - What's unclear: Whether to attempt a synchronous XHR (deprecated) or accept that the last sub-1000ms action may not persist if tab is abruptly closed.
   - Recommendation: Accept the 1000ms window as the documented trade-off. Document in `04-SUMMARY.md` as known behavior. Do not add synchronous XHR (too complex, browser-support unreliable).

3. **`updated_at` conflict detection — client-side implementation**
   - What we know: Schema has `updated_at` updated by trigger. The conflict rule is: if `server.updated_at > client.updated_at`, reject and re-fetch.
   - What's unclear: Client-side detection requires reading `updated_at` from Supabase after upsert and comparing. Supabase upsert returns the updated row — need to capture `updated_at` from response.
   - Recommendation: In `mutationFn`, read `data.updated_at` from upsert response. Store in query cache. On next mutation, compare timestamps. If mismatch, call `queryClient.invalidateQueries` instead of applying optimistic update. Phase 4 can implement a simplified version: re-fetch after every failed mutation (no timestamp comparison needed for v1.0).

---

## Validation Architecture

> `workflow.nyquist_validation` is absent from `.planning/config.json` (file contains only `_auto_chain_active: false`). Treating as enabled.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest + Testing Library (already configured) |
| Config file | `client/vitest.config.ts` |
| Quick run command | `cd client && npm run test:run -- src/components/widgets/` |
| Full suite command | `cd client && npm run test:run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CUST-01 | `mergeLayouts` appends missing widget, removes unknown widget | unit | `cd client && npm run test:run -- src/hooks/useWidgetLayout.test.ts` | ❌ Wave 0 |
| CUST-01 | Widget with `visible: false` not rendered in HubGrid | unit | `cd client && npm run test:run -- src/components/widgets/HubGrid.test.tsx` | ✅ (extend) |
| CUST-01 | Hide button has correct `aria-label`, calls `onHide`, fires `aria-live` announcement | unit | `cd client && npm run test:run -- src/components/widgets/Widget.test.tsx` | ✅ (extend) |
| CUST-01 | "Återvisa" panel lists hidden widgets, clicking restores them | unit | `cd client && npm run test:run -- src/components/widgets/HiddenWidgetsPanel.test.tsx` | ❌ Wave 0 |
| CUST-02 | ConfirmDialog appears when reset clicked; on confirm, layout reverts to default | unit | `cd client && npm run test:run -- src/components/widgets/HiddenWidgetsPanel.test.tsx` | ❌ Wave 0 (same file) |
| CUST-02 | On cancel, layout unchanged | unit | same file | ❌ Wave 0 |
| CUST-03 | `useWidgetLayout` fetches from Supabase with correct query key incl. breakpoint | unit | `cd client && npm run test:run -- src/hooks/useWidgetLayout.test.ts` | ❌ Wave 0 |
| CUST-03 | Optimistic update applied on mutate; snapshot restored on `onError` | unit | same file | ❌ Wave 0 |
| CUST-03 | Upsert payload includes `(user_id, hub_id, breakpoint, widgets)` | unit (mock supabase) | same file | ❌ Wave 0 |
| CUST-03 | Migration verified: table exists, unique constraint holds, RLS select works | manual SQL | `npx supabase db query --linked "SELECT * FROM user_widget_layouts LIMIT 1;"` | N/A — manual |
| Pitfall 15 | `onVisibilityChange` not called more than once on initial mount | regression | `cd client && npm run test:run -- src/hooks/useWidgetLayout.test.ts` | ❌ Wave 0 |
| A11Y | Hide button keyboard-reachable, `aria-label` correct | unit | Widget.test.tsx extension | ✅ (extend) |
| A11Y | "Återvisa" panel closes on Escape and outside click | unit | HiddenWidgetsPanel.test.tsx | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `cd client && npm run test:run -- src/components/widgets/ src/hooks/useWidgetLayout.test.ts`
- **Per wave merge:** `cd client && npm run test:run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Migration Verification (manual — no live DB in CI)

```bash
# After running migration:
npx supabase db query --linked "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'user_widget_layouts';" --output table
# Expect: id, user_id, hub_id, breakpoint, widgets, created_at, updated_at

npx supabase db query --linked "SELECT indexname FROM pg_indexes WHERE tablename = 'user_widget_layouts';" --output table
# Expect: idx_uwl_user_hub + primary key index + unique constraint index

npx supabase db query --linked "SELECT policyname FROM pg_policies WHERE tablename = 'user_widget_layouts';" --output table
# Expect: 4 policies (select, insert, update, delete)
```

### Wave 0 Gaps (files needed before implementation)

- [ ] `client/src/hooks/useWidgetLayout.test.ts` — covers CUST-03 (query key, upsert payload, optimistic rollback, Pitfall 15 re-render guard)
- [ ] `client/src/components/widgets/HiddenWidgetsPanel.test.tsx` — covers CUST-01 (panel lists hidden, restore works), CUST-02 (confirm dialog appears, cancel preserves)
- [ ] `client/src/components/widgets/JobsokLayoutContext.tsx` — context file (parallel to JobsokDataContext, not a test file but needed in Wave 0)

Extensions to existing test files (not new files):
- [ ] `Widget.test.tsx` — add cases: hide button rendered when `editMode=true` + `onHide` provided; `aria-label` correct; `aria-label` absent when `editMode=false`
- [ ] `HubGrid.test.tsx` — add case: slot with `visible: false` item not rendered (filter applied at hub level; test via `JobsokHub` integration test or mock layout)

---

## Sources

### Primary (HIGH confidence — verified against actual codebase)

- `client/src/components/widgets/Widget.tsx` — existing compound component API; `WidgetContextValue` shape; `editMode` prop flow
- `client/src/components/widgets/HubGrid.tsx` — existing Slot/Section compound; where visibility filter belongs
- `client/src/components/widgets/JobsokDataContext.tsx` — peer-context pattern to replicate for `JobsokLayoutContext`
- `client/src/hooks/useJobsokHubSummary.ts` — React Query `useQuery` pattern, `queryKey` conventions, `staleTime: 60_000`, `queryClient.setQueryData` cache-share
- `client/src/components/widgets/defaultLayouts.ts` — `getDefaultLayout(hubId)` signature to extend with `breakpoint`
- `client/src/components/widgets/registry.ts` — `WIDGET_REGISTRY` keys (8 widgets), `WidgetId` type, used in `mergeLayouts`
- `client/src/pages/hubs/JobsokHub.tsx` — provider order, `sizes` state to replace, `editMode={false}` hardcoding to fix, existing `aria-live` region location (line 51)
- `client/src/components/ui/ConfirmDialog.tsx` — `useConfirmDialog()` hook API, `ConfirmDialogProvider` requirement, `variant: 'warning'` existence, focus trap integration
- `client/vitest.config.ts` — test runner, jsdom, `npm run test:run` command
- `.planning/phases/04-layout-persistence-hide-show/04-CONTEXT.md` — all locked decisions
- `.planning/research/PITFALLS.md` — Pitfalls 5, 6, 7, 15 (exact prevention strategies)
- `supabase/migrations/20260227130000_add_new_features.sql` — RLS policy pattern; `DROP POLICY IF EXISTS` antipattern (Phase 4 must avoid)
- `.planning/config.json` — `nyquist_validation` absent → treat as enabled

### Secondary (MEDIUM confidence)

- Phase 2 `02-UI-SPEC.md` — Size toggle group a11y pattern (`aria-pressed`, `role="group"`, focus ring spec) — directly applicable to hide-button
- Phase 3 `03-CONTEXT.md` — Established React Query defaults (`staleTime 60s`, `retry 1`, `refetchOnWindowFocus false`)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already installed; no new dependencies introduced
- Architecture patterns: HIGH — direct extension of Phase 2/3 established patterns; verified against actual code
- Migration SQL: HIGH — pattern verified against `20260227130000_add_new_features.sql`; idempotent form verified
- Pitfalls: HIGH — grounded in PITFALLS.md which was derived from actual codebase analysis
- Test strategy: HIGH — existing vitest setup confirmed; existing test files read and understood

**Research date:** 2026-04-28
**Valid until:** 2026-05-28 (stable — no fast-moving dependencies; all libraries already locked to project versions)
