---
phase: 02-static-widget-grid
plan: "01"
type: execute
wave: 1
depends_on: []
files_modified:
  - client/src/components/widgets/Widget.tsx
  - client/src/hooks/useWidgetSize.ts
  - client/src/components/widgets/WidgetErrorBoundary.tsx
  - client/src/components/widgets/HubGrid.tsx
  - client/src/components/widgets/registry.ts
  - client/src/components/widgets/defaultLayouts.ts
  - client/src/components/widgets/types.ts
autonomous: true
requirements:
  - WIDG-01
  - WIDG-02
  - WIDG-03
must_haves:
  truths:
    - "Widget compound API is available: Widget.Root, Widget.Header, Widget.Body, Widget.Footer importable from one file"
    - "useWidgetSize(size) returns booleans (isS, isM, isL, isXL, compact, minimal) callable from widgets"
    - "WidgetErrorBoundary catches throws inside widgets and renders the spec-compliant fallback card without breaking siblings"
    - "HubGrid renders a 4-col CSS grid (2-col under 900px) with grid-auto-rows: 150px, gap: 14px"
    - "Size-toggle group is keyboard-accessible: role=group, aria-label, aria-pressed per button"
    - "Widget registry exists as a typed map and uses lazy() for component loading"
  artifacts:
    - path: "client/src/components/widgets/types.ts"
      provides: "WidgetSize type, WidgetProps interface, HubId re-export"
      contains: "WidgetSize"
    - path: "client/src/components/widgets/Widget.tsx"
      provides: "Widget compound component (Root, Header, Body, Footer) + size-toggle subcomponent"
      exports: ["Widget"]
    - path: "client/src/hooks/useWidgetSize.ts"
      provides: "useWidgetSize hook returning size flags"
      exports: ["useWidgetSize"]
    - path: "client/src/components/widgets/WidgetErrorBoundary.tsx"
      provides: "Per-widget error boundary with spec fallback (Kunde inte ladda / Försök igen om en stund)"
      exports: ["WidgetErrorBoundary"]
    - path: "client/src/components/widgets/HubGrid.tsx"
      provides: "Grid container, Section wrapper, Slot wrapper that ties widget into grid span"
      exports: ["HubGrid"]
    - path: "client/src/components/widgets/registry.ts"
      provides: "WIDGET_REGISTRY map with lazy()-imported components"
      exports: ["WIDGET_REGISTRY", "WidgetId"]
    - path: "client/src/components/widgets/defaultLayouts.ts"
      provides: "getDefaultLayout(hubId) returning ordered {id, size}[]"
      exports: ["getDefaultLayout"]
  key_links:
    - from: "Widget.tsx size-toggle"
      to: "useWidgetSize hook"
      via: "size prop drives toggle aria-pressed states"
      pattern: "aria-pressed"
    - from: "HubGrid"
      to: "WidgetErrorBoundary"
      via: "each Slot wraps child in WidgetErrorBoundary"
      pattern: "WidgetErrorBoundary"
    - from: "registry.ts"
      to: "lazy widget components"
      via: "lazy(() => import('./XxxWidget'))"
      pattern: "lazy\\("
---

<objective>
Build the Widget compound component foundation — base API, size hook, per-widget error boundary, grid container, and the typed registry/defaults that downstream widget plans (02-02, 02-03) and the hub-wiring plan (02-04) consume.

Purpose: Establish the immutable contract every widget implements. Without this foundation, downstream parallel widget plans cannot run.
Output: 7 files in client/src/components/widgets/ + client/src/hooks/useWidgetSize.ts. No widget is implemented yet — only the scaffolding.
</objective>

<execution_context>
@C:/Users/Mikael/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/Mikael/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/02-static-widget-grid/02-UI-SPEC.md
@.planning/research/ARCHITECTURE.md
@.planning/research/PITFALLS.md
@nav-hub-sketch.html
@client/src/styles/tokens.css
@client/src/components/ErrorBoundary.tsx
@client/src/components/layout/PageLayout.tsx
@client/src/components/layout/navigation.ts

<interfaces>
<!-- Existing exports from Phase 1 that this plan depends on -->

From client/src/components/layout/navigation.ts (Phase 1 plan 01):
```typescript
export type HubId = 'oversikt' | 'jobb' | 'karriar' | 'resurser' | 'min-vardag'
export interface NavHub { id: HubId; path: string; labelKey: string; fallbackLabel: string; domain: 'action' | 'activity' | 'coaching' | 'info' | 'wellbeing'; icon: ComponentType; memberPaths: string[]; items: NavItem[] }
export const navHubs: NavHub[]
export function getActiveHub(pathname: string): NavHub | undefined
export function isHubNavEnabled(): boolean
```

From client/src/components/ErrorBoundary.tsx:
```typescript
export class ErrorBoundary extends Component<{children, fallback?, onError?}> { ... }
// Generic error boundary — we'll build a widget-specific one for the spec fallback
```

From client/src/components/layout/PageLayout.tsx:
```typescript
// Sets data-domain="..." on root div — drives --c-* CSS variables
// Hub pages use <PageLayout domain="activity"> already
```

CSS tokens available (from tokens.css, set by data-domain ancestor):
- `var(--c-bg)`, `var(--c-accent)`, `var(--c-solid)`, `var(--c-text)` — domain pastels
- `var(--surface)`, `var(--canvas)`, `var(--header-bg)`, `var(--header-border)`
- `var(--stone-150)`, `var(--stone-500)`, `var(--stone-700)`, `var(--stone-900)`
- `var(--motion-fast)` (150ms, auto-zeros under prefers-reduced-motion)
- `var(--status-warning)`, `var(--status-warning-bg)` (amber #D97706 / #FEF3C7)
- `var(--status-error)` (#DC2626)
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Define WidgetSize type, WidgetProps interface, useWidgetSize hook</name>
  <files>client/src/components/widgets/types.ts, client/src/hooks/useWidgetSize.ts, client/src/hooks/useWidgetSize.test.ts</files>
  <read_first>
    - .planning/phases/02-static-widget-grid/02-UI-SPEC.md (sections "Widget Component Contract", "Widget Grid Contract")
    - .planning/research/ARCHITECTURE.md (lines 200–290, sections "Widget Component Contract", "useWidgetSize() hook")
    - client/src/components/layout/navigation.ts (existing HubId type to re-export)
  </read_first>
  <behavior>
    - useWidgetSize('S') returns { isS: true, isM: false, isL: false, isXL: false, compact: true, minimal: true }
    - useWidgetSize('M') returns { isS: false, isM: true, isL: false, isXL: false, compact: false, minimal: true }
    - useWidgetSize('L') returns { isS: false, isM: false, isL: true, isXL: false, compact: false, minimal: false }
    - useWidgetSize('XL') returns { isS: false, isM: false, isL: false, isXL: true, compact: false, minimal: false }
  </behavior>
  <action>
Create THREE files.

**File 1: `client/src/components/widgets/types.ts`** (~30 lines)

```typescript
import type { HubId } from '@/components/layout/navigation'

export type { HubId }

export type WidgetSize = 'S' | 'M' | 'L' | 'XL'

export interface WidgetProps {
  /** Stable identifier — matches WIDGET_REGISTRY key */
  id: string
  /** Currently rendered size (controlled by hub) */
  size: WidgetSize
  /** Called when user clicks an S/M/L toggle button */
  onSizeChange?: (newSize: WidgetSize) => void
  /** Sizes the widget supports (subset of WidgetSize). Defaults to ['S','M','L'] */
  allowedSizes?: WidgetSize[]
  /** Whether customization controls are visible permanently. Phase 2 = false default */
  editMode?: boolean
  className?: string
}

export interface WidgetLayoutItem {
  id: string
  size: WidgetSize
  order: number
}
```

**File 2: `client/src/hooks/useWidgetSize.ts`** (~25 lines)

```typescript
import type { WidgetSize } from '@/components/widgets/types'

export interface WidgetSizeFlags {
  isS: boolean
  isM: boolean
  isL: boolean
  isXL: boolean
  /** True only at S — render KPI number, no body text, no footer */
  compact: boolean
  /** True at S or M — no large visualization, no L-size visual elements */
  minimal: boolean
}

export function useWidgetSize(size: WidgetSize): WidgetSizeFlags {
  return {
    isS: size === 'S',
    isM: size === 'M',
    isL: size === 'L',
    isXL: size === 'XL',
    compact: size === 'S',
    minimal: size === 'S' || size === 'M',
  }
}
```

**File 3: `client/src/hooks/useWidgetSize.test.ts`** (~50 lines)

```typescript
import { describe, it, expect } from 'vitest'
import { useWidgetSize } from './useWidgetSize'

// Hook is pure — no React renderer needed
describe('useWidgetSize', () => {
  it('S returns compact + minimal true, isS true, others false', () => {
    const r = useWidgetSize('S')
    expect(r).toEqual({ isS: true, isM: false, isL: false, isXL: false, compact: true, minimal: true })
  })
  it('M returns minimal true, compact false', () => {
    const r = useWidgetSize('M')
    expect(r).toEqual({ isS: false, isM: true, isL: false, isXL: false, compact: false, minimal: true })
  })
  it('L returns compact false, minimal false', () => {
    const r = useWidgetSize('L')
    expect(r).toEqual({ isS: false, isM: false, isL: true, isXL: false, compact: false, minimal: false })
  })
  it('XL returns isXL true, others false', () => {
    const r = useWidgetSize('XL')
    expect(r).toEqual({ isS: false, isM: false, isL: false, isXL: true, compact: false, minimal: false })
  })
})
```
  </action>
  <verify>
    <automated>cd client && npm run test:run -- useWidgetSize</automated>
  </verify>
  <acceptance_criteria>
    - File `client/src/components/widgets/types.ts` exists
    - `grep -c "export type WidgetSize" client/src/components/widgets/types.ts` returns 1
    - `grep -c "export interface WidgetProps" client/src/components/widgets/types.ts` returns 1
    - `grep -c "WidgetLayoutItem" client/src/components/widgets/types.ts` returns at least 1
    - File `client/src/hooks/useWidgetSize.ts` exists
    - `grep -c "export function useWidgetSize" client/src/hooks/useWidgetSize.ts` returns 1
    - `grep -c "compact" client/src/hooks/useWidgetSize.ts` returns at least 1
    - `cd client && npm run test:run -- useWidgetSize` exits 0 with all 4 tests passing
    - `cd client && npx tsc --noEmit` exits 0
  </acceptance_criteria>
  <done>WidgetSize/WidgetProps types and useWidgetSize hook exist, hook returns correct flags for all 4 sizes, all tests pass, TypeScript clean.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Build Widget compound component (Root, Header, Body, Footer) with keyboard-accessible S/M/L toggle</name>
  <files>client/src/components/widgets/Widget.tsx, client/src/components/widgets/Widget.test.tsx</files>
  <read_first>
    - .planning/phases/02-static-widget-grid/02-UI-SPEC.md (full file — especially "Widget Component Contract", "Size Toggle Group", "Accessibility Contract")
    - .planning/research/ARCHITECTURE.md (lines 200–315, "Widget Component Contract" + "Compound sub-components")
    - .planning/research/PITFALLS.md (Pitfall 9 — keyboard accessibility)
    - nav-hub-sketch.html (lines 121–200 for .widget, .w-head, .w-icon, .size-toggle CSS)
    - client/src/components/widgets/types.ts (created in Task 1)
    - client/src/hooks/useWidgetSize.ts (created in Task 1)
  </read_first>
  <behavior>
    - Widget.Root renders a div with class containing 'bg-[var(--surface)]', 'border', 'rounded-[12px]', 'p-[14px_16px]'
    - Widget.Header renders icon container (26x26 rounded-[7px] bg-[var(--c-bg)]) + h3 (13px font-bold text-[var(--stone-900)]) + size toggle group on right
    - Size toggle group has role="group", aria-label="Välj widgetstorlek"
    - Each S/M/L button has aria-pressed reflecting active state
    - Clicking the M button when size='S' calls onSizeChange('M') exactly once
    - Pressing Enter on a focused button triggers onSizeChange (native button behavior)
    - When editMode=false, toggle is opacity-0 by default with group-hover:opacity-100 (CSS hover reveal)
    - When editMode=true, toggle is always opacity-100
    - Widget.Footer is hidden when size='S'
  </behavior>
  <action>
Create TWO files.

**File 1: `client/src/components/widgets/Widget.tsx`** (~150 lines)

Compound component using `Object.assign(Root, { Header, Body, Footer })`. Use Tailwind classes that map to UI-SPEC values exactly. Must reference exact spec values:

- Root: `bg-[var(--surface)] border border-[var(--stone-150)] rounded-[12px] p-[14px_16px] flex flex-col overflow-hidden transition-[border-color,box-shadow] duration-[var(--motion-fast)] hover:border-[var(--c-accent)] hover:shadow-[0_2px_6px_rgb(0_0_0/0.05)] group relative`

- Header layout: `flex items-center justify-between mb-[10px]`
- Icon container: `w-[26px] h-[26px] rounded-[7px] bg-[var(--c-bg)] text-[var(--c-text)] flex items-center justify-center` with `aria-hidden="true"` on the icon child. Renders the lucide icon at size 14.
- Title: `<h3 className="text-[13px] font-bold leading-[1.3] text-[var(--stone-900)]">`

- Size toggle group container: `flex gap-[1px] bg-[var(--stone-150)] rounded-[6px] p-[1px] transition-opacity duration-[var(--motion-fast)] {editMode ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus-within:opacity-100'}` with `role="group" aria-label="Välj widgetstorlek"`

- Each toggle button: native `<button>` with `w-[18px] h-[18px] text-[9px] font-bold rounded-[5px] cursor-pointer border-0 bg-transparent text-[var(--stone-700)] {active ? 'bg-white text-[var(--c-text)]' : ''}` and `aria-pressed={size === activeSize}` and `aria-label={`Sätt storlek till ${size}`}` and `min-h-[24px] min-w-[24px]` for WCAG touch target (use a wrapper or pseudo since the visual is 18px).

  IMPORTANT: To meet 44px group touch target while keeping 18px visual, the group as a whole (~56px wide) satisfies it; do NOT inflate individual buttons.

- Body: `<div className="flex-1 flex flex-col min-h-0">`
- Footer: `<div className="flex gap-[6px] mt-[10px]">` — render `null` when size === 'S' (compute from size prop)

Export interface:
```typescript
interface WidgetRootProps extends WidgetProps {
  children: React.ReactNode
}

function WidgetRoot({ id, size, onSizeChange, allowedSizes = ['S','M','L'], editMode = false, className, children, ...rest }: WidgetRootProps) {
  // pass size + onSizeChange + allowedSizes + editMode down via React Context (WidgetContext)
  return <div className={...} data-widget-id={id} data-widget-size={size}>...</div>
}

interface WidgetHeaderProps {
  icon: LucideIcon
  title: string
}

function WidgetHeader({ icon: Icon, title }: WidgetHeaderProps) {
  // read size, onSizeChange, allowedSizes, editMode from WidgetContext
  // render icon container + h3 + size toggle
}

interface WidgetBodyProps { children: React.ReactNode; className?: string }
interface WidgetFooterProps { children: React.ReactNode; className?: string }

export const Widget = Object.assign(WidgetRoot, {
  Header: WidgetHeader,
  Body: WidgetBody,
  Footer: WidgetFooter,
})
```

Use a private `WidgetContext` (createContext) to pass size/onSizeChange/allowedSizes/editMode from Root to Header. This avoids prop-drilling and lets Header render the toggle without consumer wiring.

**File 2: `client/src/components/widgets/Widget.test.tsx`** (~120 lines)

Use vitest + @testing-library/react. Test these behaviors:

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FileUser } from 'lucide-react'
import { Widget } from './Widget'

function renderWidget(props: Partial<Parameters<typeof Widget>[0]> = {}) {
  const onSizeChange = vi.fn()
  const utils = render(
    <Widget id="test" size="M" onSizeChange={onSizeChange} editMode={true} {...props}>
      <Widget.Header icon={FileUser} title="Test Widget" />
      <Widget.Body>Body content</Widget.Body>
      <Widget.Footer><button>Action</button></Widget.Footer>
    </Widget>
  )
  return { ...utils, onSizeChange }
}

describe('Widget compound', () => {
  it('renders title in h3', () => {
    renderWidget()
    expect(screen.getByRole('heading', { level: 3, name: 'Test Widget' })).toBeInTheDocument()
  })
  it('renders body content', () => {
    renderWidget()
    expect(screen.getByText('Body content')).toBeInTheDocument()
  })
  it('hides footer when size=S', () => {
    renderWidget({ size: 'S' })
    expect(screen.queryByRole('button', { name: 'Action' })).not.toBeInTheDocument()
  })
  it('shows footer when size=M', () => {
    renderWidget({ size: 'M' })
    expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument()
  })
  it('size toggle group has role=group with Swedish label', () => {
    renderWidget()
    expect(screen.getByRole('group', { name: 'Välj widgetstorlek' })).toBeInTheDocument()
  })
  it('renders S, M, L buttons by default', () => {
    renderWidget()
    expect(screen.getByRole('button', { name: /Sätt storlek till S/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Sätt storlek till M/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Sätt storlek till L/i })).toBeInTheDocument()
  })
  it('active size button has aria-pressed=true', () => {
    renderWidget({ size: 'M' })
    const mBtn = screen.getByRole('button', { name: /Sätt storlek till M/i })
    expect(mBtn).toHaveAttribute('aria-pressed', 'true')
    const sBtn = screen.getByRole('button', { name: /Sätt storlek till S/i })
    expect(sBtn).toHaveAttribute('aria-pressed', 'false')
  })
  it('clicking L button calls onSizeChange("L") exactly once', () => {
    const { onSizeChange } = renderWidget({ size: 'M' })
    fireEvent.click(screen.getByRole('button', { name: /Sätt storlek till L/i }))
    expect(onSizeChange).toHaveBeenCalledTimes(1)
    expect(onSizeChange).toHaveBeenCalledWith('L')
  })
  it('respects allowedSizes (renders only S+M when allowedSizes=["S","M"])', () => {
    renderWidget({ allowedSizes: ['S','M'] })
    expect(screen.queryByRole('button', { name: /Sätt storlek till L/i })).not.toBeInTheDocument()
  })
  it('icon has aria-hidden=true', () => {
    const { container } = renderWidget()
    const icon = container.querySelector('[aria-hidden="true"]')
    expect(icon).toBeInTheDocument()
  })
})
```
  </action>
  <verify>
    <automated>cd client && npm run test:run -- Widget.test</automated>
  </verify>
  <acceptance_criteria>
    - File `client/src/components/widgets/Widget.tsx` exists
    - `grep -c "export const Widget = Object.assign" client/src/components/widgets/Widget.tsx` returns 1
    - `grep -c 'role="group"' client/src/components/widgets/Widget.tsx` returns at least 1
    - `grep -c 'aria-label="Välj widgetstorlek"' client/src/components/widgets/Widget.tsx` returns 1
    - `grep -c "aria-pressed" client/src/components/widgets/Widget.tsx` returns at least 1
    - `grep -c 'aria-hidden="true"' client/src/components/widgets/Widget.tsx` returns at least 1
    - `grep -c "var(--surface)" client/src/components/widgets/Widget.tsx` returns at least 1
    - `grep -c "var(--c-bg)" client/src/components/widgets/Widget.tsx` returns at least 1
    - `grep -c "26px" client/src/components/widgets/Widget.tsx` returns at least 1 (icon container)
    - `grep -c "18px" client/src/components/widgets/Widget.tsx` returns at least 1 (toggle button)
    - `grep -c "rounded-\[12px\]" client/src/components/widgets/Widget.tsx` returns at least 1
    - `cd client && npm run test:run -- Widget.test` exits 0 with all 10 tests passing
    - `cd client && npx tsc --noEmit` exits 0
  </acceptance_criteria>
  <done>Widget.tsx exports compound component with Root/Header/Body/Footer; size toggle is keyboard-accessible (role=group, aria-pressed, aria-label); footer hides at S; clicking toggles call onSizeChange; all spec CSS values present; all tests pass.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 3: Build WidgetErrorBoundary with spec fallback card + HubGrid container + registry/defaults skeleton</name>
  <files>client/src/components/widgets/WidgetErrorBoundary.tsx, client/src/components/widgets/HubGrid.tsx, client/src/components/widgets/registry.ts, client/src/components/widgets/defaultLayouts.ts, client/src/components/widgets/WidgetErrorBoundary.test.tsx, client/src/components/widgets/HubGrid.test.tsx</files>
  <read_first>
    - .planning/phases/02-static-widget-grid/02-UI-SPEC.md (sections "Error Boundary Fallback Card Contract", "Widget Grid Contract", "Section Heading Contract", "Bundle / Code-Split Contract")
    - .planning/research/ARCHITECTURE.md (sections "Widget registry", "Default layouts per hub", lines 296–470)
    - .planning/research/PITFALLS.md (Pitfall 4 — error cascade; Pitfall 14 — bundle bloat)
    - .planning/research/FEATURES.md (per-widget specs to derive default layouts)
    - client/src/components/ErrorBoundary.tsx (existing pattern to extend)
    - nav-hub-sketch.html (lines 102–135 for .grid, .section, .section-head CSS)
    - client/src/components/widgets/Widget.tsx (created in Task 2)
    - client/src/components/widgets/types.ts (created in Task 1)
  </read_first>
  <behavior>
    - WidgetErrorBoundary catches errors from children and renders fallback card
    - Fallback contains text "Kunde inte ladda" and "Försök igen om en stund"
    - Fallback contains a Retry button labeled "Försök igen"
    - Clicking Retry resets the boundary state (children re-mount)
    - HubGrid.Section renders an h4 inside a section with aria-label
    - HubGrid.Slot wraps child in WidgetErrorBoundary so a child throw doesn't break siblings
    - WIDGET_REGISTRY contains 8 jobb-hub widget IDs all using lazy()
    - getDefaultLayout('jobb') returns 8 ordered items; other hubs return 1-2 placeholder items
  </behavior>
  <action>
Create SIX files.

**File 1: `client/src/components/widgets/WidgetErrorBoundary.tsx`** (~80 lines)

Class component (React requires class for componentDidCatch). Spec contract from UI-SPEC "Error Boundary Fallback Card Contract":

```typescript
import { Component, ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'

interface Props {
  children: ReactNode
  /** Forwarded for grid placement parity with the failed widget */
  className?: string
}

interface State { hasError: boolean }

export class WidgetErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error) {
    console.error('Widget error:', error)
  }

  handleRetry = () => this.setState({ hasError: false })

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div
        role="alert"
        className={`bg-[var(--surface)] border border-[var(--stone-150)] rounded-[12px] p-[14px_16px] flex flex-col items-center justify-center gap-[8px] ${this.props.className ?? ''}`}
      >
        <AlertCircle size={16} className="text-[var(--stone-500)]" aria-hidden="true" />
        <h3 className="text-[13px] font-bold text-[var(--stone-700)] m-0">Kunde inte ladda</h3>
        <p className="text-[12px] font-normal text-[var(--stone-500)] m-0 text-center">
          Försök igen om en stund
        </p>
        <button
          type="button"
          onClick={this.handleRetry}
          className="text-[12px] font-bold text-[var(--c-text)] bg-transparent border-0 cursor-pointer underline-offset-2 hover:underline"
        >
          Försök igen
        </button>
      </div>
    )
  }
}
```

**File 2: `client/src/components/widgets/HubGrid.tsx`** (~110 lines)

Provides three building blocks:

```typescript
import { ReactNode, Suspense } from 'react'
import { WidgetErrorBoundary } from './WidgetErrorBoundary'
import type { WidgetSize } from './types'

interface HubGridProps {
  children: ReactNode
  className?: string
}

/** 4-col grid (2-col under 900px), grid-auto-rows: 150px, gap: 14px */
function HubGridRoot({ children, className }: HubGridProps) {
  return (
    <div
      className={`grid grid-cols-2 min-[900px]:grid-cols-4 auto-rows-[150px] gap-[14px] ${className ?? ''}`}
    >
      {children}
    </div>
  )
}

interface SectionProps {
  /** Visible Swedish section heading */
  title: string
  children: ReactNode
}

/** Section heading + grid wrapper for grouped widgets. Renders as <section aria-label={title}> */
function Section({ title, children }: SectionProps) {
  return (
    <section aria-label={title} className="mb-[28px] last:mb-0">
      <div className="flex items-center gap-[10px] mb-[10px]">
        <h4 className="text-[12px] font-bold uppercase tracking-[0.06em] text-[var(--c-text)] m-0">
          {title}
        </h4>
        <div className="flex-1 h-px bg-[var(--stone-150)]" />
      </div>
      <div className="grid grid-cols-2 min-[900px]:grid-cols-4 auto-rows-[150px] gap-[14px]">
        {children}
      </div>
    </section>
  )
}

interface SlotProps {
  size: WidgetSize
  children: ReactNode
  /** Suspense fallback for lazy widgets. Default: a spec skeleton card */
  fallback?: ReactNode
}

const SIZE_CLASSES: Record<WidgetSize, string> = {
  S: 'col-span-1 row-span-1',
  M: 'col-span-2 row-span-1',
  L: 'col-span-2 row-span-2',
  XL: 'col-span-2 min-[900px]:col-span-4 row-span-1',
}

/** Wraps a single widget: applies grid span + per-widget ErrorBoundary + Suspense */
function Slot({ size, children, fallback }: SlotProps) {
  const skeleton = (
    <div className="bg-[var(--surface)] border border-[var(--stone-150)] rounded-[12px] p-[14px_16px] animate-pulse">
      <div className="h-4 bg-stone-200 rounded w-3/4 mb-3" />
      <div className="h-3 bg-stone-200 rounded w-1/2" />
    </div>
  )
  return (
    <div className={SIZE_CLASSES[size]}>
      <WidgetErrorBoundary>
        <Suspense fallback={fallback ?? skeleton}>{children}</Suspense>
      </WidgetErrorBoundary>
    </div>
  )
}

export const HubGrid = Object.assign(HubGridRoot, {
  Section,
  Slot,
})
```

**File 3: `client/src/components/widgets/registry.ts`** (~80 lines)

```typescript
import { lazy, type ComponentType, type LazyExoticComponent } from 'react'
import type { WidgetProps, WidgetSize } from './types'

export interface WidgetRegistryEntry {
  /** Lazy-loaded component — never imported statically */
  component: LazyExoticComponent<ComponentType<WidgetProps>>
  defaultSize: WidgetSize
  allowedSizes: WidgetSize[]
}

/**
 * All widgets MUST use lazy() per Bundle / Code-Split Contract (02-UI-SPEC.md).
 * Files referenced here are created in plans 02-02 and 02-03.
 * Do NOT add static imports for any widget file.
 */
export const WIDGET_REGISTRY = {
  // Söka jobb hub (8 widgets — built in plans 02-02 and 02-03)
  cv:             { component: lazy(() => import('./CvWidget')),            defaultSize: 'L', allowedSizes: ['S','M','L'] },
  'cover-letter': { component: lazy(() => import('./CoverLetterWidget')),   defaultSize: 'M', allowedSizes: ['S','M','L'] },
  interview:      { component: lazy(() => import('./InterviewWidget')),     defaultSize: 'M', allowedSizes: ['S','M','L'] },
  'job-search':   { component: lazy(() => import('./JobSearchWidget')),     defaultSize: 'L', allowedSizes: ['M','L','XL'] },
  applications:   { component: lazy(() => import('./ApplicationsWidget')),  defaultSize: 'M', allowedSizes: ['S','M','L'] },
  spontaneous:    { component: lazy(() => import('./SpontaneousWidget')),   defaultSize: 'S', allowedSizes: ['S','M'] },
  salary:         { component: lazy(() => import('./SalaryWidget')),        defaultSize: 'M', allowedSizes: ['S','M'] },
  international:  { component: lazy(() => import('./InternationalWidget')), defaultSize: 'S', allowedSizes: ['S','M'] },
} as const satisfies Record<string, WidgetRegistryEntry>

export type WidgetId = keyof typeof WIDGET_REGISTRY
```

**File 4: `client/src/components/widgets/defaultLayouts.ts`** (~70 lines)

```typescript
import type { HubId, WidgetLayoutItem } from './types'

/**
 * Default widget layouts per hub for Phase 2.
 * Söka jobb is the demo hub — full 8-widget layout.
 * Other hubs get 1-2 placeholder widgets so navigation works visually.
 * Phase 5 fills in the rest (HUB-02..HUB-04).
 */
export function getDefaultLayout(hubId: HubId): WidgetLayoutItem[] {
  const defaults: Record<HubId, WidgetLayoutItem[]> = {
    jobb: [
      // Section 1: Skapa & öva (focal point: CV at L, position 0)
      { id: 'cv',             size: 'L', order: 0 },
      { id: 'cover-letter',   size: 'M', order: 1 },
      { id: 'interview',      size: 'M', order: 2 },
      // Section 2: Sök & ansök
      { id: 'job-search',     size: 'L', order: 3 },
      { id: 'applications',   size: 'M', order: 4 },
      { id: 'spontaneous',    size: 'S', order: 5 },
      // Section 3: Marknad
      { id: 'salary',         size: 'M', order: 6 },
      { id: 'international',  size: 'S', order: 7 },
    ],
    // Phase 2 placeholder hubs — single S widget each, real widgets in Phase 5
    karriar:      [{ id: 'cv', size: 'S', order: 0 }],  // reuse cv as placeholder
    resurser:     [{ id: 'cv', size: 'S', order: 0 }],
    'min-vardag': [{ id: 'cv', size: 'S', order: 0 }],
    oversikt:     [{ id: 'cv', size: 'S', order: 0 }],
  }
  return defaults[hubId]
}

/**
 * For Phase 2, jobb-hub layout grouped into named sections.
 * Each section gets a labeled HubGrid.Section in JobsokHub.
 */
export interface SectionedLayout {
  title: string
  items: WidgetLayoutItem[]
}

export function getJobbSections(): SectionedLayout[] {
  const all = getDefaultLayout('jobb')
  return [
    { title: 'Skapa & öva', items: all.slice(0, 3) },
    { title: 'Sök & ansök', items: all.slice(3, 6) },
    { title: 'Marknad',     items: all.slice(6, 8) },
  ]
}
```

**File 5: `client/src/components/widgets/WidgetErrorBoundary.test.tsx`** (~70 lines)

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { WidgetErrorBoundary } from './WidgetErrorBoundary'

function ThrowingChild({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error('test error')
  return <div>OK</div>
}

describe('WidgetErrorBoundary', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('renders children when no error', () => {
    render(<WidgetErrorBoundary><div>Healthy</div></WidgetErrorBoundary>)
    expect(screen.getByText('Healthy')).toBeInTheDocument()
  })

  it('renders fallback when child throws', () => {
    render(
      <WidgetErrorBoundary>
        <ThrowingChild shouldThrow={true} />
      </WidgetErrorBoundary>
    )
    expect(screen.getByText('Kunde inte ladda')).toBeInTheDocument()
    expect(screen.getByText('Försök igen om en stund')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Försök igen' })).toBeInTheDocument()
  })

  it('fallback has role=alert', () => {
    render(
      <WidgetErrorBoundary>
        <ThrowingChild shouldThrow={true} />
      </WidgetErrorBoundary>
    )
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('does not show widget title or icon in fallback (clean slate)', () => {
    render(
      <WidgetErrorBoundary>
        <ThrowingChild shouldThrow={true} />
      </WidgetErrorBoundary>
    )
    // Fallback uses generic AlertCircle + neutral text only
    expect(screen.queryByRole('heading', { level: 3, name: /Kunde inte ladda/i })).toBeInTheDocument()
    // No level-2 hub heading should bleed in
    expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument()
  })

  it('isolates failure: sibling components render normally', () => {
    render(
      <div>
        <WidgetErrorBoundary><ThrowingChild shouldThrow={true} /></WidgetErrorBoundary>
        <WidgetErrorBoundary><div>Sibling OK</div></WidgetErrorBoundary>
      </div>
    )
    expect(screen.getByText('Kunde inte ladda')).toBeInTheDocument()
    expect(screen.getByText('Sibling OK')).toBeInTheDocument()
  })
})
```

**File 6: `client/src/components/widgets/HubGrid.test.tsx`** (~80 lines)

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HubGrid } from './HubGrid'

describe('HubGrid', () => {
  it('renders root grid with 4-col + 2-col responsive classes', () => {
    const { container } = render(<HubGrid><div>x</div></HubGrid>)
    const grid = container.firstElementChild!
    expect(grid.className).toContain('grid')
    expect(grid.className).toContain('grid-cols-2')
    expect(grid.className).toContain('min-[900px]:grid-cols-4')
    expect(grid.className).toContain('auto-rows-[150px]')
    expect(grid.className).toContain('gap-[14px]')
  })

  it('Section renders aria-labeled section + h4 heading', () => {
    render(<HubGrid.Section title="Skapa & öva"><div>x</div></HubGrid.Section>)
    expect(screen.getByRole('region', { name: 'Skapa & öva' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 4, name: 'Skapa & öva' })).toBeInTheDocument()
  })

  it('Section heading has uppercase + letter-spacing classes', () => {
    render(<HubGrid.Section title="Test"><div>x</div></HubGrid.Section>)
    const h4 = screen.getByRole('heading', { level: 4 })
    expect(h4.className).toContain('uppercase')
    expect(h4.className).toContain('tracking-[0.06em]')
    expect(h4.className).toContain('text-[12px]')
    expect(h4.className).toContain('font-bold')
  })

  it('Slot applies correct grid span classes per size', () => {
    const { container, rerender } = render(<HubGrid.Slot size="S"><div>x</div></HubGrid.Slot>)
    expect(container.firstElementChild!.className).toContain('col-span-1')
    expect(container.firstElementChild!.className).toContain('row-span-1')

    rerender(<HubGrid.Slot size="M"><div>x</div></HubGrid.Slot>)
    expect(container.firstElementChild!.className).toContain('col-span-2')
    expect(container.firstElementChild!.className).toContain('row-span-1')

    rerender(<HubGrid.Slot size="L"><div>x</div></HubGrid.Slot>)
    expect(container.firstElementChild!.className).toContain('col-span-2')
    expect(container.firstElementChild!.className).toContain('row-span-2')

    rerender(<HubGrid.Slot size="XL"><div>x</div></HubGrid.Slot>)
    expect(container.firstElementChild!.className).toContain('col-span-2')
    expect(container.firstElementChild!.className).toContain('min-[900px]:col-span-4')
  })

  it('Slot wraps child in error boundary (sibling slot survives child throw)', () => {
    const Boom = () => { throw new Error('boom') }
    render(
      <HubGrid>
        <HubGrid.Slot size="S"><Boom /></HubGrid.Slot>
        <HubGrid.Slot size="S"><div>Survivor</div></HubGrid.Slot>
      </HubGrid>
    )
    expect(screen.getByText('Survivor')).toBeInTheDocument()
    expect(screen.getByText('Kunde inte ladda')).toBeInTheDocument()
  })
})
```
  </action>
  <verify>
    <automated>cd client && npm run test:run -- WidgetErrorBoundary.test HubGrid.test</automated>
  </verify>
  <acceptance_criteria>
    - File `client/src/components/widgets/WidgetErrorBoundary.tsx` exists
    - `grep -c "Kunde inte ladda" client/src/components/widgets/WidgetErrorBoundary.tsx` returns at least 1
    - `grep -c "Försök igen om en stund" client/src/components/widgets/WidgetErrorBoundary.tsx` returns 1
    - `grep -c "Försök igen" client/src/components/widgets/WidgetErrorBoundary.tsx` returns at least 2 (button label + body distinct)
    - `grep -c "AlertCircle" client/src/components/widgets/WidgetErrorBoundary.tsx` returns at least 1
    - `grep -c 'role="alert"' client/src/components/widgets/WidgetErrorBoundary.tsx` returns 1
    - File `client/src/components/widgets/HubGrid.tsx` exists
    - `grep -c "grid-cols-2" client/src/components/widgets/HubGrid.tsx` returns at least 1
    - `grep -c "min-\[900px\]:grid-cols-4" client/src/components/widgets/HubGrid.tsx` returns at least 1
    - `grep -c "auto-rows-\[150px\]" client/src/components/widgets/HubGrid.tsx` returns at least 1
    - `grep -c "gap-\[14px\]" client/src/components/widgets/HubGrid.tsx` returns at least 1
    - `grep -c "WidgetErrorBoundary" client/src/components/widgets/HubGrid.tsx` returns at least 1
    - `grep -c "Suspense" client/src/components/widgets/HubGrid.tsx` returns at least 1
    - File `client/src/components/widgets/registry.ts` exists
    - `grep -c "lazy(" client/src/components/widgets/registry.ts` returns 8 (one per Söka jobb widget)
    - `grep -c "WIDGET_REGISTRY" client/src/components/widgets/registry.ts` returns at least 1
    - `grep -E "^(\s)*(import|from)" client/src/components/widgets/registry.ts | grep -v "^import.*from 'react'" | grep -v "^import.*from './types'" | grep -v "^export type" | grep "Widget" | grep -v lazy | wc -l` returns 0 (no static widget imports outside lazy)
    - File `client/src/components/widgets/defaultLayouts.ts` exists
    - `grep -c "getDefaultLayout" client/src/components/widgets/defaultLayouts.ts` returns at least 1
    - `grep -c "getJobbSections" client/src/components/widgets/defaultLayouts.ts` returns at least 1
    - `cd client && npm run test:run -- WidgetErrorBoundary.test HubGrid.test` exits 0 with all tests passing
    - `cd client && npx tsc --noEmit` exits 0 (note: registry references not-yet-created widget files; lazy imports tolerate this at compile time but vite build will fail until 02-02/02-03 land — this is expected and verified later)
  </acceptance_criteria>
  <done>WidgetErrorBoundary catches throws and renders spec fallback isolated from siblings; HubGrid root + Section + Slot enforce CSS grid math, section heading semantics, and per-slot error boundary; registry uses lazy() exclusively for 8 widgets; defaultLayouts exports getDefaultLayout + getJobbSections; all tests pass; TypeScript clean.</done>
</task>

</tasks>

<verification>
- All 6 new files exist in client/src/components/widgets/ + 1 in client/src/hooks/
- `cd client && npm run test:run -- widgets useWidgetSize` passes
- `cd client && npx tsc --noEmit` exits 0
- WIDGET_REGISTRY uses lazy() for every widget (zero static widget imports in registry.ts beyond types)
- WidgetErrorBoundary renders the exact spec copy "Kunde inte ladda" / "Försök igen om en stund"
- HubGrid uses 2-col base and min-[900px]:grid-cols-4 breakpoint with auto-rows-[150px] and gap-[14px]
</verification>

<success_criteria>
1. Widget compound API ready for downstream widget implementations (Wave 2)
2. HubGrid container ready for hub wiring (Wave 3)
3. WidgetErrorBoundary proves error isolation works (WIDG-03 foundation)
4. Size toggle is keyboard-accessible per WIDG-02 spec (role=group, aria-pressed, aria-label)
5. Registry uses lazy() exclusively — no widget code in main bundle (WIDG-01 + Pitfall 14)
6. All unit tests pass; TypeScript clean
</success_criteria>

<output>
After completion, create `.planning/phases/02-static-widget-grid/02-01-widget-foundation-SUMMARY.md` documenting:
- Files created
- Widget compound API surface (Widget.Root, Widget.Header, Widget.Body, Widget.Footer signatures)
- WidgetContext shape (size, onSizeChange, allowedSizes, editMode)
- Test counts per file
- Decisions made (e.g., context-based prop passing for Header→Root, fallback card structure)
- Notes for Wave 2 widget authors: how to consume Widget.Header (icon + title), how to read size via useWidgetSize
</output>
