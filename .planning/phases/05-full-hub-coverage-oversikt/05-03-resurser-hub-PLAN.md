---
phase: 05-full-hub-coverage-oversikt
plan: 03
type: execute
wave: 3
depends_on: [05-02-karriar-hub-PLAN]
files_modified:
  - client/src/hooks/useResurserHubSummary.ts
  - client/src/hooks/useResurserHubSummary.test.ts
  - client/src/components/widgets/ResurserDataContext.tsx
  - client/src/components/widgets/ResurserLayoutContext.tsx
  - client/src/components/widgets/MyDocumentsWidget.tsx
  - client/src/components/widgets/MyDocumentsWidget.test.tsx
  - client/src/components/widgets/KnowledgeBaseWidget.tsx
  - client/src/components/widgets/KnowledgeBaseWidget.test.tsx
  - client/src/components/widgets/ExternalResourcesWidget.tsx
  - client/src/components/widgets/ExternalResourcesWidget.test.tsx
  - client/src/components/widgets/PrintResourcesWidget.tsx
  - client/src/components/widgets/PrintResourcesWidget.test.tsx
  - client/src/components/widgets/AITeamWidget.tsx
  - client/src/components/widgets/AITeamWidget.test.tsx
  - client/src/components/widgets/ExercisesWidget.tsx
  - client/src/components/widgets/ExercisesWidget.test.tsx
  - client/src/components/widgets/registry.ts
  - client/src/components/widgets/widgetLabels.ts
  - client/src/components/widgets/defaultLayouts.ts
  - client/src/components/widgets/__tests__/anti-shaming.test.tsx
  - client/src/pages/hubs/ResurserHub.tsx
  - client/src/pages/hubs/__tests__/ResurserHub.test.tsx
autonomous: true
requirements: [HUB-03]
must_haves:
  truths:
    - "useResurserHubSummary fires Promise.all of supabase selects for cvs+cover_letters (deep-link cache shared with JobsokHub) + article_reading_progress + ai_team_sessions; returns ResurserSummary"
    - "ResurserHub.tsx renders 6 widgets (Mina dokument, Kunskapsbank, Externa resurser, Utskriftsmaterial, AI-team, Övningar) inside ResurserLayoutProvider OUTER → ResurserDataProvider INNER"
    - "Layout persistence works on Resurser — hide widget, reload page, widget still hidden (CUST-03 reused via useWidgetLayout('resurser'))"
    - "Static-content widgets (Externa resurser, Utskriftsmaterial) render without DataContext data — never crash on missing slice"
    - "Övningar widget falls back to static-content per Pitfall G if 05-DB-DISCOVERY.md confirms no exercise_progress table — verify against discovery output"
    - "Anti-shaming guard extended: no Resurser widget renders raw \\d+% in primary KPI slot"
    - "All 6 Resurser widgets are lazy() in WIDGET_REGISTRY (bundle contract preserved)"
  artifacts:
    - path: "client/src/hooks/useResurserHubSummary.ts"
      provides: "Hub-summary loader for Resurser"
      exports: ["useResurserHubSummary", "RESURSER_HUB_KEY"]
    - path: "client/src/components/widgets/ResurserDataContext.tsx"
      provides: "Data context — ResurserSummary shape"
      exports: ["ResurserDataProvider", "useResurserWidgetData", "useResurserSummary", "ResurserSummary"]
    - path: "client/src/components/widgets/ResurserLayoutContext.tsx"
      provides: "Layout context for Resurser hub"
      exports: ["ResurserLayoutProvider", "useResurserLayout", "ResurserLayoutValue"]
    - path: "client/src/pages/hubs/ResurserHub.tsx"
      provides: "Hub page replacing Phase 2 stub — full Phase 3+4 wiring"
      contains: "ResurserLayoutProvider"
  key_links:
    - from: "client/src/pages/hubs/ResurserHub.tsx"
      to: "client/src/hooks/useResurserHubSummary.ts"
      via: "imports + uses summary"
      pattern: "useResurserHubSummary\\("
    - from: "client/src/pages/hubs/ResurserHub.tsx"
      to: "client/src/components/widgets/HiddenWidgetsPanel.tsx"
      via: "passes layout/showWidget/resetLayout as props"
      pattern: "<HiddenWidgetsPanel[\\s\\S]*?layout=\\{"
    - from: "client/src/hooks/useResurserHubSummary.ts"
      to: "['cv-versions'] + ['cover-letters'] cache keys (shared with JobsokHub)"
      via: "queryClient.setQueryData after Promise.all resolves"
      pattern: "setQueryData\\(\\[(?:'cv-versions'|'cover-letters')"
---

<objective>
Wire the full Resurser hub: 6 lazy-loaded widgets backed by hybrid data (Supabase loaders for documents/articles/AI-team; static content for external resources/print/optionally exercises), with layout persistence/hide-show replicating Plan 02's pattern verbatim. Same recipe as Plan 02 — different hub-id, different widget set, different data sources.

Purpose: Resurser is currently a Phase 2 stub. After this plan, ResurserHub renders Mina dokument / Kunskapsbank / Externa resurser / Utskriftsmaterial / AI-team / Övningar — fulfilling HUB-03.

Output: One hub-summary loader, two contexts, 6 widgets, registry/labels/defaultLayouts extensions, fully-wired ResurserHub page, integration test suite. All tests green, zero TS errors, zero new npm dependencies.
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
@.planning/phases/02-static-widget-grid/02-UI-SPEC.md
@client/src/hooks/useKarriarHubSummary.ts
@client/src/components/widgets/KarriarDataContext.tsx
@client/src/components/widgets/KarriarLayoutContext.tsx
@client/src/components/widgets/registry.ts
@client/src/components/widgets/widgetLabels.ts
@client/src/components/widgets/defaultLayouts.ts
@client/src/components/widgets/types.ts
@client/src/components/widgets/HiddenWidgetsPanel.tsx
@client/src/components/widgets/Widget.tsx
@client/src/pages/hubs/KarriarHub.tsx
@client/src/pages/hubs/__tests__/KarriarHub.test.tsx
@client/src/pages/hubs/ResurserHub.tsx
@client/src/hooks/useDocuments.ts
@client/src/hooks/knowledge-base/useArticles.ts

<interfaces>
<!-- Plan 03 follows the EXACT same shape as Plan 02 (Karriär). The replication recipe is locked. -->
<!-- DO NOT re-derive the hub-loader / context / hub-page architecture — copy from Plan 02 mechanically. -->

<!-- Resurser data shape (locked from RESEARCH.md §Resurser HUB-03 widget-data-mapping): -->
```typescript
// client/src/components/widgets/ResurserDataContext.tsx
export interface ResurserSummary {
  // Mina dokument — same data as JobsokHub but Resurser is the "documents canonical hub"
  cv: { id: string; updated_at: string } | null
  coverLetters: Array<{ id: string; title?: string; created_at: string }>
  // Kunskapsbank — article_reading_progress
  recentArticles: Array<{ article_id: string; progress_percent: number; is_completed: boolean; completed_at: string | null }>
  articleCompletedCount: number
  // AI-team — ai_team_sessions
  aiTeamSessions: Array<{ agent_id: string; updated_at: string }>
  aiTeamSessionCount: number
  // Externa resurser, Utskriftsmaterial, Övningar (if no progress table) — static, no slice needed
}
```

<!-- Resurser hub-loader (3 SELECTs minimum, possibly 4 if exercise_progress exists per 05-DB-DISCOVERY.md): -->
```typescript
// client/src/hooks/useResurserHubSummary.ts
export const RESURSER_HUB_KEY = (userId: string) => ['hub', 'resurser', userId] as const

export function useResurserHubSummary() {
  const { user } = useAuth()
  const userId = user?.id ?? ''
  const queryClient = useQueryClient()

  return useQuery<ResurserSummary>({
    queryKey: RESURSER_HUB_KEY(userId),
    enabled: !!userId,
    staleTime: 60_000,
    queryFn: async () => {
      const [cvR, lettersR, articlesR, aiTeamR] = await Promise.all([
        supabase.from('cvs').select('id, updated_at').eq('user_id', userId).maybeSingle(),
        supabase.from('cover_letters').select('id, title, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(3),
        supabase.from('article_reading_progress')
          .select('article_id, progress_percent, is_completed, completed_at')
          .eq('user_id', userId)
          .order('completed_at', { ascending: false, nullsFirst: false })
          .limit(3),
        supabase.from('ai_team_sessions')
          .select('agent_id, updated_at')
          .eq('user_id', userId)
          .order('updated_at', { ascending: false })
          .limit(5),
      ])
      // Filter completed-only for the count (is_completed = true)
      const articleCompletedCount = (articlesR.data ?? []).filter(a => a.is_completed).length
      const summary: ResurserSummary = {
        cv: cvR.data ?? null,
        coverLetters: lettersR.data ?? [],
        recentArticles: articlesR.data ?? [],
        articleCompletedCount,
        aiTeamSessions: aiTeamR.data ?? [],
        aiTeamSessionCount: (aiTeamR.data ?? []).length,
      }
      // Deep-link cache sync — share cv/cover-letters with JobsokHub's loader (queryKeys are the same)
      queryClient.setQueryData(['cv-versions'], summary.cv ? [summary.cv] : [])
      queryClient.setQueryData(['cover-letters'], summary.coverLetters)
      return summary
    },
  })
}
```

<!-- Default layout for resurser (REPLACES the placeholder { id: 'cv', size: 'S', ... }): -->
```typescript
// In getDefaultLayout — desktop record:
resurser: [
  { id: 'mina-dokument',     size: 'M', order: 0, visible: true },
  { id: 'kunskapsbanken',    size: 'M', order: 1, visible: true },
  { id: 'externa-resurser',  size: 'S', order: 2, visible: true },
  { id: 'utskriftsmaterial', size: 'S', order: 3, visible: true },
  { id: 'ai-team',           size: 'L', order: 4, visible: true },
  { id: 'ovningar',          size: 'M', order: 5, visible: true },
],
```

<!-- Sections for Resurser (3 sections): -->
```typescript
export function getResurserSections(): SectionedLayout[] {
  const all = getDefaultLayout('resurser')
  return [
    { title: 'Mina',         items: all.slice(0, 2) },  // Dokument, Kunskapsbank
    { title: 'Bibliotek',    items: all.slice(2, 4) },  // Externa, Utskriftsmaterial
    { title: 'Vägledning',   items: all.slice(4, 6) },  // AI-team, Övningar
  ]
}
```

<!-- Registry additions (lazy()): -->
```typescript
'mina-dokument':     { component: lazy(() => import('./MyDocumentsWidget')),       defaultSize: 'M', allowedSizes: ['S', 'M', 'L'] },
kunskapsbanken:      { component: lazy(() => import('./KnowledgeBaseWidget')),     defaultSize: 'M', allowedSizes: ['S', 'M', 'L'] },
'externa-resurser':  { component: lazy(() => import('./ExternalResourcesWidget')), defaultSize: 'S', allowedSizes: ['S', 'M'] },
utskriftsmaterial:   { component: lazy(() => import('./PrintResourcesWidget')),    defaultSize: 'S', allowedSizes: ['S', 'M'] },
'ai-team':           { component: lazy(() => import('./AITeamWidget')),            defaultSize: 'L', allowedSizes: ['M', 'L'] },
ovningar:            { component: lazy(() => import('./ExercisesWidget')),         defaultSize: 'M', allowedSizes: ['S', 'M'] },
```

<!-- Label additions: -->
```
'mina-dokument':     'Mina dokument',
kunskapsbanken:      'Kunskapsbanken',
'externa-resurser':  'Externa resurser',
utskriftsmaterial:   'Utskriftsmaterial',
'ai-team':           'AI-team',
ovningar:            'Övningar',
```

<!-- Empty-state copy (LOCKED from RESEARCH.md): -->
```
Mina dokument: "Inga dokument ännu" / "Skapa ditt CV och dina personliga brev" / "Gå till Söka jobb" → /soka-jobb
Kunskapsbanken: "Utforska kunskapsbanken" / "Läs guider och tips för en mer effektiv jobbsökning" / "Bläddra i kunskapsbanken" → /knowledge-base
AI-team: "Ditt AI-team väntar" / "Chatta med din karriärcoach, studievägledare eller motivationscoach" / "Möt ditt AI-team" → /ai-team
Övningar (when no progress table): "Träna och öva" / "Öva på intervjufärdigheter, presentationsteknik och mer" / "Se alla övningar" → /exercises
Externa resurser: STATIC widget — never empty. Renders curated list of external resources (AF, Jobtech, etc.) at all sizes.
Utskriftsmaterial: STATIC widget — never empty. Renders printable templates list with download links.
```

<!-- Filled-state framing (milestone-style, never raw percentages): -->
```
Mina dokument:  "CV + 3 brev klara"  (label-style, NOT a percentage)
Kunskapsbanken: "{count} artiklar lästa"  (label, not progress%)
AI-team:        "Senast: {agent_name}"   (qualitative)
Övningar:       (only filled if discovery turned up exercise progress — otherwise static-content)
```

<!-- Resurser hub deep-link routes (verify against navigation.ts):
       Mina dokument → '/soka-jobb' (or '/cv') — pick the documents-management entry
       Kunskapsbanken → '/knowledge-base'
       Externa resurser → external links per item (no internal route)
       Utskriftsmaterial → external download links or '/print-templates'
       AI-team → '/ai-team'
       Övningar → '/exercises'
-->

<!-- Anti-shaming extension: same as Plan 02 — add 6 new cases to anti-shaming.test.tsx. -->
<!-- Provider in test: ResurserDataProvider with full ResurserSummary fixture (filled). -->
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Hub plumbing — useResurserHubSummary loader + ResurserDataContext + ResurserLayoutContext + registry/labels/defaultLayouts extensions</name>
  <read_first>
    - client/src/hooks/useKarriarHubSummary.ts (Plan 02 template — copy + replace selects)
    - client/src/components/widgets/KarriarDataContext.tsx (Plan 02 template — replace KarriarSummary with ResurserSummary)
    - client/src/components/widgets/KarriarLayoutContext.tsx (Plan 02 template — verbatim copy + rename)
    - .planning/phases/05-full-hub-coverage-oversikt/05-DB-DISCOVERY.md §"article_reading_progress", §"ai_team_sessions", §"Exercises tables"
    - client/src/components/widgets/defaultLayouts.ts (post-Plan-02 state — extension target)
    - client/src/components/widgets/registry.ts (post-Plan-02 state — extension target)
    - client/src/components/widgets/widgetLabels.ts (post-Plan-02 state — extension target)
  </read_first>
  <behavior>
    - Test 1: useResurserHubSummary fires Promise.all of 4 selects (cvs, cover_letters, article_reading_progress, ai_team_sessions) on mount
    - Test 2: Returns ResurserSummary with cv/coverLetters/recentArticles/aiTeamSessions populated from fixture
    - Test 3: setQueryData called with ['cv-versions'] and ['cover-letters'] — proves cache sharing with JobsokHub (single source of truth for documents)
    - Test 4: articleCompletedCount counts only is_completed=true rows
  </behavior>
  <files>client/src/hooks/useResurserHubSummary.ts, client/src/hooks/useResurserHubSummary.test.ts, client/src/components/widgets/ResurserDataContext.tsx, client/src/components/widgets/ResurserLayoutContext.tsx, client/src/components/widgets/registry.ts, client/src/components/widgets/widgetLabels.ts, client/src/components/widgets/defaultLayouts.ts</files>
  <action>
    Apply Plan 02's exact recipe with Resurser names + Resurser data shape.

    **A. `ResurserDataContext.tsx`** — copy `KarriarDataContext.tsx`, replace `KarriarSummary` with `ResurserSummary` (interface from <interfaces> above), rename context/provider/hooks (Karriar→Resurser).

    **B. `ResurserLayoutContext.tsx`** — verbatim copy of `KarriarLayoutContext.tsx` with rename Karriar→Resurser.

    **C. `useResurserHubSummary.ts`** — implement per <interfaces> code block. The 4-select Promise.all + setQueryData for cv/cover-letters cache sharing.

    **D. `useResurserHubSummary.test.ts`** — copy `useKarriarHubSummary.test.ts` template. Replace fixtures:
    - cvs: `{ id: 'cv-r', updated_at: '2026-04-25' }`
    - cover_letters: `[{ id: 'cl-r', title: 'Spotify', created_at: '2026-04-26' }]`
    - article_reading_progress: `[{ article_id: 'a1', progress_percent: 100, is_completed: true, completed_at: '2026-04-20' }, { article_id: 'a2', progress_percent: 60, is_completed: false, completed_at: null }]`
    - ai_team_sessions: `[{ agent_id: 'career-coach', updated_at: '2026-04-25' }]`
    Add Test 3 asserting `_qc.getQueryData(['cv-versions'])` and `_qc.getQueryData(['cover-letters'])` are populated.
    Add Test 4 asserting `result.current.data.articleCompletedCount === 1`.

    **E. `defaultLayouts.ts`** — REPLACE the `resurser:` placeholder with the 6-widget array. APPEND `getResurserSections()`.

    **F. `registry.ts`** — APPEND 6 lazy entries (block above). Order after Karriär block.

    **G. `widgetLabels.ts`** — EXTEND with 6 new labels (block above). TypeScript will enforce exhaustiveness across the now-20-key Record.

    Verification: `npx tsc --noEmit` zero, `npm run test:run -- src/hooks/useResurserHubSummary.test.ts` 4 tests green.
  </action>
  <verify>
    <automated>cd client && npx tsc --noEmit 2>&1 | tail -3 && npm run test:run -- src/hooks/useResurserHubSummary.test.ts --reporter=dot 2>&1 | tail -5</automated>
  </verify>
  <done>
    - All 7 files exist
    - `useResurserHubSummary.test.ts` has 4 passing tests including cache-sharing assertion
    - `getDefaultLayout('resurser')` returns 6 items
    - `getResurserSections()` returns 3 sections
    - `WIDGET_REGISTRY` extended (now 20 entries: 8 Jobsok + 6 Karriar + 6 Resurser)
    - `WIDGET_LABELS` exhaustively maps all 20 widget IDs
    - npx tsc --noEmit zero errors
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Build 6 Resurser widgets (3 data-backed + 2 static-content + 1 conditional)</name>
  <read_first>
    - client/src/components/widgets/CareerGoalWidget.tsx (Plan 02 widget template)
    - client/src/components/widgets/EducationWidget.tsx (Plan 02 static-content widget reference for Externa resurser / Utskriftsmaterial)
    - client/src/components/widgets/CvWidget.tsx (M+L size with footer pattern)
    - client/src/components/widgets/__tests__/anti-shaming.test.tsx (extend with 6 new widgets)
    - .planning/phases/05-full-hub-coverage-oversikt/05-DB-DISCOVERY.md §"Exercises tables" (decides Övningar widget mode)
    - .planning/phases/05-full-hub-coverage-oversikt/05-RESEARCH.md §Resurser (HUB-03) — locked copy + Pitfall G
  </read_first>
  <behavior>
    Per widget — minimum 3 tests each:
    - Test A (empty/static): renders heading + body + CTA matching locked copy from <interfaces>
    - Test B (filled or full-static): if data slice exists, renders milestone label; if static, renders curated list
    - Test C (onHide forwarding — Pitfall B): editMode=true + onHide passed → hide button appears
    Plus extend anti-shaming.test.tsx — add 6 cases. Filled fixture for ResurserDataProvider in tests.
  </behavior>
  <files>client/src/components/widgets/MyDocumentsWidget.tsx, client/src/components/widgets/MyDocumentsWidget.test.tsx, client/src/components/widgets/KnowledgeBaseWidget.tsx, client/src/components/widgets/KnowledgeBaseWidget.test.tsx, client/src/components/widgets/ExternalResourcesWidget.tsx, client/src/components/widgets/ExternalResourcesWidget.test.tsx, client/src/components/widgets/PrintResourcesWidget.tsx, client/src/components/widgets/PrintResourcesWidget.test.tsx, client/src/components/widgets/AITeamWidget.tsx, client/src/components/widgets/AITeamWidget.test.tsx, client/src/components/widgets/ExercisesWidget.tsx, client/src/components/widgets/ExercisesWidget.test.tsx, client/src/components/widgets/__tests__/anti-shaming.test.tsx</files>
  <action>
    Implement 6 widgets following the Plan 02 widget pattern. Every widget destructures `onHide` from WidgetProps and forwards to `<Widget>`.

    **1. `MyDocumentsWidget.tsx` — slice: `cv` + `coverLetters`**
    - Empty (`!cv && coverLetters.length === 0`): heading "Inga dokument ännu", body "Skapa ditt CV och dina personliga brev", CTA "Gå till Söka jobb" → `/soka-jobb`
    - Filled: heading "Mina dokument", primary body line `{cv ? 'CV' : 'Inget CV'} + {n} brev klara` (NEVER a percentage). Optional last update line at 12px text body
    - Icon: `FileText`. allowedSizes ['S','M','L']

    **2. `KnowledgeBaseWidget.tsx` — slice: `recentArticles` + `articleCompletedCount`**
    - Empty (`recentArticles.length === 0`): heading "Utforska kunskapsbanken", body "Läs guider och tips för en mer effektiv jobbsökning", CTA "Bläddra i kunskapsbanken" → `/knowledge-base` (verify route)
    - Filled: heading "Kunskapsbanken", primary slot "{articleCompletedCount} artiklar lästa", body "Senast: {recentArticles[0].article_id} ({locale-formatted completed_at})". Truncate article_id at 40 chars (it's a slug or UUID — replace with title fetch in v1.1; document this limitation in Footer comment)
    - Icon: `BookOpen`. allowedSizes ['S','M','L']

    **3. `ExternalResourcesWidget.tsx` — STATIC content (no slice)**
    - Always renders a 3-4 item curated list at S/M size. Pre-defined items as a const array inside the component:
      ```typescript
      const EXTERNAL_LINKS = [
        { label: 'Arbetsförmedlingen', url: 'https://arbetsformedlingen.se' },
        { label: 'Jobtech Atlas', url: 'https://jobtechdev.se' },
        { label: 'Karriärguiden', url: 'https://karriarguiden.se' },
      ] as const
      ```
    - Renders heading "Externa resurser" + list of `<a href={url} target="_blank" rel="noreferrer">` links. Each has external-link icon
    - Empty-state never triggers (always shows static list). Body line: "3 utvalda externa länkar" (qualitative count)
    - Icon: `ExternalLink`. allowedSizes ['S','M']

    **4. `PrintResourcesWidget.tsx` — STATIC content (no slice)**
    - Always renders 3-item static list of printable templates:
      ```typescript
      const PRINT_TEMPLATES = [
        { label: 'CV-mall (utskrift)', file: '/templates/cv-template.pdf' },
        { label: 'Personligt brev-mall', file: '/templates/cover-letter-template.pdf' },
        { label: 'Intervjuförberedelse', file: '/templates/interview-prep.pdf' },
      ] as const
      ```
    - Heading "Utskriftsmaterial". Each item is a `<a href={file} download>` link. Icon: `Printer`. allowedSizes ['S','M']
    - If files don't exist yet: render the link anyway — graceful 404 better than no widget. Document in Footer comment that files must be added in a v1.1 task

    **5. `AITeamWidget.tsx` — slice: `aiTeamSessions` + `aiTeamSessionCount`**
    - Empty (`aiTeamSessionCount === 0`): heading "Ditt AI-team väntar", body "Chatta med din karriärcoach, studievägledare eller motivationscoach", CTA "Möt ditt AI-team" → `/ai-team`
    - Filled: heading "AI-team", primary slot "Senast: {aiTeamSessions[0].agent_id}" (translate agent_id to Swedish display name via a small map: career-coach → "Karriärcoach", study-advisor → "Studievägledare", motivation-coach → "Motivationscoach", etc.). Body line "{count} pågående samtal"
    - Icon: `Bot`. allowedSizes ['M','L'] (default L per registry — this is the focal Resurser widget)

    **6. `ExercisesWidget.tsx` — CONDITIONAL based on 05-DB-DISCOVERY.md (Pitfall G)**
    - Read the discovery file: if no exercise_progress table found → static-content mode. If found → data-backed (will need a new slice — but RESEARCH.md prefers static for v1.0)
    - For v1.0 ship: STATIC mode. Heading "Träna och öva", body "Öva på intervjufärdigheter, presentationsteknik och mer", CTA "Se alla övningar" → `/exercises`. Always renders this content (never empty/filled distinction in v1.0)
    - Icon: `Dumbbell`. allowedSizes ['S','M']

    **Test pattern (per widget) — same as Plan 02:**
    Use `ResurserDataProvider` wrapper with full ResurserSummary fixture (`{ cv: null, coverLetters: [], recentArticles: [], articleCompletedCount: 0, aiTeamSessions: [], aiTeamSessionCount: 0 }` for empty state; populate selectively for filled).

    For STATIC widgets (Externa, Utskrift, Övningar), tests render without provider needed (or with empty provider — components don't read slice). Verify the static content always renders.

    **Anti-shaming extension:** add 6 new cases to `anti-shaming.test.tsx`. Filled fixture for the 3 data-backed widgets, no fixture data needed for the 3 static ones (they have no numbers in primary KPI). Verify no `\d+%` in 32/22px font-bold elements across all 6.

    Verification: per-widget tests + extended anti-shaming green; npx tsc --noEmit zero.
  </action>
  <verify>
    <automated>cd client && npm run test:run -- src/components/widgets/MyDocumentsWidget.test.tsx src/components/widgets/KnowledgeBaseWidget.test.tsx src/components/widgets/ExternalResourcesWidget.test.tsx src/components/widgets/PrintResourcesWidget.test.tsx src/components/widgets/AITeamWidget.test.tsx src/components/widgets/ExercisesWidget.test.tsx src/components/widgets/__tests__/anti-shaming.test.tsx --reporter=dot 2>&1 | tail -5</automated>
  </verify>
  <done>
    - All 6 widget files default-exported, 3+ tests each
    - Anti-shaming extended with 6 new cases (now covers 14 widgets total)
    - 3 static-content widgets render their full content unconditionally (no broken-empty edge cases)
    - All 6 forward `onHide` (verifiable via grep `onHide={onHide}`)
    - npx tsc --noEmit zero
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 3: Wire ResurserHub.tsx + integration tests (α–λ)</name>
  <read_first>
    - client/src/pages/hubs/KarriarHub.tsx (Plan 02 wiring template — copy + swap)
    - client/src/pages/hubs/__tests__/KarriarHub.test.tsx (Plan 02 test template — copy + swap)
    - client/src/pages/hubs/ResurserHub.tsx (current Phase 2 stub — REPLACE)
    - .planning/phases/05-full-hub-coverage-oversikt/05-VALIDATION.md §"Per-widget test-kontrakt"
  </read_first>
  <behavior>
    11 integration tests mirroring KarriarHub.test.tsx (α-λ):
    - α-θ: same as Plan 02 tests, swapped for Resurser (6 widgets, hub_id='resurser')
    - ι: upsert payload includes hub_id='resurser'
    - κ: all 6 widget icons render (HUB-03 acceptance)
    - λ: aria-live announces e.g. "Widget Mina dokument dold"
  </behavior>
  <files>client/src/pages/hubs/ResurserHub.tsx, client/src/pages/hubs/__tests__/ResurserHub.test.tsx</files>
  <action>
    Replace `ResurserHub.tsx` with full Phase 3+4 wiring (180-line pattern). Copy `KarriarHub.tsx` verbatim, swap:
    - HUB_ID 'karriar' → 'resurser'
    - useKarriarHubSummary → useResurserHubSummary
    - KarriarDataProvider → ResurserDataProvider
    - KarriarLayoutProvider/KarriarLayoutValue → ResurserLayoutProvider/ResurserLayoutValue
    - getKarriarSections → getResurserSections
    - PageLayout title 'Karriär' → 'Resurser'; subtitle text appropriate ('Hitta dokument, kunskapsbank och AI-stöd' or similar from i18n keys)
    - PageLayout domain='coaching' → domain='info' (per UI-SPEC color mapping table — Resurser is `info` blue)
    - Translation keys: t('nav.hubs.resurser', 'Resurser'), t('hubs.resurser.subtitle', '...')
    - Section.title strings: from getResurserSections() — automatic

    All other code identical (mutators, layoutValue, customizeButton, render tree).

    **Integration test file (`client/src/pages/hubs/__tests__/ResurserHub.test.tsx`):** copy `KarriarHub.test.tsx`, swap:
    - Mock `useResurserHubSummary` instead of useKarriarHubSummary. STUB_SUMMARY:
      ```typescript
      const STUB_SUMMARY = {
        cv: { id: 'cv-r', updated_at: '2026-04-25' },
        coverLetters: [{ id: 'cl-r', title: 'Spotify', created_at: '2026-04-26' }],
        recentArticles: [],
        articleCompletedCount: 0,
        aiTeamSessions: [],
        aiTeamSessionCount: 0,
      }
      vi.mock('@/hooks/useResurserHubSummary', () => ({
        useResurserHubSummary: () => ({ data: STUB_SUMMARY, isLoading: false, isError: false }),
        RESURSER_HUB_KEY: (id: string) => ['hub', 'resurser', id],
      }))
      ```
    - `<ResurserHub />` import + MemoryRouter `/resurser`
    - γ: 6 hide buttons (was 6 Karriar; same count)
    - ι: hub_id='resurser' in upsert
    - λ: announces "Widget Mina dokument dold" when hideWidget('mina-dokument') runs

    Run tests:
    - `cd client && npm run test:run -- src/pages/hubs/__tests__/ResurserHub.test.tsx` α-λ pass
    - `cd client && npm run test:run -- src/pages/hubs/__tests__/KarriarHub.test.tsx src/pages/hubs/__tests__/JobsokHub.test.tsx` REGRESSION green
    - `cd client && npx tsc --noEmit` zero
    - `cd client && npm run build` zero errors
  </action>
  <verify>
    <automated>cd client && npm run test:run -- src/pages/hubs/__tests__/ResurserHub.test.tsx src/pages/hubs/__tests__/KarriarHub.test.tsx src/pages/hubs/__tests__/JobsokHub.test.tsx --reporter=dot 2>&1 | tail -5</automated>
  </verify>
  <done>
    - ResurserHub.tsx full wiring (no Phase 2 stub)
    - 11 integration tests (α-λ) green for ResurserHub
    - Karriar + Jobsok regression suites still all green (no template-copy mistake)
    - npm run build succeeds
    - HUB-03 acceptance: ResurserHub renders 6 widgets with real Supabase data (mocked summary in tests proves wiring)
  </done>
</task>

</tasks>

<verification>
- `npm run test:run -- src/hooks/useResurserHubSummary.test.ts src/components/widgets/MyDocumentsWidget.test.tsx src/components/widgets/KnowledgeBaseWidget.test.tsx src/components/widgets/ExternalResourcesWidget.test.tsx src/components/widgets/PrintResourcesWidget.test.tsx src/components/widgets/AITeamWidget.test.tsx src/components/widgets/ExercisesWidget.test.tsx src/components/widgets/__tests__/anti-shaming.test.tsx src/pages/hubs/__tests__/ResurserHub.test.tsx src/pages/hubs/__tests__/KarriarHub.test.tsx src/pages/hubs/__tests__/JobsokHub.test.tsx` — all green
- `grep -c "lazy(() => import('./" client/src/components/widgets/registry.ts` — at least 20 (8 + 6 + 6) lazy entries
- `grep -E "(useKarriarLayout|useJobsokLayout)" client/src/pages/hubs/ResurserHub.tsx` — 0 matches (no copy-rename leak)
- `npx tsc --noEmit` — zero errors
- `npm run build` — zero errors
</verification>

<success_criteria>
- HUB-03 fulfilled: ResurserHub renders 6 widgets (Mina dokument / Kunskapsbank / Externa resurser / Utskriftsmaterial / AI-team / Övningar)
- Layout persistence + hide/show work on Resurser using same hook + panel as Jobsok/Karriar
- Bundle contract preserved: 6 new lazy widgets, registry/labels exhaustive, build green
- Anti-shaming extended for 6 new widgets
- Documents data shared via cv/cover-letters cache keys with JobsokHub (no double-fetch)
- Phase 4 + Karriar regression suites all green
</success_criteria>

<output>
After completion, create `.planning/phases/05-full-hub-coverage-oversikt/05-03-resurser-hub-SUMMARY.md` documenting: (a) hub-summary loader's 4 selects + cache-sharing approach, (b) 6 widgets implemented (data-backed vs static), (c) Övningar widget decision (static vs data-backed) based on 05-DB-DISCOVERY.md, (d) integration test count (α-λ), (e) any deviations from KarriarHub-template.
</output>
