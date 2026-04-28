---
phase: 02-static-widget-grid
plan: "01"
subsystem: ui
tags: [react, typescript, tailwind, compound-component, error-boundary, css-grid, lazy-loading, vitest]

# Dependency graph
requires:
  - phase: 01-hub-navigation-shell
    provides: HubId type from navigation.ts; isHubNavEnabled() flag for hub routing
provides:
  - Widget compound component API (Widget.Root, Widget.Header, Widget.Body, Widget.Footer)
  - useWidgetSize hook returning isS/isM/isL/isXL/compact/minimal flags
  - WidgetErrorBoundary class component with spec-compliant fallback card
  - HubGrid compound component (Root, Section, Slot) with 4-col CSS grid
  - WIDGET_REGISTRY with 8 lazy()-loaded jobb-hub widget entries
  - getDefaultLayout(hubId) and getJobbSections() for layout configuration
  - WidgetSize, WidgetProps, WidgetLayoutItem types + HubId re-export
affects:
  - 02-02-jobb-widgets-part1 (consumes Widget API, uses HubGrid.Slot, useWidgetSize)
  - 02-03-jobb-widgets-part2 (same as above)
  - 02-04-hub-wiring (consumes HubGrid, WIDGET_REGISTRY, getJobbSections, defaultLayouts)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Compound component pattern with Object.assign (Widget, HubGrid)
    - React Context for intra-compound prop passing (WidgetContext: size/onSizeChange/allowedSizes/editMode)
    - TDD with vitest + @testing-library/react (RED → GREEN each task)
    - lazy() exclusively for all widget components (zero static widget imports in registry)
    - CSS custom properties via Tailwind arbitrary values (var(--surface), var(--c-bg), etc.)

key-files:
  created:
    - client/src/components/widgets/types.ts
    - client/src/hooks/useWidgetSize.ts
    - client/src/hooks/useWidgetSize.test.ts
    - client/src/components/widgets/Widget.tsx
    - client/src/components/widgets/Widget.test.tsx
    - client/src/components/widgets/WidgetErrorBoundary.tsx
    - client/src/components/widgets/WidgetErrorBoundary.test.tsx
    - client/src/components/widgets/HubGrid.tsx
    - client/src/components/widgets/HubGrid.test.tsx
    - client/src/components/widgets/registry.ts
    - client/src/components/widgets/defaultLayouts.ts
  modified: []

key-decisions:
  - "WidgetContext carries size/onSizeChange/allowedSizes/editMode from Root to Header — avoids prop-drilling in compound sub-components"
  - "registry.ts uses satisfies WidgetRegistryEntry (not as const) to allow typed lookup while keeping lazy() type inference intact"
  - "Footer renders null at S-size (not hidden via CSS) — keeps DOM clean and avoids ARIA confusion with invisible interactive content"
  - "Toggle group opacity-0/group-hover:opacity-100 uses Tailwind group variant — CSS-only reveal avoids JS state for hover"
  - "HubGrid.Section renders its own inner grid (not relying on parent HubGrid) — enables Sections with independent column count override"

patterns-established:
  - "Widget authoring: import Widget from widgets/Widget; use <Widget id size onSizeChange><Widget.Header icon title /><Widget.Body>...</Widget.Body><Widget.Footer>...</Widget.Footer></Widget>"
  - "Size-responsive content: const { isS, isM, isL, compact, minimal } = useWidgetSize(size) — use flags to conditionally render elements"
  - "Grid placement: wrap each widget in <HubGrid.Slot size={item.size}> — slot applies col-span/row-span + WidgetErrorBoundary + Suspense"
  - "New widget authors must only add to registry.ts using lazy(() => import('./XxxWidget')) — never static import"

requirements-completed: [WIDG-01, WIDG-02, WIDG-03]

# Metrics
duration: 7min
completed: 2026-04-28
---

# Phase 2 Plan 01: Widget Foundation Summary

**Widget compound component (Root/Header/Body/Footer), CSS grid container, per-widget error boundary, lazy registry, and typed defaults — 24 tests green**

## Performance

- **Duration:** ~7 min
- **Started:** 2026-04-28T19:27:00Z
- **Completed:** 2026-04-28T19:34:19Z
- **Tasks:** 3
- **Files modified:** 11

## Accomplishments

- Built Widget compound component with keyboard-accessible S/M/L toggle (role=group, aria-pressed, aria-label in Swedish) and spec-compliant CSS values (rounded-[12px], 26px icon container, 18px toggle buttons, var(--surface)/var(--c-bg) tokens)
- Built HubGrid compound component enforcing 4-col CSS grid (2-col under 900px), auto-rows-[150px], gap-[14px] with per-slot error boundary isolation and Suspense skeleton
- Built WidgetErrorBoundary with spec fallback ("Kunde inte ladda" / "Försök igen om en stund"), role=alert, retry resets state without full page reload
- Established WIDGET_REGISTRY with all 8 jobb-hub widgets via lazy() — zero static widget imports in main bundle
- Defined getDefaultLayout/getJobbSections for sectioned jobb hub layout consumed by plan 02-04

## Widget Compound API Surface

```typescript
// Widget.Root
<Widget id="cv" size="L" onSizeChange={fn} allowedSizes={['S','M','L']} editMode={false}>

// Widget.Header — reads size/editMode/etc from WidgetContext
<Widget.Header icon={LucideIconComponent} title="Widget title" />

// Widget.Body — flex-1 flex flex-col min-h-0
<Widget.Body className="optional-extra-classes">...</Widget.Body>

// Widget.Footer — renders null at S-size automatically
<Widget.Footer>...</Widget.Footer>
```

## WidgetContext Shape

```typescript
interface WidgetContextValue {
  size: WidgetSize            // 'S' | 'M' | 'L' | 'XL'
  onSizeChange?: (newSize: WidgetSize) => void
  allowedSizes: WidgetSize[]  // which toggle buttons to render
  editMode: boolean           // toggle always visible vs hover-only
}
```

## Task Commits

1. **Task 1: WidgetSize types, WidgetProps interface, useWidgetSize hook** - `e016b22` (feat)
2. **Task 2: Widget compound component with keyboard-accessible toggle** - `18794cb` (feat)
3. **Task 3: WidgetErrorBoundary, HubGrid, registry, defaultLayouts** - `37b3e9b` (feat)

## Test Counts Per File

| File | Tests | Result |
|------|-------|--------|
| useWidgetSize.test.ts | 4 | all pass |
| Widget.test.tsx | 10 | all pass |
| WidgetErrorBoundary.test.tsx | 5 | all pass |
| HubGrid.test.tsx | 5 | all pass |
| **Total** | **24** | **24 pass** |

## Files Created/Modified

- `client/src/components/widgets/types.ts` — WidgetSize type, WidgetProps interface, WidgetLayoutItem, HubId re-export
- `client/src/hooks/useWidgetSize.ts` — pure function returning isS/isM/isL/isXL/compact/minimal flags
- `client/src/hooks/useWidgetSize.test.ts` — 4 TDD tests
- `client/src/components/widgets/Widget.tsx` — compound component; WidgetContext; Root/Header/Body/Footer
- `client/src/components/widgets/Widget.test.tsx` — 10 TDD tests
- `client/src/components/widgets/WidgetErrorBoundary.tsx` — class component; spec fallback card; retry handler
- `client/src/components/widgets/WidgetErrorBoundary.test.tsx` — 5 TDD tests
- `client/src/components/widgets/HubGrid.tsx` — Root/Section/Slot compound; SIZE_CLASSES map; WidgetErrorBoundary+Suspense per slot
- `client/src/components/widgets/HubGrid.test.tsx` — 5 TDD tests
- `client/src/components/widgets/registry.ts` — WIDGET_REGISTRY with 8 lazy() entries; WidgetId type
- `client/src/components/widgets/defaultLayouts.ts` — getDefaultLayout(hubId) + getJobbSections()

## Notes for Wave 2 Widget Authors

**How to author a new widget:**

```typescript
// In your XxxWidget.tsx (consumed lazily via registry.ts):
import { Widget } from './Widget'
import { useWidgetSize } from '@/hooks/useWidgetSize'
import type { WidgetProps } from './types'

export function XxxWidget({ id, size, onSizeChange, allowedSizes, editMode }: WidgetProps) {
  const { isS, isM, isL, compact, minimal } = useWidgetSize(size)

  return (
    <Widget id={id} size={size} onSizeChange={onSizeChange} allowedSizes={allowedSizes} editMode={editMode}>
      <Widget.Header icon={SomeLucideIcon} title="Widget namn" />
      <Widget.Body>
        {compact && <p>KPI number only (S-size)</p>}
        {!compact && <p>Full content (M/L/XL)</p>}
      </Widget.Body>
      <Widget.Footer>
        {/* Automatically hidden at S-size — no guard needed */}
        <button>Primär CTA</button>
      </Widget.Footer>
    </Widget>
  )
}

// Default export required for lazy() to work:
export default XxxWidget
```

**To add a widget to the registry:**
In `registry.ts`, add: `newwidget: { component: lazy(() => import('./NewWidget')), defaultSize: 'M', allowedSizes: ['S','M','L'] }`

## Decisions Made

- WidgetContext carries size/onSizeChange/allowedSizes/editMode from Root to Header — avoids prop-drilling in compound sub-components
- `registry.ts` uses `satisfies WidgetRegistryEntry` (not `as const`) to allow typed lookup while keeping lazy() type inference intact
- Footer renders `null` at S-size (not `display:none`) — keeps DOM clean and avoids ARIA confusion with invisible interactive content
- Toggle group `opacity-0 group-hover:opacity-100` uses Tailwind group variant — CSS-only reveal avoids extra JS state
- HubGrid.Section renders its own inner grid (not relying on parent HubGrid) — enables Sections with independent column count override if needed

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## Next Phase Readiness

- Wave 2 (plans 02-02 and 02-03) can run in parallel: Widget API contract is stable, all types exported, registry stubs exist
- Wave 3 (plan 02-04 hub wiring) has getJobbSections() and WIDGET_REGISTRY available
- TypeScript clean, all 24 tests pass

---
*Phase: 02-static-widget-grid*
*Completed: 2026-04-28*
