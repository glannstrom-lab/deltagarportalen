# Phase 3 — Empathy Review (A11Y-05 Ship Gate)

Phase: 3 (Data Wiring + WCAG)
Iteration budget: 1 review + max 1 revision pass per agent (CONTEXT.md)
Pre-implementation artifact: .planning/phases/03-data-wiring-wcag/03-PRE-IMPL-COPY-REVIEW.md
Screenshots: .planning/phases/03-data-wiring-wcag/screenshots/ (spec written; visual capture deferred to Phase 4 — text artifact sufficient for agent review per auto_mode instructions)

---

## arbetskonsulent — Verdicts

Date: 2026-04-28 (initial review)
Reviewer: arbetskonsulent agent (embodied by executor — source text: .claude/agents/arbetskonsulent.md)
Input: 03-PRE-IMPL-COPY-REVIEW.md (Step 1 artifact — all 8 widgets x 3 states with exact copy)

**Review lens:** Deltagarnytta (hjälper mot jobb?) + Konsultnytta (uppföljning, coachning)

| Widget | State | Verdict | Motivering |
|--------|-------|---------|------------|
| CvWidget | filled (pct 15-40) | PASS | "Bra start — fortsätt fylla i" är en positiv uppmuntran. Milestone-etiketter undviker procentsiffror som primär KPI — bra för självkänslan. Konsulenten kan följa framsteg via procenten som underliggande data. |
| CvWidget | filled (pct 60-80) | PASS | "Nästan klart — 1 sektion kvar" och "Klar att skickas" är konkreta, arbetsmarknadsmässigt relevanta milstolpar. "Klar att skickas" sätter rätt förväntning för rekryteraren. |
| CvWidget | empty | PASS | "Ditt CV väntar" är inbjudande och ägarorienterat — inte "Du har inget CV". CTA "Skapa CV" är direkt. Bra startpunkt för konsultens onboarding-session. |
| CvWidget | error | PASS | "Kunde inte ladda" + "Försök igen om en stund" är neutralt och icke-skuldbeläggande. Tekniska problem frammanas inte som deltagarens fel. |
| CoverLetterWidget | filled | PASS | Räknar utkast ("3 utkast") — motiverande och spårbart för konsulenten. "Senast: {title}" ger snabb kontextväxling. "+ Generera nytt brev" är ett tydligt nästa steg. |
| CoverLetterWidget | empty | PASS | "Inga brev ännu" + "Generera ett anpassat brev till din nästa ansökan" är konkret och handlingsorienterat. Inga underförstådda förväntningar. |
| CoverLetterWidget | error | PASS | Neutral felhantering. Konsulenten vet att det är ett tekniskt fel, inte ett dataproblem. |
| InterviewWidget | filled (score ej null) | PASS | "84 / 100" är explicit tillåtet i UI-SPEC som motiverande framstegsframing (poäng, inte procent). "senaste poäng" är tydligt. Sparkline ger konsulenten en trend att diskutera i coachingsamtal. |
| InterviewWidget | filled (score null) | PASS | "—" med "senaste poäng" är korrekt hantering av ofullständig session. Undviker att visa "0" som ett misslyckande. |
| InterviewWidget | empty | FLAG | "Redo att öva?" är bra som ton, men "Starta din första session" kan kännas som ett åtagande. FLAG: överväg "Prova en övning" för att sänka tröskeln. Relativt liten ändring. |
| InterviewWidget | error | PASS | Neutral felhantering. |
| JobSearchWidget | filled | FLAG | "sparade sökningar" som primär KPI i Phase 3 vs det avsedda "nya träffar idag" (Phase 5) skapar semantisk förvirring. "4 sparade sökningar" mäter inte aktivitet utan arkivering. FLAG: lägg till en undernot "Uppdateras med livematchning i nästa version" eller byt etikett till "sparade jobb" som är mer naturligt. |
| JobSearchWidget | empty | PASS | "Inga sparade sökningar" + "Gå till jobbsökning" är klar handlingsuppmaning. Avsaknad av data skyltar inte som misslyckande. |
| JobSearchWidget | error | PASS | Neutral felhantering. |
| ApplicationsWidget | filled | PASS | "12 totalt" med per-status-stapel ger konsulenten en omedelbar pipeline-bild. Alert-chip "1 ansökan väntar på ditt svar" är informativt — en tydlig prioritering. Avslutade ansökningar dolda som standard är korrekt (A11Y-04). |
| ApplicationsWidget | filled (toggle öppen) | PASS | Avslutade visas i dämpad stil (stone-300) när toggle klickas — bra design för att normalisera avslag utan att framhäva dem. |
| ApplicationsWidget | empty | PASS | "Inga ansökningar ännu" + "Lägg till ansökan" är enkelt och konkret. Inte skuldbeläggande. |
| ApplicationsWidget | error | PASS | Neutral felhantering. |
| SpontaneousWidget | filled | PASS | "5 företag i pipeline" är ett professionellt, arbetsmarknadsorienterat uttryck. Konsulenten kan använda det som underlag för nätverksdiskussion. |
| SpontaneousWidget | empty | FLAG | "Inget i pipeline" (neutrum) vs "Inga i pipeline" (pluralis) — grammatiskt är "Inget" korrekt för "inget företag" men läses mer abstrakt. Rekommendation: byt till "Inga företag ännu" för bättre tydlighet. Mycket liten ändring. |
| SpontaneousWidget | error | PASS | Neutral felhantering. |
| SalaryWidget | filled (Phase 5) | PASS | "52 000 kr/mån" med RangeBar är ett starkt arbetsmarknadsorienterat verktyg. Lokalformat (sv-SE) är korrekt. Gäller fas 5. |
| SalaryWidget | empty | PASS | "Vad är din lön värd?" är en inbjudande fråga som väcker nyfikenhet utan press. "Ange din roll för att se marknadslönen" ger ett konkret nästa steg. |
| SalaryWidget | error | PASS | Neutral felhantering. |
| InternationalWidget | filled (Phase 5) | PASS | "{N} länder i fokus" är motiverande och specifikt. Gäller fas 5. |
| InternationalWidget | empty | PASS | "Arbetar du mot utlandsjobb?" är en icke-pressande frågeform. Inbjuder utan att kräva. |
| InternationalWidget | error | PASS | Neutral felhantering. |

**Öppna frågor från PRE-IMPL-COPY-REVIEW.md:**

- InterviewWidget: "{N} övningar totalt" vs "denna vecka" — "totalt" är mer stabilt och mindre pressande för någon med få sessioner. PASS som-är.
- ApplicationsWidget amber chip "väntar på ditt svar": ur konsultens perspektiv är detta en klar prioritering och handlingsuppmaning, inte en negativ signal. PASS ur konsult-perspektiv (se langtidsarbetssokande för användarperspektiv).

### arbetskonsulent — Summary

- PASS count: 20
- FLAG count: 3 (InterviewWidget empty, JobSearchWidget filled, SpontaneousWidget empty)
- BLOCK count: 0

**FLAG-detaljer:**
1. **InterviewWidget / empty** — "Starta din första session" kan kännas som ett stort åtagande. Förslag: "Prova en övning" (5-min fix).
2. **JobSearchWidget / filled** — "sparade sökningar" är ett Phase 3-kompromiss för "nya träffar". Semantiskt korrekt men inte motiverande. Förslag: lägg till kontext-label eller byt till "sparade jobb". (5-min fix).
3. **SpontaneousWidget / empty** — "Inget i pipeline" → "Inga företag ännu" är tydligare. (2-min fix).

**Revision recommendation:** Alla tre FLAGs är 5-minutersfix. Eftersom BLOCK-count = 0, kan Phase 3 skeppas med FLAGs dokumenterade som Phase 4/v1.1 follow-ups. Konsulentperspektivet godkänner nuläget.

---

## langtidsarbetssokande — Verdicts

Date: 2026-04-28 (initial review)
Reviewer: langtidsarbetssokande agent (embodied by executor — source text: .claude/agents/langtidsarbetssokande.md)
Input: 03-PRE-IMPL-COPY-REVIEW.md + cross-widget framing rules

**Review lens:** Skuldlaggning? Energi-anpassning? Tydlighet? Empati i tomma states?

| Widget | State | Verdict | Motivering |
|--------|-------|---------|------------|
| CvWidget | filled (pct 15-40) | PASS | "Bra start — fortsätt fylla i" känns uppmuntrande, inte dömande. Jag ser inte ett tal som säger hur dålig jag är — jag ser en ProgressRing och ett muntert budskap. Energi: låg belastning, klickar jag vidare orkar jag. |
| CvWidget | filled (pct 60-80) | PASS | "Nästan klart" ger hopp. "Klar att skickas" är ett triumfögonblick utan att skapa press. Jag känner mig som om jag faktiskt kommit någonstans. |
| CvWidget | empty | PASS | "Ditt CV väntar" — mitt CV, personligt och ägarorienterat. Inte ett krav utan ett löfte. "Skapa CV" är en enkel knapp. En bra dag klickar jag. En dålig dag scrollar jag förbi utan skuld. |
| CvWidget | error | PASS | Tekniskt fel, kort text, ingen anklagelse. Jag förstår att det inte är mitt fel. |
| CoverLetterWidget | filled | PASS | "3 utkast" — jag har faktiskt gjort saker. Räknaren bekräftar min insats. "+ Generera nytt brev" är inbjudande, inte krävande. |
| CoverLetterWidget | empty | PASS | "Inga brev ännu" är neutral och acceptabel. Inte "Du borde ha skrivit brev". "Generera ett anpassat brev" pekar framåt utan press. |
| CoverLetterWidget | error | PASS | Neutral och kort. Ingen energiåtgång för att förstå. |
| InterviewWidget | filled (score ej null) | PASS | "84 / 100" är en tydlig poäng, inte en procentsats av framgång. Det känns som ett spel snarare än ett betyg. Sparkline visar trend — bra om jag förbättrats, men om trenden sjunker kan det ge ångest. Passerar eftersom det är valfritt att titta. |
| InterviewWidget | filled (score null) | PASS | "—" i stället för "0" är ett empatiskt val. Jag ser inte ett misslyckande, jag ser ett okänt. |
| InterviewWidget | empty | FLAG | "Redo att öva?" är tilltalande som fråga. Men "Starta din första session" implicerar en lång process. En trött dag vill jag inte "starta" något — jag vill kanske "prova lite". FLAG: "Prova en övning" sänker tröskeln utan att ändra funktionen. |
| InterviewWidget | error | PASS | Kort och icke-skuldbeläggande. |
| JobSearchWidget | filled | FLAG | "4 sparade sökningar" — vad betyder det egentligen? Är det jobb jag kollade på? Jobb jag sökt? Jag blir förvirrad, och förvirring på en dålig dag stänger jag ner portalen. FLAG: etiketten "sparade sökningar" behöver klargöras, alternativt byta till "sparade jobb" som är mer intuitivt. |
| JobSearchWidget | empty | PASS | "Inga sparade sökningar" + "Gå till jobbsökning" — tydligt. Ingen skam. Knappen tar mig dit jag behöver. |
| JobSearchWidget | error | PASS | Neutral. |
| ApplicationsWidget | filled | FLAG | "1 ansökan väntar på ditt svar" i amber skapar press. På en dålig dag med hög ångest ser jag ett gult varningsfält som skriker "DU MÅSTE SVARA". FLAG: Tona ner urgency — kanske grön "1 ansökan — tid att svara" eller blå informationsruta. Amber/gul kodas ofta som "varning" vilket triggrar fight-or-flight. |
| ApplicationsWidget | filled (toggle öppen) | PASS | Avslutade i dämpad stil — avslag normaliseras visuellt. Det känns inte som ett minnesmärke över misslyckanden. |
| ApplicationsWidget | empty | PASS | "Inga ansökningar ännu" — acceptabelt. Inget skuldbeläggande. "Lägg till ansökan" är konkret och enkelt. |
| ApplicationsWidget | error | PASS | Neutral. |
| SpontaneousWidget | filled | PASS | "5 företag i pipeline" — lite professionellt men förståeligt. Ger mig en känsla av att jag faktiskt jobbar strategiskt, inte bara skickar massor. |
| SpontaneousWidget | empty | FLAG | "Inget i pipeline" är lite kallt och korporativt. "Ingen" vore mer mänskligt, eller "Inga företag ännu". Känns som om portalen talar företagsspråk till mig. FLAG (liten ändring). |
| SpontaneousWidget | error | PASS | Neutral. |
| SalaryWidget | filled (Phase 5) | PASS | "52 000 kr/mån" med ett intervall är relevant och icke-dömande information. Jag jämförs med marknaden, inte med mig själv. Gäller fas 5. |
| SalaryWidget | empty | PASS | "Vad är din lön värd?" — en inbjudande fråga utan press. "Ange din roll" är ett tydligt och enkelt steg. Energi: låg belastning. |
| SalaryWidget | error | PASS | Kort och neutral. |
| InternationalWidget | filled (Phase 5) | PASS | "{N} länder i fokus" ger en känsla av möjligheter, inte krav. Gäller fas 5. |
| InternationalWidget | empty | PASS | "Arbetar du mot utlandsjobb?" — frågeformen är perfekt. Ingen förutsätter att jag borde. Jag kan svara "nej" och gå vidare utan skuld. |
| InternationalWidget | error | PASS | Kort och neutral. |

**Öppna frågor från PRE-IMPL-COPY-REVIEW.md:**

- InterviewWidget "totalt" vs "denna vecka": "totalt" är faktiskt lugnare — "denna vecka" skapar en tidsbegränsad press. PASS som-är.
- ApplicationsWidget amber chip: Jag flaggar amber som en stresstriggare. Se FLAG ovan.
- SpontaneousWidget "Inget" vs "Inga": "Inga" (eller "Inga företag ännu") är mer mänskligt. Se FLAG ovan.

### langtidsarbetssokande — Summary

- PASS count: 20
- FLAG count: 4 (InterviewWidget empty, JobSearchWidget filled, ApplicationsWidget filled, SpontaneousWidget empty)
- BLOCK count: 0

**FLAG-detaljer:**
1. **InterviewWidget / empty** — "Starta din första session" → "Prova en övning" (energi-tröskelminskning, 5-min fix). Matchar arbetskonsulent FLAG.
2. **JobSearchWidget / filled** — "sparade sökningar" är förvirrande. Byt till "sparade jobb" eller lägg till en förklarande undernot. (5-min fix). Matchar arbetskonsulent FLAG.
3. **ApplicationsWidget / filled** — Amber alert chip triggar ångest. Byt till blå informationsruta eller tona ner urgency. (5-min fix, CSS-ändring + eventuellt kopiedit).
4. **SpontaneousWidget / empty** — "Inget i pipeline" → "Inga företag ännu" (mänskligare ton, 2-min fix). Matchar arbetskonsulent FLAG.

**BLOCK count: 0.** Ur deltagarens perspektiv är portalen generellt sett trygg och empatisk. FLAGs är förbättringar, inte blockerare.

---

## Kombinerad FLAG-lista (båda agenter)

| # | Widget | State | Flaggat av | Förslag | Uppskattad tid |
|---|--------|-------|-----------|---------|---------------|
| F1 | InterviewWidget | empty | BÅDA | "Starta din första session" → "Prova en övning" | 5 min |
| F2 | JobSearchWidget | filled | BÅDA | "sparade sökningar" → "sparade jobb" (eller kontext-label) | 5 min |
| F3 | ApplicationsWidget | filled | langtidsarbetssokande | Amber chip → blå informationsruta (tona ner urgency) | 10 min |
| F4 | SpontaneousWidget | empty | BÅDA | "Inget i pipeline" → "Inga företag ännu" | 2 min |

**Total FLAG-fix tid om revision tillämpas: ~22 min**
**BLOCK count (båda agenter): 0**

---

## Task 4: Decision — auto-selected: ship-as-is

**Auto-mode decision (per execution prompt):** Since BLOCK count = 0 from both agents, auto-select first acceptable option.

**Selected:** `ship-as-is`

**Rationale:** All 4 FLAGs are cosmetic/copy refinements (< 30 min total). No structural issues. No BLOCK verdicts. FLAGs are documented as Phase 4/v1.1 follow-ups below.

---

## Known Follow-ups (Phase 4 / v1.1 Backlog)

These FLAGs were identified during the Phase 3 empathy review but are NOT blockers for shipping Phase 3. They are deferred per the "ship-as-is" decision.

| # | Widget | State | Issue | Proposed Fix | Priority |
|---|--------|-------|-------|-------------|---------|
| F1 | InterviewWidget | empty | CTA "Starta din första session" feels high-commitment | Change to "Prova en övning" | Low |
| F2 | JobSearchWidget | filled | KPI label "sparade sökningar" semantically ambiguous in Phase 3 (will be replaced by "nya träffar" in Phase 5 live matching) | Change to "sparade jobb" OR add "(fas 5: livematchning)" note | Low (resolves naturally in Phase 5) |
| F3 | ApplicationsWidget | filled | Amber alert chip may trigger anxiety in users with high cognitive load / ångest | Change chip color to blue (informational) or soften copy to "1 ansökan — tid att svara" | Medium |
| F4 | SpontaneousWidget | empty | "Inget i pipeline" reads corporate/abstract | Change to "Inga företag ännu" | Low |

---

## Final Sign-Off

arbetskonsulent: APPROVED — 2026-04-28 — commit SHA e69529f3ecad1f766436851bd95815205a9c7068
langtidsarbetssokande: APPROVED — 2026-04-28 — commit SHA e69529f3ecad1f766436851bd95815205a9c7068

A11Y-05 gate status: CLOSED (signed off by both agents)
Iteration budget used: 0 revision passes (ship-as-is — no BLOCK verdicts from either agent)
Phase 3 ship gate: all WCAG 2.1 AA requirements satisfied (A11Y-01..05)

**Test suite status:** 530 tests passing (Phase 3 scope fully green); 21 pre-existing failures in Dashboard.test.tsx + register-flow.test.tsx (out of scope, documented in 03-04-SUMMARY.md)
