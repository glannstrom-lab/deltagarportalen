---
phase: 05-full-hub-coverage-oversikt
plan: "06"
subsystem: HUB-06 ship gate (empathy review + bare-zero contract enforcement) + 1 widget code revision
tags: [empathy-review, ship-gate, HUB-06, anti-shaming, copy-review, dual-agent-review, revision-pass, langtidsarbetssokande, arbetskonsulent, phase-5-close]
dependency_graph:
  requires:
    - 05-01-db-discovery-and-migrations-SUMMARY
    - 05-02-karriar-hub-SUMMARY
    - 05-03-resurser-hub-SUMMARY
    - 05-04-min-vardag-hub-SUMMARY
    - 05-05-oversikt-hub-SUMMARY
  provides:
    - 05-PRE-IMPL-COPY-REVIEW.md (86 widget×state rows — locked source of truth for Phase 5 copy)
    - 05-EMPATHY-REVIEW.md (dual-agent APPROVED ship-gate artifact)
    - 05-VALIDATION.md frontmatter flipped to nyquist_compliant: true + wave_0_complete: true + status: complete
    - OnboardingWidget revision (no-apps branch heading + body softening per langtidsarbetssokande BLOCK B1)
    - usePraiseHeading branch flag pattern for differentiated greeting framing
  affects: [Phase 5 closure → /gsd:verify-work]
tech_stack:
  added: []
  patterns:
    - dual-agent-empathy-review
    - revision-pass-iteration-budget
    - bare-zero-grep-guard
    - praise-vs-neutral-greeting-differentiation
    - branch-flag-for-empathy-conditional
key_files:
  created:
    - .planning/phases/05-full-hub-coverage-oversikt/05-PRE-IMPL-COPY-REVIEW.md
    - .planning/phases/05-full-hub-coverage-oversikt/05-EMPATHY-REVIEW.md
    - .planning/phases/05-full-hub-coverage-oversikt/05-06-empty-state-pass-empathy-review-SUMMARY.md
  modified:
    - .planning/phases/05-full-hub-coverage-oversikt/05-VALIDATION.md
    - client/src/components/widgets/OnboardingWidget.tsx
    - client/src/components/widgets/OnboardingWidget.test.tsx
    - client/src/pages/hubs/__tests__/HubOverview.test.tsx
decisions:
  - "HUB-06 BLOCK B1 (langtidsarbetssokande, OnboardingWidget no-apps) resolved via Mikael option 3 — apply BOTH heading and body fixes. Heading swap to neutral 'Hej ${firstName}' on the no-apps branch only; body softened to 'Vill du ta första steget idag?' (drops the negative 'Du har inte sökt något jobb än' framing). Other returning-user branches (no-diary, default) keep 'Bra jobbat ${firstName}!' praise heading where there's something to praise."
  - "Implementation uses NextStep.usePraiseHeading: boolean returned from pickNextStep — no-apps branch sets false, other branches set true. Heading element renders conditional template literal on this flag. Pattern is local to OnboardingWidget; no shared utility extracted (single-use empathy-conditional)."
  - "10 cumulative FLAG verdicts (across both agents) deferred to v1.1 backlog: F1/F2 Utbildning static→data, F3 Kunskapsbanken raw article_id slug, F4/F5 Övningar static→progress data, F6 Min konsulent passive 'Inget möte inplanerat', F8 Söka jobb-summary heading/body redundancy, langtidsarbetssokande F1-F3 (overlap with arbetskonsulent F3/F6/F8). All are 2-30 minute copy fixes or v1.1 data wiring — none structural."
  - "Iteration budget honored: 1 review + 1 revision pass per agent (locked in 05-CONTEXT.md). After revision pass, both agents APPROVED with 0 BLOCKs — no second pass attempted; no escalation needed."
  - "Test updates required by revision: OnboardingWidget.test.tsx Tests B/C rewritten to assert new no-apps copy ('Hej Anna' + new body); new Test D added to assert praise heading preserved on no-diary branch. HubOverview.test.tsx μ2 renamed and assertion swapped. All test changes documented in commit ade4426."
  - "Phase 5 closure: nyquist_compliant flipped true; status 'draft' → 'complete'; wave_0_complete true. 5 acceptance criteria all met (HUB-02 through HUB-06). Phase 5 ready for /gsd:verify-work."
metrics:
  duration: "~30 min (this session — revision pass after Mikael adjudication)"
  cumulative_duration: "~60 min (across both sessions: PRE-IMPL generation + dual-agent review + HELD checkpoint + revision pass + Phase 5 closure)"
  completed_date: "2026-04-29"
  tasks: 5 (Tasks 1-3 in prior session, Task 4 revision pass + Task 5 closure in this session)
  files: 7 (3 created + 4 modified across both sessions; this session: 4 modified — OnboardingWidget.tsx + 2 test files + 1 doc artifact, plus 4 docs created/updated: PRE-IMPL update, EMPATHY-REVIEW second pass, VALIDATION flip, this SUMMARY)
  rows_reviewed: 86
  block_count_initial: 1
  block_count_final: 0
  flag_count_final: 10
  pass_count_final: 161
---

# Phase 5 Plan 06: Empty-State Pass + Empathy Review Summary

HUB-06 ship gate: CLOSED. Phase 5 closes with both empathy agents (`arbetskonsulent` and `langtidsarbetssokande`) returning APPROVED on the full 86-row PRE-IMPL copy artifact after one revision pass on the OnboardingWidget no-apps branch (Mikael adjudicated option 3 — apply both heading and body fixes). Iteration budget honored. 10 FLAG verdicts deferred to v1.1 backlog. `nyquist_compliant: true` flipped in 05-VALIDATION.md. Phase 5 ready for `/gsd:verify-work`.

---

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Generate 05-PRE-IMPL-COPY-REVIEW.md from actual widget source (86 rows) + bare-zero audit | e31dc65 | 1 file (artifact) |
| 2-3 | Dual-agent verdicts: arbetskonsulent + langtidsarbetssokande | 88ea84c | 1 file (05-EMPATHY-REVIEW.md) |
| 4a | Record HELD checkpoint on langtidsarbetssokande BLOCK B1 (overnight policy: BLOCK stops) | d69042d | 1 file (state note) |
| 4b | Revision pass — code fix per Mikael option 3 (heading + body softening) | ade4426 | 3 files (OnboardingWidget.tsx + 2 tests) |
| 4c | Synchronize PRE-IMPL artifact with revised code | 3e4ad51 | 1 file (PRE-IMPL update) |
| 4d | Append revision-pass empathy verdicts (both agents APPROVED, B1 resolved) | e42dd75 | 1 file (EMPATHY-REVIEW second pass) |
| 5 | Flip 05-VALIDATION.md frontmatter to nyquist_compliant: true + Sign-Off section | 38e37fa | 1 file |

Total: 7 commits across 2 sessions (3 in initial dual-agent review session, 4 in revision-pass session including this SUMMARY commit).

---

## PRE-IMPL Artifact Stats

| Metric | Value |
|--------|-------|
| Widgets covered | 24 NEW Phase 5 widgets (Phase 3 widgets out of scope — already approved 03-EMPATHY-REVIEW.md) |
| States per widget | 3-5 (filled / empty / error, plus OnboardingXL has 5 sub-states across new-user vs 3 returning-user variants) |
| Total rows | 86 (target was 70+) |
| Bare-zero violations | 0 (grep guard: `Inga data \| Ingen data \| Du har 0 \| Tomt` returns 0 matches across `client/src/components/widgets/*.tsx`) |
| Open questions raised | 8 (resolved via dual-agent review, with Q1 BLOCK escalating to revision pass) |

Artifact path: `.planning/phases/05-full-hub-coverage-oversikt/05-PRE-IMPL-COPY-REVIEW.md`

---

## Empathy Review Verdicts (combined, both passes)

### Initial pass (commit `e31dc65`)

| Agent | PASS | FLAG | BLOCK | Verdict |
|-------|------|------|-------|---------|
| arbetskonsulent | 79 | 7 | 0 | Conditional APPROVED (pending peer agent) |
| langtidsarbetssokande | 82 | 3 | 1 | NEEDS REVISION |

**BLOCK B1 (langtidsarbetssokande):** OnboardingWidget returning-user-no-apps state heading "Bra jobbat `{firstName}`!" paired with body "Du har inte sökt något jobb än. Vill du börja idag?" — the praise/accusation pairing triggered anxiety in the long-term-unemployed reviewer persona. Verdict per agent docstring: "På en dålig dag stänger jag ner portalen omedelbart."

### Revision pass (commit `ade4426`)

Mikael adjudicated Option 3 — apply BOTH heading swap AND body softening:

- Heading: `Bra jobbat ${firstName}!` → `Hej ${firstName}` (no-apps branch only)
- Body: `Du har inte sökt något jobb än. Vill du börja idag?` → `Vill du ta första steget idag?`

Other branches (no-diary, default) unchanged — they still render the cheerful "Bra jobbat" praise where there is something to praise.

| Agent | PASS | FLAG | BLOCK | Verdict |
|-------|------|------|-------|---------|
| arbetskonsulent | 79 | 6 | 0 | **APPROVED** (F7 resolved by revision) |
| langtidsarbetssokande | 82 | 3 | 0 | **APPROVED** (B1 resolved by revision) |

Both checkboxes ticked in `05-EMPATHY-REVIEW.md` Final sign-off section, dated 2026-04-29 referencing commit `ade4426`.

---

## BLOCK Resolution

### B1: OnboardingWidget no-apps branch — RESOLVED

**Source code change** (`client/src/components/widgets/OnboardingWidget.tsx`):

```ts
interface NextStep {
  text: string
  href: string
  cta: string
  usePraiseHeading: boolean   // NEW — false on no-apps branch, true elsewhere
}

function pickNextStep(...) {
  if (!jobsok || (jobsok.applicationStats?.total ?? 0) === 0) {
    return {
      text: 'Vill du ta första steget idag?',
      href: '/jobb',
      cta: 'Öppna Söka jobb →',
      usePraiseHeading: false,  // ← neutral heading for no-apps
    }
  }
  // ... no-diary and default branches set usePraiseHeading: true
}
```

```tsx
<p className="text-[22px] font-bold ...">
  {nextStep.usePraiseHeading ? `Bra jobbat ${firstName}!` : `Hej ${firstName}`}
</p>
<p className="text-[12px] ...">
  {nextStep.text}
</p>
```

**Test updates:**

| File | Test | Change |
|------|------|--------|
| `OnboardingWidget.test.tsx` | Test B (returning user no-apps) | Assertion swapped: `Hej där` + body `Vill du ta första steget idag?` |
| `OnboardingWidget.test.tsx` | Test C (full_name='Anna Karlsson') | Assertion swapped: `Hej Anna` + queryByText `Bra jobbat Anna!` not in document |
| `OnboardingWidget.test.tsx` | **Test D NEW** (no-diary branch with apps>0 + diary=0) | Asserts praise heading PRESERVED: `Bra jobbat Anna!` + `Reflektera över din vecka i dagboken` body |
| `HubOverview.test.tsx` μ2 | Renamed and assertion swapped | `Hej Anna` + queryByText praise absent |

**Verification on revised code:**

| Check | Result |
|-------|--------|
| `OnboardingWidget.test.tsx` | 5/5 green (was 4 tests, +1 new D) |
| `anti-shaming.test.tsx` | 33/33 green |
| `src/pages/hubs/__tests__/` (5 files) | 71/71 green |
| `npx tsc --noEmit` | 0 errors |
| `npm run build` | green (no errors; chunk-size advisory only) |
| Bare-zero grep guard | 0 violations |

---

## FLAG Verdicts Deferred to v1.1 Backlog

10 flags total (with overlaps between agents). All recorded in 05-EMPATHY-REVIEW.md for v1.1 planning intake:

| # | Widget × State | Issue | Both agents? |
|---|----------------|-------|--------------|
| 1 | Utbildning filled (static) | No data wiring — wire to useEducationSearch when data ready | arbetskonsulent F1 |
| 2 | Utbildning empty (static) | Same as #1 | arbetskonsulent F2 |
| 3 | Kunskapsbanken filled | Raw article_id slug shown in body — fetch article titles by ID (widget code already has TODO) | arbetskonsulent F3 + langtidsarbetssokande F1 |
| 4 | Övningar filled (static) | No progress data — wire when table exists (blocked by Pitfall G + 05-DB-DISCOVERY) | arbetskonsulent F4 |
| 5 | Övningar empty (static) | Same as #4 | arbetskonsulent F5 |
| 6 | Min konsulent filled (no meeting) | "Inget möte inplanerat" → "Boka nästa möte" or "Kontakta din konsulent" — more active framing (~5 min copy fix) | arbetskonsulent F6 + langtidsarbetssokande F2 |
| 7 | Söka jobb-summary empty | Heading/body redundancy ("Inga ansökningar än" twice) — vary heading to "Redo att söka?" (~2 min fix) | arbetskonsulent F8 + langtidsarbetssokande F3 |

(Counts deduplicated to 7 distinct issues; agent-specific FLAGs add up to 10 raw verdicts because multiple agents can flag the same row.)

---

## Files Modified Summary

**Created (3):**

- `.planning/phases/05-full-hub-coverage-oversikt/05-PRE-IMPL-COPY-REVIEW.md` (Task 1, prior session)
- `.planning/phases/05-full-hub-coverage-oversikt/05-EMPATHY-REVIEW.md` (Tasks 2-3, prior session — extended this session)
- `.planning/phases/05-full-hub-coverage-oversikt/05-06-empty-state-pass-empathy-review-SUMMARY.md` (this file)

**Modified (4):**

- `client/src/components/widgets/OnboardingWidget.tsx` (Task 4b — heading conditional + body softening)
- `client/src/components/widgets/OnboardingWidget.test.tsx` (Task 4b — Tests B/C rewritten + Test D added)
- `client/src/pages/hubs/__tests__/HubOverview.test.tsx` (Task 4b — μ2 rename + assertion swap)
- `.planning/phases/05-full-hub-coverage-oversikt/05-VALIDATION.md` (Task 5 — frontmatter flip + Sign-Off section)

Total: **7 files** across both sessions of Plan 06.

---

## Phase 5 Cumulative Tally (final)

| Item | Count | Notes |
|------|-------|-------|
| Widgets across 5 hubs | 32 | Söka jobb 8 + Karriär 6 + Resurser 6 + Min Vardag 5 + Översikt 7 |
| Hub-summary loaders | 5 | useJobsokHubSummary + useKarriarHubSummary + useResurserHubSummary + useMinVardagHubSummary + useOversiktHubSummary |
| Layout contexts | 5 | one per hub |
| Data contexts | 5 | one per hub (Översikt's also aggregates 4 sibling summaries) |
| Customization features (CUST-01..03) | reused | hide/show/reset across all 5 hubs |
| Empathy-reviewed widgets | 32 | Phase 3 covered 8 jobsok widgets (already approved); Phase 5 covered the 24 NEW + re-confirmed jobsok via summary widgets |
| Bare-zero violations | 0 | grep guard clean across all widget source |
| Anti-shaming test cases | 33 | extended from 8 (Phase 2) → 33 (Phase 5 final) |
| Final test suite | 280+ green | all phases combined |

---

## Deviations from Plan

### Auto-fixed Issues

None this session. The plan was followed exactly: Task 1 (PRE-IMPL artifact), Tasks 2-3 (dual-agent verdicts), Task 4 checkpoint HELD per overnight policy, Mikael adjudicated, revision pass executed, Task 5 frontmatter flip + SUMMARY.

### Test Updates Required by Revision

Per the user prompt's allowance ("If the revision pass introduces unexpected test failures, e.g., a snapshot test asserts the old 'Bra jobbat' string in this exact branch, update the test to match the new copy and document the test change in the commit message"):

The HubOverview integration test μ2 asserted the old "Bra jobbat Anna!" string for the no-apps branch (`onboarded_hubs: ['jobb']` + `full_name: 'Anna Karlsson'` with no jobsok summary preseeded → no-apps detection). After the revision pass, the no-apps branch renders "Hej Anna". I updated:

- The OnboardingWidget unit tests B/C (already part of Step 1)
- The HubOverview integration test μ2 (also part of Step 1)
- Added Test D as a positive guard that the praise heading is preserved on the no-diary branch

All updates documented in commit ade4426 message body.

### Auth gates encountered

None. All work was test-only or local-only.

---

## Self-Check

**Files exist:**

- [x] `.planning/phases/05-full-hub-coverage-oversikt/05-PRE-IMPL-COPY-REVIEW.md`
- [x] `.planning/phases/05-full-hub-coverage-oversikt/05-EMPATHY-REVIEW.md`
- [x] `.planning/phases/05-full-hub-coverage-oversikt/05-VALIDATION.md` (frontmatter flipped)
- [x] `.planning/phases/05-full-hub-coverage-oversikt/05-06-empty-state-pass-empathy-review-SUMMARY.md` (this file)
- [x] `client/src/components/widgets/OnboardingWidget.tsx` (revised)
- [x] `client/src/components/widgets/OnboardingWidget.test.tsx` (Tests B/C/D updated)
- [x] `client/src/pages/hubs/__tests__/HubOverview.test.tsx` (μ2 updated)

**Commits exist:**

- [x] `e31dc65` — Task 1 (PRE-IMPL artifact + bare-zero audit)
- [x] `88ea84c` — Tasks 2-3 (dual-agent verdicts)
- [x] `d69042d` — Task 4a (HELD checkpoint record)
- [x] `ade4426` — Task 4b (revision pass code fix + test updates)
- [x] `3e4ad51` — Task 4c (PRE-IMPL artifact synchronization)
- [x] `e42dd75` — Task 4d (revision-pass empathy verdicts — both APPROVED)
- [x] `38e37fa` — Task 5 (VALIDATION.md frontmatter flip + Sign-Off)

**Verification commands:**

- `grep -E '^nyquist_compliant: true$' .planning/phases/05-full-hub-coverage-oversikt/05-VALIDATION.md` → matches
- `grep -cE "^- \[x\] (arbetskonsulent\|langtidsarbetssokande): APPROVED" .planning/phases/05-full-hub-coverage-oversikt/05-EMPATHY-REVIEW.md` → 2
- `grep -rE '(Inga data\|Ingen data\|Du har 0\|Tomt)' client/src/components/widgets/*.tsx` → 0 matches
- All hub-page integration tests + anti-shaming + OnboardingWidget unit tests green

## Self-Check: PASSED
