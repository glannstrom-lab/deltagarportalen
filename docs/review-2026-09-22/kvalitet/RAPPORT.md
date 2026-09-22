# Kvalitetslinsen 2026-09-22: mutationer, beroenden, databasprestanda

Rapportör, inga käll- eller teständringar. Mätt 2026-09-22 kl. 23:07–23:55.

## 1. Mutationsstickprov: kan testerna falla?

**Metod.** En mutation i taget. Den första (M1) gjordes i arbetsträdet. Den visade att
`client/api/ai.js` skrevs av en annan agent samtidigt, se §4. Alla följande mutationer
gjordes därför i en **spegel** av repot i scratchpad: `client/`, `supabase/`, `docs/`,
`e2e/` och `archive/` kopierades, och `node_modules` länkades in som junction. Relevanta
tester valdes som `vitest related <fil>` plus varje testfil som nämner filen vid namn,
eftersom källtextgrindar inte syns för `related`. Spegelns baslinje hade 7 röda tester av
3 642. De kom från andra agenters halvfärdiga ändringar i kopieringsögonblicket
(i18n-nycklar, BulkActionsDialog, consent-loggas, AgentChat.dagbok, nav-smoke `/cv`), plus
`guest-returnto` som var flakig under last. De räknas inte nedan.

| # | Skydd | Mutation | Utfall | Test som fällde / borde ha fällt |
|---|---|---|---|---|
| M1 | Art. 9-grinden, kopplingen i handlern (`api/ai.js`) | `if (ART9_FUNCTIONS.has(fn))` → `if (false && …)` | **Fälld** | `aiHandlerResponse.test.ts` › "svarar 403 utan samtycke — och prompten byggs aldrig" |
| M5 | Art. 9-grinden, fail closed (`checkArt9Consent`) | catch-grenen returnerar `{ allowed: true }` | **Fälld** | `aiServerConsentGate.test.ts` › "FAIL CLOSED: blockerar när uppslaget kastar" |
| M2 | `checkAiEnabled`, kopplingen i `/api/ai` | `else if (!AI_ENABLED_EXEMPT_FUNCTIONS.has(fn))` → `else if (false)` | **Fälld** | `aiHandlerResponse.test.ts` (B28, 2 tester) |
| M6 | `checkAiEnabled` i edge-vägen (`supabase/functions/_shared/aiGate.ts`) | `if (!enabled) return {opted_out}` → `if (false) …` | **Överlevde** | Inget. `ai-sanningsregel.test.ts` kontrollerar bara att de fem Perplexity-funktionerna *anropar* `checkAiEnabled`, inte vad funktionen gör. Brytaren kan alltså slås av utan att något test märker det: ett konto med `ai_enabled=false` får då AI-svar från alla fem edge-funktionerna, exakt buggen från 2026-08-19. Det saknas ett beteendetest (Deno-koden går att importera med data-URL-greppet i minnet om `deno check`). |
| M4 | PII-sanering på servern, kopplingen (`sanitizeAll` i handlern) | `const data = body.data \|\| body` (ingen sanering) | **Fälld** | `aiHandlerResponse.test.ts` › B29 (4 tester) |
| M7 | PII-sanering i klienten (`lib/piiSanitizer.ts`) | personnummerregexen matchar aldrig (`\bX…`) | **Fälld** | 12 tester i `piiSanitizer.test.ts`, `AgentChat.pii.test.tsx`, `aiApi.test.ts`, `aiCompanySearchApi.test.ts` |
| M3 | `/api/ai`-funktionsvitlistan (`arKandFunktion`) | `hasOwnProperty.call(PROMPTS, fn)` → `fn in PROMPTS` | **Fälld** | `api-ai-prototypnycklar.test.ts` (6 tester) |
| M8 | Rensning vid kontobyte (`authStore` → `rensaVidUtloggning`) | anropet borttaget i kontobytesgrenen | **Fälld** | `utloggningNollstaller.test.ts` › "kontobyte UTAN explicit utloggning" |
| M9 | `single-krav-en-rad` | `applicationsApi.ts` `getByJobId`: `.eq('job_id').eq('user_id').maybeSingle()` → `.single()` | **Överlevde** | `single-krav-en-rad.test.ts` godkänner via allowlistposten `client/src/services/applicationsApi.ts::saved_jobs`. **Nyckeln är fil::tabell, inte anropsställe.** Därför blir varje nytt `.single()` mot `saved_jobs` i den filen (11 finns redan) godkänt på förhand, och likadant för alla andra allowlistade fil/tabell-par. Grinden fäller bara kategori 2 (`.limit/.order/…`). Nyckeln behöver bindas tätare, till exempel till funktionsnamn eller med ett räknetak per nyckel. |
| M10 | `idagLokalt` (`applicationsApi.ts`) | `formatLocalDate(new Date())` → `toISOString().split('T')[0]` | **Fälld** | `idagLokalt.test.ts` (källtextgrinden plus beteendetestet "kl. 00:30") |
| M11 | Konsulentexportens formelskydd (`deltagarExport.ts` `neutraliseraFormel`) | tecknet `-` borttaget ur `/^[=+\-@\t\r]/` | **Överlevde** | `BulkActionsDialog.export.test.tsx` provar bara `=HYPERLINK`. Positiv kontroll: tas `=` bort fäller testet. `+`, `-`, `@`, tabb och CR är okontrollerade, och OWASP räknar alla fem som formelstart. `-2+3+cmd\|' /C calc'!A0` är ett känt DDE-mönster. Det saknas ett tabelltest över alla sex tecknen. |
| M12a | `lint:schema` (`check-schema-drift.cjs`), kolumnkollen | `if (!known.has(col))` → `if (false)` | **Överlevde** | Inget test refererar skriptet (0 träffar). Positiv kontroll: med en fixtur `profiles.select('finns_inte_kol')` gav det orörda skriptet exit 1 och det muterade exit 0. |
| M12a′ | `lint:schema`, tabellkollen | `if (!tableSet.has(table))` → `if (false)` | Fälld av skriptet självt | Inte av något test. Tabellen föll igenom till kolumnkollen, som flaggade `finns_inte_xyz.id` som KOLUMN. Redundansen räddar tabellfallet, men inte RPC- och bucket-grenarna. |
| M12b | `lint:kolumner` (`check-insert-columns.cjs`) | `saknade = nycklar.filter(() => false)` | **Överlevde** | Inget test. Positiv kontroll: fixturen `profiles.update({finns_inte_kol2})` gav exit 1 orörd och exit 0 muterad. |
| M12c | `lint:grants` regel 1 (anon-ytan) | `f.anon && false` | **Överlevde** | `skript-lint-grants-anon-anropare.test.ts` provar bara regel 5 och den gröna baslinjen. Positiv kontroll: en snapshot med anon satt på `withdraw_consent` gav exit 1 orörd. |
| M12d | `lint:grants` regel 3 (`.rpc` i webbläsaren kräver `authenticated`) | `else if (!traffar.some(f => f.authenticated))` → `else if (false)` | **Överlevde** | Samma test. Det här är regeln som fångade samtyckesbuggen 2026-08-21, och den är själv oskyddad. Positiv kontroll: `withdraw_consent.authenticated=false` gav exit 1 orörd. |
| M14 | Sidflöde: återkalla samtycke (`consentApi.aterkallaSamtycke`) | `if (error)` → `if (false && error)` (felet sväljs, UI tror att det lyckades) | **Överlevde** | Det finns ingen `consentApi.test.ts`. `consent-loggas.test.ts` kontrollerar bara att ingen komponent skriver samtyckeskolumnen direkt. Art. 7.3 hänger på att återkallandet inte misslyckas tyst. |
| M15 | Sidflöde: Översiktens nästa steg (`nastaStegRegler.ts`), "laddning är inte tomhet" | `if (jobsok && jobsok.cv === null)` → `if (!jobsok?.cv)` | **Fälld** | `nastaStegRegler.test.ts`, `OversiktPanel.test.tsx`, `HubOverview.test.tsx` |

**Summa: 17 mutationer mot 12 skydd plus två sidflöden. 9 fälldes, 7 överlevde och 1
fälldes bara av skriptets egen redundans.** Allt i `/api/ai`-handlern och klientens
PII-väg håller, liksom rensningen och datumet. Hålen finns i tre grupper:

1. **Grindarna vaktas inte själva.** `lint:schema` och `lint:kolumner` har noll tester.
   `lint:grants` har test för en av fem regler. Varje skript kan brytas utan att
   `npm run verify` märker det, eftersom det enda som kör dem är de själva. Mönstret i
   `skript-lint-grants-anon-anropare.test.ts` (kör skriptet mot en förändrad
   snapshot/fixtur och kräv exit 1) går att kopiera rakt av.
2. **Edge-vägens AI-brytare** har bara ett närvarotest.
3. **Tre skydd testas med ett enda fall**: formelskyddet (bara `=`), samtycke (bara
   positiv väg) och single-kravets allowlist (för grov nyckel).

## 2. Beroenden (bara det som går att agera på)

`npm audit --omit=dev`: **0 sårbarheter** i både `client/` och roten.

**Oanvända sedan STA-arkiveringen.** Verifierat med grep över `client/src`, `client/api`,
`client/scripts` och configfilerna. Enda träffarna ligger i `archive/2026-09-sta/`:
- `xlsx` (SheetJS 0.20.3, CDN-tarball; ett beroende i produktionsgrenen utan en enda importör)
- `papaparse` + `@types/papaparse`
- `pdf-lib`

**Depcheck gav falska positiva, som ska behållas:** `@sparticuz/chromium-min` och
`puppeteer-core` (`api/cv-pdf.js`, dynamisk `await import`), `@vercel/blob`
(`api/upload-image.js`), samt tailwind/postcss/autoprefixer/coverage-v8, som laddas via config.

**Odeklarerade beroenden:**
- `path-to-regexp`: `scripts/check-vercel-config.cjs` (`lint:vercel`, CI-grind) kräver
  det, men paketet kommer bara transitivt via `@vercel/node@5.9.7` → `path-to-regexp@6.1.0`.
  `@vercel/node` har i sin tur ingen importör i koden. Tas det bort som "oanvänt", eller
  byter @vercel/node beroende, faller `lint:vercel`. Deklarera `path-to-regexp` explicit.
- `playwright`: `client/scripts/og-bilder.cjs` löses bara via rotens `@playwright/test`.

**Versionsglapp värda ett beslut:**
- `@supabase/supabase-js`: client 2.97.0, rot 2.103.2, senaste 2.117.0. Två versioner
  i samma repo.
- `@sparticuz/chromium-min` 148 → 153 och `puppeteer-core` 25.8 → 25.11. **Byts
  chromium-min måste en ny tar läggas upp och `CHROMIUM_PACK_URL` pekas om** (CLAUDE.md).
- `@sentry/react` 10.45 → 10.75 och `@tanstack/react-query` 5.90 → 5.103 ligger inom
  semver (`npm update` räcker).
- Stora majorsteg (vite 8, vitest 5, typescript 7, eslint 10, i18next 26, lucide 1.x,
  framer-motion 13) bör tas som planerade punkter, inte i ett svep.

**Dubbletter:** bara zod ×4 (3.22 / 3.25 / 4.1 / 4.3). Alla ligger i server- och
verktygsträdet (`@vercel/node`, `@vercel/blob`, `puppeteer-core`), inte i
webbläsarbundlen. Ingen åtgärd.

## 3. Databasens prestanda (read-only)

`pg_stat_statements` finns, med data sedan 2026-02-23. Siffrorna innehåller e2e- och
testtrafik.

**RLS.** **389 av 430 policyer** (public + storage) anropar `auth.uid()` utan
`(select auth.uid())`-inkapsling. **0** är inkapslade. Det är Supabase-advisorns klassiska
fynd: funktionen utvärderas per rad i stället för en gång per fråga. Flest träffar har
`calendar_events` (8), `saved_jobs` (7) och `mood_logs` (6). Med dagens tabellstorlek
(den största har under 1 000 rader) märks det inte, men det skalar linjärt med första
kunden. `profiles` UPDATE-policyn för konsulent kör dessutom en `EXISTS` mot
`consultant_participants` per rad.

**Frågor som går att koppla till kod:**
- **`exercise_answers` upsert: 11 765 anrop för 20 rader.** `pages/Exercises.tsx:273`
  sparar till molnet **vid varje tangenttryckning**. Kommentaren säger ordagrant "(debounced
  in real implementation)", men det finns ingen debounce. Utöver lasten kan skrivningar
  komma fram i fel ordning, och då vinner en äldre text. `interest_guide_progress` upsert
  har samma mönster: 4 516 anrop (`services/cloud/intresseguide.ts`).
- `profiles` UPDATE `onboarding_progress` (2 641 anrop, 6 ms i snitt, max 393 ms) och
  `onboarded_hubs` (1 524 anrop, **18 ms i snitt**). En enradsuppdatering bär sju triggrar
  (`protect_last_superadmin`, `profiles_skyddade_kolumner`, `sync_ai_enabled`, audit,
  consent-logg m.fl.) plus tre permissiva UPDATE-policyer med `check_role_change_allowed()`
  och `is_admin_or_superadmin()`. Källa: `hooks/useOnboardedHubsTracking.ts`,
  `services/cloud/installningar.ts`.
- `career_milestones` UPDATE: **170 ms i snitt** (64 anrop). Triggern
  `update_career_plan_progress` räknar om `AVG(progress)` och uppdaterar `career_plans` vid
  varje ändring.
- `check_rate_limit` via anon: 17 ms i snitt, 1 436 anrop (`api/ai.js` m.fl.).
- Den största totalkostnaden är PostgREST:s schemaintrospektion (`pg_timezone_names`
  882 s, typ- och relationsfrågor ~400 s, ~1 415 omladdningar). Det är plattformens
  kostnad för varje schemaomladdning, alltså varje DDL via `db query --linked`. Den kan
  inte åtgärdas i appen, bara minskas genom att samla DDL.

**Index:**
- **`notifications` saknar index på `user_id`.** Den har 8 369 seq_scan mot 17 idx_scan,
  och frågan `WHERE user_id = … ORDER BY created_at` körs 6 793 gånger. Det enda indexet
  utöver pkey ligger på `read`.
- **46 främmande nycklar saknar index.** Bland dem finns `notifications.user_id`,
  `consultant_notes.consultant_id`, `consultant_requests.participant_id`,
  `invitations.*` och `activity_*.org_id`, fullständig lista i körningen. De gör kaskader
  och JOIN:ar dyra.
- **24 dubblettindex**, där ett icke-unikt index täcker samma kolumner som ett unikt:
  `idx_cvs_user_id`, `idx_saved_jobs_user`, `idx_cover_letters_user`,
  `idx_user_preferences_user_id`, `idx_article_progress_user_article`, `idx_articles_slug`
  m.fl. De kostar bara skrivningar.
- **98 av 504 index** (icke-unika, ej pkey) har `idx_scan = 0`, totalt 1,2 MB. De är
  kandidater för gallring efter en längre mätperiod. Flera tillhör STA-tabellerna.

Seq_scan-topplistan (`article_reading_progress`, `consultant_participants`,
`user_preferences`) gäller tabeller på 20–40 rader, där planeraren väljer seq scan med
rätta. Den är ingen åtgärd i dag.

## 4. Återställning och en incident

**Arbetsträdet:** en enda fil muterades, `client/api/ai.js` (M1). Filen återställdes från
en bytekopia och jämfördes med `Buffer.compare`: byte-identisk,
sha256 `e22909af…e055`.

**Incident, som föranleddes rapporteras:** `ai.js` var ren enligt `git status` kl. 23:07.
När M1 lades på omkring 23:15:10 hade en annan agent hunnit ändra filen (+99/−29 rader,
SSE-avbrott). Kopian togs då, så deras ändring kom med. Mutationen låg kvar i ~40 s
(23:15:10–23:15:51). **Skrev den andra agenten till `ai.js` just i det fönstret, är den
skrivningen överskriven.** Kontroll efteråt: deras nya tester
(`api-ai-sse-avbrott`, `api-ai-usage-log-fel`, `api-job-alerts-eskapering`) var gröna
mot den återställda filen kl. 23:17, och filen har skrivits vidare av dem sedan
(23:23, 66 365 byte). Det talar för att inget gick förlorat, men det går inte att bevisa.
Agenten som äger `ai.js` bör se över sin senaste ändring. Efter M1 lades inga fler
mutationer i arbetsträdet.

**Spegeln:** alla övriga 16 mutationer återställdes byte-identiskt (logg:
`scratchpad/restore-log.txt`). Spegeln raderades efteråt, och junctions togs bort med
`rmdir` före raderingen. Kontrollerat att `client/node_modules` är orörd.

Inga git-skrivningar. Inga `npm install/update/audit fix`. Enbart SELECT mot databasen.
