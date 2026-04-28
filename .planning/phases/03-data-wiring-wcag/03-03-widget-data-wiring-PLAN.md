---
phase: 03-data-wiring-wcag
plan: 03
type: execute
wave: 3
depends_on: [03-02-hub-summary-loader-PLAN]
files_modified:
  - client/src/components/widgets/CvWidget.tsx
  - client/src/components/widgets/CoverLetterWidget.tsx
  - client/src/components/widgets/InterviewWidget.tsx
  - client/src/components/widgets/JobSearchWidget.tsx
  - client/src/components/widgets/ApplicationsWidget.tsx
  - client/src/components/widgets/SpontaneousWidget.tsx
  - client/src/components/widgets/SalaryWidget.tsx
  - client/src/components/widgets/InternationalWidget.tsx
  - client/src/components/widgets/CvWidget.test.tsx
  - client/src/components/widgets/CoverLetterWidget.test.tsx
  - client/src/components/widgets/InterviewWidget.test.tsx
  - client/src/components/widgets/JobSearchWidget.test.tsx
  - client/src/components/widgets/ApplicationsWidget.test.tsx
  - client/src/components/widgets/SpontaneousWidget.test.tsx
  - client/src/services/interviewService.ts
  - client/src/services/personalBrandAuditsApi.ts
  - client/src/services/personalBrandAuditsApi.test.ts
  - client/src/pages/personal-brand/BrandAuditTab.tsx
autonomous: true
requirements: [HUB-01, DATA-01, DATA-02, A11Y-04]
must_haves:
  truths:
    - "All 8 widgets read their data from JobsokDataContext instead of local MOCK constants"
    - "ApplicationsWidget hides closed/avslutade segment by default; clicking 'Visa avslutade (N)' link reveals it"
    - "Interview saveSession flow accepts an optional score + score_breakdown and persists them via UPDATE on interview_sessions"
    - "BrandAuditTab.tsx, after the existing personalBrandApi.saveAuditAnswers call resolves, ALSO calls personalBrandAuditsApi.create({score, dimensions, summary}) — appending one history row per audit run"
    - "Each widget shows a compassionate empty state (per UI-SPEC Empty State Copy Contract) when its context slice is undefined OR an empty array"
    - "No widget file imports @/lib/supabase (Pitfall A guard preserved from Plan 02)"
  artifacts:
    - path: "client/src/services/personalBrandAuditsApi.ts"
      provides: "Append-only insert API for the new personal_brand_audits table"
      contains: "export async function create"
    - path: "client/src/services/personalBrandAuditsApi.test.ts"
      provides: "DATA-02 persistence test"
    - path: "client/src/components/widgets/ApplicationsWidget.tsx"
      provides: "Real applicationStats rendering + showClosed toggle (A11Y-04)"
      contains: "useState(false)"
  key_links:
    - from: "client/src/components/widgets/CvWidget.tsx"
      to: "JobsokDataContext"
      via: "useJobsokWidgetData('cv')"
      pattern: "useJobsokWidgetData\\('cv'\\)"
    - from: "client/src/components/widgets/ApplicationsWidget.tsx"
      to: "JobsokDataContext"
      via: "useJobsokWidgetData('applicationStats')"
      pattern: "useJobsokWidgetData\\('applicationStats'\\)"
    - from: "client/src/services/interviewService.ts"
      to: "interview_sessions.score column"
      via: "UPDATE with score + score_breakdown"
      pattern: "score:\\s*\\w+"
    - from: "client/src/pages/personal-brand/BrandAuditTab.tsx"
      to: "personalBrandAuditsApi.create"
      via: "post-saveAuditAnswers append-only insert"
      pattern: "personalBrandAuditsApi\\.create\\("
---

<objective>
Replace the 8 widgets' MOCK constants with reads from `JobsokDataContext`, persist Interview score (DATA-01) and Personal Brand audit history (DATA-02), and add A11Y-04's closed-applications-hidden-by-default behavior to ApplicationsWidget. Each widget gains an empty-state branch matching the UI-SPEC Empty State Copy Contract — no bare zeros, no "Inga data".

Purpose: Take the widgets from "looking right with mock data" (Phase 2 ship state) to "showing real Supabase data with empathy-safe framing" (Phase 3 HUB-01 + DATA-01 + DATA-02 + A11Y-04 gate).

Output: 8 wired widgets with passing data-shape tests, two persistence services (interview score + personal-brand audits), BrandAuditTab.tsx unchanged in behavior but adding one persistence side-effect, all per-widget tests green, full suite green.
</objective>

<execution_context>
@C:/Users/Mikael/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/Mikael/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/03-data-wiring-wcag/03-CONTEXT.md
@.planning/phases/03-data-wiring-wcag/03-RESEARCH.md
@.planning/phases/03-data-wiring-wcag/03-VALIDATION.md
@.planning/phases/03-data-wiring-wcag/03-01-SUMMARY.md
@.planning/phases/03-data-wiring-wcag/03-02-SUMMARY.md
@.planning/phases/02-static-widget-grid/02-UI-SPEC.md
@.planning/research/PITFALLS.md
@CLAUDE.md
@client/src/components/widgets/Widget.tsx
@client/src/components/widgets/JobsokDataContext.tsx
@client/src/components/widgets/CvWidget.tsx
@client/src/components/widgets/CoverLetterWidget.tsx
@client/src/components/widgets/InterviewWidget.tsx
@client/src/components/widgets/JobSearchWidget.tsx
@client/src/components/widgets/ApplicationsWidget.tsx
@client/src/components/widgets/SpontaneousWidget.tsx
@client/src/components/widgets/SalaryWidget.tsx
@client/src/components/widgets/InternationalWidget.tsx
@client/src/services/interviewService.ts
@client/src/services/cloudStorage.ts
@client/src/pages/personal-brand/BrandAuditTab.tsx

<interfaces>
<!-- JobsokSummary shape (LOCKED by Plan 02) — what each widget reads -->
```typescript
interface JobsokSummary {
  cv: { id: string; updated_at: string; completion_pct?: number } | null
  coverLetters: Array<{ id: string; title?: string; created_at: string }>
  interviewSessions: Array<{ id: string; score: number | null; created_at: string }>
  applicationStats: {
    total: number
    byStatus: Record<string, number>
    segments: Array<{ label: string; count: number; deEmphasized?: boolean }>
  }
  spontaneousCount: number
  salary?: { median: number; low: number; high: number; roleLabel: string } | null
  international?: { countries: string[] } | null
}
```

<!-- Plan 02 hooks (LOCKED): -->
<!--   useJobsokSummary(): JobsokSummary | undefined           — full summary -->
<!--   useJobsokWidgetData('cv'): summary.cv | undefined        — single slice -->
<!--   useJobsokWidgetData('applicationStats'): summary.applicationStats | undefined -->

<!-- UI-SPEC Empty State Copy Contract (LOCKED — must use exact strings): -->
<!-- CV (no CV): heading="Ditt CV väntar"   body="Skapa ditt CV och kom igång med din jobbsökning"   cta="Skapa CV" -->
<!-- CoverLetter (0 drafts): heading="Inga brev ännu"   body="Generera ett anpassat brev till din nästa ansökan"   cta="+ Generera brev" -->
<!-- Interview (no sessions): heading="Redo att öva?"   body="Träna på vanliga intervjufrågor med direkt feedback"   cta="Starta din första session" -->
<!-- JobSearch (no saved): heading="Inga sparade sökningar"   body="Spara en sökning så visar vi nya träffar automatiskt"   cta="Gå till jobbsökning" -->
<!-- Applications (0 apps): heading="Inga ansökningar ännu"   body="Lägg till din första ansökan för att hålla koll på din pipeline"   cta="Lägg till ansökan" -->
<!-- Spontaneous (0): heading="Inget i pipeline"   body="Kontakta företag direkt — även utan utlyst tjänst"   cta="+ Lägg till företag" -->
<!-- Salary (no role): heading="Vad är din lön värd?"   body="Ange din roll för att se marknadslönen"   cta="Beräkna min lön" -->
<!-- International (no countries): heading="Arbetar du mot utlandsjobb?"   body="Hitta jobb och företag i andra länder"   cta="Utforska möjligheter →"  (existing empty state — KEEP) -->

<!-- UI-SPEC Progress Framing rules (LOCKED) -->
<!-- - CV: ring is OK; primary label is milestoneLabel(percent) — NEVER "75% klart" as primary -->
<!-- - JobSearch: qualitative match labels only ('Bra match' | 'Mycket bra match') — NEVER raw % -->
<!-- - Applications: closed/avslutade segment de-emphasized + hidden by default — A11Y-04 -->
<!-- - Interview: "84 / 100" is acceptable per UI-SPEC (not shaming when motivating) -->

<!-- Existing interviewSessionsApi (cloudStorage.ts:1154) — has create + update -->
<!-- update(id, updates) accepts arbitrary fields; we now pass score + score_breakdown -->

<!-- BrandAuditTab existing flow (line 187-203): -->
<!--   useEffect with debounce calls personalBrandApi.saveAuditAnswers(answers, totalScore, categoryScores) -->
<!--   Plan 03 adds ONE additional call AFTER that resolves: personalBrandAuditsApi.create({...}) -->
<!--   The existing upsert behavior on personal_brand_audit (singular) is UNCHANGED -->
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Wire 8 widgets to JobsokDataContext (HUB-01) + add A11Y-04 closed-toggle to ApplicationsWidget</name>
  <files>
    client/src/components/widgets/CvWidget.tsx,
    client/src/components/widgets/CoverLetterWidget.tsx,
    client/src/components/widgets/InterviewWidget.tsx,
    client/src/components/widgets/JobSearchWidget.tsx,
    client/src/components/widgets/ApplicationsWidget.tsx,
    client/src/components/widgets/SpontaneousWidget.tsx,
    client/src/components/widgets/SalaryWidget.tsx,
    client/src/components/widgets/InternationalWidget.tsx,
    client/src/components/widgets/CvWidget.test.tsx,
    client/src/components/widgets/CoverLetterWidget.test.tsx,
    client/src/components/widgets/InterviewWidget.test.tsx,
    client/src/components/widgets/JobSearchWidget.test.tsx,
    client/src/components/widgets/ApplicationsWidget.test.tsx,
    client/src/components/widgets/SpontaneousWidget.test.tsx
  </files>
  <read_first>
    - All 8 widget source files (current Phase 2 MOCK structure must be preserved visually — only data source changes)
    - .planning/phases/02-static-widget-grid/02-UI-SPEC.md "Empty State Copy Contract" + "Progress / KPI Framing Rules" (verbatim copy strings)
    - client/src/components/widgets/JobsokDataContext.tsx (useJobsokWidgetData/useJobsokSummary signatures)
    - .planning/phases/03-data-wiring-wcag/03-01-SUMMARY.md (whether salary_data / international_targets exist; informs SalaryWidget/InternationalWidget wire vs empty)
    - .planning/research/PITFALLS.md Pitfall 11 (no raw % as primary KPI; no prominent "avslutade" count)
  </read_first>
  <behavior>
    Per widget, three render branches must coexist:
    1. **Loading** (`data === undefined`): keep existing visual structure but render empty content (no MOCK numbers). Acceptable: render nothing inside Widget.Body except a small skeleton OR keep the Widget.Header visible only. The test asserts the widget renders without crashing when context returns undefined.
    2. **Empty** (slice resolved but is null/empty): render the UI-SPEC empty-state copy.
    3. **Filled** (slice has data): render with real values.

    For ApplicationsWidget specifically:
    - Add `const [showClosed, setShowClosed] = useState(false)` at the top
    - Filter segments: `const visibleSegments = showClosed ? segments : segments.filter(s => !s.deEmphasized)`
    - When `!showClosed && segments.some(s => s.deEmphasized && s.count > 0)`, render a small `<button>` link below StackedBar: "Visa avslutade ({closedCount})"
    - Clicking the button toggles `showClosed` to true
    - Default behavior: closed segment is HIDDEN — A11Y-04 satisfied
  </behavior>
  <action>
    For each widget, replace the `const MOCK = {...}` block and the rendering body with reads from JobsokDataContext. Keep ALL existing JSX structure, sizing logic, and CTA Links — only the data source changes.

    **CvWidget.tsx** — replace MOCK_CV usage:
    ```typescript
    import { useJobsokWidgetData } from './JobsokDataContext'
    // ...
    const cv = useJobsokWidgetData('cv')

    // Loading: cv === undefined → render skeleton-state widget header only
    // Empty: cv === null → render empty state per UI-SPEC
    // Filled: cv has data
    if (cv === undefined) {
      return <Widget id={id} size={size} ...><Widget.Header icon={FileUser} title="CV" /></Widget>
    }
    if (cv === null) {
      return (
        <Widget id={id} size={size} ...>
          <Widget.Header icon={FileUser} title="CV" />
          <Widget.Body>
            <p className="text-[13px] font-bold text-[var(--stone-900)] m-0 mb-1">Ditt CV väntar</p>
            <p className="text-[12px] text-[var(--stone-700)] m-0">Skapa ditt CV och kom igång med din jobbsökning</p>
          </Widget.Body>
          <Widget.Footer>
            <Link to="/cv" className="...same primary CTA classes as before...">Skapa CV</Link>
          </Widget.Footer>
        </Widget>
      )
    }

    const percent = cv.completion_pct ?? 0
    // ... rest of existing JSX uses `percent` and `cv.updated_at` (formatted via existing pattern, e.g. "X dagar sedan")
    // Use the existing milestoneLabel() helper unchanged.
    ```

    **CoverLetterWidget.tsx** — read from `useJobsokWidgetData('coverLetters')`:
    - undefined → header-only loading
    - empty array → empty state heading="Inga brev ännu", body="Generera ett anpassat brev till din nästa ansökan", CTA="+ Generera brev"
    - filled → KPI is `coverLetters.length`, last edited line is `Senast: ${coverLetters[0].title ?? 'utkast'}` (no fabricated company labels — use what's actually in the row)

    **InterviewWidget.tsx** — read from `useJobsokWidgetData('interviewSessions')`:
    - undefined → loading
    - empty array → empty state heading="Redo att öva?", body="Träna på vanliga intervjufrågor med direkt feedback", CTA="Starta din första session"
    - filled → `lastScore = sessions[0].score ?? '—'`. If score is null show "—" or "Ingen poäng" instead of a number. Sparkline values: `sessions.slice().reverse().map(s => s.score).filter((n): n is number => n !== null)`. If filtered array is shorter than 2, the existing Sparkline component already returns null (Phase 2 decision per STATE.md).

    **JobSearchWidget.tsx** — read from `useJobsokSummary()` (this widget needs more than one slice):
    - For Phase 3, the simplest acceptable wiring: `newToday = applicationStats.byStatus['saved'] ?? 0` and `matches = []` (no live matching computation in Phase 3 — Open Question 2 in 03-RESEARCH.md). Show empty state for matches list at L size when matches is empty: heading="Inga sparade sökningar", body="Spara en sökning så visar vi nya träffar automatiskt", CTA="Gå till jobbsökning". The KPI (newToday) renders from saved-jobs count.
    - Anti-shaming guard: when matches has data, the existing TS union type `'Bra match' | 'Mycket bra match'` already enforces qualitative-only labels — do NOT render any percentage.

    **ApplicationsWidget.tsx** — read from `useJobsokWidgetData('applicationStats')`. Add A11Y-04 toggle:
    ```typescript
    import { useState } from 'react'
    import { useJobsokWidgetData } from './JobsokDataContext'
    // ...
    const stats = useJobsokWidgetData('applicationStats')
    const [showClosed, setShowClosed] = useState(false)

    if (stats === undefined) return <Widget ...><Widget.Header icon={Briefcase} title="Mina ansökningar" /></Widget>
    if (stats.total === 0) return /* empty state per UI-SPEC */

    const visibleSegments = showClosed
      ? stats.segments
      : stats.segments.filter(s => !s.deEmphasized)
    const closedCount = stats.segments.filter(s => s.deEmphasized).reduce((sum, s) => sum + s.count, 0)
    const pendingCount = stats.byStatus['pending_response'] ?? 0  // or whichever status indicates "väntar på ditt svar"
    const pendingAlert = pendingCount > 0 ? `${pendingCount} ansökan väntar på ditt svar` : null

    // Render with visibleSegments + closed-toggle button + conditional pendingAlert chip
    // The toggle button:
    {!showClosed && closedCount > 0 && (
      <button
        type="button"
        onClick={() => setShowClosed(true)}
        className="mt-2 self-start text-[12px] text-[var(--c-text)] underline-offset-2 hover:underline"
      >
        Visa avslutade ({closedCount})
      </button>
    )}
    ```

    **SpontaneousWidget.tsx** — read from `useJobsokWidgetData('spontaneousCount')`:
    - undefined → loading
    - 0 → empty state heading="Inget i pipeline", body="Kontakta företag direkt — även utan utlyst tjänst", CTA="+ Lägg till företag" (link to /spontanansökan)
    - >0 → existing render with the real number

    **SalaryWidget.tsx** — read from `useJobsokWidgetData('salary')`:
    - If 03-01-SUMMARY.md confirmed salary_data table does NOT exist, hub-loader does not populate this slice. Slice will be `undefined` permanently; widget renders empty state heading="Vad är din lön värd?", body="Ange din roll för att se marknadslönen", CTA="Beräkna min lön" (link to existing salary-related route — use `/loneforhandling` or whichever route exists; if uncertain, use `#` and leave a TODO comment).
    - If salary_data DOES exist, render with the live values (median/low/high/roleLabel).

    **InternationalWidget.tsx** — keep existing empty-state behavior (Phase 2 already implemented this correctly per UI-SPEC). Add: read `const intl = useJobsokWidgetData('international')`. If `intl?.countries.length` is positive in some future scenario, render that count; otherwise fall through to the existing empty-state JSX. No behavior change for Phase 3 (the table doesn't exist).

    Then UPDATE the 6 widget test files (CvWidget, CoverLetterWidget, InterviewWidget, JobSearchWidget, ApplicationsWidget, SpontaneousWidget) — replace each `it.skip` with a real test:

    Example for CvWidget.test.tsx:
    ```typescript
    import { describe, it, expect } from 'vitest'
    import { render, screen } from '@testing-library/react'
    import { MemoryRouter } from 'react-router-dom'
    import CvWidget from './CvWidget'
    import { JobsokDataProvider } from './JobsokDataContext'
    import type { JobsokSummary } from './JobsokDataContext'

    function renderWithCv(cv: JobsokSummary['cv']) {
      const summary = cv === undefined ? undefined : ({
        cv, coverLetters: [], interviewSessions: [], applicationStats: { total: 0, byStatus: {}, segments: [] }, spontaneousCount: 0,
      } as JobsokSummary)
      return render(
        <MemoryRouter>
          <JobsokDataProvider value={summary}>
            <CvWidget id="cv" size="L" />
          </JobsokDataProvider>
        </MemoryRouter>
      )
    }

    describe('CvWidget — data wiring', () => {
      it('renders milestone label from cv.completion_pct (HUB-01, A11Y-03)', () => {
        renderWithCv({ id: 'cv-1', updated_at: '2026-04-25', completion_pct: 75 })
        // Milestone label, not raw "75%" as PRIMARY KPI
        expect(screen.getByText(/Nästan klart|Klar att skickas|Bra start|Kom igång med ditt CV/)).toBeInTheDocument()
      })

      it('shows empty state when cv is null', () => {
        renderWithCv(null)
        expect(screen.getByText('Ditt CV väntar')).toBeInTheDocument()
        expect(screen.getByText(/Skapa ditt CV/)).toBeInTheDocument()
      })
    })
    ```

    Mirror the same shape for the other 5 widgets — each test file becomes 1–3 real tests asserting:
    - Filled-state renders expected key data
    - Empty-state renders the exact UI-SPEC heading string

    For ApplicationsWidget.test.tsx, additionally test A11Y-04:
    ```typescript
    it('hides closed segment by default (A11Y-04)', () => {
      const stats = {
        total: 12,
        byStatus: { saved: 4, applied: 2, interview: 1, rejected: 5 },
        segments: [
          { label: 'aktiva', count: 4 },
          { label: 'svar inväntas', count: 2 },
          { label: 'intervju', count: 1 },
          { label: 'avslutade', count: 5, deEmphasized: true },
        ],
      }
      // ... render with this stats slice
      // Default: "Visa avslutade (5)" link is visible; "avslutade" segment label is NOT in StackedBar visible legend
      expect(screen.getByRole('button', { name: /Visa avslutade \(5\)/ })).toBeInTheDocument()
    })

    it('reveals closed segment when toggle is clicked (A11Y-04)', async () => {
      // ... render
      // Click the button, wait, assert the legend now contains "avslutade"
    })
    ```

    Run the suite — every widget test must pass:
    ```bash
    cd client && npm run test:run -- src/components/widgets
    ```

    Run full suite:
    ```bash
    cd client && npm run test:run
    ```

    TypeScript check:
    ```bash
    cd client && npx tsc --noEmit
    ```

    All three must succeed. Architectural guard: NO widget file imports `@/lib/supabase` (verifiable: `grep -l "from '@/lib/supabase'" client/src/components/widgets/*.tsx` returns no matches).
  </action>
  <verify>
    <automated>cd client && npm run test:run -- src/components/widgets 2>&1 | grep -E "(passed|failed)" | tail -5 && grep -l "from '@/lib/supabase'" client/src/components/widgets/*.tsx 2>&1 | grep -v "No such" | head -1</automated>
  </verify>
  <acceptance_criteria>
    - All 8 widget files contain `import.*JobsokDataContext` (verifiable: `grep -lc "JobsokDataContext" client/src/components/widgets/*Widget.tsx` returns 8 paths)
    - No widget file contains `import.*from '@/lib/supabase'` (verifiable: `grep -L "from '@/lib/supabase'" client/src/components/widgets/*Widget.tsx` returns 8 paths — none have the import; Pitfall A guard)
    - CvWidget.tsx contains literal `useJobsokWidgetData('cv')`
    - CoverLetterWidget.tsx contains `useJobsokWidgetData('coverLetters')`
    - InterviewWidget.tsx contains `useJobsokWidgetData('interviewSessions')`
    - ApplicationsWidget.tsx contains `useJobsokWidgetData('applicationStats')` AND `useState(false)` AND literal text `'Visa avslutade'`
    - SpontaneousWidget.tsx contains `useJobsokWidgetData('spontaneousCount')`
    - Each empty-state heading from the UI-SPEC is grep-able in the right file (e.g. `grep "Ditt CV väntar" CvWidget.tsx` returns a hit; `grep "Inga brev ännu" CoverLetterWidget.tsx`; `grep "Redo att öva?" InterviewWidget.tsx`; `grep "Inga ansökningar ännu" ApplicationsWidget.tsx`; `grep "Inget i pipeline" SpontaneousWidget.tsx`; `grep "Vad är din lön värd?" SalaryWidget.tsx`)
    - 6 widget test files have real (non-skipped) tests — verifiable: `grep -L "it\.skip" client/src/components/widgets/CvWidget.test.tsx CoverLetterWidget.test.tsx InterviewWidget.test.tsx JobSearchWidget.test.tsx ApplicationsWidget.test.tsx SpontaneousWidget.test.tsx` returns those paths only when ALL tests are real (no skips remaining)
    - ApplicationsWidget.test.tsx contains `'hides closed segment by default'` test name and a click-toggle test
    - `cd client && npm run test:run -- src/components/widgets` exits 0
    - `cd client && npm run test:run` exits 0 (full suite green)
    - `cd client && npx tsc --noEmit` exits 0
    - No `MOCK_CV`, `MOCK` constant remains as the source of truth in any wired widget (verifiable: `grep -c "^const MOCK" client/src/components/widgets/CvWidget.tsx CoverLetterWidget.tsx InterviewWidget.tsx ApplicationsWidget.tsx SpontaneousWidget.tsx JobSearchWidget.tsx` returns 0 across these files; SalaryWidget and InternationalWidget may keep small fallback constants if salary_data is absent — note these in the file as fallback, not source of truth)
  </acceptance_criteria>
  <done>
    HUB-01 is complete: 8 widgets render real Supabase data via the hub-loader contract. A11Y-04 is implemented (closed applications hidden by default with explicit reveal). Pitfall A guard is enforced (zero supabase imports in widget files).
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Persist Interview score (DATA-01) — extend interviewService + add update path with score/breakdown</name>
  <files>
    client/src/services/interviewService.ts,
    client/src/services/interviewService.test.ts
  </files>
  <read_first>
    - client/src/services/interviewService.ts (existing saveInterviewSession at line 352 + InterviewSession type at line 41)
    - client/src/services/cloudStorage.ts lines 1154-1200 (interviewSessionsApi.create + interviewSessionsApi.update)
    - .planning/phases/03-data-wiring-wcag/03-01-SUMMARY.md (confirms score column is live on DB)
    - .planning/phases/03-data-wiring-wcag/03-RESEARCH.md "DATA-01: Saving Score After Interview Session" code example
  </read_first>
  <behavior>
    Add a new exported function `saveInterviewSessionWithScore(session, score, breakdown)` that:
    1. Inserts the session via existing `interviewSessionsApi.create(...)` (unchanged path).
    2. Captures the returned `id` from the create call.
    3. Calls `interviewSessionsApi.update(id, { score, score_breakdown: breakdown })` to persist the score.

    Test must verify:
    - Calling `saveInterviewSessionWithScore` with `score=84` and a `breakdown` object results in `interviewSessionsApi.update` being called with `{ score: 84, score_breakdown: <breakdown> }`
    - When `score` is undefined, the update is NOT called (backward-compat: existing saveInterviewSession path remains untouched and is still callable without score)

    The existing `saveInterviewSession(session)` MUST remain exported and unchanged in signature. Plan 03 does NOT modify any existing call sites. Future call-sites that compute a score will switch to the new function explicitly.
  </behavior>
  <action>
    Edit `client/src/services/interviewService.ts`. Find the existing `saveInterviewSession` function (around line 352) and ADD a new function below it. Do NOT modify the existing function.

    ```typescript
    /**
     * Phase 3 / DATA-01 — save session AND persist its score + breakdown.
     * The score is stored on interview_sessions.score (NUMERIC(4,1)) and
     * score_breakdown (JSONB) — both added by migration 20260429_interview_score.sql.
     *
     * Existing `saveInterviewSession(session)` remains the no-score path for
     * call-sites that have not yet computed a score.
     */
    export async function saveInterviewSessionWithScore(
      session: InterviewSession,
      score: number | null,
      breakdown?: Record<string, unknown>
    ): Promise<void> {
      try {
        const created = await interviewSessionsApi.create({
          mock_interview_id: session.mockInterviewId,
          start_time: session.startTime,
          end_time: session.endTime,
          answers: session.answers,
          completed: session.completed,
        })
        // Only persist the score if one was provided — preserves null-default semantics
        if (score !== null && created?.id) {
          await interviewSessionsApi.update(created.id, {
            score,
            score_breakdown: breakdown ?? null,
          } as Parameters<typeof interviewSessionsApi.update>[1])
        }
      } catch (error) {
        console.error('Fel vid sparande av intervjusession med poäng:', error)
        // No localStorage fallback for the scored variant — DB is the source of truth for DATA-01
        throw error
      }
    }
    ```

    Note: `interviewSessionsApi.update` exists in cloudStorage.ts (line 1187). Its second-argument type is `InterviewSessionUpdate`. If TypeScript flags `score`/`score_breakdown` as not part of that type, add them to the type definition in cloudStorage.ts (look for `InterviewSessionUpdate` near `interviewSessionsApi`) by extending it: `export interface InterviewSessionUpdate { /* existing fields */; score?: number | null; score_breakdown?: Record<string, unknown> | null }`. Do NOT widen the type with `any`.

    Create `client/src/services/interviewService.test.ts`:

    ```typescript
    import { describe, it, expect, vi, beforeEach } from 'vitest'

    const createMock = vi.fn()
    const updateMock = vi.fn()

    vi.mock('./cloudStorage', () => ({
      interviewSessionsApi: {
        create: (...args: unknown[]) => createMock(...args),
        update: (...args: unknown[]) => updateMock(...args),
        getAll: vi.fn(),
      },
    }))

    describe('saveInterviewSessionWithScore (DATA-01)', () => {
      beforeEach(() => {
        createMock.mockReset()
        updateMock.mockReset()
        createMock.mockResolvedValue({ id: 'session-123' })
        updateMock.mockResolvedValue(undefined)
      })

      it('inserts session and updates with score + breakdown when score provided', async () => {
        const { saveInterviewSessionWithScore } = await import('./interviewService')
        await saveInterviewSessionWithScore(
          { mockInterviewId: 'mi-1', startTime: '2026-04-28', answers: [], completed: true },
          84,
          { q1: 25, q2: 25, q3: 17, q4: 17 }
        )
        expect(createMock).toHaveBeenCalledTimes(1)
        expect(updateMock).toHaveBeenCalledTimes(1)
        const updatePayload = updateMock.mock.calls[0][1]
        expect(updatePayload).toMatchObject({ score: 84 })
        expect(updatePayload.score_breakdown).toMatchObject({ q1: 25, q2: 25, q3: 17, q4: 17 })
      })

      it('does NOT call update when score is null (backward-compat path)', async () => {
        const { saveInterviewSessionWithScore } = await import('./interviewService')
        await saveInterviewSessionWithScore(
          { mockInterviewId: 'mi-2', startTime: '2026-04-28', answers: [], completed: true },
          null
        )
        expect(createMock).toHaveBeenCalledTimes(1)
        expect(updateMock).not.toHaveBeenCalled()
      })
    })
    ```

    Run the test:
    ```bash
    cd client && npm run test:run -- src/services/interviewService.test.ts
    ```
  </action>
  <verify>
    <automated>cd client && npm run test:run -- src/services/interviewService.test.ts 2>&1 | grep -E "(passed|failed)"</automated>
  </verify>
  <acceptance_criteria>
    - `client/src/services/interviewService.ts` contains literal `export async function saveInterviewSessionWithScore`
    - File contains literal `interviewSessionsApi.update` call passing `score` and `score_breakdown`
    - Existing `saveInterviewSession` function is still exported and unmodified (verifiable: `grep -c "export async function saveInterviewSession\b" client/src/services/interviewService.ts` returns 1)
    - `client/src/services/interviewService.test.ts` contains 2 real tests (no `it.skip`)
    - Test 1 asserts both `create` and `update` are called
    - Test 2 asserts `update` is NOT called when score is null
    - `cd client && npm run test:run -- src/services/interviewService.test.ts` exits 0
    - `cd client && npx tsc --noEmit` exits 0
  </acceptance_criteria>
  <done>
    DATA-01 persistence path exists. Future Interview UI work can switch from `saveInterviewSession` to `saveInterviewSessionWithScore` to start storing scores. The widget already reads `score` from the loader (Task 1 InterviewWidget wire) — once any call-site uses the new function, scores appear automatically.
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 3: Create personalBrandAuditsApi service (DATA-02) + add audit-history append in BrandAuditTab</name>
  <files>
    client/src/services/personalBrandAuditsApi.ts,
    client/src/services/personalBrandAuditsApi.test.ts,
    client/src/pages/personal-brand/BrandAuditTab.tsx
  </files>
  <read_first>
    - client/src/services/cloudStorage.ts (existing personalBrandApi.saveAuditAnswers — DO NOT MODIFY this; new service is a SEPARATE file targeting the new plural table)
    - client/src/pages/personal-brand/BrandAuditTab.tsx lines 175-203 (existing useEffect that calls personalBrandApi.saveAuditAnswers)
    - .planning/phases/03-data-wiring-wcag/03-01-SUMMARY.md (confirms personal_brand_audits table is live)
    - .planning/phases/03-data-wiring-wcag/03-RESEARCH.md "DATA-02: Inserting Personal Brand Audit Score" + "Pitfall C: personal_brand_audit vs personal_brand_audits Naming Collision" (CRITICAL)
    - client/src/lib/supabase.ts (supabase client export)
  </read_first>
  <behavior>
    The new service must:
    - Be a SEPARATE file from `cloudStorage.ts`
    - Target the new PLURAL table `personal_brand_audits` (NEVER `personal_brand_audit` singular — Pitfall C)
    - Export `create({score, dimensions, summary})` that inserts a row with the authenticated user's id
    - Be testable with a mocked supabase client (no DB roundtrip in test)

    BrandAuditTab.tsx integration:
    - Find the existing `setTimeout(async () => { ... await personalBrandApi.saveAuditAnswers(...) }, 500)` block (around line 187-203)
    - AFTER `await personalBrandApi.saveAuditAnswers(...)` resolves, add ONE additional call: `await personalBrandAuditsApi.create({ score: totalScore, dimensions: categoryScores, summary: undefined })`
    - This is fire-and-forget for UX: if the new append-only table errors, the existing upsert behavior is unaffected (catch-and-log per existing pattern)
    - Do NOT change debounce timing, do NOT change existing args to saveAuditAnswers, do NOT remove the existing call

    Test must verify:
    - `create({score, dimensions, summary})` calls `supabase.from('personal_brand_audits').insert(...)` with `{ user_id, score, dimensions, summary }`
    - When auth has no user, the function throws (consistent with existing `getCurrentUser()` pattern)
  </behavior>
  <action>
    Create `client/src/services/personalBrandAuditsApi.ts`:

    ```typescript
    /**
     * Phase 3 / DATA-02 — Personal Brand audit history (append-only).
     *
     * IMPORTANT: This targets the PLURAL table `personal_brand_audits`,
     * which is DISTINCT from the existing SINGULAR `personal_brand_audit`
     * table (used by personalBrandApi in cloudStorage.ts for the upsert flow).
     *
     * See migration: supabase/migrations/20260429_personal_brand_audits.sql
     * See research: 03-RESEARCH.md Pitfall C.
     */

    import { supabase } from '@/lib/supabase'

    export interface PersonalBrandAuditInsert {
      score: number
      dimensions: Record<string, number>
      summary?: string
    }

    export const personalBrandAuditsApi = {
      async create(input: PersonalBrandAuditInsert): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Användaren måste vara inloggad för att spara audit-historik')

        const { error } = await supabase
          .from('personal_brand_audits')           // PLURAL — new append-only table
          .insert({
            user_id: user.id,
            score: input.score,
            dimensions: input.dimensions,
            summary: input.summary ?? null,
          })

        if (error) throw error
      },

      async getLatest(): Promise<{ score: number; dimensions: Record<string, number>; summary: string | null; created_at: string } | null> {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return null

        const { data, error } = await supabase
          .from('personal_brand_audits')
          .select('score, dimensions, summary, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (error) {
          console.error('Fel vid hämtning av brand-audit-historik:', error)
          return null
        }
        return data as { score: number; dimensions: Record<string, number>; summary: string | null; created_at: string } | null
      },
    }
    ```

    Create `client/src/services/personalBrandAuditsApi.test.ts`:

    ```typescript
    import { describe, it, expect, vi, beforeEach } from 'vitest'

    const insertMock = vi.fn()
    const getUserMock = vi.fn()

    vi.mock('@/lib/supabase', () => ({
      supabase: {
        auth: { getUser: () => getUserMock() },
        from: () => ({ insert: (...args: unknown[]) => insertMock(...args) }),
      },
    }))

    describe('personalBrandAuditsApi.create (DATA-02)', () => {
      beforeEach(() => {
        insertMock.mockReset()
        getUserMock.mockReset()
        insertMock.mockResolvedValue({ error: null })
      })

      it('inserts row with user_id, score, dimensions, summary', async () => {
        getUserMock.mockResolvedValue({ data: { user: { id: 'user-123' } } })
        const { personalBrandAuditsApi } = await import('./personalBrandAuditsApi')
        await personalBrandAuditsApi.create({
          score: 78.5,
          dimensions: { online: 80, content: 70, network: 75, consistency: 82 },
          summary: 'Stark online-närvaro',
        })
        expect(insertMock).toHaveBeenCalledTimes(1)
        const payload = insertMock.mock.calls[0][0]
        expect(payload).toMatchObject({
          user_id: 'user-123',
          score: 78.5,
          dimensions: { online: 80, content: 70, network: 75, consistency: 82 },
          summary: 'Stark online-närvaro',
        })
      })

      it('throws when no authenticated user', async () => {
        getUserMock.mockResolvedValue({ data: { user: null } })
        const { personalBrandAuditsApi } = await import('./personalBrandAuditsApi')
        await expect(personalBrandAuditsApi.create({ score: 50, dimensions: {} })).rejects.toThrow(/inloggad/)
      })
    })
    ```

    Modify `client/src/pages/personal-brand/BrandAuditTab.tsx`:

    1. Add import at top of file (alongside other imports):
       ```typescript
       import { personalBrandAuditsApi } from '@/services/personalBrandAuditsApi'
       ```

    2. In the existing useEffect at line 187-203, INSIDE the `try` block, AFTER the existing `await personalBrandApi.saveAuditAnswers(...)` line, add:
       ```typescript
       // Phase 3 / DATA-02 — append audit history row (separate from upsert above)
       try {
         await personalBrandAuditsApi.create({
           score: totalScore,
           dimensions: categoryScores,
           summary: undefined,
         })
       } catch (auditError) {
         console.error('Phase 3 DATA-02 audit-history append failed (non-blocking):', auditError)
       }
       ```

    The inner try/catch isolates the new failure path from the existing upsert — if the append fails, existing behavior (upsert + UI state) is unaffected. The existing outer try/finally handles `setIsSaving(true/false)` correctly.

    Do NOT modify any other lines in BrandAuditTab.tsx. Do NOT remove the existing personalBrandApi.saveAuditAnswers call.

    Run tests:
    ```bash
    cd client && npm run test:run -- src/services/personalBrandAuditsApi.test.ts
    cd client && npm run test:run
    cd client && npx tsc --noEmit
    ```
  </action>
  <verify>
    <automated>cd client && npm run test:run -- src/services/personalBrandAuditsApi.test.ts 2>&1 | grep -E "(passed|failed)" && grep -c "personalBrandAuditsApi.create" client/src/pages/personal-brand/BrandAuditTab.tsx</automated>
  </verify>
  <acceptance_criteria>
    - File `client/src/services/personalBrandAuditsApi.ts` exists
    - File contains literal `from('personal_brand_audits')` (PLURAL — verifies Pitfall C avoidance)
    - File does NOT contain `from('personal_brand_audit')` (singular — would target wrong table)
    - File exports `personalBrandAuditsApi` object with `create` and `getLatest` methods
    - File `client/src/services/personalBrandAuditsApi.test.ts` exists with 2 real tests
    - `cd client && npm run test:run -- src/services/personalBrandAuditsApi.test.ts` exits 0
    - `client/src/pages/personal-brand/BrandAuditTab.tsx` contains literal `import { personalBrandAuditsApi }`
    - File contains exactly 1 call to `personalBrandAuditsApi.create(`
    - File still contains the original `personalBrandApi.saveAuditAnswers(answers, totalScore, categoryScores)` call (verifiable: existing call is preserved)
    - `cd client && npm run test:run` exits 0 (full suite green)
    - `cd client && npx tsc --noEmit` exits 0
  </acceptance_criteria>
  <done>
    DATA-02 persistence path exists. BrandAuditTab.tsx now writes to BOTH the existing singular upsert table (unchanged behavior for the page) AND the new plural append-only table (history row per audit run). PersonalBrandWidget can read latest from `personalBrandAuditsApi.getLatest()` when wired in Phase 5 — out of scope for Phase 3 since brand widget is HUB-02.
  </done>
</task>

</tasks>

<verification>
- All 8 widgets read from JobsokDataContext
- 6 widget test files have 1–3 passing tests each (Cv, CoverLetter, Interview, JobSearch, Applications, Spontaneous)
- ApplicationsWidget A11Y-04 verified: closed segment hidden by default, "Visa avslutade (N)" toggle reveals it
- DATA-01: saveInterviewSessionWithScore implemented + tested
- DATA-02: personalBrandAuditsApi.create implemented + tested + wired into BrandAuditTab without disturbing existing upsert flow
- Pitfall A guard: zero supabase imports in widget files
- Pitfall C guard: personal_brand_audits (PLURAL) only — singular table untouched
- TypeScript: zero errors
- Full suite: green
</verification>

<success_criteria>
- HUB-01 fully satisfied: 8 widgets show real Supabase data
- DATA-01 fully satisfied: score persists via saveInterviewSessionWithScore
- DATA-02 fully satisfied: audit history appends per run
- A11Y-04 fully satisfied: closed applications hidden by default with explicit reveal
- Existing 27 routes untouched (Inviolabelt rule honored)
- BrandAuditTab existing upsert flow unchanged
</success_criteria>

<output>
After completion, create `.planning/phases/03-data-wiring-wcag/03-03-SUMMARY.md` with:
- Per-widget wiring confirmation (8 widgets, slice each reads from)
- A11Y-04 evidence (test name + file)
- DATA-01 + DATA-02 service paths and test results
- Confirmation that no existing call sites were modified beyond the BrandAuditTab one-line addition
- Pitfall A + C guards confirmed
</output>
