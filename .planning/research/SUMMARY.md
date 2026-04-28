# Project Research Summary

**Project:** Deltagarportalen — Hub Navigation + Widget System
**Domain:** Dashboard/hub navigation with smart widget cards for a vulnerable-user job-seeker portal
**Researched:** 2026-04-28
**Confidence:** HIGH

## Executive Summary

This milestone transforms Deltagarportalen's flat 27-item sidebar navigation into a 5-hub domain-oriented architecture (Oversikt, Soka Jobb, Karriar, Resurser, Min Vardag), each hub exposing its deep-link pages as data-rich widget cards. The system is built entirely on the existing React 19 + Tailwind 4 + Zustand + React Query + Supabase stack. The only net-new npm dependency is react-grid-layout@^2.2.3, deferred to Phase 4 drag/resize work; Phases 1-3 use a plain CSS grid derived from the existing nav-hub-sketch.html prototype. All sparkline needs are met with hand-rolled SVG polylines — recharts is explicitly not needed and must not be added.

The recommended build order is incremental and de-risked: Phase 1 ships hub shell routes and sidebar refactor with zero widget code; Phase 2 adds static widget cards with mock data to validate the visual grid; Phase 3 wires real data and shared React Query cache keys; Phase 4 introduces layout persistence (new user_widget_layouts Supabase table) and the drag/resize library. This order means every phase delivers a shippable, testable product state and avoids the most dangerous pitfalls (deep-link breakage, bundle bloat, infinite re-render loops) before they can materialise.

The target group — long-term unemployed users including those with NPF, exhaustion syndrome, and anxiety — imposes hard constraints that override standard dashboard design patterns. Default widget density must be 3-4 maximum for new users. Progress indicators must never surface raw percentages that read as failure. Notification badges must be limited to one visible at a time. Drag-and-drop must never be the only customization mechanism. prefers-reduced-motion compliance is a hard Phase 3 requirement, not a post-ship concern. The arbetskonsulent and langtidsarbetssokande agents must review all widget copy before Phase 3 ships.

---

## Key Findings

### Recommended Stack

The project already has everything it needs for Phases 1-3. No new dependencies are required until Phase 4. The only addition evaluated and approved is react-grid-layout@^2.2.3 — a TypeScript-native v2 rewrite (December 2025) with confirmed React 19 compatibility and no conflict with Tailwind 4. Its WidthProvider is replaced by useContainerWidth() in v2. Both RGL CSS files (react-grid-layout/css/styles.css and react-resizable/css/styles.css) must be imported in client/src/main.tsx; the grid breaks silently without them.

For Supabase, a new user_widget_layouts table is needed in Phase 4 with a UNIQUE (user_id, hub_id) constraint enabling safe UPSERT and four RLS policies restricted to auth.uid() = user_id. The layout column is JSONB and starts as a simple { id, size, order } array in Phase 2-3, evolving to react-grid-layout's {i, x, y, w, h} format only in Phase 4 — premature coupling to rgl's schema before Phase 4 is an explicit anti-pattern.

**Core technologies:**
- react-grid-layout@^2.2.3: drag, resize, breakpoints for widget grid — TypeScript-native v2, React 19 confirmed, introduce only in Phase 4
- framer-motion@^12.36.0 (already installed): widget mount/exit animations only, outside the rgl grid item, always respecting prefers-reduced-motion
- zustand@^5.0.11 (already installed): hub-level state (active hub, edit mode toggle) — sufficient without additions
- @tanstack/react-query@^5.90.21 (already installed): widget data fetching with shared query keys; staleTime: Infinity on layout queries
- @supabase/supabase-js@^2.97.0 (already installed): layout persistence via direct client in widgetLayoutApi.ts — not via /api/ai.js
- Hand-rolled SVG polyline: sparklines in interview score and wellness widgets — ~15 lines, replaces recharts, saves ~160 KB

### Expected Features

**Must have (table stakes — Phase 1-2):**
- Hub routing structure (5 routes: /oversikt, /jobb, /karriar, /resurser, /min-vardag) with all 27 existing deep-link routes unchanged as peers
- Sidebar refactor: 5 hub links, active hub expands to show deep-link sub-items
- Mobile HubBottomNav (5-tab persistent bar replacing hamburger at hub level)
- Static widget grid per hub with real data from existing hooks
- CV widget (completion ring), Applications widget (stacked status bar), Job matches widget (top 3 cards)
- Oversikt page: onboarding/next-step XL widget + cross-hub summary row
- Per-widget empty states with action-oriented copy (not bare zeros)
- Responsive 2-column layout on mobile

**Should have (differentiators — Phase 2-3):**
- S/M/L size toggle on hover per nav-hub-sketch.html pattern
- Layout persistence per user per hub via user_widget_layouts table (UPSERT + debounce 800ms)
- Hide widget option (visibility flag in layout)
- Keyboard-navigable widget grid (WCAG 2.1 AA, Tab + Arrow keys)
- Inline mood check-in in Wellness widget
- Interview session history migrated to Supabase (prerequisite for sparkline in M/L widget)
- Continue where you left off context on Oversikt

**Defer to Phase 4+ (not for initial launch):**
- Drag-and-drop widget reorder via react-grid-layout
- Add widget from catalogue / widget registry browser
- Smart contextual suggestions on Oversikt (rules engine or AI)
- Per-breakpoint layout customization exposed to users

**Anti-features — never build:**
- Notification dots on every widget (maximum one badge on nav at any time)
- Gamification (points, levels, leaderboards)
- Progress percentages as prominent KPIs for incompleteness
- Dense multi-axis data visualizations
- Overdue labels on goals or applications
- Comparison to other users
- Mandatory wellness logging (always Om du vill framing)

### Architecture Approach

The hub system slots into the existing React Router v6 authenticated shell without creating a new layout layer. Hub pages are peers of the 27 existing deep-link pages inside the root authenticated Route. Five new lazy-loaded pages (pages/hubs/) are added alongside the existing pages. The index route redirects to /oversikt. Navigation state is driven by a refactored navigation.ts replacing NavGroup with NavHub (containing domain, memberPaths, and items). Active hub detection uses an explicit pageToHub membership map — never URL prefix matching.

The widget layer is a compound component system (Widget.tsx with Root, Header, Body, Footer sub-components) where each widget owns its React Query hook using the same queryKey as its corresponding deep-link page. This is the core caching contract: widget and page share the same cache, so navigating hub to page is instant on cache hit. Layout state lives in useWidgetLayout(hubId) with staleTime: Infinity and optimistic updates, never in component local state (which resets on every navigation).

**Major components:**
1. pages/hubs/ (5 files) — hub page components, own editMode state, render HubGrid
2. components/widgets/Widget.tsx — compound base component (Root/Header/Body/Footer), accepts id, size, onSizeChange, editMode
3. components/widgets/registry.ts — widget registry mapping IDs to components, defaultSize, allowedSizes
4. components/widgets/defaultLayouts.ts — getDefaultLayout(hubId) returning ordered {id, size, order} arrays
5. components/widgets/HubGrid.tsx — CSS grid container (Phases 1-3 plain grid; Phase 4 wraps react-grid-layout)
6. hooks/useWidgetLayout.ts — layout persistence hook with optimistic update + debounced UPSERT
7. services/widgetLayoutApi.ts — getLayout / upsertLayout / deleteLayout against user_widget_layouts
8. components/layout/HubBottomNav.tsx — mobile 5-tab bar, renders only on isMobile
9. components/layout/Sidebar.tsx (modified) — hub + sub-item rendering, active hub via pageToHub map

### Critical Pitfalls

1. **Deep-link breakage on hub route insertion** — Add hub routes as children inside the existing Route path="/" block, never alongside it. Write an automated smoke test covering all 27 existing routes before merging Phase 1. The catch-all * redirect silently hides broken routes during manual testing.

2. **N+1 Supabase query waterfall on hub mount** — Create a hub-level data loader (useHubData) that batches the 3-5 tables per hub into one query and distributes via context. Individual widgets read from context, not from their own Supabase calls. 8-10 independent queries on mount create visible staggered loading that disorients NPF users.

3. **Error cascade: one widget failure blacks out entire hub** — Every widget must have its own ErrorBoundary with a graceful per-widget fallback. Use isError from useQuery for expected failures; never throw from widget data logic.

4. **Shaming UX: progress rings and rejection counts as prominent KPIs** — Replace percentage completion rings with milestone framing. Hide closed/rejected application counts by default. Replace match-score numbers with qualitative labels. Mandatory empathy review by arbetskonsulent and langtidsarbetssokande agents before Phase 3 ships.

5. **react-grid-layout infinite re-render loop** — onLayoutChange must never unconditionally call setState. Only call setLayout when position or size actually changed (shallow equality). Fire Supabase saves on onDragStop/onResizeStop only, not on onLayoutChange. This is a well-documented rgl trap that crashes browser tabs.

6. **Bundle bloat from static widget imports** — All widget components must be lazy()-imported from Phase 2. Widgets not in the active layout must never load. Verify with vite-bundle-visualizer after Phase 2.

7. **Keyboard inaccessibility of widget customization (WCAG 2.1 AA violation)** — S/M/L size toggle buttons are the primary customization mechanism and must be keyboard-operable from Phase 2. Drag-and-drop (Phase 4) must have a keyboard-accessible alternative with aria-grabbed/aria-dropeffect.

---

## Implications for Roadmap

Based on research, a 5-phase build order is the correct and safe sequence. Each phase delivers a non-regressive, testable state.

### Phase 1: Hub Navigation Shell
**Rationale:** Routing infrastructure must exist before any widget can be rendered. Isolating routing risk from widget complexity is the single most important sequencing decision — the 27 existing routes are a regression risk that must be validated in isolation.
**Delivers:** Sidebar showing 5 hub links + active sub-item expansion; HubBottomNav on mobile; 5 empty hub pages at correct routes; / to /oversikt redirect; navigation.ts refactored to NavHub with memberPaths; all 27 existing routes verified by automated smoke test.
**Addresses:** Hub routing structure, sidebar refactor, mobile tab bar (table stakes)
**Avoids:** Deep-link breakage (Pitfall 1), active-state broken (Pitfall 2), gradual rollout two-realities (Pitfall 16)
**Must decide before writing code:** Rollout strategy is environment flag (VITE_HUB_NAV_ENABLED), not per-user DB flag.

### Phase 2: Static Widget Grid with Design Validation
**Rationale:** Validate the visual grid and component architecture before introducing real data fetching complexity. Mistakes at this layer are cheap to fix before data wiring.
**Delivers:** Widget.tsx compound component; HubGrid.tsx (plain CSS grid, 4-col desktop / 2-col mobile); 8-10 representative widgets with static placeholder data; getDefaultLayout(hubId) defaults; S/M/L size toggle in edit mode; per-widget ErrorBoundary and skeleton loading; all widgets lazy-imported.
**Uses:** Existing Tailwind tokens, lucide-react icons, framer-motion for mount animations
**Avoids:** Bundle bloat (Pitfall 14), error cascade (Pitfall 4), overwhelming first-load for new users (Pitfall 10)
**Flag:** Notification badge strategy defined here — extend existing NEWEST_FEATURE pattern in navigation.ts, do not create a parallel badge system.

### Phase 3: Widget Data Wiring + WCAG Compliance
**Rationale:** Real data wiring comes after the component architecture is proven. Shared React Query keys between widgets and deep-link pages must be established here. WCAG compliance must be concurrent with interactions, not a post-ship pass.
**Delivers:** Per-widget React Query hooks with shared queryKeys; hub-level data loader batching Supabase queries; real data in all widgets; empathy-reviewed empty states and copy; keyboard-operable S/M/L toggles; prefers-reduced-motion compliance on all animations; NVDA-tested layout change announcements; Oversikt with onboarding widget and cross-hub summary cards.
**Avoids:** N+1 query waterfall (Pitfall 3), shaming UX (Pitfall 11), keyboard inaccessibility (Pitfall 9), motion sickness (Pitfall 13), screen reader overload (Pitfall 17), RLS overhead (Pitfall 18)
**Gate:** Empathy review by arbetskonsulent and langtidsarbetssokande agents is a formal Phase 3 ship gate — not best-effort.

### Phase 4: Layout Persistence + Drag/Resize
**Rationale:** Persistence infrastructure must exist before drag/resize interactions are added — they are architecturally coupled. react-grid-layout is introduced here for the first time. JSONB column handles both the simple {id, size, order} format from earlier phases and rgl's {i, x, y, w, h} format without a second migration.
**Delivers:** user_widget_layouts Supabase table + RLS; useWidgetLayout(hubId) with optimistic update + debounce; widgetLayoutApi.ts; HubToolbar (Anpassa vy toggle); AddWidgetSheet; install react-grid-layout@^2.2.3; HubGrid upgraded to rgl; per-breakpoint automatic size reduction; resetLayout flow; mergeLayouts reconciliation function.
**Uses:** react-grid-layout v2, Supabase UPSERT pattern from STACK.md, useMutation with onError rollback
**Avoids:** Layout persistence race condition (Pitfall 5), multi-device layout conflict (Pitfall 6), default layout drift (Pitfall 7), infinite re-render loop (Pitfall 15), mobile touch/scroll conflict (Pitfall 8)
**Flag:** Per-breakpoint persistence schema must be decided before migration is written — cannot be changed post-deploy without a destructive migration.

### Phase 5: Full Widget Coverage + Polish
**Rationale:** Remaining widgets and Oversikt personalisation are lower-risk and build incrementally on the stable Phase 4 architecture.
**Delivers:** All remaining widgets (LinkedIn, Salary, Education, Exercises, Personal Brand, External Resources, Print Resources, Network); Oversikt gets useWidgetLayout(oversikt) for user reordering; keyboard-only session audit of all hubs; vite-bundle-visualizer pass; Personal Brand and Interview simulator scores cloud-persisted.

### Phase Ordering Rationale

- Routing before widgets: hub pages cannot render widgets until their routes and navigation shell are stable. Phase 1 isolates routing risk.
- Static before live data: Phase 2 establishes the widget component API as a fixed contract before data hooks are wired in Phase 3, preventing widget API churn.
- Data before persistence: Phase 3 establishes the React Query key contract between widgets and pages. This contract must be stable before Phase 4 adds persistence.
- Persistence before drag: react-grid-layout is introduced only once there is a persistence layer to receive its layout output. Installing rgl without persistence causes user frustration (layout resets on every navigation).
- Architecture pitfalls frontloaded: the most catastrophic pitfalls are all preventable in Phases 1-2, before any user-facing complexity is introduced.

### Research Flags

Phases needing deeper attention during planning or execution:

- **Phase 1:** Rollout strategy decision is a hard blocker — formally decide environment flag approach and prepare consultant communication plan before any Phase 1 code is written.
- **Phase 3:** Empathy review by specialist agents is a formal gate, not best-effort. Must be scheduled into Phase 3 sprint planning.
- **Phase 4:** Per-breakpoint persistence schema requires an explicit architecture decision before the migration is written. Cannot be changed post-deployment without a destructive migration.
- **Phase 3 WCAG:** Keyboard navigation and NVDA screen reader testing must be in Phase 3 acceptance criteria. Retrofitting after Phase 4 drag/resize is significantly more expensive.

Phases with well-documented patterns (skip research-phase):

- **Phase 2 (CSS grid):** Grid math directly from nav-hub-sketch.html (4-col, grid-auto-rows: 150px, gap: 14px, 2-col breakpoint) — already prototyped.
- **Phase 4 (Supabase UPSERT):** Full migration SQL, RLS policies, and client UPSERT pattern specified in STACK.md. Implementation is copy-adapt.
- **Phase 4 (react-grid-layout):** Complete integration code (CSS imports, useContainerWidth, layout schema, debounced save) documented in STACK.md.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Direct package.json read + rgl v2 changelog + recharts React 19 issue tracker. React 19 compatibility confirmed from peerDeps. |
| Features | HIGH | Derived from direct codebase inspection of 27 pages, navigation.ts, existing data hooks, DESIGN.md, and nav-hub-sketch.html. No speculation. |
| Architecture | HIGH | All conclusions from reading App.tsx, Sidebar.tsx, Layout.tsx, navigation.ts, PageLayout.tsx directly. Routing changes are a concrete code diff. |
| Pitfalls | HIGH | Grounded in actual codebase analysis, known rgl issues, portal-review-2026-04.md documented problems, WCAG 2.1 AA spec, and project tone requirements. |

**Overall confidence:** HIGH

### Gaps to Address

- **Interview session history persistence:** InterviewSimulator.tsx stores scores in component state (useAchievementTracker). The M/L interview widget sparkline is blocked on cloud persistence. Assess scope before Phase 3 planning — may require a new Supabase table.
- **Personal brand audit persistence:** BrandAuditTab score lives in component state. Same gap as interview sessions. Needs cloud persistence before the personal brand widget can show a real KPI.
- **Education save to profile feature:** useEducationSearch hook exists but a save-to-profile mechanism may be missing. Validate before including the Education widget in a phase.
- **International saved countries:** FEATURES.md flags this as needs verification. Verify before Phase 5 planning.
- **Hub-summary query performance:** The correct Supabase implementation (RPC function vs. Promise.all vs. join) depends on RLS policy complexity per table. Run EXPLAIN ANALYZE on the 3-5 most queried widget tables before designing the Phase 3 data loader.

---

## Sources

### Primary (HIGH confidence)
- client/src/App.tsx — routing structure, lazy import patterns, catch-all redirect
- client/src/components/layout/Sidebar.tsx — current navGroups rendering, collapse behavior
- client/src/components/layout/navigation.ts — NavGroup/NavItem types, active-state logic, NEWEST_FEATURE badge pattern
- client/src/components/Layout.tsx — authenticated shell, mobile layout, BottomBar usage
- client/package.json — confirmed recharts not installed; all existing dependency versions
- supabase/migrations/20260316_add_widget_config_column.sql — existing dashboard_widget_config in user_preferences
- docs/DESIGN.md — 5 semantic domains, pastell token rules, motion constraints, tone guidelines
- nav-hub-sketch.html — widget sizes (S/M/L), hub sidebar pattern, grid math, Anpassa vy concept
- docs/portal-review-2026-04.md — dead-code pattern, dual AI backends, state-store collisions, 19% test coverage
- docs/security-audit.md — RLS baseline, CORS configuration
- PROJECT.md — target group definition (NPF, exhaustion, long-term unemployed), WCAG 2.1 AA requirement
- https://github.com/react-grid-layout/react-grid-layout — README, CHANGELOG, peerDependencies, v2 API
- https://supabase.com/docs/guides/database/postgres/row-level-security — RLS policy patterns
- WCAG 2.1 AA SC 2.1.1 Keyboard, SC 4.1.3 Status Messages — official W3C spec

### Secondary (MEDIUM confidence)
- https://www.ilert.com/blog/building-interactive-dashboards-why-react-grid-layout-was-our-best-choice — alternatives comparison
- ARIA Authoring Practices Guide: Drag and Drop with keyboard — W3C pattern
- react-grid-layout known issues tracker — infinite re-render on uncontrolled layouts prop

### Tertiary (evaluated and rejected)
- react-grid-layout-19 (Censkh fork) — 0 stars, 0 releases, do not use; main package works with React 19

---

*Research completed: 2026-04-28*
*Ready for roadmap: yes*
