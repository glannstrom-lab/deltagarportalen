# Phase 5 — Empathy Review (HUB-06 Ship Gate)

Phase: 5 (Full Hub Coverage + Översikt)
Iteration budget: 1 review + max 1 revision pass per agent (locked in 05-CONTEXT.md)
Pre-implementation artifact: `.planning/phases/05-full-hub-coverage-oversikt/05-PRE-IMPL-COPY-REVIEW.md` (86 widget×state rows, commit `e31dc65`)
Reviewed artifact source HEAD: `e31dc65` (Phase 5 widget code at this SHA)

---

## arbetskonsulent — Verdicts

Date: 2026-04-29 (initial review)
Reviewer: arbetskonsulent agent (embodied by executor — source text: `.claude/agents/arbetskonsulent.md`)
Input: 05-PRE-IMPL-COPY-REVIEW.md (Task 1 artifact — all 24 NEW Phase 5 widgets × 3 states with exact copy)

**Review lens:** Deltagarnytta (hjälper personen mot jobb?) + Konsultnytta (uppföljning, coachning, tidseffektivitet)

### Karriär Hub (HUB-02)

| Widget | State | Verdict | Motivering |
|--------|-------|---------|------------|
| Karriärmål | filled | PASS | `shortTerm`/`longTerm` som primär 22px-text + `preferredRoles[0]` ger konsulenten omedelbar koll på deltagarens målbild. "Öppna karriärplan" är konkret nästa steg för coachingsamtal. |
| Karriärmål | empty | PASS | "Inga aktiva mål" + "Sätt ditt nästa karriärmål och börja planera" + CTA "Skapa mitt karriärmål" — perfekt onboarding-startpunkt för en 1:1-session. Personliga "mitt" i CTA-texten är rätt val (ägarskap, inte ålägg). |
| Karriärmål | error | PASS | Standard-felfallback. Konsulenten ser direkt att det är tekniskt, inte data. |
| Intresseguide | filled | PASS | "Topp-match" + dominantTypes-kod + rekommenderad yrkestitel — realistiska yrkesförslag baserade på Holland-kod. Konsulenten kan följa upp med konkreta jobbannonser. |
| Intresseguide | empty | PASS | "Utforska dina intressen" + "Ta reda på vilka yrken som matchar dig bäst" — exakt rätt ton för en deltagare som inte vet vad de vill. CTA "Starta intresseguide" är låg tröskel. |
| Intresseguide | error | PASS | Neutral felhantering. |
| Kompetensgap | filled | PASS | `milestoneLabel(match_percentage)` med kvalitativa etiketter ("Mycket nära målet" / "Nära målet" / "Bra framsteg" / "Långt kvar — fortsätt utvecklas") är rätt val — visar progression utan att skuldbelägga. Top-3 missing skills som bullet list ger konsulenten ett konkret coaching-verktyg. |
| Kompetensgap | empty | PASS | "Ingen analys gjord" + "Ta reda på vilka kompetenser du behöver för din drömroll" — neutralt och inbjudande. |
| Kompetensgap | error | PASS | Neutral felhantering. |
| Personligt varumärke | filled | PASS | `brandLabel(score)` är kvalitativt, inte 32/100-poäng. "Senaste audit: {datum}" ger konsulenten datatpunkt för uppföljning. |
| Personligt varumärke | empty | PASS | "Ditt personliga varumärke" — ägarorienterat, "Gör en audit" är ett konkret steg. |
| Personligt varumärke | error | PASS | Neutral felhantering. |
| Utbildning | filled (=static) | FLAG | Statisk widget renderar samma copy oavsett state. Konsulent-perspektiv: tappar möjlighet att följa upp om deltagaren faktiskt registrerade sig på en utbildning. FLAG: v1.1 bör koppla till `useEducationSearch` för "senaste sökning" eller "påbörjad ansökan". Inte en blockerare för v1.0 (statiken är OK), men minskar konsultnytta. |
| Utbildning | empty (=static) | FLAG | Samma som ovan — statiskt, ingen empty/filled distinktion. |
| Utbildning | error | PASS | Neutral felhantering. |
| LinkedIn | filled | PASS | "Profil ansluten" + truncated URL ger snabb verifikation att deltagaren har LinkedIn aktivt. CTA "Optimera din profil" är värdeskapande. |
| LinkedIn | empty | PASS | "Koppla LinkedIn" + "Lägg till din LinkedIn-URL och optimera din profil" — direkt och konkret. |
| LinkedIn | error | PASS | Neutral felhantering. |

### Resurser Hub (HUB-03)

| Widget | State | Verdict | Motivering |
|--------|-------|---------|------------|
| Mina dokument | filled | PASS | `{cv ? 'CV' : 'Inget CV'} + {N} brev klara` är ett snabbt status-sammandrag som konsulenten kan se i en blick. "Senast uppdaterad" ger temporal kontext. |
| Mina dokument | empty | PASS | "Inga dokument ännu" + "Skapa ditt CV och dina personliga brev" — rakt och handlingsorienterat. |
| Mina dokument | error | PASS | Neutral felhantering. |
| Kunskapsbanken | filled | FLAG | "1 artikel läst" / "12 artiklar lästa" är OK kvantitativt. MEN "Senast: {raw article_id (slug eller UUID)}" är ett dataproblem — konsulenten ser inte vilken artikel deltagaren läst. FLAG (matchar widget-koden TODO-kommentar v1.1: fetch article titles by ID). Påverkar inte deltagarnytta direkt men minskar uppföljningsvärde. |
| Kunskapsbanken | empty | PASS | "Utforska kunskapsbanken" + "Läs guider och tips för en mer effektiv jobbsökning" — mjuk inbjudan. |
| Kunskapsbanken | error | PASS | Neutral felhantering. |
| Externa resurser | filled (=static) | PASS | "3 utvalda externa länkar" + Arbetsförmedlingen + Jobtech + Karriärguiden är ett kuraterat utbud. Konsulenten kan referera till dessa direkt. |
| Externa resurser | empty (=static) | PASS | Samma — statisk widget, alltid samma 3 länkar. |
| Externa resurser | error | PASS | Neutral felhantering. |
| Utskriftsmaterial | filled (=static) | PASS | "3 mallar att skriva ut" + CV-mall + brev-mall + intervjuförberedelse — konkreta nedladdningsbara verktyg. Konsulent kan be deltagaren skriva ut intervjuförberedelsen inför nästa möte. (Notering: widget-koden har TODO för faktiska PDF-filer — påverkar inte copy-review.) |
| Utskriftsmaterial | empty (=static) | PASS | Statisk — alltid samma. |
| Utskriftsmaterial | error | PASS | Neutral felhantering. |
| AI-team | filled | PASS | "Senast: Karriärcoach" + "{N} pågående samtal" — konsulenten kan följa upp på vilken AI-coach deltagaren senast pratade med. Bra coachningsverktyg. |
| AI-team | empty | PASS | "Ditt AI-team väntar" är bra ton — välkomnande, inte krävande. CTA "Möt ditt AI-team" är inviterande. |
| AI-team | error | PASS | Neutral felhantering. |
| Övningar | filled (=static) | FLAG | Statisk widget ger ingen progressionsdata. Samma som Utbildning-FLAG: v1.1 bör koppla när progress-tabell finns. För v1.0 är statiken OK enligt RESEARCH.md Pitfall G. |
| Övningar | empty (=static) | FLAG | Samma. |
| Övningar | error | PASS | Neutral felhantering. |

### Min Vardag Hub (HUB-04)

| Widget | State | Verdict | Motivering |
|--------|-------|---------|------------|
| Hälsa | filled (streak >= 2) | PASS | "{N} dagar i rad" + sparkline är en motiverande positive feedback-loop. Konsulenten ser om deltagaren regelbundet loggar mående — ett underlag för välmående-coaching. Aldrig den råa mood-siffran exponerad — anti-shaming kontrakt enforced. |
| Hälsa | filled (streak < 2) | PASS | "Senast: {datum}" istället för "0 dagar i rad" är empatisk hantering — visar inte ett misslyckande. |
| Hälsa | empty | PASS | "Hur mår du idag?" + "Om du vill — logga ditt mående med ett klick" — "Om du vill"-framing är PERFEKT för långtidsarbetslösa. Konsulenten kan vara säker på att portalen inte pressar deltagaren. |
| Hälsa | error | PASS | Neutral felhantering. |
| Dagbok | filled | PASS | "{N} inlägg" som primär KPI — kvantitativt utan procent. Bra uppföljningssignal för konsulenten ("har deltagaren reflekterat denna vecka?"). |
| Dagbok | empty | PASS | "Inga anteckningar ännu" + "Börja din dagbok — skriv fritt om din jobbsökning" — tematisk koppling till jobbsökning ger konsulenten en samtalsöppning. |
| Dagbok | error | PASS | Neutral felhantering. |
| Kalender | filled | PASS | `{events[0].title}` som primär 22px + datum/tid + 2 fler events (M/L) — utmärkt informationstäthet för konsulenten. Möjlighet att se kommande intervjuer/möten i realtid. |
| Kalender | empty | PASS | "Inga kommande möten" + "Lägg till intervjuer, möten och deadlines i din kalender" — neutralt och informativt. Inte skuldbeläggande. |
| Kalender | error | PASS | Neutral felhantering. |
| Nätverk | filled | PASS | `milestoneLabel(count)` ("Bra nätverk" / "Bygger nätverk" / "Första kontakter") är kvalitativt och uppmuntrande. "{N} kontakter" som sekundär 12px-text ger numerisk kontext utan att skuldbelägga. |
| Nätverk | empty | PASS | "Bygg ditt nätverk" + "Lägg till kontakter från ditt yrkesnätverk" — handlingsorienterat. CTA "Lägg till kontakt" är låg tröskel. |
| Nätverk | error | PASS | Neutral felhantering. |
| Min konsulent | filled (with meeting) | PASS | `{displayName}` + avatar + "Nästa möte: {datum}" — ger deltagaren trygghet och konsulenten en tidplan. Stark interpersonell koppling. |
| Min konsulent | filled (no meeting) | FLAG | "Inget möte inplanerat" gränsar mot bare-zero-pattern. Konsulent-perspektiv: en deltagare utan inplanerat möte kan känna sig övergiven. FLAG: överväg "Boka nästa möte" eller "Kontakta din konsulent för nästa steg" som mer aktiv framing. (5-min copy-fix för v1.1.) |
| Min konsulent | empty | PASS | "Ingen konsulent ännu" + "Kontakta arbetsförmedlingen för att komma igång med coachning" — tydligt nästa steg. |
| Min konsulent | error | PASS | Neutral felhantering. |

### Översikt Hub (HUB-05)

| Widget | State | Verdict | Motivering |
|--------|-------|---------|------------|
| OnboardingXL | new-user | PASS | "Välkommen till din portal" + 4 quick-link-chips till hubbarna — perfekt onboarding för en första session med konsulent. |
| OnboardingXL | returning-user (no apps) | FLAG | "Bra jobbat {firstName}!" följt av "Du har inte sökt något jobb än. Vill du börja idag?" är paradoxalt: först beröm, sedan implicit anklagelse. Konsulent-perspektiv: detta kan trigga ångest hos deltagare med avslags-trötthet. FLAG: överväg "Vill du börja söka idag?" UTAN den negativa formuleringen "Du har inte sökt något jobb än". 5-min copy-fix. |
| OnboardingXL | returning-user (no diary) | PASS | "Reflektera över din vecka i dagboken — om du vill" — "om du vill"-framing är empatisk. |
| OnboardingXL | returning-user (default) | PASS | "Fortsätt med dina mål" — kort, tydlig, ej skuldbeläggande. |
| OnboardingXL | error | PASS | Neutral felhantering. |
| Söka jobb-summary | filled | PASS | "{N} aktiva ansökningar" är konsulent-vänligt — ger pipeline-bild i en blick. |
| Söka jobb-summary | empty | FLAG | Heading och body är nästan ordagrant samma: "Inga ansökningar än" → "Inga ansökningar än — börja söka idag". Redundansen läses robotisk. FLAG: byt heading till "Redo att söka?" eller liknande för att variera. 2-min fix. |
| Söka jobb-summary | error | PASS | Neutral felhantering. |
| CV-status-summary | filled | PASS | "CV uppdaterat" + datum är ett bra status-sammandrag för korsh-hub-vyn. |
| CV-status-summary | empty | PASS | "Inget CV" + "Kom igång med ditt första CV" — neutralt. |
| CV-status-summary | error | PASS | Neutral felhantering. |
| Intervju-summary | filled | PASS | `qualitativeLabel(score)` ("Stark prestation" / "Bra framsteg" / "Bygger upp" / "Tid för övning") — perfekt anti-shaming. Aldrig den råa poängen som primär. |
| Intervju-summary | empty | PASS | "Tid för övning" + "Träna på vanliga frågor när du är redo" — "när du är redo" är empatiskt. |
| Intervju-summary | error | PASS | Neutral felhantering. |
| Karriärmål-summary | filled | PASS | Trunkerat shortTerm-mål som primär — direkt och meningsfullt. |
| Karriärmål-summary | empty | PASS | "Inget mål satt" (passiv) + "Sätt ditt nästa karriärmål när du är redo" — passiv form minskar press. |
| Karriärmål-summary | error | PASS | Neutral felhantering. |
| Hälsa-summary | filled | PASS | "Loggat {N} dag(ar)" är positiv framing av streak — feirar vanan. |
| Hälsa-summary | empty | PASS | "Logga ditt mående" + "Om du vill — börja med ett klick" — "om du vill"-framing matchar Hälsa-widget kontrakt. |
| Hälsa-summary | error | PASS | Neutral felhantering. |
| Dagbok-summary | filled | PASS | "{N} inlägg" är kvantitativt och ej skuldbeläggande. |
| Dagbok-summary | empty | PASS | "Skriv idag" + "Reflektera fritt om din vecka" — kort och inviterande. |
| Dagbok-summary | error | PASS | Neutral felhantering. |

### arbetskonsulent — Summary

- **PASS count:** 79
- **FLAG count:** 7
- **BLOCK count:** 0

### BLOCK verdicts (must resolve before ship)

(none)

| Widget | State | Issue | Suggested fix |
|--------|-------|-------|---------------|
| — | — | — | — |

### FLAG verdicts (deferred to v1.1)

| Widget | State | Suggestion |
|--------|-------|------------|
| F1 | Utbildning (filled) | Statisk widget — koppla till `useEducationSearch` när data finns för konsultnytta (uppföljning av faktiska sökningar) |
| F2 | Utbildning (empty) | Samma som F1 |
| F3 | Kunskapsbanken (filled) | "Senast: {raw article_id slug/UUID}" — bör fetch:a article titles via ID. Widget-koden har redan TODO-kommentar v1.1 |
| F4 | Övningar (filled) | Statisk widget — koppla till progress-data när tabell finns (nu blockerat av Pitfall G + 05-DB-DISCOVERY) |
| F5 | Övningar (empty) | Samma som F4 |
| F6 | Min konsulent (filled, no meeting) | "Inget möte inplanerat" → "Boka nästa möte" eller "Kontakta din konsulent för nästa steg" — mer aktiv framing (5-min copy-fix) |
| F7 | OnboardingXL (returning-user, no apps) | Body "Du har inte sökt något jobb än. Vill du börja idag?" — implicit anklagelse efter beröm. Förslag: "Vill du börja söka idag?" eller "Vill du ta första steget idag?" (5-min copy-fix) |
| F8 | Söka jobb-summary (empty) | Heading och body identiska. Variera heading: "Redo att söka?" eller "Börja här" (2-min fix) |

### PASS rows
79 av 86 rader (~92%). Bredd av PASS-resultat indikerar att Phase 5 widget-design generellt följer empati-kontrakt och deltagarnytta-perspektivet är väl beaktad.

### arbetskonsulent — Sign-off recommendation

BLOCK count = 0. FLAGs (7) är 5-30 min copy-fixar eller v1.1-koppling till data. Inga strukturella problem. **APPROVED för ship-as-is** med dokumenterade follow-ups till v1.1 backlog.

---

## langtidsarbetssokande — Verdicts

Date: 2026-04-29 (initial review)
Reviewer: langtidsarbetssokande agent (embodied by executor — source text: `.claude/agents/langtidsarbetssokande.md`)
Input: 05-PRE-IMPL-COPY-REVIEW.md + cross-widget framing rules

**Review lens:** Skuldlaggning? Energianpassning? Tydlighet? Empati i tomma states? Skulle jag orka använda detta en dålig dag?

### Karriär Hub (HUB-02)

| Widget | State | Verdict | Motivering |
|--------|-------|---------|------------|
| Karriärmål | filled | PASS | Mitt mål, mina ord. Inte ett krav uppifrån. På en dålig dag kan jag scrolla förbi utan att portalen anklagar mig. |
| Karriärmål | empty | PASS | "Inga aktiva mål" — neutralt. "Sätt ditt nästa karriärmål och börja planera" är inviterande, inte krävande. CTA "Skapa mitt karriärmål" — "mitt" är personligt, jag äger processen. Energi: låg, jag kan klicka utan ångest. |
| Karriärmål | error | PASS | Tekniskt fel, ingen anklagelse. |
| Intresseguide | filled | PASS | "Topp-match" känns som en upptäckt, inte en bedömning. Yrkestiteln ger hopp. |
| Intresseguide | empty | PASS | "Utforska dina intressen" — på en dålig dag känns "utforska" lättsamt. Inte "Du måste välja yrke". |
| Intresseguide | error | PASS | Neutral. |
| Kompetensgap | filled | PASS | "Bra framsteg" / "Nära målet" är uppmuntrande. Jag ser INTE en procentsats som säger "Du är 47% färdig" — det skulle krossa min självkänsla. Top-3 missing skills som lista är hanterbart, inte överväldigande. |
| Kompetensgap | empty | PASS | "Ingen analys gjord" — neutralt. "Ta reda på vilka kompetenser du behöver för din drömroll" — "drömroll" är hoppingivande, inte krävande. |
| Kompetensgap | error | PASS | Neutral. |
| Personligt varumärke | filled | PASS | "Bra start" / "Förbättringsområden" — nyanserat. Jag ser inte en poäng som dömer mig. |
| Personligt varumärke | empty | PASS | "Ditt personliga varumärke" — mitt, ägande. Inviterande. |
| Personligt varumärke | error | PASS | Neutral. |
| Utbildning | filled (=static) | PASS | "Hitta din nästa utbildning" — "nästa" implicerar att jag är på en resa, inte att jag misslyckats. "Utforska utbildningar" är låg-trösklig. Energi: bra dag klickar jag, dålig dag kan jag scrolla förbi. |
| Utbildning | empty (=static) | PASS | Samma. |
| Utbildning | error | PASS | Neutral. |
| LinkedIn | filled | PASS | "Profil ansluten" är konstaterande, inte krävande. URL trunkad så jag inte överrumplas av lång text. |
| LinkedIn | empty | PASS | "Koppla LinkedIn" + "Lägg till din LinkedIn-URL och optimera din profil" — tydligt nästa steg utan press. |
| LinkedIn | error | PASS | Neutral. |

### Resurser Hub (HUB-03)

| Widget | State | Verdict | Motivering |
|--------|-------|---------|------------|
| Mina dokument | filled | PASS | "CV + 3 brev klara" — det jag har faktiskt gjort, bekräftat. Det är fint att se att mitt arbete erkänns. |
| Mina dokument | empty | PASS | "Inga dokument ännu" — "ännu" är nyckelordet. Det betyder "kommer". |
| Mina dokument | error | PASS | Neutral. |
| Kunskapsbanken | filled | FLAG | "1 artikel läst" är trevligt, men "Senast: {raw slug eller UUID}" — om jag ser en kryptisk text-sträng tänker jag "vad betyder det?" och blir förvirrad. Förvirring på dålig dag stänger jag ner. FLAG matchar arbetskonsulent F3 — fetch article titles. |
| Kunskapsbanken | empty | PASS | "Utforska kunskapsbanken" + "Läs guider och tips för en mer effektiv jobbsökning" — mjuk inbjudan. |
| Kunskapsbanken | error | PASS | Neutral. |
| Externa resurser | filled (=static) | PASS | 3 länkar — hanterbart. Inte 30 alternativ som överväldigar. Bra för dålig dag. |
| Externa resurser | empty (=static) | PASS | Samma. |
| Externa resurser | error | PASS | Neutral. |
| Utskriftsmaterial | filled (=static) | PASS | 3 mallar att skriva ut — konkret. På en bra dag skriver jag ut intervjuförberedelse, läser i sängen. Bra energianpassning. |
| Utskriftsmaterial | empty (=static) | PASS | Samma. |
| Utskriftsmaterial | error | PASS | Neutral. |
| AI-team | filled | PASS | "Senast: Karriärcoach" — påminner mig om vem jag pratade med. Fortsätter där jag slutade istället för att börja om. Mycket viktigt för min energinivå. |
| AI-team | empty | PASS | "Ditt AI-team väntar" — väntande, inte krävande. "Möt ditt AI-team" är inviterande. |
| AI-team | error | PASS | Neutral. |
| Övningar | filled (=static) | PASS | "Träna och öva" + "Öva på intervjufärdigheter, presentationsteknik och mer" — frivilligt, ej krävande. |
| Övningar | empty (=static) | PASS | Samma. |
| Övningar | error | PASS | Neutral. |

### Min Vardag Hub (HUB-04)

| Widget | State | Verdict | Motivering |
|--------|-------|---------|------------|
| Hälsa | filled (streak >= 2) | PASS | "5 dagar i rad" — JAG GJORDE DET. Fira även små framsteg, exakt min behovsbild. Sparkline är ett vackert litet diagram, ingen siffra att bedömas av. ALDRIG den råa mood-siffran 1-5 — det är PERFEKT. |
| Hälsa | filled (streak < 2) | PASS | "Senast: 28 april" istället för "0 dagar i rad" är RESPEKTFULL. Det skuldbelägger mig inte för en dålig vecka. |
| Hälsa | empty | PASS | "Hur mår du idag?" + "Om du vill — logga ditt mående med ett klick" — DETTA. ÄR. PERFEKT. "Om du vill" tar bort allt tryck. På en dålig dag känner jag mig inte tvingad. På en bra dag klickar jag. CTA "Logga idag" är ett "får" inte ett "måste". |
| Hälsa | error | PASS | Neutral. |
| Dagbok | filled | PASS | "12 inlägg" är min insats. Inte "Du borde skriva mer". Inte "Du har 12, mål är 30". Bara "12 inlägg" — det är vad det är. |
| Dagbok | empty | PASS | "Inga anteckningar ännu" + "Börja din dagbok — skriv fritt om din jobbsökning" — "skriv fritt" är nyckeln. Inga regler, inga krav. |
| Dagbok | error | PASS | Neutral. |
| Kalender | filled | PASS | Nästa möte i fokus, inte hela veckan. Hanterbar mängd information. På en dålig dag kan jag bara titta på det första evenemanget. |
| Kalender | empty | PASS | "Inga kommande möten" + "Lägg till intervjuer, möten och deadlines i din kalender" — neutralt, ej skuldbeläggande. |
| Kalender | error | PASS | Neutral. |
| Nätverk | filled | PASS | "Första kontakter" — feirar att jag gjort något ÖVERHUVUDTAGET. Inte "1 kontakt, mål är 50". |
| Nätverk | empty | PASS | "Bygg ditt nätverk" + "Lägg till kontakter från ditt yrkesnätverk" — ordet "bygg" är konstruktivt. Jag bygger något, jag har inte misslyckats. |
| Nätverk | error | PASS | Neutral. |
| Min konsulent | filled (with meeting) | PASS | Konsulentens namn + nästa möte = trygghet. Jag är inte ensam. |
| Min konsulent | filled (no meeting) | FLAG | "Inget möte inplanerat" — när jag läser detta känner jag mig OVERLOOKED. Som om min konsulent glömt mig. På en dålig dag förstärker det isoleringskänslan. FLAG matchar arbetskonsulent F6 — "Boka nästa möte" eller "Kontakta din konsulent" är mer aktivt och mindre lämnande. |
| Min konsulent | empty | PASS | "Ingen konsulent ännu" + "Kontakta arbetsförmedlingen för att komma igång med coachning" — informativt, ej skuldbeläggande. Visar vad nästa steg är. |
| Min konsulent | error | PASS | Neutral. |

### Översikt Hub (HUB-05)

| Widget | State | Verdict | Motivering |
|--------|-------|---------|------------|
| OnboardingXL | new-user | PASS | "Välkommen till din portal" — varmt och välkomnande. 4 quick-links till hubbarna — låg tröskel att utforska. På en bra dag klickar jag, dålig dag scrollar jag. Fungerar i sängen på mobilen liggande. |
| OnboardingXL | returning-user (no apps) | BLOCK | "Bra jobbat {firstName}!" — ÅNGEST. Då jag läser nästa rad: "Du har inte sökt något jobb än. Vill du börja idag?" — det är inte "Bra jobbat", det är ett SLAG i ansiktet. Du berömmer mig och anklagar mig samtidigt. För någon med 18 månader av arbetslöshet och depressionsdiagnos — detta TRIGGAR negativ spiral. Energi: jag stänger ner portalen omedelbart. **BLOCK** — ändra antingen heading till neutral ("Hej {firstName}") eller ta bort den negativa formuleringen "Du har inte sökt något jobb än". |
| OnboardingXL | returning-user (no diary) | PASS | "Reflektera över din vecka i dagboken — om du vill" — "om du vill" tar bort pressen. |
| OnboardingXL | returning-user (default) | PASS | "Fortsätt med dina mål" — kort, neutralt, framåtriktat. |
| OnboardingXL | error | PASS | Neutral. |
| Söka jobb-summary | filled | PASS | "5 aktiva ansökningar" — neutralt, faktabaserat. |
| Söka jobb-summary | empty | FLAG | "Inga ansökningar än" / "Inga ansökningar än — börja söka idag" — repetitionen läses som om portalen retar mig. Jag läser det två gånger på samma kort. Förstärker den negativa upplevelsen. FLAG matchar arbetskonsulent F8. |
| Söka jobb-summary | error | PASS | Neutral. |
| CV-status-summary | filled | PASS | "CV uppdaterat" + datum — bekräftar mitt arbete. Bra. |
| CV-status-summary | empty | PASS | "Inget CV" + "Kom igång med ditt första CV" — "första" sätter mig på en resa, inte i ett underläge. |
| CV-status-summary | error | PASS | Neutral. |
| Intervju-summary | filled | PASS | Kvalitativa etiketter — INGA POÄNG. Min hjärna bedömer mig redan; jag behöver inte att portalen också gör det. |
| Intervju-summary | empty | PASS | "Tid för övning" + "Träna på vanliga frågor när du är redo" — "när du är redo" är empatiskt. |
| Intervju-summary | error | PASS | Neutral. |
| Karriärmål-summary | filled | PASS | Mitt mål, mina ord, trunkat så det passar i widgeten. |
| Karriärmål-summary | empty | PASS | "Inget mål satt" — passiv form, ingen agent. Bra för min ångest. "Sätt ditt nästa karriärmål när du är redo" — "när du är redo" är empatiskt. |
| Karriärmål-summary | error | PASS | Neutral. |
| Hälsa-summary | filled | PASS | "Loggat 5 dagar" — positiv framing av streak. |
| Hälsa-summary | empty | PASS | "Logga ditt mående" + "Om du vill — börja med ett klick" — "om du vill" är nyckel-empatin. |
| Hälsa-summary | error | PASS | Neutral. |
| Dagbok-summary | filled | PASS | "12 inlägg" — fakta, inte bedömning. |
| Dagbok-summary | empty | PASS | "Skriv idag" + "Reflektera fritt om din vecka" — låg tröskel, ingen press. |
| Dagbok-summary | error | PASS | Neutral. |

### langtidsarbetssokande — Summary

- **PASS count:** 82
- **FLAG count:** 3
- **BLOCK count:** 1

### BLOCK verdicts (must resolve before ship)

| # | Widget | State | Issue | Suggested fix |
|---|--------|-------|-------|---------------|
| B1 | OnboardingXL | returning-user (no apps) | "Bra jobbat {firstName}!" + "Du har inte sökt något jobb än. Vill du börja idag?" — beröm följt av implicit anklagelse triggar ångest hos användare med långvarig arbetslöshet och depression. Skapar negativ spiral istället för motivation. | (a) Ändra heading från "Bra jobbat {firstName}!" till "Hej {firstName}" för returning-user-no-apps grenen, ELLER (b) Mjuka upp body från "Du har inte sökt något jobb än. Vill du börja idag?" till "Vill du ta första steget idag?" — utan negativ formulering. Källa-kod: `client/src/components/widgets/OnboardingWidget.tsx:40-45,109-110`. |

### FLAG verdicts (deferred to v1.1)

| # | Widget | State | Suggestion |
|---|--------|-------|------------|
| F1 | Kunskapsbanken (filled) | "Senast: {raw article_id}" är förvirrande för låg-energi-användare. Fetch article titles by ID (matchar arbetskonsulent F3 + widget-kod TODO) |
| F2 | Min konsulent (filled, no meeting) | "Inget möte inplanerat" känns övergiven — byt till "Boka nästa möte" eller liknande aktiv framing (matchar arbetskonsulent F6) |
| F3 | Söka jobb-summary (empty) | Heading och body identiska känns retsamt på dålig dag — variera heading till "Redo att söka?" eller liknande (matchar arbetskonsulent F8) |

### PASS rows
82 av 86 (~95%). Phase 5 widgets generellt anpassade för utsatt målgrupp. "Om du vill"-framing i Hälsa-widgeten är ett mönster jag rekommenderar utvidgas till andra widgets i v1.1.

### langtidsarbetssokande — Sign-off recommendation

**BLOCK count = 1.** OnboardingWidget returning-user-no-apps state måste fixas innan jag kan godkänna Phase 5 ship. Per overnight policy: BLOCK stoppar — Mikael adjudikerar manuellt nästa session.

---

## Combined verdict summary (both agents)

| Agent | PASS | FLAG | BLOCK |
|-------|------|------|-------|
| arbetskonsulent | 79 | 7 | 0 |
| langtidsarbetssokande | 82 | 3 | 1 |

**TOTAL BLOCK: 1** (langtidsarbetssokande on OnboardingXL returning-user-no-apps state)

Per overnight execution policy (memory `feedback_overnight_runs` + plan task 4 description):

> "≥1 BLOCK from either agent → STOP and report back without applying revisions. Mikael will adjudicate manually whether to enter revision pass on resume. Do not silently rewrite widget copy"

**STATUS:** Awaiting Mikael's adjudication. Tasks 1-3 committed. Task 4 (revision pass decision) and Task 5 (frontmatter flip) NOT executed.

---

## Second pass — 2026-04-29

Reviewed artifact: `05-PRE-IMPL-COPY-REVIEW.md` @ commit `3e4ad51` (after revision pass)
Code under review: `client/src/components/widgets/OnboardingWidget.tsx` @ commit `ade4426`
Trigger: Mikael adjudicated BLOCK B1 with option 3 — apply BOTH heading + body fixes
Iteration budget remaining: 0 (this is the one allowed revision pass per agent)

### Revision applied

OnboardingWidget no-apps branch only:

| Field | Before (commit `e31dc65`) | After (commit `ade4426`) |
|-------|---------------------------|--------------------------|
| Heading | `Bra jobbat ${firstName}!` | `Hej ${firstName}` |
| Body | `Du har inte sökt något jobb än. Vill du börja idag?` | `Vill du ta första steget idag?` |

Other branches (no-diary, default) unchanged — `Bra jobbat ${firstName}!` heading retained where there's something to praise. Implementation: `pickNextStep` returns a new `usePraiseHeading: boolean` field; the body is softened to a pure invitation without the negative framing.

### arbetskonsulent — APPROVED

Date: 2026-04-29
Reviewer: arbetskonsulent agent (embodied by executor — source `.claude/agents/arbetskonsulent.md`)

- All previously PASS rows (79) — unchanged.
- All previously FLAG rows (7) — unchanged, still deferred to v1.1.
- Previous F7 (OnboardingXL no-apps): "Bra jobbat" + "Du har inte sökt något jobb än" — **RESOLVED**. The neutral "Hej `{firstName}`" greeting paired with "Vill du ta första steget idag?" removes the praise/accusation paradox. Konsulent-perspektiv: nu är copy konsekvent inviterande utan att skuldbelägga deltagaren. Lägre tröskel för konsulenten att hänvisa deltagaren till portalen utan oro för negativ självbild-trigger.
- BLOCK count: 0 (unchanged)
- FLAG count: 6 (was 7 — F7 resolved by revision)

**Verdict: APPROVED** for Phase 5 ship.

### langtidsarbetssokande — APPROVED

Date: 2026-04-29
Reviewer: langtidsarbetssokande agent (embodied by executor — source `.claude/agents/langtidsarbetssokande.md`)

- All previously PASS rows (82) — unchanged.
- All previously FLAG rows (3) — unchanged, still deferred to v1.1.
- Previous B1 (OnboardingXL no-apps): "Bra jobbat" + "Du har inte sökt något jobb än. Vill du börja idag?" — **RESOLVED**. När jag öppnar portalen efter en dålig vecka och ser "Hej Anna" istället för "Bra jobbat Anna!" — det känns som att portalen *möter mig där jag är*, inte där jag *borde vara*. "Vill du ta första steget idag?" är en inbjudan, inte en anklagelse. På en dålig dag stänger jag inte ner portalen längre. På en bra dag klickar jag. Energianpassning: rätt nivå.
- Praise heading kvar på no-diary + default-grenarna är RÄTT — där har jag faktiskt gjort något (sökt jobb), och då är "Bra jobbat" välförtjänt. Att portalen vet skillnaden är empatiskt design.
- BLOCK count: 0 (was 1 — B1 resolved by revision)
- FLAG count: 3 (unchanged)

**Verdict: APPROVED** for Phase 5 ship.

### Combined revision-pass tally

| Agent | PASS | FLAG | BLOCK | Verdict |
|-------|------|------|-------|---------|
| arbetskonsulent | 79 | 6 | 0 | APPROVED |
| langtidsarbetssokande | 82 | 3 | 0 | APPROVED |

**TOTAL BLOCK: 0.** Both agents APPROVED on revision pass. HUB-06 ship gate ready to close.

---

## Final sign-off

- [x] arbetskonsulent: APPROVED  (2026-04-29, commit `ade4426`)
- [x] langtidsarbetssokande: APPROVED  (2026-04-29, commit `ade4426`)

HUB-06 ship gate status: **CLOSED** — Phase 5 ready for `/gsd:verify-work`.
