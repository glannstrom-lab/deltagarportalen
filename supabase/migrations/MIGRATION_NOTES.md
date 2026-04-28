# Migrations — kända konflikter och konsoliderings-noter

**Senast uppdaterad:** 2026-04-28
**Källa:** Verifierat mot prod-DB via `npx supabase db query --linked`

Detta dokument beskriver migrations som ser konflikt-aktiga ut i historiken
men där prod-DB är i ett bestämt, korrekt tillstånd. Vid fresh setup går
allt igenom rätt eftersom `IF NOT EXISTS`-mönstret används genomgående.

---

## 1. Dubbel timestamp `20260306130000`

**Filer:**
- `20260306130000_fix_all_rls_and_tables.sql` (215 rader)
- `20260306130000_fix_all_rls_policies.sql` (465 rader)

**Status:** Båda är idempotenta (DROP POLICY IF EXISTS + CREATE POLICY,
ALTER TABLE IF EXISTS). Ordning spelar ingen roll. Live-DB har båda
effekter applicerade.

**Risk:** Vid fresh setup tar Supabase CLI dem alfabetiskt — `_and_tables`
körs före `_policies`. Detta är fortfarande korrekt.

**Åtgärd:** Behåll båda. Vid nästa större migration-konsolidering, slå
ihop till en enda tydligare fil med datum (t.ex. `20260306130001_consolidated_rls.sql`).

---

## 2. invitations-trippel (007 / 010 / 20260408120000)

**Filer som CREATE TABLE invitations:**
- `007_consultant_dashboard.sql` — gammalt schema (id, email, role, status, metadata)
- `010_invitations_table.sql` — **nuvarande sanning** (email-tracking, used_at, used_by)
- `20260408120000_fix_signup_trigger.sql` — `CREATE TABLE IF NOT EXISTS` no-op

**Verifierat live-schema (2026-04-28):**
```
id, email, token, role, invited_by, consultant_id, metadata,
email_sent, email_sent_at, email_error, used_at, used_by,
expires_at, created_at, updated_at
```

**Konsekvens:** 010 har "vunnit" i prod via körningsordning. 007 är
no-op vid `IF NOT EXISTS`-tjeck. Inget akut.

**Åtgärd:** Varningskommentar tillagd i 007. Vid behov av nya kolumner —
skriv en separat ALTER-migration, modifiera INTE 007 eller 010.

---

## 3. user_preferences-dubblett

**Filer:**
- `20260315_add_user_preferences.sql`
- `20260315_fix_user_preferences.sql` (samma dag, ~2h senare)

**Status:** "fix" omdefinierar utan datatype-konflikt. Idempotent via
`IF NOT EXISTS` + `ADD COLUMN IF NOT EXISTS`. Båda kvar i prod.

---

## 4. achievements-tabell skapas på två ställen

**Filer:**
- `20260316_milestones_system.sql`
- `20260322200000_journey_goals_achievements.sql`

**Status:** Båda använder `IF NOT EXISTS`. Den första vinner. Inget problem.

---

## Riktlinje framåt

1. **Skriv aldrig `CREATE TABLE` utan `IF NOT EXISTS`** — det är vad som
   gjort att kodbasen tål dessa konflikter utan att krascha.
2. **Modifiera aldrig en historisk migration** efter att den körts mot prod.
   Skriv en ny ALTER-migration istället.
3. **Använd unika timestamps** — `YYYYMMDDhhmmss` med sekunder ger 1-sek-precision.
4. **Kör `npx supabase db query --linked` istället för `db push`** —
   `db push` försöker köra alla migrationer från början och faller på
   konflikter som live-DB redan har hanterat.
