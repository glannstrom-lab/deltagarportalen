---
phase: 05-full-hub-coverage-oversikt
plan: "05"
subsystem: oversikt-hub + 7 widgets + cross-hub aggregator + onboarded-hubs tracking + HubGrid XL
tags: [oversikt, hub, widgets, layout-persistence, hide-show, tdd, HUB-05, empathy, cross-hub-aggregation, react-query-dedup, getQueryData, onboarding, streakDays-consumer]
dependency_graph:
  requires:
    - 05-01-db-discovery-and-migrations-SUMMARY
    - 05-02-karriar-hub-SUMMARY
    - 05-03-resurser-hub-SUMMARY
    - 05-04-min-vardag-hub-SUMMARY
  provides:
    - HubOverview (full Phase 5 wiring)
    - useOversiktHubSummary (cross-hub aggregator)
    - useOnboardedHubsTracking (visit-tracking hook)
    - OversiktDataContext
    - OversiktLayoutContext
    - 7-oversikt-widgets (1 XL onboarding + 6 cross-hub summary)
    - HubGrid XL test (col-span-4 row-span-1 desktop)
  affects: [05-06-empty-state-pass-empathy-review]
tech_stack:
  added: []
  patterns:
    - cross-hub-aggregator
    - react-query-dedup
    - getQueryData-pitfall-D
    - onboarding-tracking
    - hub-summary-loader (consumer of 4 sibling loaders)
    - data-context
    - layout-context
    - lazy-widget
    - milestone-framing
    - anti-shaming
    - empathy-empty-states
    - shared-pure-utility (consumer of streakDays from Plan 04)
key_files:
  created:
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
    - client/src/pages/hubs/__tests__/HubOverview.test.tsx
  modified:
    - client/src/components/widgets/registry.ts
    - client/src/components/widgets/widgetLabels.ts
    - client/src/components/widgets/defaultLayouts.ts
    - client/src/components/widgets/HubGrid.test.tsx
    - client/src/components/widgets/__tests__/anti-shaming.test.tsx
    - client/src/components/widgets/__tests__/lazy-isolation.test.tsx
    - client/src/pages/hubs/HubOverview.tsx
    - client/src/pages/hubs/JobsokHub.tsx
    - client/src/pages/hubs/KarriarHub.tsx
    - client/src/pages/hubs/ResurserHub.tsx
    - client/src/pages/hubs/MinVardagHub.tsx
    - client/src/pages/hubs/__tests__/JobsokHub.test.tsx
    - client/src/pages/hubs/__tests__/KarriarHub.test.tsx
    - client/src/pages/hubs/__tests__/ResurserHub.test.tsx
    - client/src/pages/hubs/__tests__/MinVardagHub.test.tsx
decisions:
  - "useOversiktHubSummary is a cross-hub AGGREGATOR — it does NOT issue its own SELECTs for the four sub-hub data slices. It fires the Översikt-specific profile fetch (onboarded_hubs + full_name) AND invokes the four sibling hub-loader hooks (useJobsokHubSummary, useKarriarHubSummary, useResurserHubSummary, useMinVardagHubSummary). React Query deduplicates by query key — if those keys are already populated, no additional requests fire (Pitfall D resolution)."
  - "Cross-hub summary widgets (6 widgets) read via queryClient.getQueryData(JOBSOK_HUB_KEY|KARRIAR_HUB_KEY|MIN_VARDAG_HUB_KEY) — never call supabase.from. Verified via grep: zero supabase select calls in any of the 6 cross-hub widgets."
  - "useOnboardedHubsTracking uses useRef + useMutation: fires once per hook instance on first mount when userId is non-empty; idempotent (no-op when hubId already present in cached array). Updates OVERSIKT_HUB_KEY cache via setQueryData on success."
  - "All 5 hub pages (HubOverview + JobsokHub + KarriarHub + ResurserHub + MinVardagHub) call useOnboardedHubsTracking(HUB_ID) on mount. Each existing hub-test file received vi.mock for useOnboardedHubsTracking to prevent the real hook from hitting supabase.update during regression runs."
  - "OnboardingWidget is the only XL-only widget in the registry (allowedSizes: ['XL']). Detection logic: `profile?.onboarded_hubs?.length === 0` → new user (Välkommen + 4 quick-link CTAs); otherwise → returning user with greeting + deterministic next-step CTA. The next-step picker prioritises empty jobsok → empty diary → generic karriär goal."
  - "OnboardingWidget firstName fallback is 'där' when full_name is null (matches CONTEXT.md anti-pressure framing — never shame the user with 'okänd' or empty greeting)."
  - "InterviewSummaryWidget renders QUALITATIVE label only (≥80 'Stark prestation', ≥60 'Bra framsteg', ≥40 'Bygger upp', else 'Tid för övning'). Anti-shaming guard test additionally asserts no 2-3 digit number appears in primary KPI when score=85."
  - "HealthSummaryWidget imports streakDays from `@/utils/streakDays` (single source of truth — Plan 04 Task 2 lock). Verified by grep: 1 match for `from '@/utils/streakDays'`, 0 matches for `from.*HealthWidget` (template-copy leak guard)."
  - "HubGrid already supports XL via SIZE_CLASSES mapping (col-span-2 mobile + min-[900px]:col-span-4 desktop) — Plan 05 added an explicit XL test case to HubGrid.test.tsx asserting both col-span-4 desktop and col-span-2 mobile fallback."
  - "OnboardingWidget XL slot validates the HubGrid XL layout end-to-end: Plan 05's only XL widget appears at the top of the Översikt grid in section 'Idag', spans full row on desktop and full width on mobile."
  - "HubOverview integration test count: 14 (α-λ + μ1/μ2 + ν). γ asserts 7 hide-buttons (1 XL onboarding + 6 summary). ι asserts hub_id='oversikt' upsert. λ asserts 'Widget Välkommen dold'. μ1/μ2 verify new-vs-returning user differentiation. ν verifies useOnboardedHubsTracking('oversikt') invocation."
  - "Lazy-isolation test (pre-existing failure since Phase 2): EXPECTED_WIDGETS extended from 8 to 32 names — Bundle Contract preserved (32 lazy() entries verified)."
  - "JobsokHub.tsx HUB_ID const introduced (was inline 'jobb' in 3 places); replaces inline literals with single const declaration. Side-effect of adding useOnboardedHubsTracking(HUB_ID) — kept regression-minimal."
metrics:
  duration: "~25 min"
  completed_date: "2026-04-29"
  tasks: 4 (1 plumbing + 2a + 2b + 3 wiring)
  files: 32 (21 created + 11 modified)
---

# Phase 5 Plan 05: Översikt Hub (HUB-05) Summary

Full Översikt hub: 7 lazy-loaded widgets (1 XL onboarding banner + 6 cross-hub summary widgets) backed by a cross-hub aggregator hook that does NOT make its own SELECTs for sibling-hub data — it triggers the four other hub-loaders to leverage React Query dedup (Pitfall D resolution). New `useOnboardedHubsTracking` hook records hub visits in `profiles.onboarded_hubs`, called from all 5 hub pages. HubOverview replaces the Phase 2 stub — HUB-05 fulfilled. Anti-shaming, empathy framing, and the streakDays single-source-of-truth contract are all preserved.

---

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Hub plumbing — aggregator + tracking + contexts + registry/labels/layouts/HubGrid test | 0ad6e67 | 17 files (incl. 7 widget stubs) |
| 2a | OnboardingWidget XL + 3 JOBSOK-reading cross-hub summary widgets | d95a70b | 8 files |
| 2b | 3 KARRIAR/MIN_VARDAG cross-hub summary widgets + anti-shaming extension | 9970c5a | 7 files |
| 3 | Wire HubOverview.tsx + add useOnboardedHubsTracking to 4 existing hub pages + integration tests | 9ffd5ab | 11 files |

---

## Task 1: Hub Plumbing

### Cross-Hub Aggregator (Pitfall D Resolution)

`useOversiktHubSummary` is the only hub-loader in Phase 5 that does NOT fire its own SELECTs for the cross-hub data. Architecture:

```
useOversiktHubSummary
├── profileQ: useQuery(OVERSIKT_HUB_KEY, …)           ← own SELECT (profile only)
├── jobsokQ:    useJobsokHubSummary()                 ← triggers/dedups Promise.all of 5 selects
├── karriarQ:   useKarriarHubSummary()                ← triggers/dedups Promise.all of 3 selects
├── resurserQ:  useResurserHubSummary()               ← triggers/dedups Promise.all of 4 selects
└── minVardagQ: useMinVardagHubSummary()              ← triggers/dedups Promise.all of 6 selects
```

If a sibling hub's key is already in cache (e.g. user visited that hub earlier in the session), React Query deduplicates and no additional fetch fires. Cross-hub summary widgets read those cached slices directly via `queryClient.getQueryData(KEY)`.

### Onboarding Tracking Hook

`useOnboardedHubsTracking(hubId)` appends `hubId` to `profiles.onboarded_hubs` (text[] column from Plan 05-01 migration). Fire-once-per-mount via `useRef`. Idempotent at app level: if `hubId` is already in the cached array, no DB write happens. On success, `OVERSIKT_HUB_KEY` cache is updated via `setQueryData` so the OnboardingWidget reflects the returning-user state without a refetch.

### OversiktSummary Shape

```typescript
interface OversiktSummary {
  profile: { onboarded_hubs: string[]; full_name: string | null } | null
  jobsok: JobsokSummary | undefined        // undefined if user hasn't visited that hub
  karriar: KarriarSummary | undefined
  resurser: ResurserSummary | undefined
  minVardag: MinVardagSummary | undefined
}
```

### HubGrid XL Test

HubGrid already supported XL via the existing SIZE_CLASSES mapping (`col-span-2 min-[900px]:col-span-4 row-span-1`). Plan 05 added an explicit XL test case to HubGrid.test.tsx asserting:
- `col-span-4` (desktop responsive variant)
- `row-span-1`
- `col-span-2` (mobile fallback for the 2-col grid)

### Registry / Labels / DefaultLayouts Extensions

- `WIDGET_REGISTRY`: 7 new lazy() entries → **32 entries total** (8 Jobsok + 6 Karriär + 6 Resurser + 5 Min Vardag + 7 Översikt)
- `WIDGET_LABELS`: 7 new Swedish labels — `Record<WidgetId, string>` exhaustiveness enforced by TypeScript
- `defaultLayouts.oversikt`: replaced single-CV stub with 7-widget array (1 XL + 6 summary); `getOversiktSections()` returns 2 sections (Idag / Aktivitet)

---

## Task 2a: OnboardingWidget XL + 3 JOBSOK-Reading Cross-Hub Widgets

| Widget | Cache Source | Empty-State | Filled-State Primary KPI | CTA Route |
|--------|--------------|-------------|--------------------------|-----------|
| OnboardingWidget (XL) | OversiktDataContext (profile + cross-hub summaries) | "Välkommen till din portal" + 4 quick-link CTAs (`/jobb /karriar /resurser /min-vardag`) | "Bra jobbat {firstName}!" + deterministic next-step text | contextual (jobb / min-vardag / karriär) |
| JobsokSummaryWidget | JOBSOK_HUB_KEY → applicationStats.total | "Inga ansökningar än — börja söka idag" | "{N} aktiva ansökningar" | `/jobb` |
| CvStatusSummaryWidget | JOBSOK_HUB_KEY → cv | "Inget CV" + "Kom igång med ditt första CV" | "CV uppdaterat" + sv-locale date | `/cv` |
| InterviewSummaryWidget | JOBSOK_HUB_KEY → interviewSessions[0].score | "Tid för övning" + "Träna på vanliga frågor när du är redo" | qualitative label (Stark prestation ≥80 / Bra framsteg ≥60 / Bygger upp ≥40 / Tid för övning <40) | `/interview-simulator` |

OnboardingWidget detection logic:
- `profile.onboarded_hubs.length === 0` → new user, full Välkommen + 4 quick-links
- Otherwise → returning user, "Bra jobbat {firstName}!" with `pickNextStep` deterministic CTA: empty jobsok → empty diary → generic karriär goal
- `firstName` fallback: `'där'` when full_name is null (no shaming with 'okänd')

All 4 widgets forward `onHide` to Widget so the hide-button appears in editMode.

---

## Task 2b: 3 KARRIAR/MIN_VARDAG Cross-Hub Widgets + Anti-Shaming Extension

| Widget | Cache Source | Empty-State | Filled-State Primary KPI | CTA Route |
|--------|--------------|-------------|--------------------------|-----------|
| CareerGoalSummaryWidget | KARRIAR_HUB_KEY → careerGoals.shortTerm | "Inget mål satt" + "Sätt ditt nästa karriärmål när du är redo" | shortTerm (truncated >50 chars + ellipsis) | `/career` |
| HealthSummaryWidget | MIN_VARDAG_HUB_KEY → recentMoodLogs (via streakDays) | "Logga ditt mående" + "Om du vill — börja med ett klick" | "Loggat N dagar" / "Loggat 1 dag" (singular) | `/wellness` |
| DiarySummaryWidget | MIN_VARDAG_HUB_KEY → diaryEntryCount | "Skriv idag" + "Reflektera fritt om din vecka" | "{N} inlägg" | `/diary` |

### streakDays — Single Source of Truth Honored

`HealthSummaryWidget` imports streak helper as `import { streakDays } from '@/utils/streakDays'` — same path used by the Plan 04 `HealthWidget`. Verified via grep:
- `from '@/utils/streakDays'` — 1 match (the import)
- `from.*HealthWidget` — 0 matches (template-copy leak guard passes)

### Anti-Shaming Extension

`__tests__/anti-shaming.test.tsx` extended with new section:
- `oversiktSummaryCases` (6 cases): JobsokSummary / CvStatusSummary / InterviewSummary / CareerGoalSummary / HealthSummary / DiarySummary
- OnboardingWidget XL guard via OversiktDataProvider
- Special InterviewSummaryWidget guard: even when score=85, no 2-3 digit number appears in primary 22px font-bold KPI

Total cases: **8 (Jobsok) + 4 (Karriar guarded) + 6 (Resurser) + 5+1 (MinVardag) + 6+OnboardingXL+InterviewScore (Översikt) = 32 widgets covered**, all primary KPIs free of `\d+%`.

### Pitfall D Verification

```
$ grep "supabase.from" client/src/components/widgets/JobsokSummaryWidget.tsx \
                       client/src/components/widgets/CvStatusSummaryWidget.tsx \
                       client/src/components/widgets/InterviewSummaryWidget.tsx \
                       client/src/components/widgets/CareerGoalSummaryWidget.tsx \
                       client/src/components/widgets/HealthSummaryWidget.tsx \
                       client/src/components/widgets/DiarySummaryWidget.tsx
0 matches
```

Cross-hub widgets exclusively use `queryClient.getQueryData(KEY)` for cache reads.

---

## Task 3: Wire HubOverview + Tracking + Integration Tests

### HubOverview Provider Stack

Identical to MinVardagHub template with documented swaps:
- `HUB_ID 'min-vardag' → 'oversikt'`
- `useMinVardagHubSummary → useOversiktHubSummary` (returns `{data, isLoading}` — same shape, just different `data` type)
- `MinVardagDataProvider/LayoutProvider → OversiktDataProvider/LayoutProvider`
- `getMinVardagSections → getOversiktSections`
- PageLayout `domain='wellbeing' → 'action'` (green per UI-SPEC color mapping)
- New top-of-component-body line: `useOnboardedHubsTracking('oversikt')`

Template-copy leak guard:
```
$ grep -E "useKarriarLayout|useJobsokLayout|useResurserLayout|useMinVardagLayout" client/src/pages/hubs/HubOverview.tsx
0 matches
```

### useOnboardedHubsTracking Added to All 5 Hub Pages

Each hub page received one new line near top of component body:

| Hub Page | HUB_ID Constant | Tracking Call |
|----------|-----------------|---------------|
| JobsokHub.tsx | `'jobb'` (newly extracted from inline literal) | `useOnboardedHubsTracking(HUB_ID)` |
| KarriarHub.tsx | `'karriar'` (already existed) | `useOnboardedHubsTracking(HUB_ID)` |
| ResurserHub.tsx | `'resurser'` (already existed) | `useOnboardedHubsTracking(HUB_ID)` |
| MinVardagHub.tsx | `'min-vardag'` (already existed) | `useOnboardedHubsTracking(HUB_ID)` |
| HubOverview.tsx | `'oversikt'` | `useOnboardedHubsTracking(HUB_ID)` |

```
$ grep "useOnboardedHubsTracking(" client/src/pages/hubs/*.tsx | wc -l
5
```

### Existing Hub-Test Files Patched

The 4 existing hub test files (Jobsok / Karriar / Resurser / MinVardag) each received one new `vi.mock('@/hooks/useOnboardedHubsTracking', () => ({ useOnboardedHubsTracking: vi.fn() }))` block — without this, the real hook would call `supabase.update` during their regression runs and fail.

```
$ grep -l "vi.mock.*useOnboardedHubsTracking" client/src/pages/hubs/__tests__/*.test.tsx
JobsokHub.test.tsx
KarriarHub.test.tsx
MinVardagHub.test.tsx
ResurserHub.test.tsx
HubOverview.test.tsx (the new file mocks it directly with a captured spy)
```

### Integration Tests α-ν (14 tests)

11 standard tests α-λ mirror MinVardagHub:
- α: "Anpassa vy" button renders
- β: aria-pressed toggles editMode
- γ: 7 hide-buttons appear in edit mode (1 XL + 6 summary)
- δ: hide widget removes from grid (CUST-01)
- ε: Återvisa restores hidden widget (CUST-01)
- ζ: Återställ standardlayout opens ConfirmDialog
- η: confirming reset restores all 7 widgets
- θ: cancelling reset leaves layout unchanged
- ι: upsert payload contains hub_id='oversikt' and breakpoint='desktop'
- κ: all 7 widget headings render (HUB-05 acceptance)
- λ: aria-live announces "Widget Välkommen dold"

3 plan-05-specific tests:
- μ1: OnboardingWidget shows "Välkommen till din portal" when `onboarded_hubs=[]`
- μ2: OnboardingWidget shows "Bra jobbat Anna!" when `onboarded_hubs=['jobb']` and full_name='Anna Karlsson'
- ν: useOnboardedHubsTracking is invoked once with `'oversikt'` on mount

### Final Test Tally

| Suite | Count |
|-------|-------|
| Plan 05 hooks (useOversiktHubSummary + useOnboardedHubsTracking) | 8 |
| Plan 05 widgets (Onboarding + 6 summary + extended anti-shaming) | 23 |
| HubGrid (incl. new XL test) | 9 |
| HubOverview integration α-ν | 14 |
| **Existing regression** (Jobsok 24 / Karriar 11 / Resurser 11 / MinVardag 11) | 57 |
| Anti-shaming (32 cases, 4 sections + OnboardingWidget XL + InterviewSummary score guard) | ~32 |
| Lazy-isolation (extended to 32 widgets) | 7 |
| Plan 04 / 05 / earlier widgets passing untouched | rest |
| **Phase 5 final test suite (vitest run on widgets/ + hooks/ + hubs/__tests__/)** | **280 passed / 3 skipped (283 total)** |

`tsc --noEmit` clean. `npm run build` clean (no errors; chunk-size advisory only).

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Pre-existing lazy-isolation.test.tsx hard-coded to 8 widgets**

- **Found during:** Task 3 final regression run
- **Issue:** `client/src/components/widgets/__tests__/lazy-isolation.test.tsx` had `EXPECTED_WIDGETS = [8 names]` and asserted `Object.keys(WIDGET_REGISTRY).length === 8`. This was already failing post-Plan 02 when CareerGoalWidget etc. were added — pre-existing technical debt that was not flagged in earlier plans' regression runs.
- **Fix:** Extended EXPECTED_WIDGETS to 32 names (Söka jobb 8 + Karriär 6 + Resurser 6 + Min Vardag 5 + Översikt 7), and changed both numeric assertions to `expect(…).toBe(EXPECTED_WIDGETS.length)`.
- **Files modified:** `client/src/components/widgets/__tests__/lazy-isolation.test.tsx`
- **Commit:** 9ffd5ab (bundled with Task 3)

### Architectural notes (NOT deviations)

- HubGrid.tsx XL support was already implemented at the source level prior to Plan 05 — Task 1G described the SIZE_CLASSES extension as if it didn't exist, but the production code already supported XL. Plan 05 only extended HubGrid.test.tsx with the explicit XL assertion. This is consistent with the plan's `<done>` criterion ("HubGrid supports XL size — verified via the new test"), but not with the `<action>` step G's "extend SIZE_CLASSES with XL case" wording. No regression risk.
- JobsokHub.tsx had inline `'jobb'` literal in 3 places before Plan 05 (other hubs already used HUB_ID const). Plan 05 added the HUB_ID const + 3 substitutions for consistency with sibling hubs. Risk-free refactor (constant value unchanged).

### Auth gates encountered

None. All work was test-only or local-only — no DB connections, no auth flows.

---

## Replication Recipe Confirmation (4× verified)

Plans 02 → 03 → 04 → 05 have all replicated the same 8-step wiring recipe successfully. Plan 05 differs structurally (Översikt is cross-hub aggregation, no new tables, no own SELECTs for sibling data) but reuses contexts/registry/labels via the same recipe with one new pattern (`getQueryData`-based widget reads).

---

## Phase 5 Final Widget Tally

| Hub | Widgets | Type |
|-----|---------|------|
| Söka jobb | 8 | data-driven (Plan 02) |
| Karriär | 6 | data-driven (Plan 02 / 5-02) |
| Resurser | 6 | mixed (3 data + 3 static) (Plan 03 / 5-03) |
| Min Vardag | 5 | data-driven (Plan 04 / 5-04) |
| Översikt | 7 | cross-hub-aggregator (1 XL + 6 summary, all read getQueryData) |
| **Total** | **32** | **across 5 hubs** |

`WIDGET_REGISTRY` exhaustively maps all 32 IDs; `WIDGET_LABELS` exhaustively provides Swedish display names; `getDefaultLayout` returns the right widget set for each `HubId`; `lazy-isolation.test.tsx` verifies 32 lazy() calls (Bundle Contract preserved).

---

## Self-Check

**Files exist:**
- [x] client/src/hooks/useOversiktHubSummary.ts
- [x] client/src/hooks/useOversiktHubSummary.test.ts
- [x] client/src/hooks/useOnboardedHubsTracking.ts
- [x] client/src/hooks/useOnboardedHubsTracking.test.ts
- [x] client/src/components/widgets/OversiktDataContext.tsx
- [x] client/src/components/widgets/OversiktLayoutContext.tsx
- [x] client/src/components/widgets/OnboardingWidget.tsx + .test.tsx
- [x] client/src/components/widgets/JobsokSummaryWidget.tsx + .test.tsx
- [x] client/src/components/widgets/CvStatusSummaryWidget.tsx + .test.tsx
- [x] client/src/components/widgets/InterviewSummaryWidget.tsx + .test.tsx
- [x] client/src/components/widgets/CareerGoalSummaryWidget.tsx + .test.tsx
- [x] client/src/components/widgets/HealthSummaryWidget.tsx + .test.tsx
- [x] client/src/components/widgets/DiarySummaryWidget.tsx + .test.tsx
- [x] client/src/pages/hubs/HubOverview.tsx (Phase 2 stub replaced)
- [x] client/src/pages/hubs/__tests__/HubOverview.test.tsx

**Commits exist:**
- [x] 0ad6e67 — Task 1 (plumbing)
- [x] d95a70b — Task 2a (OnboardingWidget XL + 3 jobsok-reading)
- [x] 9970c5a — Task 2b (3 karriar/min-vardag-reading + anti-shaming)
- [x] 9ffd5ab — Task 3 (HubOverview wiring + tracking + integration tests)

## Self-Check: PASSED
