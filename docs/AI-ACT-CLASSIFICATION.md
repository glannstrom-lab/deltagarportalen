# AI Act Annex III-klassificering — Deltagarportalen

**Datum:** 2026-09-13 (avsnittet "Företagskonto" tillagt, rad 33 i tabellen; föregående 2026-09-11 Annex III 5 a, 2026-05-15)
**Lag:** Förordning (EU) 2024/1689 (AI Act)
**Relevanta paragrafer:** Annex III punkt 4 (employment), Art 6 (riskklassificering), Art 50 (transparens)
**Status:** Utkast. Konsultera AI-jurist för slutgiltig bedömning av gränsfall.

---

## Klassificeringsprincip

AI Act Annex III punkt 4 listar "anställning, arbetstagares ledning och tillgång till egenanställning" som högrisk-domän. Specifikt:
- **4(a):** AI för rekrytering / urval / annonsering / **screening av sökande**
- **4(b):** AI för befordran, uppsägning, arbetsfördelning, prestationsutvärdering

**Kritisk distinktion för vår portal:**

> Annex III talar om AI som används *av arbetsgivare för att utvärdera sökande*. Vår portal vänder sig till **arbetssökande själva** (B2C). Användaren matar in sitt eget CV mot sitt eget intresse — AI:n utvärderar inte kandidaten åt en tredje part.

Detta är ett återkommande tolkningsdiskussion. **Säker tolkning:** funktioner som *kunde* användas av arbetsgivare för screening klassas som högrisk även om vi designat dem för B2C, eftersom AI Act riskerar producent-ansvar oavsett deploymentkontext om systemet "kan användas" för Annex III-ändamål.

**Tolkning vi följer:** Funktioner som (a) genererar text åt användaren, (b) ger råd/information, (c) tränar användaren = **LÅGRISK**. Funktioner som (d) rangordnar / poängsätter individen mot ett *konkret beslut* (jobb, utbildning, väg) = **GRÄNSFALL/HÖGRISK** och kräver särskild dokumentation.

---

## Sammanfattningstabell

| # | Funktion | Plats | Klassning | Anmärkning |
|---|---|---|---|---|
| 1 | personligt-brev | Vercel + Edge | LÅGRISK | Textgenerering åt sökanden |
| 2 | cv-optimering | Vercel + Edge | LÅGRISK | Råd åt sökanden |
| 3 | cv-writing | Vercel + Edge | LÅGRISK | Textförbättring |
| 4 | generera-cv-text | Vercel | LÅGRISK | CV-sammanfattning |
| 5 | intervju-forberedelser | Vercel + Edge | LÅGRISK | Träning |
| 6 | intervju-simulator | Vercel | LÅGRISK | Träning (inte faktisk rekrytering) |
| 7 | jobbtips | Vercel + Edge | LÅGRISK | Vägledning |
| 8 | **kompetensgap** | Vercel | **GRÄNSFALL** | Rangordnar kompetenser → kan glida mot rekommendationsbeslut |
| 9 | linkedin-optimering | Vercel + Edge | LÅGRISK | Textgenerering |
| 10 | loneforhandling | Vercel + Edge | LÅGRISK | Förhandlingsråd |
| 11 | karriarplan | Vercel + Edge | LÅGRISK | Planering |
| 12 | mentalt-stod | Vercel + Edge | LÅGRISK | Coachning |
| 13 | natverkande | Vercel + Edge | LÅGRISK | Meddelandegenerering |
| 14 | ansokningscoach | Vercel + Edge | LÅGRISK | Feedback |
| 15 | ovningshjalp | Vercel + Edge | LÅGRISK | Lärande |
| 16 | profile-summary | Vercel + Edge | LÅGRISK | Profiltext |
| 17 | chatbot | Vercel + Edge | LÅGRISK | Generell coachning |
| 18 | ai-team-chat | Vercel + Edge | LÅGRISK | Rollspecifik coachning |
| 19 | sta-document-draft | Vercel + Edge | LÅGRISK | Konsulent skriver rapport |
| 20 | sta-week-summary | Vercel + Edge | LÅGRISK | Konsulent skriver rapport |
| 21 | ai-assistant | Edge | LÅGRISK | Proxy — följer underliggande funktion |
| 22 | **cv-analysis** | Edge | **GRÄNSFALL → LÅGRISK om B2C-only** | Beräknar matchProcent CV vs jobb |
| 23 | **learning-analyze-gap** | Edge | **GRÄNSFALL** | Rangordnar kompetensgap |
| 24 | learning-recommend | Edge | LÅGRISK | Kursrekommendation |
| 25 | ai-career-assistant | Edge | LÅGRISK | Coaching + marknadsdata |
| 26 | ai-company-analysis | Edge | LÅGRISK | Företagsinfo |
| 27 | ai-cover-letter | Edge | LÅGRISK | Personligt brev |
| 28 | ai-cv-writing | Edge | LÅGRISK | CV-text |
| 29 | ai-commute-planner | Edge | LÅGRISK | Pendlingsinfo |
| 30 | ai-industry-radar | Edge | LÅGRISK | Trendanalys |
| 31 | **intresseguide / RIASEC** | Klient + edge | **GRÄNSFALL** | Rangordnar yrken efter personlighet |
| 32 | **jobbmatchning** | (om implementerad) | **HÖGRISK** | Rangordnar jobb för individ — Art 22 GDPR-relevant |
| 33 | **förslagsflöde till företag (AG5/AG6)** | DB + klient | **INGEN AI** | Konsulenten väljer person och skriver presentationstexten; företaget ser bara godkända fält via vitlistad vy. Står med för att gränsen ska synas — se avsnittet "Företagskonto" nedan |

**Sammanfattning:** 27 LÅGRISK, 4 GRÄNSFALL, 1 HÖGRISK (om implementerad). Rad 33 innehåller ingen AI och räknas inte.

---

## Detaljerad analys av gränsfall

### #8 + #23: kompetensgap / learning-analyze-gap

**Vad de gör:** Tar användarens CV/profil och ett målyrke. Returnerar lista av kompetensgap rangordnat efter `importance` eller `demandLevel`.

**Lågrisk-argument:**
- Resultatet visas för användaren själv som lärandevägledning
- Ingen tredje part (arbetsgivare/myndighet) ser resultatet
- Användaren kan välja att ignorera

**Högrisk-argument (om kontexten ändras):**
- Om en konsulent kör analysen för flera deltagare och rangordnar — då är det Annex III 4(b) "arbetsfördelning"
- Om data exporteras till AF för deltagaranvisning — kan klassas som beslutsstöd

**Beslut:** GRÄNSFALL — klassa som LÅGRISK i nuvarande B2C-deployment, men:
- Dokumentera tydligt att vi *inte* tillåter användning för screening av flera kandidater
- ✅ **Gjort 2026-09-01 (AG4).** Villkoren förbjuder inte bara "screening" utan namnger handlingarna: arbetsgivare får inte **söka, filtrera, rangordna eller jämföra** personer, och portalen har varken kandidatdatabas eller sökfunktion mot deltagare. Lydelsen bor i `terms.noScreening.*` i `sv.json`/`en.json` och renderas av `pages/Terms.tsx`
- Märk output: "Detta är vägledning åt dig själv — det är inte en bedömning från en arbetsgivare"

### #22: cv-analysis

**Vad den gör:** Beräknar `matchPercentage` mellan ett CV och en jobbannons.

**Sub-explorer-agentens bedömning:** HÖGRISK (Annex III 4(a) screening).

**Min motbedömning:** I vår B2C-deployment använder *deltagaren själv* funktionen mot ett jobb *hen är intresserad av*. Det är assistans åt sökanden, inte arbetsgivar-screening. AI Act 4(a) talar om system för screening *av* sökande — det förutsätter en tredje part som utvärderar.

**Beslut:** GRÄNSFALL → LÅGRISK om vi:
- Hindrar tekniskt arbetsgivare/konsulent från att köra bulk-analys av flera CV:n
- Tydligt UI-meddelande: "Detta är din egen jämförelse — ingen arbetsgivare ser detta"
- Loggar inte enskilda analyser längre än 30 dagar
- Tar bort matchPercentage från konsulentvyer (om de finns)

Om någon av dessa villkor inte är uppfyllda → HÖGRISK och alla Art 9-15-krav gäller.

### #31: Intresseguide (RIASEC)

**Vad den gör:** RIASEC-personlighetstest som returnerar rangordnade yrkesrekommendationer.

**Lågrisk-argument:**
- Standardiserat psykometriskt instrument (validerat sedan 1959)
- Resultatet är information åt användaren, inte beslut
- Användaren väljer själv om hen följer rekommendationerna

**Högrisk-argument:**
- Annex III 4(a): "AI för att fatta beslut om...placering av sökanden" — yrkesförslag *kan* tolkas som placeringsstöd
- Om Arbetsförmedlingen använder resultaten för anvisning blir det myndighetsbeslut

**Beslut:** GRÄNSFALL → LÅGRISK för B2C, men dokumentera:
- Resultatet är användarens privata information
- Inte överförd till AF eller myndighet utan eget samtycke
- Användaren kan när som helst radera resultatet

---

## Krav för GRÄNSFALL-funktioner (oavsett om de tippar mot LÅGRISK)

Även om vi klassar dem som LÅGRISK i nuvarande deployment, gör vi följande som försiktighetsåtgärd och för AI Act Art 50 (transparens, som gäller ALLA AI-system från 2 aug 2026):

1. **Tydlig AI-disclosure i UI:** "Denna analys görs av AI och ger vägledning, inte slutgiltig bedömning."
2. **Möjlighet att invända:** Användaren ska kunna säga "stäng av AI-rekommendationer" utan att radera kontot (Art 21 GDPR).
3. **Loggning** för audit (vem körde funktionen, när, vilket resultat — pseudonymiserat).
4. **Bias-test** vid varje modelländring + årligen. Dokumenterat.
5. **Mänsklig granskning finns inte i portalen — kontrollerat 2026-08-12.** Det finns ingen knapp,
   yta eller flöde där en konsulent ser eller granskar en deltagares AI-resultat (RIASEC,
   kompetensgap, CV-analys). `client/src/pages/consultant/` innehåller inga träffar på
   RIASEC, career_plan eller ai_usage_logs — konsulentvyn visar deltagardata i allmänhet, men
   inget AI-utdatagranskningsflöde. Detta krav är **inte uppfyllt**, inte "uppfyllt via
   konsulenten". Om mänsklig granskning ska vara kravsvaret måste den byggas: en yta där
   konsulenten ser samma AI-resultat som deltagaren och kan markera dem granskade.
6. **Förbud i ToS (omskrivet 2026-09-01, AG4 — skärpt inför arbetsgivarspåret):** Villkoren
   säger nu fyra saker, och det är de tre sista som bär klassningen när företag släpps in:
   · arbetsgivare får inte **söka, filtrera, rangordna eller jämföra** personer — det finns
     ingen kandidatdatabas och ingen sökfunktion mot deltagare;
   · ett företagskonto kan **bara ta emot ett förslag om en namngiven person**, från en
     konsulent, efter att personen sagt ja till just den delningen;
   · **ingen AI rangordnar, poängsätter eller väljer ut personer åt en arbetsgivare** — en
     människa (konsulenten) avgör vem som föreslås, AI får bara formulera text. Det är
     precis den gränsen som håller portalen utanför Annex III 4(a);
   · **AI-resultat om en person lämnas aldrig ut till en arbetsgivare** — matchningspoäng,
     kompetensanalys, intresseprofil eller CV-omdöme — oavsett samtycke.
   Vaktat av `client/src/test/juridiska-sidor-i18n.test.ts`. **Skrivs lydelsen om måste den
   här punkten och DPIA:ns R9 ändras i samma commit.**

---

## Krav för HÖGRISK-funktioner (om någon klassas så efter granskning)

Vid bekräftad HÖGRISK gäller AI Act kap III (Art 8-15):

| Art | Krav | Status |
|---|---|---|
| 9 | Riskhanteringssystem etablerat | ❌ Behöver skapas |
| 10 | Datakvalitet + bias-validering på träningsdata | ❌ (gpt-oss-120b är extern modell — kräver leverantörsdokumentation) |
| 11 | Teknisk dokumentation enligt Annex IV | ❌ Behöver skapas |
| 12 | Loggning som möjliggör spårbarhet | ✅ `ai_usage_logs`-tabell finns |
| 13 | Transparens till användare ("Hur fungerar systemet") | 🟡 AiPolicy.tsx finns, behöver utökas |
| 14 | Mänsklig övervakning möjlig | ❌ **Inte byggt, kontrollerat 2026-08-12.** Ingen konsulentyta visar eller granskar AI-resultat — se punkt 5 ovan. Tidigare "✅ Konsulenter kan granska" var en outförd premiss, inte en verifierad funktion |
| 15 | Noggrannhet, robusthet, cybersäkerhet | 🟡 Rate-limit + auth finns, ingen accuracy-mätning |
| 27 | FRIA om vi är offentlig leverantör (AF/kommun) | ❌ Beror på upphandling |
| 50 | Transparens-märkning AI-genererat innehåll | ❌ Måste implementeras före 2 aug 2026 |

---

## Annex III punkt 5 a — aktivitetskravet och kommunerna (tillagt 2026-09-11)

Från oktober 2026 säljs portalen till kommuner som stöd i **aktivitetskravet för
försörjningsstöd** (SoL 2025:400 12 kap. 4 a–6 a §§). Det aktualiserar en annan
Annex III-punkt än punkt 4:

> **Annex III 5 a:** AI-system avsedda att användas av offentliga myndigheter, eller
> för deras räkning, för att **bedöma fysiska personers rätt till väsentliga offentliga
> förmåner och tjänster**, inklusive att bevilja, sänka, återkalla eller återkräva sådana
> förmåner.

Ett beslut om att neka eller sätta ned försörjningsstöd vid ogiltig frånvaro är exakt
en sådan bedömning. **Portalens gräns, byggd 2026-09-11 (KM3/KM4/KM6):**

| Led i kedjan | Var | AI? | Vem beslutar |
|---|---|---|---|
| Schemamall → pass | `aktivitetSchema.generateSessions()` | Nej, deterministiskt | Konsulenten väljer mall och datum |
| Veckomål (40 h, −10 h vid barn under 8) | `foreslagetVeckomal()` | Nej, lagens tal | Konsulenten, med motivering vid avvikelse |
| Närvaro per pass (giltig/ogiltig/sjuk/extern) | `activity_sessions.attendance`, sätts bara av konsulent (RLS + trigger) | Nej | Konsulenten markerar; deltagaren kan bara checka in själv |
| Veckosaldo och ampel | `veckosaldo()`, `veckoampel()` | Nej, aritmetik | Ingen — det är en visning |
| Beslut om nedsättning | Kommunens verksamhetssystem, socialnämnden | Utanför portalen | Socialnämnden |

**Regel som gäller framåt:** ingen AI-funktion får läsa, sammanfatta, bedöma eller
föreslå något ur `activity_plans`/`activity_sessions`. AI-teamet, rapportutkastet
(`ReportDraftDialog`) och alla `ai-*`-funktioner hålls på deltagarens sida av skärmen
(CV, brev, intervjuträning). Skulle någon vilja lägga en AI-sammanfattning av närvaro
i konsulentvyn blir portalen ett högrisksystem enligt 5 a med krav på FRIA
(art. 27), riskhanteringssystem, Annex IV-dokumentation och mänsklig övervakning —
och kommunen blir *deployer* med egna skyldigheter. Det är ett beslut, inte en
feature.

**Att säga till en kommun:** "Portalen innehåller ingen AI i kedjan schema, närvaro,
underlag. AI-funktionerna är deltagarens egna verktyg, kräver eget samtycke per
funktion och kan stängas av för hela organisationen."

---

## Företagskonto (AG6, 2026-09-13) — ingen AI i förslagsflödet

Portalen har sedan 2026-09-13 ett företagskonto (organisation av slaget `arbetsgivare`,
migration `supabase/migrations/20260913100000_ag6_foretagskonto.sql`). Ett företag är en
tredje part som *utvärderar sökande* — exakt den situation Annex III 4(a) beskriver, och
den B2C-invändning som bär klassningen ovan gäller därför inte här. Frågan blir i stället:
**finns det något AI-system i kedjan från konsulentens val till företagets beslut?**
Svaret, kontrollerat mot migrationen och koden 2026-09-13:

| Led i kedjan | Var | AI? | Vem avgör |
|---|---|---|---|
| Vilken person som föreslås för vilken plats | `employer_share_proposals` (INSERT av konsulenten) | Nej | Konsulenten, en person i taget. Ingen kandidatsökning, ingen lista, ingen rangordning finns att välja ur |
| Vilka fält som får delas | `show_*`, alla `DEFAULT false` | Nej | Konsulenten föreslår, deltagaren godkänner per fält |
| Presentationstexten | `presentation_text` | **Nej i etapp 1** — konsulenten skriver den själv | Konsulenten |
| Deltagarens ja/nej | `respond_to_share_proposal` | Nej | Deltagaren ensam (guarden släpper bara `participant_id` från `pending`) |
| Vad företaget ser | vyn `employer_proposals` (vitlistade kolumner) | Nej — `ai_summary` finns inte i vyn; "sammanfattning" är personens egen CV-text. Inga poäng, ingen intresseprofil | — (en visning) |
| Företagets svar | `employer_response` ∈ {interested, declined} | Nej | Företaget |
| Beslut om placering eller anställning | Utanför portalen | Utanför portalen | Företaget och konsulenten |

**Villkorad bedömning — inte en juridisk garanti.** Så länge tabellen ovan stämmer finns
inget AI-system som används för rekrytering eller urval av fysiska personer, för att sålla
eller filtrera ansökningar eller för att bedöma sökande i 4(a):s mening. Det som lämnas till
företaget är deltagarens egna uppgifter, valda av en människa och godkända av den
registrerade. **Annex III 4(a) aktiveras därför inte av företagskontot som det är byggt.**
Bedömningen faller om något av följande införs:

1. **Urval eller rangordning med AI** — en funktion som föreslår *vem* som ska föreslås,
   sorterar deltagare mot en plats, eller ger företaget mer än ett förslag i en jämförbar
   vy. Det är högrisk enligt 4(a), oavsett om konsulenten "godkänner" resultatet. Tabellen
   `employer_share_proposals` har inget poäng- eller rangordningsfält och ska inte få något.
2. **AI-resultat om personen i vyn** — `ai_summary`, matchningspoäng, kompetensgap, RIASEC.
   Villkoren (AG4) förbjuder det; migrationen håller det ur vyn. Lägger någon till en sådan
   kolumn i `employer_proposals` ska den här punkten, DPIA:ns R13 och B22 i Art 30-registret
   skrivas om i samma commit.
3. **AI-formulerad presentationstext** — en planerad möjlighet, inte byggd. Om den införs är
   det **text, inte urval**: konsulenten har redan valt personen, och funktionen faller i
   samma LÅGRISK-klass som personligt brev och profile-summary (rad 1 och 16). Villkor för
   att klassningen ska hålla: texten märks som AI-formulerad för konsulenten (art. 50), den
   bygger bara på fält deltagaren godkänt, och deltagaren ser texten innan hon svarar ja.
   Inför ändringen: lägg raden i sammanfattningstabellen och låt grinden
   `ai-sanningsregel.test.ts` omfatta den nya prompten.

**Att säga till ett företag:** "Ni får ett förslag i taget, om en namngiven person, från en
konsulent, efter att personen sagt ja. Ingen AI har valt personen, och inga AI-omdömen om
personen ingår. Det finns ingen sökfunktion bland personer — det är ett medvetet val."
Samma mening står i inbjudningsmejlet (`send-invite-email`, mallen för företagskonton).

---

## Action plan

1. **Slutgiltigt beslut på gränsfall** — jurist konsulterar inom 4 veckor. Vi opererar enligt LÅGRISK-tolkning men har möjlig högrisk-implementation klar att aktivera om jurist säger annat.
2. **AI Act Art 50 transparens-märkning** — implementeras före 2 aug 2026 (gäller ALLA AI-funktioner).
3. ✅ **Förbud i ToS — gjort 2026-09-01 (AG4).** Se punkt 6 ovan för lydelsen. Juridisk genomläsning kvarstår (ROADMAP A2).
4. **Bias-test-protokoll** — etablera baseline test för kompetensgap + cv-analysis + intresseguide.
5. **Granska ALL data-flöde** till konsulent — säkerställ att enskilda AI-resultat inte används för "arbetsfördelning" utan särskild deltagar-consent (Annex III 4(b)).

---

*Detta dokument levande — uppdateras vid varje ny AI-funktion eller vid AI Act-tolkningsändringar från Europeiska AI-kontoret (EU AI Office).*
