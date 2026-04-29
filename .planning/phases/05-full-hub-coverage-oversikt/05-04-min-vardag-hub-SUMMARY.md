---
phase: 05-full-hub-coverage-oversikt
plan: "04"
subsystem: min-vardag-hub + 5 widgets + hub-plumbing + streakDays utility
tags: [min-vardag, hub, widgets, layout-persistence, hide-show, supabase, tdd, HUB-04, empathy, sparkline, streakDays]
dependency_graph:
  requires: [05-01-db-discovery-and-migrations-SUMMARY, 05-02-karriar-hub-SUMMARY, 05-03-resurser-hub-SUMMARY]
  provides: [MinVardagHub, useMinVardagHubSummary, MinVardagDataContext, MinVardagLayoutContext, 5-min-vardag-widgets, streakDays-utility]
  affects: [05-05-oversikt-hub, 05-06-empty-state-pass-empathy-review]
tech_stack:
  added: []
  patterns: [hub-summary-loader, count-style-supabase-query, joined-supabase-query, data-context, layout-context, lazy-widget, milestone-framing, anti-shaming, sparkline-trend, streak-count, empathy-empty-states, shared-pure-utility]
key_files:
  created:
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
    - client/src/utils/streakDays.ts
    - client/src/utils/streakDays.test.ts
    - client/src/pages/hubs/__tests__/MinVardagHub.test.tsx
  modified:
    - client/src/components/widgets/registry.ts
    - client/src/components/widgets/widgetLabels.ts
    - client/src/components/widgets/defaultLayouts.ts
    - client/src/components/widgets/__tests__/anti-shaming.test.tsx
    - client/src/pages/hubs/MinVardagHub.tsx
decisions:
  - "useMinVardagHubSummary fires Promise.all of 6 supabase calls (mood_logs, diary_entries count + latest, calendar_events, network_contacts count, consultant_participants join) — diary_entries called twice to combine count-only + latest-row reads"
  - "consultant_participants join uses .eq('participant_id', userId) — column verified in 05-DB-DISCOVERY.md (NOT user_id); test asserts column matches discovery via constant CONSULTANT_PARTICIPANT_COL"
  - "count: 'exact', head: true pattern handled in test makeBuilder by extending resolved shape from { data, error } to { data, error, count } — supports both count-only and data-only chains in one helper"
  - "streakDays utility extracted to client/src/utils/streakDays.ts as the single source of truth — Plan 05 HealthSummaryWidget will import from same path; HealthWidget does NOT export streakDays (verified via grep)"
  - "HealthWidget anti-shaming: primary 22px font-bold KPI is streak label ('3 dagar i rad') or last-log-date ('Senast: 27 apr 2026'), NEVER raw mood_level number 1-5; the mood values appear ONLY as Sparkline decorative SVG"
  - "Hälsa widget empty copy locked verbatim per A11Y empathy contract: 'Hur mår du idag?' / 'Om du vill — logga ditt mående med ett klick' / 'Logga idag' (NOT 'Logga nu' / 'Du har inte loggat på X dagar')"
  - "Routes verified against App.tsx: Hälsa→/wellness, Dagbok→/diary, Kalender→/calendar, Nätverk→/nätverk (URL-encoded /n%C3%A4tverk in Link to:), Min konsulent→/my-consultant"
  - "Network milestone labels (Bra/Bygger/Första kontakter) gated at >=10 / >=3 / >=1 — qualitative, never a percentage"
  - "ConsultantWidget falls back to 'Konsulent' label when full_name is null; avatar rendered with alt='' aria-hidden + sr-only fallback when name absent"
  - "MinVardagHub PageLayout uses domain='wellbeing' (purple) — already configured in navigation.ts memberPaths"
  - "11 integration tests α-λ mirror ResurserHub.test.tsx with 5-widget swap: γ asserts 5 hide-buttons, ι asserts hub_id='min-vardag' upsert payload, κ asserts all 5 widget headings, λ asserts 'Widget Hälsa dold' announcement"
metrics:
  duration: "~13 min"
  completed_date: "2026-04-29"
  tasks: 3
  files: 17
---

# Phase 5 Plan 04: Min Vardag Hub Summary

Full Min Vardag hub: 5 lazy-loaded widgets (Hälsa, Dagbok, Kalender, Nätverk, Min konsulent) backed by a 6-call Supabase Promise.all loader, with layout persistence/hide-show replicating the Plan 02-03 pattern. MinVardagHub replaces the Phase 2 stub with full MinVardagLayoutProvider/MinVardagDataProvider wiring — HUB-04 fulfilled. Empathy-locked empty-state copy throughout. New shared utility `streakDays` extracted at `client/src/utils/streakDays.ts` as single source of truth for Plan 05.

---

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Hub plumbing — loader + contexts + registry/labels/layouts | 040a965 | 7 files |
| 2 | 5 Min Vardag widgets + streakDays utility + anti-shaming extension | c2f999c | 13 files |
| 3 | Wire MinVardagHub.tsx + α-λ integration tests | 9176743 | 2 files |

---

## Task 1: Hub Plumbing

### Hub-Summary Loader Query Plan

`useMinVardagHubSummary` fires `Promise.all` of exactly 6 Supabase calls (`diary_entries` is queried twice — once for count, once for latest):

1. `mood_logs` — `SELECT mood_level, energy_level, log_date WHERE user_id ORDER BY log_date DESC LIMIT 7` (7-day Sparkline)
2. `diary_entries` (count) — `SELECT id { count: 'exact', head: true } WHERE user_id` (count only — no row data)
3. `diary_entries` (latest) — `SELECT id, created_at WHERE user_id ORDER BY created_at DESC LIMIT 1 maybeSingle()`
4. `calendar_events` — `SELECT id, title, date, time, type WHERE user_id AND date >= CURRENT_DATE ORDER BY date ASC LIMIT 3`
5. `network_contacts` — `SELECT id { count: 'exact', head: true } WHERE user_id` (count only)
6. `consultant_participants` — `SELECT consultant_id, profiles:consultant_id(id, full_name, avatar_url) WHERE participant_id = userId maybeSingle()` (joined embed)

Per `05-DB-DISCOVERY.md`, `consultant_participants` uses `participant_id` (NOT `user_id`). The discovery file is single source of truth — test 5 asserts `.eq` was called with the exact column name recorded in discovery.

### Count-Style Query Handling

Two of the 6 calls use Supabase's `count: 'exact', head: true` shape, which returns `{ data: null, error: null, count: number }` instead of `{ data, error }`. The test mock builder was extended:

```typescript
function makeBuilder(data: unknown, count?: number) {
  const builder: Record<string, unknown> = {}
  const resolved = { data, error: null, count: count ?? null }
  // ... resolves to that combined shape on .then() / .maybeSingle() / await
}
```

This single builder serves both data-bearing chains (`mood_logs`, `calendar_events`) and count-only chains (`diary_entries` count, `network_contacts`).

### Consultant Join Column Choice

Per `05-DB-DISCOVERY.md` §`consultant_participants`: column is `participant_id`, not `user_id`. Source code:

```typescript
supabase
  .from('consultant_participants')
  .select('consultant_id, profiles:consultant_id(id, full_name, avatar_url)')
  .eq('participant_id', userId)
  .maybeSingle()
```

Test assertion captures `.eq` calls and verifies `[CONSULTANT_PARTICIPANT_COL, 'test-user-id']` matches the discovery value.

### MinVardagSummary Shape

```typescript
interface MinVardagSummary {
  recentMoodLogs: Array<{ mood_level: number; energy_level: number; log_date: string }>
  diaryEntryCount: number
  latestDiaryEntry: { id: string; created_at: string } | null
  upcomingEvents: Array<{ id: string; title: string; date: string; time: string | null; type: string | null }>
  networkContactsCount: number
  consultant: { id: string; full_name: string | null; avatar_url: string | null } | null
}
```

### Registry + Labels + DefaultLayouts Extensions

- `WIDGET_REGISTRY`: 5 new lazy() entries → now **25 entries total** (8 Jobsok + 6 Karriär + 6 Resurser + 5 Min Vardag)
- `WIDGET_LABELS`: 5 new Swedish labels — `Record<WidgetId, string>` exhaustiveness enforced by TypeScript (build would fail if any of the 25 IDs were missing)
- `defaultLayouts`: `min-vardag` placeholder (single CV widget) replaced with 5-widget desktop layout + `getMinVardagSections()` (2 sections: Mig själv / Mitt stöd)

---

## Task 2: 5 Widgets + streakDays Utility

### streakDays — Single Source of Truth

Extracted to `client/src/utils/streakDays.ts` per the plan's locked contract. Plan 05 `HealthSummaryWidget` will import from the same path. Tests verify:

- empty / null / undefined → 0
- single entry → 1
- 3 consecutive days (most-recent first) → 3
- gap after most-recent breaks streak → 1
- unsorted input → still works (defensive sort descending)
- streak anchored at the **most-recent log**, NOT today — this is the empathy contract: count what the user did, never punish them for what they haven't done

`HealthWidget.tsx` imports as `import { streakDays } from '@/utils/streakDays'` (verifiable via grep — single match). `HealthWidget` does NOT also export `streakDays` (verifiable via grep — zero matches). Single source of truth confirmed.

### Widget Implementations

| Widget | Data Slice | Empty-State Heading | Filled-State Primary KPI | Route |
|--------|------------|---------------------|--------------------------|-------|
| HealthWidget        | recentMoodLogs (Sparkline) | "Hur mår du idag?" + "Om du vill — logga…" | streak label `"N dagar i rad"` OR `"Senast: {date}"` | `/wellness` |
| DiaryWidget         | diaryEntryCount + latestDiaryEntry | "Inga anteckningar ännu" | `"{N} inlägg"` (qualitative count) | `/diary` |
| CalendarWidget      | upcomingEvents | "Inga kommande möten" | next event title (qualitative) + Swedish-locale date via `<time>` | `/calendar` |
| NetworkWidget       | networkContactsCount | "Bygg ditt nätverk" | milestone label "Bra nätverk" / "Bygger nätverk" / "Första kontakter" | `/nätverk` (URL-encoded as `/n%C3%A4tverk`) |
| ConsultantWidget    | consultant + scan upcomingEvents for type='meeting' | "Ingen konsulent ännu" | `consultant.full_name` (or "Konsulent" fallback) | `/my-consultant` |

### Empathy-Locked Empty-State Copy

Locked verbatim from RESEARCH.md / CONTEXT.md anti-pressure principle. Tests assert the EXACT strings to prevent paraphrase drift:

- Hälsa: `Om du vill — logga ditt mående med ett klick` (NOT `Logga nu` / `Du har inte loggat på X dagar`)
- Dagbok: `Börja din dagbok — skriv fritt om din jobbsökning`
- Kalender: `Lägg till intervjuer, möten och deadlines i din kalender`
- Nätverk: `Lägg till kontakter från ditt yrkesnätverk`
- Min konsulent: `Kontakta arbetsförmedlingen för att komma igång med coachning`

### Anti-Shaming Extension

Added 5 new MinVardag cases + 1 special `HealthWidget` mood-number guard ensuring primary KPI never matches `\d+\s*\/\s*5` (e.g. "4/5"). Total cases now 25 (8 Jobsok + 4 Karriar guarded + 6 Resurser + 5 MinVardag + 2 specifics). Sparkline SVG values are excluded from the guard — they are decorative data viz, not text KPIs.

All 5 widgets forward `onHide` → `Widget` (Pitfall B regression rule); each widget test asserts `screen.getByRole('button', { name: /Dölj widget/ })` resolves in `editMode=true`.

---

## Task 3: Integration Tests α–λ

11 tests, all passing for MinVardagHub:

- α: "Anpassa vy" button renders
- β: aria-pressed toggles editMode on click
- γ: 5 hide-buttons appear in edit mode (HUB-04 widget count)
- δ: hiding "Hälsa" removes it from grid (CUST-01)
- ε: Återvisa restores hidden widget (CUST-01)
- ζ: Återställ standardlayout opens ConfirmDialog with locked Swedish copy (CUST-02)
- η: confirming reset restores all 5 widgets
- θ: cancelling reset leaves layout unchanged
- ι: upsert payload contains hub_id='min-vardag' and breakpoint='desktop'
- κ: all 5 widget headings render (HUB-04 acceptance)
- λ: aria-live announces "Widget Hälsa dold"

**Template-copy leak guard:** `grep -E "useKarriarLayout|useJobsokLayout|useResurserLayout"` against `MinVardagHub.tsx` → 0 matches. Confirmed.

**Regression suite:** KarriarHub (11/11), ResurserHub (11/11), JobsokHub (24/24) — all green. No regression.

**Final verification suite:** 114/114 tests across 12 files. tsc clean. Build green (chunk-size advisory only, no errors).

---

## Deviations from Plan

None — plan executed exactly as written. The replication recipe from Plans 02-03 transferred cleanly with the documented swaps:

1. `HUB_ID` constant (`'resurser'` → `'min-vardag'`)
2. `ResurserSummary` → `MinVardagSummary` (different slice shape: 6 fields incl. count-only `diaryEntryCount`/`networkContactsCount`, joined `consultant`, sparkline-suitable `recentMoodLogs`)
3. `Promise.all` tables: cvs/cover_letters/article_reading_progress/ai_team_sessions → mood_logs/diary_entries×2/calendar_events/network_contacts/consultant_participants
4. Widget set: 5 Min Vardag widgets (all data-backed; no static-content widgets in this hub)
5. `getResurserSections()` → `getMinVardagSections()` (sections renamed: Mina/Bibliotek/Vägledning → Mig själv / Mitt stöd; 3-3 → 3-2 split)
6. STUB_SUMMARY in integration tests; widget heading values for α-λ assertions
7. PageLayout `domain` swap: `info` → `wellbeing` (Min Vardag purple per UI-SPEC color mapping)
8. New extracted utility: `streakDays.ts` at `client/src/utils/` (location locked by plan to enable Plan 05 re-import without duplication)
9. New count-style query support in test mock builder (extended `makeBuilder` to accept optional count param)

**One additive that's NOT in Resurser:** the `streakDays` shared utility lives in `client/src/utils/` (NOT in widgets/). This is intentional — Plan 05 imports from the same path, ensuring single source of truth. Resurser had no such cross-hub helper, but Min Vardag's streak logic needs to be available to Plan 05's HealthSummaryWidget without duplication.

**Empathy contract:** all 5 widgets use non-pressuring framing in empty states. The HealthWidget specifically has explicit anti-pressure assertions (`screen.queryByText(/inte loggat på/i)).not.toBeInTheDocument()`).

---

## Replication Recipe Confirmation (now 3× verified)

Plans 02 → 03 → 04 have all replicated the same 8-step wiring recipe successfully. Plan 05 (Översikt) is the next consumer. The recipe stays stable:

1. Loader hook with Promise.all + setQueryData if cache-shared
2. DataContext (interface + provider + slice/summary hooks)
3. LayoutContext (verbatim from Resurser template + rename)
4. Registry + labels + defaultLayouts extensions
5. N widgets with empty/filled/onHide tests
6. Anti-shaming extension
7. Hub page wiring (PageLayout → LayoutProvider → DataProvider → sections)
8. α-λ integration tests

Plan 05 differs structurally (Översikt is cross-hub aggregation, no new tables) but reuses contexts/registry/labels via the same recipe.

---

## Self-Check

**Files exist:**
- [x] client/src/hooks/useMinVardagHubSummary.ts
- [x] client/src/hooks/useMinVardagHubSummary.test.ts
- [x] client/src/components/widgets/MinVardagDataContext.tsx
- [x] client/src/components/widgets/MinVardagLayoutContext.tsx
- [x] client/src/components/widgets/HealthWidget.tsx + .test.tsx
- [x] client/src/components/widgets/DiaryWidget.tsx + .test.tsx
- [x] client/src/components/widgets/CalendarWidget.tsx + .test.tsx
- [x] client/src/components/widgets/NetworkWidget.tsx + .test.tsx
- [x] client/src/components/widgets/ConsultantWidget.tsx + .test.tsx
- [x] client/src/utils/streakDays.ts + streakDays.test.ts
- [x] client/src/pages/hubs/MinVardagHub.tsx (Phase 2 stub replaced)
- [x] client/src/pages/hubs/__tests__/MinVardagHub.test.tsx

**Commits exist:**
- [x] 040a965 — Task 1 (plumbing)
- [x] c2f999c — Task 2 (widgets + streakDays)
- [x] 9176743 — Task 3 (hub wiring + tests)

## Self-Check: PASSED
