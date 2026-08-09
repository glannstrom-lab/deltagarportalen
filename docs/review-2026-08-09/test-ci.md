# Granskning: testsvit, CI-pipeline och kvalitetsgrindar — Jobin/Deltagarportalen

**Datum:** 2026-08-09
**Commit:** `f2877dcb` (main, arbetsträdet rent före och efter granskningen)
**Omfattning:** `.github/workflows/ci.yml` + `deploy.yml`, 91 vitest-filer / 1 304 tester, 10 Playwright-specar / 105 tester, åtta CI-grindar
**Metod:** alla grindar körda lokalt; CI-status hämtad ur GitHub-API:t (687 körningar); jobbloggar är 403 utan admin, så felorsakerna är hämtade ur **check-run-annotations** och reproducerade lokalt. Sex **mutationsstickprov** körda mot produktionskod med automatisk återställning (`git checkout`), `git status` verifierat rent efteråt. Ingen käll- eller testkod ändrad permanent.

---

## 1. Sammanfattning

CI har **aldrig** varit grön på `main`: 687 körningar sedan 2026-04-02, **noll** lyckade. Deploy är samtidigt grön — prod uppdateras alltså utan att build, Lighthouse eller en enda Playwright-test någonsin har körts i CI.

Den dokumenterade orsaken (D13: coveragetröskeln) **stämmer inte längre**. Coverage passerar lokalt (23,19/63,96/34,66/23,19 mot 18/60/30/18) och exclude-fällan är åtgärdad. `Run Tests` failar i stället på att **sju testfiler kraschar vid import i CI** — `Error: supabaseUrl is required` — därför att `test`-jobbet aldrig får `VITE_SUPABASE_URL`. Lokalt döljs det av gitignorerade `client/.env`. 42 tester har aldrig kört i CI, och ingen lokal grind kan reproducera felet. Dessutom failar `Security Scan` på fyra `high`-sårbarheter i prod-beroenden.

Testkvaliteten bekräftas av mutation, inte av intryck: att ta bort `/cv`-routen ur `App.tsx` lämnar alla 33 nav-smoke-tester gröna, och art. 9-samtyckesgrinden kan läsa fel tabell **och** fel kolumn utan att någon av dess 14 tester faller — med fail-closed-policy betyder det att AI tyst blockeras för alla.

**Fem åtgärder i ordning:** (1) sätt Supabase-env i `test`-jobbet; (2) `npm audit fix` + höj testtimeouten; (3) assertera tabell/kolumn i art. 9-grinden; (4) gör nav-smoke fallbar; (5) koppla loss coverage från `needs:` så e2e får köra.

---

## 2. Fynd

### CI-status

---

#### F1 — CI har aldrig varit grön på main; Deploy är grön hela tiden
**KRITISK**

**Bevis.** Alla körningar av workflow `CI` (id 255356937) på `main`, hämtade sida för sida ur API:t:

```
ALL CI runs on main: 687   oldest: 2026-04-02T12:54:59Z
successes: 0
```

I det senaste fönstret om 300 körningar: `Counter({'failure': 297, 'cancelled': 3})`. Deploy (`236261496`) är samtidigt grön på var och en av de sex senaste commit:erna, inklusive `f2877dcb`.

Det betyder att grindarna inte grindar. `main` går rakt till prod via `deploy.yml`, och CI:s röda status har varit konstant så länge att den inte längre bär någon information — den kan inte skilja "något gick sönder idag" från bakgrundsbruset.

**Åtgärd.** F2 och F3 är hela felmängden idag. När de är lagade: gör CI till en required check på `main`, annars återkommer det här.
**Storlek:** S (F2+F3) + S (branch protection)

---

#### F2 — `Run Tests` failar på saknad Supabase-env, inte på coverage — sju filer kraschar vid import
**KRITISK**

Det här är fyndet som gör att den dokumenterade bilden (ROADMAP D13, `test-kvalitet.md` §G4) är fel idag.

**Bevis — CI:s egna annotations** (`/check-runs/92386502204/annotations`, körning `31029560886`):

```
failure | client/src/lib/supabase.ts:15
TITLE: src/pages/hubs/__tests__/ResurserHub.test.tsx
MSG: Error: supabaseUrl is required.
 ❯ validateSupabaseUrl node_modules/@supabase/supabase-js/src/lib/helpers.ts:86:11
 ❯ new SupabaseClient …
 ❯ src/lib/supabase.ts:15:25
 ❯ src/stores/authStore.ts:4:1
```

Samma fel för sju filer: `ResurserHub.test.tsx`, `MinVardagHub.test.tsx`, `KarriarHub.test.tsx`, `JobsokHub.test.tsx`, `HubOverview.test.tsx`, `focusModeScope.test.tsx`, `CoverLetterMyLetters.test.tsx`.

**Mekanismen, verifierad i tre led:**

1. `client/src/lib/supabase.ts:15` skapar klienten på modulnivå:
   ```ts
   export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', { … })
   ```
   `node -e "createClient('','')"` → `THROWS: supabaseUrl is required.` Fallbacken `|| ''` skyddar alltså inte — den garanterar kraschen.
2. `test`-jobbet får aldrig variablerna. `ci.yml:100-104`:
   ```yaml
   - name: Run tests with coverage
     working-directory: client
     run: npm run test:coverage
     env:
       CI: true
   ```
   `grep -n VITE_SUPABASE_URL .github/workflows/ci.yml` → rad **155** (build), **247** (e2e-smoke), **295** (e2e-authenticated). Inte i `test`.
3. Lokalt finns `client/.env` med `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`, och den är gitignorerad (`git check-ignore -v client/.env` → `.gitignore:11:.env`). Vite laddar den, så de sju filerna passerar: kört lokalt ger `Test Files 7 passed (7) / Tests 42 passed (42)`.

`client/src/test/setup.ts` stubbar `matchMedia`, `localStorage`, `sessionStorage`, `IntersectionObserver` och `canvas` — men **inte** `import.meta.env`.

**Konsekvens.** 42 tester har aldrig körts i CI. Och detta är en skarpare form av lärdomen 2026-08-04: de lokala grindarna kan **strukturellt inte** reproducera felet, eftersom skillnaden är en gitignorerad fil. Att köra "samma kommando som CI" räcker inte när miljön skiljer.

**Åtgärd.** Lägg `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` i `test`-jobbets `env` (samma secrets som build), **eller** — bättre — stubba dem i `setup.ts` så sviten aldrig beror på riktiga credentials, och gör `lib/supabase.ts` lat (`getSupabase()`) i stället för att skapa klienten vid import. Lägg dessutom en `.env.test` i repot med dummyvärden så lokalt och CI kör samma miljö.
**Storlek:** S (env) / M (lat klient + setup-stub, som är den riktiga fixen)

---

#### F3 — `Security Scan` failar på fyra high-sårbarheter i produktionsberoenden
**KRITISK**

**Bevis.** `ci.yml:333-335` kör `npm audit --omit=dev --audit-level=high`. Reproducerat lokalt i `client/`, **exit 1**:

```
ip-address   <=10.3.0     high    SSRF/trust-boundary bypass (3 CVE)
nanoid       4.0.0-5.1.15 high    non-secure generator loops on negative size (via docx)
react-router 7.12.0-7.18.1 high   RSC Mode CSRF Bypass Allows Action Execution Before 400 Response
react-router-dom 7.12.0-pre.0-7.18.1  (beroende av ovan)
dompurify    <=3.4.12     moderate  XSS via detached subtree efter IN_PLACE-hook
undici       <=6.27.0     moderate  (via @vercel/blob)
6 vulnerabilities (2 moderate, 4 high) — fix available via `npm audit fix`
```

Kommentaren i `ci.yml:329-332` beskriver läget som "A14 klar: 0 prod-sårbarheter". Det gäller inte längre. `react-router` är den allvarligaste — den är portalens router, inte ett transitivt verktyg. `dompurify` sitter i XSS-saneringen.

Steget `Check for secrets` (trufflehog) blir **skippat** av audit-felet och har alltså heller aldrig kört.

**Åtgärd.** `npm audit fix`, verifiera att `react-router` fortfarande fungerar med HashRouter, kör om. Kolla särskilt att dompurify-bumpen inte ändrar saneringsbeteendet.
**Storlek:** S–M

---

#### F4 — Fyra jobb har aldrig kört; hela Playwright-sviten har aldrig exekverat i CI på main
**KRITISK**

**Bevis.** `build` har `needs: [lint-and-typecheck, test]` (`ci.yml:134`); `lighthouse:168`, `e2e-smoke:219` och `e2e-authenticated:265` har `needs: build`. Eftersom `test` failar varje gång hoppas alla fyra över. Jobbstatus i 13 stickprov jämnt spridda över hela perioden 2026-04-28 → 2026-08-05:

```
2026-08-05 f2877dcb  FAIL: Security Scan, Run Tests   | SKIP: 4
2026-07-23 44780074  FAIL: Run Tests, Security Scan   | SKIP: 4
2026-07-07 de474771  FAIL: Lint & Type Check, Security Scan, Run Tests | SKIP: 3
2026-05-15 0cdec841  FAIL: Security Scan, Lint & Type Check, Run Tests | SKIP: 3
2026-04-28 f1daa1b8  FAIL: Security Scan, Run Tests, Lint & Type Check | SKIP: 3
```

`Run Tests` failar i samtliga 13. Med noll lyckade körningar i alla 687 följer att `build` aldrig producerat en artefakt, och därmed att **e2e-smoke och e2e-authenticated aldrig har startat en enda Playwright-test på main**. Det är en nivå värre än den dokumenterade bilden "grönt-men-tomt" — jobbet är inte grönt-men-tomt, det finns inte.

Det gör också D8/D9-arbetet (regression-fas-a och sta.spec inlagda i CI) verkningslöst så länge kedjan är bruten.

**Åtgärd.** Utöver F2/F3: bryt `needs`-kedjan så att e2e och build inte är gisslan hos testjobbet. Låt `build` bero enbart på `lint-and-typecheck`, och låt coverage-tröskeln bo i ett eget icke-blockerande jobb tills den är stabil.
**Storlek:** S

---

#### F5 — Coveragerapporten laddas aldrig upp; ingen har sett CI:s faktiska coveragesiffror
**MEDEL**

**Bevis.** Annotation i samma körning: `warning | No files were found with the provided path: client/coverage. No artifacts will be uploaded.`

Vitest rensar `coverage/` vid start och skriver rapporten först när körningen når slutet. Eftersom sviten kraschar på collect-fel skrivs inget. Steget `Upload coverage report` (`ci.yml:106-112`) rapporterar ändå `success`, så inget larmar.

Följden: D13:s coveragefix har aldrig verifierats i CI. Vi vet att den håller **lokalt** (F9), men CI:s siffror är okända sedan tröskeln infördes 2026-05-15.

**Åtgärd.** Följer av F2. Överväg `if: always()` + `continue-on-error` runt själva tröskelkontrollen så rapporten alltid produceras.
**Storlek:** S

---

### Grindarna körda lokalt

---

#### F6 — Sex statiska grindar: alla gröna, exakta tal
**Ingen åtgärd — redovisning**

Alla körda 2026-08-09 mot `f2877dcb`, i `client/`:

| Grind | Kommando | Utfall | Tak | Tid |
|---|---|---|---|---|
| ESLint | `npm run lint:ci` | ✅ **0 errors, 128 warnings** | 129 | 45,5 s |
| Typecheck krasch | `npm run typecheck:critical` | ✅ inga TS2304/TS2307 | — | 68,7 s |
| Typecheck-tak | `npm run typecheck:ceiling` | ✅ **468**, exakt på taket | 468 | 39,6 s |
| Designskuld | `npm run lint:design` | ✅ **52** | 52 | 0,8 s |
| Schemadrift | `npm run lint:schema` | ✅ 722 filer, 135 tabeller / 84 RPC / 2 buckets | — | 2,7 s |
| Vercel-konfig | `npm run lint:vercel` | ✅ 6 regler, ingen legacy `routes` | — | 2,3 s |

Warnings ligger på 128 av 129 — **en** warning marginal. Nästa `react-hooks`-varning fäller grinden. Typecheck-taket ligger på exakt 468 av 468, alltså noll marginal.

**Notera:** CI-stegets namn på `ci.yml:55` lyder `Type check (strict-tak 687)` medan skriptet har `CEILING = 468` (`scripts/typecheck-ceiling.cjs:40`). Etiketten är 219 fel. Kosmetiskt, men den är det man läser i CI-vyn.

---

#### F7 — `test:coverage` är flaky lokalt: olika filer timeoutar i olika körningar
**HÖG**

**Bevis.** Tre körningar av exakt CI:s kommando:

| Körning | Flagga | Utfall |
|---|---|---|
| 1 | `CI=true npm run test:coverage` | ❌ `1 failed \| 1303 passed (1304)` — `auth-flow.test.tsx:95` *"should show error on invalid credentials"*, **Test timed out in 5000ms** |
| 2 | `+ --testTimeout=30000` | ✅ `1304 passed (1304)`, 67,6 s |
| 3 | `CI=true npm run test:coverage` | ❌ `3 failed \| 1301 passed (1304)` — `register-flow.test.tsx`, tre tester, **Test timed out in 5000ms** |

Filerna som faller skiljer sig mellan körningarna. Isolerat är de stabila: `npx vitest run src/test/integration/auth-flow.test.tsx` tre gånger i rad → `4 passed` varje gång. Det är alltså resurskonkurrens under full parallell körning, inte en trasig test.

Alla drabbade är `userEvent`-baserade integrationstester mot 5 000 ms default. På en långsammare eller mer belastad runner blir det här ett andra, oberoende skäl till att `test`-jobbet är rött — och det kommer att slå till slumpmässigt även efter att F2 är åtgärdad.

**Åtgärd.** Sätt `testTimeout: 15000` i `vitest.config.ts` (eller per fil för integrationstesterna). En flaky grind lärs man sig ignorera, och då är den värre än ingen grind.
**Storlek:** S

---

#### F8 — Pre-push-hooken kör inte det CLAUDE.md säger att den kör
**HÖG**

**Bevis.** CLAUDE.md påstår: *"`npm run verify` (i `client/`) kör hela grinduppsättningen. Pre-push-hooken (`.husky/pre-push`) kör den automatiskt"*.

`.husky/pre-push` anropar aldrig `verify`. Den kör fem grindar var för sig:
```
npm run --silent lint:vercel
npm run --silent lint:schema
npm run --silent typecheck:critical
npm run --silent lint:ci
npm run --silent lint:design
```
Saknas: **`typecheck:ceiling`** och **`test:coverage`**. Det senare är medvetet och står i hookens egen kommentar (*"är röd sedan tidigare (ROADMAP D13) och skulle blockera varje push"*), men `typecheck:ceiling` verkar bara ha fallit bort.

`npm run verify` (package.json) kör däremot alla sju inklusive `test:coverage`.

**Två följder:** (1) **inga tester alls körs före push** — hela testsviten är oskyddad på vägen till prod, och prod nås av varje push; (2) taket 468 kan överskridas lokalt och upptäcks först i CI, som ändå är rött.

**Åtgärd.** Byt hookens fem rader mot `npm run verify` när F2/F7 gjort testjobbet pålitligt. Rätta CLAUDE.md i samma veva, och notera att grindarna nu är **åtta**, inte sju (`lint:vercel` tillkom 2026-08-05).
**Storlek:** S

---

### Coverage

---

#### F9 — Coverage passerar lokalt; `exclude`-fällan är åtgärdad
**Ingen åtgärd — verifierad rättelse**

**Bevis.** `vitest.config.ts:21-22` spreadar numera defaults:
```ts
exclude: [
  ...coverageConfigDefaults.exclude,
```
Den dokumenterade fällan (att `exclude` **ersätter** defaults och drog in `client/dist/assets`) är alltså stängd. Verifierat i utfallet: inga `dist/`-filer förekommer i rapporten.

Mätt läge (`coverage/coverage-summary.json`, körning utan flakiness):

| | Statements | Branches | Functions | Lines |
|---|---|---|---|---|
| **Utfall** | **23,19** | **63,96** | **34,66** | **23,19** |
| Tröskel | 18 | 60 | 30 | 18 |
| Marginal | +5,19 | +3,96 | +4,66 | +5,19 |

Alla fyra klarar tröskeln. Coverage är alltså **inte** det som fäller CI idag.

---

#### F10 — `scripts/**` räknas in i coverage med 0 % — inklusive grindskripten själva
**MEDEL**

**Bevis.** 20 filer under `client/scripts/` ligger i coveragedenominatorn på 0 %, tillsammans ~4 100 statements:

```
0.00%  738  scripts/dead-code.cjs
0.00%  547  scripts/apply-article-corrections.cjs
0.00%  247  scripts/check-schema-drift.cjs
0.00%  119  scripts/check-vercel-config.cjs
0.00%   96  scripts/typecheck-ceiling.cjs
0.00%   78  scripts/check-design-debt.cjs
…
```

Två separata problem i ett. **(a)** Byggverktyg drar ner produktkoverage: varje nytt `scripts/`-verktyg sänker siffran utan att produkten blivit sämre testad — samma klass som `dist/`-fällan, bara mindre. **(b)** Viktigare: **grindarna är själva otestade.** `check-schema-drift.cjs` är portalens skydd mot schemadrift och har noll tester. Om dess regex slutar matcha blir grinden tyst grön — och `typecheck-ceiling.cjs` är den enda som har ett inbyggt no-op-skydd (`:65-72`, *"tsc gav ingen utdata alls — kördes den verkligen?"*). Det mönstret borde de andra fyra ha.

**Åtgärd.** Lägg `scripts/**` i `exclude`. Skriv i stället riktade tester för grindskripten (en fixtur med känd drift som ska fälla `check-schema-drift`), och ge var och en ett no-op-skydd av samma slag som ceiling-skriptet.
**Storlek:** S (exclude) + M (grindtester)

---

#### F11 — 426 filer / 119 120 statements på 0 %; konsulentvyn och tre serverless-funktioner helt otäckta
**HÖG**

**Bevis.** Ur `coverage-summary.json`: **426 filer med statements > 0 har covered = 0**, tillsammans 119 120 statements.

Sorterat efter storlek, exklusive den pausade STA-modulen:

| Statements | Fil |
|---:|---|
| 1 903 | `src/components/cv/templates/CVTemplates.tsx` |
| 1 308 | `src/pages/consultant/ResourcesTab.tsx` |
| 1 153 | `src/pages/consultant/AnalyticsTab.tsx` |
| 1 147 | `src/pages/career/AdaptationTab.tsx` |
| 1 111 | `src/pages/consultant/CommunicationTab.tsx` |
| 974 | `src/pages/Landing.tsx` |
| 896 | `src/pages/consultant/OverviewTab.tsx` |
| 871 | `src/pages/spontaneous/SearchTab.tsx` |
| 847 | `src/components/applications/ApplicationDetailModal.tsx` |
| 764 | `src/pages/consultant/ParticipantDetailPage.tsx` |

Och på API-sidan:

```
0.00%  288  api/cv-pdf.js
0.00%  667  api/job-alerts.js
0.00%  216  api/upload-image.js
80.75%      api/ai.js          ← enda undantaget, tack vare aiServerConsentGate.test.ts
```

Tre av fyra serverless-funktioner i produktion har noll täckning. `job-alerts.js` (667 statements) skickar e-post till användare; `upload-image.js` är den endpoint vars auth-kontroll `regression-fas-a.spec.ts` påstår sig vakta (och inte kan, se F19).

`src/pages/consultant/**` — portalens **enda** konsulentvy — är noll i varje flik. Enda skyddet är `consultantService.test.ts`, och det är just den filen som cementerar F14.

**Åtgärd.** Prioritera efter risk, inte efter storlek: `api/job-alerts.js` och `api/upload-image.js` (serversidan, ingen annan grind ser dem), sedan `pages/consultant/`, sedan `Landing.tsx` (första intrycket, och den enda sidan e2e-smoke faktiskt når).
**Storlek:** L

---

### Testkvalitet — mutationsbevis

Sex mutationer kördes mot produktionskod, en i taget, med `git checkout` efter varje. `git status --porcelain` var tomt före och efter (bortsett från den här rapportens katalog).

| # | Mutation | Test som skulle fånga den | Utfall |
|---|---|---|---|
| M1 | `consultantService.ts`: `.from('consultant_participants')` → `.from('zzz_mutant_table')` | `consultantService.test.ts` | ✅ **1 failed** — fångad |
| M2 | `useKarriarHubSummary.ts`: `enabled: !!userId` → `enabled: true` | `useKarriarHubSummary.test.ts` | ❌ 4 passed — **missad** |
| M3 | `App.tsx`: `path="cv/*"` → `path="cv-BORTA/*"` (routen borta) | `nav-smoke.test.tsx` | ❌ 33 passed — **missad** |
| M4 | `api/ai.js`: art. 9-grinden fail **closed** → fail **open** | `aiServerConsentGate.test.ts` | ✅ **3 failed** — fångad |
| M5 | `api/ai.js`: `.from('profiles')` → `.from('zzz_mutant')` | `aiServerConsentGate.test.ts` | ❌ 14 passed — **missad** |
| M6 | `api/ai.js`: `.select('ai_consent_at, …')` → `.select('ai_consent_ts, …')` | `aiServerConsentGate.test.ts` | ❌ 14 passed — **missad** |

M4 är den positiva kontrollen: harnessen fungerar, och fail-closed-policyn är genuint skyddad.

---

#### F12 — `nav-smoke` kan inte falla på det den finns till för — bevisat
**KRITISK**

**Bevis (M3).** `client/src/test/integration/nav-smoke.test.tsx:10-11` lovar i filhuvudet: *"This test asserts the URL stays at the requested path after navigation"* och varnar för att catch-routen tyst skickar okända URL:er till dashboarden.

Assertionerna (`:170-180` och `:184-197`) är bara:
```ts
expect(container.textContent ?? '').not.toBe('loading')
expect(container.textContent ?? '').not.toBe('')
expect(errorFallback).toBeNull()
```
Ingen location, inget sidinnehåll.

Mutationen tog bort `/cv`-routen ur `App.tsx` — exakt regressionen testet beskriver — och alla **33 av 33** tester förblev gröna. Fyndet var känt sedan 2026-08-04 (T6); det är nu bevisat i stället för resonerat.

**Åtgärd.** Lägg en `useLocation`-probe i testträdet och assertera `pathname === path`, plus en unik rubrik eller `data-testid` per sida.
**Storlek:** M

---

#### F13 — Art. 9-samtyckesgrinden: varken tabell eller kolumn asserteras; fail closed gör felet till total AI-blockering
**KRITISK**

**Bevis (M5, M6).** `client/api/ai.js:271-290`:
```js
const { data, error } = await supabase
  .from('profiles')
  .select('ai_consent_at, ai_enabled')
  .eq('id', userId)
  .single();
if (error || !data) {
  return { allowed: false, reason: 'lookup_failed' };   // fail closed
}
```

Byte av tabellnamn (`profiles` → `zzz_mutant`): **14/14 gröna**. Byte av kolumnnamn (`ai_consent_at` → `ai_consent_ts`): **14/14 gröna**. Orsaken är `stubSupabase` i `client/src/services/aiServerConsentGate.test.ts:24-37`, som skapar sina spioner inline per anrop och aldrig asserterar vad de fick.

Kostnaden är asymmetrisk och värre än en vanlig testlucka. Grinden är **fail closed** (helt riktigt, enligt lärdomen 2026-08-03). Ett felstavat tabell- eller kolumnnamn ger `{error}` → `lookup_failed` → **AI blockeras för samtliga användare**, tyst, medan fail-closed-testerna fortsätter passera eftersom de redan *förväntar sig* `lookup_failed`. Symmetrin mellan "grinden funkar" och "grinden är trasig" gör felet osynligt.

`lint:schema` fångar det inte heller: `check-schema-drift.cjs` går inte igenom `client/api/*.js` (ESLint och tsconfig gör det inte heller — `tsconfig.app.json` har `include: ["src"]`).

**Åtgärd.** Assertera `from('profiles')` och att `select`-strängen innehåller båda kolumnnamnen. Utvidga `lint:schema` till att täcka `client/api/*.js`.
**Storlek:** S

---

#### F14 — T1 kvar och verifierad mot prod: konsulentens massändring skriver till en kolumn som inte finns
**HÖG**

**Bevis mot produktionsdatabasen** (inte mot migrationsfiler):
```
npx supabase db query --linked "SELECT column_name FROM information_schema.columns
  WHERE table_name='consultant_participants' ORDER BY column_name;"
→ assigned_at, assigned_by, consultant_id, id, last_contact_at,
  next_meeting_scheduled, notes, participant_id, priority, tags
```
Ingen `status`. `client/src/services/consultantService.ts:633-635` gör ändå:
```ts
const { error } = await supabase
  .from('consultant_participants')
  .update({ status })
```
Varje anrop ger PGRST204. Konsulentens massändring av deltagarstatus har alltså aldrig fungerat, och fyndet är oförändrat sedan 2026-08-04.

**Delvis förbättring:** mutation M1 visar att testet numera **fångar tabellnamnsbyten** — det är starkare än det var. Men payloaden asserteras fortfarande bara som argument (`consultantService.test.ts:643`), och mot en mockad klient passerar vilken kolumnuppsättning som helst.

Samma klass, samma fil: `consultantService.ts:662` och `:678` skriver till `tags` — den kolumnen finns dock (se listan ovan).

**Åtgärd.** Skriv mot `profiles.status` (som vyn `consultant_dashboard_participants.status` speglar) eller lägg till kolumnen efter beslut. Utvidga `lint:schema` med payload-nycklar (se F22).
**Storlek:** S + M

---

#### F15 — Testet "query is disabled when userId is empty" testar inte det — bevisat
**HÖG**

**Bevis (M2).** `client/src/hooks/useKarriarHubSummary.test.ts:90-104` heter *"query is disabled when userId is empty — enabled=false means isFetching stays false"*, men `useAuth` är mockad som inloggad på `:6-8`, så tomt userId inträffar aldrig. Kommentaren `:94-96` medger det.

Mutationen tog bort guarden helt (`enabled: !!userId` → `enabled: true` i `useKarriarHubSummary.ts:15`) och **4/4 tester förblev gröna**. Guarden är alltså helt oskyddad; tas den bort skickar hooken en fråga med tomt userId.

**Åtgärd.** Antingen döp om testet till vad det faktiskt gör, eller mocka `useAuth` till utloggad och assertera att `from` aldrig anropas.
**Storlek:** S

---

#### F16 — `Image.test.tsx` asserterar motsatsen till sitt eget namn och låser fast en LCP-bugg
**HÖG**

**Bevis.** `client/src/components/ui/Image.test.tsx:97-102`:
```tsx
it('uses eager loading when priority is true', () => {
  render(<Image src="test.jpg" alt="Test" priority />)
  const img = screen.getByAltText('Test')
  expect(img).toHaveAttribute('loading', 'lazy') // The component passes loading prop
})
```
Testnamnet säger `eager`, assertionen kräver `lazy`. Och komponenten har buggen: `client/src/components/ui/Image.tsx:233` skriver `loading={loading}` där `loading` defaultar till `'lazy'` (`:84`) oberoende av `priority` (`:85`). `priority` slår bara igenom på `isInView` (`:135`) och `decoding` (`:234`).

Följd: en hero-bild märkt `priority` får ändå `loading="lazy"` — precis den attributkombination som skadar LCP. Testet gör buggen permanent: fixar man komponenten blir testet rött.

Samma fil, `:90-95`: `it('does not generate srcset for external URLs')` asserterar `expect(img).toHaveAttribute('srcset')`. Namn och assertion är motsatser även där.

**Åtgärd.** Rätta komponenten (`loading={priority ? 'eager' : loading}`) och vänd assertionen. Sök igenom sviten efter fler namn/assertion-motsägelser — två i samma fil tyder på mönster.
**Storlek:** S

---

#### F17 — Sex av 2026-08-04:s ljugande tester är oförändrade
**HÖG**

Verifierat rad för rad mot nuvarande kod:

| Id | Status | Plats idag | Kärnbevis |
|---|---|---|---|
| T3 | **kvar** | `client/src/hooks/useOnboardedHubsTracking.ts:30-39` | Läser `current` ur React Query-cachen, inte ur servern; testet `useOnboardedHubsTracking.test.ts:31-34` förseedar cachen och `:56` asserterar överskrivningen `{ onboarded_hubs: ['jobb'] }` |
| T4 | **kvar** | `client/src/services/unifiedProfileApi.ts:218-219` | Läser `riasec_scores` / `top_occupations` som inte finns i `interest_results`; fixturen `unifiedProfileApi.test.ts:112-115` uppfinner dem |
| T5 | **kvar** | `client/src/services/unifiedProfileApi.test.ts:109` | `skills: ['React']` — prod har objektform (`types/pdf.types.ts:7-12`: `{id,name,level,category}`) |
| T6 | **kvar** | `client/src/test/integration/nav-smoke.test.tsx:170-197` | Se F12 (nu mutationsbevisad) |
| T7 | **kvar** | `client/src/pages/CVPage.test.tsx:88-99` | Mock returnerar `{save,isSaving,lastSaved}`; riktiga `useCVAutoSave.ts:262-269` returnerar `{saveStatus,lastSavedAt,hasUnsavedChanges,triggerSave,pendingCount,isOnline,hasRemoteChanges}` — **noll överlappande fältnamn**. Död mock av `@/services/api` kvar på `:9-15` |
| T9 | **kvar** | `client/src/services/aiServerConsentGate.test.ts:24-37` | Se F13 (nu mutationsbevisad) |

Samt T10-posterna: `staAiApi.test.ts:86-97` (identisk `mockResolvedValue` två gånger — den avwrappade formen testas aldrig), `cloudStorage.test.ts:70` (kortsluter localStorage-storen för hela filen), `login-flow.test.tsx:88` vs `:174` (byte-identiska tester), `auth-flow.test.tsx:152-160` (asserterar sin egen `beforeEach`).

**Två positiva rättelser sedan 2026-08-04:**
- **T2 är ÅTGÄRDAD.** `useMinVardagHubSummary.ts:65` går nu via `supabase.rpc('get_my_consultant')`, och testet är omskrivet till en riktig regressionsvakt: `useMinVardagHubSummary.test.ts:131-143` kräver `expect(tabeller).not.toContain('consultant_participants')`. Det är precis rätt form.
- **T12 kvarstår:** ingen global `offsetParent`-shim i `setup.ts`; enda förekomsten är lokal i `components/cv/CVOnboarding.test.tsx:30-46`.

**Storlek:** M totalt

---

#### F18 — Nya tautologiska tester i den svit som vuxit 933 → 1 304
**MEDEL**

Sviten har vuxit med 371 tester sedan 2026-08-04. En del av tillskottet bär ingen signal:

| Fil:rad | Varför det inte kan falla |
|---|---|
| `client/src/hooks/useCelebration.test.ts:126` | `expect(String(title).length).toBeGreaterThan(0)` — `"x"`, en oöversatt i18n-nyckel eller engelsk copy passerar alla. Testet heter *"har text för alla tre ögonblicken"* |
| `client/src/services/cvOptimizer.test.ts:78, :120` | Enda assertion är `expect(result.matchedKeywords).toBeGreaterThan(0)`. `:120` heter *"läser kompetenser i produktionens objektform"* men passerar även om objektformen tyst tappas och träffen kommer ur `summary` |
| `client/src/services/cvOptimizer.test.ts:117` | `expect(result.matchScore === null \|\| result.matchScore >= 0).toBe(true)` — sant för `null` och varje icke-negativt tal |
| `client/src/stores/aiTeamStore.test.ts:35` | Asserterar exakt de tre värden `beforeEach` (`:15`) precis satte. Storens riktiga initialtillstånd asserteras ingenstans |
| `client/src/stores/settingsStore.test.ts:89` | Två `toggleCalmMode()` och `expect(calmMode).toBe(false)` — men `false` är vad `beforeEach:61` satte. En `toggleCalmMode` som är en ren no-op passerar |
| `client/src/components/dashboard/DashboardSkeleton.test.tsx:93-118` | Fyra tester asserterar bara `querySelectorAll('[class*="dark:"]').length > 0`. En enda kvarglömd utility-klass håller dem gröna medan skelettet är osynligt i dark mode. (Filen ligger dessutom i `components/dashboard/` — hela katalogen är dödkod enligt CLAUDE.md) |
| `client/src/hooks/useOversiktHubSummary.test.ts:85` | Påstår sig verifiera att aggregatorn anropar fyra syskonhookar — men alla fyra är `vi.mock`ade (`:29-44`) och asserteras med bara `toHaveBeenCalled()` utan argument |
| `client/src/lib/validatedStorage.test.ts:98, :298` | Default-assertionerna ligger inuti `if (result.success)` och hoppas över tyst i exakt det utfall där defaults kan vara fel |
| `client/src/components/knowledge-base/ArticleContent.test.tsx:149` | I jsdom är `scrollWidth` och `clientWidth` båda `0`, så overflow upptäcks aldrig — testet passerar även om logiken är inverterad eller borttagen. Syskontestet `:158` stubbar värdena och har signal |

**Åtgärd.** Grind G-B (F23) gör klassen mätbar i stället för att jagas manuellt.
**Storlek:** M

---

#### F19 — Rättelse: `profileStore` asserterar en bugg, men gör det ärligt
**LÅG (rättelse, ingen åtgärd)**

`client/src/stores/profileStore.test.ts:322` asserterar `expect(completion.filled).toBe(0)` efter en uppdatering som borde ge 1 — alltså den kända stale-completion-defekten. Det ser vid första anblick ut som klassen "testet cementerar buggen".

Det gör det inte. Testet heter uttryckligen *"räknar om completion — men en uppdatering försent (se 'kända defekter')"*, och på `:476` ligger den exekverbara motsvarigheten:
```ts
it.fails('updatePreferences ska ge färsk completion redan vid första ändringen', () => {
  expect(useProfileStore.getState().completion.filled).toBe(1)
})
```
Det är rätt sätt att hantera en känd defekt: nuläget är låst, önskeläget är kodat som `it.fails` och blir rött den dag buggen lagas. Värt att kopiera, inte att åtgärda.

---

### E2E

---

#### F20 — 74 av 94 tester skippas tyst — men frågan är akademisk: jobbet har aldrig kört
**HÖG**

**Bevis.** `npx playwright test --list --project=chromium` → **105 tester i 10 filer**. Fördelning:

| Spec | Tester | Körs utan secrets | Skippas |
|---|---:|---:|---:|
| `dashboard.spec.ts` | 19 | 0 | 19 (`:10`, i `beforeEach`) |
| `axe-a11y.spec.ts` | 19 | 10 | 9 (describe `:72-108`, skip `:75`) |
| `job-search.spec.ts` | 15 | 0 | 15 (`:5`) |
| `cv.spec.ts` | 13 | 0 | 13 (`:6`) |
| `auth.spec.ts` | 12 | 10 | 2 (`:84`, `:172`) |
| `cover-letter.spec.ts` | 10 | 0 | 10 (`:10`) |
| `smoke.spec.ts` | 6 | 6 | 0 |
| `regression-fas-a.spec.ts` | 5 | 5 | 0 |
| `sta.spec.ts` | 3 | 0 | 3 (`:36`, `:37`, `:84`) |
| `golden-path.spec.ts` | 3 | 0 | 3 (`:21`, `:72`) |
| **Summa** | **105** | **31** | **74** |

Det dokumenterade fyndet **stämmer fortfarande**: `e2e-authenticated` kör 8 specar = 94 tester, varav **74 skippas** utan secrets och de 20 som återstår är publika sidor `e2e-smoke` redan täcker. Strukturen är omätt sedan 2026-08-04 men här oberoende omräknad (axe-a11y-blocken verifierade mot describe-gränserna på rad 40/70/72/108/110/148).

**Men fyndet behöver skärpas:** jobbet rapporterar inte grönt-men-tomt. Det **hoppas över** (F4) och har aldrig startat. Ingen av de 74 skippade och ingen av de 20 körbara har någonsin exekverat på main.

Två följdfel som slår till dag ett när kedjan lagas: `playwright.config.ts:35` faller tillbaka på `http://localhost:5173` och `:80` startar dev-servern när `PLAYWRIGHT_BASE_URL` saknas — CI sätter den aldrig, så all e2e körs mot Vite-dev och inte mot den byggda artefakten. Och `retries: 2` i CI (`:21`) döljer flakiness.

**Åtgärd.** Ordning spelar roll: (1) laga `needs`-kedjan; (2) laga hash-routingen i specarna (`goto('/cv')` → `goto('/#/cv')`) **innan** secrets läggs in, annars blir jobbet grönt utan att ha testat något; (3) lägg in `TEST_USER_*`; (4) lägg ett test som *inte* skippar: `expect(process.env.TEST_USER_EMAIL).toBeTruthy()`.
**Storlek:** S (kedjan) + M (specarna)

---

#### F21 — Vad som inte testas alls, rangordnat efter skada på användaren
**HÖG**

Kriteriet är kodvägar som samtidigt är (a) otestade, (b) i produktion och (c) skadar en användare om de går sönder.

| # | Kodväg | Otestad | I prod | Skada om den brister |
|---|---|---|---|---|
| 1 | **Art. 9-samtycket i `api/ai.js`** | Grinden har tester, men de kontrollerar inte tabell/kolumn (F13) | ✅ | Fail closed ⇒ **all AI slutar fungera för alla**, tyst. Eller — vid motsatt fel — hälsodata skickas utan samtycke |
| 2 | **`api/job-alerts.js`** (667 stmts, 0 %) | ✅ | ✅ | Jobbevakningen har redan varit ur funktion i månader en gång (2026-07-27). Ingen grind, inget test, ingen signal |
| 3 | **`api/upload-image.js`** (216 stmts, 0 %) | ✅ | ✅ | Auth-kontrollen är den enda spärren mot att vem som helst skriver till Blob. Vakten som ska skydda den kan inte falla (F19/E3 i förra granskningen) |
| 4 | **Konsulentvyn `pages/consultant/**`** (0 % i alla flikar) | ✅ | ✅ | Konsulenten arbetar mot deltagares data. F14 visar att en massändring redan är trasig och har varit det obemärkt |
| 5 | **Samtycke/GDPR i UI:t** (`components/consent/` 0 %) | ✅ | ✅ | Återkallande av samtycke och datadelning är rättigheter, inte funktioner. Ingen e2e alls; cookie-bannern *avfärdas* i `fixtures.ts` men testas aldrig |
| 6 | **Registrering och kontoradering** | ✅ | ✅ | Ny användares första intryck respektive art. 17-rättighet. Endast "formuläret renderas" |
| 7 | **CV → PDF** (`api/cv-pdf.js` 0 %, `CVTemplates.tsx` 1 903 stmts 0 %) | ✅ | ✅ | Portalens mest konkreta leverabel. Enda riktiga täckningen är `e2e/cv-pdf-visual-audit.cjs` — ett manuellt verktyg utanför CI |
| 8 | **`Landing.tsx`** (974 stmts, 0 %) | ✅ | ✅ | Den enda sidan e2e-smoke faktiskt når, och den som avgör om någon blir användare |

**Åtgärd.** Ta 1–3 först: de ligger på serversidan där varken ESLint, tsc eller `lint:schema` tittar, så testet är det enda möjliga skyddet.
**Storlek:** L

---

### Grindarnas täckning

---

#### F22 — Buggklasser som går rakt igenom alla åtta grindar plus coverage
**KRITISK (systemisk)**

Varje klass nedan är belagd med ett fynd i den här granskningen, inte konstruerad.

**Klass A — "Fel miljö, inte fel kod."** Kod som fungerar lokalt och kraschar i CI (eller tvärtom) därför att en gitignorerad fil skiljer miljöerna. *Belagd av F2.* Ingen grind ser den: alla åtta körs i den miljö som har `.env`.
→ **Grind som fångar den:** kör en grind i en miljö utan `.env` — enklast `npm run test:run` i ett `git clone` av HEAD i CI, eller ett skript som failar om `import.meta.env.VITE_*` läses på modulnivå utanför en lat getter.

**Klass B — "Objektet finns, typerna stämmer, men läsningen/skrivningen ger inget i drift."** Känd sedan 2026-08-04 och fortfarande obeslagen. Tre former, alla levande: payload-kolumn som inte finns (F14), kolumn läst via `select('*')` + property-access (T4/F17), tabell-/kolumnnamn i `client/api/*.js` som ingen statisk analys rör (F13).
→ **Grind:** utvidga `check-schema-drift.cjs` med (1) toppnivånycklar ur statiska `.insert()/.update()/.upsert()`-objektliteraler, (2) `client/api/*.js` i filurvalet. Båda är tillägg i en loop som redan finns.

**Klass C — "Testet passerar även om implementationen tas bort."** *Belagd av M2, M3, M5, M6 — fyra av sex mutationer missades.* Ingen grind mäter testernas informationsinnehåll; `test:run` räknar bara att de är gröna, och coverage räknar rader som *exekverats*, inte rader som *asserterats*. Ett tautologiskt test höjer coverage och sänker signalen samtidigt.
→ **Grind:** tautologi-lint med fryst tak (se G-B nedan), och/eller mutationsstickprov på en handfull kritiska filer i CI.

**Tre ytterligare blinda fläckar värda att skriva ned:**
- `eslint.config.js` scopar till `**/*.{ts,tsx}` → `client/api/*.js` (inklusive art. 9-grinden och rate-limitern) får **inga** ESLint-regler. `tsconfig.app.json` har `include: ["src"]` → de typkontrolleras inte heller. Serverkoden är den minst grindade koden i repot och den enda som kör med service role.
- `typecheck:ceiling` **räknar, fingeravtrycker inte**. Fixar man ett fel och inför ett annat blir summan 468 och grinden grön.
- `lint:design` mäter bara gradienter via regex på `.ts/.tsx` i `src/` — råa `linear-gradient` i CSS-filerna och DESIGN.md:s övriga regler (hub-färg per sida, hero-läge, EmptyState-kontraktet) är omätta.

---

#### F23 — Tre grindar som skulle betala sig
**Förslag**

**G-A: `lint:schema` över payloads och serverkod.** Fångar F13 och F14. `check-schema-drift.cjs` har redan snapshoten inläst och går igenom varje `.from()`-kedja. Två tillägg: plocka toppnivånycklarna ur statiska `.insert/.update/.upsert`-objektliteraler och jämför mot `snapshot.tables[table]` (hoppa över dynamiska objekt, precis som skriptet redan hoppar över dynamiska tabellnamn); och lägg `client/api/*.js` i filurvalet. *Skulle idag rapportera:* `consultant_participants.status` på `consultantService.ts:635`.
**Storlek:** M

**G-B: tautologi-lint med fryst tak.** Fångar F12, F15, F18 och gör "1 304 tester" till ett ärligt tal. Flagga varje `it`/`test` vars **samtliga** assertions kommer ur en förbjuden mängd: `toBeDefined()`, `toBeTruthy()`, `toBeInTheDocument()`, `not.toBeNull()`, `toHaveBeenCalled()` utan `With`/`Times`, `toBeGreaterThan(0)` på `.length`, samt assertions som ligger inuti `if (…)`. Samma ratchet som de tre befintliga taken: skriptet skriver ut det nya talet när skulden minskar.
**Storlek:** M

**G-C: mutationsstickprov i CI.** Fångar klass C direkt i stället för via proxy. Ett nattligt jobb som muterar N slumpvis valda rader i en allowlist av kritiska filer (`api/ai.js`, `services/consultantService.ts`, `App.tsx`, samtyckeskomponenterna) och failar om sviten förblir grön. Behöver inte vara fullständig mutationstestning — sex mutationer räckte för att hitta fyra hål här.
**Storlek:** M

---

### Utvecklarupplevelse

---

#### F24 — Verify-kedjan tar ~4 minuter; två separata `tsc`-körningar är flaskhalsen
**MEDEL**

**Mätt, per grind:**

| Grind | Tid |
|---|---:|
| `lint:design` | 0,8 s |
| `lint:vercel` | 2,3 s |
| `lint:schema` | 2,7 s |
| `typecheck:ceiling` | 39,6 s |
| `lint:ci` | 45,5 s |
| `typecheck:critical` | 68,7 s |
| `test:coverage` | ~68–85 s |
| **Summa `npm run verify`** | **≈ 4 min 5 s** |

Flaskhalsen är dubbelarbete: `typecheck-critical.cjs:23` kör `tsc --noEmit -p tsconfig.app.json` och `typecheck-ceiling.cjs:49` kör **samma** kommando en gång till. 108 sekunder för en kompilering som behöver göras en gång. Skripten filtrerar bara utdata olika — `critical` på TS2304/TS2307, `ceiling` på antalet.

**Åtgärd.** Kör `tsc` en gång, cacha utdatan i en temporär fil och låt båda skripten läsa den. Halverar typecheck-kostnaden till ~55 s och tar verify till under tre minuter. `test:coverage` är inte värd att optimera förrän F7 är löst — en flaky grind på 85 s är dyrare än en pålitlig på 120.

Hooken i övrigt fungerar som avsett: det villkorade fulla bygget (`.husky/pre-push`, mönstret på `vercel.json|package.json|vite.config|index.html|tsconfig|scripts/|.github/workflows/`) träffar rätt filmängd, och `set -e` gör att den faktiskt stoppar. Problemet är vad den *inte* kör (F8), inte hur den kör det.
**Storlek:** S

---

## 3. Förbättringsförslag för kvalitetsarbetet

**1. En röd CI som varit röd i 687 körningar är inte en grind — den är en lampa som ingen tittar på.** Det viktigaste enskilda greppet är inte fler tester utan att göra CI grön och sedan *required* på `main`. Så länge push = deploy och CI är permanent röd finns det ingen mekanism alls mellan en trasig commit och prod.

**2. Skilj på "blockerande" och "informerande" grindar.** Coveragetröskeln orsakade en `needs`-kaskad som stängde av build, Lighthouse och all e2e i månader. En grind som mäter en långsam trend ska inte kunna blockera en grind som mäter om koden ens bygger. Lägg coverage i ett eget jobb utan nedströmsberoenden.

**3. Mät testernas signal, inte deras antal.** Sviten växte 933 → 1 304 (+40 %) sedan 2026-08-04, och fyra av sex mutationer i den här granskningen missades. Antalet tester är det mest missvisande talet i projektet. G-B (tautologi-lint med fryst tak) gör signalen mätbar med samma ratchet-mekanik som redan fungerar för warnings, typfel och gradienter — det mönstret är projektets bästa uppfinning och bör återanvändas här.

**4. Gör mutationsstickprov till rutin vid granskning.** Sex mutationer tog under tio minuter och gav hårdare bevis än all läsning tillsammans. Det borde vara standardsteget när någon påstår att en kodväg är testad. Regeln: *fråga aldrig "finns det ett test?", fråga "vad händer om jag går sönder koden?"*.

**5. Serverkoden behöver komma innanför staketet.** `client/api/*.js` har ingen ESLint, ingen typkontroll, ingen schemakontroll, och tre av fyra filer har noll coverage — samtidigt som det är den kod som kör med förhöjda rättigheter och håller art. 9-grinden. Att utvidga `eslint.config.js` och `check-schema-drift.cjs` dit är billigt och täcker portalens känsligaste yta.

**6. Skriv kända defekter som `it.fails`.** `profileStore.test.ts:476` visar formen: nuläget låst i ett vanligt test, önskeläget i ett `it.fails` som blir rött när buggen lagas. Det är skillnaden mellan att dokumentera en bugg och att cementera den — och det borde vara standardmönstret för allt som hamnar i "kända defekter".

**7. Håll dokumentationen om grindarna synkad med grindarna.** CLAUDE.md säger sju grindar (det är åtta), säger att pre-push kör `verify` (den kör fem av åtta), och ROADMAP D13 pekar ut coverage som CI-orsaken (den är åtgärdad; orsaken är en annan). Varje sådan drift kostar en granskning att upptäcka.

---

## 4. Vad jag inte hann granska

- **CI-jobbloggarna i råform.** `/actions/jobs/{id}/logs` ger 403 (*"Must have admin rights to Repository"*) och artefaktlistan är tom. Felorsakerna är därför hämtade ur check-run-annotations och reproducerade lokalt. Annotations visar de sju kraschande filerna men inte hela stdout — det är möjligt att `test`-jobbet **också** bryter mot en coveragetröskel bakom collect-felet. Att coverage passerar lokalt med marginal på alla fyra mått gör det osannolikt, men det är inte uteslutet förrän någon med admin läser loggen.
- **Om `TEST_USER_EMAIL`-secrets finns i repot.** Kräver admin. Eftersom `e2e-authenticated` aldrig har kört går det inte att avgöra empiriskt.
- **En ren reproduktion av F2 lokalt.** Skulle kräva att `client/.env` flyttas undan eller att repot klonas om utan den; jag valde att inte röra arbetsträdet. Mekanismen är i stället belagd i tre oberoende led (annotations, `createClient('','')` kastar, `ci.yml` saknar env).
- **Playwright körd skarpt.** Specarna hade startat en egen dev-server på :5173 via `playwright.config.ts:80`; instruktionen var att inte köra dev-servrar. Skipp-siffrorna (74/94) är därför härledda ur skippvillkorens describe-omfång, inte ur en körning. Räkningen stämmer oberoende med förra granskningens.
- **Deploy-workflowens egna grindar.** Jag konstaterade att `deploy.yml` är grön på alla sex senaste commit:er men läste inte igenom dess smoke-test i detalj — bara att en körning (`74352902`, 2026-08-05 10:38) failade och att nästa gick igenom.
- **`supabase/functions/` (24 Deno-funktioner).** Utanför både vitest-sviten och alla åtta grindar. Ingen coverage uppmätt; jag har inte inventerat om de har egna tester.
- **Coverage per kritiskt flöde snarare än per katalog.** Jag mätte per fil och katalog. En flödesbaserad mätning (t.ex. "hur mycket av CV → PDF-kedjan exekveras av sviten") hade rangordnat F21 säkrare.
