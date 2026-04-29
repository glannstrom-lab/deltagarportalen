---
phase: 05-full-hub-coverage-oversikt
plan: 05
type: execute
wave: 5
depends_on: [05-04-min-vardag-hub-PLAN]
files_modified:
  - client/src/hooks/useOversiktHubSummary.ts
  - client/src/hooks/useOversiktHubSummary.test.ts
  - client/src/hooks/useOnboardedHubsTracking.ts
  - client/src/hooks/useOnboardedHubsTracking.test.ts
  - client/src/components/widgets/OversiktDataContext.tsx
  - client/src/components/widgets/OversiktLayoutContext.tsx
  - client/src/components/widgets/OnboardingWidget.tsx
  - client/src/components/widgets/OnboardingWidget.test.tsx
  - client/src/components/widgets/JobsokSummaryWidget.tsx
  - client/src/components/widgets/JobsokSummaryWidget.test.tsx
  - client/src/components/widgets/CvStatusSummaryWidget.tsx
  - client/src/components/widgets/CvStatusSummaryWidget.test.tsx
  - client/src/components/widgets/InterviewSummaryWidget.tsx
  - client/src/components/widgets/InterviewSummaryWidget.test.tsx
  - client/src/components/widgets/CareerGoalSummaryWidget.tsx
  - client/src/components/widgets/CareerGoalSummaryWidget.test.tsx
  - client/src/components/widgets/HealthSummaryWidget.tsx
  - client/src/components/widgets/HealthSummaryWidget.test.tsx
  - client/src/components/widgets/DiarySummaryWidget.tsx
  - client/src/components/widgets/DiarySummaryWidget.test.tsx
  - client/src/components/widgets/registry.ts
  - client/src/components/widgets/widgetLabels.ts
  - client/src/components/widgets/defaultLayouts.ts
  - client/src/components/widgets/HubGrid.tsx
  - client/src/components/widgets/HubGrid.test.tsx
  - client/src/components/widgets/__tests__/anti-shaming.test.tsx
  - client/src/pages/hubs/HubOverview.tsx
  - client/src/pages/hubs/__tests__/HubOverview.test.tsx
  - client/src/pages/hubs/JobsokHub.tsx
  - client/src/pages/hubs/KarriarHub.tsx
  - client/src/pages/hubs/ResurserHub.tsx
  - client/src/pages/hubs/MinVardagHub.tsx
  - client/src/pages/hubs/__tests__/JobsokHub.test.tsx
  - client/src/pages/hubs/__tests__/KarriarHub.test.tsx
  - client/src/pages/hubs/__tests__/ResurserHub.test.tsx
  - client/src/pages/hubs/__tests__/MinVardagHub.test.tsx
autonomous: true
requirements: [HUB-05]
must_haves:
  truths:
    - "useOversiktHubSummary triggers parallel useQuery for all 4 other hub-loaders (useJobsokHubSummary, useKarriarHubSummary, useResurserHubSummary, useMinVardagHubSummary) — React Query deduplicates if cached. Cross-hub-widgets read getQueryData from those keys (no own SELECTs — Pitfall D resolved)"
    - "OnboardingWidget at XL size renders 'Välkommen' CTA-banner when profiles.onboarded_hubs is empty/null; renders 'Bra jobbat {firstName}' when it has hubs"
    - "useOnboardedHubsTracking('{hubId}') appends hub_id to profiles.onboarded_hubs on first mount per session — invoked from each of the 5 hub pages"
    - "HubOverview.tsx renders 1 XL onboarding + 6 cross-hub summary widgets inside OversiktLayoutProvider OUTER → OversiktDataProvider INNER"
    - "HubGrid supports XL size (col-span-4 on desktop, full-width on mobile) per Phase 2 UI-SPEC"
    - "All 7 Översikt widgets are lazy() in WIDGET_REGISTRY"
    - "Anti-shaming guard extended: no Översikt summary widget renders raw \\d+% in primary KPI"
    - "Layout persistence works on Översikt — hide/show works for the 6 summary widgets (CUST-01..03 reused)"
    - "HealthSummaryWidget imports streakDays from `@/utils/streakDays` (NOT from HealthWidget.tsx) — single source of truth established in Plan 04"
  artifacts:
    - path: "client/src/hooks/useOversiktHubSummary.ts"
      provides: "Cross-hub aggregator — runs all 4 hub loaders in parallel and reads cache"
      exports: ["useOversiktHubSummary", "OVERSIKT_HUB_KEY"]
    - path: "client/src/hooks/useOnboardedHubsTracking.ts"
      provides: "Hook that appends hub_id to profiles.onboarded_hubs on first mount"
      exports: ["useOnboardedHubsTracking"]
    - path: "client/src/components/widgets/OnboardingWidget.tsx"
      provides: "XL onboarding banner — first widget on Översikt"
      exports: ["default"]
    - path: "client/src/pages/hubs/HubOverview.tsx"
      provides: "Hub page replacing Phase 2 stub"
      contains: "OversiktLayoutProvider"
    - path: "client/src/components/widgets/HubGrid.tsx"
      provides: "Extended Slot supporting XL size"
      contains: "size === 'XL'"
    - path: "client/src/components/widgets/HubGrid.test.tsx"
      provides: "HubGrid unit tests — XL size assertion added"
      contains: "col-span-4"
  key_links:
    - from: "client/src/hooks/useOversiktHubSummary.ts"
      to: "useJobsokHubSummary, useKarriarHubSummary, useResurserHubSummary, useMinVardagHubSummary"
      via: "imports + invokes inside the hook to leverage React Query dedup (Pitfall D)"
      pattern: "useJobsokHubSummary\\(\\)"
    - from: "client/src/components/widgets/JobsokSummaryWidget.tsx (and 5 siblings)"
      to: "queryClient.getQueryData(JOBSOK_HUB_KEY|KARRIAR_HUB_KEY|...)"
      via: "useQueryClient + getQueryData — NO new SELECTs"
      pattern: "getQueryData\\("
    - from: "client/src/pages/hubs/JobsokHub.tsx (and 4 siblings)"
      to: "useOnboardedHubsTracking(HUB_ID)"
      via: "called from hub mount effect"
      pattern: "useOnboardedHubsTracking\\("
    - from: "client/src/components/widgets/HealthSummaryWidget.tsx"
      to: "client/src/utils/streakDays.ts"
      via: "imports streakDays helper from utils (Plan 04 single source)"
      pattern: "from\\s+'@/utils/streakDays'"
---

<objective>
Wire the Översikt hub: a 1 XL onboarding widget that detects new vs. returning users via `profiles.onboarded_hubs`, plus 6 cross-hub summary widgets that read from React-Query caches populated by the other 4 hub-loaders (NO additional Supabase queries — Pitfall D resolved). Add a `useOnboardedHubsTracking` hook that all 5 hub pages call to record hub visits. Extend HubGrid with XL size support per UI-SPEC.

Purpose: Översikt is the user's launchpad — the most-visited page after login. New users get an actionable onboarding banner; returning users get a dense cross-hub status snapshot. By reading from cache (instead of making own queries), Översikt is instant when other hubs have been visited and triggers prefetching when fresh.

Output: One aggregator hook, one onboarding-tracking hook, two contexts, 1 XL widget + 6 summary widgets, registry/labels/defaultLayouts extensions, HubGrid XL slot, fully-wired HubOverview page, integration test suite. All 5 hub pages updated to call useOnboardedHubsTracking. Tests green, zero TS errors, zero new npm dependencies.
</objective>

<execution_context>
@C:/Users/Mikael/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/Mikael/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@CLAUDE.md
@.planning/STATE.md
@.planning/REQUIREMENTS.md
@.planning/phases/05-full-hub-coverage-oversikt/05-CONTEXT.md
@.planning/phases/05-full-hub-coverage-oversikt/05-RESEARCH.md
@.planning/phases/05-full-hub-coverage-oversikt/05-VALIDATION.md
@.planning/phases/05-full-hub-coverage-oversikt/05-DB-DISCOVERY.md
@.planning/phases/05-full-hub-coverage-oversikt/05-02-karriar-hub-SUMMARY.md
@.planning/phases/05-full-hub-coverage-oversikt/05-03-resurser-hub-SUMMARY.md
@.planning/phases/05-full-hub-coverage-oversikt/05-04-min-vardag-hub-SUMMARY.md
@.planning/phases/02-static-widget-grid/02-UI-SPEC.md
@client/src/hooks/useJobsokHubSummary.ts
@client/src/hooks/useKarriarHubSummary.ts
@client/src/hooks/useResurserHubSummary.ts
@client/src/hooks/useMinVardagHubSummary.ts
@client/src/components/widgets/JobsokDataContext.tsx
@client/src/components/widgets/KarriarDataContext.tsx
@client/src/components/widgets/ResurserDataContext.tsx
@client/src/components/widgets/MinVardagDataContext.tsx
@client/src/components/widgets/registry.ts
@client/src/components/widgets/widgetLabels.ts
@client/src/components/widgets/defaultLayouts.ts
@client/src/components/widgets/HubGrid.tsx
@client/src/components/widgets/HubGrid.test.tsx
@client/src/components/widgets/Widget.tsx
@client/src/components/widgets/types.ts
@client/src/utils/streakDays.ts
@client/src/pages/hubs/JobsokHub.tsx
@client/src/pages/hubs/KarriarHub.tsx
@client/src/pages/hubs/ResurserHub.tsx
@client/src/pages/hubs/MinVardagHub.tsx
@client/src/pages/hubs/HubOverview.tsx
@client/src/hooks/useSupabase.ts

<interfaces>
<!-- Översikt has a unique architecture: it does NOT issue its own data SELECTs. -->
<!-- It TRIGGERS the 4 other hub loaders (which dedup via React Query if already cached) -->
<!-- and exposes their cached data through OversiktDataContext. -->

<!-- OversiktSummary shape — references the 4 other summaries: -->
```typescript
// client/src/components/widgets/OversiktDataContext.tsx
import type { JobsokSummary } from './JobsokDataContext'
import type { KarriarSummary } from './KarriarDataContext'
import type { ResurserSummary } from './ResurserDataContext'
import type { MinVardagSummary } from './MinVardagDataContext'

export interface OversiktSummary {
  profile: { onboarded_hubs: string[]; full_name: string | null } | null
  jobsok: JobsokSummary | undefined
  karriar: KarriarSummary | undefined
  resurser: ResurserSummary | undefined
  minVardag: MinVardagSummary | undefined
  // Per Pitfall D: any of these can be undefined if the user has never visited that hub.
  // Cross-hub widgets must handle undefined gracefully (render an "info-loading" or terse empty state).
}
```

<!-- useOversiktHubSummary aggregator — Pitfall D solution: trigger all 4 loaders in parallel: -->
```typescript
// client/src/hooks/useOversiktHubSummary.ts
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useSupabase'
import { supabase } from '@/lib/supabase'
import { useJobsokHubSummary } from './useJobsokHubSummary'
import { useKarriarHubSummary } from './useKarriarHubSummary'
import { useResurserHubSummary } from './useResurserHubSummary'
import { useMinVardagHubSummary } from './useMinVardagHubSummary'
import type { OversiktSummary } from '@/components/widgets/OversiktDataContext'

export const OVERSIKT_HUB_KEY = (userId: string) => ['hub', 'oversikt', userId] as const

export function useOversiktHubSummary(): { data: OversiktSummary | undefined, isLoading: boolean } {
  const { user } = useAuth()
  const userId = user?.id ?? ''

  // Profile fetch (own — only Översikt-specific data)
  const profileQ = useQuery({
    queryKey: OVERSIKT_HUB_KEY(userId),
    enabled: !!userId,
    staleTime: 60_000,
    queryFn: async () => {
      const r = await supabase.from('profiles')
        .select('onboarded_hubs, full_name')
        .eq('id', userId)
        .maybeSingle()
      return {
        onboarded_hubs: r.data?.onboarded_hubs ?? [],
        full_name: r.data?.full_name ?? null,
      }
    },
  })

  // Trigger the 4 other hub loaders in parallel — React Query DEDUPLICATES.
  // If user already visited those hubs, cache is hit; otherwise fresh fetch.
  const jobsokQ = useJobsokHubSummary()
  const karriarQ = useKarriarHubSummary()
  const resurserQ = useResurserHubSummary()
  const minVardagQ = useMinVardagHubSummary()

  const isLoading = profileQ.isLoading || jobsokQ.isLoading || karriarQ.isLoading
                    || resurserQ.isLoading || minVardagQ.isLoading

  const data: OversiktSummary | undefined = profileQ.data
    ? {
        profile: profileQ.data,
        jobsok: jobsokQ.data,
        karriar: karriarQ.data,
        resurser: resurserQ.data,
        minVardag: minVardagQ.data,
      }
    : undefined

  return { data, isLoading }
}
```

<!-- useOnboardedHubsTracking — appends hub_id to profiles.onboarded_hubs on first mount: -->
```typescript
// client/src/hooks/useOnboardedHubsTracking.ts
import { useEffect, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from './useSupabase'
import { supabase } from '@/lib/supabase'
import type { HubId } from '@/components/layout/navigation'
import { OVERSIKT_HUB_KEY } from './useOversiktHubSummary'

export function useOnboardedHubsTracking(hubId: HubId) {
  const { user } = useAuth()
  const userId = user?.id ?? ''
  const queryClient = useQueryClient()
  const hasRunRef = useRef(false)

  const mutation = useMutation({
    mutationFn: async () => {
      // Read current array from cache or fetch
      const cached = queryClient.getQueryData(OVERSIKT_HUB_KEY(userId)) as
        { onboarded_hubs: string[] } | undefined
      const current = cached?.onboarded_hubs ?? []
      if (current.includes(hubId)) return current  // already tracked
      const next = [...current, hubId]
      // Postgres array append — additive, idempotent at app level
      const r = await supabase.from('profiles')
        .update({ onboarded_hubs: next })
        .eq('id', userId)
      if (r.error) throw r.error
      return next
    },
    onSuccess: (next) => {
      queryClient.setQueryData(OVERSIKT_HUB_KEY(userId), (old: any) => ({
        ...(old ?? {}),
        onboarded_hubs: next,
      }))
    },
  })

  useEffect(() => {
    if (!userId || hasRunRef.current) return
    hasRunRef.current = true
    mutation.mutate()
  }, [userId, hubId])  // mutation excluded — it's stable from useMutation
}
```

<!-- Cross-hub widget pattern — example for JobsokSummaryWidget: -->
```typescript
// client/src/components/widgets/JobsokSummaryWidget.tsx
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useSupabase'
import { JOBSOK_HUB_KEY } from '@/hooks/useJobsokHubSummary'
import type { JobsokSummary } from './JobsokDataContext'
import type { WidgetProps } from './types'
import { Widget } from './Widget'

export default function JobsokSummaryWidget({ id, size, allowedSizes, onSizeChange, editMode, onHide }: WidgetProps) {
  const { user } = useAuth()
  const userId = user?.id ?? ''
  const queryClient = useQueryClient()
  const data = queryClient.getQueryData(JOBSOK_HUB_KEY(userId)) as JobsokSummary | undefined

  const totalApps = data?.applicationStats?.total ?? 0

  return (
    <Widget id={id} size={size} allowedSizes={allowedSizes} onSizeChange={onSizeChange} editMode={editMode} onHide={onHide}>
      <Widget.Header icon={Briefcase} title="Söka jobb" />
      <Widget.Body>
        {totalApps === 0 ? (
          <p className="text-[14px]">Inga ansökningar än — börja söka idag</p>
        ) : (
          <p className="text-[22px] font-bold">{totalApps} aktiva ansökningar</p>
        )}
      </Widget.Body>
      <Widget.Footer>
        <Link to="/soka-jobb" className="text-[12px] font-bold text-[var(--c-text)]">
          Öppna Söka jobb →
        </Link>
      </Widget.Footer>
    </Widget>
  )
}
```

<!-- Cross-hub widget set (6 widgets — Claude's discretion per CONTEXT.md, locked here): -->
| ID | Reads from | Primary slot |
|----|------------|--------------|
| `jobsok-summary` | JOBSOK_HUB_KEY → applicationStats.total | "{n} aktiva ansökningar" |
| `cv-status-summary` | JOBSOK_HUB_KEY → cv | "CV uppdaterat {date}" or "Inget CV" |
| `interview-summary` | JOBSOK_HUB_KEY → interviewSessions[0].score | qualitative label "Stark prestation" / "Bra framsteg" / "Övning behövs" |
| `karriar-mal-summary` | KARRIAR_HUB_KEY → careerGoals.shortTerm | shortTerm trunkated |
| `halsa-summary` | MIN_VARDAG_HUB_KEY → recentMoodLogs | "Loggat {streak} dagar" or "Logga ditt mående" |
| `dagbok-summary` | MIN_VARDAG_HUB_KEY → diaryEntryCount | "{count} inlägg" |

<!-- Default layout for oversikt (1 XL + 6 summary, REPLACES placeholder): -->
```typescript
oversikt: [
  { id: 'onboarding-xl',       size: 'XL', order: 0, visible: true },
  { id: 'jobsok-summary',      size: 'M',  order: 1, visible: true },
  { id: 'cv-status-summary',   size: 'S',  order: 2, visible: true },
  { id: 'interview-summary',   size: 'S',  order: 3, visible: true },
  { id: 'karriar-mal-summary', size: 'M',  order: 4, visible: true },
  { id: 'halsa-summary',       size: 'M',  order: 5, visible: true },
  { id: 'dagbok-summary',      size: 'S',  order: 6, visible: true },
],
```

<!-- Sections (2 sections): -->
```typescript
export function getOversiktSections(): SectionedLayout[] {
  const all = getDefaultLayout('oversikt')
  return [
    { title: 'Idag',         items: all.slice(0, 1) },  // Onboarding XL only
    { title: 'Aktivitet',    items: all.slice(1, 7) },  // 6 summary widgets
  ]
}
```

<!-- Registry additions (lazy()): -->
```typescript
'onboarding-xl':       { component: lazy(() => import('./OnboardingWidget')),         defaultSize: 'XL', allowedSizes: ['XL'] },
'jobsok-summary':      { component: lazy(() => import('./JobsokSummaryWidget')),      defaultSize: 'M',  allowedSizes: ['S', 'M'] },
'cv-status-summary':   { component: lazy(() => import('./CvStatusSummaryWidget')),    defaultSize: 'S',  allowedSizes: ['S', 'M'] },
'interview-summary':   { component: lazy(() => import('./InterviewSummaryWidget')),   defaultSize: 'S',  allowedSizes: ['S', 'M'] },
'karriar-mal-summary': { component: lazy(() => import('./CareerGoalSummaryWidget')),  defaultSize: 'M',  allowedSizes: ['S', 'M'] },
'halsa-summary':       { component: lazy(() => import('./HealthSummaryWidget')),      defaultSize: 'M',  allowedSizes: ['S', 'M'] },
'dagbok-summary':      { component: lazy(() => import('./DiarySummaryWidget')),       defaultSize: 'S',  allowedSizes: ['S', 'M'] },
```

<!-- Label additions: -->
```
'onboarding-xl':       'Välkommen',
'jobsok-summary':      'Söka jobb-status',
'cv-status-summary':   'CV-status',
'interview-summary':   'Intervju-status',
'karriar-mal-summary': 'Karriärmål-status',
'halsa-summary':       'Hälsa-status',
'dagbok-summary':      'Dagbok-status',
```

<!-- HubGrid XL extension (per Phase 2 UI-SPEC §"Widget Size Specifications" — XL is `col-span-4 row-span-1` desktop, `col-span-2` mobile): -->
<!-- See HubGrid.tsx — find the size→class mapping. Likely a switch/object. Add 'XL' case: -->
```typescript
// CURRENT (likely):
const sizeClass = {
  S: 'col-span-1 row-span-1',
  M: 'col-span-2 row-span-1',
  L: 'col-span-2 row-span-2',
}[size]
// EXTEND:
const sizeClass = {
  S:  'col-span-1 row-span-1',
  M:  'col-span-2 row-span-1',
  L:  'col-span-2 row-span-2',
  XL: 'col-span-4 row-span-1',
}[size]
// Mobile override (max-width: 900px) — XL becomes col-span-2 (full width in 2-col grid).
// If HubGrid uses Tailwind responsive classes, ensure XL has `max-md:col-span-2` or similar.
```

<!-- OnboardingWidget detection logic: -->
```typescript
// const onboardedHubs = profile?.onboarded_hubs ?? []
// const isNewUser = onboardedHubs.length === 0
// if isNewUser:
//   heading: "Välkommen till din portal"
//   body: "Utforska dina hubbar och kom igång med din jobbsökning"
//   CTAs: 4 quick-links: "Söka jobb →" "Karriär →" "Resurser →" "Min Vardag →"
// else:
//   heading: "Bra jobbat {firstName}!"  (firstName from profile.full_name?.split(' ')[0] ?? 'där')
//   body: deterministic next-step suggestion based on what cross-hub data shows least activity
//          e.g. if jobsok.applicationStats.total === 0 → "Du har inte sökt något jobb än. Vill du börja idag?"
//          else if minVardag.diaryEntryCount === 0 → "Reflektera över din vecka i dagboken"
//          else → generic "Fortsätt med dina mål"
//   CTA: contextual link to the hub the suggestion points at
```

<!-- HubOverview wiring follows Plans 02-04 pattern with one exception: -->
<!-- Sections array uses getOversiktSections() — section 1 is "Idag" (1 XL widget), section 2 is "Aktivitet" (6 summary). -->
<!-- Domain: 'action' (green per UI-SPEC color mapping). Title: 'Översikt'. -->

<!-- Hub-mount tracking — each of the 5 hub pages calls useOnboardedHubsTracking(HUB_ID) at top of component body: -->
<!-- This means JobsokHub.tsx, KarriarHub.tsx, ResurserHub.tsx, MinVardagHub.tsx, HubOverview.tsx each get one new line: -->
<!--   useOnboardedHubsTracking(HUB_ID) -->
<!-- For JobsokHub.tsx specifically — it currently uses HUB_ID inline ('jobb'). Make sure const HUB_ID = 'jobb' as const exists at top, then call useOnboardedHubsTracking(HUB_ID). -->

<!-- streakDays — single source of truth at client/src/utils/streakDays.ts (created in Plan 04 Task 2). -->
<!-- HealthSummaryWidget MUST import from `@/utils/streakDays` — NOT from HealthWidget.tsx. -->

<!-- Anti-shaming extension: 6 cross-hub summary widgets must NOT render raw \\d+% in 32/22px font-bold. -->
<!-- The OnboardingWidget is XL — anti-shaming rule still applies (no raw % anywhere primary). -->
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Hub plumbing — useOversiktHubSummary aggregator + useOnboardedHubsTracking + OversiktDataContext + OversiktLayoutContext + registry/labels/defaultLayouts/HubGrid extensions (incl. HubGrid.test.tsx XL test)</name>
  <read_first>
    - client/src/hooks/useMinVardagHubSummary.ts (loader template)
    - client/src/hooks/useJobsokHubSummary.ts, useKarriarHubSummary.ts, useResurserHubSummary.ts (verify exported KEY constants)
    - client/src/components/widgets/MinVardagDataContext.tsx (context template)
    - client/src/components/widgets/MinVardagLayoutContext.tsx (layout context template)
    - client/src/components/widgets/HubGrid.tsx (extend with XL size — find the size→class map)
    - client/src/components/widgets/HubGrid.test.tsx (CONFIRMED EXISTS — extend with XL test case; do not create from scratch)
    - .planning/phases/05-full-hub-coverage-oversikt/05-RESEARCH.md §"Cross-hub summary-widgets" + §"Pitfall D"
    - .planning/phases/02-static-widget-grid/02-UI-SPEC.md §"Widget Size Specifications" (XL spec: col-span-4 row-span-1 desktop)
  </read_first>
  <behavior>
    - Test 1: useOversiktHubSummary fires the profile select AND triggers all 4 sub-hub-loader hooks (verify all 4 fromMock are called for the underlying tables)
    - Test 2: When other hubs' caches are populated, summary.jobsok / .karriar / .resurser / .minVardag are present (test by pre-seeding QueryClient)
    - Test 3: useOnboardedHubsTracking('jobb') updates profiles.onboarded_hubs to ['jobb'] on first mount; second invocation no-op (uses ref guard)
    - Test 4: useOnboardedHubsTracking is no-op when userId is empty
    - Test 5: HubGrid.Slot with size='XL' renders col-span-4 row-span-1 class on desktop (test added/extended in HubGrid.test.tsx — file exists, this task ADDS one new `it()` block)
  </behavior>
  <files>client/src/hooks/useOversiktHubSummary.ts, client/src/hooks/useOversiktHubSummary.test.ts, client/src/hooks/useOnboardedHubsTracking.ts, client/src/hooks/useOnboardedHubsTracking.test.ts, client/src/components/widgets/OversiktDataContext.tsx, client/src/components/widgets/OversiktLayoutContext.tsx, client/src/components/widgets/registry.ts, client/src/components/widgets/widgetLabels.ts, client/src/components/widgets/defaultLayouts.ts, client/src/components/widgets/HubGrid.tsx, client/src/components/widgets/HubGrid.test.tsx</files>
  <action>
    Build all the plumbing first.

    **A. `OversiktDataContext.tsx`** — copy MinVardagDataContext.tsx, replace summary type with `OversiktSummary` (interface from <interfaces>).

    **B. `OversiktLayoutContext.tsx`** — verbatim copy of MinVardagLayoutContext.tsx, rename Min Vardag → Oversikt.

    **C. `useOversiktHubSummary.ts`** — implement per <interfaces>. The aggregator triggers 4 sub-hooks + own profile fetch. Returns `{ data: OversiktSummary | undefined, isLoading: boolean }`.

    **D. `useOversiktHubSummary.test.ts`** — copy a hub-loader test as base. Mock all 4 child hooks (NOT the underlying supabase — use vi.mock):
    ```typescript
    vi.mock('./useJobsokHubSummary', () => ({
      useJobsokHubSummary: () => ({ data: { applicationStats: { total: 5 } }, isLoading: false }),
      JOBSOK_HUB_KEY: (id: string) => ['hub', 'jobsok', id],
    }))
    // similar for the 3 other hub loaders
    ```
    Then mock supabase only for the profiles select. Tests 1-2 from <behavior>.

    **E. `useOnboardedHubsTracking.ts`** — implement per <interfaces>. Use useRef to ensure single fire per hook instance. Use useMutation for the update call. Read current array from OVERSIKT_HUB_KEY cache; if hub_id already in array, no-op.

    **F. `useOnboardedHubsTracking.test.ts`** — render the hook with renderHook + QueryClientProvider. Pre-seed cache with `{ onboarded_hubs: [] }`. Mock supabase update. Assert mutation runs once on mount and updates cache to `['jobb']`. Test 3-4 from <behavior>.

    **G. `HubGrid.tsx`** — extend. Find the existing size mapping (likely a `getSizeClasses` function or inline switch). Add 'XL' case: `col-span-4 row-span-1` (desktop). Mobile override: 'XL' becomes `col-span-2 row-span-1` (full width in 2-col grid). If HubGrid uses Tailwind classes with media queries (e.g. `max-md:col-span-2`), follow same pattern.

    **G2. `HubGrid.test.tsx` (DETERMINISTIC — file already exists at client/src/components/widgets/HubGrid.test.tsx, confirmed via Glob).**
    EXTEND (do not overwrite) the existing HubGrid.test.tsx with one new `it('renders XL size with col-span-4 row-span-1', ...)` block. Pattern:
    ```typescript
    it('renders XL size with col-span-4 row-span-1 on desktop', () => {
      const { container } = render(<HubGrid.Slot id="x" size="XL" allowedSizes={['XL']}><div /></HubGrid.Slot>)
      const slot = container.firstChild as HTMLElement
      expect(slot.className).toMatch(/col-span-4/)
      expect(slot.className).toMatch(/row-span-1/)
    })
    ```
    Use whichever render-style the existing tests use (renderHook vs render — look at the file before writing). The new test must run as part of the existing describe block.

    **H. `defaultLayouts.ts`** — REPLACE `oversikt:` placeholder with the 7-widget array (1 XL + 6 summary). APPEND `getOversiktSections()`.

    **I. `registry.ts`** — APPEND 7 lazy entries.

    **J. `widgetLabels.ts`** — EXTEND with 7 new labels. Now exhaustive across 32 widget IDs (8 + 6 + 6 + 5 + 7).

    Verification: `npx tsc --noEmit` zero, all three test files green.
  </action>
  <verify>
    <automated>cd client && npx tsc --noEmit 2>&1 | tail -3 && npm run test:run -- src/hooks/useOversiktHubSummary.test.ts src/hooks/useOnboardedHubsTracking.test.ts src/components/widgets/HubGrid.test.tsx --reporter=dot 2>&1 | tail -5</automated>
  </verify>
  <done>
    - All 11 listed files exist (HubGrid.test.tsx already existed pre-task; this task added one new it() block to it)
    - HubGrid supports XL size (verified via the new test in HubGrid.test.tsx — `grep "col-span-4" client/src/components/widgets/HubGrid.test.tsx` returns at least 1 match)
    - getDefaultLayout('oversikt') returns 7 items (1 XL + 6 summary)
    - getOversiktSections() returns 2 sections
    - WIDGET_REGISTRY has at least 32 entries
    - WIDGET_LABELS exhaustively maps all 32 widget IDs
    - useOversiktHubSummary tests + useOnboardedHubsTracking tests + HubGrid.test.tsx all green
    - npx tsc --noEmit zero errors
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 2a: Build OnboardingWidget (XL) + 3 cross-hub summary widgets (Jobsok, CvStatus, Interview) — all read JOBSOK_HUB_KEY</name>
  <read_first>
    - client/src/components/widgets/Widget.tsx (XL size handling — verify Widget compound supports XL)
    - client/src/components/widgets/CareerGoalWidget.tsx (Plan 02 widget pattern reference)
    - client/src/components/widgets/JobSearchWidget.tsx (Phase 2 — XL-style empty wide widget reference)
    - client/src/hooks/useJobsokHubSummary.ts (verify JOBSOK_HUB_KEY export + JobsokSummary slice shapes for cv/interviewSessions)
    - .planning/phases/05-full-hub-coverage-oversikt/05-RESEARCH.md §"Cross-hub summary-widgets" + §"Onboarding XL-widget"
  </read_first>
  <behavior>
    - OnboardingWidget Test A (new user — onboarded_hubs=[]): renders "Välkommen till din portal" + 4 quick-link CTAs ("Söka jobb →", "Karriär →", "Resurser →", "Min Vardag →") to /soka-jobb /karriar /resurser /min-vardag
    - OnboardingWidget Test B (returning user with onboarded_hubs=['jobb']): renders "Bra jobbat" greeting and contextual next-step CTA
    - OnboardingWidget Test C: when full_name='Anna Karlsson', heading is "Bra jobbat Anna!"
    - JobsokSummaryWidget Test A (cache empty): renders "Inga ansökningar än — börja söka idag" empty state
    - JobsokSummaryWidget Test B (cache has total=12): renders "12 aktiva ansökningar"
    - CvStatusSummaryWidget: 2 tests (no CV → "Inget CV"; has CV → "CV uppdaterat {date}")
    - InterviewSummaryWidget: 2 tests (no session → "Tid för övning"; session score=85 → "Stark prestation"; verify NO raw \\d+% rendered)
    - All 4 widgets forward `onHide` to Widget (Pitfall B regression)
  </behavior>
  <files>client/src/components/widgets/OnboardingWidget.tsx, client/src/components/widgets/OnboardingWidget.test.tsx, client/src/components/widgets/JobsokSummaryWidget.tsx, client/src/components/widgets/JobsokSummaryWidget.test.tsx, client/src/components/widgets/CvStatusSummaryWidget.tsx, client/src/components/widgets/CvStatusSummaryWidget.test.tsx, client/src/components/widgets/InterviewSummaryWidget.tsx, client/src/components/widgets/InterviewSummaryWidget.test.tsx</files>
  <action>
    Implement OnboardingWidget (XL) + 3 JOBSOK-reading cross-hub summary widgets. (Anti-shaming test extension and the 3 KARRIAR/MIN_VARDAG-reading widgets are deferred to Task 2b.)

    **1. `OnboardingWidget.tsx` (XL — only allowedSize)**
    - Read `useOversiktSummary()` (from OversiktDataContext) — get profile + jobsok + karriar + resurser + minVardag slices
    - `const isNewUser = (profile?.onboarded_hubs ?? []).length === 0`
    - Layout: horizontal banner — icon left, content centre, CTA right (matches Phase 2 UI-SPEC XL row layout)
    - New user: heading "Välkommen till din portal" + body "Utforska dina hubbar och kom igång med din jobbsökning" + 4 inline CTA links to /soka-jobb /karriar /resurser /min-vardag
    - Returning user: heading `Bra jobbat ${firstName}!` (firstName from full_name?.split(' ')[0] || 'där'). Body = deterministic next-step suggestion (helper function `pickNextStep(summaries) => { text: string, href: string }`):
      ```typescript
      function pickNextStep({ jobsok, minVardag }): { text: string, href: string } {
        if (!jobsok || jobsok.applicationStats?.total === 0) return { text: 'Du har inte sökt något jobb än. Vill du börja idag?', href: '/soka-jobb' }
        if (!minVardag || minVardag.diaryEntryCount === 0) return { text: 'Reflektera över din vecka i dagboken', href: '/diary' }
        return { text: 'Fortsätt med dina mål', href: '/karriar' }
      }
      ```
    - CTA: single primary action (not 4) for returning user
    - Icon: `Sparkles`. allowedSizes ['XL']. Defaults size XL

    **2. `JobsokSummaryWidget.tsx`** (M default, S/M allowed) — read JOBSOK_HUB_KEY:
    - Pattern (canonical for cross-hub widgets):
      ```typescript
      const { user } = useAuth()
      const queryClient = useQueryClient()
      const data = queryClient.getQueryData(JOBSOK_HUB_KEY(user?.id ?? '')) as JobsokSummary | undefined
      const totalApps = data?.applicationStats?.total ?? 0
      ```
    - Icon Briefcase, header "Söka jobb"; primary "{n} aktiva ansökningar" or empty "Inga ansökningar än — börja söka idag"; CTA → /soka-jobb

    **3. `CvStatusSummaryWidget.tsx`** (S default) — read JOBSOK_HUB_KEY → cv slice:
    - Icon FileText, header "CV"
    - Primary: "CV uppdaterat {locale-date(cv.updated_at)}" if `data?.cv` else "Inget CV"
    - CTA → `/cv` (or fallback `/soka-jobb` if `/cv` not registered — check navigation.ts; document fallback in code comment)

    **4. `InterviewSummaryWidget.tsx`** (S default) — read JOBSOK_HUB_KEY → interviewSessions slice:
    - Icon MessageSquare, header "Intervju"
    - Score from `data?.interviewSessions?.[0]?.score` (NEVER render the raw number)
    - Qualitative label: `>=80` → "Stark prestation", `>=60` → "Bra framsteg", `>=40` → "Bygger upp", `<40 || null` → "Tid för övning"
    - CTA → /interview-simulator

    **Test pattern (cross-hub widgets):**
    ```typescript
    import { describe, it, expect, vi } from 'vitest'
    import { render, screen } from '@testing-library/react'
    import { MemoryRouter } from 'react-router-dom'
    import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
    import JobsokSummaryWidget from './JobsokSummaryWidget'

    vi.mock('@/hooks/useSupabase', () => ({ useAuth: () => ({ user: { id: 'u1' } }) }))

    function renderWithCache(cacheData: unknown, props = {}) {
      const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
      qc.setQueryData(['hub', 'jobsok', 'u1'], cacheData)
      return render(
        <QueryClientProvider client={qc}>
          <MemoryRouter>
            <JobsokSummaryWidget id="jobsok-summary" size="M" allowedSizes={['S','M']} {...props} />
          </MemoryRouter>
        </QueryClientProvider>
      )
    }

    describe('JobsokSummaryWidget', () => {
      it('renders empty state when cache is undefined', () => {
        const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
        // No setQueryData call
        render(<QueryClientProvider client={qc}><MemoryRouter><JobsokSummaryWidget id="jobsok-summary" size="M" allowedSizes={['S','M']} /></MemoryRouter></QueryClientProvider>)
        expect(screen.getByText(/Inga ansökningar/)).toBeInTheDocument()
      })
      it('renders count when cache has applicationStats', () => {
        renderWithCache({ applicationStats: { total: 12 } })
        expect(screen.getByText(/12 aktiva ansökningar/)).toBeInTheDocument()
      })
    })
    ```
    OnboardingWidget tests use `OversiktDataProvider` instead of cache pre-seeding.

    Anti-shaming extension is NOT done in this task — Task 2b adds all 7 anti-shaming cases (4 from this task + 3 from 2b) in one batch.

    Verification: per-widget tests green; npx tsc --noEmit zero.
  </action>
  <verify>
    <automated>cd client && npm run test:run -- src/components/widgets/OnboardingWidget.test.tsx src/components/widgets/JobsokSummaryWidget.test.tsx src/components/widgets/CvStatusSummaryWidget.test.tsx src/components/widgets/InterviewSummaryWidget.test.tsx --reporter=dot 2>&1 | tail -5</automated>
  </verify>
  <done>
    - 4 widget files default-exported (OnboardingWidget, JobsokSummaryWidget, CvStatusSummaryWidget, InterviewSummaryWidget)
    - OnboardingWidget renders both new-user and returning-user states
    - 3 cross-hub summary widgets read from getQueryData (NO new SELECTs — `grep "supabase\\.from" client/src/components/widgets/JobsokSummaryWidget.tsx client/src/components/widgets/CvStatusSummaryWidget.tsx client/src/components/widgets/InterviewSummaryWidget.tsx` returns 0)
    - InterviewSummaryWidget renders qualitative label NOT raw score (verify with screen.queryByText for `\\d+%` returns null)
    - All 4 widgets forward `onHide`
    - npx tsc --noEmit zero
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 2b: Build remaining 3 cross-hub summary widgets (CareerGoal, Health, Diary) + extend anti-shaming test for all 7 Översikt widgets</name>
  <read_first>
    - client/src/components/widgets/JobsokSummaryWidget.tsx (Task 2a — pattern reference for cross-hub reads)
    - client/src/hooks/useKarriarHubSummary.ts (verify KARRIAR_HUB_KEY + careerGoals slice)
    - client/src/hooks/useMinVardagHubSummary.ts (verify MIN_VARDAG_HUB_KEY + recentMoodLogs/diaryEntryCount slices)
    - client/src/utils/streakDays.ts (Plan 04 single source — HealthSummaryWidget imports from here)
    - client/src/components/widgets/__tests__/anti-shaming.test.tsx (extend with 7 Översikt cases)
    - .planning/phases/05-full-hub-coverage-oversikt/05-RESEARCH.md §"Cross-hub summary-widgets"
  </read_first>
  <behavior>
    - CareerGoalSummaryWidget: 2 tests (no goal → "Inget mål satt"; has shortTerm='Få första intervjun' → renders truncated 50 chars)
    - HealthSummaryWidget: 2 tests (no logs → "Logga ditt mående"; 5-day streak via fixture → "Loggat 5 dagar"); imports streakDays from `@/utils/streakDays` (NOT from HealthWidget)
    - DiarySummaryWidget: 2 tests (count=0 → "Skriv idag"; count=4 → "4 inlägg")
    - All 3 widgets forward `onHide`
    - Anti-shaming extended for all 7 Översikt widgets (4 from Task 2a + 3 from Task 2b) → cases array now ~32 total
    - No widget renders raw \\d+% in 32/22px font-bold primary slot
  </behavior>
  <files>client/src/components/widgets/CareerGoalSummaryWidget.tsx, client/src/components/widgets/CareerGoalSummaryWidget.test.tsx, client/src/components/widgets/HealthSummaryWidget.tsx, client/src/components/widgets/HealthSummaryWidget.test.tsx, client/src/components/widgets/DiarySummaryWidget.tsx, client/src/components/widgets/DiarySummaryWidget.test.tsx, client/src/components/widgets/__tests__/anti-shaming.test.tsx</files>
  <action>
    Implement remaining 3 cross-hub summary widgets and extend anti-shaming for all 7 Översikt widgets.

    **5. `CareerGoalSummaryWidget.tsx`** (M default) — read KARRIAR_HUB_KEY → careerGoals slice:
    ```typescript
    const data = queryClient.getQueryData(KARRIAR_HUB_KEY(user?.id ?? '')) as KarriarSummary | undefined
    const shortTerm = data?.careerGoals?.shortTerm ?? null
    const truncated = shortTerm && shortTerm.length > 50 ? shortTerm.slice(0, 50) + '…' : shortTerm
    ```
    - Icon Target, header "Karriärmål"
    - Primary: `truncated` or "Inget mål satt"
    - CTA → /career-plan

    **6. `HealthSummaryWidget.tsx`** (M default) — read MIN_VARDAG_HUB_KEY → recentMoodLogs:
    ```typescript
    import { streakDays } from '@/utils/streakDays'  // ← single source of truth (Plan 04 Task 2)

    const data = queryClient.getQueryData(MIN_VARDAG_HUB_KEY(user?.id ?? '')) as MinVardagSummary | undefined
    const logs = data?.recentMoodLogs ?? []
    const streak = streakDays(logs)
    ```
    - Icon Heart, header "Hälsa"
    - Primary: `streak > 0 ? \`Loggat ${streak} dagar\` : "Logga ditt mående"`
    - CTA → /mood
    - **CRITICAL: Import path is `@/utils/streakDays` — NOT from `./HealthWidget` and NOT a sibling utility. Plan 04 Task 2 established this single source of truth.**

    **7. `DiarySummaryWidget.tsx`** (S default) — read MIN_VARDAG_HUB_KEY → diaryEntryCount:
    - Icon BookText, header "Dagbok"
    - Primary: `count > 0 ? \`${count} inlägg\` : "Skriv idag"`
    - CTA → /diary

    All 3 widgets follow the canonical cross-hub-widget pattern from Task 2a. All forward `onHide`.

    **Test pattern:** identical to Task 2a — pre-seed QueryClient with the relevant cache key, render with QueryClientProvider + MemoryRouter, assert text. For HealthSummaryWidget streak test, fixture must have N consecutive days of mood_logs entries (the streakDays helper has its own unit tests in Plan 04, so we only need to verify the rendered string here, not re-test the streak math).

    **Anti-shaming extension (`__tests__/anti-shaming.test.tsx`):**
    Extend the cases array with all 7 Översikt widgets (1 OnboardingWidget + 6 summary). The cases array becomes:
    `[...JOBSOK, ...KARRIAR, ...RESURSER, ...MINVARDAG, ...OVERSIKT]`
    Total cases: 8 + 6 + 6 + 5 + 7 = 32. Each case asserts no raw `\d+%` in 32/22px font-bold slot. For OnboardingWidget specifically — also verify no raw % in the heading or body. Use `OversiktDataProvider` for OnboardingWidget; pre-seeded QueryClient cache for the 6 summary widgets.

    Verification: 3 new widget tests + extended anti-shaming green; npx tsc --noEmit zero.
  </action>
  <verify>
    <automated>cd client && npm run test:run -- src/components/widgets/CareerGoalSummaryWidget.test.tsx src/components/widgets/HealthSummaryWidget.test.tsx src/components/widgets/DiarySummaryWidget.test.tsx src/components/widgets/__tests__/anti-shaming.test.tsx --reporter=dot 2>&1 | tail -5</automated>
  </verify>
  <done>
    - 3 widget files default-exported (CareerGoalSummaryWidget, HealthSummaryWidget, DiarySummaryWidget)
    - HealthSummaryWidget imports streakDays from `@/utils/streakDays` (verifiable: `grep "from '@/utils/streakDays'" client/src/components/widgets/HealthSummaryWidget.tsx` returns 1 match; `grep "from.*HealthWidget" client/src/components/widgets/HealthSummaryWidget.tsx` returns 0 matches)
    - Cross-hub widgets read via getQueryData (`grep "supabase\\.from" client/src/components/widgets/CareerGoalSummaryWidget.tsx client/src/components/widgets/HealthSummaryWidget.tsx client/src/components/widgets/DiarySummaryWidget.tsx` returns 0)
    - All 3 widgets forward `onHide`
    - Anti-shaming test cases array has 32 cases all green (verifiable: `grep -c "id:.*'" client/src/components/widgets/__tests__/anti-shaming.test.tsx` ≥ 32)
    - npx tsc --noEmit zero
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 3: Wire HubOverview.tsx + integration tests + add useOnboardedHubsTracking to all 5 hub pages (incl. mock injection in 4 existing hub test files)</name>
  <read_first>
    - client/src/pages/hubs/MinVardagHub.tsx (Plan 04 wiring template — copy + swap)
    - client/src/pages/hubs/__tests__/MinVardagHub.test.tsx (test template — copy + swap)
    - client/src/pages/hubs/HubOverview.tsx (current Phase 2 stub — REPLACE)
    - client/src/pages/hubs/JobsokHub.tsx, KarriarHub.tsx, ResurserHub.tsx, MinVardagHub.tsx (each gets one new line: useOnboardedHubsTracking call)
    - client/src/pages/hubs/__tests__/JobsokHub.test.tsx, KarriarHub.test.tsx, ResurserHub.test.tsx, MinVardagHub.test.tsx (each gets one new vi.mock for useOnboardedHubsTracking)
    - client/src/hooks/useOnboardedHubsTracking.ts (Task 1 output)
  </read_first>
  <behavior>
    HubOverview.test.tsx — 13 integration tests (α-λ + μ + ν) mirroring earlier hubs:
    - α-θ: same as Plan 04 swapped for Översikt (7 widgets — note: panel can hide widgets, including XL onboarding)
    - ι: upsert payload includes hub_id='oversikt'
    - κ: all 7 widget icons render
    - λ: aria-live announces "Widget Välkommen dold" when hideWidget('onboarding-xl') runs
    - Extra μ test: Onboarding shows new-user state when profile.onboarded_hubs=[]; returning state when ['jobb']
    - Extra ν test: useOnboardedHubsTracking is invoked once on HubOverview mount with 'oversikt'

    Plus: each of the 4 OTHER hub-page tests still passes after adding useOnboardedHubsTracking call (regression — the 4 existing hub test files MUST get a vi.mock for useOnboardedHubsTracking, otherwise the real hook will hit supabase.update and fail).
  </behavior>
  <files>client/src/pages/hubs/HubOverview.tsx, client/src/pages/hubs/__tests__/HubOverview.test.tsx, client/src/pages/hubs/JobsokHub.tsx, client/src/pages/hubs/KarriarHub.tsx, client/src/pages/hubs/ResurserHub.tsx, client/src/pages/hubs/MinVardagHub.tsx, client/src/pages/hubs/__tests__/JobsokHub.test.tsx, client/src/pages/hubs/__tests__/KarriarHub.test.tsx, client/src/pages/hubs/__tests__/ResurserHub.test.tsx, client/src/pages/hubs/__tests__/MinVardagHub.test.tsx</files>
  <action>
    **A. Replace `HubOverview.tsx`** with full Phase 3+4+5 wiring. Copy `MinVardagHub.tsx` template, swap:
    - HUB_ID 'min-vardag' → 'oversikt'
    - useMinVardagHubSummary → useOversiktHubSummary (NB: returns `{ data, isLoading }` — same shape, just different return type for `data`)
    - MinVardagDataProvider → OversiktDataProvider
    - MinVardagLayoutProvider/Value → OversiktLayoutProvider/Value
    - getMinVardagSections → getOversiktSections
    - PageLayout title 'Min Vardag' → 'Översikt', subtitle 'Din översikt över alla hubbar'
    - PageLayout domain 'wellbeing' → 'action' (green per UI-SPEC color mapping)
    - Add line at top of component body: `useOnboardedHubsTracking('oversikt')`

    **B. Add `useOnboardedHubsTracking(HUB_ID)` to the 4 other hub pages.** Each gets ONE new line near top of component body (after useTranslation, before useMemo for sections):

    For JobsokHub.tsx:
    ```typescript
    import { useOnboardedHubsTracking } from '@/hooks/useOnboardedHubsTracking'
    // ... inside component:
    useOnboardedHubsTracking('jobb')
    ```

    Repeat for KarriarHub.tsx ('karriar'), ResurserHub.tsx ('resurser'), MinVardagHub.tsx ('min-vardag').

    No other changes to those 4 hub pages — keep regression risk minimal.

    **C. Integration test file (`HubOverview.test.tsx`):** copy `MinVardagHub.test.tsx`, swap mocks:
    ```typescript
    const STUB_SUMMARY = {
      profile: { onboarded_hubs: [], full_name: 'Anna Karlsson' },
      jobsok: undefined,
      karriar: undefined,
      resurser: undefined,
      minVardag: undefined,
    }
    vi.mock('@/hooks/useOversiktHubSummary', () => ({
      useOversiktHubSummary: () => ({ data: STUB_SUMMARY, isLoading: false }),
      OVERSIKT_HUB_KEY: (id: string) => ['hub', 'oversikt', id],
    }))
    vi.mock('@/hooks/useOnboardedHubsTracking', () => ({
      useOnboardedHubsTracking: vi.fn(),
    }))
    ```
    α-λ tests adapted:
    - γ: 7 hide buttons (1 XL + 6 summary)
    - ι: hub_id='oversikt' in upsert
    - λ: aria-live "Widget Välkommen dold" or whichever label is first

    Add μ tests:
    - With profile.onboarded_hubs=[]: OnboardingWidget shows "Välkommen till din portal"
    - With profile.onboarded_hubs=['jobb']: OnboardingWidget shows "Bra jobbat Anna!"

    Add ν test:
    - useOnboardedHubsTracking is invoked with 'oversikt' on mount (assert `vi.mocked(useOnboardedHubsTracking).mock.calls[0][0] === 'oversikt'`)

    **D. Regression — inject useOnboardedHubsTracking mock into 4 existing hub test files.** The existing JobsokHub, KarriarHub, ResurserHub, MinVardagHub test files do NOT mock useOnboardedHubsTracking. Now those tests will hit the real hook, which will call supabase.update — likely failing. Fix: add this exact line near the top of each (after the existing vi.mock blocks):
    ```typescript
    vi.mock('@/hooks/useOnboardedHubsTracking', () => ({ useOnboardedHubsTracking: vi.fn() }))
    ```
    Verifiable post-edit: `grep "vi.mock.*useOnboardedHubsTracking" client/src/pages/hubs/__tests__/JobsokHub.test.tsx client/src/pages/hubs/__tests__/KarriarHub.test.tsx client/src/pages/hubs/__tests__/ResurserHub.test.tsx client/src/pages/hubs/__tests__/MinVardagHub.test.tsx | wc -l` returns 4.

    Run all hub-test files including the 4 existing ones — all green.
    `npm run build` succeeds.
  </action>
  <verify>
    <automated>cd client && npm run test:run -- src/pages/hubs/__tests__/ --reporter=dot 2>&1 | tail -5</automated>
  </verify>
  <done>
    - HubOverview.tsx full wiring (~180 lines)
    - HubOverview.test.tsx has 13 integration tests (α-λ + μ + ν) all green
    - All 4 existing hub-test files updated with useOnboardedHubsTracking mock — verifiable: `grep -l "useOnboardedHubsTracking" client/src/pages/hubs/__tests__/JobsokHub.test.tsx client/src/pages/hubs/__tests__/KarriarHub.test.tsx client/src/pages/hubs/__tests__/ResurserHub.test.tsx client/src/pages/hubs/__tests__/MinVardagHub.test.tsx` returns 4 files
    - All 4 regression suites green
    - Each of 5 hub pages calls useOnboardedHubsTracking(HUB_ID) on mount (verifiable via grep)
    - npm run build succeeds
    - HUB-05 acceptance: HubOverview renders 1 XL onboarding + 6 cross-hub summary widgets
  </done>
</task>

</tasks>

<verification>
- `npm run test:run -- src/pages/hubs/__tests__/` — all 5 hub test files green
- `npm run test:run -- src/hooks/useOversiktHubSummary.test.ts src/hooks/useOnboardedHubsTracking.test.ts` — green
- `grep -c "lazy(() => import('./" client/src/components/widgets/registry.ts` — at least 32 lazy entries
- `grep "supabase\\.from" client/src/components/widgets/JobsokSummaryWidget.tsx client/src/components/widgets/CvStatusSummaryWidget.tsx client/src/components/widgets/InterviewSummaryWidget.tsx client/src/components/widgets/CareerGoalSummaryWidget.tsx client/src/components/widgets/HealthSummaryWidget.tsx client/src/components/widgets/DiarySummaryWidget.tsx` — 0 matches (Pitfall D — cross-hub widgets do not query)
- `grep "useOnboardedHubsTracking(" client/src/pages/hubs/*.tsx | wc -l` — at least 5 (one per hub page)
- `grep "from '@/utils/streakDays'" client/src/components/widgets/HealthSummaryWidget.tsx` — 1 match (Plan 04 single source)
- `grep "col-span-4" client/src/components/widgets/HubGrid.test.tsx` — at least 1 match (XL test added)
- `npx tsc --noEmit` — zero errors
- `npm run build` — zero errors
</verification>

<success_criteria>
- HUB-05 fulfilled: HubOverview renders XL onboarding widget + 6 cross-hub summary widgets
- Cross-hub widgets read from React Query cache via getQueryData — NO new SELECTs (Pitfall D resolved)
- Onboarding detection: new vs. returning user differentiated by profile.onboarded_hubs
- All 5 hub pages track visits via useOnboardedHubsTracking
- HubGrid supports XL size (col-span-4 desktop, col-span-2 mobile per UI-SPEC) — verified by HubGrid.test.tsx XL test
- Bundle contract preserved: 7 new lazy widgets
- Anti-shaming extended: no Översikt widget renders raw \d+% in primary KPI
- streakDays single source of truth honored: HealthSummaryWidget imports from `@/utils/streakDays`
- All previous hub regression suites still green (4 existing hub test files now mock useOnboardedHubsTracking)
</success_criteria>

<output>
Create `.planning/phases/05-full-hub-coverage-oversikt/05-05-oversikt-hub-SUMMARY.md` documenting: (a) aggregator approach (Pitfall D — invokes 4 sub-hooks; React Query dedup), (b) onboarding-tracking mechanism + which hubs got the new line + which existing hub tests were patched with the mock, (c) HubGrid XL extension + the new HubGrid.test.tsx XL test, (d) 7 widgets implemented across Tasks 2a (4 widgets) + 2b (3 widgets), (e) integration test count (α-ν), (f) full Phase 5 widget tally: 8 (Jobsok) + 6 (Karriar) + 6 (Resurser) + 5 (Min Vardag) + 7 (Översikt) = 32 widgets across 5 hubs.
</output>
