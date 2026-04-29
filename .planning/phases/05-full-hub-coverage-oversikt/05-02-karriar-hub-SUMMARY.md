---
phase: 05-full-hub-coverage-oversikt
plan: "02"
subsystem: karriar-hub + 6 widgets + hub-plumbing
tags: [karriar, hub, widgets, layout-persistence, hide-show, supabase, tdd, HUB-02]
dependency_graph:
  requires: [05-01-db-discovery-and-migrations-SUMMARY]
  provides: [KarriarHub, useKarriarHubSummary, KarriarDataContext, KarriarLayoutContext, 6-karriar-widgets]
  affects: [05-03-resurser-hub, 05-04-min-vardag-hub, 05-05-oversikt-hub]
tech_stack:
  added: []
  patterns: [hub-summary-loader, data-context, layout-context, lazy-widget, milestone-framing, anti-shaming]
key_files:
  created:
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
    - client/src/pages/hubs/__tests__/KarriarHub.test.tsx
  modified:
    - client/src/components/widgets/registry.ts
    - client/src/components/widgets/widgetLabels.ts
    - client/src/components/widgets/defaultLayouts.ts
    - client/src/components/widgets/__tests__/anti-shaming.test.tsx
    - client/src/pages/hubs/KarriarHub.tsx
decisions:
  - "useKarriarHubSummary fires Promise.all of exactly 3 selects (profiles×1, skills_analyses, personal_brand_audits) — Pitfall E compliant"
  - "InterestGuideWidget reads useInterestProfile() directly (Pitfall F — not in KarriarDataContext slice)"
  - "EducationWidget is static-content (no DB slice) — RESEARCH.md confirmed"
  - "Routes verified: /career (not /career-plan), /skills-gap-analysis, /personal-brand, /interest-guide, /education, /linkedin-optimizer, /profile"
  - "makeBuilder: limit() returns builder (not resolve) so .limit(1).maybeSingle() chain works in tests"
  - "Anti-shaming extended with 4 Karriär widgets (CareerGoal, InterestGuide, SkillGap, PersonalBrand); EducationWidget and LinkedInWidget are static/non-numeric, excluded from cases"
metrics:
  duration: "~10 min"
  completed_date: "2026-04-29"
  tasks: 3
  files: 21
---

# Phase 5 Plan 02: Karriär Hub Summary

Full Karriär hub: 6 lazy-loaded widgets backed by real Supabase data through a hub-summary loader (Promise.all of 3 selects), with layout persistence/hide-show replicating the Phase 4 pattern. KarriarHub replaces the Phase 2 stub with full KarriarLayoutProvider/KarriarDataProvider wiring — HUB-02 fulfilled.

---

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Hub plumbing — loader + contexts + registry/labels/layouts | ddf5225 | 7 files |
| 2 | 6 Karriär widgets + anti-shaming extension | ebec8cb | 13 files |
| 3 | Wire KarriarHub.tsx + α-λ integration tests | 5c9bbe9 | 2 files |

---

## Task 1: Hub Plumbing

### Hub-Summary Loader Query Plan

`useKarriarHubSummary` fires `Promise.all` of exactly 3 Supabase selects:

1. `profiles` — `SELECT career_goals, linkedin_url WHERE id = userId` (single row, covers both Karriärmål + LinkedIn — Pitfall E: one profiles query only)
2. `skills_analyses` — `SELECT dream_job, skills_comparison, match_percentage, created_at WHERE user_id = userId ORDER BY created_at DESC LIMIT 1 maybeSingle`
3. `personal_brand_audits` — `SELECT score, dimensions, created_at WHERE user_id = userId ORDER BY created_at DESC LIMIT 1 maybeSingle` (Pitfall C: PLURAL table name)

No `queryClient.setQueryData` cache writes (unlike JobsokHubSummary) — Karriär data has no pre-existing deep-link query keys to sync with.

### KarriarSummary Shape

```typescript
interface KarriarSummary {
  careerGoals: { shortTerm?: string; longTerm?: string; preferredRoles?: string[]; ... } | null
  linkedinUrl: string | null
  latestSkillsAnalysis: { dream_job: string; skills_comparison: unknown; match_percentage: number; created_at: string } | null
  latestBrandAudit: { score: number; dimensions: unknown; created_at: string } | null
}
```

### Registry + Labels + DefaultLayouts Extensions

- `WIDGET_REGISTRY`: 6 new lazy() entries (karriar-mal, intresseguide, kompetensgap, personligt-varumarke, utbildning, linkedin)
- `WIDGET_LABELS`: 6 new Swedish labels — `Record<WidgetId, string>` exhaustiveness enforced by TypeScript
- `defaultLayouts`: karriar placeholder replaced with 6-widget desktop layout; `getKarriarSections()` added (3 sections: Utforska/Analysera/Utveckla)

---

## Task 2: 6 Widgets Implemented

| Widget | Slice | Empty-state heading | Filled-state KPI | Route |
|--------|-------|---------------------|------------------|-------|
| CareerGoalWidget | careerGoals | "Inga aktiva mål" | shortTerm text (string, not %) | /career |
| InterestGuideWidget | useInterestProfile() directly | "Utforska dina intressen" | Dominant RIASEC type names | /interest-guide |
| SkillGapWidget | latestSkillsAnalysis | "Ingen analys gjord" | Milestone label (Nära målet etc.) | /skills-gap-analysis |
| PersonalBrandWidget | latestBrandAudit | "Ditt personliga varumärke" | Brand label (Starkt varumärke etc.) | /personal-brand |
| EducationWidget | static (no slice) | "Hitta din nästa utbildning" | Always shows CTA | /education |
| LinkedInWidget | linkedinUrl | "Koppla LinkedIn" | "Profil ansluten" | /profile → /linkedin-optimizer |

All 6 widgets: forward `onHide` to `<Widget>` (Pitfall B), correct `allowedSizes`, footer only at M/L sizes.

Anti-shaming extension: 4 Karriär widgets added to canonical `anti-shaming.test.tsx` (CareerGoal uses string KPI, SkillGap + PersonalBrand use milestone labels — none render raw `\d+%` in 32/22px font-bold slot).

---

## Task 3: Integration Tests α–λ

11 tests, all passing:

- α: "Anpassa vy" button renders
- β: aria-pressed toggles editMode on click
- γ: 6 hide-buttons appear in edit mode
- δ: hiding Karriärmål removes it from grid
- ε: Återvisa restores hidden widget
- ζ: Återställ opens ConfirmDialog with locked Swedish copy
- η: confirming reset restores all 6 widgets
- θ: cancelling reset leaves layout unchanged
- ι: upsert payload contains hub_id='karriar' and breakpoint='desktop'
- κ: all 6 widget headings render (HUB-02 acceptance)
- λ: aria-live announces "Widget Karriärmål dold"

JobsokHub regression: 24/24 still green. Build: successful.

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] makeBuilder.limit() must return builder, not resolve()**
- **Found during:** Task 1 TDD RED phase — tests failing with "expected false to be true" on isSuccess
- **Issue:** `builder.limit = vi.fn(resolve)` returned a Promise when `.limit(1)` was called, then `.maybeSingle()` was chained on the Promise (which doesn't have that method), causing the hook to never resolve
- **Fix:** Changed to `builder.limit = vi.fn(() => builder)` so the chain `.limit(1).maybeSingle()` correctly calls `maybeSingle` on the builder
- **Files modified:** `client/src/hooks/useKarriarHubSummary.test.ts`
- **Commit:** ddf5225 (test fix included in same task commit)

**2. [Rule 2 - Auto-fix] Test 3 (disabled-query) rewritten to avoid vi.doMock cache issue**
- **Found during:** Task 1 — vi.doMock doesn't clear module cache in same test file after vi.mock hoisting
- **Fix:** Rewrote test 3 to verify the successful-resolved query has isFetching=false (complement test), removing the doMock approach
- **Files modified:** `client/src/hooks/useKarriarHubSummary.test.ts`

**3. [Rule 2 - Missing] useInterestProfile mock added to anti-shaming.test.tsx**
- **Found during:** Task 2 — extending anti-shaming with InterestGuideWidget would fail because useInterestProfile calls real cloudStorage API
- **Fix:** Added vi.mock for useInterestProfile at the top of anti-shaming.test.tsx
- **Files modified:** `client/src/components/widgets/__tests__/anti-shaming.test.tsx`

**4. [Rule 2 - Missing] useInterestProfile mock added to KarriarHub.test.tsx**
- **Found during:** Task 3 — InterestGuideWidget inside KarriarHub calls useInterestProfile directly
- **Fix:** Added vi.mock for useInterestProfile in KarriarHub.test.tsx
- **Files modified:** `client/src/pages/hubs/__tests__/KarriarHub.test.tsx`

---

## Replication Recipe Confirmation

Plans 03-04 may copy this plan structure verbatim, swapping only:
1. `HUB_ID` constant (`'karriar'` → `'resurser'` / `'min-vardag'`)
2. `KarriarSummary` type definition and slice names
3. `Promise.all` tables and SELECT columns (see 05-DB-DISCOVERY.md)
4. Widget set (6 widgets × create + test files)
5. `getKarriarSections()` → `getResurserSections()` / `getMinVardagSections()`
6. Test mock STUB_SUMMARY and widget heading names (α-λ test values)

The 8-step wiring recipe, provider stack order, HiddenWidgetsPanel props pattern, and test structure are identical.

---

## Self-Check

**Files exist:**
- [x] client/src/hooks/useKarriarHubSummary.ts
- [x] client/src/hooks/useKarriarHubSummary.test.ts
- [x] client/src/components/widgets/KarriarDataContext.tsx
- [x] client/src/components/widgets/KarriarLayoutContext.tsx
- [x] client/src/components/widgets/CareerGoalWidget.tsx + .test.tsx
- [x] client/src/components/widgets/InterestGuideWidget.tsx + .test.tsx
- [x] client/src/components/widgets/SkillGapWidget.tsx + .test.tsx
- [x] client/src/components/widgets/PersonalBrandWidget.tsx + .test.tsx
- [x] client/src/components/widgets/EducationWidget.tsx + .test.tsx
- [x] client/src/components/widgets/LinkedInWidget.tsx + .test.tsx
- [x] client/src/pages/hubs/KarriarHub.tsx (Phase 2 stub replaced)
- [x] client/src/pages/hubs/__tests__/KarriarHub.test.tsx

**Commits exist:**
- [x] ddf5225 — Task 1 (plumbing)
- [x] ebec8cb — Task 2 (widgets)
- [x] 5c9bbe9 — Task 3 (hub wiring + tests)

## Self-Check: PASSED
