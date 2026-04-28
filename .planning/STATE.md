# State — Deltagarportalen

## Project Reference

See: `.planning/PROJECT.md` (updated 2026-04-28)

**Core value:** Hjälp utsatta arbetssökande att komma framåt med empati, tillgänglighet och AI-stöd som sänker tröskeln.
**Current focus:** Phase 1 — Hub Navigation Shell

## Current Position

Phase: 1 of 5 (Hub Navigation Shell)
Plan: 1 of 5 in current phase
Status: In progress
Last activity: 2026-04-28 — Plan 01-01 navigation-refactor completed

Progress: [█░░░░░░░░░] 10%

## Performance Metrics

**Velocity:**
- Total plans completed: 1
- Average duration: ~2 min
- Total execution time: ~2 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1 - Hub Navigation Shell | 1/5 | ~2 min | ~2 min |

**Recent Trend:** 1 plan completed 2026-04-28

## Accumulated Context

### Decisions

- [v1.0 pre-planning]: Drag/resize via react-grid-layout deferred to v1.1 — WIDG scope in v1.0 is static grid + S/M/L toggle + hide/show only
- [v1.0 pre-planning]: Rollout via `VITE_HUB_NAV_ENABLED` environment flag — no per-user DB flag (prevents two-navigation-reality problem for consultant coachning)
- [v1.0 pre-planning]: Empathy review by `arbetskonsulent` + `langtidsarbetssokande` agents is a formal Phase 3 ship gate (A11Y-05), not optional
- [v1.0 pre-planning]: Interview session scores (DATA-01) and Personal Brand audit scores (DATA-02) go to Supabase in Phase 3
- [v1.0 pre-planning]: No recharts dependency — hand-rolled SVG polylines for sparklines (~160 KB saved)
- [v1.0 pre-planning]: react-grid-layout introduced in v1.1 only — Phases 1-4 use plain CSS grid
- [01-01]: pageToHub built by explicit memberPaths iteration (not URL prefix matching) per PITFALLS.md Pitfall 2
- [01-01]: Oversikt hub memberPaths includes '/' so legacy bookmarks resolve cleanly before redirect plan ships

### Pending Todos

None yet.

### Blockers/Concerns

- [Phase 1]: Rollout communication plan for consultants should be prepared before Phase 1 ships (one-pager; consultants see nav change on flag-flip date)
- [Phase 3]: Hub-summary query performance needs `EXPLAIN ANALYZE` before data loader is designed — see PITFALLS.md Pitfall 3/18
- [Phase 4]: Per-breakpoint persistence schema decision must be made before the Supabase migration is written — cannot change post-deploy without destructive migration

## Session Continuity

Last session: 2026-04-28
Stopped at: Completed 01-01-navigation-refactor-PLAN.md — ready for 01-02-hub-pages-and-routes
Resume file: None
