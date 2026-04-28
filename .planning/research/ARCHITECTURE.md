# Architecture Research

**Domain:** Hub-navigation + widget system (subsequent milestone on Deltagarportalen)
**Researched:** 2026-04-28
**Confidence:** HIGH (all conclusions drawn from direct reading of App.tsx, Sidebar.tsx, Layout.tsx, navigation.ts, PageLayout.tsx, DESIGN.md, and nav-hub-sketch.html)

---

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│  App.tsx — Router root                                               │
│  RootRoute (/): Landing (guest) | Layout (auth)                     │
├─────────────────────────────────────────────────────────────────────┤
│  Layout.tsx — authenticated shell                                    │
│  ┌─────────────┐  ┌──────────────────────────────────────────────┐  │
│  │  Sidebar    │  │  <main> → <Outlet/>                          │  │
│  │  (desktop)  │  │  Hub pages + deep-link pages both render here│  │
│  └─────────────┘  └──────────────────────────────────────────────┘  │
│  MobileTopBar + MobileMainMenu (mobile, right-drawer)               │
├─────────────────────────────────────────────────────────────────────┤
│  New: Hub pages (5)          Existing: deep-link pages (27)         │
│  ┌──────────────────┐        ┌──────────────────────────────────┐   │
│  │  HubOverview /   │        │  /cv, /cover-letter,             │   │
│  │  JobsokHub       │        │  /job-search, /diary, etc.       │   │
│  │  KarriarHub      │        │  unchanged, stay routed          │   │
│  │  ResurserHub     │        └──────────────────────────────────┘   │
│  │  MinVardagHub    │                                                │
│  └──────────────────┘                                               │
├─────────────────────────────────────────────────────────────────────┤
│  Widget layer (new)                                                  │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌─────────────┐   │
│  │  Widget    │  │  Widget    │  │  Widget    │  │  Widget     │   │
│  │  (CV)      │  │  (JobSrch) │  │  (Apps)    │  │  (Wellness) │   │
│  │ React Query│  │ React Query│  │ React Query│  │ React Query │   │
│  │ own hook   │  │ own hook   │  │ own hook   │  │ own hook    │   │
│  └────────────┘  └────────────┘  └────────────┘  └─────────────┘   │
├─────────────────────────────────────────────────────────────────────┤
│  State layer                                                         │
│  Zustand stores (authStore, cvStore, profileStore, ...)             │
│  React Query cache (shared by widgets + deep-link pages)            │
│  useWidgetLayout(hubId) — new hook — Supabase + optimistic update   │
├─────────────────────────────────────────────────────────────────────┤
│  Data layer                                                          │
│  services/ (cvApi, applicationsApi, diaryApi, ...)                  │
│  /api/ai.js (Vercel) + supabase/functions/ (Deno edge)              │
│  Supabase (auth, DB with RLS)                                        │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 1. Routing Changes

### Concrete diff to App.tsx

The existing `<Route path="/" element={<RootRoute />}>` nesting structure is kept exactly as-is. The 27 existing routes under it stay untouched. Five new lazy-loaded hub pages are added as additional children of the root route.

**New lazy imports (add to the existing block):**

```typescript
const HubOverview   = lazy(() => import('./pages/hubs/HubOverview'))
const JobsokHub     = lazy(() => import('./pages/hubs/JobsokHub'))
const KarriarHub    = lazy(() => import('./pages/hubs/KarriarHub'))
const ResurserHub   = lazy(() => import('./pages/hubs/ResurserHub'))
const MinVardagHub  = lazy(() => import('./pages/hubs/MinVardagHub'))
```

**New routes (add inside the `<Route path="/" element={<RootRoute />}>` block, before the catch-all):**

```tsx
<Route path="oversikt"    element={<LazyRoute><HubOverview /></LazyRoute>} />
<Route path="jobb"        element={<LazyRoute><JobsokHub /></LazyRoute>} />
<Route path="karriar"     element={<LazyRoute><KarriarHub /></LazyRoute>} />
<Route path="resurser"    element={<LazyRoute><ResurserHub /></LazyRoute>} />
<Route path="min-vardag"  element={<LazyRoute><MinVardagHub /></LazyRoute>} />
```

**Should `/` become Översikt?**

Yes. The Dashboard page currently renders at the index route. Redirect it:

```tsx
<Route index element={<Navigate to="/oversikt" replace />} />
```

The existing `/dashboard` → `/` redirect chain still works: `/dashboard` → `/` → `/oversikt`. No user bookmark breaks.

**Path naming rationale:**

- Swedish paths (`/karriar`, `/min-vardag`) align with the existing convention in the codebase (`/spontanansökan`, `/nätverk`, `/externa-resurser`).
- `/oversikt` (not `/`) keeps the index redirect clean and gives the meta-hub a stable URL that can be bookmarked and deep-linked.
- Do not use Swedish characters with diacritics in path segments — `/karriar` not `/karriär`, `/oversikt` not `/översikt` — consistent with how the existing paths handle this (e.g. `/spontanansökan` is the one exception and it causes visible encoding issues in some browsers).

**Hub-to-deep-link relationship:** Hub pages are peers of deep-link pages in the router. There is no parent route wrapping only hubs. The existing `<Route path="/">` with `Layout` as parent is the correct shared parent. No new layout nesting layer is needed.

---

## 2. Navigation Refactor

### New `navigation.ts` shape

Replace `NavGroup` with `NavHub`. Keep `NavItem` interface unchanged. The `navItems` flat export and role-based admin/consultant exports stay.

```typescript
export type HubId = 'oversikt' | 'jobb' | 'karriar' | 'resurser' | 'min-vardag'

export interface NavHub {
  id: HubId
  path: string
  labelKey: string
  fallbackLabel: string
  /** Design domain — drives --c-* tokens in sidebar and on hub page */
  domain: 'action' | 'activity' | 'coaching' | 'info' | 'wellbeing'
  icon: React.ComponentType<{ className?: string }>
  /** Pages reachable via this hub (for breadcrumb and active-hub detection) */
  memberPaths: string[]
  items: NavItem[]  // deep-link children shown as sub-nav when hub is active
}
```

**Five hubs mapping existing 27 items:**

| Hub | id | path | domain | memberPaths (abbreviated) |
|-----|-----|------|--------|--------------------------|
| Översikt | oversikt | /oversikt | action | ['/'] (meta-hub, owns no leaf pages directly) |
| Söka jobb | jobb | /jobb | activity | /job-search, /applications, /spontanansökan, /cv, /cover-letter, /interview-simulator, /salary, /international, /linkedin-optimizer |
| Karriär | karriar | /karriar | coaching | /career, /interest-guide, /skills-gap-analysis, /personal-brand, /education |
| Resurser | resurser | /resurser | info | /knowledge-base, /resources, /print-resources, /externa-resurser, /ai-team, /help, /nätverk |
| Min vardag | min-vardag | /min-vardag | wellbeing | /wellness, /diary, /calendar, /exercises, /my-consultant, /profile |

The `navGroups` export becomes `navHubs: NavHub[]`. For backward compatibility with existing `navItems` usage (mobile menu iterates it), keep:

```typescript
export const navItems = navHubs.flatMap(hub => hub.items)
```

### Sidebar rendering: hubs vs sub-pages

Current sidebar renders 3 groups with their items all visible. New behavior:

- **Collapsed / no active hub:** Show 5 hub-level links only (icon + label). This replaces the 27-item list.
- **Active hub (current path is inside a hub's memberPaths):** Show hub links at top, then an indented sub-list of that hub's items below the active hub link.

This is the same pattern as Vercel and Linear sidebars: top-level sections, active one expands. The `data-domain` wrapper on each hub link drives `--c-*` tokens for that link's active state, matching current Sidebar behavior.

```tsx
// Sidebar rendering logic (pseudocode)
const activeHub = navHubs.find(hub =>
  hub.path === location.pathname ||
  hub.memberPaths.some(p => location.pathname === p || location.pathname.startsWith(p + '/'))
)

{navHubs.map(hub => (
  <div key={hub.id} data-domain={hub.domain}>
    <NavLink to={hub.path} icon={hub.icon} label={t(hub.labelKey)}
      isActive={activeHub?.id === hub.id} />
    {activeHub?.id === hub.id && (
      <div className="ml-4 border-l-2 border-[var(--c-accent)] pl-2 space-y-0.5">
        {hub.items.map(item => <NavLink key={item.path} ... />)}
      </div>
    )}
  </div>
))}
```

When collapsed (`isCollapsed=true`), render only the 5 hub icons — no sub-list. The existing collapse toggle and `w-[52px]` / `w-[220px]` sizing logic stays unchanged.

### Mobile nav: 5-tab bottom bar

The current `BottomBar` component exists but is a FAQ/help bar, not a navigation bar. For mobile, replace the hamburger menu pattern with a persistent 5-tab bar at the bottom:

- Component: `client/src/components/layout/HubBottomNav.tsx` (new)
- Renders only on mobile (`isMobile` from `useMobileOptimizer`)
- 5 tabs: Översikt, Söka jobb, Karriär, Resurser, Min vardag
- Active tab highlighted with `bg-[var(--c-bg)] text-[var(--c-text)]` per DESIGN.md tab rules
- `data-domain` on the active tab wrapper to get correct pastell
- Deep-link pages inside a hub keep the same tab highlighted (using `activeHub` detection above)
- Touch targets: minimum 44px height per WCAG requirement (already enforced in existing mobile nav)
- The existing `MobileMainMenu` hamburger drawer is kept as secondary navigation for accessing individual deep-link pages without going through the hub

In `Layout.tsx`, replace:
```tsx
{showBackButton && <MobileBackButton />}
{showBars && <BottomBar />}
```
with:
```tsx
{isMobile && showBars && <HubBottomNav />}
{showBackButton && <MobileBackButton />}
{showBars && !isMobile && <BottomBar />}
```

---

## 3. Widget Component Contract

### Props interface

```typescript
export type WidgetSize = 'S' | 'M' | 'L' | 'XL'

export interface WidgetProps {
  /** Unique stable identifier — used as key in layout persistence */
  id: string
  /** Current rendered size — controlled by hub layout engine */
  size: WidgetSize
  /** Called when user clicks a size toggle button */
  onSizeChange?: (newSize: WidgetSize) => void
  /** Allowed sizes for this widget (not all widgets support all sizes) */
  allowedSizes?: WidgetSize[]
  /** Whether the user is in customization mode (shows drag handles, size toggles) */
  editMode?: boolean
  className?: string
}
```

### Compound sub-components

```typescript
// Widget.tsx exports a compound component
const Widget = Object.assign(WidgetRoot, {
  Header: WidgetHeader,
  Body: WidgetBody,
  Footer: WidgetFooter,
})

// WidgetRoot — container with border, radius, domain-tinted hover
// WidgetHeader — icon + title + optional size toggle
// WidgetBody — flex-1 content area
// WidgetFooter — action buttons row (1-2 buttons max)
```

Usage pattern for a concrete widget:

```typescript
// widgets/CvWidget.tsx
export function CvWidget({ id, size, onSizeChange, editMode }: WidgetProps) {
  const { data } = useCvSummary()  // own React Query hook
  const { compact } = useWidgetSize(size)  // derived booleans

  return (
    <Widget id={id} size={size}>
      <Widget.Header
        icon={FileUser}
        title="CV"
        size={size}
        onSizeChange={onSizeChange}
        editMode={editMode}
      />
      <Widget.Body>
        {compact ? (
          <div className="kpi-mid">{data?.completionPercent}%</div>
        ) : (
          <CvProgressRing data={data} />
        )}
      </Widget.Body>
      {!compact && (
        <Widget.Footer>
          <Button size="sm" asChild><Link to="/cv">Fortsätt redigera</Link></Button>
        </Widget.Footer>
      )}
    </Widget>
  )
}
```

### `useWidgetSize()` hook

```typescript
export function useWidgetSize(size: WidgetSize) {
  return {
    isS:     size === 'S',
    isM:     size === 'M',
    isL:     size === 'L',
    isXL:    size === 'XL',
    compact: size === 'S',             // only KPI number, no body text
    minimal: size === 'S' || size === 'M',  // no visualization, no footer
  }
}
```

### Per-size rendering contract

| Size | Grid span | Row height | Content |
|------|-----------|------------|---------|
| S | span 1 col, 1 row | 150px | KPI number + label only. No footer. |
| M | span 2 col, 1 row | 150px | KPI + 2-3 lines context text. 1 footer action. |
| L | span 2 col, 2 rows | 314px (2×150+14) | Full visualization (ring, chart, list). Up to 2 footer actions. |
| XL | span 4 col, 1 row | 150px | Wide horizontal layout — useful for timelines, full lists. |

Grid: 4 columns desktop (from sketch), 2 columns tablet/mobile. `grid-auto-rows: 150px; gap: 14px`.

### Widget registry

```typescript
// widgets/registry.ts
export const WIDGET_REGISTRY: Record<string, {
  component: React.ComponentType<WidgetProps>
  defaultSize: WidgetSize
  allowedSizes: WidgetSize[]
  labelKey: string
  domain: string  // which hub(s) this widget belongs to
}> = {
  cv:           { component: CvWidget,           defaultSize: 'L', allowedSizes: ['S','M','L'] },
  cover-letter: { component: CoverLetterWidget,  defaultSize: 'M', allowedSizes: ['S','M','L'] },
  job-search:   { component: JobSearchWidget,    defaultSize: 'L', allowedSizes: ['M','L','XL'] },
  applications: { component: ApplicationsWidget, defaultSize: 'M', allowedSizes: ['S','M','L'] },
  ...
}
```

---

## 4. Data Flow for Widgets

### Each widget owns its React Query hook

```typescript
// hooks/useJobSearchSummary.ts
export function useJobSearchSummary() {
  return useQuery({
    queryKey: ['job-search', 'summary'],  // same key used in JobSearch page
    queryFn: () => jobSearchApi.getSummary(),
    staleTime: 2 * 60 * 1000,  // 2 min — job data changes frequently
  })
}
```

The `queryKey` must match what the full deep-link page uses. Because React Query deduplicates by key, when a user visits the hub (widget fetches `['job-search', 'summary']`) and then navigates to `/job-search`, the page reuses the cached data — no refetch unless stale. This is the existing pattern in the codebase (services/ + React Query) extended to widgets.

### Cache sharing rules

| Widget query key | Shares with | Stale time |
|-----------------|-------------|------------|
| `['cv', 'current']` | CVPage, CVBuilder | 5 min |
| `['job-search', 'summary']` | JobSearch page | 2 min |
| `['applications', 'list']` | Applications page | 2 min |
| `['diary', 'recent']` | Diary page | 5 min |
| `['wellness', 'latest']` | Wellness page | 5 min |
| `['cover-letter', 'list']` | CoverLetterPage | 5 min |

Widgets should NOT introduce new query keys for data the deep-link page already fetches. The key naming convention is `[feature, dataType]`, consistent with existing service layer.

### Widget-level loading/error states

Each widget handles its own `isLoading` and `isError` from `useQuery`. The Widget.Body renders a skeleton or compact error state inline — no global loading blocker. This means hubs render progressively as widget data arrives.

---

## 5. Layout Persistence Layer

### Supabase table

```sql
CREATE TABLE user_widget_layouts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hub_id      TEXT NOT NULL,  -- 'jobb' | 'karriar' | 'resurser' | 'min-vardag' | 'oversikt'
  layout      JSONB NOT NULL DEFAULT '[]',
  -- layout: Array<{ id: string, size: 'S'|'M'|'L'|'XL', order: number }>
  hidden_ids  TEXT[] NOT NULL DEFAULT '{}',
  -- Per-breakpoint override: { mobile: [...], tablet: [...], desktop: [...] }
  -- Only populated if user explicitly customizes a breakpoint
  breakpoints JSONB NOT NULL DEFAULT '{}',
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, hub_id)
);

-- RLS: users can only read/write their own rows
ALTER TABLE user_widget_layouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users own their layouts" ON user_widget_layouts
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

Note: react-grid-layout stores x/y/w/h per widget. If drag-and-drop is Phase 4, the `layout` column can start as a simple ordered array (Phase 2-3) and be migrated to react-grid-layout's GridItemLayout schema in Phase 4. The JSONB column is schema-flexible enough for this without a migration.

### `useWidgetLayout` hook

```typescript
interface WidgetLayoutItem {
  id: string        // widget registry key
  size: WidgetSize
  order: number
}

interface UseWidgetLayoutReturn {
  layout: WidgetLayoutItem[]
  hiddenIds: Set<string>
  isLoading: boolean
  setItemSize: (widgetId: string, size: WidgetSize) => void
  setOrder: (orderedIds: string[]) => void
  toggleHidden: (widgetId: string) => void
  resetLayout: () => void
}

export function useWidgetLayout(hubId: HubId): UseWidgetLayoutReturn {
  const { data, isLoading } = useQuery({
    queryKey: ['widget-layout', hubId],
    queryFn: () => widgetLayoutApi.getLayout(hubId),
    staleTime: Infinity,  // layout only changes on explicit user action
    placeholderData: () => getDefaultLayout(hubId),  // never shows empty
  })

  const queryClient = useQueryClient()

  const persist = useMemo(
    () => debounce((patch: Partial<WidgetLayoutRow>) =>
      widgetLayoutApi.upsertLayout(hubId, patch), 800),
    [hubId]
  )

  const setItemSize = useCallback((widgetId: string, size: WidgetSize) => {
    // 1. Optimistic update — update query cache immediately
    queryClient.setQueryData(['widget-layout', hubId], (old: WidgetLayoutRow) => ({
      ...old,
      layout: old.layout.map(item =>
        item.id === widgetId ? { ...item, size } : item
      )
    }))
    // 2. Debounced write to Supabase
    persist({ layout: /* updated layout */ })
  }, [hubId, queryClient, persist])

  // setOrder, toggleHidden, resetLayout follow same pattern

  return { layout: data?.layout ?? getDefaultLayout(hubId), hiddenIds: ..., isLoading, setItemSize, ... }
}
```

Key implementation notes:
- `placeholderData` returns the hub's default layout so the hub renders immediately without skeleton for first-time users.
- Debounce at 800ms: rapid size changes (user clicking S/M/L) emit a single write.
- On network error during persist: the optimistic update stays visible (not reverted). On next load, the server value wins. This is acceptable — layout preference loss on network failure is low severity.

### Default layouts per hub

```typescript
// widgets/defaultLayouts.ts
export function getDefaultLayout(hubId: HubId): WidgetLayoutItem[] {
  const defaults: Record<HubId, WidgetLayoutItem[]> = {
    jobb: [
      { id: 'cv',           size: 'L', order: 0 },
      { id: 'cover-letter', size: 'M', order: 1 },
      { id: 'interview',    size: 'M', order: 2 },
      { id: 'job-search',   size: 'L', order: 3 },
      { id: 'applications', size: 'M', order: 4 },
      { id: 'spontaneous',  size: 'S', order: 5 },
      { id: 'salary',       size: 'M', order: 6 },
      { id: 'international',size: 'S', order: 7 },
    ],
    karriar: [
      { id: 'career',         size: 'L', order: 0 },
      { id: 'interest-guide', size: 'M', order: 1 },
      { id: 'skills-gap',     size: 'M', order: 2 },
      { id: 'personal-brand', size: 'M', order: 3 },
      { id: 'education',      size: 'M', order: 4 },
    ],
    resurser: [ /* knowledge-base, ai-team, resources, print-resources, ... */ ],
    'min-vardag': [ /* wellness, diary, calendar, exercises, my-consultant */ ],
    oversikt: [ /* summary widgets for each of the 4 hubs + onboarding checklist */ ],
  }
  return defaults[hubId]
}
```

### Per-breakpoint layouts

For Phase 4, the `breakpoints` JSONB column holds overrides:

```typescript
type BreakpointLayouts = {
  mobile?:  WidgetLayoutItem[]  // user explicitly customized mobile
  tablet?:  WidgetLayoutItem[]
  desktop?: WidgetLayoutItem[]
}
```

Until a breakpoint is explicitly customized, the hook applies automatic size reduction:
- Desktop L → Tablet M → Mobile S (one step down per breakpoint)
- Desktop M → stays M on tablet, becomes S on mobile

This keeps the responsive behavior automatic by default and only requires the `breakpoints` column when user overrides it.

---

## 6. Customization UI

### Hub toolbar (per hub, not global)

Location: inside the hub page's `PageHeader` actions prop (already a slot in `PageLayout`).

```tsx
<PageLayout
  title="Söka Jobb"
  domain="activity"
  actions={
    <HubToolbar
      hubId="jobb"
      onAddWidget={...}
      onToggleEditMode={...}
      editMode={editMode}
    />
  }
>
```

`HubToolbar` renders:
- **"Anpassa vy"** button (ghost) — toggles `editMode` state local to hub page
- **"+ Lägg till widget"** button (ghost) — opens `AddWidgetSheet` (a slide-over panel listing hidden/available widgets)

### Edit mode behavior

When `editMode=true`:
- All widgets show drag handles (Phase 4: react-grid-layout `isDraggable=true`)
- All widgets show size toggles (visible permanently, not only on hover)
- Each widget shows a hide button ("×" in corner)
- A "Spara layout" / "Återställ" bar appears at the bottom of the page (sticky footer)

For Phase 2-3 (before drag/resize), edit mode only enables size toggles and hide/show — no drag. This lets us ship the customization UX early.

### Add widget flow

`AddWidgetSheet` shows all widgets for the hub that are currently hidden. Each item has an "Lägg till" button. Clicking it calls `toggleHidden(widgetId)` from `useWidgetLayout`, which optimistically removes it from `hiddenIds` and persists debounced.

### Reset layout

"Återställ" calls `resetLayout()` which:
1. Sets query cache to `getDefaultLayout(hubId)` immediately
2. Calls `widgetLayoutApi.deleteLayout(hubId)` (DELETE row from Supabase)
3. Next load falls back to `placeholderData` (default layout)

---

## 7. Översikt as Meta-Hub

Översikt (`/oversikt`) is architecturally different from the 4 domain hubs:

- It does not aggregate deep-link pages into widgets in the same domain.
- It shows **summary widgets** — one mini-card per hub — each pulling a tiny summary query.
- It also shows the **onboarding checklist** (existing `GettingStartedChecklist` component).
- It has the `action` domain (mint/turkos) matching the existing Dashboard which it replaces.

Summary widget pattern:

```typescript
// Each hub summary widget is a lightweight read-only card
// It does NOT use useWidgetLayout — Översikt layout is fixed (not user-customizable in v1)
function JobsokSummaryWidget() {
  const { data } = useJobsokHubSummary()  // lightweight query: active applications count, last CV edit, etc.
  return (
    <SummaryCard
      title="Söka Jobb"
      domain="activity"
      href="/jobb"
      stats={[
        { label: 'Aktiva ansökningar', value: data?.activeApplications },
        { label: 'Nya jobbträffar', value: data?.newMatches },
      ]}
    />
  )
}
```

Implication for layout persistence: Översikt's layout row exists in `user_widget_layouts` for future customizability, but in Phase 2 the hub page renders a fixed grid of 4 summary cards + onboarding. The `useWidgetLayout('oversikt')` hook can be introduced in Phase 5 when personalizing it becomes relevant.

---

## Recommended File Structure

New files only (all existing files unchanged):

```
client/src/
├── pages/
│   └── hubs/
│       ├── HubOverview.tsx         # /oversikt — meta-hub
│       ├── JobsokHub.tsx           # /jobb
│       ├── KarriarHub.tsx          # /karriar
│       ├── ResurserHub.tsx         # /resurser
│       └── MinVardagHub.tsx        # /min-vardag
├── components/
│   ├── layout/
│   │   └── HubBottomNav.tsx        # Mobile 5-tab nav (replaces hamburger for hub-level nav)
│   └── widgets/
│       ├── Widget.tsx              # Base compound component (Root, Header, Body, Footer)
│       ├── registry.ts             # Widget registry map
│       ├── defaultLayouts.ts       # getDefaultLayout(hubId)
│       ├── HubGrid.tsx             # Grid container + react-grid-layout wrapper (Phase 4)
│       ├── HubToolbar.tsx          # "Anpassa vy" + "Lägg till widget" in hub header
│       ├── AddWidgetSheet.tsx      # Slide-over panel for adding hidden widgets
│       │
│       │   # Concrete widgets (one file each):
│       ├── CvWidget.tsx
│       ├── CoverLetterWidget.tsx
│       ├── InterviewWidget.tsx
│       ├── JobSearchWidget.tsx
│       ├── ApplicationsWidget.tsx
│       ├── SpontaneousWidget.tsx
│       ├── SalaryWidget.tsx
│       ├── CareerWidget.tsx
│       ├── WellnessWidget.tsx
│       ├── DiaryWidget.tsx
│       ├── CalendarWidget.tsx
│       └── ... (remaining widgets)
├── hooks/
│   ├── useWidgetLayout.ts          # Layout persistence hook
│   ├── useWidgetSize.ts            # size → { compact, minimal, ... }
│   │   # Widget-specific summary hooks (shared with deep-link pages via same query key):
│   ├── useCvSummary.ts
│   ├── useJobSearchSummary.ts
│   ├── useApplicationsSummary.ts
│   └── ...
└── services/
    └── widgetLayoutApi.ts          # getLayout / upsertLayout / deleteLayout → Supabase
```

---

## Architectural Patterns

### Pattern 1: Shared Query Key Between Widget and Deep-Link Page

**What:** Widget and its corresponding full page both use the same `useQuery` hook with the same `queryKey`.
**When to use:** Always, for every widget. This is the core caching contract.
**Trade-offs:** Requires coordinating query keys between two teams/files, but yields zero redundant fetches and instant page transitions.

```typescript
// useCvSummary.ts — used by BOTH CvWidget and CVPage
export const CV_SUMMARY_KEY = ['cv', 'current'] as const

export function useCvSummary() {
  return useQuery({
    queryKey: CV_SUMMARY_KEY,
    queryFn: cvApi.getCurrentCv,
    staleTime: 5 * 60 * 1000,
  })
}
```

If `CVPage` currently has inline `useQuery` calls with different keys, they must be migrated to this shared hook in Phase 3 (not Phase 2) — that refactor is a prerequisite for cache sharing.

### Pattern 2: Optimistic Layout Updates with Debounced Persist

**What:** User changes widget size → UI updates immediately → write to Supabase fires 800ms later.
**When to use:** All layout mutations (size change, order change, hide/show, reset).
**Trade-offs:** Layout can diverge from DB if user closes tab within 800ms debounce window. Acceptable for preference data.

### Pattern 3: Hub Domain as `data-domain` Wrapper

**What:** Each hub page sets `data-domain` at its root (via `PageLayout`'s existing `domain` prop), driving all `--c-*` CSS tokens for the entire page including widgets.
**When to use:** Hub pages use the domain of their primary content (see table in navigation refactor section).
**Trade-offs:** All widgets inside a hub share the same domain colour. Individual widgets don't override domain — they inherit it. This is intentional per DESIGN.md: "Konsekvent färg — hela hubben använder activity-pasteller. När man går till Karriär byts färgen till coaching automatiskt."

---

## Data Flow

### Hub page render sequence

```
User navigates to /jobb
  ↓
HubBottomNav highlights "Söka jobb" tab  (data-domain="activity" → --c-* = persika)
  ↓
JobsokHub renders
  ↓
useWidgetLayout('jobb') → query ['widget-layout','jobb']
  → hit: returns layout immediately (placeholderData or cached)
  → miss: fetches from Supabase
  ↓
HubGrid renders widget slots
  ↓
Each widget mounts independently, fires its own React Query hook
  → cache hit (user came from that deep-link page): renders immediately
  → cache miss: shows per-widget skeleton, fetches, renders
```

### Size change flow

```
User clicks "M" toggle on CvWidget
  ↓
onSizeChange('M') called
  ↓
useWidgetLayout.setItemSize('cv', 'M')
  ↓ (immediate)
queryClient.setQueryData(['widget-layout','jobb'], updater)  → widget re-renders at M
  ↓ (800ms debounce)
widgetLayoutApi.upsertLayout('jobb', { layout: [...] })
  → Supabase UPSERT on (user_id, hub_id)
```

---

## Integration Points

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Hub page ↔ Widget | Props (id, size, onSizeChange, editMode) | Widget is pure display; hub owns layout state |
| Widget ↔ React Query | useQuery with shared query key | Widget never calls service directly |
| useWidgetLayout ↔ Supabase | widgetLayoutApi.ts → supabase client | One service file, not a Supabase edge function |
| Sidebar ↔ navigation.ts | navHubs export replacing navGroups | Sidebar reads navHubs, renders hub+sub-item pattern |
| HubBottomNav ↔ navigation.ts | Same navHubs export | Mobile tab bar reads hub path/icon/domain from same source |

### External Services

| Service | Integration | Notes |
|---------|-------------|-------|
| Supabase (user_widget_layouts) | Direct supabase client in widgetLayoutApi.ts | Not via /api/ai.js — this is DB CRUD, not AI |
| react-grid-layout (Phase 4) | npm package, wraps HubGrid.tsx | Only needed in Phase 4; earlier phases use static CSS grid from sketch |

---

## Suggested Build Order

### Phase 1: Navigation refactor + empty hub shells (no widgets)
**Goal:** Sidebar shows 5 hubs, `/oversikt` is the landing, `/jobb` etc. exist as empty pages.
- Rename/replace `navGroups` with `navHubs` in `navigation.ts`
- Update `Sidebar.tsx` to hub + sub-item rendering
- Add 5 lazy routes to `App.tsx`; `index` redirects to `/oversikt`
- Create empty hub page components (just `PageLayout` with title + placeholder)
- Add `HubBottomNav.tsx` for mobile
- **No new DB. No widgets. No persistence.**
- Existing 27 deep-link pages still work — verify with smoke test

### Phase 2: Static widget cards in hubs (no real data, no persistence)
**Goal:** Hub pages look like the sketch — grid of cards with hardcoded placeholder data.
- Create `Widget.tsx` compound component (Root, Header, Body, Footer)
- Create `HubGrid.tsx` (plain CSS grid, no react-grid-layout yet)
- Build 8-10 representative widgets with static/mock data
- Wire default layouts via `getDefaultLayout(hubId)` (no DB yet)
- `useWidgetSize()` hook — compact/minimal flags
- Size toggle buttons visible in edit mode only (editMode=false initially)
- **No DB. No React Query in widgets yet.**
- Verifies the visual design and grid math before any data wiring

### Phase 3: Widget data wiring (React Query, real data, cache sharing)
**Goal:** Widgets show real data; navigating from hub to deep-link page is instant (cache hit).
- Create/migrate `useCvSummary`, `useJobSearchSummary`, `useApplicationsSummary`, etc.
- Ensure deep-link pages use the same query keys
- Replace mock data in widgets with real hooks
- Per-widget loading skeletons
- Översikt: 4 summary cards + onboarding checklist (existing component)
- **No persistence yet — layout is still default/hardcoded per session.**

### Phase 4: Drag/resize + layout persistence
**Goal:** Users can resize and reorder widgets; layout persists across sessions.
- Supabase migration: create `user_widget_layouts` table with RLS policy
- `widgetLayoutApi.ts` service
- `useWidgetLayout(hubId)` hook with optimistic update + debounce
- `HubToolbar.tsx`: "Anpassa vy" toggle, "Lägg till widget"
- `AddWidgetSheet.tsx`: add hidden widgets back
- Install react-grid-layout; replace plain CSS grid in `HubGrid.tsx` with `<GridLayout>`
- Reset layout flow
- Per-breakpoint defaults (automatic size reduction, no explicit user override UI yet)

### Phase 5: Remaining widgets + Översikt summary widgets
**Goal:** Full widget coverage across all hubs; Översikt personalizable.
- Build remaining widgets (all items in widget registry)
- Översikt gets `useWidgetLayout('oversikt')` — user can reorder summary cards
- `LinkedInWidget`, `SalaryWidget`, `ExternalResourcesWidget`, etc.
- Polish: keyboard navigation through widgets (WCAG), focus management in edit mode
- Bundle analysis — lazy-load widget components inside hub pages (each hub only loads its own widgets)

---

## Anti-Patterns

### Anti-Pattern 1: Widget fetches data not shared with its deep-link page

**What people do:** Create `useJobSearchWidgetData()` separate from `useJobSearchData()` used in `JobSearch.tsx`.
**Why it's wrong:** Double fetch, no cache sharing — navigating hub → job-search page triggers a redundant network request.
**Do this instead:** One hook (`useJobSearchSummary`) with one query key used by both widget and page.

### Anti-Pattern 2: Hub layout as local component state

**What people do:** `const [layout, setLayout] = useState(getDefaultLayout(hubId))` inside the hub page component.
**Why it's wrong:** Layout resets every time the user navigates away from the hub and returns.
**Do this instead:** `useWidgetLayout(hubId)` which persists via React Query cache (`staleTime: Infinity`) + Supabase writes. Cache survives navigation within the session.

### Anti-Pattern 3: Creating a new layout wrapper route

**What people do:** Add `<Route path="/hub" element={<HubLayout />}>` as a parent wrapping the 5 hub routes but not the 27 deep-link routes.
**Why it's wrong:** Creates two layout trees. The existing `<RootRoute>` / `Layout` pattern is the single authenticated shell. Hub pages and deep-link pages share the same shell.
**Do this instead:** Hub pages are children of `/` exactly like deep-link pages. The only thing that differs is the page component rendered inside `<Outlet>`.

### Anti-Pattern 4: Storing full react-grid-layout item objects in Supabase from Phase 2

**What people do:** Immediately design the DB schema around react-grid-layout's `{i, x, y, w, h}` format before it's needed.
**Why it's wrong:** Premature schema coupling to a library. Phase 2-3 only need ordered arrays with size.
**Do this instead:** Start with `{ id, size, order }` array. Migrate to `{i, x, y, w, h}` schema in Phase 4 when react-grid-layout is introduced. The JSONB column supports both.

---

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| Current (hundreds of users) | Described architecture is sufficient. Per-user layout rows are tiny JSONB — no concern. |
| 1k-10k users | widget_layouts table is fine. React Query staleTime tuning becomes relevant — job-search widgets may need shorter stale time if many users rely on fresh match data. |
| 10k+ users | Hub summary queries aggregating across many rows (consultants seeing participant hubs) would need materialized views. Not a concern for participant-facing hub pages. |

---

## Sources

- Direct code reading: `client/src/App.tsx`, `client/src/components/layout/Sidebar.tsx`, `client/src/components/Layout.tsx`, `client/src/components/layout/navigation.ts`, `client/src/components/layout/PageLayout.tsx`
- Design system: `docs/DESIGN.md`
- Widget mockup: `nav-hub-sketch.html` (variant C+ sketch by project)
- Project constraints: `.planning/PROJECT.md`
- react-grid-layout (Phase 4 recommendation): https://github.com/react-grid-layout/react-grid-layout — well-maintained, last release 2024, standard for React drag/resize grids. No Context7 lookup needed as it is only introduced in Phase 4.

---
*Architecture research for: Hub-navigation + widget system milestone*
*Researched: 2026-04-28*
