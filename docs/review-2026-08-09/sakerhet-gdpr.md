# Säkerhets- och dataskyddsgranskning — Jobin / Deltagarportalen

**Datum:** 2026-08-09 · **Commit:** `f2877dcb` (main, rent arbetsträd)
**Typ:** Read-only. Ingen kod ändrad, ingen migration körd, ingen prod-rad skriven.
**Metod:** Kodläsning + live-verifiering mot prod-databasen (`npx supabase db query --linked`, enbart `SELECT`/`pg_catalog`-inspektion samt en rollad `set local role anon`-transaktion) + skarpa HTTP-anrop mot `https://www.jobin.se` och `https://odcvrdkvzyrbdzvdrhkz.supabase.co/functions/v1/*` med statuskoder redovisade.

> **Om bevisen.** Varje påstående nedan bär antingen SQL-utfall, en HTTP-statuskod med svarskropp, eller `fil:rad`. Där jag medvetet avstått från att exekvera något (t.ex. de två `SECURITY DEFINER`-funktioner som raderar rader) står det uttryckligen. Där jag inte kunnat verifiera står **obekräftat**.

---

## Sammanfattning

Säkerhetspaketet A16–A21 håller — jag har verifierat vart och ett mot prod, inte mot roadmapen. Rolleskaleringen är stängd (två UPDATE-policyer kvar på `profiles`, båda guardade), de 18 IDOR-funktionerna ger `42501`, art. 9-grinden svarar `200` i skarp drift, exporten härleder tabellistan ur schemat, `mood_logs` och `storage.objects` är städade. Det är verkligt arbete, inte pappersåtgärder.

Det som **inte** hittades 4 augusti är allvarligare än det som lagades. Tre saker sticker ut. (1) **Repot är publikt** — vilket gör varje historisk läcka till en pågående händelse; OpenRouter-nyckeln är verifierat död, men ett prod-konsulentkonto låg med klartextlösenord i historiken. (2) **A17 tog 18 av 53 funktioner.** 35 `SECURITY DEFINER`-funktioner är fortfarande anropbara av `anon` — via PUBLIC-defaulten, exakt fällan A17 själv dokumenterade — och två av dem raderar rader. Bevisat med HTTP 200 från internet. (3) **Perplexity är en oredovisad tredjelandsmottagare.** Sex edge-funktioner skickar bl.a. användarens hemadress till `perplexity/sonar`; ordet "Perplexity" finns inte i integritetspolicyn, Art. 30-registret eller DPIA:n.

Dubblettpolicy-mönstret är inte utrotat: `interest_results` har kvar exakt den lucka som `mood_logs` fick lagad i A21. Och gallringen (A6) står stilla — nu blockerad av att `CRON_SECRET` aldrig sattes, vilket jag mätte som `503` från prod.

**Vad en tillsynsmyndighet hittar först:** en dokumenterad lagringspolicy som inte körs, ett samtyckesregister utan en enda hälso- eller wellnessrad, och en tredjelandsmottagare som inte står i registret.

---

# 🔴 KRITISK

## 1 — 35 `SECURITY DEFINER`-funktioner är fortfarande anropbara av `anon`; A17 tog 18 av 53

**Allvarlighet: KRITISK** · **Storlek: M**

A17 revokade EXECUTE på de 18 funktioner som förra granskningen räknade upp. Den listan var uttömmande för *det mönstret* (`p_user_id`-parameter), inte för problemet. Resten av definer-uppsättningen står orörd med Postgres PUBLIC-default.

**Bevis (prod):**

```sql
select proname, has_function_privilege('anon', p.oid,'EXECUTE') as anon_exec, proacl::text
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and p.prosecdef;
```
→ **35 rader med `anon_exec = true`**, samtliga med `{=X/postgres, …}` i `proacl` — den tomma rollen före `=` är PUBLIC. Det är precis den fälla A17-raden i ROADMAP själv beskriver ("REVOKE mot en roll utan explicit grant lyckas tyst"); åtgärden generaliserades bara aldrig till resten av schemat.

**Bevis att de är nåbara från internet** (enbart den publika anon-nyckeln ur klientbundlen):
```
POST /rest/v1/rpc/check_health_consent  {"user_uuid":"ceee4846-…"}
→ HTTP 200
false
```

**De två som gör skada** (jag har **inte** exekverat dem — de raderar rader):

| Funktion | Kropp (ur `pg_proc.prosrc`) |
|---|---|
| `cleanup_old_activities` | `DELETE FROM public.user_activities WHERE created_at < NOW() - INTERVAL '2 years'` |
| `cleanup_rate_limits` | `DELETE FROM rate_limits WHERE window_start < NOW() - INTERVAL '1 hour'` |
| `increment_template_usage` | `UPDATE consultant_goal_templates SET usage_count = usage_count + 1 WHERE id = template_id` |

Alla tre körs som `postgres` och förbigår RLS. `cleanup_old_activities` är ofarlig i dag bara därför att portalen är fyra månader gammal — om två år raderar den aktivitetsloggen på begäran av vem som helst på internet. `cleanup_rate_limits` tar bort räknare (redan utgångna fönster, så effekten är begränsad — men det är en oautentiserad skrivning mot skyddsinfrastrukturen).

**Informationsläckor i samma uppsättning:** `check_health_consent(uuid)`, `check_wellness_consent(uuid)` och `consultant_has_access(uuid,uuid,text)` låter anon fråga om en godtycklig användare har lämnat hälso- respektive wellnesssamtycke, och om en viss konsulent har åtkomst till en viss deltagare. Det är art. 9-adjacent metadata (vem i registret har hälsodata alls) utan inloggning.

**Åtgärd:** `REVOKE EXECUTE ON FUNCTION … FROM PUBLIC` på hela definer-uppsättningen, följt av explicita `GRANT TO authenticated`/`service_role` för de som faktiskt anropas. Verifiera med `has_function_privilege`, inte med att REVOKE:en gick igenom. Överväg att radera `cleanup_*` — de anropas av ingen (pg_cron finns inte, se fynd 8).

**Positivt i samma uppsättning:** samtliga 53 definer-funktioner har pinnad `search_path` (`count(*) filter (where prosecdef and proconfig is null)` → **0**). Den klassen är stängd och välskött.

---

## 2 — Repot är publikt, och ett prod-konsulentkontos lösenord har legat i klartext i historiken

**Allvarlighet: KRITISK** (som kontext för allt annat) · **Storlek: S**

**Bevis:**
```
curl https://api.github.com/repos/glannstrom-lab/deltagarportalen
→ HTTP 200,  "private": false,  "visibility": "public"
```
Den öppna verifieringspunkten från 4 augusti ("avgör om SEC-03 är akut eller brådskande") är därmed besvarad: **publikt**. Varje historisk läcka är en pågående händelse, inte en intern.

**Den goda nyheten — A1/SEC-03 är faktiskt stängd.** Nyckeln ligger kvar i 14 commits (`git log --all -S "sk-or-v1-" --oneline`), men är återkallad:
```
curl -H "Authorization: Bearer sk-or-v1-e2880334d…" https://openrouter.ai/api/v1/key
→ HTTP 401 {"error":{"message":"User not found.","code":401}}
```
Nuvarande `OPENROUTER_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY` och `BLOB_READ_WRITE_TOKEN` har **0 träffar** i hela historiken. Bundlen (`client/dist`, byggd 2026-08-09) innehåller exakt en JWT och dess payload är `"role":"anon"`. Alla riktiga `.env`-filer är gitignorerade; de fem trackade är `.example`.

**Det nya fyndet:**
```
e2e/archive/login-consultant.cjs:22-23
  const EMAIL    = 'claude-playwright-consultant@jobin.test'
  const PASSWORD = 'Konsulent-Test-2026-05-23-Jobin!'
```
Filens egen kommentar säger att kontot medvetet ligger kvar i **prod-databasen**. Lösenordet är rullat (verifierat: `POST /auth/v1/token` → `HTTP 400 invalid_credentials`), så exponeringen är neutraliserad — men mönstret att committa prod-inloggningar till ett publikt repo är inte, och kontot lever kvar med konsulentbehörighet.

**Åtgärd:** radera testkonsulentkontot ur prod eller sätt det bakom en separat testinstans. Överväg `git filter-repo` på `sk-or-v1-` och lösenordssträngen om repot ska förbli publikt (**L**).

---

# 🟠 HÖG

## 3 — `interest_results`: en `ALL`-policy upphäver hälsosamtyckets grind (A21:s syskon, ostädat)

**Allvarlighet: HÖG (GDPR art. 9)** · **Storlek: S**

A21 lagade `mood_logs`. Samma lucka sitter kvar på grannbordet.

**Bevis (prod, `pg_policies`):**
```
Users can insert interest results with health consent | INSERT | CHECK ((auth.uid()=user_id) AND check_health_consent(auth.uid()))
Users can CRUD own interest results                   | ALL    | qual=(auth.uid()=user_id)   with_check=NULL
```
`with_check` är `NULL` på `ALL`-policyn, och Postgres använder då `qual` även för INSERT. Två permissiva policyer OR:as → `check_health_consent` är aldrig en grind. Identisk mekanik som `"Users can create own mood logs"`, som A21 droppade.

**Kontrollerat:** `interest_results` har 1 rad och `profiles` har 1 med `health_consent_at is not null` — grinden respekteras i praktiken av klienten idag. Det är tur, inte konstruktion; databaslagret bär inte kravet.

**Åtgärd:** droppa `"Users can CRUD own interest results"` (de fem specifika policyerna täcker redan SELECT/UPDATE/DELETE), eller ge den ett `WITH CHECK` med samtyckeskontrollen. Kontrollera skrivvägarna först, som A21 gjorde.

**Sidoanmärkning på samma tabell:** `"Consultants can view participant interest results"` (`profiles.consultant_id = auth.uid()`) står bredvid `"Consultants can read shared interest results"` (kräver `share_health_data = true`). Den första räcker ensam — konsulentens hälsodelningsgrind på `interest_results` är alltså också upphävd. `mood_logs` har inte den dubbletten.

---

## 4 — Perplexity är en oredovisad tredjelandsmottagare, och tar emot användarens hemadress

**Allvarlighet: HÖG (GDPR art. 13/14, 30, 44)** · **Storlek: M**

**Bevis:** sex edge-funktioner hårdkodar en annan modell än den låsta:
```
ai-career-assistant/index.ts:367,416   model: 'perplexity/sonar'
ai-commute-planner/index.ts:168,200    model: 'perplexity/sonar'
ai-company-analysis/index.ts:183,215   model: 'perplexity/sonar'
ai-company-search/index.ts:333,390,463 model: 'perplexity/sonar'
ai-industry-radar/index.ts:169,206     model: 'perplexity/sonar'
```
`sonar` är en **sökmodell** — den slår upp prompten live mot webben. Prompten innehåller bland annat:
```
ai-commute-planner/index.ts:48-51
  HEMADRESS: ${homeAddress}
  ARBETSPLATSADRESS: ${workAddress}
```

**Vad dokumenten säger:** `grep -i perplexity` ger **noll träffar** i `client/src/pages/Privacy.tsx`, `docs/GDPR-ART30-REGISTER.md` och `docs/DPIA-PORTAL.md`. Registret listar OpenRouter som enda AI-mottagare (`GDPR-ART30-REGISTER.md:133`, `:453`). Deltagaren informeras alltså om en mottagare och får en annan.

Detta bryter också mot `docs/AI_MODEL_LOCKING.md` och CLAUDE.md:s "AI-modellen är låst av kostnadsskäl" — inget av taken i `client/api/ai.js` gäller dessa vägar (`checkDailyTokenCap` finns bara på Vercel-vägen, `ai.js:193-218`).

**Åtgärd:** antingen ta bort `sonar` och gå på den låsta modellen, eller för in Perplexity i biträdesförteckningen, Art. 30-registret, DPIA:n och integritetspolicyn — och sluta skicka hemadressen dit.

---

## 5 — Art. 9-grinden gäller bara Vercel-vägen; nio edge-AI-funktioner har ingen samtyckeskontroll alls

**Allvarlighet: HÖG** · **Storlek: M**

**Bevis:** `grep -rn "ai_consent\|ai_enabled" supabase/functions/` → **noll träffar**. `checkArt9Consent` existerar enbart i `client/api/ai.js:232-251`.

Nio edge-funktioner (`ai-assistant`, `ai-cover-letter`, `ai-cv-writing`, `cv-analysis`, `ai-career-assistant`, `ai-commute-planner`, `ai-company-analysis`, `ai-company-search`, `ai-industry-radar`) skickar personuppgifter till OpenRouter/Perplexity utan att läsa vare sig `ai_consent_at` eller `ai_enabled`. En användare som återkallat AI-samtycket i Inställningar (art. 21-invändning) fortsätter alltså få sina uppgifter överförda på nio vägar. `cv-analysis` skickar hela CV:t inklusive namn; `ai-commute-planner` hemadressen.

Samma vägar går också förbi PII-saneringen: `sanitizeForAi` används på **ett** ställe, `client/src/services/aiApi.ts:103`.

**Positivt:** A19 håller i skarp drift. Verifierat med riktig inloggad deltagare:
```
POST https://www.jobin.se/api/ai  {"function":"vecko-reflektion", …}
→ HTTP 200  {"success":true,"reflektion":{…}}
```
Grinden nekar inte längre alla, och den är fortsatt fail closed (`ai.js:278-281`).

---

## 6 — Rate-limit-identiteten är klientstyrbar: de sju publika proxyerna är i praktiken öppna igen

**Allvarlighet: HÖG** · **Storlek: S**

**Bevis:** `supabase/functions/_shared/proxyGuard.ts:56-59` och `client/api/job-alerts.js:600-602` tar `req.headers.get('x-forwarded-for')?.split(',')[0]` — **första** värdet i kedjan, alltså det anroparen själv sätter.

En angripare som roterar `X-Forwarded-For: 1.2.3.<n>` får en ny räknare per anrop. A13:s per-IP-limit (30–60/min) på `af-jobsearch`, `af-taxonomy`, `af-trends`, `af-enrichments`, `af-historical`, `af-jobed` och `education-search` är därmed verkningslös, och funktionerna är åter open proxies mot Arbetsförmedlingens API i Jobins namn.

**Bekräftat att de svarar utan användarinloggning** (bara anon-nyckeln):
```
POST /functions/v1/af-trends       → HTTP 200  {"total_jobs":38959,…}
POST /functions/v1/education-search → HTTP 200  {"educations":[…]}
```

**Åtgärd:** använd sista (eller näst sista) hoppet i `x-forwarded-for`, eller plattformens `cf-connecting-ip`/`x-real-ip`.

---

## 7 — CORS-kontrollen i edge-funktionerna sker efter att arbetet är gjort

**Allvarlighet: HÖG** · **Storlek: S**

**Bevis:** `supabase/functions/_shared/cors.ts:127-137` avvisar okänd origin **när svaret byggs**. `validateOriginOrReject` (`cors.ts:111`) finns men anropas inte från någon funktion.

Konsekvensen är att `403 Origin not allowed` är kosmetiskt. Ett `curl` utan `Origin`-header mot `send-invite-email` med en giltig Bearer skickar mejlen (`send-invite-email/index.ts:404-413`) och returnerar sedan 403. `cv-analysis` skriver raden till `cv_analyses` (`:158`) innan avvisningen.

Jag har mätt att origin-grinden är den enda som skiljer flera funktioner från anon-nyckeln:
```
POST /functions/v1/send-invite-email  (anon-nyckel, ingen Origin)  → HTTP 403 {"error":"Origin not allowed"}
POST /functions/v1/send-invite-email  (anon-nyckel, Origin: https://www.jobin.se) → HTTP 401 {"error":"Invalid token"}
```
Här räddar tokenkontrollen. Men eftersom `Origin` är en header anroparen sätter fritt är ordningen fel princip: verifiera origin **först**, eller sluta behandla den som en säkerhetsgrind.

---

## 8 — Ingen gallring körs, och A6 är nu blockerad av att `CRON_SECRET` aldrig sattes

**Allvarlighet: HÖG (GDPR art. 5.1.e)** · **Storlek: S (dashboard) + M (verifiering)**

**Bevis (prod):**
```sql
select count(*) from pg_extension where extname='pg_cron';                                  → 0
select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace
  where n.nspname='cron';                                                                    → 0
select count(*) from ai_usage_logs where created_at < now() - interval '90 days';            → 5
select min(created_at)::date from ai_usage_logs;                                             → 2026-04-08
```
Oförändrat sedan 4 augusti. Fem AI-loggrader är nu **123 dagar** gamla mot en 90-dagarspolicy.

**Nytt:** A18-fixen är deployad och fail closed — men hemligheten är inte satt i prod:
```
POST /functions/v1/send-inactivity-warning  (anon-nyckel, Origin: https://www.jobin.se)
→ HTTP 503 {"error":"Cron authentication not configured"}
```
Det bevisar två saker på en gång. Vakten (`_shared/cronAuth.ts:42-46`) fungerar och stänger vid felkonfiguration — det är rätt designval. Och `CRON_SECRET` saknas i Supabase edge-secrets, vilket betyder att funktionen **aldrig har körts skarpt** och att inaktivitetsvarningarna kommer att svara 503 även för cron-jobbet den dagen A6 aktiveras.

**Åtgärd i ordning:** (1) sätt `CRON_SECRET`, (2) lös fynd 9 (raderingssignaturen), (3) aktivera pg_cron, (4) verifiera att varje av de fyra jobben faktiskt kör en gång — mät radantal, inte jobbdefinitioner.

---

## 9 — Samtyckesregistret har noll rader för hälsa och wellness

**Allvarlighet: HÖG (GDPR art. 7.1)** · **Storlek: S**

**Bevis (prod):**
```sql
select consent_type, action, count(*) from consent_history group by 1,2;
→ ai_processing granted 15 / withdrawn 1 · marketing withdrawn 1
  privacy granted 17 / withdrawn 1 · terms granted 17 / withdrawn 1
```
**Ingen rad för `health_consent` eller `wellness_consent`** — oförändrat sedan 4 augusti (SEC-19), trots att `profiles` har 1 respektive 2 användare med samtyckestidsstämpel satt. Orsaken är kvar: togglen i `Settings.tsx` skriver kolumnen via `userApi.updateProfile()` i stället för att gå via `grant_consent`/`withdraw_consent`, som är det enda stället som skriver historik.

För exakt de två art. 9-samtycken där bevisbördan är hårdast går det alltså inte att visa när samtycket gavs, mot vilken policyversion, eller att det återkallats. Det är den enskilt lättaste bristen för en tillsynsmyndighet att konstatera.

---

## 10 — CV och personligt brev ligger kvar i `localStorage` efter utloggning

**Allvarlighet: HÖG för den här målgruppen** · **Storlek: S**

**Bevis:** `client/src/stores/authStore.ts:393-417` — `signOut` nollar zustand-state och Sentry-kontexten men rör inte appens egna localStorage-nycklar. Kvar efter utloggning ligger bland annat:

| Nyckel | Innehåll | Skrivs i |
|---|---|---|
| `cover-letter-write-draft` | hela brevet + formulärdata | `CoverLetterWrite.tsx:234` via `useAutoSave.ts:29` |
| `cv-edit-version` | CV-version som JSON | `MyCVs.tsx:211` |
| `job-applications-crm` | ansökningar | `CRMTab.tsx:62` |
| `interest-guide-share` | intresseresultat | `ResultsView.tsx:154` |
| `default_cv_id`, `dailyTask*`, `energy-level` | | |

Målgruppen är arbetssökande som ofta sitter på delade datorer — jobbcentrum, bibliotek, Arbetsförmedlingens lokaler. Nästa person som öppnar webbläsaren kan läsa föregående deltagares personliga brev ur DevTools utan att logga in.

Supabase-sessionen städas korrekt av `supabase.auth.signOut()` (`lib/supabase.ts:213`). Det är appens egen data som blir kvar.

**Åtgärd:** en `clearUserScopedStorage()` i `signOut` med en explicit nyckellista (allowlist, inte `localStorage.clear()` — språkval och cookie-samtycke ska överleva).

---

## 11 — CI-jobbet `security` är rött: fyra high-sårbarheter i produktionsberoenden

**Allvarlighet: HÖG** · **Storlek: S**

**Bevis:**
```
cd client && npm audit --omit=dev --audit-level=high   → EXIT CODE 1
{"low":0,"moderate":2,"high":4,"critical":0,"total":6}
```

| Sev | Paket | Version | Not |
|---|---|---|---|
| high | `react-router` / `react-router-dom` | 7.18.1 | RSC Mode CSRF Bypass, GHSA-qwww-vcr4-c8h2 |
| high | `nanoid` | 5.1.7 (via `docx@9.6.1`) | fix finns |
| high | `ip-address` | 10.2.0 (via `puppeteer-core → socks`) | fix finns |
| moderate | `dompurify` ≤3.4.12, `undici` (via `@vercel/blob`) | | fix finns |

Alla har `fixAvailable: true`. `ci.yml:333-335` kör steget **utan** `continue-on-error` (det togs bort i A14) — jobbet `security` faller alltså vid nästa körning, och det har inga `needs`, så det faller oberoende av coverage-felet i D13. Kommentaren ovanför steget påstår "A14 klar → 0 prod-sårbarheter"; det stämde när den skrevs.

Det här är alltså **ett andra rött CI-jobb** utöver D13.

---

## 12 — Hemlighetsscanningen i CI är en tyst no-op på den väg som deployar

**Allvarlighet: HÖG (process)** · **Storlek: S**

**Bevis:** `.github/workflows/ci.yml`
```yaml
- uses: trufflesecurity/trufflehog@main
  with:
    base: ${{ github.event.repository.default_branch }}
    head: HEAD
    extra_args: --only-verified
```
Vid push till `main` är `base` och `head` samma commit-range → diffen är tom → scanningen hittar per definition ingenting. Den fungerar bara för PR:er, och projektet använder inga feature-grenar (CLAUDE.md: "Allt går direkt på `main`"). Samma familj som `e2e-authenticated` som skippar tyst.

Dessutom är actionen pinnad till den **rörliga** refen `@main` — den som kan pusha till trufflehogs huvudgren kör kod i ert workflow, med tillgång till jobbets kontext.

`--only-verified` hade heller aldrig fångat den läckta OpenRouter-nyckeln.

**Åtgärd:** pinna till en SHA, och scanna hela historiken (eller `--since-commit`) på push till main.

---

## 13 — Delade Deno-beroenden är opinnade, inklusive `_shared/rateLimit.ts`

**Allvarlighet: HÖG (supply chain)** · **Storlek: M**

**Bevis:** ingen `deno.json`, ingen `import_map.json`, ingen lockfil i `supabase/`.

| Import | Antal filer | Bedömning |
|---|---|---|
| `https://deno.land/std@0.168.0/http/server.ts` | 17 | dec 2022, ~3,5 år gammal |
| `https://esm.sh/@supabase/supabase-js@2.38.4` | 13 | pinnad, OK |
| `https://esm.sh/@supabase/supabase-js@2` | 5 | **opinnad** |

De opinnade: `bolagsverket/index.ts:14`, `learning-analyze-gap/index.ts:6`, `learning-progress/index.ts:5`, `learning-recommend/index.ts:5` och — värst — **`_shared/rateLimit.ts:12`**, som är delad infrastruktur för hela edge-lagret. Varje `supabase functions deploy` hämtar senaste 2.x. En komprometterad eller regressiv release går rakt in i produktion utan att en enda rad kod ändras, och `deploy.yml` deployar vid varje push till main.

---

# 🟡 MEDEL

## 14 — Vercel-preview-CORS: bevisat förfalskningsbar mot prod

**Storlek: S**

**Bevis (skarpt anrop mot prod, inte kodläsning):**
```
OPTIONS https://www.jobin.se/api/ai
  Origin: https://deltagarportal-abc123-evilteam.vercel.app
→ HTTP 200
  Access-Control-Allow-Origin: https://deltagarportal-abc123-evilteam.vercel.app
  Access-Control-Allow-Credentials: true
```
Vercel-projektnamn är unika per konto, inte globalt — vem som helst kan skapa ett gratisprojekt vars preview-URL matchar `/^https:\/\/deltagarportal(en)?-[a-z0-9]+-[\w-]+\.vercel\.app$/`. Regexen finns kvar på fyra ställen: `client/api/ai.js:357`, `client/api/cv-pdf.js:113`, `client/api/job-alerts.js:100`, `supabase/functions/_shared/proxyGuard.ts:32`.

**Faktisk påverkan är begränsad** — portalen autentiserar med Bearer-token ur `localStorage`, inte cookies, så en angriparsida kan inte rida på sessionen. Grinden gör alltså inget nyttigt och `Allow-Credentials: true` är onödigt. Ta bort båda hellre än att laga regexen.

## 15 — Fyra definierade rate limits anropas aldrig

**Storlek: S**

`supabase/functions/_shared/rateLimit.ts` definierar gränser som ingen kod använder — `checkRateLimit` importeras inte i respektive `index.ts`:

| Funktion | Definierad gräns | Rad i rateLimit.ts |
|---|---|---|
| `cv-analysis` | 5/min | `:27` |
| `send-invite-email` | 10/min | `:29` |
| `learning-recommend` | 30/min | `:30` |
| `learning-progress` | 50/min | `:31` |

SEC-14 flaggade två; nu är de fyra. Konkret konsekvens för `send-invite-email`: en inloggad konsulent kan POSTa `{invitationIds:[…50]}` (`:396`) i obegränsad takt → 50 riktiga mejl per anrop via Resend från jobin.se-avsändare. Ägarkontrollen (`:216-222`) begränsar *vilka* inbjudningar, inte hur ofta samma inbjudan får mejlas om.

## 16 — Fail-open rate limit på de dyraste vägarna

**Storlek: S**

`client/api/cv-pdf.js:43` och `:55`, `client/api/upload-image.js:99` och `:111`, `supabase/functions/bolagsverket/index.ts:330-332` returnerar alla `{allowed:true}` när `check_rate_limit`-RPC:n felar. `client/api/ai.js:162-165` och `_shared/rateLimit.ts:88-91` går i samma läge till in-memory-fallback — skillnaden är oavsiktlig, samma mönster, olika utfall.

`cv-pdf` startar Chromium på 1024 MB / 60 s per anrop (`vercel.json:8-11`). Enligt projektets egen fail-open/fail-closed-regel (CLAUDE.md 2026-08-03) är kostnaden här hög nog att motivera fallback. Oförändrat sedan SEC-15.

## 17 — `job-alerts.js` faller tillbaka till anon-nyckeln för service-klienten

**Storlek: S**

`client/api/job-alerts.js:17` — `process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY`.

Nytt sedan sist: `client/api/ai.js:1275` och `api/_utils/ai-usage-log.js:20` läser en **annan** env-kedja (`SUPABASE_SERVICE_ROLE_KEY || SUPABASE_SERVICE_KEY`). Har Vercel bara `SUPABASE_SERVICE_ROLE_KEY` satt blir klienten i `job-alerts.js` en anon-klient medan kommentaren `:12-14` påstår service role. Alla RLS-förbigående skrivningar (`email_notifications:371`, `user_notifications:385`) och läsningar (`profiles.email:413`, `job_alerts:402`) går då som anon och returnerar tomt — exakt det tysta felmönster som höll jobbevakningen trasig från april till juli.

## 18 — `cv_shares`: "Anyone can view shared CVs" utan kodmatchning

**Storlek: S**

**Bevis (prod):** `Anyone can view shared CVs | SELECT | roles={public} | USING (expires_at > now())` — ingen matchning mot `share_code`.

**Premissgranskning:** `select count(*) from cv_shares` → 6, varav `expires_at > now()` → **0**. Som anon läser jag idag 0 rader (verifierat i rollad transaktion). Latent — men första gången någon delar sitt CV kan anon enumerera både koden och ägarens `user_id`. `profile_shares` fick rätt behandling i A7 (RPC + droppad policy); `cv_shares` glömdes.

## 19 — Grace-period-raderingen kan inte köra: signaturmissmatch

**Storlek: M**

**Bevis (prod):**
```sql
select proname||'('||pg_get_function_arguments(p.oid)||')' from pg_proc p … where proname ~ 'deletion';
→ execute_account_deletion_immediate()        ← parameterlös
   request_account_deletion(p_reason text, p_grace_period_days integer)
   cancel_account_deletion()  ·  get_deletion_status()
```
`supabase/migrations/20260515_retention_cron.sql:132` anropar `execute_account_deletion_immediate(adr.user_id)` — en signatur som inte finns. Och även med rätt signatur läser funktionen `auth.uid()`, som är NULL i cron-kontext.

`select count(*) from account_deletion_requests` → **1** (tidigare 0). Ingen är förfallen ännu, men art. 17-raderingarna blir tysta no-ops i samma stund pg_cron aktiveras. Oförändrat sedan SEC-11.

## 20 — Radering av ett konsulentkonto blockeras av främmande nycklar

**Storlek: M**

**Bevis (prod):** FK:er mot `profiles(id)` som **inte** kaskaderar:
```
sta_enrollments.consultant_id          → RESTRICT   (31 rader)
consultant_participants.assigned_by    → NO ACTION  (31 rader)
sta_absences.reported_by, sta_assessments.performed_by/.signed_by_at_id,
sta_documents.submitted_by, sta_quick_notes.author_id,
sta_workplace_followups.consultant_id  → NO ACTION
audit_logs.user_id                     → NO ACTION  (0 rader)
```
En konsulent som begär radering enligt art. 17 får en FK-överträdelse i stället för radering. `client/src/services/accountApi.ts:90-95` returnerar dessutom `{success:true}` även när auth-raderingen failat, och `DeleteAccountSection.tsx:211-218` navigerar till "kontot raderat" ändå (SEC-22, kvarstår) — så användaren får besked om att allt är borta medan kontot finns kvar. Enda spåret är en `console.warn` i användarens egen webbläsare.

Deltagarkonton är däremot rena: `audit_logs` har 0 rader och deltagartabellerna kaskaderar.

## 21 — `anon` har blanket-grants på 128 tabeller

**Storlek: M**

**Bevis:** `select count(*) from information_schema.role_table_grants where grantee='anon' and table_schema='public' and privilege_type='DELETE'` → **128**. Supabases default (`GRANT ALL … TO anon`); A15 revokade två tabeller (`cvs`, `user_preferences`), resten står kvar — inklusive `mood_logs`, `diary_entries`, `journal_entries`, `profiles`, `consent_history`.

**RLS håller idag** — verifierat i rollad transaktion:
```sql
begin; set local role anon;
select count(*) from profiles, cv_shares, diary_entries, mood_logs, consultant_notes;
→ 0, 0, 0, 0, 0
rollback;
```
Men RLS är då det enda lagret. En framtida policy med för brett `USING`, eller ett `DISABLE ROW LEVEL SECURITY` i en migration, går direkt från "en policy är fel" till "hela tabellen ligger öppen". A10 och A7 var precis den händelsen.

## 22 — Råa felmeddelanden till klienten i 16 endpoints

**Storlek: M**

`client/api/job-alerts.js:665`, `client/api/cv-pdf.js:281`, `ai-cv-writing:192`, `learning-analyze-gap:318`, `learning-progress:309`, `learning-recommend:400`, `send-inactivity-warning:209`, `health:86,100,114`, `af-jobsearch:137`, `af-taxonomy:213`, `af-trends:68`, `af-enrichments:52`, `af-historical:156`, `af-jobed:60`, `education-search:689`.

`_shared/cors.ts:143-163` sanerar korrekt — de här bygger `new Response` själva och går förbi den. Värst är `health`: den är oautentiserad, kör **service role** (`:44,58`) och returnerar `error.message` från `profiles`-läsning, `auth.getSession()` och `storage.listBuckets()` med `Access-Control-Allow-Origin: '*'` (`:136`). En PostgREST-feltext avslöjar schema och policynamn.

*Positivt:* jag verifierade `health` skarpt (`GET /functions/v1/health` med anon-nyckel → HTTP 200) och den listar **inte** längre bucket-namn i friskt läge — bara `status/latencyMs`. Läckan uppstår först vid fel.

## 23 — CSP tillåter `'unsafe-inline'`, `http://localhost:*` och `img-src https:`

**Storlek: M**

**Bevis (prod-headers, `curl -D -` mot `https://www.jobin.se/`):** headern levereras som `client/vercel.json:30` definierar den.
```
script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' …
img-src 'self' data: blob: https: http://localhost:*
connect-src … http://localhost:* https://openrouter.ai
```
`'unsafe-inline'` upphäver CSP:ns viktigaste XSS-skydd i en portal där deltagare matar in fritext som renderas tillbaka. `http://localhost:*` är en dev-kvarleva som luckrar upp `upgrade-insecure-requests`. `img-src https:` tillåter exfiltrering via bild-URL till valfri värd. `connect-src https://openrouter.ai` är en kvarleva från när nyckeln låg klientsidan — ingen klientkod anropar OpenRouter längre (`grep -rn openrouter client/src` ger bara kommentarer, tester och en länk i `Privacy.tsx:174`).

**Övriga headers är kompletta och verifierade i prod:** HSTS `max-age=31536000; includeSubDomains; preload`, `X-Frame-Options: DENY`, `frame-ancestors 'none'`, `nosniff`, `strict-origin-when-cross-origin`, `Permissions-Policy` med `microphone=(self)`.

## 24 — Prompt-injektion utan sanering eller längdtak i fem Perplexity-funktioner

**Storlek: M**

`ai-commute-planner:43-51`, `ai-company-analysis`, `ai-industry-radar`, `ai-career-assistant:337-353` och `ai-company-search:319` bygger en promptsträng där användartexten interpoleras mitt bland instruktionerna och skickas som `messages:[{role:'user',content:prompt}]`. `grep -c sanitize` → **0** i samtliga fem. Ingen längdgräns.

Kontrast: Vercel-vägen är väl försvarad — `ai.js:713-716` loggar och kastar klientskickad `systemKontext`, agent/personlighet är whitelistade (`:707-708`), och `sanitizeAll` kapar varje sträng till 5000 tecken.

## 25 — Google Translate laddas utan egen samtyckeskategori

**Storlek: S**

`GoogleTranslate.tsx:118-121` injicerar Googles script, `:83` sätter `googtrans`-cookie, och `:132-138` laddar scriptet **automatiskt vid mount** om ett språk sparats tidigare. `CookieConsent.tsx` känner bara till `necessary` + `analytics`, och ingen kod frågar efter samtycke före injektionen. Sidans innehåll — inklusive dagbokstext på översatta vyer — går till Google (USA) på en grund som inte finns i bannern, och vid återbesök utan ny handling.

---

# ⚪ LÅG

- **26 — `send-inactivity-warning/index.ts:181` loggar e-postadress i klartext** i edge-loggen (`Skipping ${user.email}`). Byt till `user.id`. **S**
- **27 — `javascript:`-href i AI-genererad markdown.** `MarkdownRenderer.tsx:413` — `href={linkMatch[3]}` rakt från modellens output, ingen protokoll-allowlist, egen parser utanför DOMPurify. Oförändrat sedan LOW-2605-01 (maj). **S**
- **28 — PostgREST-filterinjektion i artikelsöket.** `contentApi.ts:332` — `.or(\`title.ilike.%${query}%,…\`)` med rå användarsträng i filtersyntaxen. Inte SQL-injektion, men filterlogiken kan manipuleras och sökningen göras godtyckligt dyr. **S**
- **29 — `Access-Control-Allow-Origin: *` på HTML-dokumentet i prod.** Verifierat i svarsheadern från `https://www.jobin.se/`. Sätts inte av `vercel.json` — Vercel-default för statiska filer. Ofarligt (dokumentet är publikt, inga credentials), men det gör headeruppsättningen svårare att resonera om. **S**
- **30 — `mood_logs` UPDATE saknar samtyckeskontroll.** INSERT kräver `check_wellness_consent`, UPDATE bara `auth.uid()=user_id`. Efter återkallat samtycke kan befintliga måenderader fortfarande ändras. Marginellt, men inkonsekvent med grinden bredvid. **S**
- **31 — `storage.objects`-policyerna `Allow updates h83o5u_0/1/2` saknar `bucket_id`-villkor.** De begränsar korrekt på `foldername(name)[1] = auth.uid()`, men gäller **alla** bucketar. Ofarligt med dagens två bucketar (båda ägarscopade ändå); blir ett hål den dag en tredje bucket med annan sökvägskonvention läggs till. **S**
- **32 — `VERCEL_TOKEN` skickas som kommandoradsargument** i `deploy.yml:36,39,42` (`--token=${{ secrets.VERCEL_TOKEN }}`). GitHub maskerar i loggen, men argv är läsbart för andra processer på runnern. Env-variabel är strikt bättre. **S**

---

# Det här håller — verifierat, inte antaget

- **A16 (rolleskalering) är stängd.** `pg_policies` på `profiles` har nu exakt två UPDATE-policyer, båda med `check_role_change_allowed(id, role, roles, active_role)` i `WITH CHECK`. `"Users can update own active_role"` finns inte längre. Funktionskroppen (`pg_proc.prosrc`) returnerar `FALSE` om `new_role IS DISTINCT FROM current_record.role` när `user_id = auth.uid()`. Kolumn-grants på `role/roles/active_role` finns kvar för `authenticated` — RLS är enda lagret, men det lagret håller nu.
- **A17 håller för de 18 den täckte.** Verifierat som riktig inloggad deltagare mot prod:
  ```
  POST /rest/v1/rpc/get_application_stats  {"p_user_id":"<annans uuid>"}
  → HTTP 403 {"code":"42501","message":"Forbidden: p_user_id matchar inte den inloggade anvandaren"}
  POST /rest/v1/rpc/get_user_learning_stats {"p_user_id":"<annans uuid>"} → HTTP 403 samma
  ```
  Se dock fynd 1 för de 35 som listan inte omfattade.
- **A19 (art. 9-grinden) fungerar i skarp drift** — `POST /api/ai {"function":"vecko-reflektion"}` med giltig token → **HTTP 200** med innehåll. Den öppna verifieringspunkten från 4 augusti är därmed stängd.
- **A20 (dataexporten) håller och är rätt byggd.** `export_user_data()` härleder tabellistan ur `information_schema` vid varje anrop (varje `public`-tabell med uuid-kolumnen `user_id`, varje med `participant_id`, plus `profiles`), med 5000-radstak och `truncated_tables` i svaret. Nya tabeller kommer med automatiskt. Som anon: `→ {"success":false,"error":"Not authenticated"}`.
- **A21 håller.** `mood_logs` har exakt **en** INSERT-policy och den kräver `check_wellness_consent(auth.uid())`. Blanket-INSERT på `storage.objects` är borta. Båda bucketarna har nu gränser: `profile-images` 5 MB + fyra bildtyper, `profile-documents` 10 MB + pdf/docx/doc/png/jpeg.
- **A18-vakten är korrekt konstruerad** — fail closed vid saknad `CRON_SECRET` (bevisat: HTTP 503), konstant-tidsjämförelse i `_shared/cronAuth.ts:16-24`, ligger i `_shared/` så nästa cron-funktion ärver den. Den är bara inte konfigurerad (fynd 8).
- **RLS är på överallt.** `select count(*) from pg_class … where relrowsecurity=false` i `public` → **0** av 131 tabeller. De tre utan policyer (`email_notifications`, `email_queue`, `rate_limits`) är service-role-tabeller — RLS utan policy = deny all, vilket är rätt. `job_interest_matches` och `unified_profiles` har dessutom `FORCE ROW LEVEL SECURITY`.
- **Alla 53 `SECURITY DEFINER`-funktioner har pinnad `search_path`** (`proconfig is null` → 0). Ovanligt välskött; stänger en hel eskaleringsklass.
- **Inga öppna policyer på persondata.** Systematisk genomgång av alla permissiva policyer vars uttryck saknar ägarreferens ger 18 träffar — 17 av dem är innehållstabeller (`achievements`, `articles`, `courses`, `exercises`, `writing_prompts`, `milestones` …) eller `service_role`-INSERT. Den enda med persondata är `cv_shares` (fynd 18).
- **Ingen IDOR i API-lagret.** Sökning på `body.user_id|body.userId|data.userId|req.query.userId` över alla 28 endpoints ger en enda träff (`learning-progress:124`) och där är värdet redan tokenens. Varje endpoint härleder user-id ur `auth.getUser(token)`. Skarpt verifierat: `/api/ai`, `/api/cv-pdf`, `/api/upload-image` → 401 utan token; `/api/job-alerts` → 401 på alla tre actions.
- **Bundlen läcker bara anon-nyckeln.** `client/dist` (byggd 2026-08-09, färskare än all källkod) grep:ad på `SERVICE_ROLE|sk-or-v1|sk-ant-|OPENROUTER|RESEND|BLOB_READ_WRITE` → noll. Exakt en unik JWT, payload `{"role":"anon"}`.
- **A11 (SSRF i cv-pdf) håller** — `cv-pdf.js:212` origin-validerar innan `printUrl` byggs på `:230`.
- **Modellåsningen håller på Vercel-vägen och i `ai-assistant`** — `overrideModel` plockas fortfarande ur body (`ai-assistant:43`) men används aldrig; `:104` sätter modellen från env. (Se fynd 4 för de sex som går utanför.)
- **Sentry är korrekt konfigurerad.** `sentry.ts:105-108` — `replayIntegration({maskAllText:true, maskAllInputs:true, blockAllMedia:true})`, sampling 1 %/10 %, `beforeSend`-skrubb på `:159`.
- **Bara två `dangerouslySetInnerHTML`** i hela `client/src` (`JobSearch.tsx:945`, `NotificationsCenter.tsx:313`), båda genom `sanitizeHTML*`. Noll `eval(`, `new Function(`, `.innerHTML =`.
- **Inga `pull_request_target`-workflows**, ingen osäker fork-checkout, inga secrets som echas.

---

# Förbättringsförslag för säkerhetsarbetet som process

**1. Gör "mät utfallet, inte kommandot" till en grind, inte en vana.**
A17 gick i PUBLIC-fällan, upptäckte den, dokumenterade den utförligt i ROADMAP — och generaliserade sedan inte åtgärden till resten av schemat. Fynd 1 är samma fel i samma vecka. Ett skript `npm run lint:grants` som läser `has_function_privilege('anon', oid, 'EXECUTE')` för varje `prosecdef`-funktion och failar på allt utanför en allowlist hade fångat det. Samma sak för `relrowsecurity=false` och för nya `USING(true)`-policyer på tabeller med personuppgifter. Ni har redan mönstret: `lint:schema` föddes ur exakt den här insikten 27 juli.

**2. Sluta lita på att en policyuppsättning är städad för att *en* tabell städades.**
Dubblettpolicy-mönstret har nu träffat fem gånger: `profiles` (A16), `mood_logs` + `storage.objects` (A21), `invitations` (A10), `profile_shares` (A7) — och nu `interest_results` (fynd 3). Varje gång städades den tabell som råkade granskas. Frågan "finns en policy här som ensam räcker för att godkänna operationen?" behöver ställas maskinellt för alla tabeller samtidigt, inte manuellt för den som står i rapporten. Ett `SELECT`-skript över `pg_policies` som grupperar per (tabell, cmd, roll) och flaggar par där den ena saknar ett predikat den andra har, är en halv dags arbete.

**3. Lista definierade skydd som inte är inkopplade.**
Fyra rate limits står i `_shared/rateLimit.ts` utan att anropas. Fyra fail-open-fallbacks står bredvid två fail-closed varianter av samma kod. `validateOriginOrReject` finns och används av ingen. Det är inte kunskapsbrist — det är att intentionen dokumenterades och implementationen inte följde med. Ett test som importerar `ENDPOINT_LIMITS` och kräver att varje nyckel förekommer i motsvarande `index.ts` är ~20 rader.

**4. Skilj på "koden är klar" och "det gäller i drift".**
A18 är ett rent exempel: fixen är korrekt, deployad, fail closed — och funktionen svarar 503 för alla eftersom hemligheten aldrig sattes. Roadmapen kallar den "🟡 kod klar", vilket är sant och samtidigt vilseledande. Varje punkt som kräver en dashboardåtgärd borde ha en **verifieringsrad med ett kommando och ett förväntat svar** (`→ HTTP 200`, inte `→ HTTP 503`), och den raden ska köras innan punkten stängs.

**5. Låt hemlighetsscanningen scanna något.**
Trufflehog är konfigurerad så att den per definition hittar noll på push till main — den enda väg projektet använder. Kombinera det med att repot är publikt och att ett prod-lösenord faktiskt committats, så är detta inte en teoretisk lucka. Pinna till SHA, scanna full historik en gång, och kör `--since-commit HEAD~1` löpande.

**6. Låt compliance-dokumenten härledas ur koden där det går.**
Perplexity kom in i kodbasen utan att någon uppdaterade tre dokument. `grep -roh "model: '[^']*'" supabase/functions client/api | sort -u` tar en sekund och hade avslöjat det. Samma för tredjelandsmottagare: en lista över alla externa `fetch`-värdar i server- och edge-koden, jämförd mot biträdesförteckningen i Art. 30-registret, som en CI-grind.

**7. Ge `client/api/*.js` samma grindar som resten.**
Roadmapen noterar det redan (D16): filerna får varken eslint eller typecheck, och det var där A19 kunde gömma sig i en månad. Fynd 16 och 17 sitter i samma katalog.

---

# Vad jag inte hann granska

- **Skrivande verifiering av fynd 1.** Jag har inte exekverat `cleanup_old_activities`, `cleanup_rate_limits` eller `increment_template_usage` som anon — de skriver i prod. Bedömningen vilar på `has_function_privilege` + `proacl` + funktionskroppen, plus ett bevisat anon-anrop av en *läsande* definer-funktion över samma väg (HTTP 200).
- **Rollen som konsulent.** All skarp HTTP-testning gjordes som deltagare (`claude-playwright-test@jobin.se`). Konsulentens vyer, `/consultant`-ytan och `consultant_*`-tabellernas policyer är granskade i `pg_policies` men inte körda som inloggad konsulent. `consultant_notes` och `consultant_journal` bör testas skarpt.
- **`verify_jwt`-status per deployad edge-funktion.** Alla nio testade funktioner ger 401 utan JWT, vilket tyder på att defaulten gäller — men inställningen styrs från Supabase-dashboarden, inte repot (`deploy.yml:71` deployar utan flaggor), och jag har inte kunnat läsa den. Notera att anon-nyckeln passerar `verify_jwt`, så det är ingen auktoriseringsgrind.
- **Supabase OAuth redirect-allowlist** — dashboardåtgärd, öppen sedan maj.
- **Resends DPA och region** — Art. 30-registret säger `[bekräftas]` (`:457`). Måste vara klart innan A6 slår på utskicken.
- **`auth.users`-schemat och Supabase Auth-inställningar** (lösenordspolicy, MFA, session-livslängd, läckta-lösenord-kontroll). Inte åtkomligt via `db query`.
- **Praktisk XSS-repro.** Jag har läst saneringen men inte försökt bryta den med en riktig nyttolast i webbläsaren.
- **RLS-prestanda.** Flera policyer gör `EXISTS (SELECT … FROM profiles/participant_data_sharing)` per rad utan `(select auth.uid())`-wrapping. Säkerhetsmässigt korrekt, men kan bli dyrt — det är performance-agentens område.
