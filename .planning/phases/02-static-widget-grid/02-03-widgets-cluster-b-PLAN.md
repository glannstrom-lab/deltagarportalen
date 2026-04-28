---
phase: 02-static-widget-grid
plan: "03"
type: execute
wave: 2
depends_on: ["01"]
files_modified:
  - client/src/components/widgets/ApplicationsWidget.tsx
  - client/src/components/widgets/SpontaneousWidget.tsx
  - client/src/components/widgets/SalaryWidget.tsx
  - client/src/components/widgets/InternationalWidget.tsx
  - client/src/components/widgets/StackedBar.tsx
  - client/src/components/widgets/RangeBar.tsx
autonomous: true
requirements:
  - WIDG-01
  - WIDG-02
must_haves:
  truths:
    - "Applications widget shows '12 totalt' KPI + 4-segment stacked bar with closed segment de-emphasized (stone-300)"
    - "Applications widget shows amber alert chip ('1 ansökan väntar på ditt svar') only when pending"
    - "Spontaneous widget shows '5 företag i pipeline' KPI at S size"
    - "Salary widget shows '52 000 kr/mån' KPI + range bar with median marker at M size"
    - "International widget shows action-oriented empty state 'Arbetar du mot utlandsjobb?' (no bare zero) at S size"
    - "All 4 widgets are default-exported so registry's lazy() imports resolve"
    - "Closed/rejected applications count is NOT shown as a primary KPI label (anti-shaming rule)"
  artifacts:
    - path: "client/src/components/widgets/ApplicationsWidget.tsx"
      provides: "Stacked status bar + amber alert chip"
      exports: ["default"]
    - path: "client/src/components/widgets/SpontaneousWidget.tsx"
      provides: "Pipeline count widget"
      exports: ["default"]
    - path: "client/src/components/widgets/SalaryWidget.tsx"
      provides: "Salary KPI + range bar"
      exports: ["default"]
    - path: "client/src/components/widgets/InternationalWidget.tsx"
      provides: "Action-oriented empty state"
      exports: ["default"]
    - path: "client/src/components/widgets/StackedBar.tsx"
      provides: "Reusable horizontal stacked bar (used by ApplicationsWidget)"
      exports: ["StackedBar"]
    - path: "client/src/components/widgets/RangeBar.tsx"
      provides: "Reusable horizontal range bar with median marker (used by SalaryWidget)"
      exports: ["RangeBar"]
  key_links:
    - from: "ApplicationsWidget"
      to: "StackedBar"
      via: "import { StackedBar } from './StackedBar'"
      pattern: "StackedBar"
    - from: "SalaryWidget"
      to: "RangeBar"
      via: "import { RangeBar } from './RangeBar'"
      pattern: "RangeBar"
    - from: "All 4 widgets"
      to: "Widget compound + useWidgetSize"
      via: "imports from ./Widget and @/hooks/useWidgetSize"
      pattern: "Widget\\.(Header|Body|Footer)"
---

<objective>
Build 4 of the 8 Söka Jobb widgets — Applications (M, with stacked bar + alert), Spontaneous (S), Salary (M, with range bar), International (S, empty state). Plus shared visual primitives StackedBar and RangeBar. All hard-coded mock data per UI-SPEC. All widgets export default.

Purpose: Cluster B widgets cover the rest of "Sök & ansök" + the "Marknad" section of Söka Jobb. Built in parallel with Cluster A (plan 02-02).
Output: 6 files in client/src/components/widgets/. No hub wiring yet — that's plan 02-04.
</objective>

<execution_context>
@C:/Users/Mikael/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/Mikael/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/phases/02-static-widget-grid/02-UI-SPEC.md
@.planning/research/FEATURES.md
@.planning/research/PITFALLS.md
@.planning/phases/02-static-widget-grid/02-01-widget-foundation-SUMMARY.md
@nav-hub-sketch.html

<interfaces>
<!-- From plan 02-01 (Widget foundation) -->

From client/src/components/widgets/Widget.tsx:
```typescript
export const Widget: React.FC<WidgetRootProps> & {
  Header: React.FC<{ icon: LucideIcon; title: string }>
  Body: React.FC<{ children: ReactNode; className?: string }>
  Footer: React.FC<{ children: ReactNode; className?: string }>
}
```

From client/src/hooks/useWidgetSize.ts:
```typescript
export function useWidgetSize(size: WidgetSize): {
  isS, isM, isL, isXL, compact, minimal
}
```

From client/src/components/widgets/types.ts:
```typescript
export type WidgetSize = 'S' | 'M' | 'L' | 'XL'
export interface WidgetProps {
  id: string; size: WidgetSize; onSizeChange?: (s: WidgetSize) => void
  allowedSizes?: WidgetSize[]; editMode?: boolean; className?: string
}
```

CSS tokens (from data-domain="activity" ancestor on JobsokHub):
- `var(--c-bg)`, `var(--c-accent)`, `var(--c-solid)`, `var(--c-text)` (activity persika)
- `var(--stone-150)`, `var(--stone-300)`, `var(--stone-500)`, `var(--stone-700)`, `var(--stone-900)`
- Stone-300 (#C9C6BD) — used for de-emphasized closed-application segment
- `var(--status-warning)` (#D97706) and `var(--status-warning-bg)` (#FEF3C7) — only for amber alert chip

Status segment colors for ApplicationsWidget stacked bar:
- Aktiva: `var(--c-solid)` (activity solid)
- Svar inväntas: `var(--c-accent)` (activity accent)
- Intervju: emerald-600 (#059669)
- Avslutade: stone-300 (#C9C6BD) — de-emphasized per anti-shaming rule

lucide-react icons available: Briefcase, AlertTriangle, Building2, Plus, Banknote, Globe, ChevronRight.
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Build shared StackedBar and RangeBar primitives</name>
  <files>client/src/components/widgets/StackedBar.tsx, client/src/components/widgets/RangeBar.tsx</files>
  <read_first>
    - .planning/phases/02-static-widget-grid/02-UI-SPEC.md (sections "Color > Semantic colors", "Progress / KPI Framing Rules" — closed segment de-emphasis)
    - nav-hub-sketch.html (search for ".stack" and ".range" CSS blocks for visual reference)
    - .planning/research/PITFALLS.md (Pitfall 11 — closed/rejected counts must be de-emphasized)
  </read_first>
  <action>
**File 1: `client/src/components/widgets/StackedBar.tsx`** (~70 lines)

Horizontal segmented bar. Each segment proportional to its count. Renders accessible label per segment.

```typescript
export interface StackedBarSegment {
  /** Visible Swedish label */
  label: string
  /** Count for this segment */
  count: number
  /** CSS color (use CSS variable strings or hex) */
  color: string
  /** When true, segment is rendered with reduced visual weight (used for closed/rejected) */
  deEmphasized?: boolean
}

interface StackedBarProps {
  segments: StackedBarSegment[]
  /** Total height of the bar */
  height?: number
  /** When true, renders compact legend below */
  showLegend?: boolean
}

export function StackedBar({ segments, height = 8, showLegend = true }: StackedBarProps) {
  const total = segments.reduce((s, x) => s + x.count, 0) || 1

  return (
    <div className="w-full">
      <div
        className="flex w-full overflow-hidden rounded-full bg-[var(--stone-150)]"
        style={{ height }}
        role="img"
        aria-label={segments.map(s => `${s.label}: ${s.count}`).join(', ')}
      >
        {segments.map(s => {
          const pct = (s.count / total) * 100
          if (pct === 0) return null
          return (
            <div
              key={s.label}
              style={{
                width: `${pct}%`,
                background: s.color,
                opacity: s.deEmphasized ? 0.6 : 1,
              }}
            />
          )
        })}
      </div>
      {showLegend && (
        <ul className="list-none p-0 mt-2 flex flex-wrap gap-x-3 gap-y-1">
          {segments.map(s => (
            <li
              key={s.label}
              className="flex items-center gap-1 text-[12px] text-[var(--stone-700)]"
            >
              <span
                aria-hidden="true"
                className="inline-block w-2 h-2 rounded-sm"
                style={{ background: s.color, opacity: s.deEmphasized ? 0.6 : 1 }}
              />
              <span>{s.count} {s.label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
```

**File 2: `client/src/components/widgets/RangeBar.tsx`** (~70 lines)

Horizontal range with low/median/high labels and a marker dot at the median.

```typescript
interface RangeBarProps {
  low: number
  median: number
  high: number
  /** Suffix for displayed numbers, e.g. "kr" */
  unit?: string
  /** Format function (defaults to localized number) */
  format?: (n: number) => string
}

export function RangeBar({ low, median, high, unit = '', format }: RangeBarProps) {
  const fmt = format ?? ((n: number) => n.toLocaleString('sv-SE'))
  const range = high - low || 1
  const markerPct = ((median - low) / range) * 100

  return (
    <div className="w-full">
      <div
        className="relative w-full h-2 bg-[var(--c-bg)] rounded-full"
        role="img"
        aria-label={`Lönespann: ${fmt(low)}${unit} till ${fmt(high)}${unit}, median ${fmt(median)}${unit}`}
      >
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[var(--c-solid)] border-2 border-white shadow-sm"
          style={{ left: `calc(${markerPct}% - 6px)` }}
          aria-hidden="true"
        />
      </div>
      <div className="flex justify-between mt-1 text-[12px] text-[var(--stone-700)]">
        <span>{fmt(low)}{unit}</span>
        <span className="font-bold text-[var(--c-text)]">{fmt(median)}{unit}</span>
        <span>{fmt(high)}{unit}</span>
      </div>
    </div>
  )
}
```
  </action>
  <verify>
    <automated>cd client && npx tsc --noEmit</automated>
  </verify>
  <acceptance_criteria>
    - File `client/src/components/widgets/StackedBar.tsx` exists
    - `grep -c "export function StackedBar" client/src/components/widgets/StackedBar.tsx` returns 1
    - `grep -c "deEmphasized" client/src/components/widgets/StackedBar.tsx` returns at least 2 (interface + usage)
    - `grep -c "opacity: s.deEmphasized" client/src/components/widgets/StackedBar.tsx` returns at least 1
    - `grep -c 'role="img"' client/src/components/widgets/StackedBar.tsx` returns at least 1
    - File `client/src/components/widgets/RangeBar.tsx` exists
    - `grep -c "export function RangeBar" client/src/components/widgets/RangeBar.tsx` returns 1
    - `grep -c "median" client/src/components/widgets/RangeBar.tsx` returns at least 2
    - `grep -c "var(--c-solid)" client/src/components/widgets/RangeBar.tsx` returns at least 1
    - `grep -c "toLocaleString" client/src/components/widgets/RangeBar.tsx` returns at least 1
    - `cd client && npx tsc --noEmit` exits 0
  </acceptance_criteria>
  <done>StackedBar renders proportional segments with deEmphasized opacity reduction; RangeBar renders track with median marker at correct position; both have accessible aria-label.</done>
</task>

<task type="auto">
  <name>Task 2: Build ApplicationsWidget (M, with amber alert) + SpontaneousWidget (S)</name>
  <files>client/src/components/widgets/ApplicationsWidget.tsx, client/src/components/widgets/SpontaneousWidget.tsx</files>
  <read_first>
    - .planning/phases/02-static-widget-grid/02-UI-SPEC.md (sections "Mock Data Specification", "Progress / KPI Framing Rules", "Color > Semantic colors")
    - .planning/research/FEATURES.md (lines 31–52 — Applications widget; lines 44–53 — Spontaneous widget)
    - .planning/research/PITFALLS.md (Pitfall 11 — anti-shaming, closed-count de-emphasis)
    - client/src/components/widgets/StackedBar.tsx (created in Task 1)
    - client/src/components/widgets/Widget.tsx
    - client/src/hooks/useWidgetSize.ts
  </read_first>
  <action>
**File 1: `client/src/components/widgets/ApplicationsWidget.tsx`** (~110 lines)

Mock data per UI-SPEC: 12 totalt, bar segments (4 aktiva / 2 svar inväntas / 1 intervju / 5 avslutade — DE-EMPHASIZED), amber chip "1 ansökan väntar på ditt svar".

```typescript
import { Briefcase, AlertTriangle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Widget } from './Widget'
import { StackedBar, type StackedBarSegment } from './StackedBar'
import { useWidgetSize } from '@/hooks/useWidgetSize'
import type { WidgetProps } from './types'

const MOCK = {
  total: 12,
  segments: [
    { label: 'aktiva',         count: 4, color: 'var(--c-solid)' },
    { label: 'svar inväntas',  count: 2, color: 'var(--c-accent)' },
    { label: 'intervju',       count: 1, color: '#059669' },
    // De-emphasized per anti-shaming rule (UI-SPEC) — closed/rejected gets stone-300, low opacity
    { label: 'avslutade',      count: 5, color: '#C9C6BD', deEmphasized: true },
  ] satisfies StackedBarSegment[],
  pendingAlert: '1 ansökan väntar på ditt svar',
}

export default function ApplicationsWidget({ id, size, onSizeChange, allowedSizes, editMode }: WidgetProps) {
  const { compact, minimal } = useWidgetSize(size)

  return (
    <Widget id={id} size={size} onSizeChange={onSizeChange} allowedSizes={allowedSizes} editMode={editMode}>
      <Widget.Header icon={Briefcase} title="Mina ansökningar" />
      <Widget.Body>
        <div className="flex-1 flex flex-col">
          <div className="flex items-baseline gap-2">
            <span className="text-[32px] font-bold leading-[1.1] text-[var(--stone-900)]">
              {MOCK.total}
            </span>
            <span className="text-[12px] text-[var(--stone-700)]">totalt</span>
          </div>

          {!compact && (
            <div className="mt-3">
              <StackedBar segments={MOCK.segments} showLegend={!minimal} />
            </div>
          )}

          {!compact && MOCK.pendingAlert && (
            <div
              className="mt-3 inline-flex items-center gap-2 self-start px-2 py-1 rounded-md text-[12px] font-bold"
              style={{ background: '#FEF3C7', color: '#92400E' }}
              role="status"
            >
              <AlertTriangle size={12} aria-hidden="true" />
              <span>{MOCK.pendingAlert}</span>
            </div>
          )}
        </div>
      </Widget.Body>
      {!minimal && (
        <Widget.Footer>
          <Link
            to="/applications"
            className="inline-flex items-center min-h-[44px] px-3 py-1.5 text-[var(--c-text)] text-[12px] font-bold no-underline hover:underline"
          >
            Visa pipeline →
          </Link>
        </Widget.Footer>
      )}
    </Widget>
  )
}
```

**File 2: `client/src/components/widgets/SpontaneousWidget.tsx`** (~70 lines)

Mock per UI-SPEC: 5 företag i pipeline.

```typescript
import { Building2, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Widget } from './Widget'
import { useWidgetSize } from '@/hooks/useWidgetSize'
import type { WidgetProps } from './types'

const MOCK = { companies: 5 }

export default function SpontaneousWidget({ id, size, onSizeChange, allowedSizes, editMode }: WidgetProps) {
  const { compact } = useWidgetSize(size)

  return (
    <Widget id={id} size={size} onSizeChange={onSizeChange} allowedSizes={allowedSizes} editMode={editMode}>
      <Widget.Header icon={Building2} title="Spontanansökan" />
      <Widget.Body>
        <div className="flex-1 flex flex-col justify-center">
          <span className="text-[22px] font-bold leading-[1.1] text-[var(--stone-900)]">
            {MOCK.companies}
          </span>
          <span className="text-[12px] text-[var(--stone-700)]">företag i pipeline</span>
        </div>
      </Widget.Body>
      {!compact && (
        <Widget.Footer>
          <Link
            to="/spontanans%C3%B6kan"
            className="inline-flex items-center gap-1 min-h-[44px] px-3 py-1.5 text-[var(--c-text)] text-[12px] font-bold no-underline hover:underline"
          >
            <Plus size={12} aria-hidden="true" />
            Lägg till →
          </Link>
        </Widget.Footer>
      )}
    </Widget>
  )
}
```

Note: `/spontanansökan` URL-encodes to `/spontanans%C3%B6kan` because the existing route uses Swedish ö character per Phase 1 SUMMARY mappings. Use the encoded form in to= or URL encode at runtime — verify against client/src/App.tsx route definition.
  </action>
  <verify>
    <automated>cd client && npx tsc --noEmit</automated>
  </verify>
  <acceptance_criteria>
    - File `client/src/components/widgets/ApplicationsWidget.tsx` exists
    - `grep -c "export default function ApplicationsWidget" client/src/components/widgets/ApplicationsWidget.tsx` returns 1
    - `grep -c "StackedBar" client/src/components/widgets/ApplicationsWidget.tsx` returns at least 1
    - `grep -c "12" client/src/components/widgets/ApplicationsWidget.tsx` returns at least 1 (total)
    - `grep -c "totalt" client/src/components/widgets/ApplicationsWidget.tsx` returns 1
    - `grep -c "deEmphasized: true" client/src/components/widgets/ApplicationsWidget.tsx` returns 1 (avslutade segment)
    - `grep -c "1 ansökan väntar på ditt svar" client/src/components/widgets/ApplicationsWidget.tsx` returns 1
    - `grep -c "FEF3C7" client/src/components/widgets/ApplicationsWidget.tsx` returns at least 1 (amber bg)
    - `grep -c "Visa pipeline" client/src/components/widgets/ApplicationsWidget.tsx` returns 1
    - File `client/src/components/widgets/SpontaneousWidget.tsx` exists
    - `grep -c "export default function SpontaneousWidget" client/src/components/widgets/SpontaneousWidget.tsx` returns 1
    - `grep -c "5" client/src/components/widgets/SpontaneousWidget.tsx` returns at least 1 (mock companies)
    - `grep -c "företag i pipeline" client/src/components/widgets/SpontaneousWidget.tsx` returns 1
    - `cd client && npx tsc --noEmit` exits 0
  </acceptance_criteria>
  <done>ApplicationsWidget renders 12 total + 4-segment stacked bar with closed segment visually de-emphasized (opacity + stone-300) + amber alert chip; SpontaneousWidget renders 5 företag count with link CTA; both default-export.</done>
</task>

<task type="auto">
  <name>Task 3: Build SalaryWidget (M, with range bar) + InternationalWidget (S, action-oriented empty state)</name>
  <files>client/src/components/widgets/SalaryWidget.tsx, client/src/components/widgets/InternationalWidget.tsx</files>
  <read_first>
    - .planning/phases/02-static-widget-grid/02-UI-SPEC.md (sections "Mock Data Specification", "Empty State Copy Contract")
    - .planning/research/FEATURES.md (lines 64–75 — Salary widget; lines 76–83 — International widget)
    - client/src/components/widgets/RangeBar.tsx (created in Task 1)
    - client/src/components/widgets/Widget.tsx
    - client/src/hooks/useWidgetSize.ts
  </read_first>
  <action>
**File 1: `client/src/components/widgets/SalaryWidget.tsx`** (~80 lines)

Mock per UI-SPEC: "52 000 kr/mån", range 42 000–62 000, role "UX-designer, Stockholm".

```typescript
import { Banknote } from 'lucide-react'
import { Widget } from './Widget'
import { RangeBar } from './RangeBar'
import { useWidgetSize } from '@/hooks/useWidgetSize'
import type { WidgetProps } from './types'

const MOCK = {
  median: 52000,
  low: 42000,
  high: 62000,
  roleLabel: 'UX-designer, Stockholm',
}

export default function SalaryWidget({ id, size, onSizeChange, allowedSizes, editMode }: WidgetProps) {
  const { compact, minimal } = useWidgetSize(size)

  return (
    <Widget id={id} size={size} onSizeChange={onSizeChange} allowedSizes={allowedSizes} editMode={editMode}>
      <Widget.Header icon={Banknote} title="Lön & marknad" />
      <Widget.Body>
        <div className="flex-1 flex flex-col justify-center">
          <div className="flex items-baseline gap-1">
            <span className="text-[22px] font-bold leading-[1.1] text-[var(--stone-900)]">
              {MOCK.median.toLocaleString('sv-SE')}
            </span>
            <span className="text-[12px] text-[var(--stone-700)]">kr/mån</span>
          </div>
          <span className="text-[12px] text-[var(--stone-700)]">{MOCK.roleLabel}</span>
          {!compact && (
            <div className="mt-3">
              <RangeBar
                low={MOCK.low}
                median={MOCK.median}
                high={MOCK.high}
                unit=" kr"
              />
            </div>
          )}
        </div>
      </Widget.Body>
    </Widget>
  )
}
```

Note: SalaryWidget has no footer per UI-SPEC "Copywriting Contract" table.

**File 2: `client/src/components/widgets/InternationalWidget.tsx`** (~75 lines)

Per UI-SPEC § "Mock Data Specification" InternationalWidget shows the empty state. Use exact copy from UI-SPEC § "Empty State Copy Contract":
- Heading: "Arbetar du mot utlandsjobb?"
- CTA: "Utforska möjligheter"

```typescript
import { Globe } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Widget } from './Widget'
import { useWidgetSize } from '@/hooks/useWidgetSize'
import type { WidgetProps } from './types'

export default function InternationalWidget({ id, size, onSizeChange, allowedSizes, editMode }: WidgetProps) {
  const { compact } = useWidgetSize(size)

  return (
    <Widget id={id} size={size} onSizeChange={onSizeChange} allowedSizes={allowedSizes} editMode={editMode}>
      <Widget.Header icon={Globe} title="Internationellt" />
      <Widget.Body>
        <div className="flex-1 flex flex-col justify-center">
          <p className="text-[13px] font-bold text-[var(--stone-900)] m-0 mb-1">
            Arbetar du mot utlandsjobb?
          </p>
          {!compact && (
            <p className="text-[12px] text-[var(--stone-700)] m-0">
              Hitta jobb och företag i andra länder
            </p>
          )}
        </div>
      </Widget.Body>
      {!compact && (
        <Widget.Footer>
          <Link
            to="/international"
            className="inline-flex items-center min-h-[44px] px-3 py-1.5 text-[var(--c-text)] text-[12px] font-bold no-underline hover:underline"
          >
            Utforska möjligheter →
          </Link>
        </Widget.Footer>
      )}
    </Widget>
  )
}
```
  </action>
  <verify>
    <automated>cd client && npx tsc --noEmit</automated>
  </verify>
  <acceptance_criteria>
    - File `client/src/components/widgets/SalaryWidget.tsx` exists
    - `grep -c "export default function SalaryWidget" client/src/components/widgets/SalaryWidget.tsx` returns 1
    - `grep -c "RangeBar" client/src/components/widgets/SalaryWidget.tsx` returns at least 1
    - `grep -c "52000" client/src/components/widgets/SalaryWidget.tsx` returns at least 1
    - `grep -c "42000" client/src/components/widgets/SalaryWidget.tsx` returns at least 1
    - `grep -c "62000" client/src/components/widgets/SalaryWidget.tsx` returns at least 1
    - `grep -c "UX-designer, Stockholm" client/src/components/widgets/SalaryWidget.tsx` returns 1
    - `grep -c "kr/mån" client/src/components/widgets/SalaryWidget.tsx` returns 1
    - File `client/src/components/widgets/InternationalWidget.tsx` exists
    - `grep -c "export default function InternationalWidget" client/src/components/widgets/InternationalWidget.tsx` returns 1
    - `grep -c "Arbetar du mot utlandsjobb" client/src/components/widgets/InternationalWidget.tsx` returns 1
    - `grep -c "Utforska möjligheter" client/src/components/widgets/InternationalWidget.tsx` returns 1
    - InternationalWidget contains NO bare zero or "Inga": `grep -E "(Inga|^0|: 0)" client/src/components/widgets/InternationalWidget.tsx | wc -l` returns 0
    - `cd client && npx tsc --noEmit` exits 0
  </acceptance_criteria>
  <done>SalaryWidget renders 52 000 kr/mån + range bar with median marker + role label; InternationalWidget renders action-oriented empty state ("Arbetar du mot utlandsjobb?" + Utforska CTA) — no bare zero; both default-export.</done>
</task>

</tasks>

<verification>
- All 6 files exist in client/src/components/widgets/
- `cd client && npx tsc --noEmit` exits 0
- All 4 widgets default-export
- ApplicationsWidget shows closed segment with deEmphasized=true (anti-shaming compliance)
- InternationalWidget uses action-oriented empty state copy (UI-SPEC compliance)
- StackedBar and RangeBar reusable primitives available for future widgets
</verification>

<success_criteria>
1. ApplicationsWidget meets all anti-shaming rules (closed de-emphasized, amber chip only when pending)
2. SpontaneousWidget shows pipeline count compactly at S
3. SalaryWidget shows median + range with marker
4. InternationalWidget shows action-oriented empty state (no bare zero)
5. All 4 widgets default-exported so registry's lazy() imports resolve at vite-build time
6. StackedBar and RangeBar are reusable for Phase 5 widgets
</success_criteria>

<output>
After completion, create `.planning/phases/02-static-widget-grid/02-03-widgets-cluster-b-SUMMARY.md` documenting:
- Files created and their default exports
- Mock data values per widget
- Confirmation that ApplicationsWidget closed segment is de-emphasized
- Confirmation that InternationalWidget uses spec empty-state copy
- Notes on StackedBar/RangeBar API for Phase 5 reuse
</output>
