# AI Act Annex III-klassificering — Deltagarportalen

**Datum:** 2026-05-15
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

**Sammanfattning:** 27 LÅGRISK, 4 GRÄNSFALL, 1 HÖGRISK (om implementerad).

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
- Lägg till villkor i ToS som förbjuder arbetsgivare att använda funktionen för screening
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
5. **Mänsklig granskning** finns: konsulent kan hjälpa deltagaren tolka resultatet.
6. **Förbud i ToS:** Arbetsgivare/rekryterare får inte använda portalen för att utvärdera externa kandidater.

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
| 14 | Mänsklig övervakning möjlig | ✅ Konsulenter kan granska |
| 15 | Noggrannhet, robusthet, cybersäkerhet | 🟡 Rate-limit + auth finns, ingen accuracy-mätning |
| 27 | FRIA om vi är offentlig leverantör (AF/kommun) | ❌ Beror på upphandling |
| 50 | Transparens-märkning AI-genererat innehåll | ❌ Måste implementeras före 2 aug 2026 |

---

## Action plan

1. **Slutgiltigt beslut på gränsfall** — jurist konsulterar inom 4 veckor. Vi opererar enligt LÅGRISK-tolkning men har möjlig högrisk-implementation klar att aktivera om jurist säger annat.
2. **AI Act Art 50 transparens-märkning** — implementeras före 2 aug 2026 (gäller ALLA AI-funktioner).
3. **Förbjud i ToS** — uppdatera användarvillkor att portalen inte får användas av arbetsgivare för screening.
4. **Bias-test-protokoll** — etablera baseline test för kompetensgap + cv-analysis + intresseguide.
5. **Granska ALL data-flöde** till konsulent — säkerställ att enskilda AI-resultat inte används för "arbetsfördelning" utan särskild deltagar-consent (Annex III 4(b)).

---

*Detta dokument levande — uppdateras vid varje ny AI-funktion eller vid AI Act-tolkningsändringar från Europeiska AI-kontoret (EU AI Office).*
