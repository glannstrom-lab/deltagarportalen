---
phase: 3
slug: data-wiring-wcag
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-28
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 2.x (jsdom) — `@testing-library/react`, `@testing-library/jest-dom` |
| **Config file** | `client/vitest.config.ts` (exists) |
| **Quick run command** | `cd client && npm run test:run -- src/hooks/useJobsokHubSummary.test.ts src/components/widgets/ApplicationsWidget.test.tsx` |
| **Full suite command** | `cd client && npm run test:run` |
| **Estimated runtime** | ~25 seconds (full suite, current 27 tests + Phase 3 additions ~40 tests) |

---

## Sampling Rate

- **After every task commit:** Run quick subset (data-layer hooks + widget tests touching the modified file)
- **After every plan wave:** Run `cd client && npm run test:run` (full suite)
- **Before `/gsd:verify-work`:** Full suite must be green + manual migration verification SQL passes + `03-EMPATHY-REVIEW.md` signed off by both agents
- **Max feedback latency:** 30 seconds (full suite)

---

## Per-Task Verification Map

| Req ID | Behavior | Test Type | Automated Command | File Exists | Status |
|--------|----------|-----------|-------------------|-------------|--------|
| HUB-01 (loader) | `useJobsokHubSummary` fires Promise.all, populates summary object | unit | `npm run test:run -- src/hooks/useJobsokHubSummary.test.ts` | ❌ Wave 0 | ⬜ pending |
| HUB-01 (cache sync) | After loader resolves, `queryClient.getQueryData(['application-stats'])` is populated for deep-link cache-hit | unit | same file | ❌ Wave 0 | ⬜ pending |
| HUB-01 (ApplicationsWidget) | Widget renders real total + per-status breakdown from hub summary (not MOCK constant) | unit | `npm run test:run -- src/components/widgets/ApplicationsWidget.test.tsx` | ❌ Wave 0 | ⬜ pending |
| HUB-01 (CvWidget) | Widget renders milestone label from `completion_pct`; no "X%" string in primary KPI | unit | `npm run test:run -- src/components/widgets/CvWidget.test.tsx` | ❌ Wave 0 | ⬜ pending |
| HUB-01 (CoverLetterWidget) | Widget renders draft count + last edited from cover_letters table | unit | `npm run test:run -- src/components/widgets/CoverLetterWidget.test.tsx` | ❌ Wave 0 | ⬜ pending |
| HUB-01 (InterviewWidget) | Widget renders real score from interview_sessions latest row; sparkline shows last 8 sessions | unit | `npm run test:run -- src/components/widgets/InterviewWidget.test.tsx` | ❌ Wave 0 | ⬜ pending |
| HUB-01 (JobSearchWidget) | Widget renders top-3 matches with qualitative labels (no raw %) | unit | `npm run test:run -- src/components/widgets/JobSearchWidget.test.tsx` | ❌ Wave 0 | ⬜ pending |
| HUB-01 (SpontaneousWidget) | Widget renders pipeline count from spontaneous_companies | unit | `npm run test:run -- src/components/widgets/SpontaneousWidget.test.tsx` | ❌ Wave 0 | ⬜ pending |
| HUB-01 (SalaryWidget) | If salary_data table exists: renders figure + range; else: empty state with CTA | unit | `npm run test:run -- src/components/widgets/SalaryWidget.test.tsx` | ❌ Wave 0 | ⬜ pending |
| HUB-01 (InternationalWidget) | Empty state if no countries (default Phase 3 behavior) | unit | `npm run test:run -- src/components/widgets/InternationalWidget.test.tsx` | ❌ Wave 0 | ⬜ pending |
| DATA-01 (migration) | `interview_sessions.score NUMERIC(4,1)` and `score_breakdown JSONB` columns exist | manual SQL | `npx supabase db query --linked "SELECT column_name, data_type FROM information_schema.columns WHERE table_name='interview_sessions' AND column_name IN ('score','score_breakdown');" --output table` | N/A (manual) | ⬜ pending |
| DATA-01 (RLS) | Existing 4 RLS policies still pass; new column not exposed bypassing user_id check | manual SQL | `npx supabase db query --linked "SELECT policyname, cmd FROM pg_policies WHERE tablename='interview_sessions';" --output table` | N/A (manual) | ⬜ pending |
| DATA-01 (persistence) | `interviewService.saveSession` writes score; subsequent fetch returns it | unit | `npm run test:run -- src/services/interviewService.test.ts` | ❌ Wave 0 | ⬜ pending |
| DATA-02 (migration) | `personal_brand_audits` table exists with correct schema (id, user_id, score, dimensions, summary, created_at) | manual SQL | `npx supabase db query --linked "SELECT column_name, data_type FROM information_schema.columns WHERE table_name='personal_brand_audits';" --output table` | N/A (manual) | ⬜ pending |
| DATA-02 (RLS) | 4 policies on `auth.uid() = user_id` (select/insert/update/delete) | manual SQL | `npx supabase db query --linked "SELECT policyname, cmd FROM pg_policies WHERE tablename='personal_brand_audits';" --output table` | N/A (manual) | ⬜ pending |
| DATA-02 (persistence) | `personalBrandAuditsApi.create()` inserts row; widget reads latest by created_at DESC | unit | `npm run test:run -- src/services/personalBrandAuditsApi.test.ts` | ❌ Wave 0 | ⬜ pending |
| A11Y-01 (keyboard) | All widget S/M/L toggles reachable via Tab; Enter/Space changes size | unit | `npm run test:run -- src/pages/hubs/__tests__/JobsokHub.test.tsx` (extend) | ✅ exists | ⬜ pending |
| A11Y-01 (live region) | Single `aria-live="polite"` announcement on size change ("Widgeten är nu M-storlek") | unit | same JobsokHub.test.tsx | ✅ exists | ⬜ pending |
| A11Y-02 (reduced motion) | When `prefers-reduced-motion: reduce` matches, no Framer Motion transitions fire | unit | `npm run test:run -- src/components/widgets/__tests__/reduced-motion.test.tsx` | ❌ Wave 0 | ⬜ pending |
| A11Y-03 (no raw %) | Anti-shaming guard: no widget renders a number followed by "%" as primary KPI text | unit | `npm run test:run -- src/components/widgets/__tests__/anti-shaming.test.tsx` | ❌ Wave 0 | ⬜ pending |
| A11Y-04 (closed hidden) | `ApplicationsWidget` with real data hides closed segment by default; toggle reveals them | unit | `npm run test:run -- src/components/widgets/ApplicationsWidget.test.tsx` (shared with HUB-01) | ❌ Wave 0 | ⬜ pending |
| A11Y-05 (empathy sign-off) | `.planning/phases/03-data-wiring-wcag/03-EMPATHY-REVIEW.md` exists with both agents' final verdicts + commit SHA | manual file check | Read by `gsd-verifier` at phase gate | ❌ Wave 0 (artefact) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Test files and artifacts that must be created in Plan 01 (or as Wave 0 of subsequent plans):

- [ ] `client/src/hooks/useJobsokHubSummary.test.ts` — HUB-01 loader + cache-sync
- [ ] `client/src/components/widgets/ApplicationsWidget.test.tsx` — HUB-01 widget data + A11Y-04 closed-filter
- [ ] `client/src/components/widgets/CvWidget.test.tsx` — HUB-01 + milestone-framing
- [ ] `client/src/components/widgets/CoverLetterWidget.test.tsx` — HUB-01 cover letters
- [ ] `client/src/components/widgets/InterviewWidget.test.tsx` — HUB-01 + DATA-01 score render
- [ ] `client/src/components/widgets/JobSearchWidget.test.tsx` — HUB-01 + qualitative match label assertion
- [ ] `client/src/components/widgets/SpontaneousWidget.test.tsx` — HUB-01 pipeline count
- [ ] `client/src/components/widgets/SalaryWidget.test.tsx` — HUB-01 conditional on table existence
- [ ] `client/src/components/widgets/InternationalWidget.test.tsx` — HUB-01 empty-state default
- [ ] `client/src/services/interviewService.test.ts` — DATA-01 persistence flow
- [ ] `client/src/services/personalBrandAuditsApi.test.ts` — DATA-02 persistence flow
- [ ] `client/src/components/widgets/__tests__/reduced-motion.test.tsx` — A11Y-02
- [ ] `client/src/components/widgets/__tests__/anti-shaming.test.tsx` — A11Y-03 (asserts no `\d+%` in primary-KPI slots across all 8 widgets)
- [ ] `.planning/phases/03-data-wiring-wcag/03-EMPATHY-REVIEW.md` — A11Y-05 sign-off artefact (created in Plan 04 or 05)

**Existing tests to extend (not replace):**
- `client/src/pages/hubs/__tests__/JobsokHub.test.tsx` — add keyboard-navigation + live-region assertions for A11Y-01

**Supabase mock setup:** Use existing `createMockSupabaseClient()` from `client/src/test/setup.ts`. Extend `.from()` mock to return fixture data for `cvs`, `cover_letters`, `interview_sessions`, `job_applications`, `spontaneous_companies`.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Migration applied to remote DB | DATA-01, DATA-02 | Migrations are run manually with `db query --linked -f` (CLAUDE.md rule), not in CI | After commit: `npx supabase db query --linked -f supabase/migrations/{filename}.sql`; verify with column-introspection SQL above |
| RLS policy correctness | DATA-01, DATA-02 | RLS evaluation requires authenticated session; CI does not have JWT context | Login as test user in browser; run insert/select; verify cross-user query returns 0 rows |
| Empathy review sign-off | A11Y-05 | Subjective review by domain agents — not automatable | Agents read 03-EMPATHY-REVIEW.md draft + screenshots; write verdict (PASS/FLAG/BLOCK) per widget; revise once if FLAG; commit when both PASS |
| EXPLAIN ANALYZE per-widget query timing | HUB-01 (Pitfalls 3, 18) | Live DB performance, requires running queries against production-like data | Plan 01 task: run EXPLAIN ANALYZE for each hub query, document results in `03-DB-PERFORMANCE.md`; if cumulative > 50ms, document RPC migration as v1.1 followup |

---

## Validation Sign-Off

- [ ] All tasks have automated `<acceptance_criteria>` or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify (manual SQL counts as verify when paired with subsequent unit test on the data)
- [ ] Wave 0 covers all MISSING references in Per-Task Verification Map
- [ ] No watch-mode flags (use `npm run test:run`, not `npm run test`)
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter once all Wave 0 deliverables land

**Approval:** pending
