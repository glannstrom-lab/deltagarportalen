---
phase: 5
slug: full-hub-coverage-oversikt
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-29
---

# Phase 5 — Validation Strategy

> Per-phase validation contract. Largest phase: ~24 widgets across 4 hubs + Översikt + final empathy review.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 2.x (jsdom) |
| **Config file** | `client/vitest.config.ts` |
| **Quick run command** | `cd client && npm run test:run -- src/components/widgets/ src/pages/hubs/__tests__/ src/hooks/use*HubSummary.test.ts` |
| **Full suite command** | `cd client && npm run test:run` |
| **Estimated runtime** | ~40 seconds (full suite, current ~130 + Phase 5 additions ~80 tests) |

---

## Sampling Rate

- **After every task commit:** Run quick subset (touched widget/hook tests)
- **After every plan wave:** `cd client && npm run test:run`
- **Before `/gsd:verify-work`:** Full suite green + manual migration verification SQL passes + `05-EMPATHY-REVIEW.md` signed off
- **Max feedback latency:** 45 seconds

---

## Per-Plan Verification Map

### Plan 01: DB Discovery + Migrations

| Behavior | Type | Command |
|----------|------|---------|
| `profiles.onboarded_hubs TEXT[] DEFAULT '{}'` exists | manual SQL | `npx supabase db query --linked "SELECT column_name FROM information_schema.columns WHERE table_name='profiles' AND column_name='onboarded_hubs';" --output table` |
| `profiles.linkedin_url` exists (verify + add if missing) | manual SQL | same with column='linkedin_url' |
| Live verification: `exercises` user-progress table existence | manual SQL | `\dt exercise*` |
| Live verification: `consultant_participants` columns | manual SQL | `\d consultant_participants` |

### Plans 02-04: Per-hub widget wiring (Karriär, Resurser, Min Vardag)

For each hub:
| Behavior | Type | Command |
|----------|------|---------|
| `useXHubSummary` Promise.all of N selects | unit | `npm run test:run -- src/hooks/useXHubSummary.test.ts` |
| Each widget renders real data with empty-state fallback | unit | `npm run test:run -- src/components/widgets/{widget}.test.tsx` |
| `XDataContext` + `XLayoutContext` providers; XHub.tsx wires both | unit | `npm run test:run -- src/pages/hubs/__tests__/XHub.test.tsx` |
| Anti-shaming: no `\d+%` primary KPI | unit | extends anti-shaming.test.tsx |
| Layout persistence works on this hub | integration | XHub.test.tsx hide → save → reload assertion |

### Plan 05: Översikt

| Behavior | Type | Command |
|----------|------|---------|
| `useOversiktHubSummary` aggregates 4 other hub-loaders via cache reads | unit | `npm run test:run -- src/hooks/useOversiktHubSummary.test.ts` |
| Onboarding XL widget detects new user (empty `onboarded_hubs`) | unit | OnboardingWidget.test.tsx |
| Cross-hub summary widgets render summary from each hub | unit | per-summary-widget tests |
| HubOverview.tsx routes/wires correctly | integration | HubOverview.test.tsx |

### Plan 06: HUB-06 + Empathy Review

| Behavior | Type | Command |
|----------|------|---------|
| `05-PRE-IMPL-COPY-REVIEW.md` covers all 24+ widgets in 3 states each | manual file check | `wc -l` + grep section count |
| `05-EMPATHY-REVIEW.md` exists with both agents APPROVED | manual file check | grep "APPROVED" + commit SHA |
| All Phase 5 widget empty-state copy matches UI-SPEC contract | unit | extend anti-shaming.test.tsx with phase-5 widgets |

---

## Wave 0 Requirements (largest, ~24 widget test stubs)

Test files needed (per-hub batches):

**Karriär:**
- `client/src/hooks/useKarriarHubSummary.test.ts`
- `client/src/components/widgets/CareerGoalWidget.test.tsx`
- `client/src/components/widgets/InterestGuideWidget.test.tsx`
- `client/src/components/widgets/SkillGapWidget.test.tsx`
- `client/src/components/widgets/PersonalBrandWidget.test.tsx`
- `client/src/components/widgets/EducationWidget.test.tsx`
- `client/src/components/widgets/LinkedInWidget.test.tsx`

**Resurser:**
- `client/src/hooks/useResurserHubSummary.test.ts`
- `client/src/components/widgets/MyDocumentsWidget.test.tsx`
- `client/src/components/widgets/KnowledgeBaseWidget.test.tsx`
- `client/src/components/widgets/ExternalResourcesWidget.test.tsx`
- `client/src/components/widgets/PrintResourcesWidget.test.tsx`
- `client/src/components/widgets/AITeamWidget.test.tsx`
- `client/src/components/widgets/ExercisesWidget.test.tsx`

**Min Vardag:**
- `client/src/hooks/useMinVardagHubSummary.test.ts`
- `client/src/components/widgets/HealthWidget.test.tsx`
- `client/src/components/widgets/DiaryWidget.test.tsx`
- `client/src/components/widgets/CalendarWidget.test.tsx`
- `client/src/components/widgets/NetworkWidget.test.tsx`
- `client/src/components/widgets/ConsultantWidget.test.tsx`

**Översikt:**
- `client/src/hooks/useOversiktHubSummary.test.ts`
- `client/src/components/widgets/OnboardingWidget.test.tsx`
- 6× cross-hub summary widget tests

**Per-hub integration tests:**
- `client/src/pages/hubs/__tests__/KarriarHub.test.tsx`
- `client/src/pages/hubs/__tests__/ResurserHub.test.tsx`
- `client/src/pages/hubs/__tests__/MinVardagHub.test.tsx`
- `client/src/pages/hubs/__tests__/HubOverview.test.tsx`

**Cross-cutting:**
- `client/src/components/widgets/__tests__/anti-shaming.test.tsx` extended with all 24 new widgets

**Artifact files:**
- `.planning/phases/05-full-hub-coverage-oversikt/05-PRE-IMPL-COPY-REVIEW.md` (Plan 06)
- `.planning/phases/05-full-hub-coverage-oversikt/05-EMPATHY-REVIEW.md` (Plan 06)

---

## Manual-Only Verifications

| Behavior | Why Manual | Test Instructions |
|----------|-----------|-------------------|
| Migrations applied to remote DB | `db query --linked -f` requires interactive auth | After commit: `npx supabase db query --linked -f supabase/migrations/{filename}.sql`; verify with column-introspection SQL |
| RLS policies live | RLS evaluation requires JWT context | Login as test user, attempt cross-user SELECT, expect 0 rows |
| Empathy review sign-off | Domain agents review subjectively | Two-agent review pass on PRE-IMPL artifact, BLOCKs stop, FLAGs deferred |

---

## Validation Sign-Off

- [ ] Every task has automated `<acceptance_criteria>` or Wave 0 dependency
- [ ] Sampling continuity preserved per plan
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 45s
- [ ] `nyquist_compliant: true` set once Wave 0 deliverables land

**Approval:** pending
