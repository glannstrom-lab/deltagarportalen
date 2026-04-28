---
phase: 02-static-widget-grid
plan: "03"
subsystem: ui
tags: [react, typescript, tailwind, widgets, stacked-bar, range-bar, anti-shaming, empty-state]

# Dependency graph
requires:
  - phase: 02-static-widget-grid
    plan: "01"
    provides: Widget compound API, useWidgetSize hook, WidgetProps type
provides:
  - StackedBar reusable primitive (proportional segments, deEmphasized opacity, accessible)
  - RangeBar reusable primitive (low/median/high track with marker dot)
  - ApplicationsWidget (Mina ansökningar — 12 totalt, stacked bar, amber alert)
  - SpontaneousWidget (Spontanansökan — 5 företag i pipeline)
  - SalaryWidget (Lön & marknad — 52 000 kr/mån + range bar)
  - InternationalWidget (Internationellt — action-oriented empty state)
affects:
  - 02-04-hub-wiring (consumes all 4 default exports via lazy registry)
  - Phase 5 (StackedBar + RangeBar available for reuse)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "satisfies StackedBarSegment[] for typed mock data without losing literal inference"
    - "deEmphasized flag on StackedBarSegment maps to opacity: 0.6 (anti-shaming pattern)"
    - "action-oriented empty state: question framing + CTA (no bare zero, no Inga)"
    - "RangeBar marker position: calc((median - low) / (high - low) * 100%) with -6px offset for 12px dot"

key-files:
  created:
    - client/src/components/widgets/StackedBar.tsx
    - client/src/components/widgets/RangeBar.tsx
    - client/src/components/widgets/ApplicationsWidget.tsx
    - client/src/components/widgets/SpontaneousWidget.tsx
    - client/src/components/widgets/SalaryWidget.tsx
    - client/src/components/widgets/InternationalWidget.tsx
  modified: []

key-decisions:
  - "StackedBar uses named export (not default) as shared primitive — consistent with plan spec and allows tree-shaking"
  - "RangeBar uses named export (not default) — same rationale as StackedBar"
  - "ApplicationsWidget footer uses !minimal guard (not !compact) — footer visible at L but not at S/M per spec"
  - "SalaryWidget has no footer — per UI-SPEC Copywriting Contract table ('no footer in M')"
  - "InternationalWidget empty state uses question framing per UI-SPEC Empty State Copy Contract row"

# Metrics
duration: ~2min
completed: 2026-04-28
---

# Phase 2 Plan 03: Widgets Cluster B Summary

**4 Söka Jobb widgets (ApplicationsWidget, SpontaneousWidget, SalaryWidget, InternationalWidget) + 2 reusable visual primitives (StackedBar, RangeBar) — 6 files, all TypeScript-clean**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-04-28T19:36:53Z
- **Completed:** 2026-04-28T19:39:00Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments

- Built StackedBar primitive with proportional segment rendering, deEmphasized opacity reduction (anti-shaming), and accessible role=img aria-label
- Built RangeBar primitive with low/median/high track, marker dot positioned via calc(), --c-solid domain color, Swedish locale formatting
- Built ApplicationsWidget: 12 totalt KPI + 4-segment stacked bar (avslutade de-emphasized at stone-300 + 0.6 opacity) + amber chip "1 ansökan väntar på ditt svar" — closed count is NOT a primary KPI label
- Built SpontaneousWidget: 5 företag i pipeline compact KPI at S-size with "+ Lägg till" link CTA
- Built SalaryWidget: 52 000 kr/mån median KPI + role label + RangeBar (42k–62k span) — no footer per spec
- Built InternationalWidget: action-oriented empty state ("Arbetar du mot utlandsjobb?" + "Utforska möjligheter" CTA) — zero bare zeros

## Files Created

| File | Purpose | Default Export |
|------|---------|---------------|
| `client/src/components/widgets/StackedBar.tsx` | Proportional horizontal bar segments | No (named: `StackedBar`) |
| `client/src/components/widgets/RangeBar.tsx` | Horizontal range with median marker | No (named: `RangeBar`) |
| `client/src/components/widgets/ApplicationsWidget.tsx` | Mina ansökningar — stacked bar + alert chip | Yes |
| `client/src/components/widgets/SpontaneousWidget.tsx` | Spontanansökan — pipeline count | Yes |
| `client/src/components/widgets/SalaryWidget.tsx` | Lön & marknad — salary KPI + range bar | Yes |
| `client/src/components/widgets/InternationalWidget.tsx` | Internationellt — empty state | Yes |

## Mock Data Values

| Widget | Mock values |
|--------|-------------|
| ApplicationsWidget | 12 totalt; 4 aktiva / 2 svar inväntas / 1 intervju / 5 avslutade; amber: "1 ansökan väntar på ditt svar" |
| SpontaneousWidget | 5 företag i pipeline |
| SalaryWidget | 52 000 kr/mån; low 42 000, high 62 000; role "UX-designer, Stockholm" |
| InternationalWidget | Empty state (no countries saved) |

## Anti-Shaming Compliance

- ApplicationsWidget closed segment: `{ label: 'avslutade', count: 5, color: '#C9C6BD', deEmphasized: true }` — rendered with `opacity: 0.6`, stone-300 color
- "avslutade" count (5) is NOT shown as primary KPI; only "12 totalt" is the headline number
- Amber chip "1 ansökan väntar på ditt svar" uses `#FEF3C7` background + `#92400E` text per UI-SPEC semantic colors

## Empty State Copy Compliance

- InternationalWidget shows "Arbetar du mot utlandsjobb?" heading (13px/700) — exactly as specified in UI-SPEC Empty State Copy Contract
- CTA: "Utforska möjligheter →" with min-h-[44px] touch target
- No "Inga", no bare "0", no "Du har inte ..." framing

## StackedBar / RangeBar API for Phase 5 Reuse

```typescript
// StackedBar — reusable for any status breakdown widget
import { StackedBar, type StackedBarSegment } from '@/components/widgets/StackedBar'

const segments: StackedBarSegment[] = [
  { label: 'Label', count: 5, color: 'var(--c-solid)' },
  { label: 'Closed', count: 2, color: '#C9C6BD', deEmphasized: true },
]
<StackedBar segments={segments} height={8} showLegend={true} />

// RangeBar — reusable for any range/span visualization
import { RangeBar } from '@/components/widgets/RangeBar'

<RangeBar low={42000} median={52000} high={62000} unit=" kr" />
// Custom formatter: format={(n) => `${n/1000}k`}
```

## Task Commits

1. **Task 1: StackedBar + RangeBar primitives** — `ebfe2e1` (feat)
2. **Task 2: ApplicationsWidget + SpontaneousWidget** — `6f15811` (feat)
3. **Task 3: SalaryWidget + InternationalWidget** — `d10ce69` (feat)

## Decisions Made

- StackedBar and RangeBar use named exports (not default) — shared primitives, not lazy-loaded widgets
- ApplicationsWidget footer guard uses `!minimal` (hides at S and M per spec) not `!compact`
- SalaryWidget has no `<Widget.Footer>` — matches UI-SPEC Copywriting Contract table ("no footer in M")
- InternationalWidget empty state uses question framing from UI-SPEC Empty State Copy Contract row exactly

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- All 6 widget files present on disk
- All 3 task commits exist: ebfe2e1, 6f15811, d10ce69
- TypeScript: clean (npx tsc --noEmit exits 0)
