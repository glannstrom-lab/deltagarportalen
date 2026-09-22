# Loggpasset 2026-09-22 — vad som faktiskt går fel för riktiga användare

Rapportör, ingen källkod ändrad. Mätt 2026-09-22 ca 21:05–21:30 UTC (23:05–23:30 svensk tid).
Fönster: Supabase-loggar 2026-09-08 → 2026-09-22 (14 dygn, dygn för dygn — API:t tar max 24 h per fråga),
Vercel runtime-fel 7 dygn, databasens egna spår 14 dygn. Inga e-postadresser, namn eller användar-id nedan.

## Först: hur lite trafik det är

Klassning av `auth.users` (test = `@jobin.test`, `example.*`, `*test*`, `demo@jobin.se`, `claude-playwright-test@jobin.se`;
ägare = Mikaels eget konto; resten = verklig):

| klass | konton | inloggade 14 d | inloggade 7 d |
|---|---|---|---|
| verklig | 79 | 4 | 2 |
| ägare | 1 | 1 | 0 |
| test | 33 | 7 | 5 |

Nästan all logg-trafik är CI (GitHub Actions: `referer http://localhost:3000/`, AS "Microsoft Corporation/Limited"),
agenternas egna prov (`mgmt-api`, `PROV…`-RAISE, ingen referer från Tele2) och Mikael. Det som återstår som
*verkliga användares* felspår är få rader — men de är skarpa.

## Rangordnat efter användarpåverkan

### 1. Google-registrering sparar varken villkor, integritetspolicy, AI-samtycke eller förnamn — alla 17 Google-konton, sedan april, fortfarande i dag
*Skarpt fel (juridiskt + UX). Inte en regression — men det träffade en ny riktig användare i dag, 20:38 UTC, mitt i deployfönstret.*

Bevis (prod, verkliga konton):

| provider | konton | utan `terms_accepted_at` | utan `privacy_accepted_at` | utan `ai_consent_at` | utan förnamn | utan rad i `consent_history` |
|---|---|---|---|---|---|---|
| google | 17 | **17** | **17** | 17 | 13 | **17** |
| email | 63 | 38 (alla från feb–maj, före samtyckesflaggorna) | 38 | 40 | 18 | 37 |

Per månad: varje e-postregistrering sedan juni har villkoren sparade (5/5 juni, 9/9 september). Varje
Google-registrering, alla månader april–september, saknar dem (3/3 i september).

Källa i koden:
- `client/src/pages/Register.tsx:239-245` — knappen "Snabbregistrera med Google" anropar `signInWithGoogle()`
  utan att kryssrutorna för villkor/integritet/AI har fyllts i eller skickats med.
- `client/src/stores/authStore.ts:328-341` — `signInWithOAuth` skickar ingen metadata (det går inte heller via OAuth).
- `handle_new_user()` i prod läser `raw_user_meta_data->>'first_name'`, `'terms_accepted'`, `'privacy_accepted'`,
  `'ai_consent'`. Google levererar `name`/`full_name`/`given_name`-liknande nycklar (dagens nya konto hade
  `iss, sub, name, email, picture, full_name, avatar_url, provider_id, email_verified, phone_verified`) — ingen
  av de fyra. Profilen skapas därför med NULL i alla fyra.
- Det finns ingen efterhandsgrind: `grep terms_accepted_at client/src` träffar bara typen i `authStore.ts`,
  `Settings.tsx` (visning) och `consentApi.ts` (mappning). Ingen vy ber en OAuth-användare godkänna villkoren.

Följd i drift: dagens nya Google-användare körde `intervju-simulator` tre gånger (20:51–20:55 UTC) med
villkor, integritetspolicy och AI-samtycke odokumenterade. Servern tillåter det med flit
(`client/api/ai.js:309-317`: art. 6-funktioner grindas inte på `ai_consent_at`), så det är inget grindfel —
men portalen kan inte visa att personen godkänt villkoren eller informerats om behandlingen. 3 av 17
Google-konton har gjort AI-anrop utan något registrerat samtycke. Samma lucka ger "Hej"-utan-namn i UI för 13 av 17.

### 2. Intervjusimulatorns öppningsfråga faller på för liten tokenbudget — en riktig användare fick 502 i kväll
*Skarpt fel, återkommande (Vercel grupperar det som första gången sett 2026-08-26). Inte en regression.*

- Vercel `get_runtime_errors` + runtime-logg: `POST /api/ai 502` 20:58:30 UTC på deploy `dpl_6y3dg…` (9ed4a6d0):
  `[AI] intervju-simulator: tomt content trots 200. finish_reason=length … completion_tokens=200 … reasoning_tokens=225 maxTokens=200`.
- Det är samma användare som i fynd 1 (enda verkliga AI-användaren i fönstret), som försökte starta en ny övningsintervju.
- Källa: `client/api/_prompts/intervju.js:58` — start-grenen har `maxTokens: 200`. Den låsta modellen är resonerande
  och tänkte 225 tokens innan den hann skriva något; `ai.js:1285-1305` svarar då 502 `AI_EMPTY_RESPONSE`.
  Samma fälla är redan dokumenterad för CV-promptarna (`_prompts/cv.js:26`, `:125`) — intervjustarten fick aldrig
  samma höjning. `intervju.js:49` (feedbackgrenen, 500) ligger också i riskzonen.
- Det misslyckade anropet syns inte i `ai_usage_logs` (se fynd 3), så felkvoten per funktion går inte att räkna ur databasen.

### 3. `ai_usage_logs` ljuger om felkvoten — och tappar troligen en del lyckade anrop
*Mätfel/felkonfiguration. Påverkar tokentaket och all uppföljning.*

- `ai_usage_logs`: 149 rader sedan 2026-06-29, **0** med `success = false`. `logAiUsage()`
  (`client/api/_utils/ai-usage-log.js:75-99`) skriver aldrig `success` eller `error_message` — kolumnerna finns men
  fylls aldrig. Varje 502 (fynd 2), varje strömfel (`ai.js:1109-1113`, där OpenRouter-fel skickas som SSE-rad med
  HTTP 200 och ingen loggrad) är osynliga.
- I kvällens fönster 20:42–21:05 UTC svarade `/api/ai` HTTP 200 **åtta** gånger enligt Vercel, men bara **tre** rader
  kom in i `ai_usage_logs` (alla verklig användare, intervju-simulator). Fem 200-svar saknar rad. Trolig orsak:
  loggningen är `void logAiUsage(…)` före `return res…` (`ai.js:1163, 1169, 1222, 1341`) — fire-and-forget i en
  serverlös funktion utan `waitUntil`, så skrivningen kan dö med instansen. Alternativ förklaring för en del av dem:
  strömgrenens felväg ovan. Går inte att skilja åt utan request-kroppar. **Konsekvens:** `checkDailyTokenCap`
  (`ai.js:270-297`) räknar på `ai_usage_logs` och underskattar alltså förbrukningen.

### 4. Pass-påminnelsen larmar varje kväll på en demo-adress — larmtrötthet i Sentry
*Felkonfiguration/brus, ingen verklig användare drabbad.*

- Vercel: `[pass-paminnelse] mejl misslyckades … Resend 422 … Invalid 'to' field … domains like example.com` —
  en gång per dygn 16/9, 17/9, 18/9, 19/9, 20/9, 21/9, 22/9 (18:11 UTC), plus
  `[pass-paminnelse] 1 av 3 mejlutskick misslyckades` 20/9–22/9 som eget Sentry-event `MejlutskickDelvisFel`.
- `notifications` av typen `aktivitet_paminnelse` senaste 8 dygn: 1/dygn till ägaren, 1–2/dygn till testkonton,
  **0 till verkliga användare.** Den som faller är demodeltagarens `example.com`-adress (demo-org, återställs varje natt
  av cron `demo-reset`).
- Källa: `client/api/pass-paminnelse.js:162-184` skickar till varje profil med e-post; inget undantag för reserverade
  domäner (`example.*`, `.test`). `avgorSvar` gör sedan ett delvis fel till ett Sentry-larm varje kväll — samma
  larm som ska väcka någon den dag Resend faktiskt går sönder.

### 5. Anonyma anrop mot inloggade tabeller efter utloggning (42501 "permission denied for function is_admin_or_superadmin" / "for table cvs" / `user_preferences` / `get_my_consultant`)
*Mestadels brus (CI), men mönstret finns också i prod-webbläsare.*

- Postgres-loggen 14 d: 12 (20–21/9), 22 (20/9), 19 (17/9), 30+31 (12–13/9), 8 (22/9) × `is_admin_or_superadmin`,
  plus `cvs` 2–6/dygn, `user_preferences` 25 (12–13/9), `get_my_consultant` 2–4/dygn. Alla via PostgREST som `anon`
  med ett `id=eq.<uid>`-filter — dvs. klienten frågar efter en inloggad användares rader utan token.
- Kopplat mot edge-loggen: nästan alla från CI (localhost:3000, Azure) direkt efter ett `POST /auth/v1/token 400`
  (felaktiga uppgifter-testet) eller utloggning. Men 12/9 finns även `401 /rest/v1/user_preferences` med
  referer `https://www.jobin.se/` från en svensk bredbandsanslutning — så prod-klienten gör samma sak.
- Trolig källa: React Query-frågor med `enabled: !!userId` där `userId` ligger kvar i storen ett ögonblick efter
  `signOut` (queries som `profiles?select=onboarded_hubs` = `hooks/useOnboardedHubsTracking.ts`,
  `saved_jobs?select=status,archived_at,application_date`, `cvs?select=id,updated_at`). Ingen användarpåverkan
  (personen har loggat ut), men det fyller felloggen så att riktiga 42501 drunknar.

### 6. Små, redan åtgärdade eller engångs
- `406 GET /rest/v1/consultant_meetings` från jobin.se 22/9 14:37 UTC och 8 st 12/9 (+6 st `cvs` 406 12/9):
  `.single()` på noll rader. **Redan rättat** i dag (`MyConsultant.tsx:760-773` använder nu `.maybeSingle()`); inga
  406 efter 14:37. Kvarvarande `.single()` på `cvs` i `lib/supabase.ts:199-205` har noll anropare.
- `cv-pdf` 17/9 21:18–21:20: `EACCES /tmp/chromium-pack/al2023.tar.br` (en gång, under chromium-min-bytet — hanterat,
  se `cv-pdf.js:102-141`) och `Error: Inget CV hittades` (en gång). Det senare kastas i `cv-pdf.js:302` och
  besvaras som **500** i `cv-pdf.js:466-467` — ett användarfel som rapporteras som serverfel till Sentry.
- `DEP0169 url.parse()`-varning i `/api/pass-paminnelse` och `/api/job-alerts` (11 st, 7 d) — kommer från ett
  beroende, inte från egen kod (`grep url.parse client/api` = 0). Brus.
- Auth: 5 st `GET /auth/v1/user … context canceled` från jobin.se 22/9 — klienten avbröt anropet (sidbyte). Brus.

## Dagens tre deployer — regressioner?

Deployer (Vercel, prod): 0c26ad67 20:36:37 UTC · a49c2272 20:40:35 · 9ed4a6d0 20:55:21 (22:36–22:55 svensk tid).
Efter 20:36 UTC finns i loggarna:

| fel | källa | bedömning |
|---|---|---|
| `new row violates RLS … consultant_participants` (POST 403) och `permission denied for table consultant_participants` (PATCH 403) 20:27 | Tele2, ingen referer → skript | agentens eget BP1-prov. Inga träffar från en webbläsare |
| `E-postadressen ändras via kontoinställningarna` 20:48:55 och `Konsulentkopplingen ändras bara via inbjudan…` 20:49:03 (`profiles_skyddade_kolumner()`) | Tele2, ingen referer → skript | agentens eget prov av den nya triggern. Inga träffar från en webbläsare |
| `invitations_used_by_fkey` 23503 ×2, `Error in handle_new_user` WARNING ×1, `PROV2–PROV5` P0001 | `mgmt-api` | BP2–BP4-proven, rullade tillbaka |
| `is_admin_or_superadmin` 42501 ×3 21:01 | CI | fynd 5 |
| `intervju-simulator` 502 20:58 | verklig användare | fynd 2 — **inte** en regression (`intervju.js` senast ändrad 2026-09-12) |

**Ingen regression från dagens ändringar syns i loggarna.** Men observera att underlaget är tunt: ingen verklig
konsulent var aktiv efter deployerna, så den nya RLS:en på `consultant_participants` och triggern på `profiles` har
bara prövats av agenternas skript. Jag gick igenom de klientvägar som skriver `profiles` (`userApi.ts:61-73`,
`:150-162`, `unifiedProfileApi.ts:355`, `profileEnhancementsApi.ts:670`, `authStore.ts:506`) — ingen skickar
`email` eller `consultant_id`, så triggern bör inte fälla en vanlig profilsparning. Triggern jämför dessutom mot
JWT:ns e-post, så en e-postsynk efter adressbyte fälls inte heller. Dagens nya Google-registrering (20:38) gick genom
`handle_new_user` utan WARNING — reservvägen användes inte.

## Supabase-rådgivarna (nytt eller värt att nämna)

- **Security, ERROR:** 7 vyer med `SECURITY DEFINER` (`organization_handover`, `employer_placements`,
  `employer_proposals`, `employer_invitations`, `my_ai_policy`, `organization_caseload`, `organization_colleagues`).
  Känt designval för AG6/kommunspåret (vyerna är vitlistan), men linten klassar det som ERROR — värt en rad i
  `lint:grants`-allowlisten så att en *ny* definer-vy syns.
- **Security, WARN:** 4 triggerfunktioner utan fast `search_path` (`activity_sessions_participant_guard`,
  `organizations_chef_guard`, `activity_plan_handovers_guard`, `activity_plan_handovers_no_delete`).
  `profiles_skyddade_kolumner` (i dag) har `search_path` satt — bra.
- **Security, WARN:** `anon` kan köra `check_rate_limit`, `get_invitation_by_token`, `get_shared_profile` (avsiktligt
  enligt tidigare allowlist). "Leaked password protection" är avslaget.
- **Security, INFO:** `email_notifications`, `email_queue`, `rate_limits` har RLS utan policy (bara service role når dem — OK).
- **Performance:** `auth_rls_initplan` 380, `multiple_permissive_policies` 483, 46 FK utan index, 99 oanvända index,
  2 dubblettindex (`cover_letters`, `saved_jobs`). Dagens nya policyer på `consultant_participants` och `profiles`
  ("Konsulenter ser sina deltagare", "Konsulent ändrar/avslutar egen koppling", "Konsulent kan ändra status…")
  hamnar i initplan-listan (anropar `auth.uid()` per rad i stället för `(select auth.uid())`). Ingen praktisk
  effekt vid dagens radantal.

## Databasens egna spår

- `cron.job_run_details` 14 d: **0 misslyckade körningar** av 16 jobb. `retention-rate-limits` körde första gången
  20:50 UTC i dag (nytt). `retention-ai-usage-logs` raderade 25 rader och `retention-invitations` 20 rader senaste natten.
- `email_queue`, `email_notifications`: tomma.
- `audit_logs` 14 d: bara `VIEWED_PARTICIPANT_DATA` (22 rader, senast 22/9 18:15 UTC). Inga felrader — tabellen loggar inte fel.
- Edge-funktioner (Supabase) 14 d: bara 200-svar. Anrop förekommer bara från CI (`health`) och Mikael/en
  mobilanslutning (`af-trends`, `af-taxonomy`, `education-search`). `function_logs` innehåller inga fel utöver en
  väntad AI-grindnekan (testkonto) och ett ogiltigt e-postformat (12/9, `send-invite-email`-prov).

## Källor — vad gick och vad gick inte

- **Supabase-loggar (MCP `query_logs`)**: gick. 14 dygn, en fråga per dygn (API-taket är 24 h). postgres, edge,
  function_edge, function_logs och auth lästa. Loggvolymen är låg nog att allt är fullständigt, inte stickprov.
- **Supabase-rådgivare (MCP `get_advisors`)**: gick, både security och performance (performance-svaret var 437 kB och
  lästes maskinellt i sin helhet).
- **Vercel (MCP)**: `get_runtime_errors` gick för 7 dygn (max). `get_runtime_logs` returnerade bara de senaste
  ~25 minuterna (9 rader) trots 7-dygnsfönster — Hobby-planens loggretention. Status-/sökvägsfördelning för `/api/*`
  över veckan gick alltså **inte** att få; bara de aggregerade felklustren.
- **Sentry**: gick **inte** att läsa. Server-DSN är satt i Vercel (DR1, stackspåren visar `_utils/sentry.js`), men
  det finns ingen `SENTRY_AUTH_TOKEN`, `.sentryclirc` eller MCP-koppling här. Klient-Sentry är avslaget med flit
  (`VITE_SENTRY_DSN` osatt, DR6).
- **Databasens spår (MCP `execute_sql`, bara SELECT)**: gick — `cron.job_run_details`, `ai_usage_logs`, `notifications`,
  `email_queue`, `email_notifications`, `audit_logs`, `auth.users` (bara klass/antal). `net._http_response` finns inte
  (pg_net används inte av cron-jobben).
