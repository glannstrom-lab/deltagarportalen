# Säkerhets- och GDPR-granskning — Jobin / Deltagarportalen

**Datum:** 2026-08-04 · **Commit:** `d1afc046` (main, rent arbetsträd)
**Typ:** Read-only granskning. Ingen kod ändrad, inget committat, ingen prod-data förändrad.
**Metod:** Kodläsning + **live-verifiering mot produktionsdatabasen** (`npx supabase db query --linked`), inkl. exekvering som rollerna `anon` och `authenticated` för att bevisa faktisk åtkomst i stället för att resonera från migrationsfiler.

> **Om bevisen.** Alla SQL-utdata nedan är körda mot prod 2026-08-04. Det enda skrivande testet (SEC-01) kördes i ett PL/pgSQL-block som avslutas med `RAISE EXCEPTION`, vilket garanterat rullar tillbaka. Efterkontroll bekräftar att prod är orörd (`role=USER`, `updated_at` fortfarande `2026-04-30`). Där jag inte kunnat verifiera står **obekräftat**.

---

## Sammanfattning

| Allvarlighet | Antal | Varav nya (ej i `docs/security-audit.md`) |
|---|---|---|
| 🔴 KRITISK | 3 | 2 |
| 🟠 HÖG | 8 | 7 |
| 🟡 MEDEL | 17 | 13 |
| ⚪ LÅG | 5 | 4 |

**Huvudslutsatsen** är inte att en enskild policy är fel, utan att ett **mönster** återkommer: en sträng RLS-policy skrivs, och en äldre eller nyare **permissiv dubblettpolicy** neutraliserar den tyst. Postgres OR-kombinerar permissiva policyer — den svagaste vinner alltid. Det mönstret bär SEC-01 (privilegieeskalering), SEC-05 (storage) och SEC-09 (art. 9-grinden på `mood_logs`). Samma klass som A10/A7 i förra revisionen, men den städningen tog bara de tabeller som råkade granskas.

Det andra mönstret: **`SECURITY DEFINER` + `p_user_id`-parameter + `GRANT EXECUTE TO anon`** = RLS-bypass som ingen policy kan rädda (SEC-02).

**Verifiering av tidigare "klart":** A11, A12, A13, A15 och HIGH-2605-01 håller — jag har läst koden och de är genomförda på riktigt. A1 (nyckelrotation) och A6 (pg_cron) är fortfarande öppna, bekräftat mot prod.

---

# 🔴 KRITISK

## SEC-01 — Vilken inloggad deltagare som helst kan göra sig själv till SUPERADMIN

**Allvarlighet: KRITISK**

**Bevis (prod, kört som `authenticated` med enbart den egna användarens JWT-claims):**

```
do $$ ... perform set_config('request.jwt.claims','{"sub":"4f5be…","role":"authenticated"}',true);
        set local role authenticated;
        update profiles set role='SUPERADMIN', active_role='SUPERADMIN' where id='4f5be…';
        raise exception 'ROLLBACK-BEVIS: rows_updated=% | fore=% | efter=%', n, oldrole, newrole; end $$;

→ ERROR: ROLLBACK-BEVIS: rows_updated=1 | fore=USER | efter=SUPERADMIN
```

Efterkontroll: `select role, active_role, updated_at from profiles where id='4f5be…'` → `USER | USER | 2026-04-30` — **inget skrevs**, exception rullade tillbaka.

**Orsak — tre permissiva UPDATE-policyer på `profiles`, OR-kombinerade:**

```
Users can update own profile safely   | UPDATE | USING (auth.uid()=id) | CHECK check_role_change_allowed(id, role, roles, active_role)
Admins can update profiles with …     | UPDATE | USING is_admin_or_superadmin() | CHECK check_role_change_allowed(...)
Users can update own active_role      | UPDATE | USING (auth.uid()=id) | CHECK (auth.uid() = id)     ← ingen rollkontroll
```

Den tredje policyn räcker ensam. `check_role_change_allowed` — hela rolleskaleringsförsvaret som `docs/security-audit.md:66` beskriver som "väl försvarad" — kringgås eftersom den bara sitter i två av tre policyer.

**Inget annat lager fångar det:**
- Kolumn-grants: `information_schema.column_privileges` → `authenticated` har `UPDATE` på `role`, `roles` **och** `active_role`.
- Triggers på `profiles`: `audit_profile_changes` (loggar bara), `protect_last_superadmin` (hindrar bara borttagning av sista superadmin), `on_profile_created_handle_invitation`, `trg_sync_ai_enabled`, `update_profiles_updated_at`. **Ingen av dem blockerar en rollhöjning.**

**Konsekvens för användaren:** Angreppet kräver bara ett vanligt konto och den publika anon-nyckeln (ligger i klientbundlen). `is_admin_or_superadmin()` läser exakt den kolumn som skrivs — `SELECT role INTO user_role FROM profiles WHERE id = auth.uid(); RETURN user_role IN ('SUPERADMIN','ADMIN')`. Efter höjningen öppnas **14 policyer över 11 tabeller**: `profiles` (samtliga 92 konton — namn, e-post, telefon), `consent_history`, `consultant_participants`, `invitations`, `data_sharing_audit`, `audit_logs`, `admin_audit_log`, `user_sessions`, `login_attempts`, `interest_guide_history`, `writing_prompts`. Alltså full deltagarregisterläsning plus möjlighet att sudda sina egna spår i revisionsloggen.

**Föreslagen åtgärd:** Droppa `"Users can update own active_role"` — den guardade policyn täcker redan användarens egna uppdateringar. Alternativt: `REVOKE UPDATE (role, roles) ON profiles FROM authenticated` som andra lager, och en `BEFORE UPDATE`-trigger som avvisar rollbyten som inte kommer via `check_role_change_allowed`. **Storlek: S** (en migration), men verifiera efteråt att inloggning/rollväxling fortfarande fungerar.

---

## SEC-02 — 18 `SECURITY DEFINER`-funktioner tar `p_user_id` utan att kontrollera `auth.uid()`, och `anon` får köra dem

**Allvarlighet: KRITISK**

**Bevis (prod, kört som `anon`):**

```
set local role anon;
select (select count(*) from saved_jobs) as direkt_select,
       get_application_stats('ceee4846-ae00-4b95-8b02-3b868c5f4bde') as via_rpc;

→ direkt_select = 0                                    ← RLS fungerar
→ via_rpc = {"total":8, "saved":8, "active":8, ...}     ← RLS förbigås
```

Mekanismen: funktionsägare = `postgres`, tabellägare = `postgres`, och `relforcerowsecurity = false` på samtliga publika tabeller. En `SECURITY DEFINER`-funktion körs alltså som tabellägaren, som per default är undantagen från RLS.

**De 18 funktionerna** (alla `prosecdef=true`, `has_function_privilege('anon', …, 'EXECUTE')=true`, `prosrc` innehåller **inte** `auth.uid`):

| Läser andras data | Skriver i andras namn |
|---|---|
| `get_application_stats`, `get_user_learning_stats`, `get_stale_applications`, `get_upcoming_reminders`, `get_user_courses`, `get_mood_streak`, `get_or_create_user_preferences`, `find_buddy_matches`, `generate_course_recommendations` | `increment_user_points`, `log_user_activity`, `post_to_community_feed`, `react_to_feed_item`, `remove_reaction`, `update_milestone_progress`, `update_user_streak`, `initialize_user_milestones`, `create_learning_path_from_gap` |

Skrivfunktionerna har jag **inte** exekverat (skulle förändra prod) — bedömningen vilar på att de saknar `auth.uid`-referens i kroppen och tar `p_user_id` som parameter. `post_to_community_feed(p_user_id, p_activity_type, p_title, p_description, p_metadata, p_is_public)` låter alltså en oautentiserad anropare publicera i valfri användares namn.

**Blast radius idag:** 6 av 92 användare har data som ger utslag via `get_application_stats`. Två funktioner är dessutom redan trasiga av schemadrift (`get_mood_streak` → `column "logged_at" does not exist`; `find_buddy_matches` → `relation "community_buddy_preferences" does not exist`), vilket råkar begränsa läckan — inte av design.

**Konsekvens för användaren:** Ingen inloggning krävs. Med en användares UUID (som läcker via t.ex. `cv_shares`, delade profiler eller helt enkelt genom att gissa) kan vem som helst på internet läsa jobbsökarstatistik, kurshistorik och påminnelser — och skriva in falska aktiviteter, poäng och flödesinlägg i någon annans konto.

**Föreslagen åtgärd:** Två spår, båda behövs.
1. `REVOKE EXECUTE ON FUNCTION … FROM anon` på alla 18 (`anon` behöver inga av dem — inloggade användare går som `authenticated`).
2. Lägg `IF p_user_id <> auth.uid() THEN RAISE EXCEPTION 'Forbidden'; END IF;` överst i varje funktion — annars kvarstår samma hål mellan inloggade användare.
**Storlek: M** (en migration, 18 funktioner, kräver genomgång av vilka som anropas var).

---

## SEC-03 — Läckt OpenRouter-nyckel fortfarande återställbar i git-historiken (A1, öppen sedan 2026-05-28)

**Allvarlighet: KRITISK** (oförändrad sedan CRIT-2605-01)

**Bevis:** `git log --all -S "sk-or-v1-" --oneline` → **13 commits**: `95093b2b` (introducerad), `72908f54`, `67cc3424`, `158ed7d2`, `0d567f3f`, `e37cb08d`, `48e3d10e`, `dc12d314` (borttagen ur arbetsträdet), `fc57a0dc`, `124efe23`, `b4738396`, `b59e978c`, `9f7763ac`. `git grep -E "sk-or-v1-[A-Za-z0-9]{30,}" <commit>` ger träff i 1–9 filer per commit — det är ett riktigt nyckelvärde, inte en platshållare. Ursprung: `client/src/components/cv/AIWritingAssistant.tsx`.

**Konsekvens:** Var och en med läsrättighet till repot (samt varje klon, fork och CI-cache) kan extrahera nyckeln och belasta OpenRouter-kontot. **Obekräftat:** om GitHub-repot (`glannstrom-lab/deltagarportalen`) är publikt — `gh` saknas i miljön. Är det publikt är detta akut, inte bara brådskande.

**Föreslagen åtgärd:** Rotera nyckeln i OpenRouter-dashboarden. Kodborttagning räcker inte och har aldrig räckt. **Storlek: S** (rotationen) / **L** (historikrensning med `git filter-repo`, sekundärt).

---

# 🟠 HÖG

## SEC-04 — `send-inactivity-warning` har ingen autentisering alls — och A6 aktiverar den

**Allvarlighet: HÖG** (latent idag, se nedan)

**Bevis:** `supabase/functions/send-inactivity-warning/index.ts:79-105`. Handlern kontrollerar `req.method !== 'POST'` och går sedan direkt till `createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)`, läser `email_queue` och skickar mejl via Resend. Ingen `Authorization`-läsning, ingen cron-secret, ingen rate limit. Grep efter `CRON_SECRET`/`getUser` i filen ger noll träffar (den enda `Authorization` på `:154` är Resends egen header).

**Premissgranskning — varför den inte är KRITISK idag:** `select count(*) from email_queue` → **0 rader**. Kön fylls av retention-jobbet, som aldrig kör eftersom pg_cron inte är installerat (SEC-07). Funktionen returnerar alltså `{processed: 0}` för alla i dag.

**Detta är en ordningsberoende fälla:** i samma stund som A6 aktiveras (pg_cron + retention) börjar kön fyllas, och då blir endpointen en oautentiserad mejlutskickstrigger. Vem som helst med anon-nyckeln kan POSTa i loop → 18-månadersvarningar skickas i otid till riktiga användare, Resend-kvoten bränns.

**Konsekvens för användaren:** Får ett "ditt konto raderas snart"-mejl som ingen skickat — den mest oroande sortens mejl för målgruppen.

**Föreslagen åtgärd:** Cron-secret-jämförelse i konstant tid (mönstret finns redan i `client/api/job-alerts.js:46-80`) + per-IP-rate-limit. **Gör detta före A6, inte efter.** **Storlek: S**

---

## SEC-05 — Blanket-INSERT-policy på `storage.objects`: varje inloggad användare kan skriva var som helst

**Allvarlighet: HÖG** (latent idag)

**Bevis (prod):**
```
Allow uploads h83o5u_0          | INSERT | PERMISSIVE | roles=authenticated | CHECK = true
Users can upload own documents  | INSERT | PERMISSIVE | CHECK = bucket_id='profile-documents' AND auth.uid()::text = foldername(name)[1]
Users can upload own profile…   | INSERT | PERMISSIVE | CHECK = bucket_id='profile-images'    AND auth.uid()::text = foldername(name)[1]
```
Den första är permissiv med `CHECK = true` — ingen bucket, ingen sökväg, ingen ägare. OR-kombinationen gör de två välskrivna policyerna verkningslösa.

**Konsekvens:** Vilken inloggad deltagare som helst kan lägga filer i **en annan användares mapp** i `profile-documents` (offret ser dem sedan som sina egna dokument via `Users can view own documents` — planterade "intyg" eller "CV") och i den **publika** bucketen `profile-images` under godtycklig sökväg. Ingen av bucketarna har `file_size_limit` eller `allowed_mime_types` (`select id, public, file_size_limit, allowed_mime_types from storage.buckets` → båda `none`/`any`), så `profile-images` blir en öppen filvärd på en supabase.co-URL kopplad till Jobin.

**Premissgranskning:** `select count(*) from storage.objects` → **0**. Ingen har laddat upp något ännu (uppladdningen gick tidigare mot den obefintliga bucketen `user-content`, se CLAUDE.md 2026-07-27). Hålet är alltså latent, men det öppnar sig i samma stund uppladdningen börjar användas.

**Föreslagen åtgärd:** Droppa `"Allow uploads h83o5u_0"`. Sätt `file_size_limit` (t.ex. 5 MB) och `allowed_mime_types` på båda bucketarna. **Storlek: S**

---

## SEC-06 — Art. 9-grinden gör sitt uppslag som `anon` → 403 för alla, alltid

**Allvarlighet: HÖG** (funktionell död + falsk trygghet, inte dataläcka)

**Bevis:** `client/api/ai.js:990-993`:
```js
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
);
const { data: { user } } = await supabase.auth.getUser(token);
```
Ingen `global.headers.Authorization`. `auth.getUser(jwt)` **validerar** token men sätter ingen session i supabase-js v2 — efterföljande PostgREST-anrop går som `anon`. `checkArt9Consent` (`client/api/ai.js:232-251`) kör därefter `.from('profiles').select('ai_consent_at, ai_enabled').eq('id', userId).single()`.

Verifierat mot prod: som `anon` ger `select count(*) from profiles` **0 rader** (RLS: `Users can view own profile USING (auth.uid() = id)`). `.single()` på 0 rader → PGRST116 → `{allowed:false, reason:'lookup_failed'}` → **403**.

Kontrastbevis att rätt mönster finns i repot: `client/api/cv-pdf.js:133-135` skickar `global: { headers: { Authorization: … } }`.

**Konsekvens för användaren:** `vecko-reflektion`, `adaptation-recommendations` och `adaptation-conversation` svarar *"Vi kunde inte kontrollera ditt samtycke just nu"* för **alla** — även de 17 användare som faktiskt har `ai_consent_at` satt. Grinden testar aldrig samtycke; den nekar allt. Fail closed räddar juridiken men dödar funktionen, och ger ett falskt intryck av att art. 9-skyddet är verifierat i drift.

**Varför inget fångade det:** `client/src/services/aiServerConsentGate.test.ts:24-37` stubbar hela Supabase-klienten. Exakt fällan i CLAUDE.md 2026-08-04 (mockar som ljuger) och 2026-07-27 (`journey_goals`).

**Föreslagen åtgärd:** Skicka användarens token i klienten för samtyckesuppslaget, som `cv-pdf.js` gör. Lägg till ett test som går mot en riktig (eller minst realistisk) RLS-väg. **Storlek: S**

---

## SEC-07 — Ingen retention/gallring körs över huvud taget (A6)

**Allvarlighet: HÖG** (GDPR art. 5.1.e)

**Bevis (prod):**
```
select ... from cron.job;   → ERROR 42P01: relation "cron.job" does not exist
select extname from pg_extension where extname in ('pg_cron','pg_net','pgsodium','vault');  → NONE
select count(*) from pg_available_extensions where name='pg_cron';  → 1   (finns, men är inte aktiverad)
```
Effektbevis, inte bara konfigurationsbevis:
```
select count(*) from ai_usage_logs where created_at < now()-interval '90 days';  → 5
select min(created_at)::date from ai_usage_logs;                                 → 2026-04-08
select count(*) from email_queue;                                                → 0
```
Retentionspolicyn (`supabase/migrations/20260515_retention_cron.sql`) definierar fyra jobb — `retention-ai-usage-logs` (90 d), `retention-inactive-accounts` (18 mån varning / 24 mån radering), `retention-audit-logs` (5 år), `process-deletion-requests`. **Inget av dem existerar i databasen.** Filen är själv kommenterad "KÖRS MANUELLT (kräver pg_cron som måste aktiveras separat)".

**Konsekvens för användaren:** Ingen personuppgift gallras någonsin. Fem AI-loggrader ligger kvar 118 dagar efter att policyn säger 90. Portalen är ung nog att inaktivitetsgallringen ännu inte fått något att göra — men den kommer aldrig att göra det heller. Ni har en dokumenterad lagringspolicy som ni inte följer, vilket är sämre än att inte ha någon.

**Föreslagen åtgärd:** Aktivera pg_cron i Supabase-dashboarden och kör migrationen. **Åtgärda SEC-04 och SEC-11 först** — annars aktiverar ni samtidigt en oautentiserad mejltrigger och ett raderingsjobb som kastar fel. **Storlek: S** (dashboard) + **M** (verifiering av jobben)

---

## SEC-08 — `ai-assistant` låter klienten välja AI-modell (modellåsningen bruten)

**Allvarlighet: HÖG**

**Bevis:** `supabase/functions/ai-assistant/index.ts:43` — `const { function: fn, data, model: overrideModel } = body` — och `:96` — `const model = overrideModel || defaultModel`. Ingen allowlist.

**Konsekvens:** En inloggad användare kan begära en godtyckligt dyr OpenRouter-modell, 20 gånger per minut. Edge-vägen har dessutom **inget** dygnstokentak — det finns bara på Vercel-vägen (`client/api/ai.js:1041-1054`). Bryter direkt mot `docs/AI_MODEL_LOCKING.md`, som CLAUDE.md kallar låst av kostnadsskäl.

**Föreslagen åtgärd:** Ta bort `overrideModel`, eller allowlista mot en env-satt lista. **Storlek: S**

---

## SEC-09 — Wellness-samtyckets DB-grind neutraliserad av dubblettpolicy

**Allvarlighet: HÖG** (GDPR art. 9)

**Bevis (prod, `mood_logs` INSERT-policyer):**
```
Users can insert mood logs with wellness consent | INSERT | CHECK (auth.uid()=user_id AND check_wellness_consent(auth.uid()))
Users can create own mood logs                   | INSERT | CHECK (user_id = auth.uid())        ← ingen samtyckeskontroll
```
Båda permissiva → OR → den andra räcker. `check_wellness_consent()` anropas i praktiken aldrig som grind.

**Konsekvens:** Måendedata (särskild kategori enligt art. 9) kan skrivas utan att wellness-samtycket är på plats. Databaslagret ser ut att bära samtyckeskravet men gör det inte — och det är just det lagret man litar på när klientkoden ändras.

Samma mönster som SEC-01 och SEC-05. Kontrollera hela listan: `select tablename, cmd, count(*) from pg_policies where schemaname='public' and permissive='PERMISSIVE' group by 1,2 having count(*)>1;` ger 34 rader — merparten är ofarliga dubbletter med samma villkor eller avsiktligt olika roller (användare + konsulent), men de bör gås igenom en gång.

**Föreslagen åtgärd:** Droppa `"Users can create own mood logs"`. Gå igenom de 34 dubblettraderna och droppa varje policy som är strikt svagare än en syskonpolicy. **Storlek: M**

---

## SEC-10 — Dataexporten (art. 15.3 / 20) saknar exakt art. 9-datan

**Allvarlighet: HÖG**

**Bevis:** `export_user_data()` (`supabase/migrations/20260327110000_delete_account.sql:248-309`) exporterar sju källor: `profiles`, `cvs`, `cover_letters`, `interest_results`, `user_activities` (max 1000), `saved_jobs`, `consent_history`.

**Saknas:** `diary_entries`, `journal_entries`, `mood_logs`, `mood_history`, wellness-/hälsodata, ansökningar, `interview_sessions`, `unified_profiles`, `participant_data_sharing`, `data_sharing_audit`, `ai_usage_logs`, konsulentkopplingar. Alltså dagbok och mående — det känsligaste ni lagrar.

**Konsekvens för användaren:** "Ladda ner mina uppgifter" (`DeleteAccountSection.tsx:89`) ger en ofullständig kopia. En registerutdragsbegäran besvaras felaktigt.

**Föreslagen åtgärd:** Utöka funktionen och härled tabellistan ur `supabase/schema-snapshot.json` så den inte driftar igen. **Storlek: M**

---

## SEC-11 — Grace-period-raderingen kan inte köra: signaturmissmatch

**Allvarlighet: HÖG** (latent)

**Bevis (prod):**
```
select proname||'('||pg_get_function_arguments(oid)||')' from pg_proc where proname like 'execute_account_deletion%';
→ execute_account_deletion_immediate()          ← parameterlös
```
Retention-jobbet anropar `SELECT execute_account_deletion_immediate(adr.user_id)` (`supabase/migrations/20260515_retention_cron.sql:132`) — en signatur som inte finns. Och även med rätt signatur läser funktionen `auth.uid()` (`20260327110000_delete_account.sql:159-169`), som är NULL i cron-kontext → `Not authenticated`.

**Premissgranskning:** `select count(*) from account_deletion_requests where scheduled_deletion_at < now() and executed_at is null and cancelled_at is null` → **0**. Ingen användare är drabbad ännu, och jobbet finns ändå inte (SEC-07). Men fixas SEC-07 utan detta blir art. 17-raderingar tysta no-ops.

**Föreslagen åtgärd:** Ny `execute_account_deletion_for(uuid)` (SECURITY DEFINER, ingen `auth.uid()`) som cron anropar. **Storlek: M**

---

# 🟡 MEDEL

## SEC-12 — `anon` har blanket-grants (SELECT/INSERT/UPDATE/DELETE/TRUNCATE) på ~90 tabeller

**Bevis:** `select table_name, string_agg(distinct privilege_type,',') from information_schema.role_table_grants where grantee='anon' and table_schema='public' group by 1` → ~90 tabeller med `DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE`, inklusive `mood_logs`, `journal_entries`, `diary_entries`, `profiles`, `cvs`, `participant_data_sharing`, `user_consent_status`, `consent_history`.

Detta är Supabases default (`GRANT ALL ON ALL TABLES … TO anon`). A15 gjorde `REVOKE` på exakt två tabeller (`cvs`, `user_preferences`) — resten står kvar.

**Konsekvens:** RLS är just nu det **enda** som skiljer anon från all persondata i portalen. Verifierat att RLS håller idag (`set local role anon; select count(*) from profiles` → 0; `from saved_jobs` → 0; `from cv_shares` → 0). Men en enda framtida policy med för brett `USING`, eller ett `ALTER TABLE … DISABLE ROW LEVEL SECURITY` i en migration, går från "en policy är fel" till "hela tabellen ligger öppen". A10 och A7 var precis den händelsen.

**Föreslagen åtgärd:** `REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;` följt av riktade `GRANT SELECT` till de få tabeller anon faktiskt behöver (innehållstabeller: `achievements`, `article_course_links`, `exercise_questions`, `writing_prompts`). Testa inloggningsflödet och inbjudningsflödet efteråt. **Storlek: M**

## SEC-13 — `cv_shares`: "Anyone can view shared CVs" utan kodmatchning (A7-mönstret, ostädat)

**Bevis (prod):** `Anyone can view shared CVs | SELECT | roles=public | USING (expires_at > now())`. Ingen matchning mot `share_code`. Kolumner: `id, user_id, share_code, expires_at, created_at`.
**Premissgranskning:** `select count(*) from cv_shares` → 6, varav `expires_at > now()` → **0**. Som `anon` läser jag idag 0 rader. Hålet är alltså latent — men första gången någon delar sitt CV kan anon enumerera koden **och** ägarens `user_id` (som i sin tur matar SEC-02).
**Åtgärd:** Samma behandling som `profile_shares` fick i A7 — droppa policyn, lägg en `SECURITY DEFINER`-RPC som slår upp på koden. **Storlek: S**

## SEC-14 — `cv-analysis` och `send-invite-email` saknar rate limit trots definierade gränser

**Bevis:** `supabase/functions/_shared/rateLimit.ts:27` (`cv-analysis: 5/min`) och `:29` (`send-invite-email: 10/min`) — men `checkRateLimit` anropas aldrig i respektive `index.ts`. `cv-analysis` kör dessutom `gpt-4` mot `OPENAI_API_KEY` (`cv-analysis/index.ts:107`).
**Konsekvens:** Obegränsade GPT-4-anrop per inloggad användare; `send-invite-email` skickar upp till 50 mejl per anrop utan anropstak (ägarkontrollen från HIGH-2605-01 begränsar *vilka* inbjudningar, inte antalet anrop).
**Åtgärd:** Två rader per funktion. **Storlek: S**

## SEC-15 — Fail-open rate limit på de dyraste vägarna

**Bevis:** `client/api/cv-pdf.js:43` och `:55`; `client/api/upload-image.js:99` och `:111`; `supabase/functions/bolagsverket/index.ts:330-332` — alla returnerar `{allowed:true}` vid RPC-fel. `client/api/ai.js:141` och `job-alerts.js:156` har däremot in-memory-fallback.
**Konsekvens:** Vid DB-strul är Puppeteer-PDF (1 GB minne, 60 s timeout) och blobuppladdning obegränsade. Enligt projektets egen fail-open/fail-closed-regel (CLAUDE.md 2026-08-03) är kostnaden här hög nog att motivera fallback.
**Åtgärd:** Återanvänd `rateLimitFallback`-mönstret från `ai.js:105-119`. **Storlek: S**

## SEC-16 — Vercel-preview-CORS-regexen är förfalskningsbar

**Bevis:** `/^https:\/\/deltagarportal(en)?-[a-z0-9]+-[\w-]+\.vercel\.app$/` — identisk i `client/api/ai.js:318`, `client/api/cv-pdf.js:113`, `client/api/job-alerts.js:100`, `supabase/functions/_shared/proxyGuard.ts:32`, `supabase/functions/af-jobsearch/index.ts:27`. Vercel-projektnamn är unika per konto, inte globalt — vem som helst kan skapa ett gratisprojekt `deltagarportal` vars preview-URL matchar. Origin reflekteras då in i `Access-Control-Allow-Origin` med `Allow-Credentials: true` (`ai.js:331`, `cv-pdf.js:122`, `job-alerts.js:110`).
**Premissgranskning:** Praktisk påverkan är begränsad — portalen autentiserar med Bearer-token från `localStorage`, inte cookies, så en angriparsida kan inte rida på sessionen. Grinden gör alltså inget nyttigt, och `Allow-Credentials` är onödigt.
Sidonotering: `af-trends/index.ts:15` allowlistar hela `https://glannstrom-lab.github.io`.
**Åtgärd:** Env-satt lista över faktiska preview-URL:er; ta bort `Allow-Credentials`. **Storlek: S**

## SEC-17 — Råa felmeddelanden till klienten (15 ställen)

**Bevis:** `client/api/cv-pdf.js:281`, `client/api/job-alerts.js:665`, `learning-progress/index.ts:309`, `learning-analyze-gap/index.ts:318`, `learning-recommend/index.ts:400`, `af-trends/index.ts:68`, `af-enrichments/index.ts:52`, `af-jobed/index.ts:60`, `af-historical/index.ts:156`, `af-taxonomy/index.ts:213`, `education-search/index.ts:689`, `af-jobsearch/index.ts:137`, `delete-account/index.ts:116`, `send-invite-email/index.ts:422`, `health/index.ts:86,100,113`.
`_shared/cors.ts:143-163` sanerar redan — de ovan går förbi den. **Storlek: M**

## SEC-18 — CSP tillåter `'unsafe-inline'` i `script-src`

**Bevis:** `client/vercel.json:30` — `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://*.sentry.io … https://translate.google.com …`
**Konsekvens:** Upphäver CSP:ns viktigaste XSS-skydd. I en portal där deltagare matar in fritext (dagbok, CV, ansökningar) som renderas tillbaka är det den skarpaste kvarvarande header-svagheten. **Storlek: M**

## SEC-19 — Hälso- och wellnesssamtycken skriver ingen `consent_history`

**Bevis (prod):** `select consent_type, action, count(*) from consent_history group by 1,2` →
`terms:granted=17, privacy:granted=17, ai_processing:granted=15, terms:withdrawn=1, privacy:withdrawn=1, ai_processing:withdrawn=1, marketing:withdrawn=1`.
**Noll rader för `health_consent` eller `wellness_consent`** — trots att `Settings.tsx:186-225` exponerar fyra samtycken. Orsak: togglen sätter kolumnen direkt via `userApi.updateProfile()` i stället för att gå via `grant_consent`/`withdraw_consent` (`20260327100000_user_consent.sql:162, 191`), som är det enda stället som skriver historik.
**Konsekvens (art. 7.1):** För exakt de två art. 9-samtycken där bevisbördan är hårdast kan ni inte visa när samtycket gavs, till vilken policyversion, eller att det återkallats.
**Åtgärd:** Låt togglen anropa RPC:erna. **Storlek: S**

## SEC-20 — Fem AI-vägar går utanför PII-saneringen och utanför samtyckesgrinden

**Bevis:** `sanitizeObjectForAi` används på **ett** ställe: `client/src/services/aiApi.ts:90`. Utanför den går `aiCareerAssistantApi.ts:169, 290, 357, 426` och `aiCompanySearchApi.ts:56` direkt till edge-funktioner som anropar OpenRouter. Grep efter `consent` i hela `supabase/functions/` → **noll träffar**.
**Konsekvens:** Personnummer/kontonummer i CV-fritext strippas inte före tredjelandsöverföring på dessa vägar, och `ai_enabled = false` (art. 21-invändning) stoppar dem inte. `ai-commute-planner` tar dessutom emot bostadsadress. **Storlek: M**

## SEC-21 — Radering rör inte Supabase Storage

**Bevis:** `supabase/functions/delete-account/index.ts:70-107` rensar bara Vercel Blob (`user-${userId}/`). Klienten laddar upp till Supabase Storage (`unifiedProfileApi.ts:474` → `profile-images`, `profileEnhancementsApi.ts:238` → `profile-documents`). `storage.objects` har ingen FK till `profiles`, så CASCADE hjälper inte.
**Premissgranskning:** `select count(*) from storage.objects` → **0**, och `owner`-föräldralösa → 0. Latent. **Storlek: M**

## SEC-22 — Partiell radering rapporteras som full framgång (LOW-2605-05 kvarstår)

**Bevis:** `client/src/services/accountApi.ts:90-95` returnerar `{success:true, authDeleted}` även när auth-raderingen failat; `DeleteAccountSection.tsx:211-218` `console.warn`:ar och navigerar ändå till "kontot raderat". Edge-funktionen returnerar `success:true` med `blobCleanup:'failed (…)'` (`delete-account/index.ts:94, 122-127`).
**Konsekvens:** Användaren får besked om att allt är borta medan auth-kontot kan finnas kvar. Enda spåret är en console-rad i användarens egen webbläsare — ingen larmväg. **Storlek: S**

## SEC-23 — CORS `*` på `learning-progress`, `learning-analyze-gap` och `health`

**Bevis:** `learning-progress/index.ts:8`, `learning-analyze-gap/index.ts:12`, `health/index.ts:136`. `health` är dessutom helt publik (`:35-41`), kör service role och listar buckets, och returnerar felsträngar (`:86,100,113`).
**Kontext:** `learning-*` är enligt ROADMAP C4 utan klientkonsumenter men fortfarande deployade — attackyta utan nytta. **Storlek: S**

## SEC-24 — PostgREST-filterinjektion + wildcard-DoS i artikelsöket

**Bevis:** `client/src/services/contentApi.ts:332` — `.or(\`title.ilike.%${query}%,summary.ilike.%${query}%,content.ilike.%${query}%\`)`. Rå användarsträng i filtersyntaxen: `,`, `)` och `.` bryter ut och kan lägga till egna villkor; `%`/`_` ger ostyrd scan.
**Bedömning:** Inte SQL-injektion (PostgREST parametriserar), men filterlogiken kan manipuleras och sökningen göras godtyckligt dyr. **Storlek: S**

## SEC-25 — `javascript:`-href i AI-genererad markdown (LOW-2605-01 kvarstår)

**Bevis:** `client/src/components/ai-team/MarkdownRenderer.tsx:409-417` — `href={linkMatch[3]}` rakt från modellens output, ingen protokoll-allowlist. Egen parser, går inte genom DOMPurify.
**Kedja:** jobbannonstext från AF matas in i prompter → modellen kan förmås emittera `[Klicka här](javascript:…)`. React 19 varnar men blockerar inte. **Storlek: S**

## SEC-26 — `job-alerts.js` faller tillbaka till anon-nyckel för service-klienten

**Bevis:** `client/api/job-alerts.js:17` — `process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY`.
**Konsekvens:** Saknas service-nyckeln degraderar hela cron-vägen tyst till anon → RLS blockerar → `checkAllAlerts` returnerar noll träffar och rapporterar `success:true`. Exakt det tysta felmönster som höll jobbevakningen trasig sedan april. **Storlek: S**

## SEC-27 — Google Translate laddas utan egen samtyckeskategori

**Bevis:** `GoogleTranslate.tsx:118-121` injicerar Googles script; `:50-60` sätter `googtrans`-cookie på hela domänen; `:133-140` laddar automatiskt vid mount om språk sparats tidigare. `CookieConsent.tsx:13-16` känner bara till `necessary` + `analytics`, och ingen kod frågar `hasAnalyticsConsent()` före injektionen.
**Konsekvens:** Sidans innehåll — inklusive dagbokstext på översatta vyer — skickas till Google (USA) på en grund som inte finns i bannern, och vid återbesök utan ny handling. **Storlek: S**

## SEC-28 — Storage-bucketar utan storleks- eller MIME-gräns

**Bevis (prod):** `profile-documents | public=false | limit=none | mimes=any`, `profile-images | public=true | limit=none | mimes=any`.
**Konsekvens:** Godtyckligt stora filer; SVG/HTML kan laddas upp till en **publik** bucket. Serveras från supabase.co, inte appens origin, så XSS-påverkan på portalen är begränsad — men det är fortfarande filhosting i Jobins namn. **Storlek: S**

---

# ⚪ LÅG

- **SEC-29 — `http://localhost:*` i prod-CSP.** `client/vercel.json:30` (`img-src`, `connect-src`). Kvarleva från dev; luckrar upp `upgrade-insecure-requests`. **S**
- **SEC-30 — `learning-progress` validerar inte numeriska fält.** `learning-progress/index.ts:191-200` skriver `progress_percent` och ackumulerar `time_spent_minutes` direkt från body; `:239-247` skriver `rating` ovaliderat. Ägarkontroll finns (`:169-174`) — dataintegritet, inte IDOR. **S**
- **SEC-31 — Två anon-exponerade funktioner är redan trasiga av schemadrift.** `get_mood_streak` → `column "logged_at" does not exist` (kolumnen heter något annat på `mood_logs`); `find_buddy_matches` → `relation "community_buddy_preferences" does not exist`. Fantomtabellklassen från 2026-07-27, men i funktionskroppar — som `lint:schema` inte granskar. **S** (radera dem) + **M** (utöka grinden till `pg_proc.prosrc`)
- **SEC-32 — `ai_enabled = false` respekteras bara av tre funktioner.** `client/api/ai.js:1021` — kontrollen körs enbart för `ART9_FUNCTIONS`. Övriga 20+ (CV, brev, intervju, ai-team-chatt) läser aldrig flaggan, medan Settings-texten lovar mer. **S** (texten) / **M** (grinden)
- **SEC-33 — Obegränsad konversationshistorik i två prompter.** `client/api/ai.js:614-618` (`chatbot`) och `:646-649` (`ai-team-chat`) mappar hela `historik` utan `.slice()`. Andra prompter kapar korrekt. Dygnstaket fångar upp det i efterhand. **S**

---

# Det här är faktiskt bra

- **RLS är på överallt.** Noll tabeller i `public` med `relrowsecurity=false`. De tre utan policyer (`email_notifications`, `email_queue`, `rate_limits`) är service-role-tabeller — RLS utan policy = deny all, vilket är rätt.
- **Alla 64 `SECURITY DEFINER`-funktioner har pinnad `search_path`.** `count(*) filter (where prosecdef and proconfig is null)` → **0**. Det är ovanligt välskött och stänger en hel klass av eskaleringsangrepp.
- **RLS håller mot direkt anon-åtkomst.** Verifierat live: `set local role anon; select count(*) from profiles / saved_jobs / cv_shares` → 0, 0, 0. Kvarvarande `USING(true)`-policyer sitter enbart på innehållstabeller (`achievements`, `article_course_links`, `exercise_questions`, `writing_prompts`) — ingen persondata.
- **A11, A12, A13, A15 och HIGH-2605-01 håller vid granskning.** SSRF-fixen sitter på `cv-pdf.js:212` (Origin allowlist-valideras före `printUrl`), dygnstokentaket på `ai.js:1041-1054` före SSE-grenen, ägarkontrollen på `send-invite-email/index.ts:217-223`, och `proxyGuard` används av **alla sju** AF-/education-proxyer. Det är inte pappersåtgärder.
- **Inga secrets i arbetsträdet — verifierat mot den byggda bundlen.** `client/dist` (byggd 2026-08-04) grep:ad på `service_role`, `sk-or-v1-`, `sk-ant-` → noll. Varje JWT i `dist/assets/*.js` avkodad: enda payload-rollen är `"role":"anon"`. Alla fem trackade `.env`-filer är `.env.example` med platshållare; alla åtta riktiga `.env`-filer är gitignorerade. Workflows använder uteslutande `${{ secrets.* }}`.
- **Säkerhetsheaders är kompletta.** `client/vercel.json:24-57`: HSTS `max-age=31536000; includeSubDomains; preload`, `X-Frame-Options: DENY`, `frame-ancestors 'none'`, `nosniff`, `strict-origin-when-cross-origin`, `Permissions-Policy` med `microphone=(self)` (motiverat av intervjusimulatorn).
- **Fail-closed-policyn är uttrycklig och motiverad i koden.** `client/api/ai.js:221-231` skriver ut *varför* art. 9-grinden är fail closed medan token-taket är fail open. Precis den disciplin lärdomen 2026-08-03 efterlyste — buggen i SEC-06 är en implementationsmiss, inte ett tankefel.
- **Klientlevererad systemprompt är blockerad** (`ai.js:638-641`) med loggning av försök, agent/personlighet whitelistas, 4000-teckenkap, och `sanitizeAll` kapar varje sträng till 5000 tecken innan prompten byggs.
- **Bara två `dangerouslySetInnerHTML` i hela `client/src`** (`JobSearch.tsx:944`, `NotificationsCenter.tsx:312`), båda genom `sanitizeHTML*`. Noll `eval(`, `new Function(`, `document.write` eller otvättade `innerHTML`-skrivningar. `sanitize.ts:9-39` saknar `img`/`iframe`/`svg` i `ALLOWED_TAGS` och `src` i `ALLOWED_ATTR` — rätt snålt.
- **Konsulentdelningen är RLS-enforcad, inte klientfiltrerad** (`20260328100000_health_data_consent.sql:276-302`) — `mood_logs` och `interest_results` kräver `share_wellness_data`/`share_health_data` för konsulentläsning.
- **UX18 håller:** återkallat hälso-/wellnesssamtycke stänger också av delningen och *säger ifrån* om det misslyckas i stället för att se genomfört ut (`Settings.tsx:207-247`).

---

# Föreslagen ordning

1. **SEC-01** (privilegieeskalering) — en droppad policy. Störst effekt per rad i hela rapporten.
2. **SEC-02** (anon-exekverbara `SECURITY DEFINER`) — `REVOKE` först, `auth.uid()`-kontroller sedan.
3. **SEC-03** (rotera OpenRouter-nyckeln) — Mikael, 5 minuter, öppet sedan 28 maj.
4. **SEC-05 + SEC-09 + SEC-13** — samma dubblettpolicy-städning, en migration.
5. **SEC-04 + SEC-11 innan SEC-07** — fixa den oautentiserade mejltriggern och raderingssignaturen *före* pg_cron aktiveras.
6. **SEC-06** (art. 9-grinden) — en rad, och lägg till ett test som inte ljuger.
7. Resten enligt allvarlighet.

---

# Öppna verifieringspunkter

- **Repots GitHub-visibility** (publikt/privat) — avgör om SEC-03 är akut eller brådskande. `gh` saknas i miljön.
- **`verify_jwt`-status per deployad edge-funktion** — styrs från Supabase-dashboarden, inte repot (`deploy.yml:71` kör `supabase functions deploy` utan flaggor). Rot-`config.toml` saknar `[functions.*]`-block; de tre per-funktions-`config.toml` (`af-jobsearch`, `cv-analysis`, `ai-cover-letter`) läses inte av CLI:n.
- **Supabase OAuth redirect-allowlist** — dashboardåtgärd, kvarstår från förra revisionen.
- **SEC-06 i skarp drift** — logiken och biblioteket är entydiga, men en repro mot `/api/ai` med `{"function":"vecko-reflektion"}` och giltig token skulle stänga frågan definitivt.
- **Skrivfunktionerna i SEC-02** är inte exekverade (skulle förändra prod). Bedömningen vilar på frånvaro av `auth.uid` i `prosrc` + `p_user_id`-parameter.
