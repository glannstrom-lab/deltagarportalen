# Pitfalls Research

**Domain:** Hub-navigation + widget-system added to existing React 19 SPA serving vulnerable users
**Researched:** 2026-04-28
**Confidence:** HIGH (grounded in actual codebase — App.tsx, navigation.ts, portal-review-2026-04, nav-hub-sketch.html)

---

## Critical Pitfalls

### Pitfall 1: Deep-link breakage when hub routes shadow existing page routes

**What goes wrong:**
The 27 existing routes live under `/` as nested children of `RootRoute` in `App.tsx`. When hub navigation is introduced (e.g. `/soka-jobb`, `/karriar`, `/resurser`, `/min-vardag`), the new hub route segments can collide with or shadow existing routes if the nesting strategy changes. The catch-all `<Route path="*" element={<Navigate to="/" replace />} />` currently swallows any unmatched URL — if a hub route is added incorrectly, previously-bookmarked deep links like `/applications` or `/spontanansökan` will silently redirect to root instead of failing loudly.

**Why it happens:**
Developers add hub routes as top-level siblings of the nested block, not understanding that React Router's `<Route path="/" element={<RootRoute />}>` is an outlet pattern. Adding `/soka-jobb` at the top level breaks the authenticated layout wrapper entirely. Adding it inside `RootRoute` as a parent with sub-routes requires moving existing routes inside it — which breaks all existing paths unless redirects are added.

**How to avoid:**
Keep all existing `/cv`, `/applications`, `/spontanansökan` etc. routes exactly where they are in App.tsx. Hub routes should be purely UI state — either a query param (`?hub=soka-jobb`), a Zustand store value, or a thin wrapper route that renders the hub layout with widgets but does NOT own any of the 27 page URLs. The hub view at `/soka-jobb` can exist alongside page routes; clicking a widget navigates to `/applications`, not to a nested `/soka-jobb/applications`. Write a smoke-test script that hits all 27 existing route paths and asserts 200/render before and after the hub refactor is merged.

**Warning signs:**
- New route definitions added above or alongside the `<Route path="/">` block rather than inside it
- Hub route path strings that partially match existing paths (e.g. `/karriar` vs `/career`)
- `navigation.ts` paths not present in App.tsx `<Route>` elements (the dead-code pattern already documented in portal-review-2026-04)
- Catch-all `*` redirect hiding broken routes in manual testing

**Phase to address:** Phase 1 (Hub navigation shell — routing infrastructure)

---

### Pitfall 2: Active-state highlighting broken after hub refactor

**What goes wrong:**
`navigation.ts` drives active highlighting via `path` matching against `window.location.pathname`. After introducing hubs, the sidebar or bottom bar must highlight both the hub (e.g. "Söka Jobb") AND the current page within that hub. If active-state logic only checks exact path match, a user on `/applications` sees no hub highlighted. If it checks prefix match without care, multiple hubs light up simultaneously or the wrong hub lights up (e.g. `/career` matches both "Karriär" hub and the `/career` page).

**Why it happens:**
The current `navGroups` structure in `navigation.ts` has a flat `items[].path` array. There is no `hubId` field on individual items yet. When hub-level active state is computed by checking if `currentPath.startsWith(hubPath)`, it breaks for hubs whose pages don't share a URL prefix (e.g. the "Söka Jobb" hub contains `/job-search`, `/applications`, `/spontanansökan`, `/cover-letter`, `/interview-simulator` — none of these share a common prefix).

**How to avoid:**
Extend `NavItem` with an optional `hubId: string` field and maintain a `pageToHub` lookup map derived from `navGroups`. Active hub is determined by `pageToHub[currentPath]`, not by URL prefix. The hub sidebar items get `aria-current="page"` only when the user is on the hub's own overview; individual page routes get `aria-current` on the specific nav item. Write a unit test that asserts `getActiveHub('/applications') === 'soka-jobb'` for every page in the system.

**Warning signs:**
- Hub active state computed with `location.pathname.startsWith(hubPath)` where hub path is a short string
- No `hubId` field on `NavItem` interface
- Mobile bottom bar has separate active-state logic that diverges from sidebar logic
- i18n label keys missing for new hub group entries in translation files

**Phase to address:** Phase 1 (Hub navigation shell)

---

### Pitfall 3: N+1 Supabase query waterfall on hub mount

**What goes wrong:**
Each widget in the "Söka Jobb" hub fires its own `useQuery` hook on mount. With 8–10 widgets visible, hub load triggers 8–10 separate Supabase round trips in parallel. Each goes through RLS evaluation, network latency, and React Query deduplication (only if keys match exactly). The hub feels sluggish on first load and causes visible loading-state staggering — one widget resolves early, others flash spinners 200–400 ms later, creating visual noise that disorients users with attention regulation difficulties (ADHD, NPF).

**Why it happens:**
Widget components are designed for composability and each owns its data fetching. React Query deduplication works within a single query key, but CV data, applications count, job matches, and interview scores all have different keys and different Supabase tables. There is no hub-level prefetch or aggregated endpoint.

**How to avoid:**
Create a hub-level data loader: a single `useHubData('soka-jobb')` hook that issues one Supabase query per hub (joining or batching the 3–5 tables needed) and distributes results via context. Individual widget components read from context instead of each calling Supabase directly. React Query's `prefetchQuery` should be called in the hub route's loader (React Router v6 data APIs or manually in `useEffect` with `queryClient.prefetchQuery`). Stale time should be at least 60 seconds so navigating back to the hub does not re-fetch.

**Warning signs:**
- Each widget file contains its own `useQuery` with a Supabase `select()` call
- Network tab on hub mount shows 5+ simultaneous requests to the same Supabase domain
- No `prefetchQuery` call in hub route or hub component `useEffect`
- Widgets use different `staleTime` values, causing some to refetch while others use cache

**Phase to address:** Phase 2 (Widget data layer + React Query strategy)

---

### Pitfall 4: Error cascade — one widget failure breaks all visible widgets

**What goes wrong:**
If one widget's data fetch throws (e.g. Supabase rate limit, network timeout, RLS policy gap), and widgets share a parent error boundary, the entire hub renders an error screen. The user sees "Något gick fel" instead of 9 working widgets and 1 broken one. This is catastrophic for trust with users who are already anxious about the portal.

**Why it happens:**
`RouteErrorBoundary` is placed at route level in App.tsx. Widget components inside the hub route are all children of a single error boundary. One `throw` inside any widget propagates up and catches in the route-level boundary.

**How to avoid:**
Every widget must be wrapped in its own `<ErrorBoundary>` with a graceful per-widget fallback (a muted card showing "Kunde inte ladda data" with a retry button). The hub-level boundary catches only truly catastrophic errors (e.g. the hub layout component itself crashing). Use React Query's `useQuery` error state rather than throwing — `isError` renders the widget's own error UI without triggering error boundaries. Test this explicitly: mock one widget's query to reject and assert the rest of the hub renders normally.

**Warning signs:**
- `RouteErrorBoundary` wraps the entire hub component with no inner boundaries per widget
- Widget components use `suspense: true` in `useQuery` without a widget-level `<Suspense>` wrapper
- No per-widget error UI defined (only a route-level fallback)

**Phase to address:** Phase 2 (Widget data layer)

---

### Pitfall 5: Layout persistence race condition and optimistic-update rollback missing

**What goes wrong:**
User drags widget A to a new position. The UI updates immediately (optimistic). A Supabase `upsert` is fired. If the upsert fails (network blip, RLS error, concurrent write from another tab), the UI stays in the new position but the database has the old position. On next load, the layout reverts. The user sees the widget "jump back" without explanation.

A related failure: the user rapidly drags multiple widgets. Each drag fires a separate `upsert`. The responses arrive out of order (the second drag's response arrives before the first's). Supabase applies the last write wins, but the UI shows the state from the last drag fired, not the last response received — creating a divergence.

**Why it happens:**
react-grid-layout fires `onLayoutChange` on every intermediate drag position, not just on drop. If `onLayoutChange` directly triggers a database write, dozens of writes fire per second. Debouncing is often added but the debounce timer is cancelled on unmount — if the user navigates away before the debounce fires, the last layout change is lost.

**How to avoid:**
Debounce layout saves with a 1000 ms debounce on a stable `useRef`. On `onDragStop`/`onResizeStop` (not `onLayoutChange`), fire the actual save. Use React Query's `useMutation` with `onError` rollback: store the previous layout in `onMutate` context and restore it in `onError`. Add a `useBeforeUnload` guard that flushes any pending debounced save synchronously. Use a `updatedAt` timestamp column in Supabase to detect conflicts — if the server's `updatedAt` is newer than what the client sent, reject the update and reload from server.

**Warning signs:**
- `onLayoutChange` directly calls a Supabase write (no debounce)
- `useMutation` has no `onError` rollback handler
- No `updatedAt` column in the layout persistence table
- `useEffect` cleanup does not flush pending debounce timers

**Phase to address:** Phase 4 (Layout persistence + conflict resolution)

---

### Pitfall 6: Multi-device layout conflict without reconciliation strategy

**What goes wrong:**
User customizes their layout on desktop (4-column grid). They open the portal on their phone (2-column grid). The mobile layout is derived from the same persisted layout data but the desktop positions make no sense in 2 columns. react-grid-layout will attempt to reflow, often stacking all widgets vertically in an arbitrary order that does not match the desktop intent. If the user drags a widget on mobile, the new mobile layout is saved to Supabase, overwriting the desktop layout.

**Why it happens:**
Developers persist a single `layout` JSON blob per user without distinguishing breakpoints. react-grid-layout supports named breakpoints (`lg`, `md`, `sm`) but if only one breakpoint's layout is persisted, the others are derived by the library on every load — not stable.

**How to avoid:**
Persist separate layout records per breakpoint: `layout_lg`, `layout_md`, `layout_sm` (or a `breakpoint` column). On first load for a new breakpoint, generate a sensible default from the hub's `defaultLayout` constant rather than trying to reflow the desktop layout. Never let mobile saves overwrite desktop layouts — the save payload must include the active breakpoint and the upsert key must be `(user_id, hub_id, breakpoint)`.

**Warning signs:**
- Single `layout JSONB` column in the persistence table with no breakpoint key
- `localStorage` used instead of Supabase for layout (does not sync across devices)
- `react-grid-layout` `breakpoints` and `cols` props set but `layouts` prop is a flat array (not `{lg: [...], md: [...]}`)

**Phase to address:** Phase 4 (Layout persistence)

---

### Pitfall 7: Default layout drift when widgets are added or removed in code

**What goes wrong:**
A widget is added to the "Söka Jobb" hub in code (e.g. a new "LinkedIn" widget). Users who already have a persisted layout do not have this widget in their layout JSON. react-grid-layout renders only what is in the `layouts` array — the new widget is invisible to existing users until they reset their layout. Conversely, when a widget is removed from code, its persisted layout entry is an orphan that causes react-grid-layout to throw a "widget not found" warning or render an empty slot.

**Why it happens:**
Layout merge logic is not implemented. The persisted layout is treated as the complete source of truth. No reconciliation step compares persisted widget IDs against the current list of available widgets.

**How to avoid:**
On hub load, run a reconciliation function: `mergeLayouts(persisted, defaultLayout)`. For each widget in `defaultLayout` that is missing from `persisted`, append it at the bottom of the grid (or in its default position). For each widget in `persisted` that no longer exists in the current widget registry, remove it from the active layout (keep it in DB for rollback purposes with a `hidden: true` flag). Write a unit test that covers both cases (add widget, remove widget) and asserts the merged layout is valid.

**Warning signs:**
- No `reconcileLayout` or equivalent function in the hub component
- Widget registry is a static array in the component file — adding a widget requires the developer to also manually edit all users' layouts
- No `defaultLayout` constant exported from each hub module

**Phase to address:** Phase 4 (Layout persistence) and Phase 5 (Widget registry + add/remove)

---

### Pitfall 8: Mobile touch drag conflicts with page scroll

**What goes wrong:**
react-grid-layout uses pointer events and touch events to handle drag. On mobile, a vertical swipe on a widget is ambiguous between "scroll the page" and "drag the widget". The library resolves this with a drag threshold (default 10px), but when the content area itself is short (the mobile hub fits on screen), the ambiguity causes accidental widget drags when the user meant to scroll. Users with motor difficulties are disproportionately affected.

**Why it happens:**
react-grid-layout's `isDraggable` default is `true` for all widgets. Mobile users interact primarily via touch scrolling, not drag-and-drop. The drag affordance is designed for desktop mouse users.

**How to avoid:**
Disable drag on touch devices by default: set `isDraggable={!isTouchDevice}` and `isResizable={!isTouchDevice}`. Provide a dedicated "Edit layout" mode that the user must explicitly enter (a toggle in the hub header — as shown in the nav-hub-sketch "Anpassa vy" button). Outside of edit mode, widgets are static. In edit mode, display a visual grab handle on each widget and disable page scroll while a drag is active (`touch-action: none` on the grid container). This is both an accessibility and UX decision.

**Warning signs:**
- `isDraggable` and `isResizable` not conditionally set based on device type or edit mode
- No "edit mode" toggle — drag is always active
- `touch-action` CSS not set on the grid container during drag

**Phase to address:** Phase 3 (Widget interaction — drag/resize UX)

---

### Pitfall 9: Keyboard inaccessibility of drag/resize (WCAG 2.1 AA violation)

**What goes wrong:**
react-grid-layout has no built-in keyboard support for drag and resize. A keyboard-only user (or screen reader user) cannot reorder widgets. This violates WCAG 2.1 AA Success Criterion 2.1.1 (Keyboard) if the drag interaction is the only way to reorder widgets. This is not a minor accessibility concern — it is a hard requirement for this portal's target group, which includes users with motor impairments.

**Why it happens:**
The library is mouse/touch-first. Keyboard accessibility requires custom implementation. Developers often defer "accessibility pass" to after launch, at which point the component architecture makes retrofitting expensive.

**How to avoid:**
Implement a keyboard-accessible layout editor from the start of Phase 3, not as a post-launch patch. Two approaches:
1. Size-toggle buttons on each widget (already shown in nav-hub-sketch: S/M/L buttons) — these are keyboard-accessible and cover the most important interaction (widget sizing). Implement these first.
2. For reordering: a separate "Move widget" mode with Up/Down/Left/Right arrow key handling using `aria-grabbed`, `aria-dropeffect`, and live region announcements for screen readers. This follows the ARIA Authoring Practices Guide pattern for "drag and drop with keyboard".

Every widget must have: a focusable resize/move control, `aria-label` describing the control, and a confirmation that the action succeeded read by screen readers via `aria-live="polite"`.

**Warning signs:**
- Widget drag handles are not `<button>` elements (only div with `onMouseDown`)
- No `aria-grabbed`, `aria-dropeffect` on draggable items
- No keyboard event handlers (Arrow keys, Enter, Escape) on drag handles
- No `aria-live` region for layout change announcements
- Accessibility testing only done with mouse

**Phase to address:** Phase 3 (Widget interaction) — must be concurrent with drag/resize implementation, not after

---

### Pitfall 10: Overwhelming first-load for new users (cognitive overload for NPF/exhaustion)

**What goes wrong:**
A new user lands on "Söka Jobb" hub and sees 8–10 widgets simultaneously, all in loading state (spinners), then all resolving at different times with different data densities. The hub feels like a dashboard from a business intelligence tool — information-dense, demanding immediate attention and interpretation. For users with exhaustion syndrome, anxiety, or ADHD, this is a sensory and cognitive barrier. Many users will leave the page.

**Why it happens:**
The default layout is designed to showcase features (maximum widget density). It is not designed for a user who has never used the tool and has 0 applications, 0 saved jobs, and an incomplete CV.

**How to avoid:**
Implement a "sparse default" for new users: show maximum 3–4 widgets on first hub visit, with a visible "Add more widgets" affordance. Use a session flag (e.g. `user.onboarded_hubs` in Supabase `profiles`) to distinguish new from returning users. Empty-state widgets must use a welcoming, action-oriented message ("Kom igång: skapa ditt CV") not a bare zero ("0 ansökningar"). Introduce progressive disclosure: widgets expand with more data as the user actually uses the features. Run a cognitive load review of the default layout with a UX consultant familiar with NPF before shipping Phase 3.

**Warning signs:**
- Default layout constant has more than 5 widgets visible on first load
- Empty state for widgets shows only "Inga data" or a raw zero
- No `onboarded_hubs` or equivalent flag in the profiles table
- No distinction between new-user and returning-user default layouts

**Phase to address:** Phase 3 (Widget UX) and Phase 1 (User state design in DB)

---

### Pitfall 11: Progress bars and completion percentages feeling judgmental (shaming)

**What goes wrong:**
The CV widget in nav-hub-sketch shows a 75% completion ring. For a user with low self-efficacy (long-term unemployed, having had many job rejection experiences), a prominently-displayed completion percentage reads as "you are 25% inadequate". A job match widget showing "94% match" sets expectations that may not convert to interview invitations, causing increased disappointment when rejections come. An applications widget showing "5 avslutade" (closed/rejected) surfaced prominently recreates the experience of catalogued failure.

**Why it happens:**
Gamification and progress visualization are standard SaaS patterns. They work well for motivated power users. They were not designed for the Deltagarportalen target group (stated in PROJECT.md: "Tonen ska vara stödjande, inte stressande. Tänk Headspace, inte Linear.").

**How to avoid:**
Replace percentage completion rings with milestone celebrations: "CV is ready to send!" (when >80%) rather than "75% complete" (when not done). Frame rejections in applications tracker as "experience gained" not as a failure count. Hide the stacked bar chart of "closed" applications by default — show only active items unless the user clicks to see history. Match percentages (e.g. "94% match") should be replaced with softer framing: "Bra match" (label) without the specific number, which implies false precision. Run copy through a review by the `arbetskonsulent` and `langtidsarbetssokande` agents before any widget containing progress metrics ships.

**Warning signs:**
- Percentage numbers displayed prominently in widget KPI position
- "Avslutade" or "Nekade" (rejected/closed) counts visible in default widget state
- Match score displayed as a precise number (e.g. "94%") without any validation that this is emotionally appropriate
- Progress bars that are always visible even when the user has not engaged with the feature yet

**Phase to address:** Phase 3 (Widget UX copy and framing) — mandatory review before Phase 3 ships

---

### Pitfall 12: Notification dot anxiety — badge overload

**What goes wrong:**
The existing `shouldShowBadge` system in `navigation.ts` already limits badges to the single most recent unvisited feature (`NEWEST_FEATURE`). If hub navigation adds a second badge system (e.g. "3 new job matches" dot on "Söka Jobb" hub, "2 messages" on a widget, unread notification count on another widget), users with anxiety or ADHD see multiple simultaneous attention demands. Each dot is an implicit obligation. Users with NPF can become paralyzed by uncleared notification states.

**Why it happens:**
Widget systems naturally surface counts. Developers treat notification dots as neutral UI affordances without considering cumulative cognitive load for this user group.

**How to avoid:**
Centralize all notification state through a single `useNotificationSummary` hook. Apply a maximum: no more than ONE badge visible on the hub navigation at any time, showing the most time-sensitive item only. Within a hub, widgets can show "new" indicators but only if the user has enabled them in Settings. Default is no badges. The existing `NEWEST_FEATURE` pattern in `navigation.ts` is a good model — extend it, do not parallel it with a separate system.

**Warning signs:**
- Multiple `isNew`, `badge`, `count` props across different navigation and widget components with independent state
- No settings toggle for notification badges
- Badge count derived from live query data (e.g. `applications WHERE status='new'`) without a cap or aggregation strategy

**Phase to address:** Phase 2 (Hub notification state design)

---

### Pitfall 13: Animated drag/resize triggering motion sickness

**What goes wrong:**
react-grid-layout animates widget repositioning by default (CSS transitions on `transform` and layout shifts). For users with vestibular disorders or motion sensitivity (a non-trivial subset of the target group given NPF comorbidities), animated elements jumping across the screen trigger nausea and disorientation. This is particularly acute for large layout shifts (dragging a widget from one side of the screen to the other).

**Why it happens:**
Animation is treated as a polish feature. The `prefers-reduced-motion` media query is not checked by react-grid-layout's default configuration.

**How to avoid:**
Check `window.matchMedia('(prefers-reduced-motion: reduce)')` and pass `useCSSTransforms={!prefersReducedMotion}` to `<ReactGridLayout>`. In Tailwind 4, use `motion-safe:` and `motion-reduce:` variants consistently on any widget animation. The size-toggle buttons (S/M/L from nav-hub-sketch) should resize widgets without animation in reduced-motion mode. Document this as a hard requirement in the Phase 3 acceptance criteria.

**Warning signs:**
- `useCSSTransforms` not conditioned on `prefers-reduced-motion`
- Framer Motion animations on widget components without `motion-reduce:` variants
- No mention of `prefers-reduced-motion` in Phase 3 implementation tasks

**Phase to address:** Phase 3 (Widget interaction) — must be in initial implementation, not a post-ship fix

---

### Pitfall 14: Bundle bloat — all widget code loaded on initial route

**What goes wrong:**
If all hub widget components are imported statically in the hub route file, the entire widget library (CV widget, job search widget, applications widget, interview widget, salary widget, etc.) loads on the initial bundle of every hub. This adds significant JS parsing time, particularly on low-end mobile devices common among the target demographic (long-term unemployed users may use budget Android phones). The portal-review-2026-04 already documents ~1 MB in PDF libraries; adding a widget bundle on top compounds the problem.

**Why it happens:**
Widgets are co-located in a single hub file for convenience. Dynamic imports are seen as premature optimization.

**How to avoid:**
Each widget component must be `lazy()`-imported. Since the hub has a defined loading state (skeleton cards), each widget slot can independently Suspense. The widget registry (the list of available widgets for a hub) is a static config object; the component is loaded lazily when the widget is in the user's active layout. Widgets NOT in the user's layout are never loaded. Use `vite-bundle-visualizer` after Phase 3 to verify no widget appears in the main chunk.

**Warning signs:**
- Hub file has static `import` statements for widget components at the top
- All widgets load even when the user has hidden them
- `npm run build` chunk analysis shows a single large hub chunk with all widget code

**Phase to address:** Phase 2 (Widget architecture) — code-splitting strategy defined before any widgets are built

---

### Pitfall 15: Infinite re-render loop on layout sync

**What goes wrong:**
A common react-grid-layout trap: `onLayoutChange` sets state → state change re-renders the component → new `layouts` prop triggers `onLayoutChange` again → infinite loop. This manifests as a frozen or rapidly-flickering hub that crashes the browser tab.

**Why it happens:**
The `layouts` prop passed to `<ReactGridLayout>` is derived from component state. `onLayoutChange` updates that state. Without careful reference equality checks, every render generates a new layout object that react-grid-layout treats as a change, firing `onLayoutChange` again.

**How to avoid:**
Store layout in a `useRef` for the purpose of comparison. Only call `setLayout` (triggering a re-render) when the layout has actually changed in a meaningful way (widget position or size differs). Use `isEqual` from `lodash` or a shallow compare to check before setting state. The Supabase save must be in the `onDragStop`/`onResizeStop` callbacks, not in `onLayoutChange`. Write a test that renders the hub with a mock layout and asserts that `onLayoutChange` is not called more than once on initial render.

**Warning signs:**
- `onLayoutChange` calls `setState` unconditionally with the new layout
- `layouts` prop is recalculated inside the render function (creates new object reference every render)
- No `useCallback` on `onLayoutChange` handler
- Console.log in `onLayoutChange` prints repeatedly without user interaction

**Phase to address:** Phase 4 (Layout persistence) — add a regression test specifically for this before shipping persistence

---

### Pitfall 16: Gradual rollout flag-flip creating two navigation realities simultaneously

**What goes wrong:**
If hub navigation is rolled out behind a feature flag (e.g. `user.profile.hub_nav_enabled`), consultant users and participant users may see entirely different navigation structures simultaneously. When a consultant tries to guide a participant ("click on Söka Jobb in the left menu"), the participant may still have the old 3-group sidebar. Support conversations become impossible to resolve. Consultants' screenshots in training material become wrong immediately for users still on old nav.

**Why it happens:**
Gradual rollout is sensible engineering but has human cost in a coaching context. The portal is explicitly a dyadic tool — consultants and participants work together.

**How to avoid:**
Do not use per-user feature flags for navigation structure. Either all users in a tenant (or all users of a consultant) move together, or the rollout is sequential by date with zero overlap period. The flag should be an environment-level switch (`VITE_HUB_NAV_ENABLED=true`) deployed to production on a specific date, not a per-user database field. For testing before launch, use a separate staging environment. Prepare a one-page "navigation change" announcement sent to all consultants at least one week before the switch.

**Warning signs:**
- `hub_nav_enabled` column in `profiles` table (per-user flag)
- Navigation component contains `if (user.hubNavEnabled)` branching
- No communication plan for consultants documented alongside the migration

**Phase to address:** Phase 1 (Hub navigation shell) — decide rollout strategy before writing a single line of hub nav code

---

### Pitfall 17: Screen reader announces layout change on every widget resize

**What goes wrong:**
When a user resizes a widget (S/M/L toggle), react-grid-layout shifts adjacent widgets to fill space. Each shift potentially triggers a DOM change that screen readers announce. With 8 widgets, a single resize action produces 7 unintended announcements in rapid succession, overwhelming the user with audio output. This is particularly disorienting for blind users using NVDA or JAWS.

**Why it happens:**
Screen readers watch the DOM for changes. Grid layout changes affect the `style` and `class` attributes of all sibling widgets simultaneously. Without deliberate `aria-live` management, every change gets announced.

**How to avoid:**
Wrap the widget grid in a `<div aria-live="off">` during layout changes. Use a ref to toggle `aria-live` to `"polite"` after the layout settles (after `onLayoutChange` fires). Announce only a single summary message: "Widget storleksändrad" (via a dedicated `<div role="status" aria-live="polite">` outside the grid). Use `aria-hidden="true"` on individual widget chrome elements (the resize handles, the drag handle) so they are not announced by screen readers. Test with NVDA + Firefox before Phase 3 ships.

**Warning signs:**
- No `role="status"` or `aria-live` region for layout change announcements
- Widget grid container has no `aria-live="off"` during transitions
- Resize/drag handles are visible DOM elements with no `aria-hidden`

**Phase to address:** Phase 3 (Widget interaction — WCAG compliance)

---

### Pitfall 18: Supabase RLS overhead per widget query

**What goes wrong:**
With 8–10 widgets each issuing a Supabase query, every query goes through RLS policy evaluation. For complex policies (e.g. consultant visibility checks that join `consultant_participants`), each policy evaluation adds 5–20 ms. On a hub mount with 10 widgets, this can add 50–200 ms of pure database overhead even if the actual data retrieval is fast. This is multiplied for consultant users who have more complex RLS policies.

**Why it happens:**
RLS is evaluated server-side on every query. The hub-level data loader from Pitfall 3 mitigates this by reducing query count, but if individual widget queries slip through, overhead accumulates.

**How to avoid:**
Profile RLS evaluation time using `EXPLAIN ANALYZE` on the policies for the tables most queried by widgets (cvs, job_applications, saved_jobs, interview_sessions, mood_logs). Add indexes on `user_id` columns if missing. Consider a hub-summary materialized view or database function (`get_hub_summary_soka_jobb(user_id)`) that returns all widget data for a hub in one call, with RLS applied once. This aligns with the hub-level data loader strategy from Pitfall 3.

**Warning signs:**
- No `EXPLAIN ANALYZE` run on hub query patterns before Phase 2 ships
- Widgets querying tables with complex JOIN-based RLS policies (not just `auth.uid() = user_id`)
- Supabase dashboard shows slow queries (>100 ms) on tables used by widgets

**Phase to address:** Phase 2 (Widget data layer) — performance budget defined before widgets are built

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Single layout JSON blob per user (no breakpoint) | Simple schema | Mobile/desktop layouts overwrite each other | Never — define per-breakpoint from start |
| Static widget imports in hub file | Simpler code | All widget code in initial bundle; slow first load on mobile | Never — lazy import from day 1 |
| `onLayoutChange` triggering immediate Supabase write | Real-time persistence | Hundreds of writes per drag; race conditions; cost | Never — use debounce + stop events |
| Hub active state via URL prefix match | Simple code | Wrong highlights when page paths don't match hub prefix | Never — use explicit `hubId` map |
| Single error boundary for entire hub | Simple code | One widget failure blacks out the whole hub | Never for production |
| Per-user feature flag for hub navigation | Granular rollout | Two nav realities confuse consultants + users simultaneously | Never — use environment flag |
| Progress rings showing raw percentages | Familiar pattern | Shaming for vulnerable users with low self-efficacy | Never without empathy review |
| Default layout with 8+ widgets | Showcases features | Cognitive overload for new users (NPF, exhaustion) | Never as first-run experience |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| react-grid-layout + React 19 | Using class component API (pre-v1.4) or ignoring StrictMode double-invocation of effects | Use functional wrapper components; test with StrictMode enabled; `onLayoutChange` must be idempotent |
| Supabase + widget layout persistence | Using `insert` without `upsert` — creates duplicate layout rows per user per hub | Use `upsert` with conflict target `(user_id, hub_id, breakpoint)` |
| Supabase RLS + widget data | Widget queries hit tables where the user's RLS policy requires a consultant-participant JOIN — slow | Profile with EXPLAIN ANALYZE; consider hub-summary functions |
| react-grid-layout + Tailwind 4 | `className` prop conflicts with Tailwind's JIT scanning if widget classes are dynamically constructed | Use `clsx` or `cn()` utility; add widget class patterns to Tailwind `safelist` |
| i18next + hub labels | Hub group `labelKey` values added to `navGroups` without corresponding entries in `sv.json` and `en.json` | Add a CI check: fail build if any `labelKey` in navigation.ts has no translation entry |
| react-grid-layout + `prefers-reduced-motion` | `useCSSTransforms` is always `true` by default | Always derive from `window.matchMedia('(prefers-reduced-motion: reduce)').matches` |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| All widgets fetch independently on hub mount | 8+ simultaneous Supabase requests; staggered loading spinners; slow TTFI | Hub-level data loader; React Query prefetch | Immediately — visible on first user test |
| Widget components not lazy-loaded | Large initial JS bundle; slow on budget Android phones | `lazy()` import per widget; Suspense per slot | When total widget code exceeds ~200 KB parsed |
| `onLayoutChange` triggers synchronous Supabase write | Hundreds of DB writes per drag; rate limit errors; UI freezes | Debounce 1000 ms; write on `onDragStop`/`onResizeStop` only | First time a user drags a widget more than 3 positions |
| No `staleTime` on widget queries | Hub re-fetches all data on every navigation back to the hub | Set `staleTime: 60_000` minimum on widget queries | Immediately noticeable — users navigating between hub and page see flicker |
| Layout state causes re-render of all widgets on any change | Typing in a widget input re-renders the entire grid | Widget data in isolated local state; grid layout in separate context | When any widget contains an interactive input |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Persisting layout JSON that includes widget data | User's application counts or CV content embedded in layout object could be exposed if layout table has wrong RLS | Layout table stores ONLY widget IDs, sizes, and positions — never data values |
| Widget queries bypassing RLS via service role client | Widget accidentally uses service role Supabase client (imported from a shared util) | Widget queries must use the anon client with user's JWT; audit all widget `supabase` client imports |
| Layout save endpoint accepting arbitrary widget IDs | Attacker crafts layout with widget IDs from another user's hub to probe data existence | Widget ID registry is validated server-side; unknown widget IDs rejected silently |
| Hub summary function with SECURITY DEFINER without input validation | Malicious `user_id` param allows querying another user's data | All hub summary functions must use `auth.uid()` from session, not a `user_id` parameter |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Empty widget showing only "Inga data" | User with 0 applications sees "0" — feels like failure | Empty state: "Kom igång — spara ditt första jobb" with a direct action button |
| All widgets in loading state simultaneously | Visual chaos; users with ADHD lose track of which element they were looking at | Staggered skeleton loading in a predictable left-to-right, top-to-bottom order; max 3 skeletons visible at once |
| "94% match" job scores displayed | False precision; sets expectations that lead to disappointment when not called for interview | Qualitative labels: "Bra match", "Mycket bra match" — or omit the score entirely |
| Notification dot on every unread item | Anxiety; feeling of obligation to clear all dots | Maximum 1 dot on hub nav at a time; dots opt-in via Settings |
| Drag-to-reorder as the only layout customization | Inaccessible to keyboard users; confusing for motor-impaired users | S/M/L size toggle buttons as primary customization; drag as secondary |
| Progress rings always visible, even for empty state | Shaming for users who haven't used a feature | Hide progress rings until user has at least one data point |
| Hub switch re-renders entire layout with animation | Motion sickness for vestibular-sensitive users | Instant tab switch; no animated transition between hubs |

---

## "Looks Done But Isn't" Checklist

- [ ] **Hub routing:** All 27 existing routes still resolve correctly after hub shell is added — verify with automated route smoke test
- [ ] **Active state:** Every page correctly highlights its parent hub in the sidebar — verify `getActiveHub()` returns correct value for all 27 routes
- [ ] **Widget error isolation:** Mocking one widget's query to reject still renders all other widgets — verify with a targeted error boundary test
- [ ] **Keyboard access:** All widget resize/move controls are reachable and operable via Tab + Enter/Arrow keys — verify with keyboard-only manual test
- [ ] **prefers-reduced-motion:** Dragging and resizing produce no CSS animations when `prefers-reduced-motion: reduce` is active — verify in browser DevTools
- [ ] **Layout persistence multi-device:** Layout saved on desktop does not overwrite mobile layout — verify with two simultaneous browser sessions
- [ ] **Default layout merge:** Adding a new widget in code appears for users with existing persisted layouts — verify by simulating an existing layout that lacks the new widget ID
- [ ] **Empty state copy:** Every widget has a compassionate empty state (not just "0" or "Inga data") — verify by loading each hub with a fresh test account with no data
- [ ] **Translation keys:** Every hub group and widget label has entries in `sv.json` (and `en.json` if used) — verify with a missing-key CI check
- [ ] **Bundle size:** No widget component appears in the main JS chunk — verify with `vite-bundle-visualizer` after Phase 2

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Deep-link breakage discovered post-launch | HIGH | Add redirects immediately in `App.tsx`; communicate to users via in-app banner; audit all navigation.ts paths vs App.tsx routes |
| Layout persistence race condition causing data loss | MEDIUM | Reset affected users' layouts to default; add `updatedAt` conflict detection; deploy debounce fix |
| Infinite re-render loop in hub | HIGH | Rollback hub component to last stable version; the fix requires careful state architecture review — do not hotpatch |
| Widget error cascade (one widget blacks out hub) | MEDIUM | Hotfix: wrap each widget in `<ErrorBoundary>`; this is always safe to add without regressions |
| Motion sickness reports from users | LOW | Deploy `prefers-reduced-motion` check as a hotfix; this is a one-line change to `ReactGridLayout` props |
| Notification badge anxiety (multiple dots) | LOW | Disable badges in Settings as a user control; reduce default badge visibility in a config change |
| Bundle bloat discovered after launch | MEDIUM | Convert static widget imports to `lazy()` imports — this is safe but requires testing each widget's Suspense boundary |
| Shaming UX discovered in empathy review | MEDIUM | Copy changes and conditional rendering — no architecture change needed but requires a full widget copy audit |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Deep-link breakage | Phase 1 — Hub routing shell | Automated route smoke test passes for all 27 routes |
| Active-state broken | Phase 1 — Hub routing shell | Unit test: `getActiveHub()` correct for all 27 paths |
| Gradual rollout two-realities | Phase 1 — Rollout strategy decision | No per-user `hub_nav_enabled` flag in profiles table |
| Overwhelming first-load | Phase 1 — DB: `onboarded_hubs` flag design | New test account sees max 4 widgets on first hub visit |
| N+1 widget query waterfall | Phase 2 — Hub data loader | Network tab shows max 1 Supabase request on hub mount |
| Widget error cascade | Phase 2 — Widget component architecture | Mock-reject one widget; assert others render |
| Bundle bloat from widget imports | Phase 2 — Widget code-splitting strategy | `vite-bundle-visualizer` shows no widget in main chunk |
| Notification badge anxiety | Phase 2 — Notification state design | Max 1 badge visible on nav; Settings toggle exists |
| RLS overhead per widget | Phase 2 — Query performance profiling | `EXPLAIN ANALYZE` on hub queries; no query >50 ms |
| Mobile touch/scroll conflict | Phase 3 — Widget interaction UX | Touch test: vertical swipe scrolls page, not drags widget |
| Keyboard inaccessibility | Phase 3 — WCAG implementation | Keyboard-only session: all widgets resizable without mouse |
| Screen reader layout announcements | Phase 3 — WCAG implementation | NVDA test: single summary announced, not 7 simultaneous |
| Motion sickness from animations | Phase 3 — reduced-motion support | DevTools reduced-motion: no CSS transitions fire on drag |
| Progress bars feeling judgmental | Phase 3 — Widget copy and framing review | Empathy review by `arbetskonsulent` agent sign-off |
| Layout persistence race condition | Phase 4 — Persistence + mutation rollback | Integration test: simulate network failure on save; UI reverts |
| Multi-device layout conflict | Phase 4 — Per-breakpoint persistence schema | Two-device test: desktop layout unchanged after mobile drag |
| Default layout drift | Phase 4 + Phase 5 — Reconciliation function | Test: add new widget to code; existing users see it appended |
| Infinite re-render on layout sync | Phase 4 — Layout sync implementation | Render test: `onLayoutChange` called max once on mount |

---

## Sources

- Codebase analysis: `client/src/App.tsx` (routing structure), `client/src/components/layout/navigation.ts` (navGroups, active-state logic)
- `docs/portal-review-2026-04.md` — known issues: dead-code pattern, dual AI backends, state-store collisions, 19% test coverage
- `docs/security-audit.md` — RLS baseline, CORS fixes, rate-limiting approach
- `nav-hub-sketch.html` — widget sizes (S/M/L), hub sidebar design, section structure, "Anpassa vy" modal concept
- `PROJECT.md` — target group definition (NPF, exhaustion, long-term unemployed), tone requirement ("Headspace, not Linear"), WCAG 2.1 AA as minimum
- ARIA Authoring Practices Guide: Drag and Drop pattern (keyboard accessibility) — confidence MEDIUM (well-established W3C pattern)
- react-grid-layout known issues: infinite re-render on uncontrolled `layouts` prop — confidence HIGH (widely documented in library issues)
- WCAG 2.1 AA SC 2.1.1 Keyboard, SC 1.4.3 Contrast, SC 4.1.3 Status Messages — confidence HIGH (official W3C spec)

---
*Pitfalls research for: hub-navigation + widget-system milestone (v1.0), Deltagarportalen*
*Researched: 2026-04-28*
