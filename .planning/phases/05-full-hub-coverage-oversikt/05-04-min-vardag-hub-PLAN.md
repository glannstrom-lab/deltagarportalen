---
phase: 05-full-hub-coverage-oversikt
plan: 04
type: execute
wave: 4
depends_on: [05-03-resurser-hub-PLAN]
files_modified:
  - client/src/hooks/useMinVardagHubSummary.ts
  - client/src/hooks/useMinVardagHubSummary.test.ts
  - client/src/components/widgets/MinVardagDataContext.tsx
  - client/src/components/widgets/MinVardagLayoutContext.tsx
  - client/src/components/widgets/HealthWidget.tsx
  - client/src/components/widgets/HealthWidget.test.tsx
  - client/src/components/widgets/DiaryWidget.tsx
  - client/src/components/widgets/DiaryWidget.test.tsx
  - client/src/components/widgets/CalendarWidget.tsx
  - client/src/components/widgets/CalendarWidget.test.tsx
  - client/src/components/widgets/NetworkWidget.tsx
  - client/src/components/widgets/NetworkWidget.test.tsx
  - client/src/components/widgets/ConsultantWidget.tsx
  - client/src/components/widgets/ConsultantWidget.test.tsx
  - client/src/components/widgets/registry.ts
  - client/src/components/widgets/widgetLabels.ts
  - client/src/components/widgets/defaultLayouts.ts
  - client/src/components/widgets/__tests__/anti-shaming.test.tsx
  - client/src/utils/streakDays.ts
  - client/src/utils/streakDays.test.ts
  - client/src/pages/hubs/MinVardagHub.tsx
  - client/src/pages/hubs/__tests__/MinVardagHub.test.tsx
autonomous: true
requirements: [HUB-04]
must_haves:
  truths:
    - "useMinVardagHubSummary fires Promise.all of 5 supabase selects (mood_logs, diary_entries, calendar_events, network_contacts, consultant_participants) and returns MinVardagSummary"
    - "MinVardagHub.tsx renders 5 widgets (Hälsa, Dagbok, Kalender, Nätverk, Min konsulent) inside MinVardagLayoutProvider OUTER → MinVardagDataProvider INNER"
    - "Hälsa widget renders 7-day Sparkline (existing primitive) — never a raw stress/mood number as primary KPI"
    - "Min konsulent widget joins consultant via profiles.full_name (consultant_id → profiles.id)"
    - "Layout persistence works on Min Vardag — hide widget, reload, still hidden (CUST-03 reused)"
    - "All 5 Min Vardag widgets are lazy() in WIDGET_REGISTRY (bundle contract preserved)"
    - "Anti-shaming guard extended: no widget renders raw \\d+% in primary KPI slot"
    - "Hälsa widget empty-state copy is non-pressuring per A11Y empathy contract: 'Om du vill — logga ditt mående...' (NOT 'Logga nu' / 'Du har inte loggat på X dagar')"
    - "streakDays utility lives at client/src/utils/streakDays.ts — single export source consumed by HealthWidget AND HealthSummaryWidget (Plan 05)"
  artifacts:
    - path: "client/src/hooks/useMinVardagHubSummary.ts"
      provides: "Hub-summary loader for Min Vardag"
      exports: ["useMinVardagHubSummary", "MIN_VARDAG_HUB_KEY"]
    - path: "client/src/components/widgets/MinVardagDataContext.tsx"
      provides: "Data context — MinVardagSummary"
      exports: ["MinVardagDataProvider", "useMinVardagWidgetData", "useMinVardagSummary", "MinVardagSummary"]
    - path: "client/src/components/widgets/MinVardagLayoutContext.tsx"
      provides: "Layout context for Min Vardag hub"
      exports: ["MinVardagLayoutProvider", "useMinVardagLayout", "MinVardagLayoutValue"]
    - path: "client/src/utils/streakDays.ts"
      provides: "Pure helper — count consecutive days ending at most-recent log"
      exports: ["streakDays"]
    - path: "client/src/pages/hubs/MinVardagHub.tsx"
      provides: "Hub page replacing Phase 2 stub"
      contains: "MinVardagLayoutProvider"
  key_links:
    - from: "client/src/pages/hubs/MinVardagHub.tsx"
      to: "client/src/hooks/useMinVardagHubSummary.ts"
      via: "imports + uses"
      pattern: "useMinVardagHubSummary\\("
    - from: "client/src/pages/hubs/MinVardagHub.tsx"
      to: "client/src/components/widgets/HiddenWidgetsPanel.tsx"
      via: "props-based panel call"
      pattern: "<HiddenWidgetsPanel[\\s\\S]*?layout=\\{"
    - from: "client/src/components/widgets/HealthWidget.tsx"
      to: "client/src/components/widgets/Sparkline.tsx"
      via: "imports Sparkline for 7-day mood trend"
      pattern: "from\\s+'./Sparkline'"
    - from: "client/src/components/widgets/HealthWidget.tsx"
      to: "client/src/utils/streakDays.ts"
      via: "imports streakDays helper from utils"
      pattern: "from\\s+'@/utils/streakDays'"
---

<objective>
Wire the full Min Vardag hub: 5 lazy-loaded widgets backed by Supabase data through a hub-summary loader, with layout persistence/hide-show. Same recipe as Plans 02-03 — different hub-id, different widget set.

Purpose: Min Vardag is the "wellbeing" hub for utsatta målgrupper. Empathy is critical — the Hälsa widget MUST use non-pressuring copy ("Om du vill" framing) per CONTEXT.md and the agent-locked Phase 3 patterns.

Output: One hub-summary loader, two contexts, 5 widgets, registry/labels/defaultLayouts extensions, fully-wired MinVardagHub page, integration test suite. All tests green, zero TS errors, zero new npm dependencies.
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
@.planning/phases/02-static-widget-grid/02-UI-SPEC.md
@client/src/hooks/useResurserHubSummary.ts
@client/src/components/widgets/ResurserDataContext.tsx
@client/src/components/widgets/ResurserLayoutContext.tsx
@client/src/components/widgets/Sparkline.tsx
@client/src/components/widgets/InterviewWidget.tsx
@client/src/components/widgets/registry.ts
@client/src/components/widgets/widgetLabels.ts
@client/src/components/widgets/defaultLayouts.ts
@client/src/components/widgets/types.ts
@client/src/components/widgets/Widget.tsx
@client/src/pages/hubs/ResurserHub.tsx
@client/src/pages/hubs/__tests__/ResurserHub.test.tsx
@client/src/pages/hubs/MinVardagHub.tsx
@client/src/hooks/useDiary.ts

<interfaces>
<!-- Min Vardag data shape (locked from RESEARCH.md §Min Vardag HUB-04 widget-data-mapping): -->
```typescript
// client/src/components/widgets/MinVardagDataContext.tsx
export interface MinVardagSummary {
  // mood_logs — last 7 days for Hälsa sparkline
  recentMoodLogs: Array<{ mood_level: number; energy_level: number; log_date: string }>
  // diary_entries — count + most recent
  diaryEntryCount: number
  latestDiaryEntry: { id: string; created_at: string } | null
  // calendar_events — next 3 upcoming (date >= today)
  upcomingEvents: Array<{ id: string; title: string; date: string; time: string | null; type: string | null }>
  // network_contacts — count only
  networkContactsCount: number
  // consultant_participants joined with profiles for consultant info
  consultant: { id: string; full_name: string | null; avatar_url: string | null } | null
}
```

<!-- Min Vardag hub-loader (5 SELECTs — column names confirmed by 05-DB-DISCOVERY.md): -->
```typescript
// client/src/hooks/useMinVardagHubSummary.ts
export const MIN_VARDAG_HUB_KEY = (userId: string) => ['hub', 'min-vardag', userId] as const

export function useMinVardagHubSummary() {
  const { user } = useAuth()
  const userId = user?.id ?? ''

  return useQuery<MinVardagSummary>({
    queryKey: MIN_VARDAG_HUB_KEY(userId),
    enabled: !!userId,
    staleTime: 60_000,
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0]
      const [moodR, diaryCountR, diaryLatestR, calR, contactsR, consultantR] = await Promise.all([
        // Hälsa — 7 days
        supabase.from('mood_logs')
          .select('mood_level, energy_level, log_date')
          .eq('user_id', userId)
          .order('log_date', { ascending: false })
          .limit(7),
        // Dagbok — count
        supabase.from('diary_entries')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId),
        // Dagbok — latest entry
        supabase.from('diary_entries')
          .select('id, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        // Kalender — next 3
        supabase.from('calendar_events')
          .select('id, title, date, time, type')
          .eq('user_id', userId)
          .gte('date', today)
          .order('date', { ascending: true })
          .limit(3),
        // Nätverk — count via select head
        supabase.from('network_contacts')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId),
        // Min konsulent — JOIN. Column name (participant_id vs user_id) verified in 05-DB-DISCOVERY.md.
        // Below uses participant_id; if discovery shows user_id, swap.
        supabase.from('consultant_participants')
          .select('consultant_id, profiles:consultant_id(id, full_name, avatar_url)')
          .eq('participant_id', userId)
          .maybeSingle(),
      ])

      const consultantData = consultantR.data?.profiles
        ? {
            id: (consultantR.data.profiles as { id: string }).id,
            full_name: (consultantR.data.profiles as { full_name?: string }).full_name ?? null,
            avatar_url: (consultantR.data.profiles as { avatar_url?: string }).avatar_url ?? null,
          }
        : null

      return {
        recentMoodLogs: moodR.data ?? [],
        diaryEntryCount: diaryCountR.count ?? 0,
        latestDiaryEntry: diaryLatestR.data ?? null,
        upcomingEvents: calR.data ?? [],
        networkContactsCount: contactsR.count ?? 0,
        consultant: consultantData,
      } satisfies MinVardagSummary
    },
  })
}
```

<!-- IF 05-DB-DISCOVERY.md showed consultant_participants uses 'user_id' instead of 'participant_id', the executor MUST adjust the .eq filter accordingly. The discovery file is the source of truth. -->

<!-- streakDays utility (LOCKED location — single export source; Plan 05 cross-hub HealthSummaryWidget imports from same path): -->
```typescript
// client/src/utils/streakDays.ts
/**
 * Count consecutive days ending at the most-recent log.
 * Pure function — no Date side effects beyond input.
 *
 * Single source of truth for streak counting. Imported by:
 *   - client/src/components/widgets/HealthWidget.tsx (this plan, Min Vardag)
 *   - client/src/components/widgets/HealthSummaryWidget.tsx (Plan 05, Översikt)
 */
export function streakDays(logs: Array<{ log_date: string }>): number {
  if (!logs || logs.length === 0) return 0
  // Sort descending by date (most recent first) — defensive even if caller already sorted
  const sorted = [...logs].sort((a, b) => b.log_date.localeCompare(a.log_date))
  let streak = 0
  let cursor = new Date(sorted[0].log_date)
  for (const log of sorted) {
    const logDate = new Date(log.log_date)
    const expected = cursor.toISOString().slice(0, 10)
    const actual = logDate.toISOString().slice(0, 10)
    if (expected !== actual) break
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}
```

<!-- Default layout for min-vardag (REPLACES placeholder { id: 'cv', size: 'S', ... }): -->
```typescript
'min-vardag': [
  { id: 'halsa',          size: 'M', order: 0, visible: true },
  { id: 'dagbok',         size: 'M', order: 1, visible: true },
  { id: 'kalender',       size: 'L', order: 2, visible: true },
  { id: 'natverk',        size: 'S', order: 3, visible: true },
  { id: 'min-konsulent',  size: 'M', order: 4, visible: true },
],
```

<!-- Sections (2 sections — natural grouping): -->
```typescript
export function getMinVardagSections(): SectionedLayout[] {
  const all = getDefaultLayout('min-vardag')
  return [
    { title: 'Mig själv',  items: all.slice(0, 3) },  // Hälsa, Dagbok, Kalender
    { title: 'Mitt stöd',  items: all.slice(3, 5) },  // Nätverk, Konsulent
  ]
}
```

<!-- Registry additions (lazy()): -->
```typescript
halsa:           { component: lazy(() => import('./HealthWidget')),    defaultSize: 'M', allowedSizes: ['S', 'M', 'L'] },
dagbok:          { component: lazy(() => import('./DiaryWidget')),     defaultSize: 'M', allowedSizes: ['S', 'M', 'L'] },
kalender:        { component: lazy(() => import('./CalendarWidget')),  defaultSize: 'L', allowedSizes: ['M', 'L'] },
natverk:         { component: lazy(() => import('./NetworkWidget')),   defaultSize: 'S', allowedSizes: ['S', 'M'] },
'min-konsulent': { component: lazy(() => import('./ConsultantWidget')), defaultSize: 'M', allowedSizes: ['S', 'M', 'L'] },
```

<!-- Label additions: -->
```
halsa:           'Hälsa',
dagbok:          'Dagbok',
kalender:        'Kalender',
natverk:         'Nätverk',
'min-konsulent': 'Min konsulent',
```

<!-- Empty-state copy (LOCKED — empathy-critical, do NOT paraphrase): -->
```
Hälsa: "Hur mår du idag?" / "Om du vill — logga ditt mående med ett klick" / "Logga idag" → /mood
Dagbok: "Inga anteckningar ännu" / "Börja din dagbok — skriv fritt om din jobbsökning" / "Skriv idag" → /diary
Kalender: "Inga kommande möten" / "Lägg till intervjuer, möten och deadlines i din kalender" / "Lägg till händelse" → /calendar
Nätverk: "Bygg ditt nätverk" / "Lägg till kontakter från ditt yrkesnätverk" / "Lägg till kontakt" → /networking
Min konsulent: "Ingen konsulent ännu" / "Kontakta arbetsförmedlingen för att komma igång med coachning" / "Mer om konsulentcoachning" → /consultant-info  (verify route)
```

<!-- Filled-state framing (NEVER raw mood/stress numbers as primary KPI): -->
```
Hälsa:   Sparkline of recentMoodLogs[].mood_level (last 7 days). Primary text label: "5 dagar i rad" (streak — calculated via streakDays helper from @/utils/streakDays) OR "Senast loggad: {date}" if no streak.
Dagbok:  "{count} inlägg" (label, not 32px font-bold KPI)
Kalender: Next event: title + date (e.g. "Intervju mån 5 maj 14:00")
Nätverk: Milestone label from networkContactsCount: ">10 → 'Bra nätverk'", ">3 → 'Bygger nätverk'", ">0 → 'Första kontakter'", "0 → empty state"
Min konsulent: Consultant name + avatar; if no upcoming meeting → just consultant card; if upcoming meeting (look in upcomingEvents for type='meeting') → "Nästa möte: {date}"
```

<!-- Sparkline primitive (existing — see Sparkline.tsx): -->
```typescript
import { Sparkline } from './Sparkline'
// Usage: <Sparkline values={recentMoodLogs.map(l => l.mood_level)} />
// Renders null for fewer than 2 values (defensive — Phase 2 decision Phase 02-02).
```

<!-- Hub deep-link routes:
       Hälsa → '/mood' (or '/wellness/mood' — check navigation.ts memberPaths)
       Dagbok → '/diary'
       Kalender → '/calendar'
       Nätverk → '/networking' (or '/network' — verify)
       Min konsulent → '/consultant' or '/profile/consultant' — likely a new info page; if absent route to '/profile' as fallback. Document in widget Footer comment if route is a placeholder.
-->

<!-- Anti-shaming extension: same as Plans 02-03 — add 5 cases to anti-shaming.test.tsx with MinVardagDataProvider. -->
<!-- Specifically check Hälsa widget does NOT render mood_level (a number 1-5) in 32/22px font-bold slot. -->
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Hub plumbing — useMinVardagHubSummary loader + MinVardagDataContext + MinVardagLayoutContext + registry/labels/defaultLayouts extensions</name>
  <read_first>
    - client/src/hooks/useResurserHubSummary.ts (Plan 03 template — copy + replace)
    - client/src/hooks/useResurserHubSummary.test.ts (Plan 03 test template)
    - client/src/components/widgets/ResurserDataContext.tsx (Plan 03 — copy + rename)
    - client/src/components/widgets/ResurserLayoutContext.tsx (Plan 03 — verbatim copy + rename)
    - .planning/phases/05-full-hub-coverage-oversikt/05-DB-DISCOVERY.md §"consultant_participants" (verify exact column name participant_id vs user_id)
    - .planning/phases/05-full-hub-coverage-oversikt/05-DB-DISCOVERY.md §"network_contacts" (verify columns)
    - client/src/components/widgets/defaultLayouts.ts, registry.ts, widgetLabels.ts (post-Plan-03 state)
  </read_first>
  <behavior>
    - Test 1: useMinVardagHubSummary fires Promise.all of 6 supabase calls (mood_logs, diary_entries count, diary_entries latest, calendar_events, network_contacts count, consultant_participants join)
    - Test 2: Returns MinVardagSummary shape with all 6 slices populated from fixture
    - Test 3: When mood_logs fixture is empty, recentMoodLogs is [] (not undefined) — Sparkline-safe
    - Test 4: consultant join — when consultant_participants returns null, summary.consultant is null
    - Test 5: The .eq filter on consultant_participants matches the exact column name recorded in 05-DB-DISCOVERY.md §"consultant_participants" (e.g. `participant_id` or `user_id`). Verification: `grep "\\.eq\\('participant_id'\\|\\.eq\\('user_id'" client/src/hooks/useMinVardagHubSummary.ts` returns the same column name as the discovery file's recorded value (post-impl assertion — the test file documents the expected column in a comment, then asserts the fromMock chain receives it).
  </behavior>
  <files>client/src/hooks/useMinVardagHubSummary.ts, client/src/hooks/useMinVardagHubSummary.test.ts, client/src/components/widgets/MinVardagDataContext.tsx, client/src/components/widgets/MinVardagLayoutContext.tsx, client/src/components/widgets/registry.ts, client/src/components/widgets/widgetLabels.ts, client/src/components/widgets/defaultLayouts.ts</files>
  <action>
    Apply Plan 03's recipe with Min Vardag substitutions.

    **A. `MinVardagDataContext.tsx`** — copy `ResurserDataContext.tsx`, replace `ResurserSummary` with `MinVardagSummary` (interface from <interfaces>), rename context/provider/hooks.

    **B. `MinVardagLayoutContext.tsx`** — verbatim copy of `ResurserLayoutContext.tsx` with rename.

    **C. `useMinVardagHubSummary.ts`** — implement per <interfaces> code block. CRITICAL: read 05-DB-DISCOVERY.md §"consultant_participants" first. Use the exact column name from discovery for the `.eq()` filter. If discovery shows `user_id`, write `.eq('user_id', userId)`; if `participant_id`, write `.eq('participant_id', userId)`. Add a comment line referencing the discovery file. Same for network_contacts column (likely `user_id`).

    For the `count: 'exact', head: true` pattern (count-only queries), the supabase return shape is `{ data: null, error: null, count: number }`. The test mock builder must support this — extend `makeBuilder` to accept a `count` arg.

    **D. `useMinVardagHubSummary.test.ts`** — copy useResurserHubSummary.test.ts template. Adjust `makeBuilder` to support count-style returns:
    ```typescript
    function makeBuilder(data: unknown, count?: number) {
      const builder: Record<string, unknown> = {}
      const resolve = () => Promise.resolve({ data, error: null, count: count ?? null })
      // ... rest same
    }
    ```
    Fixtures:
    - mood_logs: `[{ mood_level: 4, energy_level: 3, log_date: '2026-04-27' }, { mood_level: 3, energy_level: 3, log_date: '2026-04-26' }]`
    - diary_entries (count): `makeBuilder(null, 5)` returns count=5
    - diary_entries (latest): `{ id: 'd1', created_at: '2026-04-25' }`
    - calendar_events: `[{ id: 'e1', title: 'Intervju Klarna', date: '2026-05-05', time: '14:00', type: 'meeting' }]`
    - network_contacts (count): `makeBuilder(null, 8)` returns count=8
    - consultant_participants: `{ consultant_id: 'c1', profiles: { id: 'c1', full_name: 'Anna Karlsson', avatar_url: null } }`

    Add tests 1-5 from <behavior> block.

    **Test 5 specifics — discovery-driven column assertion:**
    Before writing test 5, read 05-DB-DISCOVERY.md §"consultant_participants" and copy the recorded column name (e.g. `participant_id`) into a const at top of the test file:
    ```typescript
    // Source of truth: .planning/phases/05-full-hub-coverage-oversikt/05-DB-DISCOVERY.md §consultant_participants
    const CONSULTANT_PARTICIPANT_COL = 'participant_id' // ← replace with discovery value
    ```
    Then test 5 asserts `fromMock` was called with that column on the consultant_participants chain. After implementation, also run a grep to verify the source uses the same column:
    ```bash
    grep -E "consultant_participants[\\s\\S]*?\\.eq\\('${CONSULTANT_PARTICIPANT_COL}'" client/src/hooks/useMinVardagHubSummary.ts
    ```
    Both the test and the implementation must use whatever value is recorded in 05-DB-DISCOVERY.md — that file is single source of truth.

    **E. `defaultLayouts.ts`** — REPLACE `min-vardag:` placeholder with 5-widget array. APPEND `getMinVardagSections()`.

    **F. `registry.ts`** — APPEND 5 lazy entries.

    **G. `widgetLabels.ts`** — EXTEND with 5 new labels. Now exhaustive across 25 widget IDs (8 Jobsok + 6 Karriar + 6 Resurser + 5 Min Vardag).

    Verification: `npx tsc --noEmit` zero, `npm run test:run -- src/hooks/useMinVardagHubSummary.test.ts` 5 tests green.
  </action>
  <verify>
    <automated>cd client && npx tsc --noEmit 2>&1 | tail -3 && npm run test:run -- src/hooks/useMinVardagHubSummary.test.ts --reporter=dot 2>&1 | tail -5</automated>
  </verify>
  <done>
    - All 7 files exist
    - useMinVardagHubSummary.test.ts has 5 passing tests
    - getDefaultLayout('min-vardag') returns 5 items
    - getMinVardagSections() returns 2 sections (3 + 2 items)
    - WIDGET_REGISTRY has at least 25 entries
    - WIDGET_LABELS exhaustively maps all 25 widget IDs
    - npx tsc --noEmit zero errors
    - consultant_participants column-name in source matches the value recorded in 05-DB-DISCOVERY.md (verifiable via grep)
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Build 5 Min Vardag widgets with empathy-locked copy + Sparkline integration + extract streakDays utility</name>
  <read_first>
    - client/src/components/widgets/InterviewWidget.tsx (Sparkline integration reference + L-size pattern)
    - client/src/components/widgets/Sparkline.tsx (primitive — accepts values: number[])
    - client/src/components/widgets/AITeamWidget.tsx (Plan 03 — agent-name-localization mini-map pattern, reusable for consultant_id mapping)
    - client/src/components/widgets/__tests__/anti-shaming.test.tsx (extend with 5 widgets)
    - .planning/phases/05-full-hub-coverage-oversikt/05-RESEARCH.md §Min Vardag (HUB-04) — locked copy
    - .planning/phases/03-data-wiring-wcag/03-CONTEXT.md §"Empati-review" (anti-pressure framing principle)
  </read_first>
  <behavior>
    Per widget — minimum 3 tests each. Total 15+ widget tests.
    - Test A (empty): heading + body + CTA from <interfaces>; Hälsa specifically must show non-pressuring copy "Om du vill — logga..."
    - Test B (filled): correct milestone label / sparkline / consultant card; never raw \\d+% or \\d+/5 in 32/22px slot
    - Test C (onHide forwarding — Pitfall B regression rule)
    Plus: streakDays unit tests (separate file `client/src/utils/streakDays.test.ts`):
    - returns 0 for empty array
    - returns 1 for a single log
    - returns 3 for 3 consecutive days, returns 1 if there's a gap after the most-recent log
    Anti-shaming extended for 5 widgets (now 19 cases total).
  </behavior>
  <files>client/src/utils/streakDays.ts, client/src/utils/streakDays.test.ts, client/src/components/widgets/HealthWidget.tsx, client/src/components/widgets/HealthWidget.test.tsx, client/src/components/widgets/DiaryWidget.tsx, client/src/components/widgets/DiaryWidget.test.tsx, client/src/components/widgets/CalendarWidget.tsx, client/src/components/widgets/CalendarWidget.test.tsx, client/src/components/widgets/NetworkWidget.tsx, client/src/components/widgets/NetworkWidget.test.tsx, client/src/components/widgets/ConsultantWidget.tsx, client/src/components/widgets/ConsultantWidget.test.tsx, client/src/components/widgets/__tests__/anti-shaming.test.tsx</files>
  <action>
    Implement 5 widgets following the established pattern. Every widget destructures + forwards `onHide` to `<Widget>`.

    **0. `client/src/utils/streakDays.ts` (FIRST — extracted utility, single source of truth):**
    Create the helper at `client/src/utils/streakDays.ts` per <interfaces> §streakDays. Export as a named export `streakDays`. No React imports. No widget-specific logic. Pure function over `Array<{ log_date: string }>`.

    Also create `client/src/utils/streakDays.test.ts` with the 4 unit tests from <behavior>:
    - `streakDays([])` returns 0
    - `streakDays([{ log_date: '2026-04-27' }])` returns 1
    - `streakDays([{ log_date: '2026-04-27' }, { log_date: '2026-04-26' }, { log_date: '2026-04-25' }])` returns 3
    - `streakDays([{ log_date: '2026-04-27' }, { log_date: '2026-04-25' }])` returns 1 (gap on 2026-04-26 breaks streak)

    **CRITICAL:** This is the SINGLE export source. HealthWidget (this plan) AND HealthSummaryWidget (Plan 05) BOTH import from `@/utils/streakDays`. Do not also export it from HealthWidget.tsx — that would create two sources.

    **1. `HealthWidget.tsx` — slice: `recentMoodLogs` (Pitfall: empathy-critical)**
    - Empty (`recentMoodLogs.length === 0`): heading "Hur mår du idag?", body "Om du vill — logga ditt mående med ett klick", CTA "Logga idag" → `/mood` (verify route)
    - Filled: heading "Hälsa", primary slot label = streak ("5 dagar i rad" — calculated by `streakDays(recentMoodLogs)` imported from `@/utils/streakDays`) OR "Senast: {locale-formatted log_date}" (NOT a mood number). Below: `<Sparkline values={recentMoodLogs.map(l => l.mood_level).reverse()} />` (reverse so chronological)
    - Import: `import { streakDays } from '@/utils/streakDays'` (NOT from a sibling file)
    - Icon: `Heart`. allowedSizes ['S','M','L']. Domain colour comes from MinVardagHub `domain="wellbeing"` cascade

    **2. `DiaryWidget.tsx` — slice: `diaryEntryCount` + `latestDiaryEntry`**
    - Empty (`diaryEntryCount === 0`): heading "Inga anteckningar ännu", body "Börja din dagbok — skriv fritt om din jobbsökning", CTA "Skriv idag" → `/diary`
    - Filled: heading "Dagbok", primary slot "{diaryEntryCount} inlägg" (label not 32px KPI), body "Senast: {locale-formatted latestDiaryEntry.created_at}"
    - Icon: `BookText`. allowedSizes ['S','M','L']

    **3. `CalendarWidget.tsx` — slice: `upcomingEvents` (default L)**
    - Empty (`upcomingEvents.length === 0`): heading "Inga kommande möten", body "Lägg till intervjuer, möten och deadlines i din kalender", CTA "Lägg till händelse" → `/calendar`
    - Filled: heading "Kalender", list of next 3 events with `<time dateTime={event.date}>`. Each row: title + Swedish-locale date+time. Icon per event.type if available
    - Icon: `Calendar`. allowedSizes ['M','L']

    **4. `NetworkWidget.tsx` — slice: `networkContactsCount`**
    - Empty (`networkContactsCount === 0`): heading "Bygg ditt nätverk", body "Lägg till kontakter från ditt yrkesnätverk", CTA "Lägg till kontakt" → `/networking`
    - Filled: heading "Nätverk", primary milestone label:
      - >= 10: "Bra nätverk"
      - >= 3: "Bygger nätverk"
      - >= 1: "Första kontakter"
      - 0: empty state
      Body: "{count} kontakter"
    - Icon: `Users`. allowedSizes ['S','M']

    **5. `ConsultantWidget.tsx` — slice: `consultant` + look in upcomingEvents for `type === 'meeting'`**
    - Empty (`!consultant`): heading "Ingen konsulent ännu", body "Kontakta arbetsförmedlingen för att komma igång med coachning", CTA "Mer om konsulentcoachning" → `/consultant-info` (or fallback to `/profile` if route absent — comment in code)
    - Filled: heading "Min konsulent", primary slot consultant.full_name (or "Konsulent" if name null). Avatar (if avatar_url) — use `<img src alt="" aria-hidden>` with sr-only fallback "Konsulent {full_name}". Below: if upcomingEvents has a `meeting` type → "Nästa möte: {date}"; else "Inget möte inplanerat"
    - Icon: `UserCheck`. allowedSizes ['S','M','L']

    **Test pattern:** Wrap in `MinVardagDataProvider` with full `MinVardagSummary` fixture. For empty state, all slices null/empty/0. For filled state, populate the relevant slice. The streakDays helper has its OWN test file (`client/src/utils/streakDays.test.ts`) — do not duplicate those tests inside HealthWidget.test.tsx; HealthWidget tests only verify the rendered string given a fixture.

    **HealthWidget anti-shaming:** Verify `<p className="text-[32px] font-bold">` does NOT contain `\d+/5` (e.g. "4/5"). The mood_level appearing in the sparkline (SVG decorative) is allowed, but never as the primary text KPI.

    **Anti-shaming extension:** add 5 new cases to `anti-shaming.test.tsx`. Total cases: 8 Jobsok + 6 Karriar + 6 Resurser + 5 MinVardag = 25 cases. The `cases` array becomes: `[...JOBSOK, ...KARRIAR, ...RESURSER, ...MINVARDAG]`. Use a separate fixture function for each provider (`fixtureMinVardag()`).

    Verification: streakDays unit tests + per-widget tests + extended anti-shaming green; npx tsc --noEmit zero.
  </action>
  <verify>
    <automated>cd client && npm run test:run -- src/utils/streakDays.test.ts src/components/widgets/HealthWidget.test.tsx src/components/widgets/DiaryWidget.test.tsx src/components/widgets/CalendarWidget.test.tsx src/components/widgets/NetworkWidget.test.tsx src/components/widgets/ConsultantWidget.test.tsx src/components/widgets/__tests__/anti-shaming.test.tsx --reporter=dot 2>&1 | tail -5</automated>
  </verify>
  <done>
    - `client/src/utils/streakDays.ts` exists and exports `streakDays` as a named export
    - `client/src/utils/streakDays.test.ts` has 4 passing unit tests
    - HealthWidget imports streakDays from `@/utils/streakDays` (verifiable: `grep "from '@/utils/streakDays'" client/src/components/widgets/HealthWidget.tsx` returns 1 match)
    - HealthWidget does NOT export streakDays itself (single source of truth: `grep "export.*streakDays" client/src/components/widgets/HealthWidget.tsx` returns 0 matches)
    - All 5 widget files default-exported with 3+ tests each
    - HealthWidget includes Sparkline integration
    - Anti-shaming test extended (now ~25 cases) all green
    - All 5 widgets forward `onHide` to Widget
    - Empty-state copy verbatim from <interfaces> (verify with screen.getByText literal-match)
    - npx tsc --noEmit zero
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 3: Wire MinVardagHub.tsx + integration tests (α–λ)</name>
  <read_first>
    - client/src/pages/hubs/ResurserHub.tsx (Plan 03 — copy template + swap)
    - client/src/pages/hubs/__tests__/ResurserHub.test.tsx (Plan 03 — copy + swap)
    - client/src/pages/hubs/MinVardagHub.tsx (current Phase 2 stub — REPLACE)
  </read_first>
  <behavior>
    11 integration tests (α-λ) mirroring ResurserHub.test.tsx:
    - α-θ: same as Plan 03 swapped for Min Vardag (5 widgets, hub_id='min-vardag')
    - ι: upsert payload includes hub_id='min-vardag'
    - κ: all 5 widget icons render
    - λ: aria-live announces "Widget Hälsa dold" when hideWidget('halsa') runs
  </behavior>
  <files>client/src/pages/hubs/MinVardagHub.tsx, client/src/pages/hubs/__tests__/MinVardagHub.test.tsx</files>
  <action>
    Replace `MinVardagHub.tsx` Phase 2 stub with full wiring. Copy `ResurserHub.tsx`, swap:
    - HUB_ID 'resurser' → 'min-vardag'
    - useResurserHubSummary → useMinVardagHubSummary
    - ResurserDataProvider → MinVardagDataProvider
    - ResurserLayoutProvider/Value → MinVardagLayoutProvider/Value
    - getResurserSections → getMinVardagSections
    - PageLayout title → 'Min Vardag', subtitle → 'Vardagsstöd och balans — hälsa, dagbok, kalender, nätverk och din konsulent'
    - PageLayout domain → 'wellbeing' (purple per UI-SPEC color mapping)

    **Integration test (`MinVardagHub.test.tsx`):** copy `ResurserHub.test.tsx`, swap mock + STUB:
    ```typescript
    const STUB_SUMMARY = {
      recentMoodLogs: [{ mood_level: 4, energy_level: 3, log_date: '2026-04-27' }],
      diaryEntryCount: 0,
      latestDiaryEntry: null,
      upcomingEvents: [],
      networkContactsCount: 0,
      consultant: null,
    }
    vi.mock('@/hooks/useMinVardagHubSummary', () => ({
      useMinVardagHubSummary: () => ({ data: STUB_SUMMARY, isLoading: false, isError: false }),
      MIN_VARDAG_HUB_KEY: (id: string) => ['hub', 'min-vardag', id],
    }))
    ```
    - `<MinVardagHub />` import, MemoryRouter `/min-vardag`
    - γ: 5 hide buttons (Min Vardag has 5 widgets, fewer than Karriar/Resurser)
    - ι: hub_id='min-vardag' in upsert
    - λ: announces "Widget Hälsa dold"

    Run: ResurserHub + KarriarHub + JobsokHub regression also still green.
    `npm run build` succeeds.
  </action>
  <verify>
    <automated>cd client && npm run test:run -- src/pages/hubs/__tests__/MinVardagHub.test.tsx src/pages/hubs/__tests__/ResurserHub.test.tsx src/pages/hubs/__tests__/KarriarHub.test.tsx src/pages/hubs/__tests__/JobsokHub.test.tsx --reporter=dot 2>&1 | tail -5</automated>
  </verify>
  <done>
    - MinVardagHub.tsx full wiring (~180 lines, mirroring earlier hubs)
    - 11 integration tests (α-λ) green
    - All earlier hub regression suites green
    - npm run build succeeds
    - HUB-04 acceptance: MinVardagHub renders 5 widgets with real Supabase data
  </done>
</task>

</tasks>

<verification>
- `npm run test:run -- src/utils/streakDays.test.ts src/hooks/useMinVardagHubSummary.test.ts src/components/widgets/HealthWidget.test.tsx src/components/widgets/DiaryWidget.test.tsx src/components/widgets/CalendarWidget.test.tsx src/components/widgets/NetworkWidget.test.tsx src/components/widgets/ConsultantWidget.test.tsx src/components/widgets/__tests__/anti-shaming.test.tsx src/pages/hubs/__tests__/MinVardagHub.test.tsx src/pages/hubs/__tests__/ResurserHub.test.tsx src/pages/hubs/__tests__/KarriarHub.test.tsx src/pages/hubs/__tests__/JobsokHub.test.tsx` — all green
- `grep -c "lazy(() => import('./" client/src/components/widgets/registry.ts` — at least 25 lazy entries
- `grep "useResurserLayout\|useKarriarLayout\|useJobsokLayout" client/src/pages/hubs/MinVardagHub.tsx` — 0 matches
- `grep "from '@/utils/streakDays'" client/src/components/widgets/HealthWidget.tsx` — 1 match (single source of truth)
- `npx tsc --noEmit` — zero errors
- `npm run build` — zero errors
</verification>

<success_criteria>
- HUB-04 fulfilled: MinVardagHub renders 5 widgets with real Supabase data
- Hälsa widget uses non-pressuring copy ("Om du vill — logga...") — verifiable via test
- Min konsulent widget joins consultant info correctly per 05-DB-DISCOVERY.md
- streakDays utility lives at `client/src/utils/streakDays.ts` (single export source — Plan 05 will import from same path)
- Layout persistence + hide/show work on Min Vardag (CUST-01..03 reused)
- Bundle contract preserved (5 new lazy widgets, build green)
- Anti-shaming extended: no widget renders raw mood/stress numbers as primary KPI
- All earlier hub regression suites still green
</success_criteria>

<output>
Create `.planning/phases/05-full-hub-coverage-oversikt/05-04-min-vardag-hub-SUMMARY.md` documenting: (a) loader's 6-call Promise.all + count-style query handling, (b) consultant_participants join column choice (per discovery), (c) HealthWidget streak calculation via extracted streakDays utility (single source — `client/src/utils/streakDays.ts`), (d) 5 widgets implemented, (e) integration test count, (f) HUB-04 acceptance check.
</output>
