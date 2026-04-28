---
phase: 02-static-widget-grid
plan: "02"
type: execute
wave: 2
depends_on: ["01"]
files_modified:
  - client/src/components/widgets/CvWidget.tsx
  - client/src/components/widgets/CoverLetterWidget.tsx
  - client/src/components/widgets/InterviewWidget.tsx
  - client/src/components/widgets/JobSearchWidget.tsx
  - client/src/components/widgets/Sparkline.tsx
  - client/src/components/widgets/ProgressRing.tsx
autonomous: true
requirements:
  - WIDG-01
  - WIDG-02
must_haves:
  truths:
    - "CV widget shows 75% progress ring at L size with checklist visible; at S/M shows compact KPI"
    - "Cover Letter widget shows '3 utkast' KPI + last-edited label at M size"
    - "Interview widget shows '84/100' score + sparkline at M size; sparkline is hand-rolled SVG (not recharts)"
    - "Job Search widget shows '12 nya träffar idag' KPI + top-3 match cards with qualitative labels at L size"
    - "All 4 widgets are default-exported (so registry's lazy(() => import(...)) resolves)"
    - "All 4 widgets use Widget compound API; render different content per size via useWidgetSize"
    - "No widget renders raw match percentages — qualitative labels only ('Bra match', 'Mycket bra match')"
  artifacts:
    - path: "client/src/components/widgets/CvWidget.tsx"
      provides: "CV widget with progress ring + checklist"
      exports: ["default"]
    - path: "client/src/components/widgets/CoverLetterWidget.tsx"
      provides: "Cover letter widget with draft count + last-edited label"
      exports: ["default"]
    - path: "client/src/components/widgets/InterviewWidget.tsx"
      provides: "Interview widget with score + 8-point sparkline"
      exports: ["default"]
    - path: "client/src/components/widgets/JobSearchWidget.tsx"
      provides: "Job search widget with top-3 match cards"
      exports: ["default"]
    - path: "client/src/components/widgets/Sparkline.tsx"
      provides: "Hand-rolled SVG polyline component (~30 lines, no recharts)"
      exports: ["Sparkline"]
    - path: "client/src/components/widgets/ProgressRing.tsx"
      provides: "SVG circle progress ring component (used by CV widget)"
      exports: ["ProgressRing"]
  key_links:
    - from: "CvWidget"
      to: "Widget compound + ProgressRing"
      via: "import { Widget } from './Widget'; import { ProgressRing } from './ProgressRing'"
      pattern: "Widget\\.(Header|Body|Footer)"
    - from: "InterviewWidget"
      to: "Sparkline"
      via: "import { Sparkline } from './Sparkline'"
      pattern: "Sparkline"
    - from: "All 4 widgets"
      to: "useWidgetSize hook"
      via: "import { useWidgetSize } from '@/hooks/useWidgetSize'"
      pattern: "useWidgetSize"
---

<objective>
Build 4 of the 8 Söka Jobb widgets — CV (focal point, L), Cover Letter (M), Interview (M, with sparkline), Job Search (L). Plus shared SVG primitives ProgressRing and Sparkline. All hard-coded mock data per UI-SPEC. All widgets export default so the registry's lazy() imports resolve.

Purpose: Cluster A widgets cover the "Skapa & öva" + half of "Sök & ansök" sections of Söka Jobb hub. Built in parallel with Cluster B (plan 02-03) since they touch separate files.
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
// Usage: <Widget id="cv" size={size} onSizeChange={onSizeChange}>
//          <Widget.Header icon={FileUser} title="CV" />
//          <Widget.Body>...</Widget.Body>
//          <Widget.Footer>...</Widget.Footer>
//        </Widget>
```

From client/src/hooks/useWidgetSize.ts:
```typescript
export function useWidgetSize(size: WidgetSize): {
  isS: boolean; isM: boolean; isL: boolean; isXL: boolean
  compact: boolean  // true at S only
  minimal: boolean  // true at S or M
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

CSS tokens (set by ancestor data-domain="activity" on JobsokHub):
- `var(--c-bg)` = #FCF1E6 (activity soft pastell)
- `var(--c-accent)` = #F5D3B5
- `var(--c-solid)` = #C97A2E (CTA)
- `var(--c-text)` = #8B5418
- `var(--stone-150)`, `var(--stone-500)`, `var(--stone-700)`, `var(--stone-900)`
- `var(--status-warning)` = #D97706, `var(--status-warning-bg)` = #FEF3C7

lucide-react icons available: FileUser, FileText, Mic, Search, ChevronRight, Briefcase, Building2, Plus, Globe, Banknote, AlertCircle.
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Build shared SVG primitives — ProgressRing and Sparkline</name>
  <files>client/src/components/widgets/ProgressRing.tsx, client/src/components/widgets/Sparkline.tsx</files>
  <read_first>
    - .planning/phases/02-static-widget-grid/02-UI-SPEC.md (sections "Color > Accent reserved for", "Animation & Motion Contract")
    - .planning/research/STACK.md (lines 35–45 — "Hand-rolled SVG sparkline" rationale, no recharts)
    - .planning/research/PITFALLS.md (Pitfall 13 — prefers-reduced-motion)
    - nav-hub-sketch.html (lines 200–280 for .ring CSS, lines 350–420 for .sparkline CSS)
  </read_first>
  <action>
**File 1: `client/src/components/widgets/ProgressRing.tsx`** (~50 lines)

SVG-based circular progress indicator. Stroke uses var(--c-solid). Three sizes: 48px (S compact), 64px (M), 88px (L primary).

```typescript
interface ProgressRingProps {
  /** 0-100 */
  value: number
  /** Diameter in px */
  size?: 48 | 64 | 88
  /** Optional label rendered centered */
  label?: string
}

export function ProgressRing({ value, size = 88, label }: ProgressRingProps) {
  const stroke = size === 48 ? 4 : size === 64 ? 6 : 8
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (Math.max(0, Math.min(100, value)) / 100) * circumference

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} role="img" aria-label={`${value}% klart`}>
        {/* Track */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="var(--stone-150)" strokeWidth={stroke}
        />
        {/* Progress */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="var(--c-solid)" strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      {label && (
        <span
          className="absolute text-[var(--stone-900)] font-bold pointer-events-none"
          style={{ fontSize: size === 48 ? 12 : size === 64 ? 14 : 18 }}
        >
          {label}
        </span>
      )}
    </div>
  )
}
```

**File 2: `client/src/components/widgets/Sparkline.tsx`** (~50 lines)

Hand-rolled SVG polyline — no recharts. Stroke uses var(--c-solid). Endpoint dot uses same color.

```typescript
interface SparklineProps {
  /** Array of numeric values, e.g. [60, 64, 70, 68, 75, 80, 82, 84] */
  values: number[]
  width?: number
  height?: number
  /** Show a dot at the last point */
  showEndpoint?: boolean
}

export function Sparkline({ values, width = 120, height = 32, showEndpoint = true }: SparklineProps) {
  if (values.length < 2) return null
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const stepX = width / (values.length - 1)

  const points = values
    .map((v, i) => `${i * stepX},${height - ((v - min) / range) * height}`)
    .join(' ')

  const lastX = (values.length - 1) * stepX
  const lastY = height - ((values[values.length - 1] - min) / range) * height

  return (
    <svg
      width={width}
      height={height}
      role="img"
      aria-label={`Trend: ${values[0]} till ${values[values.length - 1]}`}
      className="overflow-visible"
    >
      <polyline
        points={points}
        fill="none"
        stroke="var(--c-solid)"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {showEndpoint && (
        <circle cx={lastX} cy={lastY} r={3} fill="var(--c-solid)" />
      )}
    </svg>
  )
}
```
  </action>
  <verify>
    <automated>cd client && npx tsc --noEmit</automated>
  </verify>
  <acceptance_criteria>
    - File `client/src/components/widgets/ProgressRing.tsx` exists
    - `grep -c "export function ProgressRing" client/src/components/widgets/ProgressRing.tsx` returns 1
    - `grep -c "var(--c-solid)" client/src/components/widgets/ProgressRing.tsx` returns at least 1
    - `grep -c "var(--stone-150)" client/src/components/widgets/ProgressRing.tsx` returns at least 1
    - `grep -c 'role="img"' client/src/components/widgets/ProgressRing.tsx` returns 1
    - File `client/src/components/widgets/Sparkline.tsx` exists
    - `grep -c "export function Sparkline" client/src/components/widgets/Sparkline.tsx` returns 1
    - `grep -c "polyline" client/src/components/widgets/Sparkline.tsx` returns at least 1
    - `grep -c "recharts" client/src/components/widgets/Sparkline.tsx` returns 0 (no recharts dep)
    - `grep -c "var(--c-solid)" client/src/components/widgets/Sparkline.tsx` returns at least 1
    - `cd client && npx tsc --noEmit` exits 0
  </acceptance_criteria>
  <done>ProgressRing renders SVG with track + progress arc using var(--c-solid); Sparkline renders SVG polyline + endpoint dot; both have role=img with aria-label; no recharts.</done>
</task>

<task type="auto">
  <name>Task 2: Build CvWidget (focal point, L) + CoverLetterWidget (M)</name>
  <files>client/src/components/widgets/CvWidget.tsx, client/src/components/widgets/CoverLetterWidget.tsx</files>
  <read_first>
    - .planning/phases/02-static-widget-grid/02-UI-SPEC.md (sections "Mock Data Specification", "Copywriting Contract", "Progress / KPI Framing Rules")
    - .planning/research/FEATURES.md (lines 86–106 — CV widget spec, Cover Letter widget spec)
    - nav-hub-sketch.html (lines 220–340 — .ring + .check-list CSS, .last-edited)
    - client/src/components/widgets/Widget.tsx (the compound API to consume)
    - client/src/components/widgets/ProgressRing.tsx (created in Task 1)
    - client/src/hooks/useWidgetSize.ts
  </read_first>
  <action>
**File 1: `client/src/components/widgets/CvWidget.tsx`** (~120 lines)

Mock data per UI-SPEC § "Mock Data Specification":
- Completion: 75%
- Last edited: "2 dagar sedan"
- Sections: 3 done (Personlig info, Erfarenhet, Utbildning) / 1 warn ("Färdigheter saknas")

Anti-shaming framing (UI-SPEC "Progress / KPI Framing Rules"):
- L size: ring + section checklist + milestone label "Nästan klart — 1 sektion kvar" (since > 60% but < 80%)
- M size: ring (64px) + last-edited timestamp only
- S size: small ring (48px) + percentage label only

```typescript
import { FileUser, Check, AlertTriangle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Widget } from './Widget'
import { ProgressRing } from './ProgressRing'
import { useWidgetSize } from '@/hooks/useWidgetSize'
import type { WidgetProps } from './types'

const MOCK_CV = {
  percent: 75,
  lastEdited: '2 dagar sedan',
  sections: [
    { name: 'Personlig info', status: 'done' as const },
    { name: 'Erfarenhet',     status: 'done' as const },
    { name: 'Utbildning',     status: 'done' as const },
    { name: 'Färdigheter',    status: 'warn' as const },
  ],
}

function milestoneLabel(p: number): string {
  if (p >= 80) return 'Klar att skickas'
  if (p >= 60) return 'Nästan klart — 1 sektion kvar'
  if (p >= 30) return 'Bra start — fortsätt fylla i'
  return 'Kom igång med ditt CV'
}

export default function CvWidget({ id, size, onSizeChange, allowedSizes, editMode }: WidgetProps) {
  const { compact, minimal } = useWidgetSize(size)
  const ringSize = compact ? 48 : minimal ? 64 : 88

  return (
    <Widget id={id} size={size} onSizeChange={onSizeChange} allowedSizes={allowedSizes} editMode={editMode}>
      <Widget.Header icon={FileUser} title="CV" />
      <Widget.Body>
        <div className={`flex ${compact ? 'flex-col items-center justify-center gap-2' : 'flex-row items-center gap-4'} flex-1`}>
          <ProgressRing value={MOCK_CV.percent} size={ringSize} label={`${MOCK_CV.percent}%`} />
          {!compact && (
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-bold text-[var(--c-text)] m-0 mb-1">
                {milestoneLabel(MOCK_CV.percent)}
              </p>
              <p className="text-[12px] font-normal text-[var(--stone-700)] m-0">
                Senast redigerad: {MOCK_CV.lastEdited}
              </p>
              {!minimal && (
                <ul className="list-none p-0 mt-2 space-y-1">
                  {MOCK_CV.sections.map(s => (
                    <li key={s.name} className="flex items-center gap-2 text-[12px] text-[var(--stone-700)]">
                      {s.status === 'done' ? (
                        <Check size={12} className="text-emerald-600" aria-hidden="true" />
                      ) : (
                        <AlertTriangle size={12} className="text-[var(--status-warning)]" aria-hidden="true" />
                      )}
                      <span>{s.name}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </Widget.Body>
      {!compact && (
        <Widget.Footer>
          <Link
            to="/cv"
            className="inline-flex items-center min-h-[44px] px-3 py-1.5 rounded-[7px] bg-[var(--c-solid)] text-white text-[12px] font-bold no-underline"
          >
            Fortsätt redigera
          </Link>
          {!minimal && (
            <Link
              to="/cv"
              className="inline-flex items-center min-h-[44px] px-3 py-1.5 rounded-[7px] bg-[var(--c-bg)] text-[var(--c-text)] text-[12px] font-bold no-underline"
            >
              Förhandsgranska
            </Link>
          )}
        </Widget.Footer>
      )}
    </Widget>
  )
}
```

**File 2: `client/src/components/widgets/CoverLetterWidget.tsx`** (~80 lines)

Mock data: 3 utkast, last: "UX-designer hos Klarna · igår"

```typescript
import { FileText } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Widget } from './Widget'
import { useWidgetSize } from '@/hooks/useWidgetSize'
import type { WidgetProps } from './types'

const MOCK = { count: 3, lastEdited: 'UX-designer hos Klarna · igår' }

export default function CoverLetterWidget({ id, size, onSizeChange, allowedSizes, editMode }: WidgetProps) {
  const { compact, minimal } = useWidgetSize(size)

  return (
    <Widget id={id} size={size} onSizeChange={onSizeChange} allowedSizes={allowedSizes} editMode={editMode}>
      <Widget.Header icon={FileText} title="Personligt brev" />
      <Widget.Body>
        <div className="flex-1 flex flex-col justify-center">
          <span className="text-[32px] font-bold leading-[1.1] text-[var(--stone-900)]">
            {MOCK.count}
          </span>
          <span className="text-[12px] text-[var(--stone-700)]">utkast</span>
          {!compact && (
            <p className="text-[12px] text-[var(--stone-700)] mt-2 m-0">
              Senast: {MOCK.lastEdited}
            </p>
          )}
        </div>
      </Widget.Body>
      {!compact && (
        <Widget.Footer>
          <Link
            to="/cover-letter"
            className="inline-flex items-center min-h-[44px] px-3 py-1.5 rounded-[7px] bg-[var(--c-solid)] text-white text-[12px] font-bold no-underline"
          >
            + Generera nytt brev
          </Link>
          {!minimal && (
            <Link
              to="/cover-letter"
              className="inline-flex items-center min-h-[44px] px-3 py-1.5 text-[var(--c-text)] text-[12px] font-bold no-underline hover:underline"
            >
              Visa alla →
            </Link>
          )}
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
    - File `client/src/components/widgets/CvWidget.tsx` exists
    - `grep -c "export default function CvWidget" client/src/components/widgets/CvWidget.tsx` returns 1
    - `grep -c "Widget\\.Header" client/src/components/widgets/CvWidget.tsx` returns at least 1
    - `grep -c "Widget\\.Body" client/src/components/widgets/CvWidget.tsx` returns at least 1
    - `grep -c "Widget\\.Footer" client/src/components/widgets/CvWidget.tsx` returns at least 1
    - `grep -c "ProgressRing" client/src/components/widgets/CvWidget.tsx` returns at least 1
    - `grep -c "Fortsätt redigera" client/src/components/widgets/CvWidget.tsx` returns 1
    - `grep -c "Nästan klart" client/src/components/widgets/CvWidget.tsx` returns at least 1
    - `grep -c "useWidgetSize" client/src/components/widgets/CvWidget.tsx` returns at least 1
    - File `client/src/components/widgets/CoverLetterWidget.tsx` exists
    - `grep -c "export default function CoverLetterWidget" client/src/components/widgets/CoverLetterWidget.tsx` returns 1
    - `grep -c "3" client/src/components/widgets/CoverLetterWidget.tsx` returns at least 1 (mock count)
    - `grep -c "UX-designer hos Klarna" client/src/components/widgets/CoverLetterWidget.tsx` returns 1
    - `grep -c "+ Generera nytt brev" client/src/components/widgets/CoverLetterWidget.tsx` returns 1
    - `cd client && npx tsc --noEmit` exits 0
  </acceptance_criteria>
  <done>CvWidget renders progress ring with milestone framing (no raw "75% klart" as primary KPI); CoverLetterWidget renders draft count + last-edited; both default-export and use Widget compound + useWidgetSize.</done>
</task>

<task type="auto">
  <name>Task 3: Build InterviewWidget (M, with sparkline) + JobSearchWidget (L, with top-3 match cards)</name>
  <files>client/src/components/widgets/InterviewWidget.tsx, client/src/components/widgets/JobSearchWidget.tsx</files>
  <read_first>
    - .planning/phases/02-static-widget-grid/02-UI-SPEC.md (sections "Mock Data Specification", "Progress / KPI Framing Rules" — match scores must be qualitative)
    - .planning/research/FEATURES.md (lines 110–129 — Interview widget; lines 17–43 — Job Search widget)
    - nav-hub-sketch.html (lines 350–500 — sparkline + match-card CSS)
    - client/src/components/widgets/Sparkline.tsx (created in Task 1)
    - client/src/components/widgets/Widget.tsx
    - client/src/hooks/useWidgetSize.ts
  </read_first>
  <action>
**File 1: `client/src/components/widgets/InterviewWidget.tsx`** (~90 lines)

Mock per UI-SPEC: score 84/100, "3 övningar denna vecka", sparkline 8 trending-up points.

```typescript
import { Mic } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Widget } from './Widget'
import { Sparkline } from './Sparkline'
import { useWidgetSize } from '@/hooks/useWidgetSize'
import type { WidgetProps } from './types'

const MOCK = {
  lastScore: 84,
  weeklyExercises: 3,
  trend: [62, 68, 71, 70, 76, 80, 82, 84],
}

export default function InterviewWidget({ id, size, onSizeChange, allowedSizes, editMode }: WidgetProps) {
  const { compact, minimal } = useWidgetSize(size)

  return (
    <Widget id={id} size={size} onSizeChange={onSizeChange} allowedSizes={allowedSizes} editMode={editMode}>
      <Widget.Header icon={Mic} title="Intervjuträning" />
      <Widget.Body>
        <div className="flex-1 flex flex-col justify-center">
          <div className="flex items-baseline gap-2">
            <span className="text-[22px] font-bold leading-[1.1] text-[var(--stone-900)]">
              {MOCK.lastScore}
            </span>
            <span className="text-[12px] text-[var(--stone-700)]">/ 100</span>
          </div>
          <span className="text-[12px] text-[var(--stone-700)]">senaste poäng</span>
          {!compact && (
            <>
              <p className="text-[12px] text-[var(--stone-700)] mt-2 m-0">
                {MOCK.weeklyExercises} övningar denna vecka
              </p>
              <div className="mt-2">
                <Sparkline values={MOCK.trend} width={140} height={28} />
              </div>
            </>
          )}
        </div>
      </Widget.Body>
      {!compact && (
        <Widget.Footer>
          <Link
            to="/interview-simulator"
            className="inline-flex items-center min-h-[44px] px-3 py-1.5 rounded-[7px] bg-[var(--c-solid)] text-white text-[12px] font-bold no-underline"
          >
            Starta ny session
          </Link>
        </Widget.Footer>
      )}
    </Widget>
  )
}
```

**File 2: `client/src/components/widgets/JobSearchWidget.tsx`** (~120 lines)

Mock per UI-SPEC: "12 nya träffar idag", top 3 match rows with **qualitative labels only** (no raw % per anti-shaming rule).

```typescript
import { Search, Building2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Widget } from './Widget'
import { useWidgetSize } from '@/hooks/useWidgetSize'
import type { WidgetProps } from './types'

interface MatchRow {
  role: string
  company: string
  /** Qualitative label only — never raw percentage (UI-SPEC anti-shaming rule) */
  matchLabel: 'Bra match' | 'Mycket bra match'
}

const MOCK = {
  newToday: 12,
  matches: [
    { role: 'UX-designer',         company: 'Klarna',   matchLabel: 'Mycket bra match' as const },
    { role: 'Produktdesigner',     company: 'Spotify',  matchLabel: 'Bra match' as const },
    { role: 'Senior UX Researcher', company: 'iZettle', matchLabel: 'Bra match' as const },
  ] satisfies MatchRow[],
}

export default function JobSearchWidget({ id, size, onSizeChange, allowedSizes, editMode }: WidgetProps) {
  const { compact, minimal } = useWidgetSize(size)

  return (
    <Widget id={id} size={size} onSizeChange={onSizeChange} allowedSizes={allowedSizes} editMode={editMode}>
      <Widget.Header icon={Search} title="Sök jobb" />
      <Widget.Body>
        <div className="flex-1 flex flex-col">
          <span className="text-[32px] font-bold leading-[1.1] text-[var(--stone-900)]">
            {MOCK.newToday}
          </span>
          <span className="text-[12px] text-[var(--stone-700)]">nya träffar idag</span>

          {!minimal && (
            <ul className="list-none p-0 mt-3 space-y-2">
              {MOCK.matches.map(m => (
                <li
                  key={`${m.role}-${m.company}`}
                  className="flex items-center justify-between gap-2 bg-[var(--c-bg)] rounded-[8px] px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-bold text-[var(--stone-900)] m-0 truncate">{m.role}</p>
                    <p className="text-[12px] font-normal text-[var(--stone-700)] m-0 truncate flex items-center gap-1">
                      <Building2 size={10} aria-hidden="true" />
                      {m.company}
                    </p>
                  </div>
                  <span className="text-[12px] font-bold text-[var(--c-text)] whitespace-nowrap">
                    {m.matchLabel}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Widget.Body>
      {!compact && (
        <Widget.Footer>
          <Link
            to="/job-search"
            className="inline-flex items-center min-h-[44px] px-3 py-1.5 rounded-[7px] bg-[var(--c-solid)] text-white text-[12px] font-bold no-underline"
          >
            Visa alla {MOCK.newToday} träffar
          </Link>
        </Widget.Footer>
      )}
    </Widget>
  )
}
```
  </action>
  <verify>
    <automated>cd client && npx tsc --noEmit && cd client && grep -L "[0-9]\+%\s*match" src/components/widgets/JobSearchWidget.tsx</automated>
  </verify>
  <acceptance_criteria>
    - File `client/src/components/widgets/InterviewWidget.tsx` exists
    - `grep -c "export default function InterviewWidget" client/src/components/widgets/InterviewWidget.tsx` returns 1
    - `grep -c "Sparkline" client/src/components/widgets/InterviewWidget.tsx` returns at least 1
    - `grep -c "84" client/src/components/widgets/InterviewWidget.tsx` returns at least 1 (mock score)
    - `grep -c "Starta ny session" client/src/components/widgets/InterviewWidget.tsx` returns 1
    - File `client/src/components/widgets/JobSearchWidget.tsx` exists
    - `grep -c "export default function JobSearchWidget" client/src/components/widgets/JobSearchWidget.tsx` returns 1
    - `grep -c "12" client/src/components/widgets/JobSearchWidget.tsx` returns at least 1 (newToday)
    - `grep -c "nya träffar idag" client/src/components/widgets/JobSearchWidget.tsx` returns at least 1
    - `grep -c "Bra match" client/src/components/widgets/JobSearchWidget.tsx` returns at least 1
    - `grep -c "Mycket bra match" client/src/components/widgets/JobSearchWidget.tsx` returns at least 1
    - JobSearchWidget contains NO raw "%" inside match labels: `grep -E "[0-9]+%[^a-zA-Z]" client/src/components/widgets/JobSearchWidget.tsx | wc -l` returns 0
    - `grep -c "Visa alla" client/src/components/widgets/JobSearchWidget.tsx` returns at least 1
    - `cd client && npx tsc --noEmit` exits 0
  </acceptance_criteria>
  <done>InterviewWidget renders 84/100 score + sparkline + "3 övningar denna vecka" + "Starta ny session" CTA; JobSearchWidget renders "12 nya träffar idag" KPI + top-3 match cards with qualitative labels only (no raw match %); both default-export.</done>
</task>

</tasks>

<verification>
- All 6 files exist in client/src/components/widgets/
- `cd client && npx tsc --noEmit` exits 0
- All 4 widgets have `export default function`
- All 4 widgets use Widget compound API and useWidgetSize hook
- No widget uses recharts (`grep -r recharts client/src/components/widgets/` returns 0 matches)
- JobSearchWidget contains qualitative match labels and no raw match %
- CvWidget uses milestone framing (not "75% klart" as the primary label)
</verification>

<success_criteria>
1. CvWidget (focal point at L on Söka Jobb) renders progress ring + checklist + milestone label
2. CoverLetterWidget shows draft count and last-edited
3. InterviewWidget shows score + sparkline (hand-rolled SVG, no recharts)
4. JobSearchWidget shows new-matches KPI + top-3 cards with qualitative labels
5. All 4 widgets are default-exported so the WIDGET_REGISTRY's lazy() imports resolve
6. All 4 widgets respect anti-shaming framing rules from UI-SPEC
</success_criteria>

<output>
After completion, create `.planning/phases/02-static-widget-grid/02-02-widgets-cluster-a-SUMMARY.md` documenting:
- Files created and their default exports
- Mock data values used per widget (so plan 02-04 verifies hub layout matches)
- Confirmation that no widget references future hooks (Phase 3 will replace mocks with real React Query hooks)
- Confirmation that JobSearchWidget shows qualitative labels only
</output>
