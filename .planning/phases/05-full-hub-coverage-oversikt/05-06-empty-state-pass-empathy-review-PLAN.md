---
phase: 05-full-hub-coverage-oversikt
plan: 06
type: execute
wave: 6
depends_on: [05-05-oversikt-hub-PLAN]
files_modified:
  - .planning/phases/05-full-hub-coverage-oversikt/05-PRE-IMPL-COPY-REVIEW.md
  - .planning/phases/05-full-hub-coverage-oversikt/05-EMPATHY-REVIEW.md
  - .planning/phases/05-full-hub-coverage-oversikt/05-VALIDATION.md
autonomous: false
requirements: [HUB-06]
must_haves:
  truths:
    - "05-PRE-IMPL-COPY-REVIEW.md is generated, contains a markdown table covering all 24 NEW Phase 5 widgets in 3 states each (filled / empty / error) — minimum 70 rows of widget × state combinations"
    - "Both arbetskonsulent and langtidsarbetssokande agents have rendered a verdict (PASS / FLAG / BLOCK) for each row in the artifact"
    - "If any agent returned BLOCK, exactly one revision pass has been applied (per CONTEXT.md iteration budget — escalate at second revision)"
    - "BLOCK verdicts are RESOLVED before sign-off; FLAG verdicts are deferred to v1.1 backlog (documented in 05-EMPATHY-REVIEW.md)"
    - "05-EMPATHY-REVIEW.md contains both agents' APPROVED sign-off line with date and commit SHA"
    - "05-VALIDATION.md frontmatter is updated to nyquist_compliant: true and wave_0_complete: true once both sign-offs land"
    - "No widget empty-state contains the strings 'Inga data', '0 saker', '0%', or any other bare-zero framing — verified via grep across all Phase 5 widget source files"
  artifacts:
    - path: ".planning/phases/05-full-hub-coverage-oversikt/05-PRE-IMPL-COPY-REVIEW.md"
      provides: "Empathy-review artifact — table of all 24 widgets × 3 states + locked copy strings"
      contains: "| Widget | State | Heading | Body | CTA |"
    - path: ".planning/phases/05-full-hub-coverage-oversikt/05-EMPATHY-REVIEW.md"
      provides: "HUB-06 sign-off artifact — read by gsd-verifier as Phase 5 ship gate"
      contains: "arbetskonsulent: APPROVED"
    - path: ".planning/phases/05-full-hub-coverage-oversikt/05-VALIDATION.md"
      provides: "Phase-level validation status — flips to nyquist_compliant: true on sign-off"
      contains: "nyquist_compliant: true"
  key_links:
    - from: ".planning/phases/05-full-hub-coverage-oversikt/05-EMPATHY-REVIEW.md"
      to: ".planning/phases/05-full-hub-coverage-oversikt/05-PRE-IMPL-COPY-REVIEW.md"
      via: "agents review the PRE-IMPL artifact"
      pattern: "05-PRE-IMPL-COPY-REVIEW"
    - from: ".planning/phases/05-full-hub-coverage-oversikt/05-VALIDATION.md"
      to: "nyquist_compliant + wave_0_complete frontmatter flags"
      via: "frontmatter flip on sign-off"
      pattern: "nyquist_compliant: true"
---

<objective>
Close Phase 5 with the HUB-06 empty-state-final-pass and empati-review-ship-gate. This is the formal Phase 5 ship gate — the only requirement that requires subjective domain-agent judgment, not a test assertion. Phase 5 cannot ship until both `arbetskonsulent` and `langtidsarbetssokande` agents return APPROVED on the full 24-widget × 3-state copy artifact.

Purpose: Phase 3's empathy review locked copy for the 8 JobsokHub widgets. Phase 5 added 24 more widgets across 4 hubs. HUB-06 demands every empty-state across all 32 widgets is action-oriented — no "Inga data", no bare zeros, no shaming framing. This plan extends the Phase 3 PRE-IMPL artifact to cover the 24 new widgets and runs both agents on the full set.

Output: 05-PRE-IMPL-COPY-REVIEW.md with 70+ widget×state rows, 05-EMPATHY-REVIEW.md with both agents' APPROVED sign-off, 05-VALIDATION.md frontmatter flipped to `nyquist_compliant: true`. Optional revision commits if BLOCK verdicts arise.
</objective>

<execution_context>
@C:/Users/Mikael/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/Mikael/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@CLAUDE.md
@.planning/STATE.md
@.planning/REQUIREMENTS.md
@.planning/phases/05-full-hub-coverage-oversikt/05-CONTEXT.md
@.planning/phases/05-full-hub-coverage-oversikt/05-RESEARCH.md
@.planning/phases/05-full-hub-coverage-oversikt/05-VALIDATION.md
@.planning/phases/05-full-hub-coverage-oversikt/05-02-karriar-hub-SUMMARY.md
@.planning/phases/05-full-hub-coverage-oversikt/05-03-resurser-hub-SUMMARY.md
@.planning/phases/05-full-hub-coverage-oversikt/05-04-min-vardag-hub-SUMMARY.md
@.planning/phases/05-full-hub-coverage-oversikt/05-05-oversikt-hub-SUMMARY.md
@.planning/phases/03-data-wiring-wcag/03-PRE-IMPL-COPY-REVIEW.md
@.planning/phases/03-data-wiring-wcag/03-EMPATHY-REVIEW.md
@.planning/phases/03-data-wiring-wcag/03-05-empathy-review-ship-gate-PLAN.md
@.planning/phases/02-static-widget-grid/02-UI-SPEC.md
@.claude/agents/arbetskonsulent.md
@.claude/agents/langtidsarbetssokande.md

<interfaces>
<!-- Empati-review process is identical to Phase 3 Plan 05 (proven workflow). -->
<!-- Iteration budget (LOCKED in 05-CONTEXT.md): 1 review + max 1 revision pass per agent. -->
<!-- If a 2nd revision is needed → ESCALATE to Mikael (do not run autonomously). -->
<!-- BLOCKs stop the phase; FLAGs are deferred to v1.1 backlog. -->

<!-- Agent invocation pattern (from CLAUDE.md and Phase 3 Plan 05 SUMMARY): -->
<!--   Use the Task tool with subagent_type: 'arbetskonsulent' or 'langtidsarbetssokande' if available, -->
<!--   OR surface the artifact + prompt to Mikael for manual run if subagent invocation is unavailable. -->

<!-- Phase 3's 03-PRE-IMPL-COPY-REVIEW.md covered 12 widget×state rows (8 widgets × ~1.5 states). -->
<!-- Phase 5 must cover ALL 24 NEW widgets × 3 states = 72+ rows. Phase 3 widgets are out of scope. -->

<!-- The 24 new widgets to review (per 05-RESEARCH.md §HUB-06 Empty-State Pass): -->
| # | Widget id          | Hub        | Source file |
|---|--------------------|------------|-------------|
| 1 | karriar-mal        | Karriär    | CareerGoalWidget.tsx |
| 2 | intresseguide      | Karriär    | InterestGuideWidget.tsx |
| 3 | kompetensgap       | Karriär    | SkillGapWidget.tsx |
| 4 | personligt-varumarke | Karriär  | PersonalBrandWidget.tsx |
| 5 | utbildning         | Karriär    | EducationWidget.tsx |
| 6 | linkedin           | Karriär    | LinkedInWidget.tsx |
| 7 | mina-dokument      | Resurser   | MyDocumentsWidget.tsx |
| 8 | kunskapsbanken     | Resurser   | KnowledgeBaseWidget.tsx |
| 9 | externa-resurser   | Resurser   | ExternalResourcesWidget.tsx |
|10 | utskriftsmaterial  | Resurser   | PrintResourcesWidget.tsx |
|11 | ai-team            | Resurser   | AITeamWidget.tsx |
|12 | ovningar           | Resurser   | ExercisesWidget.tsx |
|13 | halsa              | Min Vardag | HealthWidget.tsx |
|14 | dagbok             | Min Vardag | DiaryWidget.tsx |
|15 | kalender           | Min Vardag | CalendarWidget.tsx |
|16 | natverk            | Min Vardag | NetworkWidget.tsx |
|17 | min-konsulent      | Min Vardag | ConsultantWidget.tsx |
|18 | onboarding-xl      | Översikt   | OnboardingWidget.tsx (TWO sub-states: new vs returning) |
|19 | jobsok-summary     | Översikt   | JobsokSummaryWidget.tsx |
|20 | cv-status-summary  | Översikt   | CvStatusSummaryWidget.tsx |
|21 | interview-summary  | Översikt   | InterviewSummaryWidget.tsx |
|22 | karriar-mal-summary| Översikt   | CareerGoalSummaryWidget.tsx |
|23 | halsa-summary      | Översikt   | HealthSummaryWidget.tsx |
|24 | dagbok-summary     | Översikt   | DiarySummaryWidget.tsx |

<!-- Per-widget × per-state row format (target structure for 05-PRE-IMPL-COPY-REVIEW.md): -->
<!-- | Widget | State | Heading | Body | CTA | Source | -->
<!-- | Karriärmål | filled | shortTerm goal | preferredRoles[0] | "Öppna karriärplan →" | CareerGoalWidget.tsx | -->
<!-- | Karriärmål | empty | "Inga aktiva mål" | "Sätt ditt nästa karriärmål och börja planera" | "Skapa mitt karriärmål" | CareerGoalWidget.tsx | -->
<!-- | Karriärmål | error | "Kunde inte ladda" | "Försök ladda om sidan" | "Försök igen" | WidgetErrorBoundary.tsx | -->

<!-- Phase 3's 03-EMPATHY-REVIEW.md sign-off format (template for 05-EMPATHY-REVIEW.md): -->
<!--   ## arbetskonsulent — APPROVED 2026-04-29 (commit {SHA}) -->
<!--   ## langtidsarbetssokande — APPROVED 2026-04-29 (commit {SHA}) -->
<!--   plus FLAG/BLOCK details if any. -->

<!-- Phase 3 Plan 05 documented an alternate "ship-as-is" auto-decision: -->
<!--   "0 BLOCKs from both empathy agents; 4 FLAGs (copy refinements) deferred to v1.1 backlog" -->
<!-- This is the precedent: BLOCKs = revision; FLAGs = backlog. -->

<!-- Why autonomous=false: Plan 06 invokes domain agents whose verdict is subjective. -->
<!-- Even if the Task tool can spawn agents autonomously, Mikael may want to review their output -->
<!-- before flipping nyquist_compliant. The non-autonomous flag enables a checkpoint after agents return. -->

<!-- Bare-zero ban (HUB-06 acceptance — empty-state copy contract): -->
<!-- Forbidden strings (grep guard against widget source): -->
<!--   "Inga data", "Ingen data", "0 av", "0%", "Du har 0", "Tomt" -->
<!-- The grep guard is enforceable as a check in Task 1. -->
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Generate 05-PRE-IMPL-COPY-REVIEW.md from actual widget source files</name>
  <read_first>
    - All 24 widget source files (paths in <interfaces> table)
    - .planning/phases/03-data-wiring-wcag/03-PRE-IMPL-COPY-REVIEW.md (template structure)
    - .planning/phases/05-full-hub-coverage-oversikt/05-RESEARCH.md §"HUB-06: Empty-State Pass — Komplett Widget-Lista"
    - .planning/phases/02-static-widget-grid/02-UI-SPEC.md §"Empty State Copy Contract"
    - client/src/components/widgets/WidgetErrorBoundary.tsx (error-state copy source)
  </read_first>
  <files>.planning/phases/05-full-hub-coverage-oversikt/05-PRE-IMPL-COPY-REVIEW.md</files>
  <action>
    Create `.planning/phases/05-full-hub-coverage-oversikt/05-PRE-IMPL-COPY-REVIEW.md` — the empathy-review input artifact.

    Structure (markdown):

    ```markdown
    # Phase 5 — PRE-Implementation Copy Review

    **Generated:** {ISO date}
    **Purpose:** Pre-empathy-review artifact covering all 24 NEW Phase 5 widgets × 3 states (filled / empty / error). Reviewed by `arbetskonsulent` and `langtidsarbetssokande` agents in Tasks 2-3.
    **Out of scope:** 8 Phase 3 JobsokHub widgets (already approved in 03-EMPATHY-REVIEW.md).

    ## Review Method

    Each row was extracted from the actual widget source code (Phase 5 Plans 02-05). Empty-state copy MUST match what the widget renders when its data slice is null/empty. Filled-state shows the typical render path. Error-state shows the WidgetErrorBoundary fallback message.

    Heading + Body + CTA must follow Phase 2 UI-SPEC §"Empty State Copy Contract":
    - Heading: question or noun phrase, never bare zero
    - Body: action invitation, never "Inga data" / "0 saker"
    - CTA: verb-led, present-tense, gentle ("Logga idag" not "Du måste logga")

    ## Karriär Hub (HUB-02)

    | Widget | State | Heading | Body | CTA | Source |
    |--------|-------|---------|------|-----|--------|
    | Karriärmål | filled | {extract from CareerGoalWidget.tsx filled branch} | ... | ... | CareerGoalWidget.tsx |
    | Karriärmål | empty | "Inga aktiva mål" | "Sätt ditt nästa karriärmål och börja planera" | "Skapa mitt karriärmål" | CareerGoalWidget.tsx |
    | Karriärmål | error | "Kunde inte ladda" | "Försök ladda om sidan" | "Försök igen" | WidgetErrorBoundary.tsx |
    ... (5 more Karriär widgets × 3 states)

    ## Resurser Hub (HUB-03)
    | ... 6 widgets × 3 states |

    ## Min Vardag Hub (HUB-04)
    | ... 5 widgets × 3 states |

    ## Översikt Hub (HUB-05)
    | OnboardingXL | new-user | "Välkommen till din portal" | "Utforska dina hubbar och kom igång med din jobbsökning" | "Söka jobb → Karriär → Resurser → Min Vardag →" | OnboardingWidget.tsx |
    | OnboardingXL | returning-user | "Bra jobbat {firstName}!" | {deterministic next-step} | {contextual link} | OnboardingWidget.tsx |
    | OnboardingXL | error | ... | ... | ... | WidgetErrorBoundary.tsx |
    | ... 6 cross-hub summary widgets × 3 states |

    ## Bare-Zero Audit

    Grep across all Phase 5 widget files (24 source files):
    - "Inga data": {result count}
    - "Ingen data": {result count}
    - "0 av": {result count}
    - "0%": {result count}
    - "Du har 0": {result count}
    - "Tomt": {result count}

    All counts MUST be 0 for HUB-06 acceptance. (Decorative numbers like "5 dagar i rad" or "12 inlägg" are OK — those are positive milestone framing.)

    ## Open Questions for Empathy Review

    {Any rows with copy that the executor noticed could be improved — flagged for agent attention. Default: empty.}

    ## Out of Scope

    Phase 3 JobsokHub widgets (8) already approved in 03-EMPATHY-REVIEW.md (2026-04-28, ship-as-is). No re-review needed.
    ```

    Process:
    1. For each of the 24 widgets, open the source file and extract the heading/body/CTA strings literally as they appear in the JSX (after the `isEmpty` branch for empty-state, before for filled, and from WidgetErrorBoundary.tsx for error).
    2. Populate the markdown table — 24 widgets × 3 states + OnboardingWidget extra row (new vs returning sub-states) = 73 rows minimum.
    3. Run the bare-zero grep and report counts in the audit section: `grep -rE '(Inga data|Ingen data|Du har 0|Tomt)' client/src/components/widgets/*.tsx`
    4. If grep finds matches: STOP — fix the widget code first (those strings violate HUB-06 contract), then regenerate this artifact. Bare zeros are forbidden by spec.

    The PRE-IMPL artifact is the input to Tasks 2-3. Quality of empathy review depends on this artifact's fidelity to actual widget code.
  </action>
  <verify>
    <automated>test -f .planning/phases/05-full-hub-coverage-oversikt/05-PRE-IMPL-COPY-REVIEW.md && grep -cE '^\| ' .planning/phases/05-full-hub-coverage-oversikt/05-PRE-IMPL-COPY-REVIEW.md | awk '$1 >= 70 { exit 0 } { exit 1 }' && ! grep -rE '(Inga data|Ingen data|Du har 0|Tomt)' client/src/components/widgets/*.tsx</automated>
  </verify>
  <done>
    - 05-PRE-IMPL-COPY-REVIEW.md exists
    - Contains at least 70 widget×state rows (24 widgets × 3 states + Onboarding sub-states)
    - Each row extracted from actual widget source — heading/body/CTA literal strings
    - Bare-zero audit completed — all forbidden-string counts are 0
    - Out-of-scope section notes the 8 Phase 3 widgets already approved
  </done>
</task>

<task type="auto">
  <name>Task 2: Run arbetskonsulent agent — produce verdicts for all 24 widget × state combinations</name>
  <read_first>
    - .planning/phases/05-full-hub-coverage-oversikt/05-PRE-IMPL-COPY-REVIEW.md (Task 1 output — input to this agent)
    - .claude/agents/arbetskonsulent.md (agent definition)
    - .planning/phases/03-data-wiring-wcag/03-EMPATHY-REVIEW.md (Phase 3 sign-off format reference)
  </read_first>
  <files>.planning/phases/05-full-hub-coverage-oversikt/05-EMPATHY-REVIEW.md</files>
  <action>
    Invoke the `arbetskonsulent` agent on `05-PRE-IMPL-COPY-REVIEW.md`. Capture verdicts in `05-EMPATHY-REVIEW.md` (creating the file if it does not yet exist).

    **Invocation method (try in order):**
    1. Use the Task tool with `subagent_type: 'arbetskonsulent'` if available in the executor environment
    2. If subagent invocation is unavailable, surface the artifact + prompt to Mikael for manual run

    **Prompt template:**
    > Granska detta empati-artefakt för Phase 5 widgets (`.planning/phases/05-full-hub-coverage-oversikt/05-PRE-IMPL-COPY-REVIEW.md`). Returnera PASS / FLAG / BLOCK per rad i tabellen. Fokus: arbetsmarknadsperspektiv, deltagarnytta, om copy stöttar utsatt målgrupp. För BLOCK-verdict, ange specifikt vad som måste ändras. För FLAG, ange förbättring som kan deferras till v1.1.

    **Capture verdict in `05-EMPATHY-REVIEW.md`** (create the file with this initial structure if absent, then append the arbetskonsulent section):

    ```markdown
    # Phase 5 — Empathy Review

    **Reviewed artifact:** 05-PRE-IMPL-COPY-REVIEW.md
    **Review date:** {ISO}
    **Commit SHA reviewed:** {git rev-parse HEAD}

    ## arbetskonsulent — {APPROVED | NEEDS REVISION | BLOCKED}

    Date: {ISO}
    Verdict summary: {N PASS, M FLAG, K BLOCK}

    ### BLOCK verdicts (must resolve before ship)
    | Widget | State | Issue | Suggested fix |
    |--------|-------|-------|---------------|
    | ... | ... | ... | ... |

    ### FLAG verdicts (deferred to v1.1)
    | Widget | State | Suggestion |
    |--------|-------|------------|
    | ... | ... | ... |

    ### PASS rows
    {Just count or summary — no need to list each row}

    ## langtidsarbetssokande — {pending — see Task 3}

    ## Final sign-off

    - [ ] arbetskonsulent: APPROVED  ({date}, commit {SHA})
    - [ ] langtidsarbetssokande: APPROVED  ({date}, commit {SHA})
    ```

    If the agent returns BLOCK verdicts:
    - Document them under "BLOCK verdicts" with widget/state/issue/fix
    - Do NOT immediately apply fixes here — Task 4 handles revision pass
    - Final-sign-off checkbox stays unchecked

    If only FLAG/PASS verdicts (no BLOCK):
    - Check the arbetskonsulent checkbox at bottom
    - Note "APPROVED" in the section header

    Per CONTEXT.md iteration budget: this is the first review pass. Task 4 handles the optional revision pass if Task 5's later signal requires it.
  </action>
  <verify>
    <automated>test -f .planning/phases/05-full-hub-coverage-oversikt/05-EMPATHY-REVIEW.md && grep -E '^## arbetskonsulent' .planning/phases/05-full-hub-coverage-oversikt/05-EMPATHY-REVIEW.md</automated>
  </verify>
  <done>
    - 05-EMPATHY-REVIEW.md exists with `## arbetskonsulent` section
    - Section contains verdict summary (PASS/FLAG/BLOCK counts)
    - BLOCK verdicts (if any) documented in markdown table
    - FLAG verdicts (if any) documented in markdown table
    - Final sign-off line for arbetskonsulent shows current status (checked if APPROVED, unchecked if revision needed)
  </done>
</task>

<task type="auto">
  <name>Task 3: Run langtidsarbetssokande agent — produce verdicts for all 24 widget × state combinations</name>
  <read_first>
    - .planning/phases/05-full-hub-coverage-oversikt/05-PRE-IMPL-COPY-REVIEW.md
    - .planning/phases/05-full-hub-coverage-oversikt/05-EMPATHY-REVIEW.md (Task 2 output — append to this file)
    - .claude/agents/langtidsarbetssokande.md (agent definition)
  </read_first>
  <files>.planning/phases/05-full-hub-coverage-oversikt/05-EMPATHY-REVIEW.md</files>
  <action>
    Invoke the `langtidsarbetssokande` agent on the SAME PRE-IMPL artifact. Append verdicts to the existing `05-EMPATHY-REVIEW.md` (Task 2 created it).

    **Invocation method (try in order):**
    1. Task tool with `subagent_type: 'langtidsarbetssokande'`
    2. Surface artifact + prompt to Mikael for manual run

    **Prompt template:**
    > Granska detta empati-artefakt (`.planning/phases/05-full-hub-coverage-oversikt/05-PRE-IMPL-COPY-REVIEW.md`) ur en långtidsarbetslös användares perspektiv. PASS / FLAG / BLOCK per rad. Fokus: undvika skam, undvika press, energianpassning, om copy är genomförbar för någon med låg energi. Specifikt: kontrollera att Hälsa-widgeten i Min Vardag har "Om du vill"-framing och INTE pressar.

    **Update `05-EMPATHY-REVIEW.md`** — replace the placeholder `## langtidsarbetssokande — {pending}` section with the actual verdict:

    ```markdown
    ## langtidsarbetssokande — {APPROVED | NEEDS REVISION | BLOCKED}

    Date: {ISO}
    Verdict summary: {N PASS, M FLAG, K BLOCK}

    ### BLOCK verdicts
    | Widget | State | Issue | Suggested fix |
    | ... |

    ### FLAG verdicts
    | Widget | State | Suggestion |
    | ... |
    ```

    Update the `Final sign-off` checkbox accordingly:
    - If APPROVED: check the langtidsarbetssokande checkbox
    - If BLOCKED: leave unchecked

    After Task 3 completes, both agent sections exist in 05-EMPATHY-REVIEW.md.
  </action>
  <verify>
    <automated>grep -E '^## langtidsarbetssokande' .planning/phases/05-full-hub-coverage-oversikt/05-EMPATHY-REVIEW.md && grep -E '^## arbetskonsulent' .planning/phases/05-full-hub-coverage-oversikt/05-EMPATHY-REVIEW.md</automated>
  </verify>
  <done>
    - 05-EMPATHY-REVIEW.md contains both `## arbetskonsulent` and `## langtidsarbetssokande` sections
    - Both sections have verdict summary + tables for any BLOCK/FLAG rows
    - Final sign-off checkboxes reflect current state
  </done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 4: Mikael decides — apply revision pass OR sign off as-is</name>
  <files>.planning/phases/05-full-hub-coverage-oversikt/05-EMPATHY-REVIEW.md (revision pass updates if BLOCKs exist)</files>
  <action>
    Checkpoint task — Mikael adjudicates whether the empathy verdicts (Tasks 2-3 output) require a revision pass before final sign-off, or whether the current state ships as-is.

    Decision flow:

    1. **Read `05-EMPATHY-REVIEW.md`.** Count BLOCK verdicts per agent.

    2. **If both agents have ZERO BLOCK verdicts:**
       - Phase 5 is APPROVED. Both checkboxes already checked from Tasks 2-3.
       - Skip to Task 5 (final sign-off).
       - Resume signal: `"approved"`

    3. **If one or more BLOCK verdicts exist:**
       - This is the FIRST revision pass (allowed per iteration budget — locked in 05-CONTEXT.md).
       - For each BLOCK row: update the corresponding widget source file copy as suggested by the agent.
       - Re-run anti-shaming guard: `cd client && npm run test:run -- src/components/widgets/__tests__/anti-shaming.test.tsx` — must stay green.
       - Re-run hub-page integration tests: `cd client && npm run test:run -- src/pages/hubs/__tests__/` — must stay green.
       - Update 05-PRE-IMPL-COPY-REVIEW.md to reflect the new copy strings.
       - Re-invoke BOTH agents on the updated artifact (this is the revision pass — exactly once).
       - Append the second-pass verdicts to 05-EMPATHY-REVIEW.md as a new section "## Second pass ({date})".
       - If second pass STILL has BLOCKs → ESCALATE to Mikael (do NOT run a third pass autonomously). Resume signal: `"escalate"`.
       - If second pass clean → resume signal: `"approved"`.

    4. **FLAG verdicts** are NOT BLOCKers. Document them in 05-EMPATHY-REVIEW.md "v1.1 backlog" section. They do not affect ship-gate.

    5. **Resume signals (one of):**
       - `"approved"` — both agents APPROVED (either first-pass clean or after one revision); ready for Task 5
       - `"escalate"` — second-pass still has BLOCKs; Mikael adjudicates manually
       - `"flagged-only"` — no BLOCKs but FLAGs documented; equivalent to "approved" for ship-gate purposes (Task 5 still proceeds)

    Resume signal is a literal user reply on the checkpoint prompt: type "approved" / "escalate" / "flagged-only".
  </action>
  <verify>
    <automated>grep -cE "^- \\[x\\] (arbetskonsulent|langtidsarbetssokande): APPROVED" .planning/phases/05-full-hub-coverage-oversikt/05-EMPATHY-REVIEW.md | awk '$1 == 2 { exit 0 } { exit 1 }'</automated>
  </verify>
  <done>
    - 05-EMPATHY-REVIEW.md "Final sign-off" section has BOTH agent checkboxes ticked `[x]`
    - Zero outstanding BLOCK verdicts (verifiable by reading the BLOCK tables — empty or marked "Resolved")
    - If revision pass was applied: anti-shaming + hub-page tests still green after copy changes
    - Mikael resumed with "approved" or "flagged-only"
  </done>
</task>

<task type="auto">
  <name>Task 5: Flip 05-VALIDATION.md to nyquist_compliant: true and finalize phase</name>
  <read_first>
    - .planning/phases/05-full-hub-coverage-oversikt/05-VALIDATION.md (current frontmatter — see lines 1-9)
    - .planning/phases/05-full-hub-coverage-oversikt/05-EMPATHY-REVIEW.md (Task 4 output — must show both agents APPROVED)
  </read_first>
  <files>.planning/phases/05-full-hub-coverage-oversikt/05-VALIDATION.md</files>
  <action>
    After Task 4's checkpoint resumes "approved" or "flagged-only", update 05-VALIDATION.md frontmatter:

    Current frontmatter (top of file, lines 1-9):
    ```yaml
    ---
    phase: 5
    slug: full-hub-coverage-oversikt
    status: draft
    nyquist_compliant: false
    wave_0_complete: false
    created: 2026-04-29
    ---
    ```

    Replace with:
    ```yaml
    ---
    phase: 5
    slug: full-hub-coverage-oversikt
    status: complete
    nyquist_compliant: true
    wave_0_complete: true
    created: 2026-04-29
    completed: {ISO date}
    ---
    ```

    At the bottom of 05-VALIDATION.md, append a "Sign-Off" section:
    ```markdown
    ---

    ## Sign-Off ({ISO date})

    **HUB-06 ship gate:** CLOSED.

    - 05-PRE-IMPL-COPY-REVIEW.md: 70+ widget×state rows extracted from actual widget code; bare-zero audit returned 0 violations
    - 05-EMPATHY-REVIEW.md: arbetskonsulent APPROVED ({date}); langtidsarbetssokande APPROVED ({date})
    - {N} BLOCK verdicts → resolved with revision pass (see EMPATHY-REVIEW for details). 0 outstanding BLOCKs
    - {M} FLAG verdicts → deferred to v1.1 backlog (see EMPATHY-REVIEW for list)

    All Phase 5 acceptance criteria met:
    - HUB-02: Karriär hub renders 6 widgets with real Supabase data ✓
    - HUB-03: Resurser hub renders 6 widgets with real Supabase data ✓
    - HUB-04: Min Vardag hub renders 5 widgets with real Supabase data ✓
    - HUB-05: Översikt renders XL onboarding + 6 cross-hub summary ✓
    - HUB-06: All widget empty-states action-oriented, no bare zeros ✓ (this artifact)

    Phase 5 ready for `/gsd:verify-work`.
    ```

    Commit message: `docs(05-06): close HUB-06 ship gate — empathy review APPROVED`

    Mikael's overnight policy (per memory `feedback_overnight_runs`): commit but do NOT push.
  </action>
  <verify>
    <automated>grep -E '^nyquist_compliant: true$' .planning/phases/05-full-hub-coverage-oversikt/05-VALIDATION.md && grep -E '^wave_0_complete: true$' .planning/phases/05-full-hub-coverage-oversikt/05-VALIDATION.md && grep -E 'arbetskonsulent.*APPROVED' .planning/phases/05-full-hub-coverage-oversikt/05-EMPATHY-REVIEW.md && grep -E 'langtidsarbetssokande.*APPROVED' .planning/phases/05-full-hub-coverage-oversikt/05-EMPATHY-REVIEW.md</automated>
  </verify>
  <done>
    - 05-VALIDATION.md frontmatter `nyquist_compliant: true` and `wave_0_complete: true`
    - 05-VALIDATION.md status changed from `draft` to `complete`, `completed:` date appended
    - Sign-Off section appended documenting BLOCK/FLAG counts + Phase 5 acceptance summary
    - 05-EMPATHY-REVIEW.md contains both agent APPROVED lines (verifiable via grep)
    - Phase 5 ship gate closed; ready for `/gsd:verify-work`
  </done>
</task>

</tasks>

<verification>
- `test -f .planning/phases/05-full-hub-coverage-oversikt/05-PRE-IMPL-COPY-REVIEW.md` — exists
- `test -f .planning/phases/05-full-hub-coverage-oversikt/05-EMPATHY-REVIEW.md` — exists
- `grep -cE '^\| ' .planning/phases/05-full-hub-coverage-oversikt/05-PRE-IMPL-COPY-REVIEW.md` — at least 70 table rows
- `grep -E 'APPROVED' .planning/phases/05-full-hub-coverage-oversikt/05-EMPATHY-REVIEW.md` — at least 2 lines
- `grep -E 'nyquist_compliant: true' .planning/phases/05-full-hub-coverage-oversikt/05-VALIDATION.md` — match
- `grep -rE '(Inga data|Ingen data|Du har 0|Tomt)' client/src/components/widgets/*.tsx` — 0 matches (HUB-06 acceptance)
</verification>

<success_criteria>
- HUB-06 fulfilled: every Phase 5 widget empty-state has action-oriented copy verified by both empathy agents
- 05-PRE-IMPL-COPY-REVIEW.md is the locked source of truth for Phase 5 copy
- 05-EMPATHY-REVIEW.md APPROVED by both arbetskonsulent and langtidsarbetssokande
- 05-VALIDATION.md frontmatter `nyquist_compliant: true` flipped — gsd-verifier accepts Phase 5 as complete
- Iteration budget honored: max 1 revision per agent; escalation rule applied if needed
- Phase 5 ship gate CLOSED — ready for `/gsd:verify-work` and v1.0 ship
</success_criteria>

<output>
Create `.planning/phases/05-full-hub-coverage-oversikt/05-06-empty-state-pass-empathy-review-SUMMARY.md` documenting: (a) PRE-IMPL artifact stats (rows, widgets covered), (b) bare-zero audit results, (c) per-agent verdict counts (PASS/FLAG/BLOCK), (d) revision applied (if any), (e) FLAG verdicts deferred to v1.1, (f) final sign-off date + commit SHA, (g) Phase 5 cumulative tally: 32 widgets across 5 hubs, 5 hub-summary loaders, 5 layout contexts, 5 data contexts, all CUST-01..03 reused.
</output>
