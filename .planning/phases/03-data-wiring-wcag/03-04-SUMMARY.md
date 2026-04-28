---
phase: 03-data-wiring-wcag
plan: 04
subsystem: testing
tags: [wcag, a11y, reduced-motion, anti-shaming, keyboard, live-region, vitest, framer-motion]

# Dependency graph
requires:
  - phase: 03-data-wiring-wcag
    plan: 03
    provides: "8 widgets wired to JobsokDataContext with real data — WCAG hardening operates on real renders"
  - phase: 02-static-widget-grid
    plan: 04
    provides: "JobsokHub.test.tsx with 10 tests — extended in this plan"
provides:
  - "A11Y-02: static guard test — any widget adding framer-motion without useReducedMotion() fails CI"
  - "A11Y-03: anti-shaming guard test — no /\\d+%/ in primary KPI slots (32px/22px bold) across all 8 widgets"
  - "A11Y-01: keyboard Tab+Enter size toggle test + single-announcement live-region test in JobsokHub"
  - "03-PRE-IMPL-COPY-REVIEW.md — Step 1 artifact for Plan 05 empathy review"
affects:
  - 03-05-empathy-review-ship-gate (feeds PRE-IMPL-COPY-REVIEW.md + needs passing test suite)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Static source-file guard: readFileSync() in tests to assert absence of dangerous patterns (framer-motion without useReducedMotion)"
    - "Primary-KPI typography selector: querySelectorAll('*') + filter for className containing text-[32px] or text-[22px] + font-bold"
    - "Anti-shaming DOM scan: check textContent of primary-KPI elements for /\\d+%/ forbidden pattern"

key-files:
  created:
    - client/src/components/widgets/__tests__/reduced-motion.test.tsx
    - client/src/components/widgets/__tests__/anti-shaming.test.tsx
    - .planning/phases/03-data-wiring-wcag/03-PRE-IMPL-COPY-REVIEW.md
  modified:
    - client/src/pages/hubs/__tests__/JobsokHub.test.tsx

key-decisions:
  - "No widget imports framer-motion in Phase 2/3 — reduced-motion test is a purely preventive static guard (vacuously green; enforces future compliance)"
  - "Anti-shaming test scopes to primary-KPI typography slot (text-[32px]/text-[22px] + font-bold) only — ProgressRing's decorative SVG label is excluded by design"
  - "Keyboard test uses userEvent.setup() (not fireEvent) for semantically correct keyboard simulation per testing-library best practices"
  - "PRE-IMPL-COPY-REVIEW.md captures actual rendered copy from wired widget source, not UI-SPEC — 4 open questions added for Plan 05 agents"

requirements-completed: [A11Y-01, A11Y-02, A11Y-03, A11Y-04]

# Metrics
duration: 12min
completed: 2026-04-28
---

# Phase 3 Plan 04: WCAG Hardening Summary

**WCAG A11Y-01..04 automated regression coverage added: 3 new test files + 03-PRE-IMPL-COPY-REVIEW.md artifact for Plan 05 agent empathy review**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-04-28T23:28:00Z
- **Completed:** 2026-04-28T23:40:00Z
- **Tasks:** 3
- **Files created:** 3
- **Files modified:** 1

## Accomplishments

### Task 1: A11Y-02 Reduced-Motion Static Guard (commit `45663ab`)

- `client/src/components/widgets/__tests__/reduced-motion.test.tsx` created
- `it.each(WIDGETS)` iterates all 8 widgets; asserts framer-motion import implies useReducedMotion
- Separate test: tokens.css contains `@media (prefers-reduced-motion: reduce)` + `--motion-fast: 0.01ms`
- Audit result: no Phase 2/3 widget imports framer-motion — test is a preventive guard for future code
- **9 tests pass**

### Task 2: A11Y-03 Anti-shaming + A11Y-01 Keyboard (commit `6dbb793`)

- `client/src/components/widgets/__tests__/anti-shaming.test.tsx` created
  - Renders all 8 widgets at L-size with real fixture data
  - Scans elements with `text-[32px]` or `text-[22px]` + `font-bold` for `/\d+%/` pattern
  - Additional JobSearchWidget-specific match-card percent guard
  - **9 tests pass** (8 per-widget + 1 JobSearch-specific)
- `client/src/pages/hubs/__tests__/JobsokHub.test.tsx` extended from 10 to **12 tests**:
  - "A11Y-01: keyboard user can Tab to size toggle and Enter to change size"
  - "A11Y-01: live-region announces a single message after size change (Pitfall 17)"

### Task 3: 03-PRE-IMPL-COPY-REVIEW.md (commit `90c635e`)

- `.planning/phases/03-data-wiring-wcag/03-PRE-IMPL-COPY-REVIEW.md` created
- 8 widget sections × 3 states each (189 lines)
- Exact copy from wired widget source code (not UI-SPEC — verified against each widget file)
- Cross-widget framing rules table (LOCKED rules vs agent-review rules)
- 4 open questions identified for Plan 05 agents (KPI label wording, "totalt" vs "denna vecka", etc.)
- All 8 UI-SPEC empty-state strings present: "Ditt CV väntar", "Inga brev ännu", "Redo att öva?", "Inga sparade sökningar", "Inga ansökningar ännu", "Inget i pipeline", "Vad är din lön värd?", "Arbetar du mot utlandsjobb?"

## Task Commits

1. **Task 1: A11Y-02 reduced-motion test** - `45663ab` (test)
2. **Task 2: A11Y-03 anti-shaming + A11Y-01 keyboard** - `6dbb793` (test)
3. **Task 3: 03-PRE-IMPL-COPY-REVIEW.md** - `90c635e` (docs)

## Test Suite Before vs After

| Scope | Before (Plan 03) | After (Plan 04) | Delta |
|-------|-----------------|-----------------|-------|
| Widget tests (src/components/widgets) | 42 passing + 3 skipped | 60 passing + 3 skipped | +18 |
| Hub tests (src/pages/hubs/__tests__) | 10 passing | 12 passing | +2 |
| Phase 3 total (targeted scope) | 52 passing | 72 passing | +20 |
| Pre-existing failures | 21 (Dashboard + register-flow) | 21 (unchanged) | 0 |

## A11Y Coverage Map

| Requirement | Test | CI Status |
|-------------|------|-----------|
| A11Y-01: keyboard size toggle Tab+Enter | `JobsokHub.test.tsx` "A11Y-01: keyboard user can Tab..." | GREEN |
| A11Y-01: single live-region announcement | `JobsokHub.test.tsx` "A11Y-01: live-region announces..." | GREEN |
| A11Y-02: framer-motion + useReducedMotion guard | `reduced-motion.test.tsx` it.each(8 widgets) | GREEN |
| A11Y-02: tokens.css reduced-motion media query | `reduced-motion.test.tsx` tokens.css assertion | GREEN |
| A11Y-03: no /\d+%/ in primary-KPI slots | `anti-shaming.test.tsx` it.each(8 widgets) | GREEN |
| A11Y-03: JobSearchWidget no match% | `anti-shaming.test.tsx` JobSearch-specific | GREEN |
| A11Y-04: closed-hidden default | `ApplicationsWidget.test.tsx` from Plan 03 | GREEN (regression guard) |

All A11Y-01..04 have named CI tests. A11Y-05 (empathy review) is subjective — Plan 05 only.

## Files Created/Modified

- `client/src/components/widgets/__tests__/reduced-motion.test.tsx` — A11Y-02 static guard (9 tests)
- `client/src/components/widgets/__tests__/anti-shaming.test.tsx` — A11Y-03 DOM scan guard (9 tests)
- `client/src/pages/hubs/__tests__/JobsokHub.test.tsx` — Extended with 2 A11Y-01 keyboard tests
- `.planning/phases/03-data-wiring-wcag/03-PRE-IMPL-COPY-REVIEW.md` — Plan 05 Step 1 input artifact

## Decisions Made

- Static source-file guard (readFileSync) chosen over rendering-based reduced-motion test: cheaper, more deterministic, exactly what the research recommended for this pattern
- Anti-shaming test excludes ProgressRing SVG label: "75%" is decorative (inside SVG, smaller font, not in KPI typography slot) — the milestone label IS the primary framing per UI-SPEC
- userEvent.setup() used for keyboard tests (not fireEvent.keyDown) for semantically accurate simulation
- PRE-IMPL-COPY-REVIEW.md captures 4 open questions that differ from UI-SPEC mock copy — flagged for Plan 05 agents rather than auto-fixed (copy decisions require empathy judgment)

## Deviations from Plan

None — plan executed exactly as written.

The task list included InterviewWidget.tsx and CoverLetterWidget.tsx in `files_modified` as a forecast (if they used framer-motion). Audit confirmed neither imports framer-motion, so those files were not modified. This is noted in the plan's action spec as expected behavior ("If they do not, leave them unchanged AND remove them from this task's files_modified").

## Issues Encountered

Minor syntax issue during Task 2: the two new it() blocks were initially inserted after the closing `})` of the `describe('JobsokHub integration')` block instead of inside it. Detected immediately by esbuild on first test run, fixed in one edit. No test logic was incorrect.

## Next Phase Readiness

- Phase 3 acceptance gate (WCAG structural bundle): COMPLETE
  - A11Y-01 (keyboard): GREEN
  - A11Y-02 (reduced-motion): GREEN
  - A11Y-03 (anti-shaming): GREEN
  - A11Y-04 (closed-hidden): GREEN (regression from Plan 03)
- Plan 05 is unblocked: PRE-IMPL-COPY-REVIEW.md exists with all 8 widgets × 3 states
- Pre-existing failures (21): Dashboard.test.tsx + register-flow.test.tsx — unchanged, deferred, out of scope

---
*Phase: 03-data-wiring-wcag*
*Completed: 2026-04-28*
