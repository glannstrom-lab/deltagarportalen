# Portalgranskning 2026-08-04 — tio agenter, kod och webbläsare

> **Körning:** tio parallella granskare. Fem läste kod och prod-databasen (säkerhet/GDPR, schemaintegritet, arkitektur/dödkod, AI-lagret, test & kvalitetsgrindar). Fem körde portalen i Playwright mot ett lokalt bygge med ett riktigt inloggat konto (desktop mot DESIGN.md, mobil 390×844 med hit-tester, tillgänglighet med axe + tangentbord, språk sv/en, prestanda mot produktionsbygge).
>
> **Fullständiga rapporter med allt bevismaterial:** `docs/review-2026-08-04/` (tio filer, ~4 900 rader). Den här filen är syntesen.
>
> **Vad som är verifierat av vem.** Varje fynd nedan kommer från en agentrapport med fil:rad, SQL-utdata eller mätvärde. Fynden markerade **✓ egenverifierad** har jag kontrollerat själv i en separat körning innan de skrevs in här — resten står på respektive rapports bevis. Samma regel som i spår G/H/I: en rapport är en hypotes tills den mätts.

## Åtgärdat samma dag (2026-08-04, efter Mikaels beslut)

Rapporten nedan beskriver läget **vid granskningen**. Säkerhetspaketet togs direkt efteråt och är kört mot prod:

| # | Åtgärd | Verifiering |
|---|--------|-------------|
| **A16** | Rättighetseskaleringen stängd (`20260804100000`) | Eskalering ger `42501`; legitim profiluppdatering fungerar; två UPDATE-policyer kvar, båda guardade |
| **A17** | 18 `SECURITY DEFINER`-funktioner grindade + `REVOKE` (`20260804110000`, `20260804120000`) | Anon nekas; egen data OK; annans data `Forbidden`. Andra migrationen behövdes för att `PUBLIC` hade EXECUTE |
| **A20** | Dataexporten härleds nu ur schemat (`20260804140000`) | 7 → **103 nycklar**; dagbok, mående, anpassningar, datadelning och aktivitetslogg med |
| **A21** | Samtyckesgrind på `mood_logs` + blanket-INSERT på storage + bucketgränser (`20260804130000`) | En INSERT-policy kvar på mood_logs (med samtycke), två på storage (bucket + ägare), inga NULL-gränser |
| **A18** | Cron-auth i `send-inactivity-warning` (ny `_shared/cronAuth.ts`) | Kod klar, fail closed. **Kräver `CRON_SECRET` + deploy** |
| **A19** | Art. 9-grinden får en tokenbärande klient | Kod klar + mutationstestad regressionsvakt. **Kräver deploy** |

Grindarna efter arbetet: 0 eslint-fel (127 warnings, tak 129), 468 strict-typfel (på taket), 52 gradienter, schemadrift ren, **935 tester** (2 nya), bygget grönt.

## Baslinjen innan granskningen (mätt 2026-08-04)

Alla sju lokala grindar gröna: **127** eslint-warnings (tak 129), **0** kritiska typfel, **468** strict-typfel (exakt på taket), **52** gradienter (tak 52), schemadrift ren över 717 filer, **933** tester gröna, bygget går igenom.

Det gör nästa mening obekväm: **CI har ändå varit rött**, och tre av de sju grindarna mäter något annat än de utger sig för. Se D13–D14.

---

## 1. Nu-listan — de nio som bör tas först

Rangordnade efter skada × sannolikhet, inte efter hur lätta de är.

| # | Fynd | Varför först | Storlek |
|---|------|--------------|---------|
| **A16** | **Vilken inloggad deltagare som helst kan göra sig till SUPERADMIN** ✓ egenverifierad | Total systemkompromettering. `profiles` har tre permissiva UPDATE-policyer; `Users can update own active_role` har `WITH CHECK (auth.uid() = id)` utan rollkontroll. Permissiva policyer OR:as, så den upphäver `check_role_change_allowed` i de två andra. Öppnar 14 policyer över 11 tabeller, inklusive alla 92 profiler och revisionsloggarna. **Migrationen ligger färdig och väntar på ja:** `supabase/migrations/PENDING_20260804_fix_profiles_role_escalation.sql` | **S** (en rad) |
| **A17** | **18 `SECURITY DEFINER`-funktioner tar `p_user_id` utan `auth.uid()`-kontroll, och `anon` får köra dem** | Bevisat i rapporten: som anon ger direkt `select` 0 rader, men `get_application_stats('<annans uuid>')` returnerar dennes data. Nio läser, nio skriver i andras namn. RLS är alltså rätt uppsatt och kringgås ändå | **M** |
| **A1** | **OpenRouter-nyckeln ligger kvar i 13 commits, fortfarande inte roterad** | Öppen sedan 28 maj. Ligger hos Mikael, 5 minuter i dashboarden | **S** (Mikael) |
| **A19** | **Art. 9-samtyckesgrinden (UX13) är trasig i drift** | Grinden frågar med anon-klient utan användartoken → `.single()` ger 0 rader → 403 för *alla*, även de 17 med samtycke. Tre AI-funktioner är alltså döda i produktion sedan 3 aug. Testet mockade bort felet. **Fail closed räddade oss** — men funktionen är otillgänglig, inte skyddad | **S** |
| **D13** | **CI är rött och har varit det** ✓ egenverifierad | `npm run test:coverage` ger exit 1 (functions 23,62 % mot tröskel 30 %). `build` har `needs: [lint-and-typecheck, test]` → **build, lighthouse, e2e-smoke och e2e-authenticated har inte kört**. Kvar som skydd: lint + security | **S** |
| **B10** | **Konsulentvyn visar fyra påhittade deltagare som AI-insikter** | `Consultant.tsx:52` monterar `AICoachAssistant`: "Maria Lindberg har inte loggat in på 12 dagar" som röd högprioritetsvarning. Deltagarna finns inte. En arbetskonsulent kan fatta beslut om en människa utifrån detta | **M** |
| **A6/H11** | **pg_cron är inte installerat i prod** | `pg_extension` → 0 träffar, cron-schemat finns inte. Ingen gallring (5 AI-loggar är 118 dagar gamla mot 90-dagarspolicyn), inga inaktivitetsmejl, inga jobbaviseringar. RETENTION-POLICY och Art 30-registret beskriver automatik som inte sker — det är ett dokument som säger fel sak till en tillsynsmyndighet | **S** (Mikael) + **M** |
| **A18** | **`send-inactivity-warning` har ingen auth alls** | Service role, skickar mejl, öppen för vem som helst. Latent i dag eftersom kön är tom — **aktiveras av A6**. Måste fixas *före* pg_cron slås på | **S** |
| **UX24** | **`/my-consultant` visar 17 råa i18n-nycklar och tre i18next-felmeddelanden som rubriker** | Hittad oberoende av två granskare. "key 'myConsultant.messages (sv)' returned an object instead of string" står som rubrik. Syns bara för konton som *har* konsulent — därför oupptäckt i alla tidigare svep. 31 deltagare har konsulent | **S** |

---

## 2. Säkerhet och GDPR

Full rapport: `review-2026-08-04/sec-gdpr.md` (33 fynd).

**Det röda temat: permissiva dubblettpolicyer neutraliserar de guardade, tyst.** Samma klass som A7 och A10, men då städades bara de granskade tabellerna. Tre nya fall:

- **A16** — `profiles`, rollökning (se nu-listan). ✓ egenverifierad
- **A21** — wellness-samtyckets DB-grind på `mood_logs` är neutraliserad av en dubblettpolicy. Grinden finns, den gäller bara inte.
- **A21b** — blanket-INSERT på `storage.objects`.

Övrigt av vikt:

- **A17** — 18 anon-anropbara `SECURITY DEFINER`-funktioner utan `auth.uid()`-kontroll (se nu-listan).
- **A19** — art. 9-grinden frågar utan användartoken och blockerar alla (se nu-listan).
- **A20** — **dataexporten saknar dagbok, mående och hälsodata.** Art. 15.3 uppfylls alltså inte i dag.
- **A6/H11** — ingen gallring körs (se nu-listan).

**Det som håller vid granskning:** RLS är påslaget överallt och håller mot anon; alla 64 `SECURITY DEFINER`-funktioner har pinnad `search_path`; noll secrets i klientbundlen (JWT:erna avkodade — bara `role: anon`); A11, A12, A13 och A15 håller.

## 3. Schema- och dataintegritet

Full rapport: `review-2026-08-04/schema-data.md`.

Schemadriften är **noll** — snapshoten stämmer mot prod (132 tabeller + 3 vyer). Grinden gör sitt jobb. Problemet ligger i det grinden per definition inte kan se: **73 av 132 tabeller har 0 rader**, och koden läser flera av dem som om de vore fyllda.

- **H12** — **notifikationsklockan kan strukturellt aldrig visa något.** Monterad i TopBar på varje sida, läser `notifications` (0 rader), och `createNotification` har noll anropare. Fyra parallella aviseringslager, alla tomma, ett helt omonterat.
- **H13** — **intervjusimulatorn skriver till localStorage medan Söka jobb-hubben läser DB.** `InterviewSimulator.tsx:459` → `saveSimulatorSession`; `useJobsokHubSummary.ts:62` läser `interview_sessions` (0 rader). Deltagarens övningar syns aldrig i hubben och försvinner vid enhetsbyte.
- **H14** — **`user_activities` har noll skrivare men tre läsare.** `useDashboardData:269,306` bygger ansökningsstatistik på tabellen → alltid 0.
- **H15** — `useAITeamContext.ts:134` läser `career_goals.skills`, en nyckel som inte finns i prod. `career_goals` är dessutom tomt `{}` i 91 av 92 profiler, och `if (profile.career_goals)` är truthy för alla.
- **H16** — **96 tysta fel** i `client/src` (63 × `if (error) → return []`, 33 × `catch → return []`). Värst: onboardingchecklistan säger "du har inget CV" vid nätverksfel.
- **H17** — React Query: UX8-fixen håller (inga `setQueryData` skriver fel form längre). Två nya: `['coverLetters']` i `FocusCoverLetter.tsx:189` är en föräldralös invalidering (rätt nyckel är `['cover-letters']`), och **fem nycklar hämtar samma CV** men bara `['cv']` invalideras vid autospar → jobbmatchningen kör på gammalt CV i upp till fem minuter.

**Gratis beslut:** H8:s sista oavgjorda par, `personal_brand_audit` vs `personal_brand_audits`, är *båda* tomma. Ingen datamigrering krävs — välj ett namn och droppa det andra.

## 4. Ärlighet i produkten — spår B lever fortfarande

Full rapport: `review-2026-08-04/ai-lager.md` (20 fynd).

Spår B städade fejk-AI på de ytor granskningen 2026-07-10 tittade på. Den här körningen hittade fyra till, alla monterade i prod:

- **B10** — `AICoachAssistant` i konsulentvyn: fyra hårdkodade deltagare som inte finns, presenterade som AI-insikter med prioritetsfärger. Chatten är nyckelordsmatchning med simulerad tänketid. Inget AI-anrop sker.
- **B11** — `AIAssistant` (monterad på Övningar) kör på tre hårdkodade fejkaktiviteter och levererar "Du är 40 % mer aktiv än förra månaden", "Intervju inom X dagar (konfidens Y %)", "tisdagar ger 3x fler svar", "+10 % ATS-score". Allt märkt "Din AI-assistent".
- **B12** — intervjusimulatorn sätter `rating: resultat.rating || 3` och `feedback: 'Bra svar!'` (`InterviewSimulator.tsx:347`) — ett betyg AI aldrig gav, som propagerar till det visade snittbetyget.
- **B13** — arbetsmarknadstillväxt är `Math.random()` på två ställen (`af-trends:106`, `IndustryRadarSection.tsx:76`) och visas **under** AI-märkningen.

Tre till som inte är fejk men lika allvarliga:

- **B14** — `cv-writing`-promptens `quantify`-instruktion **beordrar** modellen att hitta på siffror i användarens CV, och systemprompten förbjuder platshållare. Det är B9-buggen igen, men inbyggd i prompten med flit.
- **B15** — `AgentChat.tsx:193` går rå `fetch` förbi `callAI` → **PII-saneringen körs aldrig på portalens mest använda AI-yta.** Dokumentationen påstår motsatsen.
- **B16** — `ART9_FUNCTIONS` saknar `ai-team-chat`, som skickar energinivå och `supportGoals.challenges` till arbetsterapeut-agenten. Åtta levande AI-ytor saknar art. 50-märkning.

**Modell-låsningen håller** utom `cv-analysis` (hårdkodad `gpt-4` mot OpenAI, ingen rate limit, noll anropare) och en läcka via `AI_MODEL_HAIKU` i `ai.js:1152`.

**Validering:** 5 av 8 JSON-funktioner Zod-valideras. Ovaliderade: `intervju-simulator`, `sta-doa-sammanfattning`, `profile-summary`. `sta-week-summary` saknar `parseJson` trots att prompten kräver JSON — exakt samma bugg som B8 hittade i `sta-document-draft`.

## 5. Arkitektur — 32 291 rader odokumenterad dödkod

Full rapport: `review-2026-08-04/arkitektur.md`.

**175 filer / 41 878 rader nås inte från `main.tsx`** — 18 % av `client/src`. 9 587 av dem är den medvetet pausade STA-modulen. Resten, **32 291 rader, är odokumenterad dödkod.**

Anledningen till att tidigare granskningar missat den: **20 barrel-filer, alla döda, håller underträden vid liv för en vanlig importsökning.** `hooks/index.ts` ensam håller 2 651 rader. Hela `components/dashboard/` är dött (17 av 17 filer, 3 182 rader) ✓ egenverifierad — och `CLAUDE.md`s komponentkatalog listar tolv av dem som levande, plus fyra döda `ui/`-primitiver.

**Betalt arbete som landade i döda filer, tre bekräftade fall:** UX8 styrde om `useUnifiedProgress.ts:509` (död fil), I5 betalade 43 av 216 typfel i `utils/validation.ts` (noll importörer), och `accountApi.ts` + elva tester dubblerar en kontoradering som i praktiken ligger i `DeleteAccountSection.tsx:199`.

**Ett raderingspass sänker alla tre frysta tak samtidigt:**

| Tak | Nu | Efter radering | Varför |
|-----|-----|----------------|--------|
| Gradienter | 52 | **7** | 43 av 52 sitter i döda `CVTemplates.tsx` |
| Strict-typfel | 468 | **364** | 104 ligger i döda filer |
| Eslint-warnings | 127 | **96** | 31 ligger i döda filer |

Noll risk, inget levererat ändras. Inget annat på planen är i närheten per timme. **Varning:** TS2339 är 101 av de 468 och är samma felklass som avslöjade UX14 — gå igenom dem mot verklig data innan de betas av mekaniskt.

**Två färdigbyggda funktioner är helt onåbara** — jobbdelning deltagare↔konsulent (792 rader) och energifunktionen (1 351 rader). Det är produktbeslut, inte städning: montera eller radera.

**Konsistens:** konsulentmodulen går förbi `consultantService.ts` i **64 direkta `.from()`-anrop** över 14 filer, så D11:s auth-guards och felhantering täcker en tredjedel av vyn. `CVBuilder.tsx` och `Profile.tsx` står utanför `PageLayout` — UX16 var exakt den buggen.

**Beroenden utan användare:** `svgo`. `xlsx` (~978 kB), `pdf-lib` och `papaparse` når bara dödkod.

## 6. Skyddsnätet — grindarna mäter inte det de utger sig för

Full rapport: `review-2026-08-04/test-kvalitet.md`.

- **D13** — **CI är rött.** ✓ egenverifierad. Coverage-tröskeln fäller `test`-jobbet, och `build` väntar på det. Branch-underskottet är dessutom ett artefaktfel: `exclude`-listan i `vitest.config.ts` ersätter vitests defaults, så 238 filer i `client/dist/assets` räknas som 0 %. Rensat blir branch 60,34 (klarar) och functions 26,81 (äkta underskott).
- **D14** — **e2e testar fel sidor.** ✓ egenverifierad. Appen är HashRouter, men `cv`, `job-search`, `cover-letter` och `dashboard` gör `page.goto('/cv')` utan hash → laddar Översikt, och `toHaveURL(/\/cv/)` matchar ändå eftersom pathnamnet stämmer. **57 tester testar Översikt i tron att de testar verktygssidor.** Därtill: 74 av 94 tester i `e2e-authenticated` skippas tyst utan secrets och jobbet rapporterar grönt; LCP-vakten läser dev-DOM och aldrig `dist/index.html`; STA-regressionsvakten är gated på ett secret som inte finns och har aldrig kört.
- **D15** — **tre tester asserterar prod-buggar som korrekt beteende:** `consultantService.ts:637` skriver `.update({status})` till `consultant_participants`, som inte har någon `status`-kolumn (konsulentens massändring har aldrig fungerat); `useMinVardagHubSummary.ts:59` läser konsulenten via embed som RLS blockerar (UX12 igen — testet låser fast förbigåendet av `get_my_consultant()`); `useOnboardedHubsTracking.ts:33` skriver över sin egen array vid varje hubbesök.
- **D16** — **buggklassen som går rakt genom alla sju grindarna:** "objektet finns, typerna stämmer, men läsningen eller skrivningen ger inget i drift" — RLS-blockerad läsning, kolumn som saknas i en insert/update-payload, kolumn läst via `select('*')`. `lint:schema` undantar payloads uttryckligen och modellerar inte RLS alls.

**Föreslagna nya grindar,** rangordnade efter fångst per krona:

1. **Nåbarhetsgrind** — vad når `main.tsx`? Hade fångat de tre fallen av betalt arbete i död kod. Skript finns i arkitekturrapporten.
2. **G-A: utöka `lint:schema`** med payload-nycklar (insert/update) och embed-RLS — ta in `pg_policies` i snapshoten. Hade fångat D15:s alla tre.
3. **G-B: tautologi-lint med fryst tak** — tester som asserterar mot sin egen mock.
4. **Eager brotli-budget med fryst tak** — E13 har redan kommit tillbaka en gång bakom en kommentar som påstod att den var löst.

Noterat: `client/api/*.js` — inklusive art. 9-grinden — får varken eslint-regler eller typecheck. Det är där A19 kunde gömma sig.

## 7. Visuellt och designsystemet

Full rapport: `review-2026-08-04/visuell-desktop.md` (34 sidor + skärmbilder).

**Först det som faktiskt håller:** två-lägessystemet är genomfört med disciplin. Alla fem hubbar har rätt pastell-hero, 27 av 29 verktygssidor har `#F5F4F0` med 4 px hub-kant i rätt solid färg, noll gradient-knappar, noll horisontell overflow, noll konsolfel på 33 av 34 sidor. DESIGN.md v3.0 har landat i koden.

- **UX24** — `/my-consultant` (se nu-listan).
- **UX25** — **Min vardag säger "Inte tilldelad" trots att konsulent finns.** `useMinVardagHubSummary.ts:59` gör en direkt join mot `profiles` som RLS blockerar. Portalens egen kod varnar ordagrant för detta i `myConsultantApi.ts:10-12`; hubben missade UX12:s migrering till RPC:n.
- **F12** — **"Tips" och "Mina samlingar" täcker innehåll på 29 av 34 sidor.** Två fixed piller från `Layout.tsx:143-146`; ingen sida kompenserar med padding. Uppmätt döljer de bland annat "Inga ansökningar", "Byt profilbild" och STAR-instruktionen.
- **F13** — **två onboarding-modaler öppnar sig själva i samma session** (`/cv` 7 steg, `/profile` 4 steg) från två olika komponenter. `/cv` visar dessutom "Steg 1 av 7" och "Steg 1 av 6" samtidigt.
- **F14** — **nollor och färgconfetti.** `/exercises` har "0 Påbörjade / 0 Aktiva" i KPI-storlek i fyra färger; `/resources` tre nollor och fyra knappfärger; `/personal-brand` fyra "0 %". `/knowledge-base` renderar 13 kategori-tiles i fem hub-färger (`KnowledgeBase.tsx:73-79`) — precis den regel §4 finns för att stoppa. Dagboken har `🔥 1 dagar` (streak-counter, förbjuden i §1, plus fel pluralform).
- **F15** — `/knowledge-base` saknar helt verktygssidans header (`PageLayout title=""`).
- **Dokumentkonflikt att avgöra:** `/profile` får mint i koden medan DESIGN.md §3 placerar den i Min vardag (lavendel). Båda är "sanning" i dag.

## 8. Mobil

Full rapport: `review-2026-08-04/visuell-mobil.md` (79 skärmbilder, hit-test med fem provpunkter per knapp).

**Regressionskontroll av gårdagens fixar:**

| Fynd | Status | Mätning |
|------|--------|---------|
| UX10 cookiebanner vs bottennav | ✅ **håller** | 0/5 blockerade (var 5/5), båda viewporterna; riktig `tap` navigerar |
| UX16 CV-knapprad vs bottennav | ✅ **håller för navet** | 0/5 blockerade — men införde UX26, se nedan |
| UX23 cookiebanner vs inloggningsknapp | ⬜ **kvarstår oförändrat** | 5/5 blockerade, och `tap()` **timeoutar** — knappen går inte att trycka |

**Nya fynd:**

- **UX26 (HÖG, regression från i går)** — **CoachWidget-knappen täcker "Nästa" i CV-byggaren.** UX16 flyttade knappraden upp 64 px (`CVBuilder.tsx:1312`) rakt in under widgetens `bottom-20` (`CoachWidget.tsx:142`). 2/5 provpunkter blockerade inklusive centrum, riktig tap timeoutar, 82×54 px överlapp = 58 % av knappen. Före fixen fanns 5 px mellanrum.
- **UX27 (MEDEL–HÖG)** — **tabbfällan bekräftad med riktiga Tab-tryck:** 9 av de 12 första tabbstoppen hamnar utanför skärmen. Två drawers, `visibility: visible`, `pointer-events: auto`, inget `inert`/`aria-hidden`, 32+4 tabbara element. `Layout.tsx:246` och `:340`. Fix = en attributrad per drawer.
- **UX28 (MEDEL)** — fyra 48×48-ikoner i headern med exakt **2 px** mellanrum på 31 av 33 sidor (`Layout.tsx:198`, `gap-0.5`). 76 px oanvänt utrymme finns bredvid.
- **UX29 (MEDEL)** — 400 kbit/s mot prod-bygget: ~10 s statisk splash utan framdrift, sedan ~4,5 s med enbart spinner → innehåll vid 14,5 s (`/#/oversikt`, `/#/jobb`) och 16,7 s (`/#/cv`). **Aldrig ett skelett.** `DashboardSkeleton` och `ui/Skeleton` finns men har noll importörer utanför sina testfiler.

**Rättelser mot UX22:** 0 px horisontell överspillning på **samtliga 33 sidor** — `/#/wellness`-fyndet är åtgärdat. "12 px systematiskt på alla 31 sidor" stämmer inte längre (20 av 33 har noll). Cookiedialogens knappar är nu ≥14 px. Kvar: 12 px-text på 13 sidor, värst `/#/personal-brand` med 16 förekomster inklusive en klickbar knapp.

## 9. Tillgänglighet

Full rapport: `review-2026-08-04/a11y.md` (45 sidor axe-svepta, ~250 tabbstopp, 8 modaler).

**85 överträdelser över 9 regel-id och 17 sidor.** Publika sidor: **0**. Topp: `color-contrast` 38 noder/11 sidor, `nested-interactive` 26/2, `button-name` 8/3 (critical), `select-name` 4/2.

- **UX30 (HÖG, nytt)** — **fokus stjäls vid varje sidladdning.** `CrisisSupport.tsx:134-138` — effekten som ska "återställa fokus när modalen stängs" kör också vid mount, eftersom `isOpen` redan är `false`. Bevisat med instrumenterad `HTMLElement.focus` och stacktrace på tre sidor. Följd: **skip-länkarna ligger bakom fokuspunkten och nås aldrig** (uppmätta som tabbstopp 22–24 av 25), och "för dig som mår dåligt…" läses upp oombedd vid varje navigering. **En rad kod.**
- **UX31 (HÖG)** — **20 av 43 synliga formulärfält (47 %) saknar tillgängligt namn** över 35 sidor. UX20:s CV-fokuslägesfynd håller: 4/4 fält namnlösa, orsak `FocusCVBuilder.tsx:807-828` (label som syskon, inget `htmlFor`/`id`), 14 instanser. Registreringens valideringsfel saknar `role="alert"`, `aria-live`, `id` och `aria-invalid` — login gör rätt och kan kopieras.
- **UX32 (MEDEL)** — **2 av 3 skip-länkar pekar på id:n som inte finns** (`main-navigation`, `search`; hjälparen `NavigationLandmark` har noll importörer). Landningens skip-länk flyttar inte fokus alls — målet är en `<section>` utan `tabindex`, så `element.focus()` är en no-op.
- **UX33 (MEDEL)** — kontrast, värsta paren: **2,50:1** `#ff6900`/`#f2edf8` (Dagbokens streak), **2,88:1** ×10 `#b48189`/`#fbeeef` (Karriärs stegchips), **3,91:1** ×9 `#e7000b`/`#ffe2e2` (CV-ats poängchips). Mönster: Tailwind `-500`/`-600` på egna `-50`/`-100`-bakgrunder.
- **UX34 (MEDEL)** — alla 45 sidor har **identisk `<title>`** och inget annonserar ruttbyte; `document.title` sätts ingenstans i koden. Rubrikhopp på 17 sidor. Login, Register, Landing och Tillgänglighet saknar `<main>`.

**Håller vid granskning:** UX19 punkt för punkt (dialog, fokusfälla över 25 tabbar, Escape, 0 namnlösa knappar), UX11 (fokusläget överlevde sex verktyg + reload), 0 av 250 tabbstopp utan fokusindikator, 0 av ~1 300 svg utan `aria-hidden`, 0 px reflow-spill vid 320 px. Fokusläget sänker antalet interaktiva element 56–88 % i sex verktyg — vilket gör de namnlösa fälten *där* extra allvarliga.

7 av 8 modaler är korrekta. `NotificationBell` har `role="dialog"` utan fokusfälla (9 av 15 tabbar hamnade utanför).

## 10. Språk — UX17 premissgranskad

Full rapport: `review-2026-08-04/i18n-sprak.md`.

**Alla fyra delpåståenden (a–d) i UX17 håller.** Men radens tröstesats — "bara en rå i18n-nyckel i hela svepet" — gör det inte: `/my-consultant` har 13 råa nycklar plus 3 i18next-felsträngar, **i båda språken** (UX24).

**Det roadmapen inte visste:** `en.json` är **komplett** — 7 163 nycklar i båda filerna, noll saknade i någon riktning. Tvingar man `language='en'` blir de publika sidorna faktiskt engelska (register 2,9 %, login 5,3 %, landning 12,4 % otextat). Undantaget är `/#/accessibility` med 90,8 % — `Accessibility.tsx` har **0 `t()`-anrop på 132 rader**.

**Storleken är dock större än raden antog:** inte 14 sidor över 30 % otextat utan **21 av 37**. Totalt **1 715 av 3 289 textnoder identiska sv/en = 52,1 %**. `/#/international` — guiden för nyanlända — 61,3 %, inklusive "Du måste ansöka om arbetstillstånd INNAN du reser till Sverige". Värre finns: `/#/exercises` 95,7 %, externa resurser 78,7 %, kunskapsbanken 76,2 %.

**Kodsidan i tal:** 4 270 statiska `t()`-anrop, varav **83 saknar nyckel helt** (rå nyckel i UI: 27 i MyConsultant, 17 i NextStepCard, 16 i SettingsSections), 154 har svensk fallback och **90 använder `t(x) || 'fallback'` där `||` är död kod** — 74 av dem i art. 9-samtyckesgrindarna. `report:i18n`: 9 166 rader hårdkodad svenska i 359 filer, varav 5 355 i 20 datafiler (övningar/artiklar/guider) och 797 i konsulentytan där svenska är tillåtet. **Ren `t()`-skuld i deltagarnära kod: 3 014 rader.**

**Etappindelning, var och en levererbar för sig:**

| Etapp | Innehåll | Uppskattning |
|-------|----------|--------------|
| 1 | Vägen in: språkdetektion + väljare på publika sidor, `<html lang>` + `<title>`, valideringsfelen ur `lib/validations/index.ts`, skip-links, `Accessibility.tsx` | ~1 dag |
| 2 | Buggarna som drabbar båda språken (UX24 m.fl.) + regressionsgrind | ~1 dag |
| 3 | `/#/international` + intresseguiden | ~2 dagar |
| 4 | Verktygskedjan CV → brev → jobbsök → profil | ~4 dagar |
| 5 | Innehållsdata (övningar, artiklar, guider) — **kräver beslut**, se §12 | — |
| 6 | Städning (787 oanvända nycklar, död `||`-fallback) | ~0,5 dag |

## 11. Prestanda

Full rapport: `review-2026-08-04/prestanda.md`. **Metod:** produktionsbygge + `vite preview`, Playwright/PerformanceObserver, kall context, tre körningar per sida, median. Brotli mätt med `zlib` q11 — i enlighet med I1-lärdomen.

**Huvudtal:** eager JS **1 359,8 kB rå / 352,8 kB brotli**. Hela bygget 8 734,6 kB rå / 2 069,7 kB brotli.

Desktop är grönt rakt igenom (LCP 696–1 260 ms, CLS ≤ 0,079, TBT 0–41 ms). **Men på 400 kb/s + 4× CPU: LCP 13,3–13,9 s och meningsfullt innehåll efter 13,8–20,6 s** — 5–6× över D6:s mål. LCP är konstant oavsett sida, alltså **sätter bundeln golvet, inte sidinnehållet**. Det är målgruppens verklighet, inte en akademisk siffra.

| # | Fynd | Vinst | Storlek |
|---|------|-------|---------|
| **E13** | **jsPDF (401,3 kB rå / 107,1 kB brotli) laddas på varje sidladdning — även den publika landningen.** Entry importerar exakt en symbol ur chunken: `__vitePreload`-helpern (~700 byte), som Rollup lagt i jsPDF-chunken. **Detta är precis den bugg `vite.config.ts`-kommentaren påstår sig ha löst** — `modulePreload:false` tog bort preload-taggen men inte den statiska importen, och utan hinten hämtas den nu sekventiellt i stället för parallellt, alltså sämre | −107 kB brotli, −30 % eager JS, ≈ **−2,1 s** @ 400 kb/s | **S** |
| **E14** | **CV-sidan skickar 910 kB miniatyrer, 6,2× för stora.** 11 PNG:er är 1588×2246 px men visas 256×256. `/#/cv` = 1 503 kB transfer mot 529–691 kB på övriga sidor. Omgenereringsskriptet finns redan | −800 kB (−55 %), ≈ **−16 s** @ 400 kb/s | **S** |
| **E15** | **Översikt gör 13 identiska `profiles?select=*` + 8 `auth/v1/user` = 21 dubbletter av 43 anrop (49 %).** `useAuth()` i `useSupabase.ts` är rå `useState`/`useEffect`, inte React Query — sex hookar anropar den, var och en hämtar själv plus en gång till på `onAuthStateChange`. `authStore` har redan samma data i minnet | −49 % anrop, kortare kedja före hubbdatan | **M** |
| **E16** | Skelett saknas helt i drift (se UX29) — `DashboardSkeleton` och `ui/Skeleton` har noll importörer | Upplevd tid, inte mätt tid | **S** |

**Premisser som inte höll — bygg inte det här:** av de misstänkta tunga biblioteken är **bara jspdf** eager. `xlsx` finns inte i bygget alls; `html2canvas`, `docx`, `framer-motion` och `@react-pdf` är korrekt lazy. **"Långa listor utan virtualisering" håller inte heller** — ingen sida passerar 3 000 DOM-noder och största React-listan är 119 element (283-listan är en native `<select>`). Virtualisering är bortkastat arbete just nu.

## 12. Nytt fynd utanför agenternas områden

**UX35 — fem levande CTA:er navigerar till `/dashboard/*`, som omdirigeras till Översikt.** ✓ egenverifierad. `App.tsx:290` har `<Route path="/dashboard/*" element={<Navigate to="/" replace />} />` (legacy-rest). Kvar i levande kod:

- `CoverLetterMyLetters.tsx:138, 293, 297` — monterad på `/cover-letter/my-letters`; redigera-brev och tomtillståndets två CTA:er landar på Översikt.
- `Help.tsx:79, 80` — snabblänkarna till Kunskapsbanken och Intresseguiden landar på Översikt.

Rätt paths finns (`cover-letter/*`, `knowledge-base/*`, `interest-guide/*` i `App.tsx:234-236`). Samma familj som UX15. Motsvarande rader i `workflowApi.ts:388-389` och `QuickActionBanner.tsx:76` är dödkod — och i `workflowApi` står den trasiga `action.link` bredvid en `secondaryAction.link` som är korrekt, vilket är hur felet överlevde.

## 13. Beslut som krävs av Mikael

Nya, utöver de som redan står i ROADMAP §7:

| Beslut | Varför det inte är mitt | Kopplat till |
|--------|------------------------|--------------|
| **Kör A16-migrationen nu?** | Ändrar produktionsdatabasen. Filen är skriven och granskad, en rad, inget datatapp | A16 |
| **`AICoachAssistant` — radera eller bygg på riktigt?** | Konsulentvyns AI-insikter är påhittade. Radera är S; bygga är M–L och kräver att man bestämmer vilka insikter som är försvarbara att ge om en människa | B10 |
| **Jobbdelning (792 rader) och energifunktionen (1 351 rader) — montera eller radera?** | Färdigbyggda, helt onåbara. Produktbeslut, inte städning | Arkitektur |
| **i18n etapp 5: innehållsdatan (5 355 rader)** — översätta allt, kuratera ett urval, eller märka ut vad som bara finns på svenska? | Kostnaden skiljer en storleksordning mellan alternativen | UX17 |
| **`/profile`: mint eller lavendel?** | DESIGN.md och koden säger olika. Endera dokumentet ska rättas | F-spåret |
| **Coverage-tröskeln: sänk till verklig nivå eller skriv tester ikapp?** | CI är rött nu. Att sänka till 25 % gör CI ärlig i dag; att skriva ikapp tar tid men behåller ambitionen | D13 |

## 14. Vad granskningen säger om metoden

Tre observationer värda att bära vidare:

1. **Två oberoende granskare hittade `/my-consultant`-buggen** (UX24) från olika håll — den visuella och den språkliga. Fynd som bara syns för en delmängd av konton (här: de 31 med tilldelad konsulent) överlever alla svep som körs på ett tomt testkonto.
2. **Gårdagens fix skapade dagens bugg** (UX26). UX16 flyttade CV-knappraden 64 px upp, rakt in under en FAB som ingen tänkte på. Geometriska fixar behöver en hit-test-regression, inte bara en verifiering av det som lagades.
3. **Barrel-filer gör dödkod osynlig för importsökning.** Det är förklaringen till att 32 291 rader stått kvar genom fyra granskningar, och till att tre stycken betalt arbete landade i filer ingen kör. Nåbarhetsanalys från `main.tsx` är den enda sökning som ser sanningen.
