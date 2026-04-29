---
phase: 05-full-hub-coverage-oversikt
plan: 02
type: execute
wave: 2
depends_on: [05-01-db-discovery-and-migrations-PLAN]
files_modified:
  - client/src/hooks/useKarriarHubSummary.ts
  - client/src/hooks/useKarriarHubSummary.test.ts
  - client/src/components/widgets/KarriarDataContext.tsx
  - client/src/components/widgets/KarriarLayoutContext.tsx
  - client/src/components/widgets/CareerGoalWidget.tsx
  - client/src/components/widgets/CareerGoalWidget.test.tsx
  - client/src/components/widgets/InterestGuideWidget.tsx
  - client/src/components/widgets/InterestGuideWidget.test.tsx
  - client/src/components/widgets/SkillGapWidget.tsx
  - client/src/components/widgets/SkillGapWidget.test.tsx
  - client/src/components/widgets/PersonalBrandWidget.tsx
  - client/src/components/widgets/PersonalBrandWidget.test.tsx
  - client/src/components/widgets/EducationWidget.tsx
  - client/src/components/widgets/EducationWidget.test.tsx
  - client/src/components/widgets/LinkedInWidget.tsx
  - client/src/components/widgets/LinkedInWidget.test.tsx
  - client/src/components/widgets/registry.ts
  - client/src/components/widgets/widgetLabels.ts
  - client/src/components/widgets/defaultLayouts.ts
  - client/src/pages/hubs/KarriarHub.tsx
  - client/src/pages/hubs/__tests__/KarriarHub.test.tsx
autonomous: true
requirements: [HUB-02]
must_haves:
  truths:
    - "useKarriarHubSummary fires Promise.all of 3 supabase selects (profiles, skills_analyses, personal_brand_audits) and returns KarriarSummary"
    - "KarriarHub.tsx renders 6 widgets (Karriärmål, Intresseguide, Kompetensgap, Personligt varumärke, Utbildning, LinkedIn) inside KarriarLayoutProvider OUTER → KarriarDataProvider INNER"
    - "Layout persistence works on Karriär — hide widget, reload page, widget still hidden (CUST-03 reused)"
    - "All 6 Karriär widgets are lazy() in WIDGET_REGISTRY — zero static imports (WIDG-01 / Bundle Contract)"
    - "Each Karriär widget's empty state renders the action-oriented copy from RESEARCH.md §Widget–Data Mapping (no bare 'Inga data')"
    - "No widget renders raw \\d+% as a primary KPI in the 32px/22px font-bold slot (anti-shaming carry-forward)"
    - "defaultLayouts.ts getDefaultLayout('karriar') returns the 6 Karriär widget IDs (no longer the cv placeholder)"
  artifacts:
    - path: "client/src/hooks/useKarriarHubSummary.ts"
      provides: "Hub-summary loader for Karriär (Promise.all + cache writes)"
      exports: ["useKarriarHubSummary", "KARRIAR_HUB_KEY"]
    - path: "client/src/components/widgets/KarriarDataContext.tsx"
      provides: "Data context — KarriarSummary shape + useKarriarWidgetData hook"
      exports: ["KarriarDataProvider", "useKarriarWidgetData", "useKarriarSummary", "KarriarSummary"]
    - path: "client/src/components/widgets/KarriarLayoutContext.tsx"
      provides: "Layout context — KarriarLayoutValue + useKarriarLayout"
      exports: ["KarriarLayoutProvider", "useKarriarLayout", "KarriarLayoutValue"]
    - path: "client/src/pages/hubs/KarriarHub.tsx"
      provides: "Hub page replacing Phase 2 stub — full Phase 3+4 wiring"
      contains: "KarriarLayoutProvider"
    - path: "client/src/components/widgets/registry.ts"
      provides: "WIDGET_REGISTRY extended with 6 Karriär entries (all lazy)"
      contains: "'karriar-mal'"
    - path: "client/src/components/widgets/defaultLayouts.ts"
      provides: "getDefaultLayout('karriar') returns 6 Karriär widget IDs"
      contains: "karriar:"
  key_links:
    - from: "client/src/pages/hubs/KarriarHub.tsx"
      to: "client/src/hooks/useKarriarHubSummary.ts"
      via: "imports useKarriarHubSummary, passes data to KarriarDataProvider"
      pattern: "useKarriarHubSummary\\("
    - from: "client/src/pages/hubs/KarriarHub.tsx"
      to: "client/src/components/widgets/HiddenWidgetsPanel.tsx"
      via: "renders panel inside KarriarLayoutProvider; passes layout/showWidget/resetLayout as props"
      pattern: "<HiddenWidgetsPanel[\\s\\S]*?layout=\\{"
    - from: "client/src/hooks/useKarriarHubSummary.ts"
      to: "supabase.from('skills_analyses' | 'personal_brand_audits' | 'profiles')"
      via: "Promise.all"
      pattern: "Promise\\.all"
---

<objective>
Wire the full Karriär hub: 6 lazy-loaded widgets backed by real Supabase data through a hub-summary loader, with layout persistence/hide-show replicating the Phase 4 pattern. This plan is the canonical replication of the Phase 3+4 patterns and is the template Plans 03-04 will follow verbatim — only swap the hub ID and widget set.

Purpose: Karriär is currently a Phase 2 stub showing a placeholder cv widget. After this plan, KarriarHub renders Karriärmål / Intresseguide / Kompetensgap / Personligt varumärke / Utbildning / LinkedIn with real data, full hide/show, and per-breakpoint layout persistence — fulfilling HUB-02.

Output: One hub-summary loader, two contexts (Data + Layout), 6 widgets, registry + label + defaultLayout extensions, fully-wired KarriarHub page, integration test suite mirroring JobsokHub.test.tsx. All tests green, zero TS errors, zero new npm dependencies.
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
@.planning/phases/05-full-hub-coverage-oversikt/05-01-db-discovery-and-migrations-SUMMARY.md
@.planning/phases/04-layout-persistence-hide-show/04-04-jobsokhub-wiring-and-integration-tests-SUMMARY.md
@.planning/phases/02-static-widget-grid/02-UI-SPEC.md
@client/src/hooks/useJobsokHubSummary.ts
@client/src/hooks/useJobsokHubSummary.test.ts
@client/src/components/widgets/JobsokDataContext.tsx
@client/src/components/widgets/JobsokLayoutContext.tsx
@client/src/components/widgets/registry.ts
@client/src/components/widgets/widgetLabels.ts
@client/src/components/widgets/defaultLayouts.ts
@client/src/components/widgets/types.ts
@client/src/components/widgets/CvWidget.tsx
@client/src/components/widgets/InterviewWidget.tsx
@client/src/pages/hubs/JobsokHub.tsx
@client/src/pages/hubs/__tests__/JobsokHub.test.tsx
@client/src/components/widgets/HiddenWidgetsPanel.tsx
@client/src/components/widgets/Widget.tsx
@client/src/hooks/useWidgetLayout.ts
@client/src/hooks/useBreakpoint.ts
@client/src/hooks/useInterestProfile.ts

<interfaces>
<!-- Phase 3 hub-summary loader template (copy + rename for Karriär): -->
<!-- See client/src/hooks/useJobsokHubSummary.ts (60 lines) — exact mechanics:
       - useQuery with key ['hub','{hubId}',userId]
       - enabled: !!userId, staleTime: 60_000
       - Promise.all of N supabase selects
       - queryClient.setQueryData for deep-link cache sync (only if pre-existing deep-link queryKeys exist)
       - return summary  satisfies KarriarSummary
     Test pattern: useJobsokHubSummary.test.ts (88 lines) — direct copy with renamed mock fixtures.
-->

<!-- Karriär data shape (locked from RESEARCH.md §Widget–Data Mapping): -->
```typescript
// client/src/components/widgets/KarriarDataContext.tsx
export interface KarriarSummary {
  // From profiles row (single fetch — Pitfall E avoid double profiles query)
  careerGoals: { shortTerm?: string; longTerm?: string; preferredRoles?: string[]; targetIndustries?: string[]; updatedAt?: string } | null
  linkedinUrl: string | null
  // From skills_analyses (latest row)
  latestSkillsAnalysis: {
    dream_job: string
    skills_comparison: unknown   // JSONB — widget extracts top-3 missing skills
    match_percentage: number     // used for QUALITATIVE label only — never displayed raw
    created_at: string
  } | null
  // From personal_brand_audits (PLURAL — Phase 3 table; Pitfall C)
  latestBrandAudit: { score: number; dimensions: unknown; created_at: string } | null
  // Intresseguide + Utbildning are SELF-CONTAINED widgets (Pitfall F deferred — they call existing hooks)
  // No slice in summary for them.
}
```

<!-- Phase 4 layout context template (copy + rename for Karriär): -->
<!-- See client/src/components/widgets/JobsokLayoutContext.tsx (54 lines) — verbatim copy:
       - JobsokLayoutValue → KarriarLayoutValue (no fields change)
       - JobsokLayoutContext → KarriarLayoutContext
       - JobsokLayoutProvider → KarriarLayoutProvider
       - useJobsokLayout → useKarriarLayout
       - selectHiddenWidgets is no longer needed (Plan 01 removed its only consumer)
-->

<!-- Hub-page wiring template (copy + adapt JobsokHub.tsx — 180 lines): -->
<!-- 8-step recipe from .planning/phases/04-layout-persistence-hide-show/04-04-jobsokhub-wiring-and-integration-tests-SUMMARY.md "Pattern for Phase 5 Replication": -->
<!--   1. Imports — useWidgetLayout('karriar'), useBreakpoint, KarriarLayoutProvider, KarriarLayoutValue,
                    HiddenWidgetsPanel (now props-based), WIDGET_LABELS, getDefaultLayout, WIDGET_REGISTRY -->
<!--   2. Hub-local useState — editMode, panelOpen, announcement -->
<!--   3. effectiveLayout = layout.length > 0 ? layout : getDefaultLayout('karriar', breakpoint) -->
<!--   4. Build layoutValue: KarriarLayoutValue from effectiveLayout mutators -->
<!--   5. Render order: <KarriarLayoutProvider><KarriarDataProvider> — OUTER/INNER -->
<!--   6. customizeButton in PageLayout actions slot; HiddenWidgetsPanel in content tree -->
<!--   7. Each widget: id, size, onSizeChange, allowedSizes, editMode, onHide -->
<!--   8. Each widget destructures + forwards onHide to <Widget> (Pitfall B) -->

<!-- Sections — Karriär uses 3 sections per RESEARCH.md §Section-struktuer per hub: -->
```typescript
// client/src/components/widgets/defaultLayouts.ts — extend with:
export function getKarriarSections(): SectionedLayout[] {
  const all = getDefaultLayout('karriar')
  return [
    { title: 'Utforska', items: all.slice(0, 2) },   // Karriärmål, Intresseguide
    { title: 'Analysera', items: all.slice(2, 4) },  // Kompetensgap, Personligt varumärke
    { title: 'Utveckla', items: all.slice(4, 6) },   // Utbildning, LinkedIn
  ]
}
```

<!-- Default layout for karriar (replaces the placeholder { id: 'cv', size: 'S', ... }): -->
```typescript
// In getDefaultLayout — desktop record:
karriar: [
  { id: 'karriar-mal',          size: 'M', order: 0, visible: true },
  { id: 'intresseguide',        size: 'M', order: 1, visible: true },
  { id: 'kompetensgap',         size: 'L', order: 2, visible: true },
  { id: 'personligt-varumarke', size: 'M', order: 3, visible: true },
  { id: 'utbildning',           size: 'S', order: 4, visible: true },
  { id: 'linkedin',             size: 'S', order: 5, visible: true },
],
```

<!-- WIDGET_REGISTRY additions (all lazy() — never static imports per WIDG-01 bundle contract): -->
```typescript
// client/src/components/widgets/registry.ts — append after international:
'karriar-mal':         { component: lazy(() => import('./CareerGoalWidget')),     defaultSize: 'M', allowedSizes: ['S', 'M', 'L'] },
intresseguide:         { component: lazy(() => import('./InterestGuideWidget')),  defaultSize: 'M', allowedSizes: ['S', 'M', 'L'] },
kompetensgap:          { component: lazy(() => import('./SkillGapWidget')),       defaultSize: 'L', allowedSizes: ['M', 'L'] },
'personligt-varumarke':{ component: lazy(() => import('./PersonalBrandWidget')),  defaultSize: 'M', allowedSizes: ['S', 'M', 'L'] },
utbildning:            { component: lazy(() => import('./EducationWidget')),      defaultSize: 'S', allowedSizes: ['S', 'M'] },
linkedin:              { component: lazy(() => import('./LinkedInWidget')),       defaultSize: 'S', allowedSizes: ['S', 'M'] },
```

<!-- WIDGET_LABELS additions (Record<WidgetId, string> is exhaustive — TypeScript enforces all keys): -->
```typescript
// client/src/components/widgets/widgetLabels.ts — extend the Record:
'karriar-mal':          'Karriärmål',
intresseguide:          'Intresseguide',
kompetensgap:           'Kompetensgap',
'personligt-varumarke': 'Personligt varumärke',
utbildning:             'Utbildning',
linkedin:               'LinkedIn',
```

<!-- WidgetProps shape (already exists — see types.ts) — every widget MUST destructure onHide and forward to Widget: -->
```typescript
// types.ts:
export interface WidgetProps {
  id: string
  size: WidgetSize
  onSizeChange?: (newSize: WidgetSize) => void
  allowedSizes?: WidgetSize[]
  editMode?: boolean
  className?: string
  onHide?: () => void   // Phase 4 — MUST be forwarded to <Widget> per Pitfall B
}
```

<!-- Widget compound API (see Widget.tsx) — all widgets render Widget.Root with Header/Body[/Footer]: -->
```typescript
<Widget id={id} size={size} allowedSizes={allowedSizes} onSizeChange={onSizeChange} editMode={editMode} onHide={onHide}>
  <Widget.Header icon={IconComponent} title="..." />
  <Widget.Body>...</Widget.Body>
  {/* Footer rendered only at M/L per UI-SPEC */}
  {(size === 'M' || size === 'L') && <Widget.Footer><Widget.Action onClick={...}>{label}</Widget.Action></Widget.Footer>}
</Widget>
```

<!-- Anti-shaming guard (carry-forward from Phase 3 anti-shaming.test.tsx) — Plan 02 EXTENDS this test: -->
<!-- Add the 6 new widgets to the `cases` array. Decorative SVG percentages inside ProgressRing are EXCLUDED -->
<!-- (only text-[32px]/text-[22px] + font-bold elements are checked). Widgets must NOT render `\d+%` in primary KPI. -->

<!-- Empty-state copy (LOCKED from RESEARCH.md §Widget–Data Mapping for the 6 widgets): -->
```
Karriärmål  : "Inga aktiva mål" / "Sätt ditt nästa karriärmål och börja planera" / "Skapa mitt karriärmål"
Intresseguide: "Utforska dina intressen" / "Ta reda på vilka yrken som matchar dig bäst" / "Starta intresseguide"
Kompetensgap : "Ingen analys gjord" / "Ta reda på vilka kompetenser du behöver för din drömroll" / "Gör analys"
Pers. varumärke: "Ditt personliga varumärke" / "Gör en audit och se hur starkt ditt varumärke är" / "Starta audit"
Utbildning  : "Hitta din nästa utbildning" / "Sök bland tusentals kurser och utbildningar anpassade för dig" / "Utforska utbildningar"  (PERMANENT — static-content widget)
LinkedIn    : "Koppla LinkedIn" / "Lägg till din LinkedIn-URL och optimera din profil" / "Lägg till LinkedIn"
```

<!-- Filled-state copy must use milestone-framing (NOT raw percentages) per A11Y-03: -->
<!-- Examples: -->
<!--   Kompetensgap (match_percentage 78): primary text "Nära målet" or "Bra framsteg" — never "78%" -->
<!--   Personligt varumärke (score 84): primary text "Starkt varumärke" — never "84/100" or "84%" in 32px slot -->
<!--   The decorative number can appear in body 12px text (e.g. "Senast: 2026-04-15"), just NOT in the 32/22px primary KPI slot. -->

<!-- Deep-link routes for widget Footer.Action onClick navigation (existing pages — DO NOT change): -->
<!--   Karriärmål  → '/career-plan' or '/profile/career' (verify against navigation.ts memberPaths) -->
<!--   Intresseguide → '/interest-guide' -->
<!--   Kompetensgap → '/skills-analysis' or '/job-matcher' -->
<!--   Personligt varumärke → '/personal-brand' -->
<!--   Utbildning → '/education-search' -->
<!--   LinkedIn → '/linkedin-optimizer' -->
<!-- Use react-router-dom useNavigate or <Link to="..."> consistent with Phase 2 widgets (see CvWidget.tsx for pattern). -->
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Hub plumbing — useKarriarHubSummary loader + KarriarDataContext + KarriarLayoutContext + registry/labels/defaultLayouts extensions</name>
  <read_first>
    - client/src/hooks/useJobsokHubSummary.ts (verbatim copy template)
    - client/src/hooks/useJobsokHubSummary.test.ts (verbatim copy template — use the makeBuilder helper as-is)
    - client/src/components/widgets/JobsokDataContext.tsx (verbatim copy template)
    - client/src/components/widgets/JobsokLayoutContext.tsx (verbatim copy template)
    - client/src/components/widgets/registry.ts (extension target)
    - client/src/components/widgets/widgetLabels.ts (extension target)
    - client/src/components/widgets/defaultLayouts.ts (extension target — replace karriar placeholder)
    - .planning/phases/05-full-hub-coverage-oversikt/05-DB-DISCOVERY.md (locked SELECT shapes)
  </read_first>
  <behavior>
    - Test 1: useKarriarHubSummary fires Promise.all of 3 supabase selects (profiles, skills_analyses, personal_brand_audits) on mount with userId from useAuth
    - Test 2: Returns KarriarSummary shape — careerGoals, linkedinUrl, latestSkillsAnalysis, latestBrandAudit (each may be null in empty fixtures)
    - Test 3: query is disabled when userId is empty (returns isLoading=false, isFetching=false, data=undefined)
    - Test 4: Single profiles query (NOT two) — Pitfall E. The Promise.all has exactly 3 entries, profiles fetched once with select('career_goals, linkedin_url')
  </behavior>
  <files>client/src/hooks/useKarriarHubSummary.ts, client/src/hooks/useKarriarHubSummary.test.ts, client/src/components/widgets/KarriarDataContext.tsx, client/src/components/widgets/KarriarLayoutContext.tsx, client/src/components/widgets/registry.ts, client/src/components/widgets/widgetLabels.ts, client/src/components/widgets/defaultLayouts.ts</files>
  <action>
    Build the hub plumbing first — without this Plumbing, the widgets in Task 2 cannot read data and Task 3 cannot wire the page.

    **A. `client/src/components/widgets/KarriarDataContext.tsx`** — verbatim copy of JobsokDataContext.tsx with renamed types/fns. Use the KarriarSummary interface from <interfaces> above. Body identical to JobsokDataContext, just rename: JobsokDataContext → KarriarDataContext, JobsokDataProvider → KarriarDataProvider, useJobsokWidgetData → useKarriarWidgetData, useJobsokSummary → useKarriarSummary.

    **B. `client/src/components/widgets/KarriarLayoutContext.tsx`** — verbatim copy of JobsokLayoutContext.tsx. Rename: JobsokLayoutValue → KarriarLayoutValue, JobsokLayoutContext → KarriarLayoutContext, JobsokLayoutProvider → KarriarLayoutProvider, useJobsokLayout → useKarriarLayout. Drop the `selectHiddenWidgets` export (it's no longer used after Plan 01's HiddenWidgetsPanel refactor).

    **C. `client/src/hooks/useKarriarHubSummary.ts`** — copy useJobsokHubSummary.ts and adapt:

    ```typescript
    import { useQuery } from '@tanstack/react-query'
    import { useAuth } from '@/hooks/useSupabase'
    import { supabase } from '@/lib/supabase'
    import type { KarriarSummary } from '@/components/widgets/KarriarDataContext'

    export const KARRIAR_HUB_KEY = (userId: string) => ['hub', 'karriar', userId] as const

    export function useKarriarHubSummary() {
      const { user } = useAuth()
      const userId = user?.id ?? ''

      return useQuery<KarriarSummary>({
        queryKey: KARRIAR_HUB_KEY(userId),
        enabled: !!userId,
        staleTime: 60_000,
        queryFn: async () => {
          // Pitfall E: profiles fetched ONCE with both columns. Pitfall C: PLURAL personal_brand_audits.
          const [profileR, skillsR, brandR] = await Promise.all([
            supabase.from('profiles')
              .select('career_goals, linkedin_url')
              .eq('id', userId)
              .maybeSingle(),
            supabase.from('skills_analyses')
              .select('dream_job, skills_comparison, match_percentage, created_at')
              .eq('user_id', userId)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle(),
            supabase.from('personal_brand_audits')
              .select('score, dimensions, created_at')
              .eq('user_id', userId)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle(),
          ])

          return {
            careerGoals: profileR.data?.career_goals ?? null,
            linkedinUrl: profileR.data?.linkedin_url ?? null,
            latestSkillsAnalysis: skillsR.data ?? null,
            latestBrandAudit: brandR.data ?? null,
          } satisfies KarriarSummary
        },
      })
    }
    ```

    **D. `client/src/hooks/useKarriarHubSummary.test.ts`** — copy useJobsokHubSummary.test.ts as the template. Replace fixtures:
    - profiles: `{ career_goals: { shortTerm: 'Senior dev' }, linkedin_url: 'https://linkedin.com/in/x' }`
    - skills_analyses: `{ dream_job: 'UX Designer', skills_comparison: { missing: ['Figma','User research'] }, match_percentage: 72, created_at: '2026-04-20' }`
    - personal_brand_audits: `{ score: 78, dimensions: { audit: 80 }, created_at: '2026-04-15' }`

    Then write 4 tests covering behaviors 1-4. Test 4 specifically asserts `fromMock` was called with `'profiles'` exactly once (use vi.fn().mock.calls.filter(c => c[0]==='profiles').length === 1).

    **E. `client/src/components/widgets/defaultLayouts.ts`** — EXTEND existing file:
    1. In `getDefaultLayout`, REPLACE the `karriar:` placeholder (`[{ id: 'cv', size: 'S', order: 0, visible: true }]`) with the 6-widget array from <interfaces>.
    2. APPEND `getKarriarSections()` exported function (3 sections: Utforska / Analysera / Utveckla — matching ranges from <interfaces>).

    **F. `client/src/components/widgets/registry.ts`** — APPEND 6 lazy entries (interface block above) to `WIDGET_REGISTRY`. Order: place the 6 new entries after `international:` keeping comment block per existing style.

    **G. `client/src/components/widgets/widgetLabels.ts`** — EXTEND `WIDGET_LABELS` Record with 6 new labels. Because `Record<WidgetId, string>` is exhaustive, TypeScript will demand all keys are present once registry.ts is updated — this provides the compile-time guarantee.

    **Verification chain:**
    - `cd client && npx tsc --noEmit` — zero errors (registry + labels must be in sync)
    - `cd client && npm run test:run -- src/hooks/useKarriarHubSummary.test.ts` — 4 tests green
    - Wave-0 file: KarriarHub.test.tsx is created in Task 3 — Task 1 only delivers the hooks/contexts/registry surface
  </action>
  <verify>
    <automated>cd client && npx tsc --noEmit 2>&1 | tail -3 && npm run test:run -- src/hooks/useKarriarHubSummary.test.ts --reporter=dot 2>&1 | tail -5</automated>
  </verify>
  <done>
    - All 7 files exist with correct exports
    - `useKarriarHubSummary.test.ts` has 4 passing tests
    - `getDefaultLayout('karriar')` returns 6 items (no placeholder cv)
    - `getKarriarSections()` returns 3 sections × 2 items each
    - `WIDGET_REGISTRY` contains 6 new entries, all lazy(), `as const` exported
    - `WIDGET_LABELS` exhaustively maps all 14 (8 + 6) widget IDs to Swedish labels
    - `npx tsc --noEmit` zero errors (proves Record exhaustiveness held)
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Build 6 Karriär widgets with empty-state copy + filled-state milestone framing</name>
  <read_first>
    - client/src/components/widgets/CvWidget.tsx (filled-state pattern reference)
    - client/src/components/widgets/InterviewWidget.tsx (sparkline + qualitative-label pattern)
    - client/src/components/widgets/SpontaneousWidget.tsx (S-size simple KPI)
    - client/src/components/widgets/InternationalWidget.tsx (empty-state-only widget reference)
    - client/src/components/widgets/Widget.tsx (Widget.Root/Header/Body/Footer compound API)
    - client/src/components/widgets/__tests__/anti-shaming.test.tsx (extend with 6 new widgets)
    - client/src/hooks/useInterestProfile.ts (Intresseguide widget reads this hook directly per Pitfall F)
    - .planning/phases/02-static-widget-grid/02-UI-SPEC.md §"Empty State Copy Contract"
    - .planning/phases/05-full-hub-coverage-oversikt/05-RESEARCH.md §Karriär (HUB-02) — locked copy strings per widget
  </read_first>
  <behavior>
    For each of 6 widgets — locked tests:
    - Test A (empty): when relevant slice is null/empty, renders empty-state heading + body + CTA copy from <interfaces>
    - Test B (filled): when slice has data, renders milestone-label primary KPI (NEVER raw percentage in 32/22px font-bold slot)
    - Test C (size variants): renders correctly at allowed sizes (S/M for utbildning+linkedin; S/M/L for the others; M/L for kompetensgap)
    - Test D (onHide forwarding — Pitfall B): when editMode=true and onHide passed, hide button appears in header
    Plus extend anti-shaming.test.tsx to include all 6 widgets in the `cases` array — extended test must pass.
  </behavior>
  <files>client/src/components/widgets/CareerGoalWidget.tsx, client/src/components/widgets/CareerGoalWidget.test.tsx, client/src/components/widgets/InterestGuideWidget.tsx, client/src/components/widgets/InterestGuideWidget.test.tsx, client/src/components/widgets/SkillGapWidget.tsx, client/src/components/widgets/SkillGapWidget.test.tsx, client/src/components/widgets/PersonalBrandWidget.tsx, client/src/components/widgets/PersonalBrandWidget.test.tsx, client/src/components/widgets/EducationWidget.tsx, client/src/components/widgets/EducationWidget.test.tsx, client/src/components/widgets/LinkedInWidget.tsx, client/src/components/widgets/LinkedInWidget.test.tsx, client/src/components/widgets/__tests__/anti-shaming.test.tsx</files>
  <action>
    Implement the 6 Karriär widgets. Each is a `lazy()` import target — `export default function {Name}({ id, size, allowedSizes, onSizeChange, editMode, onHide }: WidgetProps)`. Every widget MUST destructure `onHide` and forward it to `<Widget>` (Pitfall B regression rule).

    **Per-widget specifics:**

    **1. `CareerGoalWidget.tsx` — slice: `careerGoals` from useKarriarWidgetData('careerGoals')**
    - Empty (`!data || (!data.shortTerm && !data.longTerm)`): heading "Inga aktiva mål", body "Sätt ditt nästa karriärmål och börja planera", CTA "Skapa mitt karriärmål" → navigate to `/career-plan` (or `/profile/career` — verify by greppning App.tsx for the existing route)
    - Filled M-size: KPI slot shows `data.shortTerm` truncated to ~50 chars (NOT a number, just the goal text). Body line: `data.preferredRoles?.[0]` if set
    - Icon: `Target` from lucide-react. domain="coaching"

    **2. `InterestGuideWidget.tsx` — Pitfall F: reads `useInterestProfile()` directly (not from KarriarDataContext slice)**
    - Empty (`!profile.hasResult`): heading "Utforska dina intressen", body "Ta reda på vilka yrken som matchar dig bäst", CTA "Starta intresseguide" → `/interest-guide`
    - Filled: shows top 1-2 yrken from result. KPI label: "Topp-match" + name. Use `useInterestProfile` hook with its built-in cache
    - Icon: `Compass`

    **3. `SkillGapWidget.tsx` — slice: `latestSkillsAnalysis` (size L by default, allowedSizes M/L)**
    - Empty (`!latestSkillsAnalysis`): heading "Ingen analys gjord", body "Ta reda på vilka kompetenser du behöver för din drömroll", CTA "Gör analys" → `/skills-analysis` (verify route)
    - Filled: heading = `dream_job`. Primary slot: QUALITATIVE label from match_percentage:
      - >= 80: "Mycket nära målet"
      - >= 60: "Nära målet"
      - >= 40: "Bra framsteg"
      - else: "Långt kvar — fortsätt utvecklas"
      Body: top-3 missing skills list (from `skills_comparison.missing` if available, JSONB shape per RESEARCH.md). NEVER render `match_percentage` as text in 32/22px font-bold.
    - Icon: `BarChart3`

    **4. `PersonalBrandWidget.tsx` — slice: `latestBrandAudit` (Pitfall C — PLURAL table)**
    - Empty (`!latestBrandAudit`): heading "Ditt personliga varumärke", body "Gör en audit och se hur starkt ditt varumärke är", CTA "Starta audit" → `/personal-brand`
    - Filled: primary KPI is QUALITATIVE label from score:
      - >= 75: "Starkt varumärke"
      - >= 50: "Bra start"
      - else: "Förbättringsområden"
      Body: "Senaste audit: {locale-formatted date from created_at}". NEVER render score as raw 32/22px text.
    - Icon: `Sparkles`

    **5. `EducationWidget.tsx` — STATIC widget (no slice, no data fetch — RESEARCH.md confirmed)**
    - Always renders the empty-state-style content (heading "Hitta din nästa utbildning", body, CTA "Utforska utbildningar" → `/education-search`)
    - allowedSizes: ['S', 'M']. Icon: `GraduationCap`

    **6. `LinkedInWidget.tsx` — slice: `linkedinUrl` from useKarriarWidgetData('linkedinUrl')**
    - Empty (`!linkedinUrl`): heading "Koppla LinkedIn", body "Lägg till din LinkedIn-URL och optimera din profil", CTA "Lägg till LinkedIn" → `/profile` (verify route — likely the profile-settings page)
    - Filled: heading "LinkedIn", body shows truncated URL or "Profil ansluten", CTA "Optimera din profil" → `/linkedin-optimizer`
    - allowedSizes: ['S', 'M']. Icon: `Linkedin`

    **Compound usage template (apply to ALL 6):**
    ```typescript
    import type { WidgetProps } from './types'
    import { Widget } from './Widget'
    import { Link } from 'react-router-dom'
    import { Target /* etc */ } from 'lucide-react'
    import { useKarriarWidgetData } from './KarriarDataContext'

    export default function CareerGoalWidget({ id, size, allowedSizes, onSizeChange, editMode, onHide }: WidgetProps) {
      const data = useKarriarWidgetData('careerGoals')
      const isEmpty = !data || (!data.shortTerm && !data.longTerm)

      return (
        <Widget id={id} size={size} allowedSizes={allowedSizes} onSizeChange={onSizeChange} editMode={editMode} onHide={onHide}>
          <Widget.Header icon={Target} title="Karriärmål" />
          <Widget.Body>
            {isEmpty ? (
              <>
                <p className="text-[14px] text-[var(--stone-700)] mb-2">
                  Sätt ditt nästa karriärmål och börja planera
                </p>
              </>
            ) : (
              <p className="text-[22px] font-bold text-[var(--stone-900)] leading-tight">
                {data!.shortTerm}
              </p>
            )}
          </Widget.Body>
          {(size === 'M' || size === 'L') && (
            <Widget.Footer>
              <Link to="/career-plan" className="text-[12px] font-bold text-[var(--c-text)] hover:underline">
                {isEmpty ? 'Skapa mitt karriärmål' : 'Öppna karriärplan'} →
              </Link>
            </Widget.Footer>
          )}
        </Widget>
      )
    }
    ```

    **Test pattern (per widget — see CvWidget.test.tsx for direct template):**
    ```typescript
    import { describe, it, expect, vi } from 'vitest'
    import { render, screen } from '@testing-library/react'
    import { MemoryRouter } from 'react-router-dom'
    import { KarriarDataProvider } from './KarriarDataContext'
    import type { KarriarSummary } from './KarriarDataContext'
    import CareerGoalWidget from './CareerGoalWidget'

    function renderWidget(summary: Partial<KarriarSummary>, props = {}) {
      const value: KarriarSummary = {
        careerGoals: null, linkedinUrl: null,
        latestSkillsAnalysis: null, latestBrandAudit: null,
        ...summary,
      }
      return render(
        <MemoryRouter>
          <KarriarDataProvider value={value}>
            <CareerGoalWidget id="karriar-mal" size="M" allowedSizes={['S','M','L']} {...props} />
          </KarriarDataProvider>
        </MemoryRouter>
      )
    }

    describe('CareerGoalWidget', () => {
      it('renders empty state when careerGoals is null', () => {
        renderWidget({})
        expect(screen.getByText(/Sätt ditt nästa karriärmål/)).toBeInTheDocument()
        expect(screen.getByText(/Skapa mitt karriärmål/)).toBeInTheDocument()
      })
      it('renders shortTerm goal when set', () => {
        renderWidget({ careerGoals: { shortTerm: 'Senior UX' } })
        expect(screen.getByText('Senior UX')).toBeInTheDocument()
      })
      it('forwards onHide to Widget — hide button appears in editMode', () => {
        renderWidget({}, { editMode: true, onHide: vi.fn() })
        expect(screen.getByRole('button', { name: /Dölj widget/ })).toBeInTheDocument()
      })
    })
    ```

    **Anti-shaming extension:** edit `client/src/components/widgets/__tests__/anti-shaming.test.tsx`. The 6 widgets need to be renderable with their own provider. Two options — pick the simpler:
    - Option A (preferred): Add 6 new test cases that render each Karriär widget inside `KarriarDataProvider` with both fixture (filled with non-trivial data) and verify no `\d+%` appears in 32px/22px font-bold elements. Use the same `isPrimaryKPI` helper.
    - Option B: Create a sibling test file `anti-shaming-karriar.test.tsx` with the same helper and Karriar fixtures.

    Choose Option A — keep the anti-shaming guard in one canonical place.

    **Verification:**
    - `cd client && npm run test:run -- src/components/widgets/CareerGoalWidget.test.tsx src/components/widgets/InterestGuideWidget.test.tsx src/components/widgets/SkillGapWidget.test.tsx src/components/widgets/PersonalBrandWidget.test.tsx src/components/widgets/EducationWidget.test.tsx src/components/widgets/LinkedInWidget.test.tsx` — all green
    - `cd client && npm run test:run -- src/components/widgets/__tests__/anti-shaming.test.tsx` — extended green
    - `cd client && npx tsc --noEmit` — zero errors
  </action>
  <verify>
    <automated>cd client && npm run test:run -- src/components/widgets/CareerGoalWidget.test.tsx src/components/widgets/InterestGuideWidget.test.tsx src/components/widgets/SkillGapWidget.test.tsx src/components/widgets/PersonalBrandWidget.test.tsx src/components/widgets/EducationWidget.test.tsx src/components/widgets/LinkedInWidget.test.tsx src/components/widgets/__tests__/anti-shaming.test.tsx --reporter=dot 2>&1 | tail -5</automated>
  </verify>
  <done>
    - All 6 widget files exist as default exports
    - All 6 widget test files have 3+ tests passing per widget
    - Anti-shaming test extended and passing for the 6 new widgets (no `\d+%` in 32/22px font-bold elements)
    - All 6 widgets destructure and forward `onHide` (verifiable via test or grep `onHide={onHide}` returning 6+ matches)
    - All 6 widgets render correctly at the smallest size in their allowedSizes
    - `npx tsc --noEmit` zero errors
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 3: Wire KarriarHub.tsx with full provider stack + integration tests (α–λ)</name>
  <read_first>
    - client/src/pages/hubs/JobsokHub.tsx (180-line wiring template — copy verbatim, swap hub-id strings)
    - client/src/pages/hubs/__tests__/JobsokHub.test.tsx (24-test integration suite — copy verbatim, swap mocks for Karriär)
    - .planning/phases/04-layout-persistence-hide-show/04-04-jobsokhub-wiring-and-integration-tests-SUMMARY.md "Pattern for Phase 5 Replication" (8-step recipe)
    - client/src/pages/hubs/KarriarHub.tsx (current Phase 2 stub — to be REPLACED entirely)
    - .planning/phases/05-full-hub-coverage-oversikt/05-VALIDATION.md §"Per-widget test-kontrakt" (α-λ test list)
  </read_first>
  <behavior>
    Integration tests in client/src/pages/hubs/__tests__/KarriarHub.test.tsx mirror JobsokHub.test.tsx:
    - α: "Anpassa vy" button renders in PageLayout actions slot
    - β: aria-pressed toggles editMode on click
    - γ: 6 hide-buttons appear in edit mode (one per widget)
    - δ: hiding a widget removes it from grid (CUST-01 reused)
    - ε: Återvisa-button in panel restores hidden widget (CUST-01 reused)
    - ζ: Återställ button opens ConfirmDialog (CUST-02 reused)
    - η: confirming reset restores all 6 widgets (CUST-02 reused)
    - θ: cancelling reset leaves layout unchanged (CUST-02 reused)
    - ι: upsert payload contains hub_id='karriar' and breakpoint='desktop'
    - κ: with mocked fetch, all 6 widget icons render (HUB-02 acceptance)
    - λ: aria-live announces "Widget Karriärmål dold" when hideWidget('karriar-mal') runs
  </behavior>
  <files>client/src/pages/hubs/KarriarHub.tsx, client/src/pages/hubs/__tests__/KarriarHub.test.tsx</files>
  <action>
    Replace the Phase 2 stub `client/src/pages/hubs/KarriarHub.tsx` with full Phase 3+4 wiring.

    **Wiring template (copy from JobsokHub.tsx — exact 8-step adapt per 04-04-SUMMARY.md):**

    ```typescript
    import { useCallback, useMemo, useState } from 'react'
    import { useTranslation } from 'react-i18next'
    import { SlidersHorizontal } from 'lucide-react'
    import { PageLayout } from '@/components/layout/PageLayout'
    import { HubGrid } from '@/components/widgets/HubGrid'
    import { WIDGET_REGISTRY, type WidgetId } from '@/components/widgets/registry'
    import { getKarriarSections, getDefaultLayout } from '@/components/widgets/defaultLayouts'
    import type { WidgetSize, WidgetLayoutItem } from '@/components/widgets/types'
    import { useKarriarHubSummary } from '@/hooks/useKarriarHubSummary'
    import { KarriarDataProvider } from '@/components/widgets/KarriarDataContext'
    import { KarriarLayoutProvider, type KarriarLayoutValue } from '@/components/widgets/KarriarLayoutContext'
    import { HiddenWidgetsPanel } from '@/components/widgets/HiddenWidgetsPanel'
    import { WIDGET_LABELS } from '@/components/widgets/widgetLabels'
    import { useWidgetLayout } from '@/hooks/useWidgetLayout'
    import { useBreakpoint } from '@/hooks/useBreakpoint'

    const HUB_ID = 'karriar' as const

    export default function KarriarHub() {
      const { t } = useTranslation()
      const sections = useMemo(() => getKarriarSections(), [])
      const breakpoint = useBreakpoint()

      const { layout, isLoading, saveDebounced, save } = useWidgetLayout(HUB_ID)

      const [editMode, setEditMode] = useState(false)
      const [panelOpen, setPanelOpen] = useState(false)
      const [announcement, setAnnouncement] = useState('')

      const effectiveLayout = useMemo(
        () => (layout.length > 0 ? layout : getDefaultLayout(HUB_ID, breakpoint)),
        [layout, breakpoint]
      )

      const layoutById = useMemo(() => {
        const m = new Map<string, WidgetLayoutItem>()
        for (const item of effectiveLayout) m.set(item.id, item)
        return m
      }, [effectiveLayout])

      const hideWidget = useCallback((id: string) => {
        const next = effectiveLayout.map(w => w.id === id ? { ...w, visible: false } : w)
        saveDebounced(next)
        const label = WIDGET_LABELS[id as WidgetId] ?? id
        setAnnouncement(`Widget ${label} dold`)
      }, [effectiveLayout, saveDebounced])

      const showWidget = useCallback((id: string) => {
        const next = effectiveLayout.map(w => w.id === id ? { ...w, visible: true } : w)
        saveDebounced(next)
        const label = WIDGET_LABELS[id as WidgetId] ?? id
        setAnnouncement(`Widget ${label} återvisad`)
      }, [effectiveLayout, saveDebounced])

      const updateSize = useCallback((id: string, size: WidgetSize) => {
        const next = effectiveLayout.map(w => w.id === id ? { ...w, size } : w)
        saveDebounced(next)
        setAnnouncement(`Widgeten är nu ${size}-storlek.`)
      }, [effectiveLayout, saveDebounced])

      const resetLayout = useCallback(() => {
        const fresh = getDefaultLayout(HUB_ID, breakpoint)
        save(fresh)
        setAnnouncement('Layout återställd')
      }, [breakpoint, save])

      const layoutValue: KarriarLayoutValue = useMemo(() => ({
        layout: effectiveLayout, editMode, setEditMode,
        hideWidget, showWidget, updateSize, resetLayout, isLoading,
      }), [effectiveLayout, editMode, hideWidget, showWidget, updateSize, resetLayout, isLoading])

      const { data: summary } = useKarriarHubSummary()

      const customizeButton = (
        <button
          type="button"
          onClick={() => { setEditMode(p => !p); setPanelOpen(p => !p) }}
          aria-pressed={editMode}
          aria-expanded={panelOpen}
          aria-controls="hidden-widgets-panel"
          className={[
            'inline-flex items-center gap-2 px-3 py-1.5',
            'text-[13px] font-bold rounded-[8px] border',
            editMode
              ? 'bg-[var(--c-bg)] text-[var(--c-text)] border-[var(--c-solid)]'
              : 'bg-transparent text-[var(--header-text)] border-[var(--header-border)]',
            'hover:bg-[var(--c-bg)] hover:text-[var(--c-text)]',
            'focus:outline-none focus:shadow-[0_0_0_3px_var(--header-bg),0_0_0_4px_var(--c-solid)]',
            'cursor-pointer',
          ].join(' ')}
        >
          <SlidersHorizontal size={14} aria-hidden="true" />
          Anpassa vy
        </button>
      )

      return (
        <PageLayout
          title={t('nav.hubs.karriar', 'Karriär')}
          subtitle={t('hubs.karriar.subtitle', 'Utveckla din karriär — utforska intressen, sätt mål och bygg ditt varumärke')}
          domain="coaching"
          showTabs={false}
          actions={customizeButton}
        >
          <KarriarLayoutProvider value={layoutValue}>
            <KarriarDataProvider value={summary}>
              <div role="status" aria-live="polite" className="sr-only">{announcement}</div>

              <div className="relative" id="hidden-widgets-panel">
                <HiddenWidgetsPanel
                  isOpen={panelOpen}
                  onClose={() => setPanelOpen(false)}
                  layout={effectiveLayout}
                  onShowWidget={showWidget}
                  onResetLayout={resetLayout}
                />
              </div>

              {sections.map(section => (
                <HubGrid.Section key={section.title} title={section.title}>
                  {section.items.map(item => {
                    const entry = WIDGET_REGISTRY[item.id as WidgetId]
                    if (!entry) return null
                    const Component = entry.component
                    const persisted = layoutById.get(item.id)
                    const currentSize: WidgetSize = persisted?.size ?? entry.defaultSize
                    const isVisible = persisted?.visible !== false

                    return (
                      <HubGrid.Slot key={item.id} size={currentSize} visible={isVisible}>
                        <Component
                          id={item.id}
                          size={currentSize}
                          onSizeChange={(newSize) => updateSize(item.id, newSize)}
                          allowedSizes={entry.allowedSizes}
                          editMode={editMode}
                          onHide={() => hideWidget(item.id)}
                        />
                      </HubGrid.Slot>
                    )
                  })}
                </HubGrid.Section>
              ))}
            </KarriarDataProvider>
          </KarriarLayoutProvider>
        </PageLayout>
      )
    }
    ```

    **Integration test file (`client/src/pages/hubs/__tests__/KarriarHub.test.tsx`):** Copy `JobsokHub.test.tsx` verbatim and adapt:
    - Mock `useKarriarHubSummary` instead of `useJobsokHubSummary`. STUB_SUMMARY:
      ```typescript
      const STUB_SUMMARY = {
        careerGoals: { shortTerm: 'Senior UX' }, linkedinUrl: null,
        latestSkillsAnalysis: null, latestBrandAudit: null,
      }
      vi.mock('@/hooks/useKarriarHubSummary', () => ({
        useKarriarHubSummary: () => ({ data: STUB_SUMMARY, isLoading: false, isError: false }),
        KARRIAR_HUB_KEY: (id: string) => ['hub', 'karriar', id],
      }))
      ```
    - Replace `<JobsokHub />` import with `<KarriarHub />` and route `/karriar` in MemoryRouter
    - Test γ expectation: 6 hide-buttons (was 8 for Jobsok)
    - Test ι expectation: upsert payload includes `hub_id: 'karriar'`
    - Test λ expectation: aria-live text contains `Karriärmål dold` (instead of `Mitt CV dold`)
    - Other tests (α, β, δ, ε, ζ, η, θ, κ): identical structure, just hub-id swap
    - Suspense fallback: same handling as JobsokHub.test (lazy widgets need Suspense — `screen.findByText` waits for them naturally)

    Run all KarriarHub.test.tsx tests under quick subset.

    **Suspense note:** lazy() widgets render inside Suspense (HubGrid wraps each Slot — verify in HubGrid.tsx). If tests fail with "fallback rendering", import HubGrid pattern from JobsokHub.test.tsx (uses `findBy*` instead of `getBy*` for the first widget assertion).

    **Verification:**
    - `cd client && npm run test:run -- src/pages/hubs/__tests__/KarriarHub.test.tsx` — α-λ pass
    - `cd client && npm run test:run -- src/pages/hubs/__tests__/JobsokHub.test.tsx` — REGRESSION: still 24/24 green (no Phase 4 break)
    - `cd client && npx tsc --noEmit` — zero errors
    - Smoke run: `cd client && npm run build` — zero errors (production bundle still tree-shakes correctly with 6 new lazy widgets)
  </action>
  <verify>
    <automated>cd client && npm run test:run -- src/pages/hubs/__tests__/KarriarHub.test.tsx src/pages/hubs/__tests__/JobsokHub.test.tsx --reporter=dot 2>&1 | tail -5</automated>
  </verify>
  <done>
    - KarriarHub.tsx is the full wiring (~180 lines, mirroring JobsokHub.tsx) — Phase 2 stub gone
    - 11 integration tests (α-λ) pass for KarriarHub
    - JobsokHub regression suite (24 tests) all green
    - npm run build succeeds
    - All 6 Karriär widgets render in the page; layout persistence + hide/show work end-to-end
    - HUB-02 acceptance: KarriarHub renders 6 widgets with real Supabase data (mocked summary in tests proves the wiring)
  </done>
</task>

</tasks>

<verification>
- `npm run test:run -- src/hooks/useKarriarHubSummary.test.ts src/components/widgets/CareerGoalWidget.test.tsx src/components/widgets/InterestGuideWidget.test.tsx src/components/widgets/SkillGapWidget.test.tsx src/components/widgets/PersonalBrandWidget.test.tsx src/components/widgets/EducationWidget.test.tsx src/components/widgets/LinkedInWidget.test.tsx src/components/widgets/__tests__/anti-shaming.test.tsx src/pages/hubs/__tests__/KarriarHub.test.tsx src/pages/hubs/__tests__/JobsokHub.test.tsx` — all green
- `grep -c "lazy(() => import('./" client/src/components/widgets/registry.ts` — at least 14 (8 + 6) lazy entries
- `grep -E "^[a-z'-]+:\s+'" client/src/components/widgets/widgetLabels.ts | wc -l` — at least 14 entries
- `grep -E "(useJobsokLayout|JobsokLayoutValue|JobsokLayoutProvider)" client/src/components/widgets/KarriarLayoutContext.tsx client/src/pages/hubs/KarriarHub.tsx` — 0 matches (no leak from copy-rename)
- `npx tsc --noEmit` — zero errors
- `npm run build` — successful (bundle contract intact)
</verification>

<success_criteria>
- HUB-02 fulfilled: KarriarHub renders 6 widgets backed by real Supabase data (Karriärmål, Intresseguide, Kompetensgap, Personligt varumärke, Utbildning, LinkedIn)
- Layout persistence + hide/show work on Karriär using same hook and panel as Jobsok (CUST-01..03 reused)
- Bundle contract preserved: all 6 widgets lazy() — verify-widget-chunks.cjs script (Phase 2) still passes
- Anti-shaming guard extended: no widget renders raw `\d+%` in primary KPI slot
- Empty-state copy locked from RESEARCH.md — verifiable in widget tests
- Phase 4 regression suite (JobsokHub 24 tests) all green
</success_criteria>

<output>
After completion, create `.planning/phases/05-full-hub-coverage-oversikt/05-02-karriar-hub-SUMMARY.md` documenting: (a) hub-summary loader query plan + cache writes, (b) 6 widgets implemented (each with empty + filled copy), (c) integration test count (α-λ), (d) any deviations from JobsokHub-template (route URLs, edge cases), (e) replication-recipe-confirmation: "Plans 03-04 may copy this plan structure verbatim swapping hub_id and widget_set".
</output>
