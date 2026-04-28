---
phase: 02-static-widget-grid
plan: "04"
type: execute
wave: 3
depends_on: ["01", "02", "03"]
files_modified:
  - client/src/pages/hubs/JobsokHub.tsx
  - client/src/pages/hubs/HubOverview.tsx
  - client/src/pages/hubs/KarriarHub.tsx
  - client/src/pages/hubs/ResurserHub.tsx
  - client/src/pages/hubs/MinVardagHub.tsx
  - client/src/pages/hubs/__tests__/JobsokHub.test.tsx
autonomous: true
requirements:
  - WIDG-01
  - WIDG-02
  - WIDG-03
must_haves:
  truths:
    - "JobsokHub renders 8 widgets grouped into 3 labeled sections (Skapa & öva, Sök & ansök, Marknad)"
    - "User can click S/M/L on any widget and the grid reflows immediately (state local to JobsokHub)"
    - "Size toggle is keyboard-operable: Tab into widget, Enter to activate button"
    - "All 8 widgets are loaded via lazy() — none appears in main vendor chunk after vite build"
    - "When one widget throws, the WidgetErrorBoundary fallback renders in its slot; the other 7 widgets remain functional"
    - "HubOverview, KarriarHub, ResurserHub, MinVardagHub each render at least 1 placeholder widget via HubGrid"
    - "Polite live-region announces 'Widgeten är nu [S/M/L]-storlek' on size change"
  artifacts:
    - path: "client/src/pages/hubs/JobsokHub.tsx"
      provides: "Söka jobb hub with full sectioned widget grid + size state + live-region announcer"
      min_lines: 80
    - path: "client/src/pages/hubs/HubOverview.tsx"
      provides: "Översikt hub with 1 placeholder widget"
    - path: "client/src/pages/hubs/KarriarHub.tsx"
      provides: "Karriär hub with 1 placeholder widget"
    - path: "client/src/pages/hubs/ResurserHub.tsx"
      provides: "Resurser hub with 1 placeholder widget"
    - path: "client/src/pages/hubs/MinVardagHub.tsx"
      provides: "Min Vardag hub with 1 placeholder widget"
    - path: "client/src/pages/hubs/__tests__/JobsokHub.test.tsx"
      provides: "Integration tests for sectioned layout, size toggle, error isolation"
      contains: "describe"
  key_links:
    - from: "JobsokHub"
      to: "WIDGET_REGISTRY + getJobbSections"
      via: "import { WIDGET_REGISTRY } from '@/components/widgets/registry'; import { getJobbSections } from '@/components/widgets/defaultLayouts'"
      pattern: "WIDGET_REGISTRY"
    - from: "JobsokHub"
      to: "HubGrid (Section + Slot)"
      via: "renders one HubGrid.Section per layout section, one HubGrid.Slot per widget"
      pattern: "HubGrid\\.Section"
    - from: "JobsokHub"
      to: "lazy widget components (CvWidget, etc.)"
      via: "registry.component is a LazyExoticComponent — JobsokHub renders <Component /> via React.createElement"
      pattern: "registry\\[.*\\]\\.component"
---

<objective>
Wire 8 widgets into JobsokHub using the sectioned HubGrid layout from defaultLayouts.getJobbSections() with hub-local size state. Stub the other 4 hubs with 1 placeholder widget each so navigation works visually. Add integration tests proving sectioned grid, size toggle, and error isolation.

Purpose: This is the deliverable phase — what users see. Without this plan, the foundation and widgets sit unused.
Output: 5 hub pages updated + 1 integration test file. Söka Jobb hub becomes the demo proof for WIDG-01..03.
</objective>

<execution_context>
@C:/Users/Mikael/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/Mikael/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/phases/02-static-widget-grid/02-UI-SPEC.md
@.planning/phases/02-static-widget-grid/02-01-widget-foundation-SUMMARY.md
@.planning/phases/02-static-widget-grid/02-02-widgets-cluster-a-SUMMARY.md
@.planning/phases/02-static-widget-grid/02-03-widgets-cluster-b-SUMMARY.md
@.planning/research/ARCHITECTURE.md
@client/src/pages/hubs/JobsokHub.tsx
@client/src/pages/hubs/HubOverview.tsx
@client/src/components/layout/PageLayout.tsx

<interfaces>
<!-- From plan 02-01 -->
From client/src/components/widgets/HubGrid.tsx:
```typescript
export const HubGrid: React.FC<{children, className?}> & {
  Section: React.FC<{ title: string; children: ReactNode }>
  Slot: React.FC<{ size: WidgetSize; children: ReactNode; fallback?: ReactNode }>
}
```

From client/src/components/widgets/registry.ts:
```typescript
export const WIDGET_REGISTRY: Record<WidgetId, {
  component: LazyExoticComponent<ComponentType<WidgetProps>>
  defaultSize: WidgetSize
  allowedSizes: WidgetSize[]
}>
export type WidgetId = keyof typeof WIDGET_REGISTRY
```

From client/src/components/widgets/defaultLayouts.ts:
```typescript
export function getDefaultLayout(hubId: HubId): WidgetLayoutItem[]
export function getJobbSections(): { title: string; items: WidgetLayoutItem[] }[]
// Returns 3 sections: 'Skapa & öva' (cv, cover-letter, interview),
//                    'Sök & ansök' (job-search, applications, spontaneous),
//                    'Marknad' (salary, international)
```

From client/src/components/widgets/types.ts:
```typescript
export interface WidgetLayoutItem { id: string; size: WidgetSize; order: number }
export type WidgetSize = 'S' | 'M' | 'L' | 'XL'
```

From Phase 1 (existing):
- client/src/pages/hubs/JobsokHub.tsx — uses PageLayout with domain="activity"
- All 5 hub pages exist as placeholder shells
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Wire JobsokHub with sectioned widget layout, hub-local size state, and aria-live announcer</name>
  <files>client/src/pages/hubs/JobsokHub.tsx</files>
  <read_first>
    - .planning/phases/02-static-widget-grid/02-UI-SPEC.md (sections "Hub Page Header Contract", "Section Heading Contract", "Accessibility Contract")
    - client/src/pages/hubs/JobsokHub.tsx (existing placeholder)
    - client/src/components/widgets/HubGrid.tsx (created in 02-01)
    - client/src/components/widgets/registry.ts (created in 02-01)
    - client/src/components/widgets/defaultLayouts.ts (created in 02-01)
    - client/src/components/widgets/types.ts
  </read_first>
  <action>
Replace the placeholder content in `client/src/pages/hubs/JobsokHub.tsx` with the full widget grid. Keep PageLayout wrapping with `domain="activity"`. Add:

1. Hub-local state for sizes: `const [sizes, setSizes] = useState<Record<string, WidgetSize>>(() => initial from getJobbSections())`
2. `handleSizeChange(widgetId, newSize)` that updates the map AND announces to live region
3. Live-region: `<div role="status" aria-live="polite" className="sr-only">{announcement}</div>` with state-managed message
4. Render `getJobbSections()` → for each section: `<HubGrid.Section title={section.title}>` containing `<HubGrid.Slot size={sizes[item.id]}>` per item
5. Inside each Slot: `const Component = WIDGET_REGISTRY[item.id].component; return <Component id={item.id} size={sizes[item.id]} onSizeChange={...} allowedSizes={WIDGET_REGISTRY[item.id].allowedSizes} editMode={false} />`

```typescript
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PageLayout } from '@/components/layout/PageLayout'
import { HubGrid } from '@/components/widgets/HubGrid'
import { WIDGET_REGISTRY, type WidgetId } from '@/components/widgets/registry'
import { getJobbSections } from '@/components/widgets/defaultLayouts'
import type { WidgetSize } from '@/components/widgets/types'

/**
 * Söka jobb hub — Phase 2 widget grid.
 * Mock data only; real data wiring lands in Phase 3 (HUB-01).
 * 8 widgets in 3 sections: Skapa & öva | Sök & ansök | Marknad.
 */
export default function JobsokHub() {
  const { t } = useTranslation()
  const sections = useMemo(() => getJobbSections(), [])

  // Initialize sizes from defaults
  const [sizes, setSizes] = useState<Record<string, WidgetSize>>(() => {
    const initial: Record<string, WidgetSize> = {}
    sections.forEach(section => {
      section.items.forEach(item => {
        initial[item.id] = item.size
      })
    })
    return initial
  })
  const [announcement, setAnnouncement] = useState('')

  const handleSizeChange = useCallback((widgetId: string, newSize: WidgetSize) => {
    setSizes(prev => ({ ...prev, [widgetId]: newSize }))
    setAnnouncement(`Widgeten är nu ${newSize}-storlek.`)
  }, [])

  return (
    <PageLayout
      title={t('nav.hubs.jobb', 'Söka jobb')}
      subtitle={t('hubs.jobb.subtitle', 'Hitta lediga tjänster, skapa ansökningsmaterial och håll koll på dina ansökningar')}
      domain="activity"
      showTabs={false}
    >
      {/* Live region for screen readers — single source per UI-SPEC accessibility contract */}
      <div role="status" aria-live="polite" className="sr-only">
        {announcement}
      </div>

      {sections.map(section => (
        <HubGrid.Section key={section.title} title={section.title}>
          {section.items.map(item => {
            const entry = WIDGET_REGISTRY[item.id as WidgetId]
            if (!entry) return null
            const Component = entry.component
            const currentSize = sizes[item.id] ?? entry.defaultSize
            return (
              <HubGrid.Slot key={item.id} size={currentSize}>
                <Component
                  id={item.id}
                  size={currentSize}
                  onSizeChange={(newSize) => handleSizeChange(item.id, newSize)}
                  allowedSizes={entry.allowedSizes}
                  editMode={false}
                />
              </HubGrid.Slot>
            )
          })}
        </HubGrid.Section>
      ))}
    </PageLayout>
  )
}
```

NOTE: HubGrid.Slot wraps each widget in WidgetErrorBoundary + Suspense (per plan 02-01). When `currentSize` updates, HubGrid.Slot's `SIZE_CLASSES[size]` reapplies, the grid reflows via CSS, and the inner `<Component size={currentSize} />` re-renders with the new size. No animation; CSS-grid native reflow.
  </action>
  <verify>
    <automated>cd client && npx tsc --noEmit</automated>
  </verify>
  <acceptance_criteria>
    - File `client/src/pages/hubs/JobsokHub.tsx` modified
    - `grep -c "export default function JobsokHub" client/src/pages/hubs/JobsokHub.tsx` returns 1
    - `grep -c "PageLayout" client/src/pages/hubs/JobsokHub.tsx` returns at least 1
    - `grep -c 'domain="activity"' client/src/pages/hubs/JobsokHub.tsx` returns 1
    - `grep -c "HubGrid" client/src/pages/hubs/JobsokHub.tsx` returns at least 2
    - `grep -c "WIDGET_REGISTRY" client/src/pages/hubs/JobsokHub.tsx` returns at least 1
    - `grep -c "getJobbSections" client/src/pages/hubs/JobsokHub.tsx` returns at least 1
    - `grep -c "useState" client/src/pages/hubs/JobsokHub.tsx` returns at least 1
    - `grep -c "onSizeChange" client/src/pages/hubs/JobsokHub.tsx` returns at least 1
    - `grep -c 'role="status"' client/src/pages/hubs/JobsokHub.tsx` returns 1
    - `grep -c 'aria-live="polite"' client/src/pages/hubs/JobsokHub.tsx` returns 1
    - `grep -c "Widgeten är nu" client/src/pages/hubs/JobsokHub.tsx` returns 1
    - JobsokHub.tsx no longer contains the placeholder string: `grep -c "Här kommer widgets" client/src/pages/hubs/JobsokHub.tsx` returns 0
    - `cd client && npx tsc --noEmit` exits 0
  </acceptance_criteria>
  <done>JobsokHub renders 8 widgets across 3 sections via HubGrid.Section + HubGrid.Slot; size state local to component; size change updates live region announcement; PageLayout still sets data-domain="activity" so widgets inherit activity tokens.</done>
</task>

<task type="auto">
  <name>Task 2: Stub other 4 hubs (HubOverview, KarriarHub, ResurserHub, MinVardagHub) with 1 placeholder widget each</name>
  <files>client/src/pages/hubs/HubOverview.tsx, client/src/pages/hubs/KarriarHub.tsx, client/src/pages/hubs/ResurserHub.tsx, client/src/pages/hubs/MinVardagHub.tsx</files>
  <read_first>
    - client/src/pages/hubs/HubOverview.tsx (existing placeholder)
    - client/src/pages/hubs/KarriarHub.tsx (existing placeholder)
    - client/src/pages/hubs/ResurserHub.tsx (existing placeholder)
    - client/src/pages/hubs/MinVardagHub.tsx (existing placeholder)
    - client/src/components/widgets/defaultLayouts.ts (created in 02-01) — provides 1-widget defaults for non-jobb hubs
    - client/src/components/widgets/registry.ts (created in 02-01)
  </read_first>
  <action>
For each of the 4 non-jobb hubs, replace the dashed-border placeholder with a minimal HubGrid rendering the single placeholder widget from getDefaultLayout(hubId). Pattern is identical for all 4 — only `domain` and `hubId` differ.

**File 1: `client/src/pages/hubs/HubOverview.tsx`**

```typescript
import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PageLayout } from '@/components/layout/PageLayout'
import { HubGrid } from '@/components/widgets/HubGrid'
import { WIDGET_REGISTRY, type WidgetId } from '@/components/widgets/registry'
import { getDefaultLayout } from '@/components/widgets/defaultLayouts'
import type { WidgetSize } from '@/components/widgets/types'

const HUB_ID = 'oversikt' as const

export default function HubOverview() {
  const { t } = useTranslation()
  const layout = getDefaultLayout(HUB_ID)
  const [sizes, setSizes] = useState<Record<string, WidgetSize>>(() =>
    Object.fromEntries(layout.map(item => [item.id, item.size]))
  )

  const handleSizeChange = useCallback((widgetId: string, newSize: WidgetSize) => {
    setSizes(prev => ({ ...prev, [widgetId]: newSize }))
  }, [])

  return (
    <PageLayout
      title={t('nav.hubs.oversikt', 'Översikt')}
      subtitle={t('hubs.oversikt.subtitle', 'Din översikt över alla hubbar')}
      domain="action"
      showTabs={false}
    >
      <HubGrid>
        {layout.map(item => {
          const entry = WIDGET_REGISTRY[item.id as WidgetId]
          if (!entry) return null
          const Component = entry.component
          const currentSize = sizes[item.id] ?? entry.defaultSize
          return (
            <HubGrid.Slot key={item.id} size={currentSize}>
              <Component
                id={item.id}
                size={currentSize}
                onSizeChange={(s) => handleSizeChange(item.id, s)}
                allowedSizes={entry.allowedSizes}
                editMode={false}
              />
            </HubGrid.Slot>
          )
        })}
      </HubGrid>
    </PageLayout>
  )
}
```

**File 2: `client/src/pages/hubs/KarriarHub.tsx`** — identical pattern, use `HUB_ID = 'karriar'`, `domain="coaching"`, `t('nav.hubs.karriar', 'Karriär')`, `t('hubs.karriar.subtitle', 'Utveckla din karriär — utforska intressen, sätt mål och bygg ditt varumärke')`.

**File 3: `client/src/pages/hubs/ResurserHub.tsx`** — identical, `HUB_ID = 'resurser'`, `domain="info"`, `t('nav.hubs.resurser', 'Resurser')`, `t('hubs.resurser.subtitle', 'Kunskapsbank, mallar och externa resurser för din jobbsökning')`.

**File 4: `client/src/pages/hubs/MinVardagHub.tsx`** — identical, `HUB_ID = 'min-vardag'`, `domain="wellbeing"`, `t('nav.hubs.min-vardag', 'Min vardag')`, `t('hubs.min-vardag.subtitle', 'Hälsa, dagbok, kalender — det som håller ihop din vardag')`.

Use the EXACT same body template — only the 4 string literals differ per file. Each file ends up ~50 lines.
  </action>
  <verify>
    <automated>cd client && npx tsc --noEmit</automated>
  </verify>
  <acceptance_criteria>
    - All 4 hub files modified
    - `grep -l "HubGrid" client/src/pages/hubs/HubOverview.tsx client/src/pages/hubs/KarriarHub.tsx client/src/pages/hubs/ResurserHub.tsx client/src/pages/hubs/MinVardagHub.tsx | wc -l` returns 4
    - `grep -l "WIDGET_REGISTRY" client/src/pages/hubs/HubOverview.tsx client/src/pages/hubs/KarriarHub.tsx client/src/pages/hubs/ResurserHub.tsx client/src/pages/hubs/MinVardagHub.tsx | wc -l` returns 4
    - `grep -c "Här kommer widgets" client/src/pages/hubs/HubOverview.tsx` returns 0 (placeholder removed)
    - `grep -c "Här kommer widgets" client/src/pages/hubs/KarriarHub.tsx` returns 0
    - `grep -c "Här kommer widgets" client/src/pages/hubs/ResurserHub.tsx` returns 0
    - `grep -c "Här kommer widgets" client/src/pages/hubs/MinVardagHub.tsx` returns 0
    - `grep -c 'domain="action"' client/src/pages/hubs/HubOverview.tsx` returns 1
    - `grep -c 'domain="coaching"' client/src/pages/hubs/KarriarHub.tsx` returns 1
    - `grep -c 'domain="info"' client/src/pages/hubs/ResurserHub.tsx` returns 1
    - `grep -c 'domain="wellbeing"' client/src/pages/hubs/MinVardagHub.tsx` returns 1
    - `cd client && npx tsc --noEmit` exits 0
  </acceptance_criteria>
  <done>4 non-jobb hubs render at least 1 widget through HubGrid; all preserve their domain via PageLayout; all use the same wiring pattern as JobsokHub for consistency; TypeScript clean.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 3: Integration tests for JobsokHub — sectioned grid renders, size toggle works, error isolation works</name>
  <files>client/src/pages/hubs/__tests__/JobsokHub.test.tsx</files>
  <read_first>
    - client/src/pages/hubs/JobsokHub.tsx (modified in Task 1)
    - client/src/components/widgets/registry.ts
    - client/src/components/widgets/defaultLayouts.ts
    - client/src/test/integration/nav-smoke.test.tsx (existing test for testing patterns — i18n, router setup)
  </read_first>
  <behavior>
    - JobsokHub renders 3 section headings ("Skapa & öva", "Sök & ansök", "Marknad")
    - JobsokHub renders all 8 widgets (one for each registry entry in the jobb default layout)
    - Each widget exposes role=group with aria-label="Välj widgetstorlek"
    - Clicking a size toggle button changes the rendered size class on that widget's slot
    - When one widget is replaced with a throwing component (via mock), the WidgetErrorBoundary fallback "Kunde inte ladda" appears for that slot only
  </behavior>
  <action>
Create `client/src/pages/hubs/__tests__/JobsokHub.test.tsx` (~150 lines).

Set up:
- MemoryRouter wrap (since widgets use Link)
- I18next test bypass — use the inline fallback strings (the t() default fallback works in tests without provider)
- Mock the lazy widget components inline using vi.mock for some specs
- Use waitFor + findByText for lazy-loaded widgets

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import JobsokHub from '../JobsokHub'

// Mock i18next so t() returns the fallback string
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, fallback?: string) => fallback ?? key }),
}))

function renderHub() {
  return render(
    <MemoryRouter initialEntries={['/jobb']}>
      <JobsokHub />
    </MemoryRouter>
  )
}

describe('JobsokHub integration', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('renders 3 sectioned headings (Skapa & öva, Sök & ansök, Marknad)', async () => {
    renderHub()
    expect(await screen.findByRole('heading', { level: 4, name: 'Skapa & öva' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 4, name: 'Sök & ansök' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 4, name: 'Marknad' })).toBeInTheDocument()
  })

  it('renders 3 sections via aria-label regions', async () => {
    renderHub()
    await screen.findByRole('region', { name: 'Skapa & öva' })
    expect(screen.getByRole('region', { name: 'Sök & ansök' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Marknad' })).toBeInTheDocument()
  })

  it('renders all 8 widgets (waits for lazy load)', async () => {
    renderHub()
    // After lazy load, every widget exposes its title in an h3
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 3, name: 'CV' })).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 3, name: 'Personligt brev' })).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 3, name: 'Intervjuträning' })).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 3, name: 'Sök jobb' })).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 3, name: 'Mina ansökningar' })).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 3, name: 'Spontanansökan' })).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 3, name: 'Lön & marknad' })).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 3, name: 'Internationellt' })).toBeInTheDocument()
    })
  })

  it('exposes a polite live region for size announcements', async () => {
    renderHub()
    await screen.findByRole('heading', { level: 4, name: 'Skapa & öva' })
    const liveRegion = document.querySelector('[role="status"][aria-live="polite"]')
    expect(liveRegion).toBeInTheDocument()
    expect(liveRegion).toHaveClass('sr-only')
  })

  it('size toggle group is present per widget with role=group', async () => {
    renderHub()
    await waitFor(() => expect(screen.getAllByRole('group', { name: 'Välj widgetstorlek' }).length).toBeGreaterThanOrEqual(8))
  })

  it('clicking M button on CV widget changes its aria-pressed state to true on M', async () => {
    renderHub()
    await screen.findByRole('heading', { level: 3, name: 'CV' })
    // Find all S/M/L buttons across widgets — pick the CV widget's group
    // CV widget defaults to L; click M on it
    const groups = screen.getAllByRole('group', { name: 'Välj widgetstorlek' })
    // CV is first widget in the layout — first group corresponds to CV
    const cvGroup = groups[0]
    const mBtn = cvGroup.querySelector('button[aria-label*="M"]') as HTMLButtonElement
    expect(mBtn).toBeTruthy()
    fireEvent.click(mBtn)
    await waitFor(() => expect(mBtn).toHaveAttribute('aria-pressed', 'true'))
  })

  it('size change updates the live region announcement to "Widgeten är nu M-storlek."', async () => {
    renderHub()
    await screen.findByRole('heading', { level: 3, name: 'CV' })
    const groups = screen.getAllByRole('group', { name: 'Välj widgetstorlek' })
    const mBtn = groups[0].querySelector('button[aria-label*="M"]') as HTMLButtonElement
    fireEvent.click(mBtn)
    await waitFor(() => {
      const liveRegion = document.querySelector('[role="status"][aria-live="polite"]')!
      expect(liveRegion.textContent).toBe('Widgeten är nu M-storlek.')
    })
  })

  it('renders the action-oriented empty-state copy on InternationalWidget', async () => {
    renderHub()
    expect(await screen.findByText('Arbetar du mot utlandsjobb?')).toBeInTheDocument()
  })

  it('renders the amber alert chip on ApplicationsWidget', async () => {
    renderHub()
    expect(await screen.findByText('1 ansökan väntar på ditt svar')).toBeInTheDocument()
  })
})

describe('JobsokHub error isolation (WIDG-03)', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('when CvWidget throws, the per-widget fallback shows and other widgets stay rendered', async () => {
    // Replace CvWidget with a throwing stub at module level
    vi.doMock('@/components/widgets/CvWidget', () => ({
      default: () => { throw new Error('cv simulated failure') },
    }))
    // Force re-import after mock applied
    const { default: JobsokHubReimported } = await import('../JobsokHub')

    render(
      <MemoryRouter initialEntries={['/jobb']}>
        <JobsokHubReimported />
      </MemoryRouter>
    )

    // Per-widget fallback appears
    await screen.findByText('Kunde inte ladda')
    // But other widgets still render — Cover Letter widget title should still appear
    await screen.findByRole('heading', { level: 3, name: 'Personligt brev' })
    // And the Sök jobb widget title
    expect(screen.getByRole('heading', { level: 3, name: 'Sök jobb' })).toBeInTheDocument()

    vi.doUnmock('@/components/widgets/CvWidget')
  })
})
```

NOTE on the error isolation test: Since dynamic vi.doMock + re-import for ESM is tricky, an acceptable alternative implementation (if the above proves flaky) is to write a separate small test file that imports a hand-crafted JobsokHub variant which substitutes one widget with a throwing component. The acceptance criterion below tolerates either approach.
  </action>
  <verify>
    <automated>cd client && npm run test:run -- JobsokHub.test</automated>
  </verify>
  <acceptance_criteria>
    - File `client/src/pages/hubs/__tests__/JobsokHub.test.tsx` exists
    - `grep -c "describe" client/src/pages/hubs/__tests__/JobsokHub.test.tsx` returns at least 2
    - `grep -c "Skapa & öva" client/src/pages/hubs/__tests__/JobsokHub.test.tsx` returns at least 1
    - `grep -c "Sök & ansök" client/src/pages/hubs/__tests__/JobsokHub.test.tsx` returns at least 1
    - `grep -c "Marknad" client/src/pages/hubs/__tests__/JobsokHub.test.tsx` returns at least 1
    - `grep -c "Kunde inte ladda" client/src/pages/hubs/__tests__/JobsokHub.test.tsx` returns at least 1
    - `grep -c "aria-pressed" client/src/pages/hubs/__tests__/JobsokHub.test.tsx` returns at least 1
    - `grep -c "Widgeten är nu" client/src/pages/hubs/__tests__/JobsokHub.test.tsx` returns at least 1
    - `cd client && npm run test:run -- JobsokHub.test` exits 0 with all primary tests passing (error-isolation test may be skipped if dynamic remock proves environmentally flaky — gating on the other tests)
  </acceptance_criteria>
  <done>JobsokHub integration tests verify sectioned layout (3 regions), all 8 widgets render, size toggle changes aria-pressed and announces to live region, error isolation works (sibling widgets survive a throw).</done>
</task>

</tasks>

<verification>
- All 5 hub files updated; 1 test file created
- `cd client && npm run test:run -- JobsokHub.test` exits 0
- `cd client && npm run test:run` (full suite) exits 0
- `cd client && npx tsc --noEmit` exits 0
- `cd client && npm run build` succeeds (this is the first time the lazy() registry imports get resolved by vite — bundle output is verified in plan 02-05)
</verification>

<success_criteria>
1. JobsokHub renders 8 widgets in 3 labeled sections — proves WIDG-01
2. User can resize any widget via S/M/L; aria-pressed updates and live region announces — proves WIDG-02
3. WidgetErrorBoundary in HubGrid.Slot isolates failures — proves WIDG-03 (test confirms)
4. Other 4 hubs render via the same HubGrid pattern (consistency for Phase 5)
5. All hub pages still set their domain correctly via PageLayout
6. `vite build` succeeds for the first time with all lazy imports resolved
</success_criteria>

<output>
After completion, create `.planning/phases/02-static-widget-grid/02-04-hub-wiring-SUMMARY.md` documenting:
- 5 hub files updated
- JobsokHub final structure (3 sections, 8 widgets, size state)
- Other 4 hubs use the same HubGrid pattern with placeholder layouts
- Test count for JobsokHub.test
- Confirmation `vite build` succeeds (or list of failures for plan 02-05 to address)
</output>
