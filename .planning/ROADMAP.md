# Roadmap: Deltagarportalen — v1.0 Hub-Navigation

## Overview

This milestone transforms Deltagarportalen's flat 27-item sidebar into 5 domain-oriented hubs (Översikt, Söka Jobb, Karriär, Resurser, Min Vardag), each exposing its deep-link pages as data-rich widget cards. The build order is designed to isolate risk: routing is proven before widgets exist, widget structure is proven before real data is wired, data contracts are proven before persistence is added, and persistence is proven before the remaining widget surface is completed. Every phase delivers a testable, non-regressive product state.

## Phases

- [ ] **Phase 1: Hub Navigation Shell** - Nav refactor, 5 empty hub routes, mobile bottom nav, deep-link smoke test
- [ ] **Phase 2: Static Widget Grid** - Widget compound component, HubGrid, 8-10 representative widgets with mock data, S/M/L toggle, error boundaries
- [ ] **Phase 3: Data Wiring + WCAG** - React Query data hooks, hub-level loader, empathy-reviewed copy, prefers-reduced-motion, keyboard, Interview + Personal Brand Supabase migration
- [ ] **Phase 4: Layout Persistence + Hide/Show** - user_widget_layouts table + RLS, useWidgetLayout hook, hide/show widget, reset layout (no drag/resize)
- [ ] **Phase 5: Full Hub Coverage + Översikt** - Remaining widgets for all hubs, Översikt onboarding XL widget + cross-hub summaries, full empty-state pass

## Phase Details

### Phase 1: Hub Navigation Shell
**Goal**: Users can navigate the portal through 5 domain hubs, all existing deep-links continue to work, and rollout can be toggled via an environment flag
**Depends on**: Nothing (first phase)
**Requirements**: NAV-01, NAV-02, NAV-03, NAV-04, NAV-05
**Success Criteria** (what must be TRUE):
  1. User sees 5 hub links in the sidebar (Översikt, Söka Jobb, Karriär, Resurser, Min Vardag); navigating to a hub collapses the others and expands sub-items for the active hub
  2. User on mobile sees a 5-tab bottom nav at hub level, with the correct tab highlighted when navigating into any deep-link page within that hub
  3. All 27 existing deep-link routes render their correct page without redirection or 404 after the nav refactor
  4. Setting `VITE_HUB_NAV_ENABLED=false` restores the old navigation; both modes are independently functional
**Plans**: 5 plans
- [ ] 01-01-navigation-refactor-PLAN.md — NavHub model, navHubs, pageToHub, isHubNavEnabled, sv.json hub labels
- [ ] 01-02-hub-pages-and-routes-PLAN.md — 5 empty hub page components + App.tsx routes + conditional index redirect
- [ ] 01-03-sidebar-refactor-PLAN.md — Sidebar conditionally renders hub mode (5 hubs + active sub-items) or legacy mode
- [ ] 01-04-mobile-bottom-nav-PLAN.md — HubBottomNav 5-tab mobile bar + Layout.tsx integration
- [ ] 01-05-deep-link-smoke-test-PLAN.md — automated regression coverage for all 28 deep-links + flag-flip atomic switch

### Phase 2: Static Widget Grid
**Goal**: Hub pages display a structured grid of widget cards with correct visual design, per-widget isolation from errors, and size-toggle interaction — all validated before any real data is introduced
**Depends on**: Phase 1
**Requirements**: WIDG-01, WIDG-02, WIDG-03
**Success Criteria** (what must be TRUE):
  1. Hub pages show widgets grouped in labeled sections in a 4-column desktop / 2-column mobile CSS grid with S/M/L sizes visually distinct
  2. User can click S, M, or L toggle buttons (keyboard-accessible) on any widget to resize it; the grid reflows correctly
  3. A widget with a simulated data error shows a graceful per-widget fallback card; all surrounding widgets remain fully functional
  4. No widget component appears in the main JS bundle; vite-bundle-visualizer confirms all widgets are code-split
**Plans**: TBD

### Phase 3: Data Wiring + WCAG
**Goal**: Widgets display real data from Supabase using shared React Query cache keys, all WCAG 2.1 AA requirements are met, empathy-reviewed copy ships, and Interview + Personal Brand scores are cloud-persisted
**Depends on**: Phase 2
**Requirements**: HUB-01, HUB-02, HUB-03, HUB-04, DATA-01, DATA-02, A11Y-01, A11Y-02, A11Y-03, A11Y-04, A11Y-05
**Success Criteria** (what must be TRUE):
  1. Widgets in all 4 content hubs show live data from Supabase; navigating from a hub widget to its deep-link page and back renders instantly from cache (no re-fetch on cache hit)
  2. User can reach and operate every hub widget (resize toggle, footer actions, navigation links) using only the keyboard; no mouse required
  3. All hub and widget animations are disabled or replaced with instant transitions when `prefers-reduced-motion: reduce` is active in the OS
  4. No widget in any hub displays a raw percentage as a primary KPI; milestone-framing replaces completion rings; closed/rejected applications are hidden by default
  5. All widget copy, empty-states, and framing have been reviewed and signed off by the `arbetskonsulent` and `langtidsarbetssokande` agents before this phase ships
  6. Interview session scores and Personal Brand audit scores persist in Supabase and are visible across sessions in their respective widgets
**Plans**: TBD

### Phase 4: Layout Persistence + Hide/Show
**Goal**: Users can hide individual widgets per hub, restore hidden widgets, reset to default layout, and have these preferences survive across sessions and devices — without drag/resize
**Depends on**: Phase 3
**Requirements**: CUST-01, CUST-02, CUST-03
**Success Criteria** (what must be TRUE):
  1. User can hide any widget on a hub and the widget disappears; hidden widgets can be re-added from a panel; state survives page reload
  2. User can reset a hub's layout to the default with one action; after resetting, the hub shows the default widget set and sizes
  3. User's widget visibility and sizes per hub are stored in Supabase and restored correctly when the user logs in on a different browser or device
**Plans**: TBD

### Phase 5: Full Hub Coverage + Översikt
**Goal**: Every hub has its full widget set with real data and empathy-safe empty states, and Översikt shows an actionable onboarding widget plus cross-hub summary cards
**Depends on**: Phase 4
**Requirements**: HUB-05, HUB-06
**Success Criteria** (what must be TRUE):
  1. Översikt shows an onboarding/next-step XL widget surfacing the user's most relevant next action, plus up to 6 cross-hub summary widgets covering activity across all 4 content hubs
  2. Every widget across all 5 hubs has a compassionate, action-oriented empty state — no bare zeros, no "Inga data" — verified by loading each hub with a fresh test account
  3. All widgets described in HUB-01 through HUB-04 are present and showing real data, completing full widget coverage across every hub
**Plans**: TBD

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Hub Navigation Shell | 4/5 | In Progress|  |
| 2. Static Widget Grid | 0/TBD | Not started | - |
| 3. Data Wiring + WCAG | 0/TBD | Not started | - |
| 4. Layout Persistence + Hide/Show | 0/TBD | Not started | - |
| 5. Full Hub Coverage + Översikt | 0/TBD | Not started | - |

---
*Roadmap created: 2026-04-28*
*Milestone: v1.0 Hub-Navigation*
