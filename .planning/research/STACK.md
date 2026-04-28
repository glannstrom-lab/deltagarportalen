# Stack Research

**Domain:** Hub-navigation + resizable widget system for existing Swedish job-seeking portal
**Researched:** 2026-04-28
**Confidence:** HIGH (core grid lib), HIGH (schema), MEDIUM (SVG sparklines)

---

## Context: What Already Exists

The following are already installed and must NOT be re-added:

| Already present | Version | Notes |
|-----------------|---------|-------|
| react | ^19.2.0 | Locked |
| framer-motion | ^12.36.0 | Use for widget enter/exit animations |
| zustand | ^5.0.11 | Sufficient for hub state (active hub, edit mode) |
| @tanstack/react-query | ^5.90.21 | Widget data fetching |
| lucide-react | ^0.574.0 | All icons available |
| tailwindcss | ^4.2.0 | Token-based design system already in place |
| @supabase/supabase-js | ^2.97.0 | Layout persistence target |

**recharts is NOT installed.** The mock sparkline in the HTML sketch is 8 lines of raw `<polyline>` SVG — that is the recommended approach for this milestone (see Supporting Libraries below).

---

## Recommended Stack Additions

### Core Technology

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| react-grid-layout | ^2.2.3 | Drag, resize, responsive breakpoints for widget grid | Purpose-built for this exact use case. v2 is a full TypeScript rewrite (Dec 2025) — native types, hooks API, React 18+ required (React 19 works, peerDeps specify `>= 16.3.0` so no conflict). Battle-tested at scale (iLert dashboards, Grafana-style UIs). dnd-kit lacks built-in resize; gridstack.js has poor React DX. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-resizable (peer) | auto-installed with rgl | Resize handle rendering | Installed automatically as dependency of react-grid-layout; do not install separately |
| Hand-rolled SVG sparkline | n/a (no package) | Trend line in interview score widget and similar | A `<polyline>` over normalized data points is ~15 lines. No recharts needed. Keeps bundle lean. Use when widget shows a trend over time (score history, applications over weeks). |

**What NOT to add:**
- recharts — overkill for S/M/L widget sparklines; adds ~160 KB; hand-rolled SVG covers every sparkline in the mockup
- react-mosaic — Electron-style tiling editor, wrong UX model for this portal (users are vulnerable, not power users)
- react-beautiful-dnd / @hello-pangea/dnd — drag-only, no resize
- swapy — swaps positions only (no resize, no persist API), designed for portfolio/landing pages not dashboards
- gridstack.js — framework-agnostic jQuery-era library, poor TypeScript DX, requires manual React lifecycle wiring

---

## react-grid-layout: Integration Details

### Installation

```bash
npm install react-grid-layout
# react-resizable is a dependency and installs automatically
```

### Required CSS Imports (critical — grid breaks without these)

Add both to `client/src/main.tsx` (or the entry CSS bundle):

```typescript
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
```

These provide the drag placeholder background and the resize handle hit area. They are minimal (~1 KB combined) and do not conflict with Tailwind 4.

### v2 API Basics

v2 ships full TypeScript. No `@types/react-grid-layout` needed.

**Width measurement (required in v2 — WidthProvider is gone):**
```typescript
import { useContainerWidth } from "react-grid-layout";

const { width, containerRef, mounted } = useContainerWidth();
```

**Basic grid:**
```typescript
import ReactGridLayout, { Layout } from "react-grid-layout";

<div ref={containerRef}>
  <ReactGridLayout
    width={width}
    layout={layout}          // Layout[] from Supabase or defaults
    cols={4}
    rowHeight={150}
    margin={[14, 14]}
    onLayoutChange={(newLayout) => persistLayout(newLayout)}
    draggableHandle=".widget-drag-handle"  // Prevent accidental drag on inputs
  >
    {widgets.map(w => <div key={w.i}>{...}</div>)}
  </ReactGridLayout>
</div>
```

**Layout item shape** (maps directly to Supabase JSONB):
```typescript
type Layout = {
  i: string;   // widget id, e.g. "cv", "job-search"
  x: number;   // col position (0–3 for 4-col grid)
  y: number;   // row position
  w: number;   // col span: S=1, M=2, L=2 (2 rows), XL=4
  h: number;   // row span: S=1, M=1, L=2, XL=1
  static?: boolean;  // lock a widget (onboarding card)
  minW?: number;
  maxW?: number;
}
```

**Legacy API** (if you want v1 class-component style during migration):
```typescript
import ReactGridLayout from "react-grid-layout/legacy";
```

### React 19 Compatibility: CONFIRMED

- `peerDependencies` in package.json: `"react": ">= 16.3.0"` — React 19 is within range.
- v2.2.3 released March 2026 against a React 18+ baseline. React 19 uses the same API surface.
- The `react-grid-layout-19` fork (0 stars, no releases) was created speculatively and should NOT be used.
- The only reported React 19 warning (missing `key` prop, issue #2045, May 2024) is a v1 issue predating the v2 TypeScript rewrite.

### Tailwind 4 Compatibility

react-grid-layout adds two class names to its elements (`.react-grid-item`, `.react-resizable-handle`). These are not Tailwind utilities and do not conflict. The CSS import handles them. You can safely add Tailwind classes to the wrapper divs and widget content.

---

## Supabase Schema Addition

### New Table: `user_widget_layouts`

**Rationale for new table (not extending `user_preferences`):**
`user_preferences` already has `dashboard_widget_config` (simple `[{id, size}]` list). The hub system needs a richer structure: one layout record per user per hub, containing a full `react-grid-layout` Layout array. Storing this in a separate table keeps concerns clean and avoids bloating the existing preferences row.

### Migration SQL

```sql
-- ============================================
-- Hub widget layouts (react-grid-layout persist)
-- ============================================
CREATE TABLE IF NOT EXISTS user_widget_layouts (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hub_id      TEXT        NOT NULL,            -- 'oversikt' | 'soka-jobb' | 'karriar' | 'resurser' | 'min-vardag'
  layout      JSONB       NOT NULL DEFAULT '[]'::jsonb,  -- Layout[] from react-grid-layout
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (user_id, hub_id)                     -- one row per user per hub
);

-- Index for the common query pattern: WHERE user_id = $1 AND hub_id = $2
CREATE INDEX IF NOT EXISTS idx_user_widget_layouts_user_hub
  ON user_widget_layouts (user_id, hub_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION touch_user_widget_layouts()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_user_widget_layouts_updated_at
  BEFORE UPDATE ON user_widget_layouts
  FOR EACH ROW EXECUTE FUNCTION touch_user_widget_layouts();
```

### RLS Policies

```sql
ALTER TABLE user_widget_layouts ENABLE ROW LEVEL SECURITY;

-- SELECT: users read only their own layouts
CREATE POLICY "select_own_widget_layouts"
  ON user_widget_layouts FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: users can only insert rows for themselves
CREATE POLICY "insert_own_widget_layouts"
  ON user_widget_layouts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: users can only update their own rows
CREATE POLICY "update_own_widget_layouts"
  ON user_widget_layouts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: allow users to reset their layout
CREATE POLICY "delete_own_widget_layouts"
  ON user_widget_layouts FOR DELETE
  USING (auth.uid() = user_id);
```

### Column Types Rationale

| Column | Type | Why |
|--------|------|-----|
| `id` | UUID / gen_random_uuid() | Consistent with all other tables in this project |
| `user_id` | UUID / FK to auth.users | Standard pattern, CASCADE delete removes layouts on account deletion (GDPR) |
| `hub_id` | TEXT | Enum-like but stored as text; simpler than a Postgres ENUM since hub names may evolve. Use a CHECK constraint if you want enforcement: `CHECK (hub_id IN ('oversikt','soka-jobb','karriar','resurser','min-vardag'))` |
| `layout` | JSONB | react-grid-layout Layout[] is naturally JSON. JSONB enables indexing if needed later (GIN index on layout for widget id queries). NOT NULL with `'[]'` default so missing data is never null |
| `updated_at` | TIMESTAMPTZ | Enables stale-while-revalidate caching on the client: fetch only if `updated_at > lastKnownAt` |
| `created_at` | TIMESTAMPTZ | Audit trail |
| UNIQUE (user_id, hub_id) | — | Enforces one layout per hub per user; enables UPSERT pattern |

### Client UPSERT Pattern

```typescript
// Persist layout after drag/resize (debounce 800ms)
const persistLayout = useDebouncedCallback(async (hubId: string, layout: Layout[]) => {
  await supabase
    .from("user_widget_layouts")
    .upsert(
      { user_id: userId, hub_id: hubId, layout },
      { onConflict: "user_id,hub_id" }
    );
}, 800);
```

---

## Alternatives Considered

| Recommended | Alternative | Why Not |
|-------------|-------------|---------|
| react-grid-layout v2 | dnd-kit + custom grid | dnd-kit has no built-in resize — you'd implement a full resizable grid yourself. Months of work for functionality rgl ships on install. |
| react-grid-layout v2 | swapy | Swap-only (no resize, no position persist API, no responsive breakpoints). Designed for landing page portfolio rearrangement, not dashboard widgets. |
| react-grid-layout v2 | gridstack.js | jQuery-era library, framework-agnostic, requires `useEffect` mounting dance and manual cleanup. Poor TypeScript experience. Not idiomatic React. |
| react-grid-layout v2 | react-mosaic | Tiling window manager (Electron-style). Overwhelming UX for this portal's target audience (cognitively demanding for users with NPF/fatigue). |
| Hand-rolled SVG sparkline | recharts | recharts adds ~160 KB for three `<polyline>` graphs. Requires `react-is` override for React 19 (peer dep conflict). The mockup's sparklines are 8-point polylines — no recharts feature is needed. |
| user_widget_layouts table | Extend user_preferences | user_preferences already has dashboard_widget_config for legacy widget sizes. Mixing hub layouts there bloats the row and couples unrelated concerns. |

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| react-grid-layout ^2.2.3 | react ^19.2.0 | peerDeps `>= 16.3.0`; React 19 confirmed compatible |
| react-grid-layout ^2.2.3 | tailwindcss ^4.2.0 | No conflict; rgl CSS uses `.react-grid-*` namespace |
| react-grid-layout ^2.2.3 | framer-motion ^12.36.0 | No conflict; use framer-motion for widget mount/unmount animations outside the rgl grid item |
| react-grid-layout ^2.2.3 | typescript ~5.9.3 | v2 ships native types; no @types package needed |
| react-grid-layout ^2.2.3 | vite ^7.3.1 | ESM build; no UMD. Vite handles it natively |

---

## What NOT to Add

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| @types/react-grid-layout | Obsolete — v2 ships native types | Nothing (types included) |
| react-grid-layout/legacy | Only for v1 API compatibility; adds dead code | Use v2 API from the start |
| recharts / visx / react-sparklines | Adds 100–300 KB for what is 15 lines of SVG | Hand-rolled `<polyline>` component |
| react-resizable (direct install) | Auto-installed as rgl peer dep | Let npm resolve it |
| swapy | No resize, no persist, wrong UX model | react-grid-layout |
| react-grid-layout-19 (Censkh fork) | 0 stars, 0 releases, unmaintained | react-grid-layout@2.2.3 (works with React 19) |

---

## Sources

- https://github.com/react-grid-layout/react-grid-layout — README, CHANGELOG, peerDependencies verified (HIGH confidence)
- https://github.com/react-grid-layout/react-grid-layout/blob/master/CHANGELOG.md — v2.0.0 Dec 2025 TypeScript rewrite, v2.2.3 Mar 2026 (HIGH confidence)
- https://www.ilert.com/blog/building-interactive-dashboards-why-react-grid-layout-was-our-best-choice — alternatives comparison (MEDIUM confidence)
- https://github.com/recharts/recharts/issues/4558 — React 19 support status in recharts (HIGH confidence)
- https://supabase.com/docs/guides/database/postgres/row-level-security — RLS policy patterns (HIGH confidence)
- client/package.json — confirmed recharts not installed (HIGH confidence, direct file read)
- supabase/migrations/20260316_add_widget_config_column.sql — existing dashboard_widget_config in user_preferences (HIGH confidence, direct file read)

---
*Stack research for: hub-navigation + widget-system milestone, Deltagarportalen*
*Researched: 2026-04-28*
