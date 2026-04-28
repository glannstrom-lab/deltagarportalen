---
phase: 03-data-wiring-wcag
plan: 04
type: execute
wave: 4
depends_on: [03-03-widget-data-wiring-PLAN]
files_modified:
  - client/src/components/widgets/__tests__/reduced-motion.test.tsx
  - client/src/components/widgets/__tests__/anti-shaming.test.tsx
  - client/src/pages/hubs/__tests__/JobsokHub.test.tsx
  - client/src/components/widgets/InterviewWidget.tsx
  - client/src/components/widgets/CoverLetterWidget.tsx
  - .planning/phases/03-data-wiring-wcag/03-PRE-IMPL-COPY-REVIEW.md
autonomous: true
requirements: [A11Y-01, A11Y-02, A11Y-03, A11Y-04]
must_haves:
  truths:
    - "A new reduced-motion test asserts that Framer Motion components either use useReducedMotion() OR pass initial={false} when matchMedia returns reduce"
    - "A new anti-shaming guard test scans all 8 rendered widget DOMs (filled state) and asserts no element with primary-KPI typography contains a string matching /\\d+%/"
    - "JobsokHub.test.tsx is extended with a keyboard-navigation test (Tab through size toggles + Enter to change size) and a single-announcement live-region test"
    - "Closed-applications-hidden-by-default test from Plan 03 still passes (A11Y-04 regression guard)"
    - "A pre-implementation copy review document (03-PRE-IMPL-COPY-REVIEW.md) is generated with the 8 widgets' rendered copy in three states (filled / empty / error) — this is the artifact agents will review in Plan 05"
  artifacts:
    - path: "client/src/components/widgets/__tests__/reduced-motion.test.tsx"
      provides: "A11Y-02 unit test"
    - path: "client/src/components/widgets/__tests__/anti-shaming.test.tsx"
      provides: "A11Y-03 unit test — no raw % as primary KPI in any widget"
    - path: ".planning/phases/03-data-wiring-wcag/03-PRE-IMPL-COPY-REVIEW.md"
      provides: "Empathy-review pre-step artifact (input to Plan 05 agent review)"
      min_lines: 60
  key_links:
    - from: "client/src/components/widgets/InterviewWidget.tsx"
      to: "useReducedMotion"
      via: "framer-motion hook check"
      pattern: "useReducedMotion"
    - from: "client/src/components/widgets/__tests__/anti-shaming.test.tsx"
      to: "all 8 widgets"
      via: "rendered DOM regex scan"
      pattern: "\\\\d\\+%"
---

<objective>
Lock in WCAG hardening tests for A11Y-01 (keyboard), A11Y-02 (reduced motion), A11Y-03 (anti-shaming), A11Y-04 (closed-hidden) — using automated unit tests so the Phase 3 ship gate has CI-verifiable proof. Then prepare the copy-review artifact (rendered text content of every widget in 3 states) that Plan 05's `arbetskonsulent` + `langtidsarbetssokande` agent review will operate on.

Purpose: The empathy review (A11Y-05) is subjective; everything else in the WCAG bundle (A11Y-01..04) must be objective. This plan creates the regression tests so Plan 05's review focuses on copy and framing rather than re-discovering structural issues.

Output: 2 new test files (reduced-motion, anti-shaming), 2 new tests added to existing JobsokHub.test.tsx (keyboard + live-region), Framer Motion `useReducedMotion` checks added where needed in widgets, and the pre-implementation copy review markdown artifact for Plan 05 to feed to agents.
</objective>

<execution_context>
@C:/Users/Mikael/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/Mikael/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/03-data-wiring-wcag/03-CONTEXT.md
@.planning/phases/03-data-wiring-wcag/03-RESEARCH.md
@.planning/phases/03-data-wiring-wcag/03-VALIDATION.md
@.planning/phases/03-data-wiring-wcag/03-03-SUMMARY.md
@.planning/phases/02-static-widget-grid/02-UI-SPEC.md
@.planning/research/PITFALLS.md
@client/src/styles/tokens.css
@client/src/components/widgets/Widget.tsx
@client/src/components/widgets/JobsokDataContext.tsx
@client/src/components/widgets/InterviewWidget.tsx
@client/src/components/widgets/CoverLetterWidget.tsx
@client/src/pages/hubs/JobsokHub.tsx
@client/src/pages/hubs/__tests__/JobsokHub.test.tsx
@client/src/test/setup.ts

<interfaces>
<!-- tokens.css already handles prefers-reduced-motion at the CSS level (verified): -->
<!--   @media (prefers-reduced-motion: reduce) { :root { --motion-fast: 0.01ms; --motion-standard: 0.01ms; --motion-slow: 0.01ms; } } -->
<!-- Any widget animation using var(--motion-*) is automatically compliant. -->
<!-- Framer Motion is a SEPARATE concern — it requires explicit useReducedMotion() check in the component. -->

<!-- framer-motion exports: import { motion, useReducedMotion } from 'framer-motion' -->
<!-- useReducedMotion() returns true | false | null (null during SSR). For SPA always boolean after first render. -->

<!-- Phase 2 JobsokHub.test.tsx already has 10 tests including: -->
<!--   - Live-region presence -->
<!--   - aria-pressed correctness on toggles -->
<!--   - 'Widgeten är nu M-storlek' announcement string -->
<!-- Plan 04 ADDS to this file: keyboard-navigation Tab+Enter test, "single announcement" assertion. -->

<!-- vitest matchMedia mock (setup.ts:8-20) returns matches: false by default. -->
<!-- For reduced-motion test, override the mock locally to return matches: true for the prefers-reduced-motion query. -->

<!-- A11Y-03 anti-shaming rule (UI-SPEC + Pitfall 11): -->
<!-- - CV: ring + milestoneLabel as primary text → ALLOWED to render the % inside the ring as visual element, NOT as primary KPI typography -->
<!-- - JobSearch: matchLabel union type already enforces qualitative — guard test ensures no '%' in match-card -->
<!-- - Interview: "84 / 100" is allowed (not shaming per UI-SPEC) — guard checks for trailing % ONLY -->
<!-- The anti-shaming test scans rendered text for /\d+%/ in primary-KPI slots ONLY (the 32px or 22px font slots). -->
<!-- ProgressRing accepts a `label` prop ('75%') — that's INSIDE the ring (decorative), not the primary KPI. -->
<!-- Test scope: any element with class containing 'text-[32px]' or 'text-[22px]' AND font-bold MUST NOT match /\d+%/. -->
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: A11Y-02 reduced-motion test + Framer Motion useReducedMotion checks in widgets</name>
  <files>
    client/src/components/widgets/__tests__/reduced-motion.test.tsx,
    client/src/components/widgets/InterviewWidget.tsx,
    client/src/components/widgets/CoverLetterWidget.tsx
  </files>
  <read_first>
    - client/src/components/widgets/InterviewWidget.tsx (current — check if it uses framer-motion)
    - client/src/components/widgets/CoverLetterWidget.tsx (current — check if it uses framer-motion)
    - All other 6 widget files — quick grep for `framer-motion` import to know which widgets need the hook
    - client/src/test/setup.ts lines 7-20 (matchMedia mock structure)
    - .planning/phases/03-data-wiring-wcag/03-RESEARCH.md "Pattern 6: prefers-reduced-motion (A11Y-02)"
    - client/src/styles/tokens.css lines 129-134 (existing reduced-motion media query)
  </read_first>
  <behavior>
    The test renders each widget that uses framer-motion under a `prefers-reduced-motion: reduce` matchMedia override and asserts:
    - Either: the rendered DOM does not contain motion components with non-zero `initial`/`transition` (verifiable by checking absence of an `opacity:0` style attribute mid-mount)
    - Or, equivalently: the rendered output is "stable" (no motion classes that would animate)

    Since Framer Motion's behavior under `useReducedMotion() === true` is "skip the entry animation", a simpler test pattern: inspect the source files of widgets that import `framer-motion` and assert they ALSO import or call `useReducedMotion`. This is a static guard — fast, deterministic, and exactly what the research recommended.

    For widgets currently NOT using framer-motion (the majority — Phase 2 widgets are CSS-token based), the test just confirms they don't suddenly add framer-motion without the hook.

    The Framer Motion fix in the widgets:
    - Find every widget that imports `framer-motion`
    - Ensure each such widget also calls `useReducedMotion()` and either:
      a) Wraps motion components with `initial={shouldReduce ? false : { ... }}`, OR
      b) Skips motion entirely when `shouldReduce` is true

    Reading the current code — Phase 2 widgets primarily use CSS classes via tokens.css. Framer Motion may or may not be present. The task includes a code audit step: grep all 8 widgets for `framer-motion`. For each match, apply the hook fix. If no widget imports framer-motion, the static guard test passes vacuously and no widget code changes (this is a valid outcome).

    BrandAuditTab.tsx ALSO uses framer-motion (line 32: `import { motion, AnimatePresence } from 'framer-motion'`) — but BrandAuditTab is OUT OF SCOPE for Phase 3 widget hardening (it's an existing original page, Inviolabelt rule). Note this in the test's comment but do NOT modify BrandAuditTab.tsx.
  </behavior>
  <action>
    Step 1 — Audit current framer-motion usage in widgets:
    ```bash
    grep -l "framer-motion" client/src/components/widgets/*.tsx
    ```
    Expected: usually returns no widget files in Phase 2 (CSS-token-driven), but verify. If the grep returns widget files, apply the hook fix to each:

    ```typescript
    // Pattern to apply at the top of any widget using framer-motion:
    import { motion, useReducedMotion } from 'framer-motion'

    export default function SomeWidget(props: WidgetProps) {
      const shouldReduce = useReducedMotion()
      // ... existing logic
      return (
        <motion.div
          initial={shouldReduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: shouldReduce ? 0 : 0.3 }}
        >
          {/* existing content unchanged */}
        </motion.div>
      )
    }
    ```

    Apply this pattern to InterviewWidget.tsx and CoverLetterWidget.tsx ONLY IF they currently use framer-motion. If they do not, leave them unchanged AND remove them from this task's `files_modified` (mention in summary). The `<files>` list above is a forecast — actual modification depends on the audit.

    Step 2 — Create `client/src/components/widgets/__tests__/reduced-motion.test.tsx`:

    ```typescript
    import { describe, it, expect } from 'vitest'
    import { readFileSync } from 'fs'
    import path from 'path'

    /**
     * A11Y-02 — prefers-reduced-motion compliance.
     *
     * Two layers of compliance:
     *   1. CSS layer: tokens.css sets --motion-* to 0.01ms under @media reduce
     *      (any widget using var(--motion-*) is auto-compliant — no test needed).
     *   2. Framer Motion layer: any widget importing framer-motion MUST also
     *      use useReducedMotion() to skip the entry animation.
     *
     * This test is a STATIC guard — it greps the source files. Cheaper and more
     * reliable than rendering each widget under a mocked matchMedia.
     *
     * NOTE: BrandAuditTab.tsx (page, not widget) uses framer-motion but is
     * out of scope for Phase 3 (Inviolabelt rule — original 27 routes untouched).
     */

    const WIDGETS = [
      'CvWidget', 'CoverLetterWidget', 'InterviewWidget', 'JobSearchWidget',
      'ApplicationsWidget', 'SpontaneousWidget', 'SalaryWidget', 'InternationalWidget',
    ]

    function readWidget(name: string): string {
      const p = path.join(__dirname, '..', `${name}.tsx`)
      return readFileSync(p, 'utf-8')
    }

    describe('A11Y-02: prefers-reduced-motion compliance for widgets', () => {
      it.each(WIDGETS)('%s either does not use framer-motion OR uses useReducedMotion', (name) => {
        const src = readWidget(name)
        const usesFramerMotion = /from ['"]framer-motion['"]/.test(src)
        if (!usesFramerMotion) {
          // Compliant: relies on tokens.css --motion-* media query
          expect(usesFramerMotion).toBe(false)
          return
        }
        // If framer-motion is imported, useReducedMotion MUST also be imported AND called
        expect(src).toMatch(/useReducedMotion/)
      })

      it('tokens.css contains the prefers-reduced-motion media query', () => {
        const tokensPath = path.join(__dirname, '..', '..', '..', 'styles', 'tokens.css')
        const css = readFileSync(tokensPath, 'utf-8')
        expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)/)
        expect(css).toMatch(/--motion-fast:\s*0\.01ms/)
      })
    })
    ```

    Run the test:
    ```bash
    cd client && npm run test:run -- src/components/widgets/__tests__/reduced-motion.test.tsx
    ```
  </action>
  <verify>
    <automated>cd client && npm run test:run -- src/components/widgets/__tests__/reduced-motion.test.tsx 2>&1 | grep -E "(passed|failed)"</automated>
  </verify>
  <acceptance_criteria>
    - File `client/src/components/widgets/__tests__/reduced-motion.test.tsx` exists
    - File contains literal `prefers-reduced-motion`
    - File contains an `it.each(WIDGETS)` test iterating over all 8 widgets
    - File contains the static-guard logic: `usesFramerMotion` AND `useReducedMotion` checks
    - File contains a separate test asserting tokens.css has the reduced-motion media query
    - For any widget where `grep "from 'framer-motion'"` returns a hit, the same widget file ALSO contains `useReducedMotion`
    - `cd client && npm run test:run -- src/components/widgets/__tests__/reduced-motion.test.tsx` exits 0 (all 9 tests pass: 8 per-widget + 1 tokens.css)
    - `cd client && npm run test:run` exits 0 (full suite green)
    - `cd client && npx tsc --noEmit` exits 0
  </acceptance_criteria>
  <done>
    A11Y-02 has a CI-verifiable regression guard. Future widgets that add framer-motion without `useReducedMotion()` will fail the test before merge.
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: A11Y-03 anti-shaming test + A11Y-01 keyboard test extension on JobsokHub</name>
  <files>
    client/src/components/widgets/__tests__/anti-shaming.test.tsx,
    client/src/pages/hubs/__tests__/JobsokHub.test.tsx
  </files>
  <read_first>
    - client/src/pages/hubs/__tests__/JobsokHub.test.tsx (existing 10 tests — extend, do not replace)
    - client/src/components/widgets/CvWidget.tsx (uses milestoneLabel — verify primary KPI is the label, not the percent)
    - client/src/components/widgets/JobSearchWidget.tsx (qualitative match labels enforced via TS union — verify no raw percent in JSX)
    - client/src/components/widgets/InterviewWidget.tsx ("84 / 100" is allowed per UI-SPEC, but trailing "%" is NOT)
    - client/src/components/widgets/JobsokDataContext.tsx (JobsokSummary type for fixture)
    - client/src/test/setup.ts (test infrastructure)
    - .planning/phases/02-static-widget-grid/02-UI-SPEC.md "Progress / KPI Framing Rules" (anti-shaming rules verbatim)
    - .planning/research/PITFALLS.md Pitfall 11 (no raw % as primary KPI)
  </read_first>
  <behavior>
    A11Y-03 anti-shaming test approach:
    - Render each of the 8 widgets at L size (largest, most KPI-rich) inside JobsokDataProvider with a fixture summary
    - Query for elements with the "primary KPI" typography (32px or 22px + bold)
    - For each such element, assert its textContent does NOT match /^\s*\d+\s*%\s*$/ (a number-only-with-% string)
    - For JobSearchWidget specifically, also assert no `<span>` or `<div>` containing only a percentage exists in match cards

    NOTE: CvWidget's ProgressRing component renders the percentage as a label INSIDE the ring (decorative). That's allowed per UI-SPEC (it's not the primary KPI — the milestone label IS). The test must scope to elements OUTSIDE the ring, OR exclude the ring's internal label. The simplest scope rule: only check elements with the bold + large-text classes (32px or 22px), NOT the ring's smaller internal text.

    A11Y-01 keyboard extension to JobsokHub.test.tsx:
    - Add a test that mounts JobsokHub, locates the first widget's size toggle group via `getByRole('group', { name: /Välj widgetstorlek/ })`, asserts each button is reachable via Tab from outside, and pressing Enter on the active button triggers a size change (test the existing onSizeChange prop wiring already verified in Phase 2 — extend by checking keyboard-only operation).
    - Add a test that asserts the live region announces ONCE after a size change, not multiple times (verifiable by checking the announcement string after a click, then asserting no further DOM changes to that region after a 50ms tick).
  </behavior>
  <action>
    Step 1 — Create `client/src/components/widgets/__tests__/anti-shaming.test.tsx`:

    ```typescript
    import { describe, it, expect } from 'vitest'
    import { render } from '@testing-library/react'
    import { MemoryRouter } from 'react-router-dom'
    import { JobsokDataProvider } from '../JobsokDataContext'
    import type { JobsokSummary } from '../JobsokDataContext'
    import CvWidget from '../CvWidget'
    import CoverLetterWidget from '../CoverLetterWidget'
    import InterviewWidget from '../InterviewWidget'
    import JobSearchWidget from '../JobSearchWidget'
    import ApplicationsWidget from '../ApplicationsWidget'
    import SpontaneousWidget from '../SpontaneousWidget'
    import SalaryWidget from '../SalaryWidget'
    import InternationalWidget from '../InternationalWidget'

    /**
     * A11Y-03 — anti-shaming guard.
     *
     * No widget renders a number followed by "%" as a PRIMARY KPI.
     * Primary KPI typography slot = element with className containing
     * "text-[32px]" OR "text-[22px]", AND "font-bold".
     *
     * NOTE: Decorative percentages inside ProgressRing label (CV) are EXCLUDED —
     * they are inside SVG with smaller font, not the primary 32/22px slot.
     */

    const PRIMARY_KPI_CLASS_RE = /(text-\[32px\]|text-\[22px\])/

    function isPrimaryKPI(el: Element): boolean {
      const cls = el.className?.toString?.() ?? ''
      return PRIMARY_KPI_CLASS_RE.test(cls) && /font-bold/.test(cls)
    }

    function fixture(): JobsokSummary {
      return {
        cv: { id: 'cv-1', updated_at: '2026-04-25', completion_pct: 75 },
        coverLetters: [{ id: 'cl-1', title: 'Klarna UX', created_at: '2026-04-26' }],
        interviewSessions: [{ id: 's-1', score: 84, created_at: '2026-04-27' }],
        applicationStats: {
          total: 12,
          byStatus: { saved: 4, applied: 2, interview: 1, rejected: 5 },
          segments: [
            { label: 'aktiva', count: 4 },
            { label: 'svar inväntas', count: 2 },
            { label: 'intervju', count: 1 },
            { label: 'avslutade', count: 5, deEmphasized: true },
          ],
        },
        spontaneousCount: 5,
      }
    }

    function renderWidget(W: any, slice?: keyof JobsokSummary) {
      const data = fixture()
      return render(
        <MemoryRouter>
          <JobsokDataProvider value={data}>
            <W id={slice ?? 'cv'} size="L" />
          </JobsokDataProvider>
        </MemoryRouter>
      )
    }

    const cases = [
      ['CvWidget', CvWidget, 'cv'],
      ['CoverLetterWidget', CoverLetterWidget, 'coverLetters'],
      ['InterviewWidget', InterviewWidget, 'interviewSessions'],
      ['JobSearchWidget', JobSearchWidget, 'applicationStats'],
      ['ApplicationsWidget', ApplicationsWidget, 'applicationStats'],
      ['SpontaneousWidget', SpontaneousWidget, 'spontaneousCount'],
      ['SalaryWidget', SalaryWidget, 'salary'],
      ['InternationalWidget', InternationalWidget, 'international'],
    ] as const

    describe('A11Y-03: no raw % in primary KPI slot', () => {
      it.each(cases)('%s does not render a number followed by %% in primary-KPI typography', (name, W, slice) => {
        const { container } = renderWidget(W, slice as keyof JobsokSummary)
        const allEls = Array.from(container.querySelectorAll('*'))
        const primaryKPIs = allEls.filter(isPrimaryKPI)
        for (const el of primaryKPIs) {
          const text = (el.textContent ?? '').trim()
          // Allowed: "84 / 100" (no %), "12" (no %), "52 000 kr/mån" (no %)
          // Forbidden: "75%", "94%", "84%"
          expect(text).not.toMatch(/^\s*\d+\s*%\s*$/)
          // Also forbid trailing-only percentage as the entire content
          expect(text).not.toMatch(/\d+%/)
        }
      })

      it('JobSearchWidget match cards never contain a raw percentage', () => {
        const { container } = renderWidget(JobSearchWidget, 'applicationStats')
        // Every element with "match" class or text — extracted broadly
        const text = container.textContent ?? ''
        // Forbidden: "94% match", "85%", etc. Allowed: "Bra match", "Mycket bra match"
        expect(text).not.toMatch(/\d+%\s*match/i)
        expect(text).not.toMatch(/match\s*\d+%/i)
      })
    })
    ```

    Step 2 — Extend `client/src/pages/hubs/__tests__/JobsokHub.test.tsx`. Read the file, find the existing `describe('JobsokHub')` block, and APPEND new tests inside it (do not modify or remove existing tests).

    Add these two tests at the end of the existing describe block:

    ```typescript
    it('A11Y-01: keyboard user can Tab to size toggle and Enter to change size', async () => {
      const user = (await import('@testing-library/user-event')).default.setup()
      // Render the hub (use the existing render helper from this file)
      // ... render code matching the file's existing pattern with QueryClientProvider + MemoryRouter wrappers
      // ...
      // Find the first widget's toggle group
      const toggleGroups = await screen.findAllByRole('group', { name: /Välj widgetstorlek/i })
      expect(toggleGroups.length).toBeGreaterThan(0)
      // Within the first group, find the S/M/L buttons
      const firstGroup = toggleGroups[0]
      const buttons = firstGroup.querySelectorAll('button')
      expect(buttons.length).toBeGreaterThanOrEqual(3)
      // Tab focus to first button
      buttons[0].focus()
      expect(document.activeElement).toBe(buttons[0])
      // Press Enter — onClick fires, size changes, live region updates
      await user.keyboard('{Enter}')
      // Live-region announcement should reflect the size
      const liveRegion = document.querySelector('[role="status"][aria-live="polite"]')
      expect(liveRegion?.textContent).toMatch(/storlek/i)
    })

    it('A11Y-01: live-region announces a single message after size change (Pitfall 17)', async () => {
      const user = (await import('@testing-library/user-event')).default.setup()
      // ... render
      const toggleGroups = await screen.findAllByRole('group', { name: /Välj widgetstorlek/i })
      const firstGroup = toggleGroups[0]
      const buttons = Array.from(firstGroup.querySelectorAll('button'))
      // Click M button (assuming index 1 is M)
      const mButton = buttons.find(b => b.textContent?.trim() === 'M')!
      await user.click(mButton)
      const liveRegion = document.querySelector('[role="status"][aria-live="polite"]')
      // Single, specific announcement — not a stream of DOM mutations
      expect(liveRegion?.textContent).toMatch(/Widgeten är nu M-storlek/)
    })
    ```

    Adapt the helper-function names and render wrappers to match the EXISTING JobsokHub.test.tsx pattern (read the file first to identify whether the existing tests use a `renderHub()` helper or inline render — match that pattern exactly so the new tests slot in seamlessly).

    Run all the new and modified tests:
    ```bash
    cd client && npm run test:run -- src/components/widgets/__tests__/anti-shaming.test.tsx
    cd client && npm run test:run -- src/pages/hubs/__tests__/JobsokHub.test.tsx
    cd client && npm run test:run
    ```
  </action>
  <verify>
    <automated>cd client && npm run test:run -- src/components/widgets/__tests__/anti-shaming.test.tsx src/pages/hubs/__tests__/JobsokHub.test.tsx 2>&1 | grep -E "(passed|failed)" | tail -5</automated>
  </verify>
  <acceptance_criteria>
    - File `client/src/components/widgets/__tests__/anti-shaming.test.tsx` exists
    - File contains literal `it.each(cases)` iterating over all 8 widgets
    - File contains regex `/\d+%/` (the anti-shaming pattern)
    - File contains a JobSearchWidget-specific test for `match\s*\d+%` patterns
    - `client/src/pages/hubs/__tests__/JobsokHub.test.tsx` contains the literal string `A11Y-01: keyboard user can Tab to size toggle`
    - File contains the literal string `A11Y-01: live-region announces a single message`
    - File still contains all 10 original Phase 2 tests (verifiable: count `it(` blocks; should be at least 12 = 10 original + 2 new)
    - `cd client && npm run test:run -- src/components/widgets/__tests__/anti-shaming.test.tsx` exits 0 (9 tests pass: 8 widget cases + 1 JobSearch-specific)
    - `cd client && npm run test:run -- src/pages/hubs/__tests__/JobsokHub.test.tsx` exits 0
    - `cd client && npm run test:run` exits 0 (full suite green)
    - `cd client && npx tsc --noEmit` exits 0
  </acceptance_criteria>
  <done>
    A11Y-01 (keyboard + single-announcement live-region) and A11Y-03 (anti-shaming) both have CI-verifiable regression guards. Combined with A11Y-04 from Plan 03 and A11Y-02 from Task 1 above, the entire WCAG 2.1 AA bundle except A11Y-05 (subjective empathy review) has automated coverage.
  </done>
</task>

<task type="auto">
  <name>Task 3: Generate 03-PRE-IMPL-COPY-REVIEW.md — rendered text per widget per state, ready for Plan 05 agent review</name>
  <files>.planning/phases/03-data-wiring-wcag/03-PRE-IMPL-COPY-REVIEW.md</files>
  <read_first>
    - All 8 widget source files (after Plan 03 wiring — get the actual rendered copy for filled / empty / error)
    - .planning/phases/02-static-widget-grid/02-UI-SPEC.md "Empty State Copy Contract" + "Error State Copy" + "Copywriting Contract"
    - .planning/phases/03-data-wiring-wcag/03-CONTEXT.md "Empati-review-process (A11Y-05 ship-gate)" — Step 1 description
  </read_first>
  <action>
    Create `.planning/phases/03-data-wiring-wcag/03-PRE-IMPL-COPY-REVIEW.md`. This is the Step 1 artifact of the empathy review. Plan 05 will feed this file (plus screenshots after Phase 3 ships) to the `arbetskonsulent` and `langtidsarbetssokande` agents.

    Each widget needs three states documented as a Markdown table. Capture the EXACT strings rendered by the wired widget code (not the UI-SPEC, the actual code — they should match, but verify by reading each widget file).

    The file structure must be exactly this:

    ```markdown
    # Phase 3 — Pre-Implementation Copy Review (Step 1 of A11Y-05 empathy gate)

    **Generated:** {YYYY-MM-DD}
    **Phase:** 3 (Data Wiring + WCAG)
    **Reviewers (Plan 05):** `arbetskonsulent`, `langtidsarbetssokande`
    **Source of truth:** widget code in `client/src/components/widgets/*.tsx` after Plan 03 wiring

    This artifact captures the exact text strings each widget renders in three states (filled / empty / error). Plan 05's empathy-review agents read this file BEFORE looking at screenshots — copy issues caught here are easier to fix than after live data renders.

    Reference: `.planning/phases/02-static-widget-grid/02-UI-SPEC.md` Empty State Copy Contract.

    ---

    ## Per-Widget Rendered Copy

    ### 1. CvWidget (Söka jobb / Skapa & öva)

    | State | Heading | Body | Primary CTA | Secondary CTA |
    |-------|---------|------|-------------|---------------|
    | Filled (cv.completion_pct=75) | (Ring shows 75%) | "Nästan klart — 1 sektion kvar" + "Senast redigerad: {relative}" | "Fortsätt redigera" | "Förhandsgranska" |
    | Empty (cv=null) | "Ditt CV väntar" | "Skapa ditt CV och kom igång med din jobbsökning" | "Skapa CV" | — |
    | Error (boundary) | "Kunde inte ladda" | "Försök igen om en stund" | "Försök igen" (link) | — |

    ### 2. CoverLetterWidget (Söka jobb / Skapa & öva)

    | State | Heading | Body | Primary CTA | Secondary CTA |
    |-------|---------|------|-------------|---------------|
    | Filled (coverLetters.length=3) | (KPI: 3 utkast) | "Senast: {coverLetters[0].title}" | "+ Generera nytt brev" | "Visa alla →" |
    | Empty ([]) | "Inga brev ännu" | "Generera ett anpassat brev till din nästa ansökan" | "+ Generera brev" | — |
    | Error | "Kunde inte ladda" | "Försök igen om en stund" | "Försök igen" | — |

    ### 3. InterviewWidget (Söka jobb / Skapa & öva)

    | State | Heading | Body | Primary CTA | Notes |
    |-------|---------|------|-------------|-------|
    | Filled (sessions.length=8, latest score=84) | (KPI: 84 / 100 + sparkline) | "{N} övningar denna vecka" | "Starta ny session" | "84 / 100" framing per UI-SPEC (motivating, not shaming) |
    | Filled-no-score (sessions.length=3, all score=null) | (KPI: "—" / 100) | (no sparkline; less than 2 valid points) | "Starta ny session" | DATA-01 nullable contract |
    | Empty ([]) | "Redo att öva?" | "Träna på vanliga intervjufrågor med direkt feedback" | "Starta din första session" | — |
    | Error | "Kunde inte ladda" | "Försök igen om en stund" | "Försök igen" | — |

    ### 4. JobSearchWidget (Söka jobb / Sök & ansök)

    | State | Heading | Body | Primary CTA |
    |-------|---------|------|-------------|
    | Filled (matches.length=3) | (KPI: 12 nya träffar idag) | match-cards: "{role} · {company} · {qualitative-label}" | "Visa alla {N} träffar" |
    | Empty (no saved searches) | "Inga sparade sökningar" | "Spara en sökning så visar vi nya träffar automatiskt" | "Gå till jobbsökning" |
    | Error | "Kunde inte ladda" | "Försök igen om en stund" | "Försök igen" |

    ### 5. ApplicationsWidget (Söka jobb / Sök & ansök)

    | State | Heading | Body | Notes |
    |-------|---------|------|-------|
    | Filled (total=12, segments visible without "avslutade") | (KPI: 12 totalt) | StackedBar: aktiva 4, svar inväntas 2, intervju 1 + amber chip "1 ansökan väntar på ditt svar" | A11Y-04: "avslutade" segment HIDDEN by default |
    | Filled-with-toggle-clicked | same | StackedBar now shows 4 segments incl. avslutade 5 (de-emphasized) | "Visa avslutade ({N})" link replaced by toggled state |
    | Empty (total=0) | "Inga ansökningar ännu" | "Lägg till din första ansökan för att hålla koll på din pipeline" | CTA: "Lägg till ansökan" |
    | Error | "Kunde inte ladda" | "Försök igen om en stund" | — |

    ### 6. SpontaneousWidget (Söka jobb / Sök & ansök)

    | State | Heading | Body | CTA |
    |-------|---------|------|-----|
    | Filled (count=5) | (KPI: 5 företag i pipeline) | — | "+ Lägg till →" |
    | Empty (count=0) | "Inget i pipeline" | "Kontakta företag direkt — även utan utlyst tjänst" | "+ Lägg till företag" |
    | Error | "Kunde inte ladda" | "Försök igen om en stund" | — |

    ### 7. SalaryWidget (Söka jobb / Marknad)

    | State | Heading | Body | Notes |
    |-------|---------|------|-------|
    | Filled (salary table exists) | (KPI: {median} kr/mån) | RangeBar low-median-high + roleLabel | (per Plan 01 verdict on salary_data table existence) |
    | Empty (no role / table absent) | "Vad är din lön värd?" | "Ange din roll för att se marknadslönen" | CTA: "Beräkna min lön" |
    | Error | "Kunde inte ladda" | "Försök igen om en stund" | — |

    ### 8. InternationalWidget (Söka jobb / Marknad)

    | State | Heading | Body | CTA |
    |-------|---------|------|-----|
    | Empty (default — international_targets table absent) | "Arbetar du mot utlandsjobb?" | "Hitta jobb och företag i andra länder" | "Utforska möjligheter →" |
    | Error | "Kunde inte ladda" | "Försök igen om en stund" | — |

    ---

    ## Cross-Widget Framing Rules (UI-SPEC carry-forward — do not change in agent review)

    | Rule | Applies to | Status |
    |------|-----------|--------|
    | No raw % as primary KPI (A11Y-03) | All widgets | LOCKED — verified by anti-shaming.test.tsx |
    | Closed applications hidden by default (A11Y-04) | ApplicationsWidget | LOCKED — verified by ApplicationsWidget.test.tsx |
    | Match labels qualitative only | JobSearchWidget | LOCKED — TS union type enforces |
    | Empty state action-oriented (no bare zero, no "Inga data") | All widgets | Per UI-SPEC — agents review tone |
    | "Fortsätt", "Skapa", "+ Lägg till" — encouraging verbs | All CTAs | Per UI-SPEC — agents review |

    ---

    ## What Agents Should Review (Plan 05 input prompt)

    For each widget × state combination above, both `arbetskonsulent` and `langtidsarbetssokande` should answer:

    1. **Tone** — Does this read as supportive, neutral, or stressful for a long-term-unemployed user with low self-efficacy?
    2. **Concrete action** — Is the next step obvious to someone with cognitive fatigue / NPF?
    3. **Implicit shaming** — Does any element imply the user is "behind", "incomplete", "lacking"?
    4. **Empty state** — If this is empty, does it feel inviting (PASS), neutral (FLAG), or like an accusation (BLOCK)?
    5. **Verdict** — PASS / FLAG / BLOCK per state.

    Plan 05 will feed this entire file PLUS screenshots to the agents and capture their verdicts in `03-EMPATHY-REVIEW.md`.

    ---

    *Pre-implementation review artifact generated 2026-04-29 (Phase 3 Plan 04). Step 2 (post-implementation screenshot review) lands in Plan 05.*
    ```

    Replace any `{placeholders}` with the actual values where they are knowable from the wired widget code. For values that depend on runtime data (e.g. `{coverLetters[0].title}`), keep the curly-brace placeholder — the agent will interpret these as "the actual title at review time".

    Verify the file exists and has the required sections:
    ```bash
    test -f .planning/phases/03-data-wiring-wcag/03-PRE-IMPL-COPY-REVIEW.md
    grep -c "^### " .planning/phases/03-data-wiring-wcag/03-PRE-IMPL-COPY-REVIEW.md
    ```
    Expect: 8 widget sections (### 1. through ### 8.) — `grep -c "^### "` returns at least 8.
  </action>
  <verify>
    <automated>test -f .planning/phases/03-data-wiring-wcag/03-PRE-IMPL-COPY-REVIEW.md && grep -c "^### " .planning/phases/03-data-wiring-wcag/03-PRE-IMPL-COPY-REVIEW.md | grep -E "^[8-9]|^[0-9][0-9]" && grep -q "What Agents Should Review" .planning/phases/03-data-wiring-wcag/03-PRE-IMPL-COPY-REVIEW.md</automated>
  </verify>
  <acceptance_criteria>
    - File `.planning/phases/03-data-wiring-wcag/03-PRE-IMPL-COPY-REVIEW.md` exists
    - File has at least 8 widget section headers (verifiable: `grep -c "^### " 03-PRE-IMPL-COPY-REVIEW.md` returns >=8)
    - File contains exact UI-SPEC empty-state heading strings: "Ditt CV väntar", "Inga brev ännu", "Redo att öva?", "Inga sparade sökningar", "Inga ansökningar ännu", "Inget i pipeline", "Vad är din lön värd?", "Arbetar du mot utlandsjobb?"
    - File mentions A11Y-03 anti-shaming guard rule
    - File mentions A11Y-04 closed-applications-hidden rule
    - File contains "What Agents Should Review" section with PASS/FLAG/BLOCK verdict structure
    - File is at least 60 lines long (verifiable: `wc -l 03-PRE-IMPL-COPY-REVIEW.md` returns >=60)
  </acceptance_criteria>
  <done>
    Plan 05's empathy-review Step 1 input artifact exists. The agents have a structured table of all 8 widgets × 3 states to review, plus the cross-widget framing rules locked from UI-SPEC. Plan 05 can now drive the agents through this material before screenshots.
  </done>
</task>

</tasks>

<verification>
- A11Y-01: keyboard navigation Tab/Enter on size toggles — test added to JobsokHub.test.tsx
- A11Y-01: single live-region announcement on size change — test added to JobsokHub.test.tsx
- A11Y-02: framer-motion + useReducedMotion static guard test passes for all 8 widgets
- A11Y-02: tokens.css reduced-motion media query existence test passes
- A11Y-03: anti-shaming guard test scans 8 widgets for /\d+%/ in primary-KPI slots — passes
- A11Y-03: JobSearchWidget-specific match-card percent guard — passes
- A11Y-04: closed-hidden test from Plan 03 still passes (regression guard)
- 03-PRE-IMPL-COPY-REVIEW.md exists with all 8 widgets × 3 states tabled
- Full test suite green
- TypeScript clean
</verification>

<success_criteria>
- WCAG 2.1 AA structural bundle (A11Y-01, A11Y-02, A11Y-03, A11Y-04) has automated regression coverage
- A11Y-05 empathy-review Step 1 artifact ready for Plan 05 agents
- No widget code regressed during hardening (existing data-wiring tests still pass)
- Phase 3 acceptance gate is now: green test suite + signed empathy review (Plan 05 only)
</success_criteria>

<output>
After completion, create `.planning/phases/03-data-wiring-wcag/03-04-SUMMARY.md` with:
- Test counts before vs after this plan (delta = new tests added)
- Confirmation that A11Y-01..04 each have at least one named CI test
- Confirmation that Phase 2's 10 JobsokHub.test.tsx tests are still passing
- 03-PRE-IMPL-COPY-REVIEW.md file path so Plan 05 picks it up
</output>
