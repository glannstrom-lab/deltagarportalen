---
phase: 01-hub-navigation-shell
plan: "02"
subsystem: ui
tags: [hub-nav, routing, react-router, lazy-loading, feature-flag]

# Dependency graph
requires:
  - phase: 01-hub-navigation-shell
    plan: "01"
    provides: "navHubs, isHubNavEnabled, HubId exports from navigation.ts"
provides:
  - 5 hub placeholder page components (HubOverview, JobsokHub, KarriarHub, ResurserHub, MinVardagHub)
  - 5 lazy routes inside existing RootRoute block (oversikt, jobb, karriar, resurser, min-vardag)
  - Conditional index redirect: / -> /oversikt when VITE_HUB_NAV_ENABLED=true
affects:
  - 01-03-sidebar (links to /oversikt, /jobb, /karriar, /resurser, /min-vardag)
  - 01-04-hub-bottom-nav (links to same 5 paths)
  - 01-05-smoke-test (verifies 27 deep-link routes still resolve)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Hub placeholder page pattern: PageLayout with domain prop, no widgets, dashed-border placeholder content
    - Conditional index route: isHubNavEnabled() at module load gates redirect vs Dashboard render

key-files:
  created:
    - client/src/pages/hubs/HubOverview.tsx
    - client/src/pages/hubs/JobsokHub.tsx
    - client/src/pages/hubs/KarriarHub.tsx
    - client/src/pages/hubs/ResurserHub.tsx
    - client/src/pages/hubs/MinVardagHub.tsx
  modified:
    - client/src/App.tsx

key-decisions:
  - "Hub routes added as peers inside existing RootRoute block (not a new wrapper) per ARCHITECTURE.md Anti-Pattern 3"
  - "isHubNavEnabled() evaluated at module load in JSX — no useEffect, no state — flag is build-time constant read from env"

patterns-established:
  - "Hub placeholder: PageLayout + dashed-border div + t() with inline fallback string (no sv.json entry required)"
  - "Conditional index route via isHubNavEnabled() — existing Dashboard route preserved behind flag-off path"

requirements-completed:
  - NAV-01
  - NAV-04
  - NAV-05

# Metrics
duration: 8min
completed: 2026-04-28
---

# Phase 1 Plan 02: Hub Pages and Routes Summary

**5 lazy-loaded hub placeholder pages (action/activity/coaching/info/wellbeing domains) wired as React Router routes inside the existing RootRoute block, with conditional / -> /oversikt index redirect gated by VITE_HUB_NAV_ENABLED**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-04-28T00:00:00Z
- **Completed:** 2026-04-28
- **Tasks:** 2
- **Files modified:** 6 (5 created + App.tsx)

## Accomplishments

- Created `client/src/pages/hubs/` directory with 5 placeholder hub pages, each using PageLayout with correct domain prop (action, activity, coaching, info, wellbeing)
- Added 5 lazy imports and 5 routes (`oversikt`, `jobb`, `karriar`, `resurser`, `min-vardag`) inside the existing `<Route path="/" element={<RootRoute />}>` block — peers of the 27 existing deep-link routes
- Index route (`/`) now conditionally redirects to `/oversikt` when `isHubNavEnabled()` returns true; otherwise still renders `<Dashboard />` exactly as before
- Production build generates 5 separate lazy chunks; TypeScript compiles cleanly; all 27 existing deep-link routes preserved unchanged

## Task Commits

Each task was committed atomically:

1. **Task 1: Create 5 empty hub page components in pages/hubs/** - `49f6275` (feat)
2. **Task 2: Add 5 hub routes + conditional index redirect to App.tsx** - `36563d0` (feat)

**Plan metadata:** (final commit hash added below)

## Files Created/Modified

- `client/src/pages/hubs/HubOverview.tsx` — Oversikt hub placeholder, domain="action"
- `client/src/pages/hubs/JobsokHub.tsx` — Jobbsök hub placeholder, domain="activity"
- `client/src/pages/hubs/KarriarHub.tsx` — Karriar hub placeholder, domain="coaching"
- `client/src/pages/hubs/ResurserHub.tsx` — Resurser hub placeholder, domain="info"
- `client/src/pages/hubs/MinVardagHub.tsx` — Min vardag hub placeholder, domain="wellbeing"
- `client/src/App.tsx` — Added isHubNavEnabled import, 5 lazy imports, conditional index route, 5 hub routes

## Decisions Made

- Hub routes added as peers inside existing `<Route path="/" element={<RootRoute />}>` block (not as a new layout wrapper) per ARCHITECTURE.md Anti-Pattern 3 prohibition
- `isHubNavEnabled()` evaluated inline in JSX — flag is a build-time env constant, no runtime state needed

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Routes `/oversikt`, `/jobb`, `/karriar`, `/resurser`, `/min-vardag` are live and renderable
- Plan 03 (Sidebar) and Plan 04 (HubBottomNav) can safely link to these paths
- Plan 05 (smoke test) can now verify all 27 deep-link routes still resolve correctly
- To activate hub nav: set `VITE_HUB_NAV_ENABLED=true` in environment

---
*Phase: 01-hub-navigation-shell*
*Completed: 2026-04-28*
