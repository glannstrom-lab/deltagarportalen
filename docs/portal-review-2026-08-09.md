# Portalgranskning 2026-08-09 — tio agenter, kod och webbläsare

> **Underlag:** `docs/review-2026-08-09/` — tio fullständiga rapporter, 6 569 rader, 110 skärmdumpar.
> Fem granskare läste kod och prod-databasen, fem körde portalen skarpt i Playwright mot dev-bygget
> och mot **prod (www.jobin.se)**. Baslinje: commit `f2877dcb`, deployad och grön.
>
> **Metodkrav som gällde alla tio:** bevis före intryck. Varje fynd bär `fil:rad`, SQL-utfall,
> HTTP-statuskod, uppmätt tal eller skärmdump. Premissgranskning var obligatorisk — flera fynd
> från 2026-08-04 avskrevs på vägen, och de rättelserna står utskrivna nedan.

**Omfattning:** ~247 numrerade fynd, varav **20 kritiska**. Ingen agent ändrade kod, databas eller
befintlig dokumentation.

---

## Domen

Portalens tekniska grund är bättre än sitt rykte. RLS är på i alla 131 tabeller, alla 53
`SECURITY DEFINER`-funktioner har pinnad `search_path`, det finns ingen IDOR i API-lagret,
bundlen läcker bara anon-nyckeln, routningen är konsistent, de 139 prerenderade sidorna har
noll axe-överträdelser, och säkerhetspaketet A16–A21 håller verifierat i drift.

Problemet ligger någon annanstans, och det är ett och samma problem på alla nivåer:
**portalen påstår saker som inte är sanna.** Startsidan påstår 5 000 användare där det finns 92.
Personligt brev-verktyget märker ett påhittat mallbrev "genererat med AI-stöd". Konsulentvyn
säger "senast inloggad" om ett fält som inte är inloggning, och skickar `QNaN NaN` vidare till
uppdragsgivarens PDF. Karriärcoachen hittar på a-kassevillkor. Retention-policyn har en ✅ bredvid
en gallring som aldrig körts. Tillgänglighetsredogörelsen påstår att knappar är `<button>` medan
46 axe-noder säger motsatsen. Roadmapen pekar ut fel orsak till att CI är rött.

Det är inte tjugo olika buggar. Det är en kultur där ett påhittat värde alltid har föredragits
framför ett tomt fält — i koden, i UI:t, i prompterna och i dokumentationen. Spår B ("ärlighet i
produkten") är därför inte längre ett spår bland nio. Det är portalens dominerande felklass, och
den har nu spridit sig till granskningsdokumenten själva.

**Den strategiska ramen som saknades i alla tidigare granskningar:** portalen har **92 konton, 7
aktiva senaste 30 dygnen, 2 191 rader data totalt och 50 AI-anrop sedan april.** Fem månader i
drift. Det betyder att nästan ingen har sett något av det här ännu — vilket gör ärlighetsfynden
brådskande snarare än pinsamma. De ska lagas *innan* någon marknadsför portalen, inte efteråt.
Det betyder också att prestanda- och skalningsarbete är mindre brådskande än planen antar, och
att den obesvarade frågan inte är teknisk: **varför använder ingen portalen?**

---

## Nu-listan — elva punkter före allt annat

Rangordnade efter skada × sannolikhet, inte efter spår.

| # | Fynd | Bevis | Storlek |
|---|------|-------|---------|
| **B19** | **Startsidan påstår 5 000+ användare, femstjärnigt betyg och 30+ kommuner.** Prod har 92 konton och 7 aktiva. Faktor 54 | `Landing.tsx:412`, `:426` · SQL mot `profiles` | S |
| **B20** | **Tre påhittade personer under "Verkliga historier från människor som hittat sin väg tillbaka till arbetslivet."** Fallbackens egen kommentar säger "hämtade från användarintervjuer 2026" — de intervjuerna står som *planerade* i ROADMAP §4 | `Landing.tsx:832` | S |
| **A22** | **35 `SECURITY DEFINER`-funktioner är fortfarande anropbara av `anon`.** A17 tog 18 av 53 och generaliserade aldrig PUBLIC-fällan den själv dokumenterade. Två av de 35 raderar rader | `POST /rest/v1/rpc/check_health_consent` → **HTTP 200** med publik anon-nyckel | M |
| **B21** | **Misslyckad AI-generering ger ett påhittat brev märkt "genererat med AI-stöd".** Funktionen heter `mockGenerateLetter`; rutan bär `AIGeneratedWatermark` vars docstring åberopar AI Act art. 50.2 | `CoverLetterWrite.tsx:396-407`, `:1137-1155`, `:1110` · reproducerat på prod | S |
| **B22** | **Karriärcoachen hittar på svenska bidragsregler.** "minst 4 jobb per vecka" för a-kassa (finns inte), aktivitetsstöd "78 % av prisbasbeloppet, upp till 100 dagar" (fel på båda punkter). Prompten är sju ord och saknar sanningsregeln sex andra funktioner har | `ai.js:692` · skarpa prod-svar i rapporten | S |
| **A23** | **Perplexity är ett oredovisat underbiträde.** **Fem** edge-funktioner kör `perplexity/sonar` **via OpenRouter** (`ai-career-assistant`, `ai-commute-planner`, `ai-company-analysis`, `ai-company-search`, `ai-industry-radar`); `ai-commute-planner` skickar användarens **hemadress**. Ordet finns inte i integritetspolicyn, Art. 30 eller DPIA:n — och det bryter modellåsningen | `grep -rln sonar supabase/functions` (5 filer) · `OPENROUTER_API_URL` i varje | S (dok) + beslut |
| **A24** | **"Servrar i EU. Ingen data lämnar EES" är falskt** enligt projektets eget `HOSTING-REGIONS.md:14` (OpenRouter = USA, all AI går den vägen). FAQ:n och registreringens samtyckestext namnger dessutom fel biträde ("OpenAI") | prod + eget dokument | S |
| **D17** | **CI har aldrig varit grön** — 687 körningar sedan 2 april, noll lyckade. Orsaken är **inte** coverage (D13:s premiss är död): sju testfiler kraschar på `supabaseUrl is required` eftersom `test`-jobbet aldrig får `VITE_SUPABASE_URL` | `ci.yml:100-104` · check-run-annotations | S |
| **B23** | **Konsulentvyns nyckeltal ljuger om verkliga personer.** "Loggade in" = `profiles.updated_at` (27 av 31 avviker, max 74 dygn); `last_contact_at` skrivs aldrig (0 av 31) så "Kräver uppmärksamhet" flaggar 100 % för alltid; "CV-kvalitet" är 0 % på en flik och 100 % på en annan; kohorttabellen visar **`QNaN NaN`** — och strängen följer med in i PDF-rapporten till uppdragsgivaren | vy-def i prod · `AnalyticsTab.tsx:523` | M |
| **H18** | **Ingen schemaläggare finns någonstans.** pg_cron = 0, `client/vercel.json` saknar `crons`, inga `schedule:` i workflows. Jobbevakning, gallring och inaktivitetsmejl saknar producent på **tre** nivåer samtidigt. A6 löser en tredjedel | tre oberoende kontroller | S + M |
| **A25** | **`CRON_SECRET` sattes aldrig** → `send-inactivity-warning` svarar **HTTP 503** för alla. Vakten är rätt byggd (fail closed) men har aldrig kört skarpt. Blockerar A6 | skarpt anrop | S (Mikael) |

**Fyra av elva är storlek S och kan tas samma dag** (B19, B20, A24, D17). De tar bort tre av
fyra kritiska fynd på den publika ytan och gör CI till en grind i stället för en lampa.

---

## Fem mönster som går genom hela portalen

### 1. Ett påhittat värde har alltid föredragits framför ett tomt fält

Tjugo belagda instanser, i varje lager:

| Lager | Instans |
|---|---|
| Marknadsföring | 5 000+ användare, femstjärnigt betyg, 30+ kommuner, tre fiktiva omdömen, "ingen data lämnar EES" |
| AI-utdata | `mockGenerateLetter` märkt AI · chatbot hittar på a-kassevillkor · `kompetensgap` hittar på "Nuvarande: 1/5" och ger 25 % resp. 22 % på identisk indata · `ai-cover-letter` fabricerar truckkort och "minskat felprocenten med 15 %" · `profile-summary` skriver påhittad persona **till databasen** |
| Deltagar-UI | "Exempeldata" skriver över deltagarens riktiga CV med "Anna Andersson" och autosparar utan ångra · `/resources` räknar skickade ansökningar som sparade jobb · avklarade artiklar räknas på en `.limit(3)`-skiva så 8 aldrig kan visas |
| Konsulent-UI | Fyra påhittade deltagare vid namn med prioritetsfärger (noll AI-anrop) · påhittad intervjuprognos · fyra ljugande nyckeltal · `QNaN NaN` i uppdragsgivarens PDF · `averageAtsScore` = fabricerad nolla (NULL i 26 av 26) |
| Dokumentation | `RETENTION-POLICY.md:47` ✅ på en gallring som aldrig kört (äldsta rad 107 dagar) · tillgänglighetsredogörelsen · `AI-ACT-CLASSIFICATION.md` påstår mänsklig granskning som saknar knapp · migrationsliggaren (57 poster mot 132 filer) · CLAUDE.md om pre-push · ROADMAP D13 |

Rotorsaken är samma kodmönster överallt: `?? 0`, `|| 0`, `if (error) return []`. En saknad rad
och ett fel ser likadana ut, och båda renderas som ett tal.

**Motmedlet är en regel, inte tjugo fixar:** *ett värde utan underlag visar "—" och en rad om
varför — aldrig 0, aldrig 100 %, aldrig ett påhittat exempel.* Konsulentvyn har redan två
förebilder i sin egen text ("För litet underlag för en meningsfull jämförelse…").

### 2. Grindar som inte grindar

| Grind | Vad den inte fångar |
|---|---|
| CI | Har aldrig varit grön. 687 körningar, noll lyckade. `build`, Lighthouse och **hela Playwright-sviten** har aldrig kört på main |
| pre-push | Kör fem av åtta grindar och **inga tester** — CLAUDE.md påstår `npm run verify` |
| `lint:schema` | Läser inte kolumnnycklar i `insert/update/upsert` (fyra skarpa buggar gömda där) och inte vydefinitioner (fyra konsulent-fel gömda där) |
| trufflehog | Scannar en **tom diff** vid push till main — den enda väg projektet använder. Repot är publikt |
| `nav-smoke` | `/cv`-routen togs bort → **33/33 gröna**. Testet kan inte falla på det det finns till för |
| art. 9-testerna | Grinden fick läsa fel tabell **och** fel kolumn → **14/14 gröna** båda gångerna. Med fail closed betyder ett stavfel att AI tyst blockeras för alla |
| coverage | Passerar lokalt, men rapporten laddas aldrig upp — ingen har sett CI:s faktiska siffra |
| `client/api/*.js` | Får varken eslint, typecheck eller schemakontroll — och det är koden som kör med förhöjda rättigheter och håller art. 9-grinden |

Fyra av sex mutationer överlevde. Sviten växte 933 → 1 304 tester (+40 %) sedan 4 augusti utan
att signalen förbättrades. **Antalet tester är projektets mest missvisande tal.**

### 3. "Koden är klar" är inte "det gäller i drift"

A18 är mönsterexemplet: fixen är korrekt, deployad och fail closed — och svarar 503 för alla
eftersom hemligheten aldrig sattes. Roadmapen kallar den "🟡 kod klar", vilket är sant och
samtidigt vilseledande. Samma klass: A6 (pg_cron saknas på tre nivåer), A17 (18 av 53
funktioner), A21 (`mood_logs` städad, `interest_results` inte), H4 (rättad i `MyConsultant.tsx`,
kvar i `Resources.tsx`), A19 (koden klar 4 aug — nu verifierad grön i drift, punkten kan stängas).

**Motmedel:** varje punkt som kräver en dashboardåtgärd får en verifieringsrad med kommando och
förväntat svar (`→ HTTP 200`, inte `→ HTTP 503`), och den raden körs innan punkten stängs.

### 4. En städning som städades bort städar aldrig

Dödkoden har **växt**: 182 filer / 42 851 rader (4 aug: 175 / 41 878). Exklusive STA 32 799 mot
32 291. Ingenting av C16 är utfört.

Värre: **raderingspasset blockerar nu sig självt.** WCAG-svepet 5 augusti skrev aria-labels i
15 onåbara filer — 58 rader betalt arbete rakt in i dödkod, t.ex. `SwedenMap.tsx:355` i en
komponent med noll referenser. Det utlöste dödkodsskriptets färskhetsgrind och flyttade 8 076
rader från RADERA till UTRED. Fönstret öppnar tidigast **2026-08-12**, och varje nytt svep över
"hela src/" skjuter det sju dygn till. Sjätte gången samma klass träffar.

**Eslint-taket har 1 varnings marginal** (128 av 129). Nästa normala feature-commit kan fälla
`lint:ci`. Passet ger 32 varningars luft, sänker typfelen 468 → 363 och gradienterna 52 → 7.

### 5. Portalen är byggd för en volym den inte har

77 av 132 tabeller är tomma. 2 191 rader totalt, 29 MB. 50 AI-anrop sedan april — under en cent.
Sju aktiva användare på trettio dygn. Databasen svarar på 22,5 ms för konsulenten som faktiskt
har 30 deltagare.

Det som inte skalar är inte tekniken. Det är omdömet: fyra parallella aviseringslager, två
aktivitetsloggar, två måendetabeller, två intressetesttabeller, fem PDF-vägar, två
auth-implementationer, två renderingssystem med varsin designdefinition. Varje dubblett har
kostat minst en bugg.

---

## Premisser som föll

- **D13 ("coverage fäller CI")** — död. Coverage passerar lokalt på alla fyra mått
  (23,19/63,96/34,66/23,19 mot 18/60/30/18) och `exclude`-fällan är lagad. Orsaken är saknad
  Supabase-env i `test`-jobbet. Beslutet "sänk tröskeln eller skriv ikapp" behöver inte fattas.
- **"lint:schema täcker inte edge-funktionerna"** — fel, den gör det (722 filer). Luckan sitter i
  `insert`-nycklar och vydefinitioner i stället.
- **"Dev-servern duger för att granska AI"** — fel. `vite.config.ts:73-78` svarar
  `501 "AI-funktion X är inte mockad i dev"` för allt utom STA-mocken. All AI-granskning måste
  ske mot prod, annars mäter man en attrapp.
- **"Spara jobb är inte nåbart med tangentbord" (2026-08-04)** — avskrivet. Både tangentbord och
  Chromes a11y-träd visar knapparna som `ignored: false`. Verkligt men AT-beroende, inte blockerande.
- **"Konsulentvyn skalar inte"** — avskrivet. `EXPLAIN ANALYZE` mot den riktiga konsulenten med
  30 deltagare: 22,5 ms.
- **"LCP har regredierat kraftigt"** — avskrivet som mätartefakt (längre observationsfönster).
  Det jämförbara måttet "h1 synlig" är oförändrat. `/oversikt` TBT@4× **har** däremot regredierat
  322 → 522 ms.
- **"FAB-överlappen blockerar hårt överallt"** — nyanserat. På `/cv` blockerar CoachWidget "Nästa"
  bevisat (`tap()`-timeout). På 17 andra sidor är det friktion, inte hård blockering.
- **`[PERSONA-B]` i AI-svaren** — inte en saneringsläcka utan testdata i testkontots CV.
- **Hub-korten "är amber"** — nej, warm-neutral `stone-100`.

**Rättelse mot en av rapporterna (gjord vid syntesen, verifierad i koden):** `ai-lager.md` och
`sakerhet-gdpr.md` skriver "sex Perplexity-funktioner" och beskriver Perplexity som en direkt
tredjelandsmottagare. Det är **fem** funktioner (`grep -rln sonar supabase/functions`), och anropen
går via `OPENROUTER_API_URL` — Perplexity är alltså ett **underbiträde under OpenRouter**, inte en
egen mottagare med egen nyckel. Slutsatsen står kvar (oredovisat, bryter modellåsningen, hemadress
i en av dem), men den juridiska formuleringen ska vara underbiträde. En träff på `model: 'gpt-4'`
i `cv-analysis/index.ts:79` är en **kommentar** om historik, inte levande kod.

---

## Det som håller — verifierat, inte antaget

Det här är inte artighet; det är underlag för att inte laga sådant som fungerar.

**Säkerhet:** RLS på i 131 av 131 tabeller · alla 53 definer-funktioner har pinnad `search_path`
(stänger en hel eskaleringsklass) · noll IDOR i 28 endpoints, varje härleder user-id ur token ·
A16 stängd (eskalering ger `42501`) · A17 håller för sina 18 · A19 **verifierat grön i drift**
(HTTP 200) · A20 härleder exporttabellerna ur `information_schema` · A21 håller · bundlen läcker
bara anon-nyckeln · Sentry maskerar all text och alla fält · två `dangerouslySetInnerHTML`, båda
sanerade · noll `eval`.

**Publik yta:** 139/139 sitemap-URL:er svarar 200 · canonical korrekt på varenda en · JSON-LD
validerar · **noll axe-överträdelser** på 12 publika sidor × 2 breddpunkter · LCP 436–708 ms på
strypt Slow 4G · inga sourcemaps · K10:s lästider verifierade (132/133 rätt).

**Tillgänglighet sedan 4 augusti:** fokusstölden borta (activeElement=BODY på 22/22 sidor) · 0 av
35 formulärfält utan namn · unika `<title>` per rutt + "Du är nu på …"-annonsering ·
`prefers-reduced-motion` respekteras (248 element) · 0 px spill vid 200/400 % zoom · fokusring
5,46:1 · inga tidsgränser.

**Arkitektur och data:** routningen är konsistent (noll nav-länkar utan route, noll dubblerade
memberPaths) · `['application-stats']`-kollisionen är åtgärdad **med regressionsvakt** · alla 17
`setQueryData` skriver till nycklar deras egen hook äger · `cvs.skills` är objekt i 17 av 17
(ingen legacy-strängform kvar) · inga föräldralösa rader · alla tabeller har PK · schema-snapshoten
är exakt aktuell (135 objekt, 0 kolumndiff).

**AI:** modellåsningen håller på Vercel-vägen (34 gpt-oss, inget annat) · prompt injection avvärjd
på tre av fyra ytor · rate limit ger korrekt 429 + `Retry-After` · art. 9-grinden fail closed ·
tokenloggningen felfri · elva av förra granskningens nitton fynd verifierat betalda.

**UX:** två-lägessystemet håller · en hub-färg per sida i pastellsystemet · noll gradientknappar ·
noll overflow på 22 mätningar · UX24 (råa i18n-nycklar på `/my-consultant`) verifierat borta i
båda språken · **fokusläget är portalens bästa yta** — 13/13 sidor med lugna, mänskliga frågor.

---

## Nya punkter per spår

### Spår A — Juridik & säkerhet

| ID | Punkt | Storlek |
|---|---|---|
| **A22** | 35 definer-funktioner anropbara av `anon` (se Nu-listan). Åtgärd: `REVOKE EXECUTE … FROM PUBLIC` + explicita grants, sedan **mät** `has_function_privilege` | M |
| **A23** | Perplexity oredovisat underbiträde (fem funktioner via OpenRouter); hemadress skickas i `ai-commute-planner`. Beslut: redovisa eller avveckla | S + beslut |
| **A24** | "Ingen data lämnar EES" + fel biträde ("OpenAI") i FAQ och registreringens samtyckestext | S |
| **A25** | `CRON_SECRET` aldrig satt → `send-inactivity-warning` 503 för alla | S (Mikael) |
| **A26** | `interest_results` har kvar A21:s lucka: en `ALL`-policy med `with_check = NULL` upphäver hälsosamtyckets grind. **Femte gången** dubblettpolicy-mönstret träffar | S |
| **A27** | Art. 9-grinden gäller bara Vercel-vägen — **nio edge-AI-funktioner har ingen samtyckeskontroll alls** | M |
| **A28** | Rate-limit-identiteten tas från första `X-Forwarded-For`-värdet (klientstyrt) på sju publika AF-proxyer → i praktiken öppna | S |
| **A29** | CORS-kontrollen i edge-lagret sker **efter** att arbetet gjorts — `send-invite-email` hinner skicka mejlet före sin 403 | S |
| **A30** | Samtyckesregistret har **noll rader** för hälsa och wellness (art. 7.1 bevisbörda) | M |
| **A31** | CV och personligt brev ligger kvar i `localStorage` efter utloggning. Delade datorer är normalfallet för målgruppen | S |
| **A32** | Vercel-preview-CORS bevisat förfalskningsbar mot prod (`…-evilteam.vercel.app` reflekteras med `Allow-Credentials: true`) | S |
| **A33** | Repot är publikt och ett prod-konsulentkontos lösenord har legat i klartext i historiken (rullat; kontot lever). Trufflehog scannar tom diff | S + beslut |
| **A34** | Google Translate injiceras utan egen samtyckeskategori och laddas automatiskt vid återbesök — dagbokstext går till Google | S |
| **A35** | `javascript:`-href i AI-genererad markdown (`MarkdownRenderer.tsx:413`, egen parser utanför DOMPurify). Oförändrat sedan maj | S |

### Spår B — Ärlighet i produkten

| ID | Punkt | Storlek |
|---|---|---|
| **B19** | Startsidans falska nyckeltal (se Nu-listan) | S |
| **B20** | Tre fiktiva omdömen som "verkliga historier" | S |
| **B21** | `mockGenerateLetter` märkt "genererat med AI-stöd" — samma designbeslut i intervjusimulatorns rollblinda fallback och i LinkedIn-fallbacken som samtidigt säger "AI ej tillgänglig" och "genererat med AI-stöd" | S |
| **B22** | Chatboten hittar på bidragsregler; sju ords systemprompt utan sanningsregel | S |
| **B23** | Konsulentvyns fyra ljugande nyckeltal + `QNaN NaN` i uppdragsgivarens PDF | M |
| **B24** | "Exempeldata" skriver över deltagarens riktiga CV och autosparar utan ångra | S |
| **B25** | `ai-cover-letter`-edgen fick aldrig sanningsregeln som `personligt-brev` fick i C11 — fabricerar truckkort och mätetal. Callerlös men **deployad och nåbar** | S |
| **B26** | `profile-summary` saknar sanningsregel och skriver påhittad persona **till databasen** | S |
| **B27** | `kompetensgap` uppfinner "Nuvarande nivå" för kompetenser CV:t inte nämner, och ger 25 % resp. 22 % på identisk indata. Talet står i hjälteposition | M |
| **B28** | "AI av" (`ai_enabled = false`) stoppar bara 4 av 18 funktioner — bevisat live med HTTP 200 | S |
| **B29** | PII-saneringen finns bara i webbläsaren; direkt POST med personnummer gick till OpenRouter | S |
| **B30** | `AIAssistant` (påhittad intervjuprognos) och `AICoachAssistant` (fyra fiktiva deltagare) — "åtgärda idag" den 4 augusti, noll rader ändrade sedan dess | S/L |

### Spår C — Städning & dödkod

| ID | Punkt | Storlek |
|---|---|---|
| **C21** | Kör `dead-code.cjs --skriv --steg=barrels` **först** — 21 döda barrels, ~2 800 rader, noll risk, och efteråt hittar vanlig grep resten. Billigaste raden i hela granskningen | S (1 h) |
| **C22** | Andra lagret dödkod: **287 oanvända exporter i 92 levande filer** (`interviewService.ts` 11 av 12, `afTaxonomyApi.ts` 13, `lib/validators.ts` 11) | M |
| **C23** | 40 länkar till toppnivåer utan route sväljs tyst av catch-allen. Fyra är skarpa: `/jobs`, `/jobs?tab=saved`, `/cv-builder` (tomtillståndets enda CTA), `/spontaneous` | S |
| **C24** | Fem npm-paket utan levande användare (`autoprefixer` — Tailwind 4 prefixar själv — och `svgo` stod inte i C18) | S |
| **C25** | Två parallella auth-implementationer: `authStore` (63 filer) och `useAuth` med egen `onAuthStateChange`, som hela hub-sammanfattningslagret använder | M |

### Spår D — Skyddsnät & kvalitet

| ID | Punkt | Storlek |
|---|---|---|
| **D17** | Sätt Supabase-env i `test`-jobbet (se Nu-listan). **D13 avskrivs** | S |
| **D18** | Koppla loss coverage från `needs:` så build/Lighthouse/e2e får köra. En trendmätare ska inte kunna stänga av grinden som mäter om koden bygger | S |
| **D19** | `Security Scan` rött: fyra high i prod-beroenden (react-router CSRF) | S |
| **D20** | Gör `nav-smoke` fallbar och assertera tabell/kolumn i art. 9-grindens tester (fyra av sex mutationer överlevde) | S |
| **D21** | Trufflehog scannar tom diff på main. Pinna till SHA, scanna historiken en gång, kör `--since-commit HEAD~1` löpande | S |
| **D22** | Ge `client/api/*.js` eslint + typecheck + schemakontroll — förhöjda rättigheter, noll grindar, tre av fyra filer noll coverage | S |
| **D23** | Rätta pre-push-hooken **eller** CLAUDE.md — den kör fem av åtta grindar och inga tester | S |
| **D24** | Gör CI grön och sedan *required* på main. Så länge push = deploy och CI är permanent röd finns ingen mekanism mellan trasig commit och prod | S efter D17–D19 |

### Spår E — Prestanda

| ID | Punkt | Vinst | Storlek |
|---|---|---|---|
| **E17** | **P1** — `__vitePreload` ur jsPDF-chunken | −107,1 kB brotli på **varje** kall sidladdning (−30 % eager JS) | S |
| **E18** | **P3** — mallminiatyrer i 512×724 WebP | −800 kB på `/cv`; tar bort sidans 30,4 s LCP-element helt | S |
| **E19** | **P7** — skjut Sentry till efter `load` | −71,0 kB brotli före LCP på varje sida | S |
| **E20** | Fryst tak för **vad som hämtas före LCP** (inte bara statisk graf) — hindrar att E17/E19 kommer tillbaka | S |
| **E21** | **P2** — låt `useAuth` läsa `authStore`: −21 requests på Översikt (−49 %), kedjan 3 led → 1 | M |

E17–E19 är tillsammans **−178 kB brotli före LCP på varje sida** plus −800 kB på CV-sidan
— ca 3,6 s snabbare på 400 kb/s för mindre än en dags arbete. **Bygg inte virtualisering.**

### Spår F — Design/UX & tillgänglighet

| ID | Punkt | Storlek |
|---|---|---|
| **F18** | **Skip-länken blir aldrig synlig när den får fokus** — första tabbtrycket på varje sida. Tre konkurrerande regeluppsättningar: egen `.sr-only` i `accessibility.css:112` som via CSS-`@import` hamnar utanför Tailwinds `@layer utilities` | S |
| **F19** | **45 av 68 fokuserbara element utanför skärmen** på mobil och vid 400 % zoom — två off-canvas-lådor utan `inert`. Har vuxit till 50–55 per sida i Min vardag-området | M |
| **F20** | Tillgänglighetsredogörelsen påstår mätbart falska saker och saknar utvärderingsmetod + bedömningsdatum (formkrav, lag 2023:254) | S |
| **F21** | Åtta namnlösa ikonknappar på desktop (en av dem raderar dagboksinlägg) — tredje granskningen i rad. Plus fyra dagboksflikar och två CV-knappar som tappar namn på mobil | S |
| **F22** | Registreringens valideringsfel når inte hjälpmedel: 0/8 `aria-invalid`, 0/8 `aria-describedby`, inget `role="alert"`. Verifierat på prod — första sidan en ny deltagare möter | S |
| **F23** | 29 kontrastbrott i samma tre familjer som i juli · 46 nästlade interaktiva noder · rubriknivåhopp på 9 av 11 sidor · `<main>` saknas på publika SPA-sidor | M |
| **F24** | Engelskt läge: menyn är översatt, sidinnehållet svenskt på **11 av 21 sidor**. Bestäm vad läget lovar (UX17 etapp 5) | M + beslut |
| **F25** | Två flytande widgets täcker innehåll på 17 av 19 verktygssidor, inkl. GDPR-kontroller. Slå ihop till ett piller med två val | S |
| **F26** | `/jobb`-hubben saknar två av nio verktyg (`/linkedin-optimizer`, `/international`) — på mobil bara nåbara via direkt-URL. Mobilmenyn kör dessutom den **gamla platta `navGroups`-modellen** parallellt med bottennavets 5 hubbar | M |
| **F27** | Modaler monteras utanför `data-domain` och får fel hub-färg | S |
| **F28** | LIX-mätning: hubbarna 35–37 (rätt ton), men `/skills-gap-analysis` 62, `/job-search` 59, `/guider/cv-grunder/` 51. Sätt tak LIX 40 för UI, 45 för guider, mät i CI som gradient-baseline | M |

### Spår H — Schemaintegritet

| ID | Punkt | Storlek |
|---|---|---|
| **H18** | Ingen schemaläggare på tre nivåer (se Nu-listan) | S + M |
| **H19** | Utöka `check-schema-drift.cjs` med `insert/update/upsert`-nycklar — den enda lucka som bevisligen släppt igenom skarpa buggar, fyra på en eftermiddag | S |
| **H20** | AI-teamets "skapa uppgift i kalendern" (`AgentChat.tsx:323`) skickar fem obefintliga kolumner och utesluter NOT NULL-fältet `date`. Kan **strukturellt aldrig** lyckas; felet sväljs av `if (!error)` | S |
| **H21** | Låt grinden läsa vydefinitioner — F11–F15 sitter alla i `consultant_dashboard_participants`, giltig SQL och därför osynlig för referenskontroll | M |
| **H22** | "Räknar-på-en-limit"-lint: `.limit(n)` följt av `.length` presenterat som antal. Två instanser i samma fil | S |
| **H23** | Migrationsliggaren i prod är osann: 57 poster mot 132 filer, stannar 2026-04-16, och två *registrerade* migrationer saknar sina objekt. Bestäm dess status — varken sann eller uttalat övergiven är sämst | S + beslut |
| **H24** | `RETENTION-POLICY.md:47` ✅ på gallring som inte sker (475 av 485 rader äldre än ett dygn, äldsta 107 dagar; `check_rate_limit` innehåller ingen DELETE) | S |
| **H25** | G9 tog bort poängmaskineriet i klienten — RPC:n `log_user_activity` skriver fortfarande till `user_gamification`, senast idag kl. 14:58 | S |
| **H26** | 91 av 92 profiler har `ai_enabled = true` men bara 18 har `ai_consent_at`; samtyckesloggen har slutat skrivas | M |

### Spår K — Synlighet

| ID | Punkt | Storlek |
|---|---|---|
| **K11** | **Varje CTA på de 138 prerenderade sidorna leder till en skyddad route.** `App.tsx:116` gör `<Navigate to="/">` utan `returnTo` → gästen dumpas tyst på B2B-säljsidan. Byggrinden `validateRoutes()` kollar att routen finns, inte att en gäst kan nå den | S |
| **K12** | Startsidan länkar inte till någon av de 137 prerenderade sidorna — de är föräldralösa från rot. `<title>`/OG säljer B2C medan sidan är B2B | S |
| **K13** | Startsidan är enda sidan som failar CWV (LCP 4 368 ms, noll serverrenderat innehåll). Cookierutan täcker primär-CTA på mobil (hit-test: `blocked: true`). Två CTA:er ("Boka 30 min demo", "Se konsulentvyn") skrollar bara | M |
| **K14** | Kannibalisering: två parallella lättläst-slugfamiljer och två identiska `<title>`. Varje URL som inte finns svarar 200 med indexerbar SPA-shell (soft-404) | S |
| **K15** | Guideindexet använder inte `category_key`/`difficulty` som redan finns i datat. 13 kategorisidor = bättre navigering + 13 nya indexerbara sidor | M |

---

## Utvecklingsförslag — vad portalen borde kunna men inte kan

Rangordnat efter nytta för målgruppen, inte efter teknisk elegans.

**1. Låt verktygen provas utan konto.** Den starkaste konverteringen för den här målgruppen är
inte ett löfte utan ett resultat. En publik CV-byggare där tre fält ger en riktig PDF-förhandsvisning
— och först då ber om konto för att spara — vänder hela tratten rätt och löser K11 på köpet.
`api/cv-pdf.js` är redan rate-limitad.

**2. Ge AI:n de svenska stödsystemen.** Den skarpa karriärplanen för en person med tre års
arbetslöshet och ryggbesvär rekommenderade "investera i en bra kontorsstol" och "en onlinekurs på
Coursera". Ingenting om arbetshjälpmedel via AF (som betalar stolen), lönebidrag, arbetsträning,
Komvux eller yrkesvux — allt kostnadsfritt och riktat till exakt den personen. AI:n ger
amerikanska medelklassråd till någon utan inkomst. **En dags arbete i tre systemprompter.**

**3. En redaktionellt granskad faktabank för regelfrågor.** Det mest efterfrågade en arbetssökande
behöver är svar på "vad händer med min ersättning om jag …". I dag gissar portalen (B22). Trettio
granskade frågor om a-kassa, aktivitetsstöd, lönebidrag, nystartsjobb och arbetshjälpmedel,
injicerade i prompten med källänk i varje svar. Vid 50 anrop sedan april är tokenkostnaden noll.

**4. Sluta räkna i ansökningar per vecka.** Karriärplanen sa "minst 5 jobb per vecka", ett annat
svar sa 10. För någon som skriver att hen knappt orkar är en kvot det sämsta möjliga första steget
— och det bryter mot DESIGN.md §2. Förbjud kvoter i prompten; be om *nästa minsta steg*.

**5. Kalibrera efter energi, inte bara efter yrke.** `useAITeamContext` skickar redan energinivå
till arbetsterapeuten. Ingen annan funktion använder den. Låg energi en vecka borde ge en
karriärplan med tre steg, inte fem. **Datan finns; kopplingen saknas.** Konkret form: ett tredje
val i AI-teamets sidopanel — "Ett steg i taget" / "Några förslag" / "Ge mig hela bilden", med det
första som default.

**6. Ett kontaktregister som stämmer — störst effekt av allt för konsulenten.** En konsulent ringer,
träffar folk fysiskt, skickar SMS. Portalen har ingen väg att registrera något av det, så den kan
aldrig svara på frågan varje konsulent ställer sig varje morgon: *vem har jag inte hört av mig
till?* En "Jag har haft kontakt"-knapp med typ och fritextrad, som skriver `last_contact_at` och en
journalrad, gör hela triagelagret (KPI, Min dag, filter, detaljvy) fungerande på en gång. **Storlek M.**

**7. Kedja ihop deltagarspåret.** Verktygen är öar. Ett sparat jobb borde bära en synlig
nästa-åtgärd hela vägen: sparat → skriv brev (jobbet förifyllt) → anpassa CV mot annonsen → öva
intervjun för just den rollen → lägg i pipen. Delarna finns; länkarna saknas. `/cover-letter` gör
det rätt — ingen annan gör det.

**8. Visa vad i AI-utdatan som har täckning och vad som är gissat.** En färgmarkering av vilka
påståenden som kommer ur användarens egna uppgifter låter hen stryka "livsmedelssäkerhetsrutiner"
innan brevet skickas. Det är också det mest konkreta sättet att uppfylla AI Act art. 50 på riktigt
— en märkning som visar *var* AI:n fyllt i, inte bara att den varit inblandad.

**9. Låt konsulenten vara den mänskliga granskningen på riktigt.** `AI-ACT-CLASSIFICATION.md`
hävdar att mänsklig granskning finns eftersom "konsulent kan granska". Det finns ingen knapp för
det. En "Be min konsulent titta på det här"-åtgärd gör påståendet sant och ger deltagaren en väg
vidare när svaret känns fel. `get_my_consultant`-RPC finns sedan UX12. **En dag.**

**10. Kuratera Övningar i stället för att lista dem.** 119 kort och 40 000 px är inte ett
designproblem utan ett produktproblem: sidan har inget centrum. DESIGN.md §8 föreskriver redan
lösningen ("För dig idag: 3 övningar"), och RIASEC-profilen plus måendeloggen finns som signal att
välja ur.

**11. Lyft rubrikerna med fokuslägets ordlista.** Fokusläget skriver "Vad känns viktigt i din
vardag just nu?" där normalläget skriver "Övningar". Skillnaden är inte teknik utan att någon skrev
om rubrikerna en gång. Fokuslägets 13 rubriker är en färdig ordlista för de ~15 etikettrubrikerna
i normalläget.

**12. Mät om AI:n hjälper.** 50 anrop på fyra månader betyder att ingen vet om något av det
fungerar. En rad i `ai_usage_logs` för "användaren behöll / kastade utdatan" ger den första
riktiga kvalitetssignalen — och underlag för bias-testet som AI-ACT-dokumentet kräver men som
aldrig gjorts.

**13. Datamodellen: en sanning per begrepp, och den ska vara en händelselogg.**
`user_activity_log` (738 rader, den enda tabellen som fyllts kontinuerligt sedan mars) är den enda
strukturen som bär "vad har hänt". Låt hubbarnas senaste-händelse och konsulentens aktivitetsbild
läsa **en** logg i stället för att var och en räkna om sin egen domän. Skapa dessutom tillståndsrader
vid signup, så att "ingen rad" betyder ett riktigt fel i stället för både "inte börjat" och "gick fel".

---

## Vad som inte granskades

Sammanställt ur alla tio rapporterna, så nästa granskning vet var luckorna är:

- **Riktig skärmläsare.** Ingen NVDA-, VoiceOver- eller TalkBack-session. Allt om skärmläsare
  bygger på Chromiums a11y-träd och axe, som fångar ~⅓ av WCAG-problemen. **Största enskilda luckan** —
  och just det området påstår redogörelsen är fyllt.
- **Mörkt läge.** All kontrast- och layoutmätning är gjord i ljust läge. F1 ligger som öppet beslut.
- **Konsulentvyn med 30 deltagare.** Kontot finns i prod men lösenord saknades; allt UI testades med
  1 deltagare. Sortering, bulkmarkering och volymbeteende är otestade.
- **Faktakontroll av guideinnehållet.** Struktur och metadata är kontrollerade på alla 139 URL:er,
  men inga påståenden om AF-regler, LAS eller ersättningsnivåer är sakgranskade — och människor
  fattar försörjningsbeslut på dem.
- **Search Console.** Ingen indexeringsstatus, så kannibaliseringsparen kan inte avgöras ännu.
- **Skrivande verifiering av A22.** De två raderande definer-funktionerna anropades inte som anon.
- **Konsulentrollen i skarp HTTP-testning** och `verify_jwt` per deployad edge-funktion.
- **Intresseguidens resultatvy** (RIASEC-matchning mot 80+ yrken) — testet är 34 frågor, agenten kom
  till 17. Rekommenderas som eget uppdrag.
- **`/wellness` → Akut stöd.** Den enda ytan i Min vardag där ett fel kan få allvarliga följder.
- **AI-teamets övriga fyra agenter.** Motivationscoachen är art. 9-klassad som arbetsterapeuten.
- **Fältdata.** Ingen RUM/CrUX finns; alla prestandatal är labb.
- **Playwright skarpt i CI** — jobbet har aldrig kört, så 74/94-skippsiffran är härledd, inte mätt.

---

## Källor

| Rapport | Rader | Område |
|---|---:|---|
| `review-2026-08-09/publik-yta.md` | 559 | Startsida, /verktyg/, 139 guider, SEO, CWV, konvertering |
| `review-2026-08-09/visuell-jobbsok.md` | 352 | Deltagarens jobbsökarspår, desktop + mobil |
| `review-2026-08-09/visuell-karriar-vardag.md` | 645 | Karriär, Resurser, Min vardag, AI-teamet skarpt |
| `review-2026-08-09/tillganglighet.md` | 577 | WCAG 2.1 AA, axe × 48 sidvyer, tangentbord, LIX |
| `review-2026-08-09/konsulent-prestanda.md` | 652 | `/consultant` + prestanda (P1–P9) |
| `review-2026-08-09/arkitektur.md` | 755 | Nåbarhet, dödkod, barrels, beroenden |
| `review-2026-08-09/sakerhet-gdpr.md` | 540 | RLS, definer-funktioner, endpoints, retention, tredjeland |
| `review-2026-08-09/schema-data.md` | 844 | Prod-schema, datakvalitet, räknare, migrationsliggare |
| `review-2026-08-09/ai-lager.md` | 1 004 | 31 skarpa AI-anrop, prompter, kostnad, AI Act |
| `review-2026-08-09/test-ci.md` | 641 | CI-historik, grindar, mutationsbevis, coverage |
| `review-2026-08-09/bilder/` | 110 filer | Skärmdumpsbevis |
