# Databas & säkerhetsaudit (2026-05-14)

Granskning av `supabase/migrations/` (96 SQL-filer + 3 README), 23 edge functions, `client/api/` + `api/` Vercel-functions, samt klient-säkerhetsmönster. Audit baseras på senaste audit (`docs/security-audit.md`, 2026-04-23) som referens — de tre HIGH-fynden därifrån är åtgärdade men nya fynd har tillkommit.

---

## TL;DR (5 viktigaste fynden)

1. **CRITICAL — `client/api/upload-image.js` saknar autentisering.** Endpointen accepterar uppladdningar från vem som helst med korrekt CORS-origin. Vercel Blob är `access: 'public'`. Resultat: anonyma användare kan fylla bucket, hosta arbiträrt innehåll under jobin.se-relaterade URL:er, och bränna ditt BLOB-quota.
2. **HIGH — Migration `20260306130000_fix_all_rls_policies.sql` är data-destruktiv.** Innehåller `DROP TABLE IF EXISTS dashboard_preferences/user_preferences/article_bookmarks/job_applications/interview_sessions/daily_tasks/notifications/job_alerts/application_templates/ai_usage_logs CASCADE` följt av `CREATE TABLE` (utan `IF NOT EXISTS`). Körs den någonsin på prod-DB med data → all data i 10 tabeller raderas + RLS-policies ersätts. Migrationen säges vara idempotent men är det inte vid fresh-setup eller ompush.
3. **HIGH — Filtypsvalidering på upload sker bara via Content-Type-header**, som klienten trivialt kan spoofa. Ingen magic-byte-kontroll. Kombinerat med fynd #1 ger detta arbiträr filuppladdning (t.ex. JS, HTML, SVG med `<script>`).
4. **MEDIUM — Bolagsverket-edge-function har ingen explicit user-JWT-verifiering**. Funktionen är skyddad av Supabase:s default `verify_jwt=true` på edge-functions, men det loggar inte vilken user som anropar (omöjligt att hitta missbruk). Bolagsverket har egen rate-limit (klient-credentials grant per Supabase-projekt), så missbruk drabbar HELA projektets quota.
5. **MEDIUM — `health_data_consent`-RLS på `interest_results.INSERT` kan blockera nya CV-användare.** Policy kräver `check_health_consent(auth.uid())` — om en användare inte gett `health_data`-samtycke kan de inte spara intresseresultat. Onboarding flagar inte detta explicit (måste verifieras i UI).

---

## Migration-skuld

### Översikt

- **96 SQL-migrationer** i `supabase/migrations/` (inkl. 3 README/notes-filer).
- **Migrations körs ej via `db push`** utan `db query --linked -f <fil>` per fil. Detta är dokumenterat i `CLAUDE.md` och `MIGRATION_NOTES.md`.
- Tidstämplar inkonsekventa: vissa filer använder `YYYYMMDDhhmmss`, andra `YYYYMMDD_<slug>` (utan timme), och de tre tidigaste är `001_..009_`. Vid alfabetisk sortering kan filer från samma dag köras i fel ordning.

### Konflikter (dokumenterade i `MIGRATION_NOTES.md`)

| Konflikt | Filer | Status |
|---|---|---|
| Dubbel timestamp `20260306130000` | `_fix_all_rls_and_tables.sql` + `_fix_all_rls_policies.sql` | Båda idempotenta, men `_fix_all_rls_policies` är destruktiv (se HIGH-1) |
| `invitations`-trippel | `007_consultant_dashboard.sql`, `010_invitations_table.sql`, `20260408120000_fix_signup_trigger.sql` | `IF NOT EXISTS`-skydd. 010 har vunnit i prod. |
| `user_preferences`-dubblett | `20260315_add_user_preferences.sql`, `20260315_fix_user_preferences.sql` | Idempotent. |
| `achievements`-tabell på 2 ställen | `20260316_milestones_system.sql`, `20260322200000_journey_goals_achievements.sql` | Båda `IF NOT EXISTS`. |

### CREATE TABLE utan IF NOT EXISTS (~24 förekomster)

Migrationer som har `CREATE TABLE <name>` utan `IF NOT EXISTS` — om någon av dessa körs igen mot prod-DB med data, fail:

| Fil | Tabeller utan IF NOT EXISTS |
|---|---|
| `20260306130000_fix_all_rls_policies.sql` | 10 tabeller (`dashboard_preferences`, `user_preferences`, `article_bookmarks`, `job_applications`, `interview_sessions`, `daily_tasks`, `notifications`, `job_alerts`, `application_templates`, `ai_usage_logs`) — **alla föregås av `DROP ... CASCADE`** ⚠️ |
| `20260315_fix_user_preferences.sql` | `user_preferences` (också `DROP TABLE IF EXISTS`) |
| `20260317_diary_tables.sql` | 6 tabeller (`diary_entries`, `mood_logs`, `weekly_goals`, `gratitude_entries`, `diary_streaks`, `writing_prompts`) — **utan föregående DROP**, så fail vid återkörning |
| `20260317_job_alerts.sql` | `job_alerts` |
| `20260322100000_articles_exercises_tables.sql` | `articles` |
| `20260322183304_personal_brand_tables.sql` | 5 tabeller (`personal_brand_audit`, `portfolio_items`, `elevator_pitches`, `visibility_progress`, `content_calendar`) |
| `20260316_fix_cv_save_issues.sql` | `cvs` (inom `DO BEGIN ... END`-block, så OK) |

### NULL utan default

Sökning efter `NOT NULL` utan `DEFAULT` på `ADD COLUMN`-statements: **inga träffar**. Alla `ADD COLUMN`-statements använder `IF NOT EXISTS` och har default eller är nullable. Bra.

### RLS-täckning per tabell

Tidigare `RLS_VERIFICATION.md` listar 126+ tabeller med RLS. Mitt stickprov bekräftar:

- **189 förekomster av `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` över 55 filer**.
- Migrationen `20260408130000_fix_security_warnings.sql` adresserade 4 tabeller där RLS var inaktiverat (article_course_links, writing_prompts, login_attempts, articles_backup).
- **SECURITY DEFINER views** har konverterats till SECURITY INVOKER där det var olämpligt (`user_consent_status`, `user_recommended_courses`).
- **70 SECURITY DEFINER-funktioner** över 33 filer. Alla har explicit `SET search_path = 'public'` efter `20260408140000_fix_function_search_path.sql`.

**Inga uppenbara RLS-luckor identifierade.** Det jag inte kunde verifiera utan att köra mot prod-DB:
- Tabeller som ev. skapats utanför migrations (manuellt i Supabase Studio).
- Backuptabeller (artiklar etc) — vissa kan ha temporärt RLS-off.

---

## RLS & auth

### Vercel serverless functions (`client/api/`, `api/`)

| Endpoint | Auth | Rate-limit | Sanering | Status |
|---|---|---|---|---|
| `client/api/ai.js` | ✅ Bearer + `auth.getUser` | ✅ Supabase RPC | ✅ `sanitizeAll` recursive | OK |
| `client/api/ai-stream.js` | ✅ Bearer + `auth.getUser` | ✅ Supabase RPC | ✅ `sanitizeAll` recursive | OK |
| `client/api/cv-pdf.js` | ✅ Bearer + `auth.getUser` (via global headers) | ❌ Ingen | ✅ Hämtar bara user's eget CV via RLS | **MEDIUM**: lägg till rate-limit (puppeteer är dyrt) |
| `client/api/job-alerts.js` | ✅ Per-action (Bearer eller cron-secret med constant-time compare) | ✅ Supabase RPC | n/a | OK |
| `client/api/upload-image.js` | ❌ **Saknas** | ❌ Ingen | ⚠️ Bara Content-Type | **CRITICAL** |
| `client/api/test.js` | ❌ Saknas | ❌ Ingen | n/a | LOW (returnerar bara timestamp) |
| `api/linkedin-auth.js` | n/a (OAuth) | ✅ In-mem 5/min | ✅ Validerar code/uri/token | OK (OAuth state är klient-managed) |
| `api/google-calendar.js` | n/a (OAuth) | ✅ In-mem | ✅ Validerar | OK (samma) |

### Supabase edge functions (23 st)

Per Supabase-default krävs `verify_jwt=true` (inget global `[auth]`-override i `config.toml`). Stickprovsverifiering:

- **`delete-account/index.ts`**: explicit `authHeader` → `auth.getUser(token)` → verifierar att `profile` redan är raderad (kräver RPC först) → använder `SERVICE_ROLE_KEY` för `auth.admin.deleteUser`. Korrekt.
- **`bolagsverket/index.ts`**: ingen explicit JWT-check i koden. Förlitar sig på Supabase platform-verifiering. Loggar inte user_id → omöjligt att spåra missbruk → MEDIUM.

### `client/api/ai.js` user-data ownership

Endpointen tar `req.body.data` och interpolerar i prompts. Den verifierar Bearer-token och får `user.id`, men kontrollerar inte att t.ex. `cvData` faktiskt tillhör användaren. **Risk**: en angripare med eget konto kan skicka godtyckligt CV-innehåll och få AI-respons baserat på det. Detta är inte ett dataintrång (de skickar in egen data) men kan användas för att stjäla AI-tokens/quota. Befintlig rate-limit per user begränsar detta.

### SECURITY DEFINER-genomgång

70 funktioner använder SECURITY DEFINER. Stickprov:
- `request_account_deletion`, `cancel_account_deletion`, `execute_account_deletion_immediate`: korrekta — auth.uid()-check internt.
- `export_user_data`: korrekt — kör mot auth.uid() internt.
- `grant_consent`, `withdraw_consent`: använder `EXECUTE format(...)` med whitelist:ade kolumnnamn via CASE — inte SQL-injection.
- `handle_new_user`: triggerfunktion på `auth.users`. Korrekt.

Inga onödiga SECURITY DEFINER-funktioner som bypass:ar RLS på fel sätt.

---

## Secrets & credentials

- `.gitignore` skyddar `.env`, `.env.local`, `.env.*` (utom `.env.example`). Verifierat — inga `.env`-filer trackade.
- `.env.example` (`client/`) innehåller bara platshållare. OK.
- Tidigare `[CRITICAL-001]` (produktionsnycklar i arkiverad dokumentation) — åtgärdat enligt audit-rapport.
- **`SUPABASE_SERVICE_ROLE_KEY`-användning**:
  - `client/api/job-alerts.js` — använder service-key med per-action auth-grindar (verifyUserAuth eller verifyCronSecret). Korrekt sedan 2026-05-09-patchen.
  - `client/api/upload-image.js` — använder `BLOB_READ_WRITE_TOKEN` (Vercel Blob) utan auth-skydd. Se #1.
  - `supabase/functions/delete-account/index.ts` — använder service-key efter user-JWT-verifiering. Korrekt.

**Inga hårdkodade secrets hittade i koden vid stickprov.**

---

## Input-validering & XSS

### `dangerouslySetInnerHTML`

3 förekomster i klientkod:

| Fil:rad | Skyddad? |
|---|---|
| `client\src\utils\sanitize.ts:43` | (kommentar i utility-fil, inte använd direkt) |
| `client\src\components\NotificationsCenter.tsx:312` | ✅ `sanitizeHTML(...)` via DOMPurify |
| `client\src\pages\JobSearch.tsx:785` | ✅ `sanitizeHTMLWithLineBreaks(...)` via DOMPurify |

DOMPurify-konfiguration (`utils/sanitize.ts`) tillåter en strikt allow-list av taggar och attribut, blockerar `<script>`, `<iframe>`, event handlers (`onerror`, `onload`...), och `javascript:`/`data:`-URIer. Lägger `rel="noopener noreferrer"` på externa länkar. **OK.**

### SQL injection / .rpc()

- 27 `.rpc()`-anrop i klienten. Sökning efter `.rpc(<var-concatenation>)` eller `${...}` i namn — inga träffar.
- RPC-funktioner som tar TEXT-parametrar (t.ex. `grant_consent(p_consent_type TEXT)`) använder CASE-mappning till kolumnnamn → ingen dynamisk SQL.
- `EXECUTE format(...)` i några SECURITY DEFINER-funktioner — granskat, alla använder `%I` (identifier escape) eller hårdkodade kolumnnamn.

### File upload

`client/api/upload-image.js`:
- ✅ MAX_FILE_SIZE = 5 MB.
- ❌ **Content-Type-validering är otillräcklig** — klienten kan skicka godtycklig `Content-Type`-header. Saknar magic-byte/sniffing.
- ❌ Filnamn från `req.query.filename` används direkt — ingen sanering. Path-traversal möjligt? Vercel Blob använder API och inte filsystem så troligen säkert, men `filename` syns publikt i URL.
- ❌ Ingen auth → vem som helst kan uppladda.

---

## Externa API:er

| API | Var | Auth | Rate-limit | Anteckningar |
|---|---|---|---|---|
| **Arbetsförmedlingen (AF)** | `supabase/functions/af-*` (6 st) + `client/api/job-alerts.js` (`AF_API_URL`) | n/a (offentligt) | Indirekt via Supabase RPC | OK |
| **Bolagsverket** | `supabase/functions/bolagsverket/index.ts` | Client Credentials Grant (server-side) | Token cache (60s buffer). **Ingen per-user rate-limit i edge.** | MEDIUM — lägg till per-user rate-limit |
| **OpenRouter (Claude/GPT)** | `client/api/ai.js`, `client/api/ai-stream.js` | API-key i env | ✅ Per user via Supabase RPC | OK |
| **LinkedIn OAuth** | `api/linkedin-auth.js` | Client secret server-side | ✅ 5/min in-mem | OAuth state managed klient-side (sessionStorage) — OK, men in-memory rate-limit ej distribuerat. |
| **Google Calendar OAuth** | `api/google-calendar.js` | Client secret server-side | ✅ Per action in-mem | Samma — in-mem rate-limit ej distribuerat över serverless instances. |
| **Vercel Blob** | `client/api/upload-image.js` | `BLOB_READ_WRITE_TOKEN` | ❌ Ingen | Se CRITICAL-1 |

**Notera**: `api/_utils/rate-limiter.js` ÄR distribuerad (Supabase-baserad med in-mem fallback). Men `api/linkedin-auth.js` och `api/google-calendar.js` använder den asynkront — funkar bara om Supabase env är konfigurerat. Annars fallback till in-mem.

---

## GDPR & data

### `delete-account` flöde

1. Klient anropar RPC `execute_account_deletion_immediate` → raderar `profiles`-rad → CASCADE-radering av alla relaterade tabeller (`cvs`, `cover_letters`, `interest_results`, `mood_logs`, `saved_jobs`, `consent_history`, etc).
2. Klient anropar edge function `delete-account` → verifierar att profile är raderad (`PROFILE_EXISTS`-check) → `auth.admin.deleteUser(userId)`.

**Status**: Korrekt 2-stegs-flöde. CASCADE-radering täcker de migrations jag stickprovsläste. **Verifiera dock**:
- Att alla nya tabeller (efter 2026-04-09) också har `REFERENCES profiles(id) ON DELETE CASCADE` eller motsvarande. STA-data-modellen (`20260512_sta_data_model.sql`) bör granskas separat.
- `data_export_logs` har `ON DELETE SET NULL` istället för CASCADE — avsiktligt för audit-trail, men user_email bevaras → GDPR-tveksamt vid "right to be forgotten". Övervägs.

### Hälsodata-samtycke

Migration `20260328100000_health_data_consent.sql` implementerar:
- Två consent-kolumner i `profiles`: `health_consent_at`, `wellness_consent_at`.
- RLS-policies på `interest_results.INSERT` och `mood_logs.INSERT` kräver `check_health_consent(auth.uid())` / `check_wellness_consent(auth.uid())`.
- `participant_data_sharing`-tabell för granulär konsulent-access.
- `data_sharing_audit`-trigger på alla ändringar.

**Risk**: Användare som inte gett samtycke kan inte skapa nya rader → kan se ut som en bugg i UI. Onboarding-flow måste sätta samtycke explicit.

### Audit-logging

- `admin_audit_log` (`20260324100000_security_hardening.sql`) loggar roll-ändringar och kontoradering.
- `data_sharing_audit` loggar consent-ändringar.
- `audit_logs` (`007_consultant_dashboard.sql`) — generell konsulent-audit.
- **`viewAccessLog` i sv.json** (sökt) — UI-element finns i `client/src/pages/consultant/SettingsTab.tsx:610` men är bara en knapp utan handler ("// TODO: implementera"). Funktionalitet saknas.

---

## Rate-limiting

`api/_utils/rate-limiter.js` är **distribuerad** (Supabase RPC `check_rate_limit` med in-mem fallback).

| Endpoint | Använder rate-limiter | Notering |
|---|---|---|
| `client/api/ai.js` | ✅ Per AI-funktion (5-50/15min) | Bra |
| `client/api/ai-stream.js` | ✅ Per AI-funktion (5-20/15min) | Bra |
| `client/api/job-alerts.js` | ✅ Per action | Bra |
| `client/api/cv-pdf.js` | ❌ | MEDIUM — puppeteer är dyrt |
| `client/api/upload-image.js` | ❌ | CRITICAL ihop med auth-luckan |
| `client/api/test.js` | ❌ | LOW |
| `api/linkedin-auth.js` | ✅ In-mem 5/min | MEDIUM — bör migrera till distribuerad |
| `api/google-calendar.js` | ✅ In-mem | MEDIUM — bör migrera till distribuerad |
| Supabase edge functions | ✅ `_shared/rateLimit.ts` används av ai-*, af-*, etc | Bra |
| Bolagsverket edge | ❌ Bara token-cache | MEDIUM — per-user rate-limit saknas |

---

## Prioriterad åtgärdslista

| # | Severity | Fil:rad | Problem | Åtgärd |
|---|---|---|---|---|
| 1 | **CRITICAL** | `client/api/upload-image.js:42-101` | Ingen auth — vem som helst kan uppladda. Bara Content-Type-check (spoofbar). | Lägg till Bearer-token + `auth.getUser` (samma mönster som `ai.js`). Lägg till magic-byte-validering (t.ex. första 4 bytes ska matcha JPEG/PNG/GIF/WebP). Lägg till rate-limit via `api/_utils/rate-limiter.js`. Sanera `filename` (strip path-separators). |
| 2 | **HIGH** | `supabase/migrations/20260306130000_fix_all_rls_policies.sql:19,62,...` | `DROP TABLE ... CASCADE` följt av `CREATE TABLE` utan `IF NOT EXISTS` — data-destruktiv vid återkörning. | Lägg till `IF NOT EXISTS`-guard runt hela blocket eller skapa en `DO $$ BEGIN IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = '...') THEN ... END IF; END $$;`-wrapper. ALTERNATIVT: markera filen som körd i prod via Supabase migrations-tabellen och slippa nya körningar. |
| 3 | **HIGH** | `client/api/upload-image.js:74-77` | MIME-validering bara på header. | Validera magic bytes från buffer: JPEG=`FFD8FF`, PNG=`89504E47`, GIF=`47494638`, WebP=`52494646...57454250`. |
| 4 | **MEDIUM** | `supabase/functions/bolagsverket/index.ts` | Ingen explicit user-JWT-check, ingen per-user rate-limit. | Lägg till `Deno.env.get('SUPABASE_URL')` + `auth.getUser(authHeader)` i början av handler. Använd `_shared/rateLimit.ts`. |
| 5 | **MEDIUM** | `client/api/cv-pdf.js` (hela filen) | Ingen rate-limit. Puppeteer är resurstung — easy DoS-vektor. | Lägg till `checkRateLimit(supabase, user.id, 'cv-pdf')` med limit ~5/15min. |
| 6 | **MEDIUM** | `api/linkedin-auth.js`, `api/google-calendar.js` | In-memory rate-limit (försvinner vid cold start). | Migrera till `api/_utils/rate-limiter.js` (Supabase-distribuerad) — den finns redan. |
| 7 | **MEDIUM** | `supabase/migrations/20260317_diary_tables.sql:11,55,96,136,173,206` | 6 tabeller `CREATE TABLE` utan `IF NOT EXISTS`, ingen `DROP`-skydd. | Lägg till `IF NOT EXISTS` på alla `CREATE TABLE`-rader. |
| 8 | **MEDIUM** | `client/api/ai.js:719-721` | Sanering tar bort `<>`-tecken men inte newlines som kan användas för prompt-injection. | Komplettera `sanitizeInput` med `.replace(/\r?\n/g, ' ')` för vissa fält (kompromiss mellan användbarhet och säkerhet). Alternativt — använd JSON-strukturerade prompts med tydliga avgränsare. |
| 9 | **LOW** | `client/api/test.js` | Public diagnostic endpoint utan auth/rate-limit. | Antingen ta bort eller skydda. |
| 10 | **LOW** | `client/src/pages/consultant/SettingsTab.tsx:610` | `viewAccessLog`-knapp utan handler. | Implementera audit-log-view eller dölj knappen. |
| 11 | **LOW** | 7 migrations | `CREATE TABLE` utan `IF NOT EXISTS` (utöver #2 och #7): personal_brand, articles, job_alerts, fix_user_preferences. | Lägg till `IF NOT EXISTS`. |
| 12 | **LOW** | `data_export_logs` (`20260327110000_delete_account.sql:47`) | `ON DELETE SET NULL` istället för CASCADE — `user_email` bevaras efter raderat konto. | Övervägs — kan ses som GDPR-överträdelse (Art. 17). Konsultera DPO. |

---

*Audit körd 2026-05-14 av automatiserad granskning. Referens: `docs/security-audit.md` (2026-04-23), `docs/RLS_VERIFICATION.md` (2026-04-16), `MIGRATION_NOTES.md` (2026-04-28).*
