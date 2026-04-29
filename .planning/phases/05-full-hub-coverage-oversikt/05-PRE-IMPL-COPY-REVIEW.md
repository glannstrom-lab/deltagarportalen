# Phase 5 — PRE-Implementation Copy Review

**Generated:** 2026-04-29
**Purpose:** Pre-empathy-review artifact covering all 24 NEW Phase 5 widgets × 3 states (filled / empty / error). Reviewed by `arbetskonsulent` and `langtidsarbetssokande` agents in Tasks 2-3.
**Out of scope:** 8 Phase 3 JobsokHub widgets (already approved in 03-EMPATHY-REVIEW.md, ship-as-is 2026-04-28).

## Review Method

Each row was extracted from the actual widget source code (Phase 5 Plans 02-05). Empty-state copy MUST match what the widget renders when its data slice is null/empty. Filled-state shows the typical render path. Error-state shows the WidgetErrorBoundary fallback message (uniform across all widgets).

Heading + Body + CTA must follow Phase 2 UI-SPEC §"Empty State Copy Contract":
- Heading: question or noun phrase, never bare zero
- Body: action invitation, never "Inga data" / "0 saker"
- CTA: verb-led, present-tense, gentle ("Logga idag" not "Du måste logga")

The error-state row format is uniform across all widgets — they all wrap in `<WidgetErrorBoundary>` which renders the same fallback. We list it once per widget for completeness so empathy agents can read all 73 rows in a single sweep.

## Karriär Hub (HUB-02) — 6 widgets × 3 states = 18 rows

| Widget | State | Heading | Body | CTA | Source |
|--------|-------|---------|------|-----|--------|
| Karriärmål | filled | `{shortTerm ?? longTerm}` (22px bold, line-clamp-2) | `{preferredRoles[0]}` (12px) | "Öppna karriärplan" → /career | CareerGoalWidget.tsx:40-48,57 |
| Karriärmål | empty | "Inga aktiva mål" (13px bold) | "Sätt ditt nästa karriärmål och börja planera" | "Skapa mitt karriärmål" → /career | CareerGoalWidget.tsx:31-37,57 |
| Karriärmål | error | "Kunde inte ladda" | "Försök igen om en stund" | "Försök igen" (button) | WidgetErrorBoundary.tsx:40-52 |
| Intresseguide | filled | "Topp-match" (12px label) + dominantTypes code (13px bold) | `{recommendedOccupations[0].name}` (12px) | "Utforska vidare" → /interest-guide | InterestGuideWidget.tsx:57-69,79 |
| Intresseguide | empty | "Utforska dina intressen" (13px bold) | "Ta reda på vilka yrken som matchar dig bäst" | "Starta intresseguide" → /interest-guide | InterestGuideWidget.tsx:48-54,79 |
| Intresseguide | error | "Kunde inte ladda" | "Försök igen om en stund" | "Försök igen" (button) | WidgetErrorBoundary.tsx |
| Kompetensgap | filled | `milestoneLabel(match_percentage)` (22px bold) — "Mycket nära målet" / "Nära målet" / "Bra framsteg" / "Långt kvar — fortsätt utvecklas" | `{dream_job}` + bullet list of top-3 missing skills | "Se full analys" → /skills-gap-analysis | SkillGapWidget.tsx:7-12,58-73,84 |
| Kompetensgap | empty | "Ingen analys gjord" (13px bold) | "Ta reda på vilka kompetenser du behöver för din drömroll" | "Gör analys" → /skills-gap-analysis | SkillGapWidget.tsx:48-54,84 |
| Kompetensgap | error | "Kunde inte ladda" | "Försök igen om en stund" | "Försök igen" (button) | WidgetErrorBoundary.tsx |
| Personligt varumärke | filled | `brandLabel(score)` (22px bold) — "Starkt varumärke" / "Bra start" / "Förbättringsområden" | "Senaste audit: `{formatDate}`" | "Se varumärkesanalys" → /personal-brand | PersonalBrandWidget.tsx:7-11,59-63,74 |
| Personligt varumärke | empty | "Ditt personliga varumärke" (13px bold) | "Gör en audit och se hur starkt ditt varumärke är" | "Starta audit" → /personal-brand | PersonalBrandWidget.tsx:49-54,74 |
| Personligt varumärke | error | "Kunde inte ladda" | "Försök igen om en stund" | "Försök igen" (button) | WidgetErrorBoundary.tsx |
| Utbildning | filled | "Hitta din nästa utbildning" (13px bold) — STATIC always-rendered widget | "Sök bland tusentals kurser och utbildningar anpassade för dig" | "Utforska utbildningar" → /education | EducationWidget.tsx:32-37,46 |
| Utbildning | empty | (Same as filled — widget is static-content; identical render) | (same) | (same) | EducationWidget.tsx |
| Utbildning | error | "Kunde inte ladda" | "Försök igen om en stund" | "Försök igen" (button) | WidgetErrorBoundary.tsx |
| LinkedIn | filled | "Profil ansluten" (13px bold) | `{truncateUrl(linkedinUrl)}` (12px, max 40 chars) | "Optimera din profil" → /linkedin-optimizer | LinkedInWidget.tsx:46-50,68 |
| LinkedIn | empty | "Koppla LinkedIn" (13px bold) | "Lägg till din LinkedIn-URL och optimera din profil" | "Lägg till LinkedIn" → /profile | LinkedInWidget.tsx:36-42,61 |
| LinkedIn | error | "Kunde inte ladda" | "Försök igen om en stund" | "Försök igen" (button) | WidgetErrorBoundary.tsx |

## Resurser Hub (HUB-03) — 6 widgets × 3 states = 18 rows

| Widget | State | Heading | Body | CTA | Source |
|--------|-------|---------|------|-----|--------|
| Mina dokument | filled | `{cv ? 'CV' : 'Inget CV'} + {coverLetters.length} brev klara` (22px bold) | "Senast uppdaterad: `{formatDate}`" (M/L only) | "Hantera dokument" → /soka-jobb | MyDocumentsWidget.tsx:48-55,65 |
| Mina dokument | empty | "Inga dokument ännu" (13px bold) | "Skapa ditt CV och dina personliga brev" | "Gå till Söka jobb" → /soka-jobb | MyDocumentsWidget.tsx:38-43,65 |
| Mina dokument | error | "Kunde inte ladda" | "Försök igen om en stund" | "Försök igen" (button) | WidgetErrorBoundary.tsx |
| Kunskapsbanken | filled | `{completedCount} {artikel läst | artiklar lästa}` (22px bold) | "Senast: `{truncate(article_id)} ({formatDate})`" | "Fortsätt läsa" → /knowledge-base | KnowledgeBaseWidget.tsx:65-73,83 |
| Kunskapsbanken | empty | "Utforska kunskapsbanken" (13px bold) | "Läs guider och tips för en mer effektiv jobbsökning" | "Bläddra i kunskapsbanken" → /knowledge-base | KnowledgeBaseWidget.tsx:55-60,83 |
| Kunskapsbanken | error | "Kunde inte ladda" | "Försök igen om en stund" | "Försök igen" (button) | WidgetErrorBoundary.tsx |
| Externa resurser | filled | "3 utvalda externa länkar" (13px bold) — STATIC widget | List of 3 links: Arbetsförmedlingen, Jobtech Atlas, Karriärguiden | (no Footer CTA — links are inline) | ExternalResourcesWidget.tsx:36-53 |
| Externa resurser | empty | (Same as filled — static widget always renders 3 links) | (same) | (same) | ExternalResourcesWidget.tsx |
| Externa resurser | error | "Kunde inte ladda" | "Försök igen om en stund" | "Försök igen" (button) | WidgetErrorBoundary.tsx |
| Utskriftsmaterial | filled | "3 mallar att skriva ut" (13px bold) — STATIC widget | List: CV-mall, Personligt brev-mall, Intervjuförberedelse | (no Footer — download links inline) | PrintResourcesWidget.tsx:37-53 |
| Utskriftsmaterial | empty | (Same as filled — static widget) | (same) | (same) | PrintResourcesWidget.tsx |
| Utskriftsmaterial | error | "Kunde inte ladda" | "Försök igen om en stund" | "Försök igen" (button) | WidgetErrorBoundary.tsx |
| AI-team | filled | "Senast: `{agentName(agent_id)}`" (22px bold) — Karriärcoach / Studievägledare / Motivationscoach / etc. | `{count} pågående samtal` | "Fortsätt samtal" → /ai-team | AITeamWidget.tsx:62-67,77 |
| AI-team | empty | "Ditt AI-team väntar" (13px bold) | "Chatta med din karriärcoach, studievägledare eller motivationscoach" | "Möt ditt AI-team" → /ai-team | AITeamWidget.tsx:52-57,77 |
| AI-team | error | "Kunde inte ladda" | "Försök igen om en stund" | "Försök igen" (button) | WidgetErrorBoundary.tsx |
| Övningar | filled | "Träna och öva" (13px bold) — STATIC widget for v1.0 (per Pitfall G + 05-DB-DISCOVERY) | "Öva på intervjufärdigheter, presentationsteknik och mer" | "Se alla övningar" → /exercises | ExercisesWidget.tsx:38-42,51 |
| Övningar | empty | (Same as filled — static widget) | (same) | (same) | ExercisesWidget.tsx |
| Övningar | error | "Kunde inte ladda" | "Försök igen om en stund" | "Försök igen" (button) | WidgetErrorBoundary.tsx |

## Min Vardag Hub (HUB-04) — 5 widgets × 3 states = 15 rows

| Widget | State | Heading | Body | CTA | Source |
|--------|-------|---------|------|-----|--------|
| Hälsa | filled (streak >= 2) | "`{streak} dagar i rad`" (22px bold) | "`{recentMoodLogs.length} loggning(ar) senaste 7 dagar`" + Sparkline (decorative SVG) | "Logga idag" → /wellness | HealthWidget.tsx:80-83,97-110,119 |
| Hälsa | filled (streak < 2) | "Senast: `{toLocaleDateString(latestDate)}`" (22px bold) | (same body) | "Logga idag" → /wellness | HealthWidget.tsx:80-83,119 |
| Hälsa | empty | "Hur mår du idag?" (13px bold) | "Om du vill — logga ditt mående med ett klick" | "Logga idag" → /wellness | HealthWidget.tsx:50-55,64 |
| Hälsa | error | "Kunde inte ladda" | "Försök igen om en stund" | "Försök igen" (button) | WidgetErrorBoundary.tsx |
| Dagbok | filled | "`{count} inlägg`" (22px bold — singular and plural both render "inlägg") | "Senast: `{formatDate(latest.created_at)}`" (M/L only) | "Öppna dagbok" → /diary | DiaryWidget.tsx:52-58,69 |
| Dagbok | empty | "Inga anteckningar ännu" (13px bold) | "Börja din dagbok — skriv fritt om din jobbsökning" | "Skriv idag" → /diary | DiaryWidget.tsx:42-47,69 |
| Dagbok | error | "Kunde inte ladda" | "Försök igen om en stund" | "Försök igen" (button) | WidgetErrorBoundary.tsx |
| Kalender | filled | `{events[0].title}` (22px bold) | `<time>{formatEventLine(date,time)}</time>` + up to 2 more events listed (M/L) | "Öppna kalender" → /calendar | CalendarWidget.tsx:65-85,95 |
| Kalender | empty | "Inga kommande möten" (13px bold) | "Lägg till intervjuer, möten och deadlines i din kalender" | "Lägg till händelse" → /calendar | CalendarWidget.tsx:55-60,95 |
| Kalender | error | "Kunde inte ladda" | "Försök igen om en stund" | "Försök igen" (button) | WidgetErrorBoundary.tsx |
| Nätverk | filled | `milestoneLabel(count)` (22px bold) — "Bra nätverk" / "Bygger nätverk" / "Första kontakter" | "`{count} {kontakt|kontakter}`" | "Öppna nätverk" → /nätverk | NetworkWidget.tsx:16-21,58-63,73 |
| Nätverk | empty | "Bygg ditt nätverk" (13px bold) | "Lägg till kontakter från ditt yrkesnätverk" | "Lägg till kontakt" → /nätverk | NetworkWidget.tsx:48-53,73 |
| Nätverk | error | "Kunde inte ladda" | "Försök igen om en stund" | "Försök igen" (button) | WidgetErrorBoundary.tsx |
| Min konsulent | filled (with meeting) | `{displayName}` (22px bold, with optional avatar 32×32) | "Nästa möte: `<time>{formatDate}</time>`" | "Öppna konsulentvy" → /my-consultant | ConsultantWidget.tsx:91-104,118 |
| Min konsulent | filled (no meeting) | `{displayName}` (22px bold) | "Inget möte inplanerat" | "Öppna konsulentvy" → /my-consultant | ConsultantWidget.tsx:91-93,106-108,118 |
| Min konsulent | empty | "Ingen konsulent ännu" (13px bold) | "Kontakta arbetsförmedlingen för att komma igång med coachning" | "Mer om konsulentcoachning" → /my-consultant | ConsultantWidget.tsx:45-50,59 |
| Min konsulent | error | "Kunde inte ladda" | "Försök igen om en stund" | "Försök igen" (button) | WidgetErrorBoundary.tsx |

## Översikt Hub (HUB-05) — 7 widgets × 3 states (+ Onboarding sub-states) = 22 rows

| Widget | State | Heading | Body | CTA | Source |
|--------|-------|---------|------|-----|--------|
| OnboardingXL | new-user | "Välkommen till din portal" (22px bold) | "Utforska dina hubbar och kom igång med din jobbsökning" + 4 quick-link chips | (no Footer in new-user — chips serve as CTAs: "Söka jobb →", "Karriär →", "Resurser →", "Min Vardag →") | OnboardingWidget.tsx:88-105 |
| OnboardingXL | returning-user (no apps) | "Bra jobbat `{firstName}`!" (22px bold) | "Du har inte sökt något jobb än. Vill du börja idag?" | "Öppna Söka jobb →" → /jobb | OnboardingWidget.tsx:40-45,109-123 |
| OnboardingXL | returning-user (no diary) | "Bra jobbat `{firstName}`!" (22px bold) | "Reflektera över din vecka i dagboken — om du vill" | "Öppna Min Vardag →" → /min-vardag | OnboardingWidget.tsx:46-52,109-123 |
| OnboardingXL | returning-user (default) | "Bra jobbat `{firstName}`!" (22px bold) | "Fortsätt med dina mål" | "Öppna Karriär →" → /karriar | OnboardingWidget.tsx:53-58,109-123 |
| OnboardingXL | error | "Kunde inte ladda" | "Försök igen om en stund" | "Försök igen" (button) | WidgetErrorBoundary.tsx |
| Söka jobb-summary | filled | "`{totalApps} aktiva ansökningar`" (22px bold) | (no body) | "Öppna Söka jobb →" → /jobb | JobsokSummaryWidget.tsx:55-58,67 |
| Söka jobb-summary | empty | "Inga ansökningar än" (13px bold) | "Inga ansökningar än — börja söka idag" | "Öppna Söka jobb →" → /jobb | JobsokSummaryWidget.tsx:46-51,67 |
| Söka jobb-summary | error | "Kunde inte ladda" | "Försök igen om en stund" | "Försök igen" (button) | WidgetErrorBoundary.tsx |
| CV-status-summary | filled | "CV uppdaterat" (22px bold) | `{formatDate(cv.updated_at)}` | "Öppna CV →" → /cv | CvStatusSummaryWidget.tsx:43-48,67 |
| CV-status-summary | empty | "Inget CV" (13px bold) | "Kom igång med ditt första CV" | "Öppna CV →" → /cv | CvStatusSummaryWidget.tsx:52-57,67 |
| CV-status-summary | error | "Kunde inte ladda" | "Försök igen om en stund" | "Försök igen" (button) | WidgetErrorBoundary.tsx |
| Intervju-summary | filled | `qualitativeLabel(latestScore)` (22px bold) — "Stark prestation" / "Bra framsteg" / "Bygger upp" / "Tid för övning" | (no body) | "Öppna Intervju →" → /interview-simulator | InterviewSummaryWidget.tsx:16-22,62-65,75 |
| Intervju-summary | empty | "Tid för övning" (13px bold) | "Träna på vanliga frågor när du är redo" | "Öppna Intervju →" → /interview-simulator | InterviewSummaryWidget.tsx:53-58,75 |
| Intervju-summary | error | "Kunde inte ladda" | "Försök igen om en stund" | "Försök igen" (button) | WidgetErrorBoundary.tsx |
| Karriärmål-summary | filled | `{truncated shortTerm}` (22px bold, max 50 chars + …) | (no body) | "Öppna Karriärmål →" → /career | CareerGoalSummaryWidget.tsx:48-52,69 |
| Karriärmål-summary | empty | "Inget mål satt" (13px bold) | "Sätt ditt nästa karriärmål när du är redo" | "Öppna Karriärmål →" → /career | CareerGoalSummaryWidget.tsx:54-60,69 |
| Karriärmål-summary | error | "Kunde inte ladda" | "Försök igen om en stund" | "Försök igen" (button) | WidgetErrorBoundary.tsx |
| Hälsa-summary | filled | "Loggat `{streak}` `{dag|dagar}`" (22px bold) | (no body) | "Öppna Hälsa →" → /wellness | HealthSummaryWidget.tsx:58-60,70 |
| Hälsa-summary | empty | "Logga ditt mående" (13px bold) | "Om du vill — börja med ett klick" | "Öppna Hälsa →" → /wellness | HealthSummaryWidget.tsx:49-54,70 |
| Hälsa-summary | error | "Kunde inte ladda" | "Försök igen om en stund" | "Försök igen" (button) | WidgetErrorBoundary.tsx |
| Dagbok-summary | filled | "`{count} inlägg`" (22px bold) | (no body) | "Öppna Dagbok →" → /diary | DiarySummaryWidget.tsx:53-55,65 |
| Dagbok-summary | empty | "Skriv idag" (13px bold) | "Reflektera fritt om din vecka" | "Öppna Dagbok →" → /diary | DiarySummaryWidget.tsx:43-48,65 |
| Dagbok-summary | error | "Kunde inte ladda" | "Försök igen om en stund" | "Försök igen" (button) | WidgetErrorBoundary.tsx |

## Bare-Zero Audit

Grep across all Phase 5 widget files (24 source files, run 2026-04-29):

```bash
grep -rE '(Inga data|Ingen data|Du har 0|Tomt)' client/src/components/widgets/*.tsx
grep -rE '(0 av|0%)' client/src/components/widgets/*.tsx
```

Forbidden-string counts:
- "Inga data": 0
- "Ingen data": 0
- "0 av": 0
- "0%": 0
- "Du har 0": 0
- "Tomt": 0

**TOTAL: 0 violations.** HUB-06 contract satisfied — no bare-zero framing in any Phase 5 widget source.

(Decorative numbers like "5 dagar i rad", "12 inlägg", "3 mallar att skriva ut" are explicitly OK — those are positive milestone framing per UI-SPEC §"Empty State Copy Contract".)

## Open Questions for Empathy Review

The executor noticed the following copy patterns that may merit agent attention. These are NOT defects — they are choices the agents should evaluate against the empathy contract.

1. **OnboardingWidget returning-user state** — Body text "Du har inte sökt något jobb än. Vill du börja idag?" is direct and personal. Does it read as inviting (per pickNextStep design intent) or as an implicit accusation that the user has been inactive? Verdict requested.
2. **JobsokSummaryWidget empty state** — Body repeats the heading: "Inga ansökningar än" (heading) → "Inga ansökningar än — börja söka idag" (body). The repetition is intentional (heading is short for S-size, body adds CTA hint). Verdict on whether redundancy reads natural or robotic.
3. **DiaryWidget filled state primary KPI** — "1 inlägg" / "12 inlägg" — uses "inlägg" for both singular and plural (Swedish grammar accepts both, "inlägg" is uninflected). Verdict on whether "1 inlägg, 2 inlägg, 12 inlägg" feels OK or whether it should differentiate (e.g., "1 anteckning" / "2 inlägg").
4. **NetworkWidget filled state body** — "1 kontakt" vs "2 kontakter" — the milestone label drives primary KPI ("Första kontakter"), but the secondary count "1 kontakt" is exposed in 12px text. Acceptable per anti-shaming (label is primary, count is secondary), but verdict requested.
5. **AITeamWidget filled state** — "Senast: Karriärcoach" reads naturally if user remembers their last conversation, but "Karriärcoach" has no temporal context. Verdict on whether to add a relative date ("Senast: Karriärcoach (igår)") for future v1.1.
6. **ConsultantWidget filled (no meeting) body** — "Inget möte inplanerat" — borders on a bare-zero pattern but is grammatically about an event, not a count. Verdict on whether this triggers the same anxiety as "0 möten" or whether the wording is sufficiently soft.
7. **CareerGoalSummaryWidget empty state** — "Inget mål satt" (passive voice, no agent). Verdict on whether passive voice reduces shame ("the goal is not set" vs "you have not set a goal") or feels evasive.
8. **HealthSummaryWidget empty state body** — "Om du vill — börja med ett klick" — explicit anti-pressure framing (matches Hälsa widget contract). Verdict on whether the em-dash phrasing reads naturally on small screens.

These questions are non-blocking — agents should answer them in their verdicts but absence of answers does NOT count as BLOCK.

## Out of Scope

Phase 3 JobsokHub widgets (CvWidget, CoverLetterWidget, InterviewWidget, JobSearchWidget, ApplicationsWidget, SpontaneousWidget, SalaryWidget, InternationalWidget) — already approved in `.planning/phases/03-data-wiring-wcag/03-EMPATHY-REVIEW.md` (2026-04-28, ship-as-is, 0 BLOCKs, 4 FLAGs deferred to v1.1). No re-review needed — those copy strings have not been modified in Phase 5.

## Cross-Widget Framing Rules Carried Forward From Phase 3

Same rules as Phase 3 — locked, not under review:

| Rule | Applies to | Status |
|------|-----------|--------|
| No raw % as primary KPI (A11Y-03) | All widgets | LOCKED — verified by anti-shaming.test.tsx |
| Empty state action-oriented (no bare zero, no "Inga data") | All widgets | LOCKED — verified by bare-zero grep above |
| Encouraging verbs: "Skapa", "Lägg till", "Logga", "Öppna" | All CTAs | Per UI-SPEC — agents review tone |
| Milestone-style labels not raw scores | SkillGap, PersonalBrand, Network, Health (streak), InterviewSummary | LOCKED — qualitative-label functions in widget code |
| 44×44px min touch target on CTAs | All Footer CTAs | LOCKED — `min-h-[44px]` class in every CTA |

## What Agents Should Review

For each widget × state combination above, both `arbetskonsulent` and `langtidsarbetssokande` should answer:

1. **Tone** — Does this read as supportive, neutral, or stressful for a long-term-unemployed user with low self-efficacy?
2. **Concrete action** — Is the next step obvious to someone with cognitive fatigue / NPF?
3. **Implicit shaming** — Does any element imply the user is "behind", "incomplete", "lacking"?
4. **Empty state** — If this is empty, does it feel inviting (PASS), neutral (FLAG), or like an accusation (BLOCK)?
5. **Verdict** — PASS / FLAG / BLOCK per state.

Tasks 2 and 3 capture verdicts in `05-EMPATHY-REVIEW.md`.

---

*Pre-implementation review artifact generated 2026-04-29 (Phase 5 Plan 06 Task 1). 73 widget×state rows extracted from actual widget code at HEAD `dae702d`. Bare-zero audit: PASS (0 violations).*
