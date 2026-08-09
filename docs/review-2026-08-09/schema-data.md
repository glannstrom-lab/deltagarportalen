# Schema- och dataintegritet — granskning 2026-08-09

> **Metod.** Alla schema- och datapåståenden är körda mot **produktionsdatabasen** via
> `npx supabase db query --linked` den 2026-08-09 (main @ `f2877dcb`). Radantal är
> `count(*)` via `query_to_xml`, aldrig `reltuples` och aldrig `n_live_tup` ensamt.
> Kodpåståenden bär `fil:rad`. Där jag inte kunnat mäta står **obekräftat**.
>
> **Ingen kod, ingen databas och inget befintligt dokument har ändrats.** Endast
> läsande `SELECT` har körts.
>
> Utgångsläge: `docs/review-2026-08-04/schema-data.md`, `docs/portal-review-2026-07-27.md`,
> ROADMAP spår H. Där ett fynd bekräftar eller motsäger dem står det utskrivet.

## Sammanfattning

1. **Schemadriften i den mening grinden mäter är fortfarande noll** — snapshoten (135 objekt) är **exakt** lika med prod (132 tabeller + 3 vyer), 0 kolumndiff, `lint:schema` grön över 722 filer.
2. **Men grinden mäter inte allt den behöver.** Den läser inte kolumnnycklar i `.insert()/.update()/.upsert()`. En egen kontroll av just det hittade **fyra riktiga buggar**, varav en i en monterad deltagarvy och en i en edge-funktion.
3. Tyngst: **AI-teamets "skapa uppgift i kalendern" kan strukturellt aldrig lyckas** — insert med fem kolumner som inte finns, och utan `date` som är `NOT NULL`.
4. **Ingen schemaläggare finns någonstans i systemet** — pg_cron saknas (som 2026-08-04), `vercel.json` har inga `crons`, `.github/workflows` har inga `schedule`. Jobbevakning, gallring och inaktivitetsmejl saknar producent på tre nivåer samtidigt.
5. **Migrationsliggaren i prod är osann** — 57 poster mot 132 filer, stannar 2026-04-16, och två registrerade migrationer har inte sina objekt i prod.
6. **Sex synliga räknare visar fel siffra**, tre av dem i konsulentvyn. Två räknar på en `.limit()`-skiva, en läser `profiles.updated_at` som "senaste inloggning", en läser en tom tabell.
7. Datakvalitet: **91 av 92 profiler har `ai_enabled=true` men bara 18 har `ai_consent_at`**, och G9:s borttagna poängmaskineri lever kvar i RPC:n `log_user_activity` (skrev till `user_gamification` i dag kl. 14:58).
8. **77 av 132 tabeller är tomma** (2 191 rader totalt i hela databasen, 29 MB). 20 schemaobjekt har noll kodreferenser.
9. Kontoradering: tre FK-regler (`RESTRICT`/`NO ACTION`) kan blockera radering av en konsulent, och `data_sharing_audit` har inga FK alls.

---

## 1. Full inventering (prod 2026-08-09)

**132 bastabeller + 3 vyer. 55 tabeller har data, 77 är tomma. 2 191 rader totalt, 29 MB.**

Vyer: `consultant_dashboard_participants`, `user_consent_status`, `user_recommended_courses`.
Extensions: `pg_stat_statements`, `pgcrypto`, `plpgsql`, `supabase_vault`, `uuid-ossp` — **inget `pg_cron`**.

### Tabeller med data (55)

| Tabell | Rader | Storlek | Senaste `created_at` |
|--------|------:|---------|----------------------|
| user_activity_log | 738 | 408 kB | 2026-08-05 |
| rate_limits | 485 | 328 kB | 2026-08-09 |
| articles | 133 | 1 312 kB | 2026-05-15 |
| profiles | 92 | 504 kB | 2026-07-23 |
| consent_history | 53 | 80 kB | 2026-07-23 |
| ai_usage_logs | 50 | 64 kB | 2026-08-09 |
| user_milestones | 33 | 72 kB | 2026-06-07 |
| consultant_participants | 31 | 80 kB | — |
| sta_enrollments | 31 | 120 kB | 2026-05-28 |
| article_reading_progress | 30 | 112 kB | — |
| cvs | 26 | 296 kB | 2026-08-05 |
| saved_jobs | 26 | 408 kB | 2026-07-27 |
| application_history | 24 | 80 kB | 2026-07-27 |
| interest_guide_progress | 22 | 168 kB | — |
| unified_profiles | 22 | 104 kB | 2026-08-05 |
| milestones | 21 | 64 kB | 2026-03-16 |
| exercise_answers | 20 | 304 kB | 2026-05-04 |
| invitations | 20 | 272 kB | 2026-05-23 |
| user_gamification | 20 | 88 kB | **2026-08-09** (`updated_at`) |
| courses | 19 | 160 kB | 2026-03-09 |
| consultant_consents | 18 | 176 kB | 2026-05-23 |
| achievements | 15 | 96 kB | 2026-03-22 |
| writing_prompts | 15 | 32 kB | 2026-03-17 |
| dashboard_preferences | 14 | 104 kB | 2026-03-10 |
| sta_pulse_checks | 14 | 80 kB | 2026-05-28 |
| cv_versions | 11 | 128 kB | 2026-08-05 |
| user_preferences | 11 | 64 kB | 2026-08-05 |
| interest_guide_history | 10 | 104 kB | 2026-07-23 |
| admin_audit_log | 9 | 80 kB | 2026-07-23 |
| article_checklists | 9 | 80 kB | — |
| ai_team_sessions | 8–10 | 248 kB | 2026-08-09 |
| career_milestones | 8 | 104 kB | 2026-07-23 |
| profile_skills | 7 | 64 kB | 2026-07-02 |
| cv_shares | 6 | 64 kB | 2026-05-10 |
| cover_letters | 5 | 184 kB | 2026-07-02 |
| mood_logs | 4 | 80 kB | 2026-07-27 |
| sta_quick_notes | 4 | 64 kB | 2026-05-28 |
| sta_documents | 3 | 64 kB | 2026-05-24 |
| calendar_events | 2 | 96 kB | 2026-04-11 |
| career_plans | 2 | 88 kB | 2026-07-23 |
| consultant_messages | 2 | 80 kB | 2026-04-30 |
| skills_analyses | 2 | 64 kB | 2026-07-23 |
| sta_activities | 2 | 80 kB | 2026-05-28 |
| account_deletion_requests | 1 | 48 kB | — |
| article_bookmarks | 1 | 80 kB | 2026-03-06 |
| consultant_goal_templates | 1 | 80 kB | 2026-06-10 |
| consultant_requests | 1 | 48 kB | 2026-04-12 |
| data_sharing_audit | 1 | 32 kB | 2026-07-28 |
| diary_entries | 1 | 104 kB | 2026-07-27 |
| diary_streaks | 1 | 56 kB | — |
| interest_results | 1 | 64 kB | — |
| participant_data_sharing | 1 | 88 kB | — |
| spontaneous_companies | 1 | 80 kB | 2026-04-08 |
| user_adaptations | 1 | 48 kB | 2026-07-10 |
| visibility_settings | 1 | 48 kB | 2026-04-17 |

### Tomma tabeller (77 av 132)

```
application_contacts · application_reminders · application_templates · article_categories
article_course_links · audit_logs · calendar_goals · calendar_mood_entries · career_paths
consultant_goals · consultant_job_collections · consultant_journal · consultant_meetings
consultant_notes · consultant_placements · consultant_settings · content_calendar
course_recommendations · cv_analyses · daily_tasks · data_export_logs · elevator_pitches
email_notifications · email_queue · exercise_categories · exercise_questions · exercise_steps
exercises · favorite_occupations · gratitude_entries · interview_sessions · job_alerts
job_applications · job_interest_matches · job_notifications · journal_entries
learning_activities · login_attempts · mood_history · network_contacts · networking_events
notification_preferences · notification_settings · notifications · personal_brand_audit
personal_brand_audits · platsbanken_saved_jobs · platsbanken_saved_searches · portfolio_items
profile_documents · profile_history · profile_shares · quests · relocation_preferences
salary_searches · saved_educations · shared_jobs · shared_resources · sta_absences
sta_assessments · sta_weekly_checkins · sta_workplace_followups · sta_workplaces
user_achievements · user_activities · user_certifications · user_credentials · user_drafts
user_goals · user_interests · user_learning_paths · user_notifications · user_sessions
user_skills · user_streaks · visibility_progress · weekly_goals
```

Bilden är i allt väsentligt densamma som 2026-08-04 (som räknade 73). Skillnaden är att jag
räknat med `count(*)` på samtliga 132 och att inga tabellstädningar skett sedan dess.

### Användarunderlaget (kontext för allt ovan)

```
auth.users 92 · profiles 92 · noll föräldralösa åt något håll
aldrig inloggade: 20   (= antalet invitations, alla utgångna)
inloggade senaste 30 dygn: 5
roller: USER 89 · CONSULTANT 2 · SUPERADMIN 1
active_role: USER 60 · SUPERADMIN 1 · NULL 31
```

**Portalen har fem aktiva användare.** Varje "0 rader" nedan ska läsas mot det talet —
en tom tabell bevisar inte att kodvägen är trasig. Där jag påstår att den *är* trasig
finns ett separat bevis.

---

## 2. Fynd

### F1 — KRITISK: ingen schemaläggare finns någonstans i systemet

**Bevis (tre oberoende negativ).**
```sql
select count(*) from pg_extension where extname='pg_cron';                    -- 0
select count(*) from pg_class where relname='job' and relnamespace=
  (select oid from pg_namespace where nspname='cron');                        -- 0
```
```
$ grep -n '"crons"' client/vercel.json          → ingen träff
$ grep -rn "schedule:\|cron:" .github/workflows/*.yml  → ingen träff
```
`client/api/job-alerts.js` är byggd som en cron-endpoint (`isCron`-gate på `CRON_SECRET`,
`client/api/job-alerts.js:56-66`, `:481`, `:588`) — men ingen schemaläggare anropar den.
`supabase/functions/send-inactivity-warning` köar mot `email_queue` (0 rader) och har
noll anropare i `client/src` eller `client/api`.

**Konsekvens, mätt:** `job_alerts` 0 · `job_notifications` 0 · `email_queue` 0 ·
`email_notifications` 0. `ai_usage_logs` äldsta rad **2026-04-08 (122 dagar)** mot en
90-dagarspolicy. `rate_limits` äldsta rad **2026-04-25 (107 dagar)** mot ett dygns policy.

**Jämfört med 2026-08-04:** oförändrat. M1/H11 står kvar, fem dagar senare.

**Åtgärd.** Aktivera pg_cron **eller** lägg `crons` i `client/vercel.json` (endpointen och
dess secret finns redan) **eller** stryk automatikpåståendena ur `RETENTION-POLICY.md` och
Art 30. Beslutet är Mikaels (A6). **Storlek: M**

---

### F2 — HÖG: `lint:schema` läser inte kolumnnycklar i `insert`/`update`/`upsert` — fyra skarpa buggar gömmer sig där

**Premissen som inte höll.** Grinden **täcker** edge-funktionerna — `SCAN_DIRS` i
`client/scripts/check-schema-drift.cjs:49-54` inkluderar `supabase/functions` och `api`,
och den kontrollerade 722 filer i dag. Det är alltså inte där luckan sitter.

Luckan är uttalad i skriptets eget huvud (`check-schema-drift.cjs:32-40`):
> *"Kolumner i `.insert()/.update()`-objekt kontrolleras inte (kräver riktig AST-parsning…)"*

Jag skrev en egen kontroll av precis det (balanserad `{}`-parsning, toppnivånycklar,
samma snapshot). Utfall: **12 träffar, varav 4 äkta buggar** (2 är parsartefakter från
mallsträngar, 6 är samma `calendar_events`-anrop).

| Fil:rad | Tabell.kolumn | Finns? | Fynd |
|---------|---------------|--------|------|
| `client/src/components/ai-team/AgentChat.tsx:323` | `calendar_events.event_type/start_time/status/is_all_day/metadata` | ❌ ×5 | F3 |
| `supabase/functions/ai-cv-writing/index.ts:161` | `ai_usage_logs.feature`, `.content_type` | ❌ ×2 | F4 |
| `client/api/job-alerts.js:385` | `user_notifications.read` | ❌ (heter `is_read`) | F5 |
| `client/src/services/notificationsService.ts:181` | `job_alerts.last_checked`, `.last_job_id` | ❌ (heter `last_checked_at` / finns ej) | F5 |

**Åtgärd.** Utöka `check-schema-drift.cjs` med en `insert/update/upsert`-nyckelkontroll.
Balanserad `{}`-parsning räcker; spread (`...updates`) och dynamiska nycklar hoppas över
precis som dynamiska tabellnamn redan gör. Skriptet jag använde ligger inte i repot —
det är ~50 rader och kan lyftas in i grinden. **Storlek: M**

---

### F3 — HÖG: AI-teamets "skapa uppgift i kalendern" kan strukturellt aldrig lyckas

**Bevis.**
```ts
// client/src/components/ai-team/AgentChat.tsx:322-337
.from('calendar_events')
.insert({
  user_id: user?.id,
  title: `AI Team: ${title}`,
  description: content,
  event_type: 'task',                 // ← finns inte
  start_time: new Date().toISOString(),// ← finns inte
  end_time: …,                         // finns (men är `time`, inte timestamptz)
  status: 'pending',                   // ← finns inte
  is_all_day: false,                   // ← finns inte
  metadata: { … },                     // ← finns inte
})
if (!error) { setTaskSuccess(…) }      // fel sväljs helt
```
`information_schema.columns` för `calendar_events`: kolumnerna heter `date` (**NOT NULL,
inget default**), `time`, `type`, `end_time` (`time without time zone`). Insertet saknar
alltså `date` **och** skickar fem okända kolumner. PostgREST svarar 400 varje gång.

**Monterad?** Ja. `AgentChat` renderas av `client/src/pages/AITeam.tsx:12,48`, och
`handleCreateTask` är kopplad till en knapp per meddelande (`AgentChat.tsx:488`
`onCreateTask={handleCreateTask}`). AI-team ligger i Resurser-hubben och är live.

**Vad användaren ser i stället för sanningen.** Deltagaren ber AI-coachen om en plan,
klickar "lägg i kalendern" — och ingenting händer. Ingen bekräftelse, inget felmeddelande,
ingen rad. `calendar_events` har 2 rader, senast skriven 2026-04-11.

**Åtgärd.** Mappa till de verkliga kolumnerna (`date`, `time`, `type`) och visa fel i UI:t
i stället för `if (!error)`. **Storlek: S**

---

### F4 — MEDEL: `ai-cv-writing` loggar mot två kolumner som inte finns (edge-funktion)

**Bevis.**
```ts
// supabase/functions/ai-cv-writing/index.ts:161-168
await supabase.from('ai_usage_logs').insert({
  user_id: user.id, function_name: 'cv-writing',
  feature,                 // ← finns inte
  content_type: type,      // ← finns inte
  tokens_used: …, created_at: …
})
```
`ai_usage_logs` har: `cost_estimate, created_at, duration_ms, error_message, function_name,
id, model, success, tokens_used, user_id`. Insertet ligger i `try { } catch { console.log }`
— tyst i dubbel bemärkelse.

**Bonusfynd:** `ai-cv-writing` har **noll anropare** i `client/src`/`client/api`. Det gäller
13 av 24 edge-funktioner (`af-enrichments`, `af-historical`, `af-jobsearch`, `af-trends`,
`ai-assistant`, `ai-cover-letter`, `ai-cv-writing`, `cv-analysis`, `health`,
`learning-analyze-gap`, `learning-progress`, `learning-recommend`, `send-inactivity-warning`).
De 11 anropade: `af-jobed`, `af-taxonomy`, `ai-career-assistant`, `ai-commute-planner`,
`ai-company-analysis`, `ai-company-search`, `ai-industry-radar`, `bolagsverket`,
`delete-account`, `education-search`, `send-invite-email`. (`health` anropas rimligen av
CI:s smoke-test — **obekräftat**.)

**Åtgärd.** Ta bort de två nycklarna, eller lägg till kolumnerna om de behövs. Funktionens
öde hör till arkitekturspåret. **Storlek: S**

---

### F5 — LÅG: två kolumnbuggar till, i halvdöda vägar

**Bevis 1** — `client/api/job-alerts.js:385-391` (fallback när e-postloggningen misslyckas):
```js
await supabase.from('user_notifications').insert({
  type: 'job_alert', title: subject, message: …,
  read: false,               // ← kolumnen heter is_read
  created_at: …
})                            // dessutom: user_id saknas helt (NOT NULL + FK)
```
**Bevis 2** — `client/src/services/notificationsService.ts:178-184`:
```ts
.from('job_alerts').update({ ...updates,
  last_checked: updates.lastChecked,   // ← heter last_checked_at
  last_job_id: updates.lastJobId,      // ← finns inte
  employment_type: updates.employmentType })
```
Felet sväljs och faller tillbaka på localStorage (`:186-195`).

**Varför bara LÅG:** `notificationsService` importeras enbart av
`client/src/components/NotificationsCenter.tsx`, som ingen sida monterar (bekräftar SD2
från 2026-08-04). `job-alerts.js`-vägen kan inte köras alls (F1). Men båda är fällor för
den som lagar aviseringarna. **Storlek: S**

---

### F6 — HÖG: migrationsliggaren i prod är osann

**Bevis.**
```sql
select count(*) from supabase_migrations.schema_migrations;   -- 57
```
Mot **132 `.sql`-filer** i `supabase/migrations/`. Liggaren slutar vid
`20260416100000_ai_team_sessions` — allt efter 16 april (≈75 filer) är kört manuellt med
`db query --linked` utan att registreras.

Värre än ofullständig — **den påstår saker som inte stämmer**:

| Registrerad version | Påstår | Verklighet i prod |
|---------------------|--------|-------------------|
| `20260412120000_interview_recordings` | applicerad | `interview_recordings` **finns inte** (H6 valde medvetet att inte skapa den) |
| `20260412110000_job_notifications` | applicerad | tabellen fanns inte förrän `20260727120000` skapade om den ur samma DDL, 3,5 månader senare |

**Varför det spelar roll.** `supabase migration list` och `supabase db push` läser den här
tabellen. I dag skulle en push försöka köra ~75 migrationer på nytt och hoppa över två som
aldrig gav sina objekt. CLAUDE.md varnar redan för `db push` — det här är förklaringen till
*varför*, och den är inte skriven någonstans.

**Åtgärd.** Antingen (a) stäm av liggaren mot verkligheten
(`insert into supabase_migrations.schema_migrations` för allt som faktiskt är kört — DDL-fri
operation men fortfarande en skrivning, kräver Mikaels ja), eller (b) skriv i
`MIGRATION_NOTES.md` att liggaren är övergiven och att snapshoten är sanningen.
Halvvägs är farligast. **Storlek: S (dokumentera) / M (stäm av)**

---

### F7 — MEDEL: `RETENTION-POLICY.md` markerar rate-limit-gallringen ✅ — den sker inte

**Bevis.** `docs/RETENTION-POLICY.md:47`:
> `| **Rate-limit-records** | 24h rolling window | Auto-rensa via Supabase RPC | ✅ |`

```
rate_limits: 485 rader · 475 äldre än 1 dygn · äldsta 2026-04-25 (107 dagar)
check_rate_limit innehåller DELETE:  NEJ
cleanup_rate_limits: finns som funktion, noll .rpc()-anropare i hela repot
```
`api/_utils/rate-limiter.js:61` anropar bara `check_rate_limit`.

Detta är samma klass som de tre fel H7 rättade 2026-07-27 — ett dokument som säger att en
gallring är automatisk när den inte är det. Skillnaden är att den här står kvar med ✅.

**Åtgärd.** Ändra ✅ → ❌ i policyn, eller kalla `cleanup_rate_limits` från
`rate-limiter.js` (billigast: var N:te anrop). **Storlek: S**

---

### F8 — LÅG: loggar och inbjudningar överlever sin policy

**Bevis.**

| Data | Policy | Verklighet |
|------|--------|------------|
| `ai_usage_logs` | 90 dagar | 5 rader äldre; äldsta 122 dagar |
| `user_activity_log` | 12 månader | 486 av 738 äldre än 90 dagar; äldsta 2026-03-17 — inom policyn, men innehåller `metadata` jsonb per handling |
| `invitations` | 90 dagar efter utgång | 20 av 20 utgångna, alla kvar, alla med **e-postadress** till personer som aldrig loggat in |

Inbjudningarna är den enda posten här med ett GDPR-hörn: 20 e-postadresser till personer
som inte är användare, bevarade utan gallring. Jag går inte längre in i det — det hör till
säkerhets-/GDPR-agentens område. **Storlek: S**

---

### F9 — HÖG: "avklarade artiklar" räknas på en `.limit(3)`-skiva

**Bevis.**
```ts
// client/src/hooks/useResurserHubSummary.ts:36-42
supabase.from('article_reading_progress')
  .select('article_id, progress_percent, is_completed, completed_at')
  .eq('user_id', userId).order('completed_at', {…}).limit(3),
…
// :51
const articleCompletedCount = articles.filter(a => a.is_completed).length
```
Prod:
```
eef3d71f…: 22 rader / 8 avklarade
54503e19…:  3 / 0     5b0904ac…: 2 / 0
5fd553f4…:  1 / 1     8d145104…: 1 / 1     695f3336…: 1 / 0
```
Användaren med 8 avklarade artiklar får `articleCompletedCount = 3`. Räknaren har ett tak
på 3 och kan aldrig visa mer, hur mycket deltagaren än läser.

**Varför det biter extra här.** Kunskapsbanken är den yta där en långtidsarbetslös
deltagare faktiskt bygger på sig något mätbart. Att taket är tre gör framsteget osynligt
precis när det börjar bli något att vara stolt över.

**Åtgärd.** Separat `select('id', { count: 'exact', head: true }).eq('is_completed', true)`
— exakt det mönster `useMinVardagHubSummary.ts:34,55` redan använder korrekt för dagbok och
nätverk. **Storlek: S**

---

### F10 — LÅG: "antal AI-team-sessioner" räknas på en `.limit(5)`-skiva

**Bevis.** `client/src/hooks/useResurserHubSummary.ts:47` `.limit(5)` → `:60`
`aiTeamSessionCount: aiSessions.length`. Prod: mest aktiva användare har **exakt 5**
sessioner. Räknaren är alltså rätt i dag och blir fel vid nästa session. Samma rotorsak
som F9. **Storlek: S** (fixas i samma ändring)

---

### F11 — HÖG: konsulentens "senaste inloggning" är `profiles.updated_at`

**Bevis.** `pg_get_viewdef('consultant_dashboard_participants')`, sista raden:
```sql
p.updated_at AS last_login
```
`profiles.updated_at` sätts av triggern `update_profiles_updated_at` vid **varje**
profiländring — inte vid inloggning. Den riktiga uppgiften finns i
`auth.users.last_sign_in_at`.

```
31 deltagare · 27 avviker mellan vy och verklighet · största avvikelse 74 dagar
exempel: e903aba0  vy=2026-05-23  verklig inloggning=2026-04-12
         841d6aaa  vy=2026-06-15  verklig inloggning=2026-05-19
```

**Vad kolumnen driver.** Inte pynt — beslut:
- `client/src/pages/consultant/AnalyticsTab.tsx:386` — flaggar deltagare som inaktiva >21 dagar
- `client/src/pages/consultant/OverviewTab.tsx:380` — flaggar >14 dagar
- `AnalyticsTab.tsx:345,430,627,635` — "aktiva senaste 7/30 dagarna"

**Ärlig avgränsning:** vid dagens trösklar blir **0 av 31** felklassade, eftersom samtliga
är inaktiva långt bortom både 14 och 21 dagar. Felet är alltså latent i dag och blir synligt
så snart portalen har trafik — vilket är precis när konsulenten börjar lita på listan.

**Åtgärd.** Lägg `last_sign_in_at` i vyn (kräver att vyn får läsa `auth.users` — enklast via
en `SECURITY DEFINER`-funktion eller en kolumn på `profiles` som `update_last_login`-RPC:n
redan är byggd för; den funktionen finns men har noll anropare). **Storlek: M**

---

### F12 — MEDEL: `notes_count` räknar en tom tabell medan anteckningarna ligger någon annanstans

**Bevis.** Vyn gör två saker med ordet "notes":
```sql
cp.notes AS consultant_notes,                                  -- deltagarens anteckningstext
COALESCE((select count(*) from consultant_notes
          where consultant_notes.participant_id = p.id), 0) AS notes_count,
(select max(created_at) from consultant_notes …) AS last_note_date
```
Prod: `consultant_notes` = **0 rader**. `consultant_participants.notes` är ifylld för
**30 av 31** deltagare.

Konsument: `client/src/components/consultant/ParticipantList.tsx:32,138` visar `notes_count`
som en siffra i deltagarlistan → alltid **0**, för alla, trots att anteckningen finns och
visas i samma vy under ett annat namn.

**Åtgärd.** Antingen räkna på `cp.notes` (`case when cp.notes <> '' then 1 else 0 end`) eller
migrera anteckningarna till `consultant_notes` och skriv dit i fortsättningen. Det senare är
rätt datamodell (flera anteckningar över tid), det förra är en rad SQL. **Storlek: S/M**

---

### F13 — MEDEL: "har gjort intressetestet" läser fel tabell

**Bevis.** Vyn: `LEFT JOIN interest_results ir ON ir.user_id = p.id` → `completed_interest_test`
och `holland_code`.

```
interest_results:        1 rad,  1 användare
interest_guide_history: 10 rader, 8 användare
av konsulentens 31 deltagare: 4 har resultat i history, 0 i interest_results
```
Konsulentvyn visar alltså "har inte gjort intressetestet" för **samtliga** deltagare, medan
fyra har gjort det. Konsumenter: `client/src/components/consultant/ParticipantList.tsx:29`.

Detta är samma buggfamilj som H4 (`MyConsultant` läste `wellness_entries`) och H5
(`journey_goals`) — fast den här gången i en **vy**, dit `lint:schema` inte når: vyn är
giltig SQL mot existerande tabeller, den läser bara fel av de två.

**Åtgärd.** Peka vyn på `interest_guide_history` (eller på båda med `COALESCE`), och avgör
om `interest_results` ska avvecklas — den har en enda rad och en avvikande JSONB-form
(`recommended_jobs` = array av **strängar**, medan `top_occupations` är array av **objekt**;
JS3 från 2026-08-04 bekräftas). **Storlek: S**

---

### F14 — MEDEL: `averageAtsScore` är ett fabricerat nollvärde

**Bevis.**
```sql
select count(*) from cvs where ats_score is not null;      -- 0 av 26
select count(*) from cvs where ats_feedback is not null;   -- 0 av 26
```
```ts
// client/src/services/consultantService.ts:530-531
const avgAts = Math.round(
  participantList.reduce((sum, p) => sum + (p.ats_score || 0), 0) / Math.max(total, 1))
// :584  averageAtsScore: avgAts
```
`|| 0` gör att en kolumn som aldrig fyllts blir siffran **0**, presenterad som ett
genomsnittligt ATS-poäng. Ingenting i portalen skriver `ats_score` — de 26 CV:na har
alla NULL.

Detta är spår B-klassen ("UI visar något annat än vad som hände") i konsulentvyn, och
samma familj som `analyzeBehavior` i SD4 (2026-08-04).

**Åtgärd.** Visa "—" när inget CV har poäng, eller ta bort nyckeltalet tills ATS-analysen
faktiskt skriver till kolumnen. **Storlek: S**

---

### F15 — LÅG: `saved_jobs_count` i vyn räknar hela pipelinen

**Bevis.** Vyn: `select count(*) from saved_jobs where saved_jobs.user_id = p.id` — utan
statusfilter. Prod per användare:
```
eef3d71f: SAVED=6 APPLIED=1   → vyn visar 7 "sparade jobb"
5b0904ac: SAVED=2 INTERESTED=2 APPLIED=1 → vyn visar 5
f47f6258: SAVED=1 APPLIED=1   → vyn visar 2
```
Exakt den bugg H4 lagade i `MyConsultant` 2026-07-27 (`saved + interested`) — men vyn som
konsulenten faktiskt tittar på fick aldrig samma rättelse. Konsumenter:
`ParticipantList.tsx:133,207`, `GoalCreationDialog.tsx:229,254,405` (där `< 5 sparade jobb`
dessutom **styr vilket mål som föreslås**), `AnalyticsTab.tsx:452`.

**Åtgärd.** Lägg `where status in ('SAVED','INTERESTED')` i vyn. **Storlek: S**

---

### F16 — LÅG: `profiles.status` är ACTIVE för 92 av 92 — två nyckeltal är därmed konstanter

**Bevis.**
```sql
select status, count(*) from profiles group by 1;   -- ACTIVE = 92
```
```ts
// consultantService.ts:527-528
const active    = participantList.filter(p => p.status === 'ACTIVE').length
const completed = participantList.filter(p => p.status === 'COMPLETED').length
```
`activeParticipants` är alltid lika med `totalParticipants`, `completedParticipants` alltid 0.
Ingen kodväg sätter någonsin `status` till något annat.

**Åtgärd.** Antingen gör statusen skrivbar från konsulentvyn (den saknas i UI:t i dag), eller
sluta visa två nyckeltal som per konstruktion är `n` och `0`. **Storlek: S**

---

### F17 — MEDEL: 91 av 92 profiler har `ai_enabled = true`, men bara 18 har `ai_consent_at`

**Bevis.**
```
ai_enabled = true        : 91
ai_consent_at satt       : 18
terms_accepted_at satt   : 17
privacy: 17 granted (consent_history)
wellness_consent_at satt : 2      health_consent_at satt : 1
marketing_consent_at satt: 0
```
Triggern `trg_sync_ai_enabled` (`sync_ai_enabled_on_consent_withdrawal`) synkar bara vid
**återkallande** — den skapar aldrig kopplingen åt andra hållet. `ai_enabled` har alltså i
praktiken defaultat till `true` för 73 användare utan registrerat samtycke.

**Relaterat fynd i samma familj:** 1 av 4 rader i `mood_logs` kommer från en användare utan
`wellness_consent_at`. Raden är äldre än art. 9-grinden (UX11, fail closed, 2026-08-03) —
grinden hindrar nya, men den gamla raden ligger kvar.

Jag går inte in i den rättsliga bedömningen (säkerhets-/GDPR-agentens område). Som
**dataintegritetsfynd** är det entydigt: två kolumner som ska beskriva samma sak är osams i
73 av 92 rader.

**Åtgärd.** Bestäm vilken kolumn som är sanningen och härled den andra. Om `ai_consent_at`
är sanningen behöver `ai_enabled` sättas om för de 73. **Storlek: S (beslut) / M (backfill)**

---

### F18 — MEDEL: G9 tog bort poängmaskineriet i klienten — det lever kvar i RPC:n

**Bevis.** `hooks/useAchievementTracker.ts` (filhuvudet) förklarar G9-beslutet: *"sluta logga
det osynliga"*, `updateMilestonesForActivity` och `getActivityCount` raderade, punkterna
beskrivs som *"en kolumn i loggen, inte en synlig poängställning"*.

Men RPC:n gör mer än att skriva en kolumn:
```sql
-- public.log_user_activity, kropp hämtad ur pg_get_functiondef
INSERT INTO user_activity_log (…) VALUES (…);
IF p_points > 0 THEN
  INSERT INTO user_gamification (user_id, total_points, current_streak, level)
  VALUES (p_user_id, p_points, 0, 1)
  ON CONFLICT (user_id) DO UPDATE
    SET total_points = user_gamification.total_points + p_points, updated_at = NOW();
END IF;
```
```
user_gamification: 20 rader, senast uppdaterad 2026-08-09 14:58:50
Träffar på namnet i client/src, client/api, api, supabase/functions: 1
  — och den är en kommentar: useAchievementTracker.ts:11 ("INGET i klienten läser
    user_gamification"). Noll .from(), noll läsare.
```
Poäng ackumuleras alltså fortfarande, i dag, i en tabell som ingenting läser. Det är exakt
den kostnad G9 ville ta bort — bara ett lager längre ner än där man tittade.

**Åtgärd.** Ta bort `IF p_points > 0`-blocket ur RPC:n (migration), eller sluta skicka
`points` från `useAchievementTracker`. Det senare kräver ingen DDL. **Storlek: S**

---

### F19 — MEDEL: samtyckesloggen har slutat skrivas

**Bevis.**
```
consent_history: 53 rader · 17 av 92 användare · 2026-04-09 .. 2026-07-23
typer: terms(17 granted/1 withdrawn) · privacy(17/1) · ai_processing(15/1) · marketing(0/1)
       — inga wellness-, health- eller consultant-typer
```
Skrivarna är SQL-funktionerna `grant_consent` / `withdraw_consent`
(`supabase/migrations/20260327100000_user_consent.sql:131-206`). **Båda har noll
`.rpc()`-anropare** i `client/src`, `client/api`, `api` och `supabase/functions` — jag har
sökt hela repot; enda träffarna på `consent_history` utanför migrationer och snapshot är
dokumentfiler.

Dagens samtycken skrivs i stället direkt som tidsstämplar på `profiles`
(`ai_consent_at`, `wellness_consent_at`, `health_consent_at`, …). Det ger **nuläge men
ingen historik**: ett återkallat och åternämnt samtycke lämnar inget spår, och art. 9-
samtyckena (wellness/health) finns inte i loggen alls.

**Åtgärd.** Antingen anropa `grant_consent`/`withdraw_consent` från samtyckesflödet och lägg
till `wellness`/`health` som typer, eller lägg en trigger på `profiles` som skriver
`consent_history` när någon `*_consent_at` ändras. Det senare är svårare att glömma.
**Storlek: M**

---

### F20 — LÅG: tomma CV-skal räknas som "har CV"

**Bevis.**
```
cvs = 26.  skills tom/null: 9   work_experience tom/null: 9
           education tom/null: 10   languages tom/null: 8
```
Vyns `has_cv` är `CASE WHEN c.id IS NOT NULL THEN true` → sant även för ett CV utan en enda
rad innehåll. `consultantService.ts:583` `cvCompletionRate` bygger på just `has_cv`.

**Positivt sidofynd i samma mätning:** `cvs.skills` är `array` av `object` i **17 av 17**
icke-tomma CV:n; samma för `work_experience`, `education`, `languages`. Ingen legacy-
strängform ligger kvar i prod — 2026-08-03-lärdomen om `cvOptimizer.ts` står sig och
JS2 bekräftas ett halvår senare. Övriga JSONB-former är också stabila:
`saved_jobs.job_data` object ×26, `cv_versions.data` object ×11,
`ai_team_sessions.messages` array-av-object ×10, `skills_analyses.skills_comparison`
array-av-object ×2, `user_preferences.dashboard_widgets` array-av-string ×11.
Enda avvikaren är `interest_results.recommended_jobs` (array av string) mot
`interest_guide_history.top_occupations` (array av object) — se F13.

**Åtgärd.** Låt `has_cv` kräva innehåll, t.ex. `jsonb_array_length(c.work_experience) > 0
OR jsonb_array_length(c.skills) > 0`. **Storlek: S**

---

### F21 — LÅG: fyra formavvikelser i levande data

**Bevis.**

| Fynd | Mätning |
|------|---------|
| `article_reading_progress.is_completed` = true medan `progress_percent` = 0 | 6 rader |
| `article_reading_progress.article_id` pekar på artikel som inte finns (varken `slug` eller `id`) | 2 rader |
| `exercise_answers.exercise_uuid` = NULL | **20 av 20** — FK-kolumnen används aldrig; svaren kan aldrig kopplas till en övning |
| `profiles` utan rad i `user_preferences` | **81 av 92** — inställningar (inkl. `job_alert_email_enabled`) existerar bara för 12 % av användarna |
| `unified_profiles` (22) mot `cvs` (26) | 4 CV:n har ingen unified-profil trots triggern `cv_to_unified_profile_trigger` |
| `profiles.career_goals` = `{}` | 91 av 92 (bekräftar JS1/H15) |
| `unified_profiles.career_goals` = `{}` | 21 av 22 |
| `profiles.first_name` tom/NULL | 28 av 92 |
| `profiles.active_role` NULL | 31 av 92 |

Inga föräldralösa rader hittades: `profiles` ↔ `auth.users` stämmer 92/92 åt båda håll,
och `saved_jobs` har noll rader utan giltig ägare.

**Åtgärd.** `exercise_uuid` och `article_id` bör antingen få FK/backfill eller strykas ur
schemat. `user_preferences` bör skapas vid signup (RPC:n `get_or_create_user_preferences`
finns redan och har noll anropare). **Storlek: S–M**

---

### F22 — MEDEL: tre FK-regler kan blockera kontoradering, och en revisionstabell saknar FK helt

**Bevis** (`pg_constraint.confdeltype`, alla FK mot `profiles`/`auth.users`):

| Tabell.kolumn | Regel | Rader | Konsekvens |
|---------------|-------|------:|------------|
| `sta_enrollments.consultant_id` | **RESTRICT** (`r`) | 31 | Radering av en konsulents konto **failar** |
| `audit_logs.user_id` | **NO ACTION** (`a`) | 0 | Blockerar så snart tabellen får rader (`consultantService.ts:182` skriver dit) |
| `sta_workplace_followups.consultant_id` | **NO ACTION** (`a`) | 0 | Samma |
| `data_sharing_audit.consultant_id`, `.participant_id` | **ingen FK alls** | 1 | Föräldralösa rader kan uppstå tyst |
| `ai_usage_logs.user_id`, `data_export_logs.user_id`, `profiles.consultant_id` | SET NULL (`n`) | — | ✅ medvetet: anonymiserar i stället för att radera |
| Övriga 110 FK | CASCADE (`c`) | — | ✅ |

`supabase/functions/delete-account` rör bara `profiles` — den förlitar sig alltså helt på
CASCADE-kedjan. Med två konsulentkonton i prod och 31 `sta_enrollments` är
RESTRICT-regeln inte teoretisk.

Alla 132 tabeller har primärnyckel. Nio saknar FK helt (`achievements`, `article_categories`,
`courses`, `data_sharing_audit`, `email_notifications`, `exercise_categories`,
`login_attempts`, `rate_limits`, `writing_prompts`) — åtta av dem med rätta (referensdata
eller service-role-loggar), `data_sharing_audit` är undantaget.

**Åtgärd.** Byt `sta_enrollments.consultant_id` till `SET NULL` (enrollment ska överleva att
konsulenten slutar), sätt `audit_logs`/`sta_workplace_followups` till `SET NULL`, och lägg
FK på `data_sharing_audit`. Kräver migration → Mikaels ja. **Storlek: M**

---

### F23 — LÅG: 246 av 457 index har noll scans; 15 FK-kolumner med data saknar index

**Bevis.**
```
index totalt: 457 · aldrig använda (idx_scan = 0): 246 · varav på icke-tom tabell: 84
bortkastad yta: 2 800 kB    databas: 29 MB    statistik nollställd: 2025-12-08
```
FK-kolumner utan index, på tabeller som har rader:
```
user_milestones.milestone_id (33) · consultant_participants.assigned_by (31)
article_reading_progress.article_uuid (30) · milestones.badge_id (21)
exercise_answers.exercise_uuid (20) · invitations.used_by/consultant_id/invited_by (20)
article_checklists.article_uuid (9) · cv_shares.user_id (6) · sta_quick_notes.author_id (4)
sta_documents.submitted_by (3) · calendar_events.parent_event_id (2)
account_deletion_requests.user_id (1) · consultant_requests.participant_id (1)
```
Vid 2 191 rader totalt är detta **inte** ett prestandaproblem — det är en påminnelse om att
457 index på 132 tabeller är fler index än rader i de flesta tabellerna. `cv_shares.user_id`
är den enda som rimligen filtreras ofta i drift.

**Åtgärd.** Ingen brådska. Vid nästa schemastädning: droppa index på tabeller som ändå
avvecklas, och lägg index på FK-kolumner först när tabellen har volym. **Storlek: S**

---

### F24 — LÅG: 20 schemaobjekt har noll kodreferenser — men bara sex är verklig dödvikt

Nåbarhetsanalys över `client/src`, `client/api`, `api`, `supabase/functions`, `e2e`,
`scripts` (`.from()`, `.rpc()`, samt rå SQL-text). 23 objekt hade noll `.from()`-träff;
efter kontroll av triggrar och RPC:er är bilden:

| Objekt | Rader | Nås via | Bedömning |
|--------|------:|---------|-----------|
| `rate_limits` | 485 | RPC `check_rate_limit` | ✅ levande |
| `user_activity_log` | 738 | RPC `log_user_activity` | ✅ levande |
| `data_sharing_audit` | 1 | trigger `audit_data_sharing_change` | ✅ levande |
| `admin_audit_log` | 9 | SQL-funktioner (rollbyte, kontoradering) | ✅ levande |
| `user_gamification` | 20 | RPC `log_user_activity` (F18) | 🔴 skrivs, ingen läser |
| `consent_history` | 53 | RPC:er utan anropare (F19) | 🔴 frusen sedan 2026-07-23 |
| `user_milestones` / `milestones` / `achievements` / `user_achievements` | 33/21/15/0 | RPC:er utan anropare | 🔴 G9-rester |
| `job_applications` | 0 | — | 🔴 `PENDING_20260728_drop_job_applications.sql` väntar fortfarande |
| `consultant_notes` | 0 | vyn räknar den (F12) | 🔴 fel sida av dubbletten |
| `user_activities` | 0 | — | 🔴 dubblett till `user_activity_log` (H14) |
| `account_deletion_requests` | 1 | ingen (edge-funktionen rör bara `profiles`) | 🟡 innehåller `reason` — fritext från användare |
| `data_export_logs`, `user_sessions`, `login_attempts`, `user_goals`, `user_interests`, `daily_tasks`, `application_templates`, `article_course_links`, `job_interest_matches` | 0 | ingen | 🔴 dödschema |
| Vyerna `user_consent_status`, `user_recommended_courses` | — | ingen | 🔴 dödschema |

**Personuppgifter utan syfte** (nämns här, bedöms av GDPR-agenten): `consent_history` (53
rader, 17 personer, ingen skrivare kvar), `account_deletion_requests.reason` (fritext, ingen
läsare), `invitations` (20 e-postadresser, alla utgångna, ingen gallring — F8), och de 20
`exercise_answers` som inte går att koppla till någon övning (F21).

**Åtgärd.** Kör den väntande droppen på `job_applications`. Ta de övriga i en samlad
städning tillsammans med H8b (`personal_brand_audit` vs `_audits` — **båda fortfarande
tomma**, konsolideringen kostar noll datamigrering). **Storlek: S**

---

## 3. Förbättringsförslag

### 3.1 Så här bör schemaintegriteten upprätthållas

Grinden är bra och den håller det den lovar. Tre kompletteringar, i den ordningen:

1. **Utöka `check-schema-drift.cjs` med `insert/update/upsert`-nycklar** (F2). Det är den
   enda av dagens luckor som bevisligen släppt igenom skarpa buggar — fyra stycken på en
   eftermiddag. Balanserad `{}`-parsning, hoppa över spread och beräknade nycklar.
2. **Låt grinden också läsa vydefinitioner.** F11, F12, F13 och F15 sitter alla i
   `consultant_dashboard_participants`, som är giltig SQL mot existerande objekt och därför
   osynlig för en referenskontroll. Snapshoten kan enkelt bära `pg_get_viewdef` per vy;
   då kan grinden åtminstone larma när en vy pekar på en tabell med noll rader medan en
   syskontabell har data — eller minst göra vydefinitionerna granskbara i repot.
3. **En "räknar-på-en-limit"-lint.** F9 och F10 är samma misstag två gånger i samma fil:
   `.limit(n)` följt av `.length` eller `.filter(...).length` som presenteras som ett antal.
   Det går att fånga med en enkel ESLint-regel eller ett grep-skript i CI.

Dessutom, utanför grinden:

4. **Bestäm migrationsliggarens status** (F6). I dag är den varken sann eller uttalat
   övergiven, vilket är sämre än båda alternativen.
5. **Låt `schema:refresh` köras i CI en gång i veckan** mot prod och öppna ett ärende vid
   diff — i dag upptäcks en glömd `refresh` bara av den som råkar köra grinden efter en
   migration. (Snapshoten var förvisso exakt aktuell i dag; poängen är att det berodde på
   disciplin, inte på mekanik.)

### 3.2 Så här bör datamodellen utvecklas

Portalen vill vara en **följeslagare** som minns vad deltagaren gjort och speglar det
tillbaka. Databasen är i dag byggd som en samling separata verktygs­tabeller. Fyra
riktningar, i prioritetsordning:

**A. En sanning per begrepp — och den ska vara en händelselogg, inte en räknare.**
Portalen har i dag fyra parallella aviseringslager, två aktivitetsloggar, två
personal-brand-tabeller, två måendetabeller och två intressetesttabeller. Varje dubblett
har kostat en bugg (F12, F13, H4, H5, H14, C14). `user_activity_log` (738 rader, den enda
tabellen som fyllts kontinuerligt sedan mars) är den enda strukturen som faktiskt bär
"vad har hänt". Bygg vidare på den: låt hubbarnas "senaste händelse" och konsulentens
aktivitetsbild läsa **en** logg i stället för att var och en räkna om sin egen domän.

**B. Skilj "finns inte" från "kunde inte läsas" i datamodellen, inte bara i koden.**
H16 räknade 96 tysta fel. Rotorsaken är att de flesta tabeller saknar en rad tills
användaren gjort något — så "ingen rad" betyder både "inte börjat" och "gick fel".
`user_preferences` finns för 11 av 92 användare (F21). Skapa rad vid signup för de tabeller
som beskriver *tillstånd* (preferenser, samtycken, onboarding) — då blir en saknad rad ett
riktigt fel som går att larma på, och koden slipper `?? 0`.

**C. Härledda värden ska härledas, inte lagras halvt.**
`ats_score` (NULL i 26 av 26), `profiles.status` (konstant), `user_gamification.total_points`
(skrivs, läses aldrig), `new_jobs_count` på `job_alerts` — alla är kolumner som ska bära ett
mätvärde men inte gör det, och koden fyller luckan med `|| 0`. Antingen fyll dem från en
verklig beräkning, eller ta bort dem och räkna vid läsning. En kolumn som alltid är NULL är
en lögn som väntar på ett `|| 0`.

**D. Modellera relationen deltagare–konsulent som förstklassig, inte som en vy ovanpå
`profiles`.** Konsulentvyns fyra fel (F11–F15) kommer alla ur att
`consultant_dashboard_participants` skarvar ihop deltagardata från fem håll med LEFT JOIN
och `count(*)`-subqueries. Det som saknas är ett *deltagarläge*: senaste inloggning, senaste
egna handling, samtyckesstatus, delningsstatus — uppdaterat av händelseloggen i A. Då blir
konsulentvyn en läsning av en tabell i stället för fem gissningar, och "vem behöver kontakt"
blir en fråga med ett svar.

**E. Låt tomheten få tala.** 77 av 132 tabeller är tomma efter fem månader i drift, och
portalen har fem aktiva användare. Innan datamodellen utvidgas åt något håll bör de
tomma spåren (karriär: 9 tabeller, personal brand: 6, aviseringar: 4, övningar: 4) avgöras —
avveckla eller använd. Varje kvarvarande tom tabell är en rad i Art 30-bilagan, ett objekt i
snapshoten och en plats där nästa utvecklare kan råka skriva.

---

## 4. Vad jag inte hann granska

- **Inloggade UI-flöden i webbläsare.** Ingen Playwright-körning. Alla KPI-fynd (F9–F16) är
  verifierade som *kod + SQL*, inte som *siffra på skärm*. Att `articleCompletedCount` blir 3
  där databasen säger 8 följer av koden; jag har inte sett talet renderas.
- **RLS och behörigheter.** Medvetet utelämnat — säkerhetsagentens område. Jag har bara
  noterat FK/ON DELETE (F22) eftersom det rör kontoradering och dataintegritet.
- **`.insert()`-kontrollen är textanalys, inte AST.** Spread (`...updates`) och beräknade
  nycklar hoppas över, så det kan finnas fler kolumnbuggar än de fyra jag hittade. Två av
  mina 12 träffar var falska positiva (mallsträngar). **Obekräftat: den fullständiga listan.**
- **Rå SQL inne i edge-funktioner** som inte går via `.from()`/`.rpc()` — jag sökte på
  `from|join|into|update|table <namn>` men en `pg` -klient med byggda strängar hade jag inte
  fångat.
- **Varför `job_alerts` har 0 rader.** Kan vara noll användning eller ett trasigt
  skapandeflöde. Kräver testkonto. **Obekräftat** — samma lucka som 2026-08-04 lämnade.
- **De 13 edge-funktionerna utan klientanropare** — jag konstaterade att de saknar anropare
  i `client/src`/`client/api`, men har inte kontrollerat om något externt anropar dem
  (`health` gör CI:s smoke-test rimligen). Deras deployade kod mot `main` är inte verifierad.
- **Kolumnformer på tomma tabeller** — `jsonb_typeof` på noll rader ger inget svar.
- **`pg_stat_statements`** finns installerad men jag har inte läst den; den hade kunnat visa
  vilka frågor som faktiskt körs i drift, och därmed avgöra F23 på riktigt i stället för via
  `idx_scan`.
