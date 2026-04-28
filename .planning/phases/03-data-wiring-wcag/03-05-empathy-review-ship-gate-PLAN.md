---
phase: 03-data-wiring-wcag
plan: 05
type: execute
wave: 5
depends_on: [03-04-wcag-hardening-PLAN]
files_modified:
  - .planning/phases/03-data-wiring-wcag/03-EMPATHY-REVIEW.md
  - .planning/phases/03-data-wiring-wcag/screenshots/
  - .planning/phases/03-data-wiring-wcag/03-VALIDATION.md
autonomous: false
requirements: [A11Y-05]
must_haves:
  truths:
    - "Each of the 8 widgets is screenshotted in three states (filled, empty, error) — 24 screenshots total — saved under 03-data-wiring-wcag/screenshots/"
    - "Both arbetskonsulent and langtidsarbetssokande agents have rendered a verdict (PASS / FLAG / BLOCK) for each widget × state combination"
    - "If any agent returned BLOCK or FLAG, exactly one revision pass has been applied (per CONTEXT.md iteration budget)"
    - "Final 03-EMPATHY-REVIEW.md contains both agents' APPROVED sign-off line with date and commit SHA"
    - "03-VALIDATION.md frontmatter is updated to nyquist_compliant: true once both sign-offs land"
  artifacts:
    - path: ".planning/phases/03-data-wiring-wcag/03-EMPATHY-REVIEW.md"
      provides: "A11Y-05 sign-off artifact (read by gsd-verifier as Phase 3 ship gate)"
      contains: "arbetskonsulent: APPROVED"
    - path: ".planning/phases/03-data-wiring-wcag/screenshots/"
      provides: "24 PNG screenshots — 8 widgets × 3 states"
  key_links:
    - from: ".planning/phases/03-data-wiring-wcag/03-EMPATHY-REVIEW.md"
      to: ".planning/phases/03-data-wiring-wcag/03-PRE-IMPL-COPY-REVIEW.md"
      via: "input artifact reference"
      pattern: "03-PRE-IMPL-COPY-REVIEW"
    - from: ".planning/phases/03-data-wiring-wcag/03-VALIDATION.md"
      to: "nyquist_compliant"
      via: "frontmatter flip"
      pattern: "nyquist_compliant: true"
---

<objective>
Execute Step 2 of the A11Y-05 empathy review (post-implementation screenshot review): capture each of the 8 widgets in 3 states (filled / empty / error), feed both the screenshots and the pre-implementation copy artifact (Plan 04 output) to the `arbetskonsulent` and `langtidsarbetssokande` agents, capture their verdicts in `03-EMPATHY-REVIEW.md`, apply at most one revision pass per agent if needed, and ship-gate Phase 3 by flipping `03-VALIDATION.md` to `nyquist_compliant: true` once both agents sign off APPROVED.

Purpose: A11Y-05 is the final ship gate. It is subjective by design — the only requirement that requires human (or human-proxy agent) judgment, not a test assertion. Phase 3 cannot ship until this gate is closed.

Output: 24 screenshots, completed empathy-review markdown with both agents' verdicts, optional revision commits if BLOCK/FLAG verdicts arose, and `nyquist_compliant: true` in 03-VALIDATION.md frontmatter.
</objective>

<execution_context>
@C:/Users/Mikael/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/Mikael/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/03-data-wiring-wcag/03-CONTEXT.md
@.planning/phases/03-data-wiring-wcag/03-RESEARCH.md
@.planning/phases/03-data-wiring-wcag/03-VALIDATION.md
@.planning/phases/03-data-wiring-wcag/03-PRE-IMPL-COPY-REVIEW.md
@.planning/phases/03-data-wiring-wcag/03-04-SUMMARY.md
@.planning/phases/02-static-widget-grid/02-UI-SPEC.md
@.claude/agents/arbetskonsulent.md
@.claude/agents/langtidsarbetssokande.md
@CLAUDE.md

<interfaces>
<!-- Iteration budget (LOCKED in CONTEXT.md): -->
<!--   1 review + max 1 revision pass per agent. -->
<!--   If a 2nd revision is needed -> escalate to Mikael (NOT autonomous). -->

<!-- Agent invocation pattern (from CLAUDE.md): -->
<!--   "Lat arbetskonsulent granska [artefakt]" or "Lat langtidsarbetssokande granska [artefakt]" -->
<!--   Agents are .claude/agents/*.md files - invoked via Task tool with subagent_type if available, -->
<!--   OR by surfacing the artifact and asking the user to run the agent manually if subagent invocation -->
<!--   is not possible from within an autonomous task. -->

<!-- Screenshot capture options (Claude's discretion - pick one and document): -->
<!--   Option A: Playwright / Puppeteer (project does not currently use these per RESEARCH.md) -->
<!--   Option B: Vitest + jsdom snapshot (text-only, not visual) -->
<!--   Option C: Manual capture via dev server + browser screenshot tool - most realistic, fits autonomy=false -->
<!-- This plan uses Option C: a checkpoint asks Mikael (or Claude with browser-use access) to capture -->
<!-- screenshots from the running dev server. The non-autonomous flag enables this. -->

<!-- Phase 3 acceptance gate is the conjunction of: -->
<!--   1. Test suite green (Plans 02 + 03 + 04 deliverables) -->
<!--   2. 03-EMPATHY-REVIEW.md APPROVED by both agents -->
<!--   3. 03-VALIDATION.md frontmatter nyquist_compliant: true -->
<!--   4. PHASE 3 SUMMARY committed -->

<!-- This plan is autonomous=false because it depends on agent invocations + manual screenshot capture. -->
</interfaces>
</context>

<tasks>

<task type="checkpoint:human-action" gate="blocking">
  <name>Task 1: Capture 24 screenshots (8 widgets x 3 states) — filled / empty / error</name>
  <what-built>
    All Plans 01–04 are complete. JobsokHub renders real Supabase data, all WCAG hardening tests are green, and 03-PRE-IMPL-COPY-REVIEW.md is ready as the agents' textual input. The remaining piece for the post-implementation review (Step 2) is visual: actual rendered screenshots of each widget x state.
  </what-built>
  <how-to-verify>
    This step requires running the dev server against a Supabase test account and capturing screenshots. Claude cannot autonomously click "screenshot" in a desktop OS — this is a genuine human-action checkpoint (or a Claude-with-browser-tool action if available).

    Steps:

    1. Start the dev server:
       `cd client && npm run dev`

    2. Open http://localhost:5173/soka-jobb in a browser (or whatever the JobsokHub URL is — verify with the route table from Phase 1).

    3. Set up THREE Supabase user accounts (or three browser sessions with different auth states):
       - Filled account: has CV, cover letters, interview sessions with scores, applications across statuses, spontaneous companies.
       - Empty account: newly created, zero of everything.
       - Error account: trigger error states by either (a) temporarily breaking the supabase client URL in .env.local, or (b) using browser DevTools to throw inside the loader's queryFn, OR (c) screenshotting the per-widget WidgetErrorBoundary fallback by intentionally throwing in one widget at a time.

    4. For each widget x each state, capture a screenshot. Save under `.planning/phases/03-data-wiring-wcag/screenshots/` with naming convention: `{widget-name}-{state}.png`
       e.g.: cv-filled.png, cv-empty.png, cv-error.png, cover-letter-filled.png, ... etc through international-error.png. Total: 24 files (8 widgets x 3 states).

    5. mkdir if needed:
       `mkdir -p .planning/phases/03-data-wiring-wcag/screenshots`

    6. After all 24 screenshots are saved, verify count:
       `ls .planning/phases/03-data-wiring-wcag/screenshots/ | wc -l`
       Expected: 24.

    7. Verify naming convention — every file matches `{widget}-{state}.png` where state in {filled, empty, error}:
       `ls .planning/phases/03-data-wiring-wcag/screenshots/ | grep -E "^(cv|cover-letter|interview|job-search|applications|spontaneous|salary|international)-(filled|empty|error)\.png$" | wc -l`
       Expected: 24.

    Type "captured" when all 24 screenshots exist and verification commands pass. If any screenshot is missing or unclear (e.g. error state could not be triggered for a particular widget), document the omission inline in the resume signal — Plan can proceed with documented gap rather than blocking forever.
  </how-to-verify>
  <resume-signal>Type "captured" or describe missing screenshots</resume-signal>
  <files>n/a — checkpoint task</files>
  <action>
    This is a human-action checkpoint. The 7-step procedure in <how-to-verify> above IS the action: Mikael (or Claude with browser-use access) starts the dev server, opens the running JobsokHub against three Supabase accounts (filled/empty/error), captures 24 screenshots, names them per the convention, and saves them under .planning/phases/03-data-wiring-wcag/screenshots/. Claude pauses until the resume signal arrives.
  </action>
  <verify>
    <automated>test -d .planning/phases/03-data-wiring-wcag/screenshots</automated>
  </verify>
  <acceptance_criteria>
    - Directory .planning/phases/03-data-wiring-wcag/screenshots/ exists
    - At least 20 of 24 screenshots present (allow up to 4 documented gaps for unreproducible error states)
    - Resume signal received from Mikael
  </acceptance_criteria>
  <done>
    All 24 screenshots (or documented gaps) are captured. Plan 05 Tasks 2-5 can now feed the visual artifacts to the empathy-review agents.
  </done>
</task>

<task type="auto">
  <name>Task 2: Run arbetskonsulent agent review — produce verdicts for all 24 widget x state combinations</name>
  <files>.planning/phases/03-data-wiring-wcag/03-EMPATHY-REVIEW.md</files>
  <read_first>
    - .planning/phases/03-data-wiring-wcag/03-PRE-IMPL-COPY-REVIEW.md (Step 1 artifact — agents read this first)
    - .planning/phases/03-data-wiring-wcag/screenshots/ (24 PNG files from Task 1 — agents review these)
    - .claude/agents/arbetskonsulent.md (agent prompt and review focus)
    - .planning/phases/02-static-widget-grid/02-UI-SPEC.md (Empty State Copy Contract + Progress Framing Rules)
    - .planning/PROJECT.md (target group definition — informs verdicts)
  </read_first>
  <action>
    Invoke the `arbetskonsulent` agent on the empathy-review material. The agent's role is documented at `.claude/agents/arbetskonsulent.md` — it focuses on Swedish labor-market context, the value of each widget for participants, and how each widget supports a job coach's work.

    Use the Task tool with `subagent_type: 'general-purpose'` (or the project's actual subagent invocation pattern — read `.claude/agents/arbetskonsulent.md` to find the correct invocation if a custom slash-command exists). If the project uses a slash command like `/agent arbetskonsulent`, invoke that command via the user surface and capture the output.

    The agent prompt MUST include this verbatim text (in Swedish, matching agent's language):

    ```
    Du granskar Phase 3 empathy review (A11Y-05 ship gate) i Deltagarportalen.

    Material du ska granska:
    1. Pre-implementation copy review: .planning/phases/03-data-wiring-wcag/03-PRE-IMPL-COPY-REVIEW.md
       (Tabell over alla 8 widgets x 3 states med exakt copy)
    2. Screenshots: .planning/phases/03-data-wiring-wcag/screenshots/ (24 PNG-filer)
    3. Designkontrakt: .planning/phases/02-static-widget-grid/02-UI-SPEC.md (Empty State + Progress framing rules)
    4. Malgrupp: .planning/PROJECT.md

    For varje widget x state (totalt 24 kombinationer), ge:
    - Verdict: PASS / FLAG / BLOCK
    - Motivering: 1-3 meningar varfor

    Skriv resultat till .planning/phases/03-data-wiring-wcag/03-EMPATHY-REVIEW.md i tabellformat.

    Anvand FLAG endast for copy-justeringar (5 minuters fix), BLOCK for struktur/innehall som maste andras innan ship.
    Iteration-budget: en review + max en revisions-pass. Vid behov av andra revision: eskalera till Mikael.
    ```

    Capture the agent's response. Append it to `.planning/phases/03-data-wiring-wcag/03-EMPATHY-REVIEW.md` in the format below. If the file does not yet exist, create it with this initial structure (use it as a template):

    ```
    # Phase 3 — Empathy Review (A11Y-05 Ship Gate)

    Phase: 3 (Data Wiring + WCAG)
    Iteration budget: 1 review + max 1 revision pass per agent (CONTEXT.md)
    Pre-implementation artifact: .planning/phases/03-data-wiring-wcag/03-PRE-IMPL-COPY-REVIEW.md
    Screenshots: .planning/phases/03-data-wiring-wcag/screenshots/ (24 PNG files)

    ---

    ## arbetskonsulent — Verdicts

    Date: {YYYY-MM-DD} (initial review)
    Reviewer: arbetskonsulent agent

    | Widget | State | Verdict | Motivering |
    |--------|-------|---------|------------|
    | CvWidget | filled | PASS / FLAG / BLOCK | ... |
    | CvWidget | empty | ... | ... |
    | CvWidget | error | ... | ... |
    | CoverLetterWidget | filled | ... | ... |
    | (... all 24 rows) |

    ### arbetskonsulent — Summary

    - PASS count: {N}
    - FLAG count: {N}
    - BLOCK count: {N}
    - Recommendations for revision pass (if any): ...

    ---

    ## langtidsarbetssokande — Verdicts

    *(Pending — Task 3)*

    ---

    ## Final Sign-Off

    *(Pending — Task 5)*
    ```

    After capturing the agent output, count FLAG/BLOCK verdicts. Note them prominently in the Summary subsection — Task 4 will decide whether a revision pass is needed.

    If the agent invocation cannot be performed autonomously (e.g. requires the user to run a slash command), this task degrades to "prepare the prompt and pause for the user to run it". In that case, write the prompt block above into `03-EMPATHY-REVIEW.md` under a "## Pending: arbetskonsulent invocation" section and return to the orchestrator with a clear instruction.
  </action>
  <verify>
    <automated>test -f .planning/phases/03-data-wiring-wcag/03-EMPATHY-REVIEW.md && grep -q "arbetskonsulent" .planning/phases/03-data-wiring-wcag/03-EMPATHY-REVIEW.md</automated>
  </verify>
  <acceptance_criteria>
    - File `.planning/phases/03-data-wiring-wcag/03-EMPATHY-REVIEW.md` exists
    - File contains literal `## arbetskonsulent`
    - File contains a verdict row for every widget x state — at least 24 rows in the arbetskonsulent table (verifiable: count `|.*PASS|.*FLAG|.*BLOCK|` table rows; should be >= 24)
    - File contains a Summary subsection with PASS/FLAG/BLOCK counts
    - File preserves an empty `## langtidsarbetssokande` section for Task 3
    - File preserves an empty `## Final Sign-Off` section for Task 5
  </acceptance_criteria>
  <done>
    arbetskonsulent has rendered verdicts for all 24 widget x state combinations. The empathy-review document has its first agent column filled.
  </done>
</task>

<task type="auto">
  <name>Task 3: Run langtidsarbetssokande agent review — produce verdicts for all 24 widget x state combinations</name>
  <files>.planning/phases/03-data-wiring-wcag/03-EMPATHY-REVIEW.md</files>
  <read_first>
    - .planning/phases/03-data-wiring-wcag/03-PRE-IMPL-COPY-REVIEW.md (same input as Task 2)
    - .planning/phases/03-data-wiring-wcag/screenshots/ (same 24 screenshots)
    - .claude/agents/langtidsarbetssokande.md (agent prompt and lens — focuses on user perspective, energy adaptation, accessibility for NPF/exhaustion)
    - .planning/research/PITFALLS.md (Pitfall 11 progress shaming + Pitfall 10 cognitive overload)
  </read_first>
  <action>
    Invoke `langtidsarbetssokande` agent on the same material. This agent's lens is the END USER — their experience as a long-term-unemployed person (potentially with NPF, exhaustion, low self-efficacy) navigating the portal.

    Use the same prompt structure as Task 2 but addressed to `langtidsarbetssokande` (verbatim Swedish):

    ```
    Du granskar Phase 3 empathy review (A11Y-05 ship gate) ur deltagarens perspektiv.

    Du ar en langtidsarbetslos person — kanske med NPF, utmattning eller lag sjalvkansla efter
    manga avslag. Ar portalen ett tryggt verktyg eller en stressfaktor?

    [same material list as Task 2]

    For varje widget x state, ge verdict + motivering med fokus pa:
    - Skuldlaggning ("lases jag som otillrackliga?")
    - Energi-anpassning ("kan jag anvanda detta aven nar jag ar trott?")
    - Tydlighet ("vad ar nasta steg, konkret?")
    - Empati i tomma states ("kallar det fram skam eller hopp?")

    Skriv resultat till samma fil under sektionen ## langtidsarbetssokande — Verdicts.
    Iteration-budget: en review + max en revisions-pass. Vid behov av andra revision: eskalera till Mikael.
    ```

    APPEND the agent output to the existing `03-EMPATHY-REVIEW.md` (do NOT overwrite the arbetskonsulent section). Update the langtidsarbetssokande section with verdicts and a Summary subsection mirroring the arbetskonsulent format.

    After this task, the file should contain:
    - Header section
    - `## arbetskonsulent — Verdicts` (filled by Task 2)
    - `## langtidsarbetssokande — Verdicts` (filled by this task)
    - `## Final Sign-Off` (still pending)

    Same fallback as Task 2: if the agent cannot be invoked autonomously, prepare the prompt and pause.
  </action>
  <verify>
    <automated>grep -q "## langtidsarbetssokande" .planning/phases/03-data-wiring-wcag/03-EMPATHY-REVIEW.md && grep -q "## arbetskonsulent" .planning/phases/03-data-wiring-wcag/03-EMPATHY-REVIEW.md</automated>
  </verify>
  <acceptance_criteria>
    - File still contains arbetskonsulent section from Task 2
    - File now contains literal `## langtidsarbetssokande`
    - langtidsarbetssokande table has at least 24 verdict rows (verifiable: count rows under that section)
    - langtidsarbetssokande Summary subsection lists PASS/FLAG/BLOCK counts
    - File preserves empty `## Final Sign-Off` section
  </acceptance_criteria>
  <done>
    Both agents have rendered initial verdicts. The empathy review has two perspectives captured: konsulent (job-coach-side value) and deltagare (end-user safety).
  </done>
</task>

<task type="checkpoint:decision" gate="blocking">
  <name>Task 4: Mikael decides — apply revision pass OR sign off as-is</name>
  <decision>
    Whether the FLAG/BLOCK verdicts from Tasks 2 and 3 require a revision pass before final sign-off, or whether the current state is acceptable to ship.
  </decision>
  <context>
    The iteration budget (CONTEXT.md) is: 1 review + max 1 revision pass per agent. If FLAG/BLOCK verdicts exist, this checkpoint decides:
    1. Apply revisions — Make the copy/UX changes the agents flagged, re-render screenshots, re-invoke the same agent for a second-pass verdict.
    2. Ship as-is — The FLAG/BLOCK verdicts are documented as known follow-ups (Phase 4 or v1.1) but Phase 3 ships with the current copy. Acceptable if no BLOCK verdicts exist (only FLAGs that are ergonomic refinements).
    3. Escalate — If a 2nd revision would be needed (i.e. agents already revised once and there is still a BLOCK), CONTEXT.md says: stop autonomous work and ask Mikael directly.

    Read 03-EMPATHY-REVIEW.md before making the decision. Count BLOCKs and FLAGs from both agents.
  </context>
  <options>
    <option id="apply-revisions">
      <name>Apply revision pass</name>
      <pros>Agents' FLAG/BLOCK feedback is incorporated. Higher confidence at ship.</pros>
      <cons>Adds 30–60 minutes of work (copy edits + re-screenshot + re-invoke). Burns the single-revision budget — no room for further iteration without escalation.</cons>
    </option>
    <option id="ship-as-is">
      <name>Ship with current verdicts (FLAGs documented as known refinements)</name>
      <pros>Faster ship. FLAGs are not blockers per CONTEXT.md definition.</pros>
      <cons>Only acceptable if zero BLOCKs exist. FLAGs become Phase 4/v1.1 backlog.</cons>
    </option>
    <option id="escalate">
      <name>Escalate to Mikael — direct human decision needed</name>
      <pros>Honors the no-3rd-revision-autonomously rule.</pros>
      <cons>Pauses the phase ship.</cons>
    </option>
  </options>
  <resume-signal>Select: apply-revisions, ship-as-is, or escalate</resume-signal>
  <files>n/a — checkpoint task</files>
  <action>
    This is a decision checkpoint. Mikael reviews 03-EMPATHY-REVIEW.md (Tasks 2 and 3 verdicts) and chooses one of the three options listed in <options>: apply-revisions, ship-as-is, or escalate. Claude pauses until the resume signal arrives. The selected option determines Task 5's branch.
  </action>
  <verify>
    <automated>echo "checkpoint:decision — resume signal required"</automated>
  </verify>
  <acceptance_criteria>
    - Mikael has selected one of: apply-revisions, ship-as-is, escalate
    - Selection is recorded in summary
    - Task 5 reads the selection and branches accordingly
  </acceptance_criteria>
  <done>
    Decision rendered. Task 5 has clear instructions for the sign-off path.
  </done>
</task>

<task type="auto">
  <name>Task 5: Apply final sign-off — both agents APPROVED line + flip 03-VALIDATION.md to nyquist_compliant: true</name>
  <files>
    .planning/phases/03-data-wiring-wcag/03-EMPATHY-REVIEW.md,
    .planning/phases/03-data-wiring-wcag/03-VALIDATION.md
  </files>
  <read_first>
    - .planning/phases/03-data-wiring-wcag/03-EMPATHY-REVIEW.md (current state — verdicts from Tasks 2 + 3, possibly revised in step 4)
    - .planning/phases/03-data-wiring-wcag/03-VALIDATION.md (frontmatter currently has nyquist_compliant: false)
  </read_first>
  <action>
    Branch on the decision from Task 4:

    **If decision was `apply-revisions`:**
    1. Identify the FLAG/BLOCK rows in 03-EMPATHY-REVIEW.md
    2. For each, either edit the widget copy directly OR document the revision in a small follow-up commit
    3. Re-screenshot the affected widget x state combinations (overwrite the corresponding PNG in `screenshots/`)
    4. Re-invoke the agent that flagged the issue with prompt: "Review only the revised widgets and update your verdict"
    5. Append a `### arbetskonsulent — Revision Pass 1` and/or `### langtidsarbetssokande — Revision Pass 1` subsection with new verdicts
    6. Verify the revision pass cleared the BLOCK verdicts (if any). FLAG -> PASS or FLAG -> BLOCK both close the iteration budget; only PASS allows sign-off.

    **If decision was `ship-as-is`:**
    Skip directly to the sign-off block below. Document the un-actioned FLAGs in a "Known Follow-ups" subsection at the bottom of 03-EMPATHY-REVIEW.md.

    **If decision was `escalate`:**
    Pause this task. Add an `## ESCALATION REQUIRED` section to 03-EMPATHY-REVIEW.md with the specific BLOCK verdicts needing human resolution. Do NOT flip nyquist_compliant. Return to orchestrator with status "blocked on Mikael".

    For the apply-revisions and ship-as-is paths, complete the sign-off:

    Append (or replace) the `## Final Sign-Off` section at the bottom of `03-EMPATHY-REVIEW.md` with EXACTLY this format (substitute real values for {placeholders}):

    ```
    ## Final Sign-Off

    arbetskonsulent: APPROVED — {YYYY-MM-DD} — commit SHA {git rev-parse HEAD}
    langtidsarbetssokande: APPROVED — {YYYY-MM-DD} — commit SHA {git rev-parse HEAD}

    A11Y-05 gate status: CLOSED (signed off by both agents)
    Iteration budget used: {0 or 1} revision passes
    Phase 3 ship gate: all WCAG 2.1 AA requirements satisfied (A11Y-01..05)
    ```

    Get the current commit SHA:
    `git rev-parse HEAD`

    Use that exact SHA in both APPROVED lines. Use today's date in YYYY-MM-DD format.

    Then update `03-VALIDATION.md` frontmatter. Find the line `nyquist_compliant: false` and change to `nyquist_compliant: true`. Also flip `wave_0_complete: false` to `wave_0_complete: true` (Wave 0 deliverables from Plan 02 + 03 + 04 are all done).

    Run the final test suite to confirm everything is green:
    `cd client && npm run test:run`

    If anything fails, do NOT flip nyquist_compliant — fix the failure first.
  </action>
  <verify>
    <automated>grep -q "arbetskonsulent: APPROVED" .planning/phases/03-data-wiring-wcag/03-EMPATHY-REVIEW.md && grep -q "langtidsarbetssokande: APPROVED" .planning/phases/03-data-wiring-wcag/03-EMPATHY-REVIEW.md && grep -q "nyquist_compliant: true" .planning/phases/03-data-wiring-wcag/03-VALIDATION.md</automated>
  </verify>
  <acceptance_criteria>
    - `.planning/phases/03-data-wiring-wcag/03-EMPATHY-REVIEW.md` contains literal `arbetskonsulent: APPROVED`
    - File contains literal `langtidsarbetssokande: APPROVED`
    - Both APPROVED lines reference the same git commit SHA (verifiable: extract the SHA and confirm `git cat-file -t {sha}` returns `commit`)
    - File contains literal `A11Y-05 gate status: CLOSED`
    - `.planning/phases/03-data-wiring-wcag/03-VALIDATION.md` frontmatter contains literal `nyquist_compliant: true` (was: false)
    - `.planning/phases/03-data-wiring-wcag/03-VALIDATION.md` frontmatter contains literal `wave_0_complete: true` (was: false)
    - `cd client && npm run test:run` exits 0
  </acceptance_criteria>
  <done>
    A11Y-05 gate is CLOSED. Phase 3 ship gate has all 6 success criteria met:
    1. Widgets show live Supabase data (HUB-01)
    2. Hub keyboard-operable (A11Y-01)
    3. Reduced-motion respected (A11Y-02)
    4. No raw % as primary KPI (A11Y-03)
    5. Closed apps hidden + empathy review signed off (A11Y-04 + A11Y-05)
    6. Interview + Personal Brand scores cloud-persisted (DATA-01 + DATA-02)
  </done>
</task>

</tasks>

<verification>
- 24 screenshots captured under `.planning/phases/03-data-wiring-wcag/screenshots/`
- arbetskonsulent verdicts captured for all 24 widget x state combinations
- langtidsarbetssokande verdicts captured for all 24 widget x state combinations
- Decision rendered (apply-revisions / ship-as-is / escalate)
- If revisions applied: re-screenshot + re-invoke agents, second-pass verdicts captured
- Final sign-off lines present in 03-EMPATHY-REVIEW.md with date + commit SHA
- 03-VALIDATION.md flipped to nyquist_compliant: true and wave_0_complete: true
- Full test suite remains green
</verification>

<success_criteria>
- A11Y-05 gate CLOSED — both agents APPROVED in 03-EMPATHY-REVIEW.md
- 03-VALIDATION.md frontmatter signals Phase 3 ready to ship
- Phase 3 has zero open BLOCK verdicts; FLAGs documented as known follow-ups for Phase 4/v1.1
- gsd-verifier can read 03-EMPATHY-REVIEW.md and confirm the gate at PHASE COMPLETE time
</success_criteria>

<output>
After completion, create `.planning/phases/03-data-wiring-wcag/03-05-SUMMARY.md` with:
- Total verdicts: PASS/FLAG/BLOCK counts per agent
- Whether revision pass was applied
- Number of screenshots captured (target: 24)
- Final sign-off date + commit SHA
- Confirmation that 03-VALIDATION.md is now nyquist_compliant: true
- List of FLAGs documented as Phase 4/v1.1 follow-ups (if any)
- Phase 3 closing notes — handoff context for Phase 4 (CUST-01..03 layout persistence)
</output>
