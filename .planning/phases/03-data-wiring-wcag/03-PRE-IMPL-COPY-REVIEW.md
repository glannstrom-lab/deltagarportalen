# Phase 3 — Pre-Implementation Copy Review (Step 1 of A11Y-05 empathy gate)

**Generated:** 2026-04-28
**Phase:** 3 (Data Wiring + WCAG)
**Reviewers (Plan 05):** `arbetskonsulent`, `langtidsarbetssokande`
**Source of truth:** widget code in `client/src/components/widgets/*.tsx` after Plan 03 wiring

This artifact captures the exact text strings each widget renders in three states (filled / empty / error). Plan 05's empathy-review agents read this file BEFORE looking at screenshots — copy issues caught here are easier to fix than after live data renders.

Reference: `.planning/phases/02-static-widget-grid/02-UI-SPEC.md` Empty State Copy Contract.

---

## Per-Widget Rendered Copy

### 1. CvWidget (Söka jobb / Skapa & öva)

Widget title (h3): "CV"

| State | Heading / Primary element | Body text | Primary CTA | Secondary CTA |
|-------|--------------------------|-----------|-------------|---------------|
| Filled (cv.completion_pct=75) | ProgressRing (decorative "75%" label inside ring SVG) + milestone label: "Nästan klart — 1 sektion kvar" | "Senast redigerad: {cv.updated_at}" | "Fortsätt redigera" | "Förhandsgranska" (L-size only) |
| Filled (cv.completion_pct=85) | ProgressRing + milestone label: "Klar att skickas" | "Senast redigerad: {cv.updated_at}" | "Fortsätt redigera" | "Förhandsgranska" |
| Filled (cv.completion_pct=40) | ProgressRing + milestone label: "Bra start — fortsätt fylla i" | "Senast redigerad: {cv.updated_at}" | "Fortsätt redigera" | "Förhandsgranska" |
| Filled (cv.completion_pct=15) | ProgressRing + milestone label: "Kom igång med ditt CV" | "Senast redigerad: {cv.updated_at}" | "Fortsätt redigera" | "Förhandsgranska" |
| Empty (cv=null) | "Ditt CV väntar" | "Skapa ditt CV och kom igång med din jobbsökning" | "Skapa CV" | — |
| Error (boundary) | "Kunde inte ladda" | "Försök igen om en stund" | "Försök igen" (link) | — |

**Milestone label thresholds (from `milestoneLabel()` function):**
- pct >= 80 → "Klar att skickas"
- pct >= 60 → "Nästan klart — 1 sektion kvar"
- pct >= 30 → "Bra start — fortsätt fylla i"
- pct < 30  → "Kom igång med ditt CV"

**A11Y-03 note:** The "75%" text is inside the ProgressRing SVG as a decorative annotation — it is NOT in the primary KPI typography slot (not `text-[32px]` or `text-[22px]` bold). The milestone label IS the primary framing. The anti-shaming guard test confirms this.

---

### 2. CoverLetterWidget (Söka jobb / Skapa & öva)

Widget title (h3): "Personligt brev"

| State | Primary KPI element | Body text | Primary CTA | Secondary CTA |
|-------|---------------------|-----------|-------------|---------------|
| Filled (coverLetters.length=3) | "3" (text-[32px] font-bold) + label "utkast" | "Senast: {coverLetters[0].title}" | "+ Generera nytt brev" | "Visa alla →" (L-size only) |
| Filled (coverLetters.length=1) | "1" (text-[32px] font-bold) + label "utkast" | "Senast: {coverLetters[0].title ?? 'utkast'}" | "+ Generera nytt brev" | "Visa alla →" |
| Empty (coverLetters=[]) | "Inga brev ännu" (13px bold heading) | "Generera ett anpassat brev till din nästa ansökan" | "+ Generera brev" | — |
| Error (boundary) | "Kunde inte ladda" | "Försök igen om en stund" | "Försök igen" (link) | — |

**A11Y-03 note:** Primary KPI is the count ("3") — no percent sign. Compliant.

---

### 3. InterviewWidget (Söka jobb / Skapa & öva)

Widget title (h3): "Intervjuträning"

| State | Primary KPI element | Sub-label | Body text | Primary CTA | Notes |
|-------|---------------------|-----------|-----------|-------------|-------|
| Filled (sessions=[{score:84}]) | "84" (text-[22px] font-bold) + "/ 100" | "senaste poäng" | "{N} övningar totalt" + Sparkline (if >=2 valid scores) | "Starta ny session" | DATA-01 |
| Filled (sessions=[{score:null}]) | "—" (text-[22px] font-bold) | "senaste poäng" (no "/ 100" suffix when score null) | "{N} övningar totalt" | "Starta ny session" | Nullable score per DATA-01 |
| Empty (sessions=[]) | "Redo att öva?" (13px bold heading) | — | "Träna på vanliga intervjufrågor med direkt feedback" | "Starta din första session" | — |
| Error (boundary) | "Kunde inte ladda" | — | "Försök igen om en stund" | "Försök igen" (link) | — |

**A11Y-03 note:** Score shown as "84 / 100" — no percent sign. Per UI-SPEC, this is explicitly allowed as motivating progress framing (not shaming). Compliant.

**Body text note:** The widget renders `{sessions.length} övningar totalt` (singular "övning" when length=1). The UI-SPEC mock said "3 övningar denna vecka" — the wired code counts all sessions, not just this week. Agent should flag if "totalt" vs "denna vecka" matters for user motivation.

---

### 4. JobSearchWidget (Söka jobb / Sök & ansök)

Widget title (h3): "Sök jobb"

| State | Primary KPI element | Sub-label | Primary CTA |
|-------|---------------------|-----------|-------------|
| Filled (byStatus.saved=4) | "4" (text-[32px] font-bold) | "sparade sökningar" | "Visa alla 4 träffar" |
| Filled (byStatus.saved=12) | "12" (text-[32px] font-bold) | "sparade sökningar" | "Visa alla 12 träffar" |
| Empty (byStatus.saved=0 or undefined) | "Inga sparade sökningar" (13px bold heading) | — | "Gå till jobbsökning" |
| Error (boundary) | "Kunde inte ladda" | — | "Försök igen om en stund" + "Försök igen" (link) |

**Phase 3 data mapping note:** In Phase 3, `byStatus['saved']` count is used as the "new today" KPI (live job-match computation is Phase 5). The label "sparade sökningar" is displayed, not "nya träffar idag" from the UI-SPEC mock. Agent should evaluate whether "sparade sökningar" framing is user-motivating or confusing compared to the intended "nya träffar" framing.

**A11Y-03 note:** No percent sign in KPI. Match cards are not rendered in Phase 3 (no live match data). Qualitative labels enforced via TypeScript union in Phase 2 code — guard test covers this.

---

### 5. ApplicationsWidget (Söka jobb / Sök & ansök)

Widget title (h3): "Mina ansökningar"

| State | Primary KPI element | StackedBar visible segments | Alert chip | Toggle | Primary CTA |
|-------|---------------------|----------------------------|------------|--------|-------------|
| Filled (total=12, showClosed=false) | "12" (text-[32px] font-bold) + "totalt" | aktiva (4), svar inväntas (2), intervju (1) — "avslutade" HIDDEN | "1 ansökan väntar på ditt svar" (amber) | "Visa avslutade (5)" button visible | "Visa pipeline →" |
| Filled-with-toggle-clicked (showClosed=true) | "12" + "totalt" | aktiva (4), svar inväntas (2), intervju (1), avslutade (5, de-emphasized stone-300) | "1 ansökan väntar på ditt svar" (amber) | Toggle button gone | "Visa pipeline →" |
| Empty (total=0) | "Inga ansökningar ännu" (13px bold heading) | — | — | — | "Lägg till ansökan" |
| Error (boundary) | "Kunde inte ladda" | — | — | — | "Försök igen" (link) |

**A11Y-04 evidence:** `showClosed` defaults to `false` — the "avslutade" segment is hidden until user explicitly reveals it. The button text "Visa avslutade ({closedCount})" gives the count only when triggered by user intent. This is the A11Y-04 closed-applications-hidden-by-default rule.

**Alert chip framing:** Uses `byStatus['pending_response']` count. Text: "{N} ansökan väntar på ditt svar". Agent should evaluate whether "väntar på ditt svar" is action-motivating or pressure-inducing for someone with cognitive fatigue.

---

### 6. SpontaneousWidget (Söka jobb / Sök & ansök)

Widget title (h3): "Spontanansökan"

| State | Primary KPI element | Sub-label | CTA |
|-------|---------------------|-----------|-----|
| Filled (spontaneousCount=5) | "5" (text-[22px] font-bold) | "företag i pipeline" | "Lägg till →" (link-style, M/L only) |
| Filled (spontaneousCount=1) | "1" (text-[22px] font-bold) | "företag i pipeline" | "Lägg till →" |
| Empty (spontaneousCount=0) | "Inget i pipeline" (13px bold heading) | — | "+ Lägg till företag" |
| Error (boundary) | "Kunde inte ladda" | — | "Försök igen" (link) |

**A11Y-03 note:** KPI is a count ("5") — no percent sign. Compliant.

**Empty state note:** "Inget i pipeline" avoids the phrase "0 företag" (bare zero rule). The UI-SPEC alternative was "Inga i pipeline" — the wired code uses "Inget" (neuter). Agent should check if "Inget" vs "Inga" reads more naturally in context.

---

### 7. SalaryWidget (Söka jobb / Marknad)

Widget title (h3): "Lön & marknad"

| State | Primary KPI element | Body | Notes |
|-------|---------------------|------|-------|
| Filled (salary.median=52000) | "52 000" (text-[22px] font-bold) + "kr/mån" label | RangeBar (low–median–high) + "{salary.roleLabel}" | Phase 5 — salary_data table not yet provisioned |
| Empty (salary=null or undefined) | "Vad är din lön värd?" (13px bold heading) | "Ange din roll för att se marknadslönen" | Default in Phase 3 (salary_data absent) |
| Error (boundary) | "Kunde inte ladda" | "Försök igen om en stund" | — |

**Phase 3 note:** The salary_data table is absent from the live DB (confirmed in Plan 01). SalaryWidget always renders the empty state in Phase 3. The filled branch exists in code for Phase 5 wiring. The salary KPI format uses Swedish locale: `salary.median.toLocaleString('sv-SE')` → "52 000" (space as thousands separator).

**A11Y-03 note:** KPI is a salary figure ("52 000") — no percent sign. Compliant.

---

### 8. InternationalWidget (Söka jobb / Marknad)

Widget title (h3): "Internationellt"

| State | Primary KPI element | Body | CTA |
|-------|---------------------|------|-----|
| Filled (intl.countries.length>0) | "{N}" (text-[22px] font-bold) + "länder i fokus" | — | "Utforska möjligheter →" (M/L only) |
| Empty (intl=null/undefined or countries=[]) | "Arbetar du mot utlandsjobb?" (13px bold heading) | "Hitta jobb och företag i andra länder" (M/L only) | "Utforska möjligheter →" (M/L only) |
| Error (boundary) | "Kunde inte ladda" | "Försök igen om en stund" | "Försök igen" (link) |

**Phase 3 note:** The international_targets table is absent from the live DB. InternationalWidget always renders the empty state in Phase 3 (same as Phase 2 behavior). The filled branch exists in code for Phase 5.

**Empty state framing:** Question-form heading "Arbetar du mot utlandsjobb?" avoids a bare zero and instead invites the user into the feature. This is the UI-SPEC Empty State Copy Contract pattern for this widget.

---

## Cross-Widget Framing Rules (UI-SPEC carry-forward — do not change in agent review)

| Rule | Applies to | Status |
|------|-----------|--------|
| No raw % as primary KPI (A11Y-03) | All widgets | LOCKED — verified by anti-shaming.test.tsx |
| Closed applications hidden by default (A11Y-04) | ApplicationsWidget | LOCKED — verified by ApplicationsWidget.test.tsx |
| Match labels qualitative only | JobSearchWidget | LOCKED — TypeScript union type enforces at compile time |
| Empty state action-oriented (no bare zero, no "Inga data") | All widgets | Per UI-SPEC — agents review tone |
| Encouraging verbs: "Fortsätt", "Skapa", "+ Lägg till" | All CTAs | Per UI-SPEC — agents review |
| "Nästan klart" not "75% klart" | CvWidget milestone label | LOCKED — milestoneLabel() function |
| Score as "84 / 100" not "84%" | InterviewWidget | LOCKED — per UI-SPEC explicit allowance |

---

## What Agents Should Review (Plan 05 input prompt)

For each widget × state combination above, both `arbetskonsulent` and `langtidsarbetssokande` should answer:

1. **Tone** — Does this read as supportive, neutral, or stressful for a long-term-unemployed user with low self-efficacy?
2. **Concrete action** — Is the next step obvious to someone with cognitive fatigue / NPF?
3. **Implicit shaming** — Does any element imply the user is "behind", "incomplete", "lacking"?
4. **Empty state** — If this is empty, does it feel inviting (PASS), neutral (FLAG), or like an accusation (BLOCK)?
5. **Verdict** — PASS / FLAG / BLOCK per state.

**Additional open questions for agent review:**

- JobSearchWidget: "sparade sökningar" (Phase 3 KPI) vs intended "nya träffar idag" (Phase 5 KPI) — is the current label confusing?
- InterviewWidget: "{N} övningar totalt" vs UI-SPEC "{N} övningar denna vecka" — is "totalt" motivating or discouraging when count is low?
- ApplicationsWidget amber chip: "1 ansökan väntar på ditt svar" — does "väntar på ditt svar" create anxiety for a user with cognitive load?
- SpontaneousWidget: "Inget i pipeline" (neuter) vs "Inga i pipeline" — which reads more naturally in Swedish?

Plan 05 will feed this entire file PLUS screenshots to the agents and capture their verdicts in `03-EMPATHY-REVIEW.md`.

---

*Pre-implementation review artifact generated 2026-04-28 (Phase 3 Plan 04). Step 2 (post-implementation screenshot review) lands in Plan 05.*
