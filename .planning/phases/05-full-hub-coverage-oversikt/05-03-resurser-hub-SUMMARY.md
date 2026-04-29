---
phase: 05-full-hub-coverage-oversikt
plan: "03"
subsystem: resurser-hub + 6 widgets + hub-plumbing
tags: [resurser, hub, widgets, layout-persistence, hide-show, supabase, tdd, HUB-03, static-content]
dependency_graph:
  requires: [05-01-db-discovery-and-migrations-SUMMARY, 05-02-karriar-hub-SUMMARY]
  provides: [ResurserHub, useResurserHubSummary, ResurserDataContext, ResurserLayoutContext, 6-resurser-widgets]
  affects: [05-04-min-vardag-hub, 05-05-oversikt-hub, 05-06-empty-state-pass-empathy-review]
tech_stack:
  added: []
  patterns: [hub-summary-loader, data-context, layout-context, lazy-widget, milestone-framing, anti-shaming, static-content-widget, deep-link-cache-sharing]
key_files:
  created:
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
    - client/src/pages/hubs/__tests__/ResurserHub.test.tsx
  modified:
    - client/src/components/widgets/registry.ts
    - client/src/components/widgets/widgetLabels.ts
    - client/src/components/widgets/defaultLayouts.ts
    - client/src/components/widgets/__tests__/anti-shaming.test.tsx
    - client/src/pages/hubs/ResurserHub.tsx
decisions:
  - "useResurserHubSummary fires Promise.all of exactly 4 selects (cvs, cover_letters, article_reading_progress, ai_team_sessions); 3 of 6 widgets are static-content (no DB)"
  - "Deep-link cache sharing with JobsokHub via setQueryData(['cv-versions'], ['cover-letters']) — single source of truth for documents across two hubs"
  - "Övningar widget ships STATIC for v1.0 per Pitfall G + 05-DB-DISCOVERY (no exercise_progress table exists; exercise_answers tracks answers, not completion)"
  - "Externa resurser + Utskriftsmaterial are unconditionally STATIC widgets (curated 3-link / 3-template lists) — never crash on missing slice"
  - "AI-team agent_id translated to Swedish display names (career-coach → Karriärcoach) via local AGENT_NAMES map; primary KPI is qualitative agent name (never a number)"
  - "Routes verified: /soka-jobb, /knowledge-base, /ai-team, /exercises (all present in App.tsx + navigation.ts)"
  - "Anti-shaming extended for 6 Resurser widgets — primary KPIs are qualitative labels: counts ('5 artiklar lästa'), agent names ('Senast: Karriärcoach'), composites ('CV + 2 brev klara')"
metrics:
  duration: "~9 min"
  completed_date: "2026-04-29"
  tasks: 3
  files: 17
---

# Phase 5 Plan 03: Resurser Hub Summary

Full Resurser hub: 6 lazy-loaded widgets (3 data-backed via Supabase, 3 static-content) with layout persistence/hide-show replicating Plan 02's pattern verbatim. ResurserHub replaces the Phase 2 stub with full ResurserLayoutProvider/ResurserDataProvider wiring — HUB-03 fulfilled. Documents data now shared via React Query cache keys with JobsokHub.

---

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Hub plumbing — loader + contexts + registry/labels/layouts | 32f5ceb | 7 files |
| 2 | 6 Resurser widgets + anti-shaming extension | 4d00dd5 | 13 files |
| 3 | Wire ResurserHub.tsx + α-λ integration tests | a43aa7f | 2 files |

---

## Task 1: Hub Plumbing

### Hub-Summary Loader Query Plan

`useResurserHubSummary` fires `Promise.all` of exactly 4 Supabase selects:

1. `cvs` — `SELECT id, updated_at WHERE user_id = userId` (single CV row, `maybeSingle`)
2. `cover_letters` — `SELECT id, title, created_at WHERE user_id = userId ORDER BY created_at DESC LIMIT 3`
3. `article_reading_progress` — `SELECT article_id, progress_percent, is_completed, completed_at WHERE user_id = userId ORDER BY completed_at DESC NULLS LAST LIMIT 3`
4. `ai_team_sessions` — `SELECT agent_id, updated_at WHERE user_id = userId ORDER BY updated_at DESC LIMIT 5`

Externa resurser, Utskriftsmaterial, and Övningar are STATIC widgets — no DB read.

### Cache-Sharing With JobsokHub

After Promise.all resolves, the loader writes to two **shared cache keys**:

```typescript
queryClient.setQueryData(['cv-versions'], summary.cv ? [summary.cv] : [])
queryClient.setQueryData(['cover-letters'], summary.coverLetters)
```

These are the EXACT keys `useJobsokHubSummary` writes to and `useDocuments` reads from. Result: when a user navigates Resurser → /cv (deep-link), the CV is already cached (no second fetch). The two hubs become a single source of truth for documents.

### ResurserSummary Shape

```typescript
interface ResurserSummary {
  cv: { id: string; updated_at: string } | null
  coverLetters: Array<{ id: string; title?: string; created_at: string }>
  recentArticles: Array<{ article_id: string; progress_percent: number; is_completed: boolean; completed_at: string | null }>
  articleCompletedCount: number
  aiTeamSessions: Array<{ agent_id: string; updated_at: string }>
  aiTeamSessionCount: number
}
```

`articleCompletedCount` is computed in the loader (count of `is_completed === true` rows from the LIMIT-3 fetch). Tests verify this counts only completed rows.

### Registry + Labels + DefaultLayouts Extensions

- `WIDGET_REGISTRY`: 6 new lazy() entries → now **20 entries total** (8 Jobsok + 6 Karriär + 6 Resurser)
- `WIDGET_LABELS`: 6 new Swedish labels — `Record<WidgetId, string>` exhaustiveness enforced by TypeScript
- `defaultLayouts`: resurser placeholder (single CV widget) replaced with 6-widget desktop layout
- `getResurserSections()` added — 3 sections: Mina (Mina dokument, Kunskapsbanken) / Bibliotek (Externa, Utskriftsmaterial) / Vägledning (AI-team, Övningar)

---

## Task 2: 6 Widgets Implemented

| Widget | Mode | Slice | Empty-state heading | Filled-state KPI | Route |
|--------|------|-------|---------------------|------------------|-------|
| MyDocumentsWidget    | data-backed | cv + coverLetters | "Inga dokument ännu" | "CV + N brev klara" (composite, no %) | /soka-jobb |
| KnowledgeBaseWidget  | data-backed | recentArticles + count | "Utforska kunskapsbanken" | "{N} artiklar lästa" (count, no %) | /knowledge-base |
| ExternalResourcesWidget | STATIC | — | (always renders 3-link list) | "3 utvalda externa länkar" | external (3 a[target=_blank]) |
| PrintResourcesWidget | STATIC | — | (always renders 3 PDFs) | "3 mallar att skriva ut" | /templates/*.pdf (download attr) |
| AITeamWidget         | data-backed | aiTeamSessions + count | "Ditt AI-team väntar" | "Senast: {Swedish agent name}" (qualitative) | /ai-team |
| ExercisesWidget      | STATIC v1.0 | — | (always renders CTA) | "Träna och öva" | /exercises |

### Static-Content Widgets

Three widgets ship without DataContext dependency. They render their full content unconditionally — no broken-empty edge cases possible. Implementation note: each still calls `useResurserSummary` indirectly via being rendered inside `ResurserDataProvider`, but the widget body never reads from the slice.

### Övningar Widget Decision (Pitfall G)

Per `05-DB-DISCOVERY.md` query 11: **no `exercise_progress` / `user_exercise_progress` table exists**. The closest table, `exercise_answers`, tracks user answers to questions — not completion. Per RESEARCH.md Pitfall G ("safer to ship static when no progress table exists"), the Övningar widget ships STATIC for v1.0. v1.1 may switch to data-backed if a progress-tracking table is added. Footer comment in `ExercisesWidget.tsx` documents this decision.

### AI-Team Agent Name Translation

`agent_id` (English DB key) is translated to Swedish display name via local `AGENT_NAMES` map:

```typescript
{
  'career-coach':       'Karriärcoach',
  'study-advisor':      'Studievägledare',
  'motivation-coach':   'Motivationscoach',
  'cv-coach':           'CV-coach',
  'interview-coach':    'Intervjucoach',
  'cover-letter-coach': 'Personligt brev-coach',
}
```

Primary KPI slot (22px font-bold) shows e.g. "Senast: Karriärcoach" — qualitative, never a number.

### Anti-Shaming Extension

Anti-shaming test now covers **20 widgets** with 6 new Resurser cases (5 with primary KPI numerics + 1 static):

- MyDocumentsWidget: composite text "CV + 2 brev klara" (passes — no `\d+%` in 22px font-bold)
- KnowledgeBaseWidget: "5 artiklar lästa" (passes — no `%` suffix)
- AITeamWidget: "Senast: Karriärcoach" (passes — no number at all)
- ExternalResources/PrintResources/Exercises: static, no primary KPI numerics

All 6 widgets forward `onHide` (Pitfall B verified via grep).

---

## Task 3: Integration Tests α–λ

11 tests, all passing for ResurserHub:

- α: "Anpassa vy" button renders
- β: aria-pressed toggles editMode on click
- γ: 6 hide-buttons appear in edit mode (HUB-03 widget count)
- δ: hiding "Mina dokument" removes it from grid (CUST-01)
- ε: Återvisa restores hidden widget (CUST-01)
- ζ: Återställ standardlayout opens ConfirmDialog with locked Swedish copy (CUST-02)
- η: confirming reset restores all 6 widgets
- θ: cancelling reset leaves layout unchanged
- ι: upsert payload contains hub_id='resurser' and breakpoint='desktop'
- κ: all 6 widget headings render (HUB-03 acceptance)
- λ: aria-live announces "Widget Mina dokument dold"

**Regression:** KarriarHub (11/11) and JobsokHub (24/24) all green — no template-copy leak.
**Final verification suite:** 87/87 tests across 11 files. tsc clean. Build green.

---

## Deviations from Plan

None — plan executed exactly as written. The replication recipe from Plan 02 transferred cleanly with only the documented swaps:

1. `HUB_ID` constant (`'karriar'` → `'resurser'`)
2. `KarriarSummary` → `ResurserSummary` (different slice names: cv, coverLetters, recentArticles, aiTeamSessions instead of careerGoals, latestSkillsAnalysis, etc.)
3. `Promise.all` tables: profiles + skills_analyses + personal_brand_audits → cvs + cover_letters + article_reading_progress + ai_team_sessions
4. Widget set: 6 Resurser widgets (3 data-backed + 3 static-content)
5. `getKarriarSections()` → `getResurserSections()` (sections renamed: Utforska/Analysera/Utveckla → Mina/Bibliotek/Vägledning)
6. STUB_SUMMARY in integration tests; widget heading values for α-λ assertions
7. PageLayout `domain` swap: `coaching` → `info` (Resurser blue per UI-SPEC color mapping)

**One additive that's NOT in Karriär:** the loader writes deep-link cache keys (`['cv-versions']`, `['cover-letters']`) — Karriär had no shared cache to sync with, but Resurser shares document data with JobsokHub, so the cache write is essential.

---

## Replication Recipe Confirmation (now 2× verified)

Plans 04-05 may copy this exact pattern. The 8-step wiring recipe, provider stack order, HiddenWidgetsPanel props pattern, and test structure are **identical across Plans 02 and 03**. Plan 04 (Min Vardag) needs additional attention to the `participant_id` (NOT `user_id`) column quirk in `consultant_participants` per 05-DB-DISCOVERY.md.

---

## Self-Check

**Files exist:**
- [x] client/src/hooks/useResurserHubSummary.ts
- [x] client/src/hooks/useResurserHubSummary.test.ts
- [x] client/src/components/widgets/ResurserDataContext.tsx
- [x] client/src/components/widgets/ResurserLayoutContext.tsx
- [x] client/src/components/widgets/MyDocumentsWidget.tsx + .test.tsx
- [x] client/src/components/widgets/KnowledgeBaseWidget.tsx + .test.tsx
- [x] client/src/components/widgets/ExternalResourcesWidget.tsx + .test.tsx
- [x] client/src/components/widgets/PrintResourcesWidget.tsx + .test.tsx
- [x] client/src/components/widgets/AITeamWidget.tsx + .test.tsx
- [x] client/src/components/widgets/ExercisesWidget.tsx + .test.tsx
- [x] client/src/pages/hubs/ResurserHub.tsx (Phase 2 stub replaced)
- [x] client/src/pages/hubs/__tests__/ResurserHub.test.tsx

**Commits exist:**
- [x] 32f5ceb — Task 1 (plumbing)
- [x] 4d00dd5 — Task 2 (widgets)
- [x] a43aa7f — Task 3 (hub wiring + tests)

## Self-Check: PASSED
