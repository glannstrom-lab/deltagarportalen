---
phase: 02-static-widget-grid
plan: "05"
subsystem: ui
tags: [bundle-verification, code-splitting, vitest, node-script, lazy-loading, regression-gate]

# Dependency graph
requires:
  - phase: 02-static-widget-grid
    plan: "04"
    provides: JobsokHub wired with 8 lazy widgets; first successful vite build with lazy imports
  - phase: 02-static-widget-grid
    plan: "01"
    provides: WIDGET_REGISTRY with 8 lazy() entries in registry.ts
provides:
  - verify-widget-chunks.cjs: CI-ready Node script that builds + confirms 8 widget async chunks
  - npm run verify:widget-chunks: reproducible single-command bundle gate
  - lazy-isolation.test.tsx: static analysis test preventing regression to static imports
affects:
  - Phase 3 (HUB-01): bundle gate runs after any registry change to confirm code-split intact
  - All future widget authors: lazy-isolation test fails immediately if static import added

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Node CJS script (.cjs) for bundle verification — works regardless of 'type:module' in package.json"
    - "Chunk-file existence as proof of code-splitting — if lazy() fails, no separate chunk file exists"
    - "Static analysis test: read source file as text + fs.readFileSync in vitest jsdom environment"
    - "Comment-line exclusion in lazy() count: filter lines starting with // or * before counting"

key-files:
  created:
    - client/scripts/verify-widget-chunks.cjs
    - client/src/components/widgets/__tests__/lazy-isolation.test.tsx
  modified:
    - client/package.json

key-decisions:
  - "Chunk-file existence is the definitive proof of lazy() code-splitting — if widget was statically imported, Vite would not emit a separate chunk file"
  - "Comment-line lazy() count exclusion needed: registry.ts has one lazy() in a JSDoc comment (line 12) that would inflate the count from 8 to 9"
  - "verify-widget-chunks.cjs uses --skip-build flag for fast re-runs against existing dist/"

# Metrics
duration: 8min
completed: 2026-04-28
---

# Phase 2 Plan 05: Bundle Verification Summary

**CI-ready bundle gate + static analysis regression test proving all 8 Phase-2 widgets are code-split — npm run verify:widget-chunks exits 0, 7 lazy-isolation tests pass**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-04-28T19:50:59Z
- **Completed:** 2026-04-28T19:59:29Z
- **Tasks:** 3 (2 files created, 1 package.json modification, 1 verification-only task)
- **Files modified:** 3

## Accomplishments

- Built `client/scripts/verify-widget-chunks.cjs`: Node CommonJS script that runs `vite build`, scans `dist/assets/` for each of the 8 widget chunk files, secondary-heuristic scans entry chunks for widget function definitions, exits 0 on success / 1 on failure
- Wired `npm run verify:widget-chunks` into `client/package.json` — gate is reproducible by anyone
- Built `client/src/components/widgets/__tests__/lazy-isolation.test.tsx`: 7 static-analysis tests that read `registry.ts` source as text and assert: 8 entries, all have component/defaultSize/allowedSizes, zero static widget imports, exactly 8 lazy() calls in code lines, every expected widget name appears inside a `lazy(() => import('./XxxWidget'))` call
- Ran full Phase 2 verification suite: TypeScript clean, all Phase 2 tests pass, build succeeds, bundle gate exits 0

## Bundle Statistics

| Artifact | Size | gzip |
|----------|------|------|
| Main entry chunk (index-Do8xOVJP.js) | 1,063 kB | 323 kB |
| Secondary entry chunk (index-pBxRdabz.js) | 350 kB | 98 kB |
| Stub entry chunk (index-HXPFy9l0.js) | 0.95 kB | 0.48 kB |
| Total dist/ | ~16 MB (includes gzip + brotli variants) | — |

### Widget Chunk Sizes (all async — NOT in main entry)

| Widget | Chunk | Size | gzip |
|--------|-------|------|------|
| CvWidget | CvWidget-CBkoKmbX.js | 2.88 kB | 1.27 kB |
| CoverLetterWidget | CoverLetterWidget-BkivT07A.js | 1.44 kB | 0.70 kB |
| InterviewWidget | InterviewWidget-SOK6aK8K.js | 2.17 kB | 1.07 kB |
| JobSearchWidget | JobSearchWidget-4p9qB3Ca.js | 2.02 kB | 0.91 kB |
| ApplicationsWidget | ApplicationsWidget-DieRt0ne.js | 2.68 kB | 1.21 kB |
| SpontaneousWidget | SpontaneousWidget-D5zpRFIl.js | 1.19 kB | 0.64 kB |
| SalaryWidget | SalaryWidget-Dh8B9Tut.js | 2.02 kB | 0.93 kB |
| InternationalWidget | InternationalWidget-z4q2Vsxr.js | 1.15 kB | 0.62 kB |

All 8 widget chunks are separate async files — none appear in the main entry chunk.

## Phase 2 ROADMAP Success Criteria — Final Verification

| Criterion | Status | Proven By |
|-----------|--------|-----------|
| 1. Sectioned widget grid (3 sections, 8 widgets) | PASS | `JobsokHub.test.tsx` — "renders 3 sectioned headings", "renders all 8 widgets" |
| 2. S/M/L size toggle, keyboard accessible | PASS | `Widget.test.tsx` — role=group, aria-pressed, allowedSizes; `JobsokHub.test.tsx` — clicking M changes aria-pressed |
| 3. Per-widget error fallback, sibling widgets unaffected | PASS | `WidgetErrorBoundary.test.tsx` — 5 tests; `JobsokHub.test.tsx` — error isolation guard |
| 4. No widget component in main JS bundle | PASS | `lazy-isolation.test.tsx` — 7 tests; `verify-widget-chunks.cjs` — exits 0, 8 widget chunks confirmed |

## verify:widget-chunks Output (final run)

```
Skipping vite build (--skip-build); using existing dist/

Found 161 JS chunks in dist/assets/

Checking widget chunks:
  v CvWidget: CvWidget-CBkoKmbX.js
  v CoverLetterWidget: CoverLetterWidget-BkivT07A.js
  v InterviewWidget: InterviewWidget-SOK6aK8K.js
  v JobSearchWidget: JobSearchWidget-4p9qB3Ca.js
  v ApplicationsWidget: ApplicationsWidget-DieRt0ne.js
  v SpontaneousWidget: SpontaneousWidget-D5zpRFIl.js
  v SalaryWidget: SalaryWidget-Dh8B9Tut.js
  v InternationalWidget: InternationalWidget-z4q2Vsxr.js

Entry chunk(s) found: index-Do8xOVJP.js, index-HXPFy9l0.js, index-pBxRdabz.js

v Bundle verification PASSED — all 8 widgets are properly code-split
  Each widget has its own async chunk in dist/assets/
  No widget code definitions detected in main entry chunk
```

## Test Suite Summary

| Test File | Tests | Result |
|-----------|-------|--------|
| lazy-isolation.test.tsx (this plan) | 7 | all pass |
| JobsokHub.test.tsx (plan 04) | 10 | all pass |
| Widget.test.tsx (plan 01) | 10 | all pass |
| WidgetErrorBoundary.test.tsx (plan 01) | 5 | all pass |
| HubGrid.test.tsx (plan 01) | 5 | all pass |
| useWidgetSize.test.ts (plan 01) | 4 | all pass |
| **Phase 2 total** | **41** | **41 pass** |

Pre-existing failures (out of scope): `Dashboard.test.tsx` (20 tests), `register-flow.test.tsx` (1 test) — present before Phase 2, documented in plan 02-04 summary.

## Task Commits

1. **Task 1: verify-widget-chunks.cjs + package.json wiring** — `af8aec8` (feat)
2. **Task 2: lazy-isolation static analysis test** — `8881e55` (test)
3. **Task 3: Full verification suite** — verification only, no new files

## Decisions Made

- Chunk-file existence is the definitive proof of lazy() code-splitting — if a widget was statically imported, Vite would not emit a separate chunk file. No need to parse minified output for component definitions.
- Comment-line lazy() count: registry.ts line 12 has `lazy()` in a JSDoc comment; the test filters comment lines (starting with `//` or `*`) before counting, ensuring the count stays at exactly 8.
- `verify-widget-chunks.cjs` uses `--skip-build` flag for fast re-runs against existing dist/ — useful in local development when dist is already current.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] lazy() count in test was 9 instead of expected 8**

- **Found during:** Task 2, TDD RED phase
- **Issue:** The test `expect(lazyCount).toBe(8)` found 9 occurrences because registry.ts line 12 contains `lazy()` inside a JSDoc comment (`* All widgets MUST use lazy() per Bundle / Code-Split Contract`). Pattern `/lazy\(/g` matched it.
- **Fix:** Added comment-line filter before counting: `filter(line => !/^\s*(\/\/|\*)/.test(line))` — excludes `// comment` and ` * comment` lines from the source text before applying the regex.
- **Files modified:** `client/src/components/widgets/__tests__/lazy-isolation.test.tsx`
- **Commit:** `8881e55`

## Notes for Phase 3

- Real data wiring will REPLACE mock data `const MOCK = {...}` inside widget files. Registry, HubGrid, Widget compound, and the lazy-isolation gate stay unchanged.
- The `verify:widget-chunks` gate should be run in CI after any registry.ts change.
- The 8 widget chunks are each ~1-3 kB gzipped — well within budget for lazy-loaded content.
- Pre-existing test failures (`Dashboard.test.tsx`, `register-flow.test.tsx`) should be fixed before adding coverage thresholds — see `vitest.config.ts` comment for activation plan.

## Self-Check: PASSED

- `client/scripts/verify-widget-chunks.cjs` exists: FOUND
- `client/src/components/widgets/__tests__/lazy-isolation.test.tsx` exists: FOUND
- `client/package.json` contains `verify:widget-chunks`: FOUND
- Commit `af8aec8` exists: FOUND
- Commit `8881e55` exists: FOUND
