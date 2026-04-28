---
phase: 02-static-widget-grid
plan: "02"
subsystem: ui
tags: [react, typescript, tailwind, svg, compound-component, widget, lucide-react]

# Dependency graph
requires:
  - phase: 02-static-widget-grid
    plan: "01"
    provides: Widget compound API (Widget.Root/Header/Body/Footer), useWidgetSize hook, WidgetProps type
provides:
  - ProgressRing SVG component (48/64/88px, --c-solid stroke, --stone-150 track)
  - Sparkline SVG component (hand-rolled polyline, no recharts, endpoint dot)
  - CvWidget default export (progress ring + milestone framing + section checklist)
  - CoverLetterWidget default export (draft count + last-edited label)
  - InterviewWidget default export (score + sparkline + weekly count)
  - JobSearchWidget default export (new-matches KPI + top-3 qualitative match cards)
affects:
  - 02-04-hub-wiring (consumes all 4 widgets via WIDGET_REGISTRY lazy imports)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Hand-rolled SVG for data visualization (ProgressRing circle arc, Sparkline polyline)
    - Anti-shaming KPI framing via milestone label function (no raw "75% klart" as primary label)
    - Qualitative match labels enforced via TypeScript union type ('Bra match' | 'Mycket bra match')
    - Mock data defined as module-level const outside component for performance

key-files:
  created:
    - client/src/components/widgets/ProgressRing.tsx
    - client/src/components/widgets/Sparkline.tsx
    - client/src/components/widgets/CvWidget.tsx
    - client/src/components/widgets/CoverLetterWidget.tsx
    - client/src/components/widgets/InterviewWidget.tsx
    - client/src/components/widgets/JobSearchWidget.tsx
  modified: []

key-decisions:
  - "Sparkline renders nothing when values.length < 2 — safe guard against empty mock data without throwing"
  - "CvWidget uses milestoneLabel(percent) to map 75% → 'Nästan klart — 1 sektion kvar' instead of raw percent KPI"
  - "JobSearchWidget uses TypeScript satisfies MatchRow[] on mock data to enforce qualitative-label-only constraint at compile time"
  - "InterviewWidget shows sparkline only at L-size (not minimal) — M-size shows score + weekly count only, follows widget size contract"

patterns-established:
  - "SVG primitives: no third-party chart library — hand-rolled SVG with var(--c-solid) stroke per STACK.md rationale"
  - "Widget mock data: module-level const outside component, typed with as const where needed"
  - "Anti-shaming: never expose raw percent as primary KPI label; always wrap in milestone/qualitative framing"

requirements-completed: [WIDG-01, WIDG-02]

# Metrics
duration: 2min
completed: 2026-04-28
---

# Phase 2 Plan 02: Widgets Cluster A Summary

**4 Söka Jobb widgets (CV, Cover Letter, Interview, Job Search) + ProgressRing and Sparkline SVG primitives — all hard-coded mock data, qualitative match labels, anti-shaming KPI framing**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-04-28T19:36:47Z
- **Completed:** 2026-04-28T19:38:46Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments

- Built ProgressRing (SVG circle arc, 3 sizes, var(--c-solid) stroke, centered label) and Sparkline (hand-rolled SVG polyline, no recharts, endpoint dot) — both with role=img and aria-label
- Built CvWidget with milestone framing ("Nästan klart — 1 sektion kvar") replacing raw "75% klart" as primary KPI; section checklist with emerald/warning icons at L-size
- Built InterviewWidget with 84/100 score + sparkline + weekly exercise count; sparkline shown only at L (not M), following size contract
- Built JobSearchWidget with "12 nya träffar idag" KPI and top-3 match cards enforcing qualitative labels only ("Bra match"/"Mycket bra match") via TypeScript union type — no raw percentages

## Mock Data Values (for plan 02-04 hub layout verification)

| Widget | Mock data |
|--------|-----------|
| CV | 75% complete, sections: 3 done / 1 warn ("Färdigheter saknas"), last edited "2 dagar sedan" |
| Personligt brev | 3 utkast, lastEdited "UX-designer hos Klarna · igår" |
| Intervjuträning | score 84, weeklyExercises 3, trend [62, 68, 71, 70, 76, 80, 82, 84] |
| Sök jobb | newToday 12, matches: UX-designer@Klarna (Mycket bra), Produktdesigner@Spotify (Bra), Senior UX Researcher@iZettle (Bra) |

## No Future Hook References

All 4 widgets use only static mock data (`const MOCK = {...}` at module level). No React Query, no Supabase calls, no useEffect data fetching. Phase 3 will replace these consts with real query hooks.

## Qualitative Labels Confirmation

JobSearchWidget shows qualitative labels only. Enforced at:
1. TypeScript level: `matchLabel: 'Bra match' | 'Mycket bra match'` union type in MatchRow interface
2. Mock data level: `satisfies MatchRow[]` on the matches array
3. Verified: `grep -E "[0-9]+%"` returns 0 matches in JobSearchWidget.tsx

## Task Commits

1. **Task 1: ProgressRing and Sparkline SVG primitives** - `09c3a96` (feat)
2. **Task 2: CvWidget + CoverLetterWidget** - `895e1f7` (feat)
3. **Task 3: InterviewWidget + JobSearchWidget** - `acc77e8` (feat)

## Files Created/Modified

- `client/src/components/widgets/ProgressRing.tsx` — SVG circle progress, 3 sizes, --c-solid stroke, role=img
- `client/src/components/widgets/Sparkline.tsx` — SVG polyline + endpoint dot, no recharts, role=img
- `client/src/components/widgets/CvWidget.tsx` — CV widget with progress ring, milestone label, checklist; default export
- `client/src/components/widgets/CoverLetterWidget.tsx` — draft count + last-edited label; default export
- `client/src/components/widgets/InterviewWidget.tsx` — score + sparkline + weekly count; default export
- `client/src/components/widgets/JobSearchWidget.tsx` — new-matches KPI + qualitative match cards; default export

## Decisions Made

- Sparkline renders null for fewer than 2 values — defensive guard without throwing (affects Phase 3 if query returns empty array)
- CvWidget milestone framing: threshold at 60% ("Nästan klart") and 80% ("Klar att skickas") per UI-SPEC anti-shaming rules
- JobSearchWidget uses `satisfies MatchRow[]` (not `as const`) to preserve type checking while enforcing qualitative label union
- InterviewWidget shows sparkline only at L-size to respect M-size content budget (score + count is sufficient at M)

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## Next Phase Readiness

- All 4 Cluster A widgets are default-exported and will resolve correctly via `WIDGET_REGISTRY`'s existing `lazy(() => import('./CvWidget'))` entries
- Plan 02-03 (Cluster B) runs in parallel and creates disjoint files — no conflicts
- Plan 02-04 (hub wiring) can consume all widgets via the existing registry stubs

---
*Phase: 02-static-widget-grid*
*Completed: 2026-04-28*
