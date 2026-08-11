# Retention Policy — Deltagarportalen

**Lagkrav:** GDPR Art 5.1.e (storage limitation), Art 32 (säkerhet).
**Datum:** 2026-07-27 (stämd av mot verkligt schema; föregående version 2026-05-15)

## Revisionsnot 2026-07-27 (ROADMAP H7)

Policyn täckte 13 datakategorier. Produktionsdatabasen har **150 tabeller**, varav ~100 innehåller
persondata. Kategorierna nedan är kompletterade utifrån Art 30-registrets nya behandlingar
(B13–B21) och bilaga A, som listar varje tabell.

**Tre fel i föregående version, rättade:**

1. **`email_queue` fanns inte i databasen** när SQL-mallen nedan skrevs — migrationen
   `20260515_retention_cron.sql` kördes aldrig. Tabellen skapades 2026-07-27 (H6). Det betyder att
   raden "Email-notiser i kö — ✅ Auto" var felaktig: ingen kö fanns, och därmed ingen gallring.
2. **Ingen av de gallringar som stod som "❌ Att implementera" är implementerad**, eftersom
   `pg_cron` aldrig aktiverades. Det är fortfarande **A6** och ligger hos Mikael. Utan den sker
   **ingen automatisk gallring alls** — det är den enskilt största Art 5.1.e-risken.
3. **OAuth-tokens för LinkedIn** stod som en kategori. Ingen LinkedIn-integration finns — se
   Art 30 B10.

**Nya kategorier som saknades helt:** STA-data (arbetsprövning), konsulentens journal och
meddelanden, jobbansökningar och kontaktpersoner, nätverkskontakter (**tredje personers**
uppgifter), aktivitetslogg, inbjudningar, e-postleveranslogg, inloggningsförsök.

## Princip

Vi sparar bara persondata så länge det behövs för det ändamål de samlats in för. Längre lagring kräver explicit rättslig grund (t.ex. bokföringslagen 7 år, audit för accountability 5 år).

## Retention-tabell

| Datakategori | Retention | Trigger för borttagning | Implementation |
|---|---|---|---|
| **Aktivt konto** | Tills användaren raderar | Användaren begär radering via Settings | `delete-account` edge function (✅ finns) |
| **Inaktivt konto** | 24 månader efter senaste login | Cron-job + email-varning vid 18 mån | ❌ Att implementera |
| **AI-promptar** (`ai_usage_logs`) | 90 dagar | Cron daglig | ❌ Att implementera |
| **Sentry events** | 90 dagar | Sentry vendor default | ✅ Auto |
| **Audit-loggar** (`consent_history`, `data_sharing_audit`, `admin_audit_log`) | 5 år | Cron daglig (efter 5 år) | ❌ Att implementera |
| **Account deletion grace** (`account_deletion_requests`) | 14 dagar (eller direkt vid bekräftelse) | Cron daglig + edge function | ✅ Finns |
| **Email-notiser i kö** | 30 dagar | Vendor default (Supabase Auth-email) | ✅ Auto |
| **Uppladdade bilder** (Vercel Blob) | Tills användaren tar bort eller raderar konto | Manuell + cascade vid kontoradering | 🟡 Manuell (cascade saknas i delete-account?) |
| **CV-PDF:er** | Tills användaren raderar versionen | Manuell | ✅ |
| **Mood/dagbok** | Tills användaren raderar | Manuell | ✅ |
| **Hälsodata-konsentdragning** | Omedelbart vid återkallelse | Användaren via Settings | ✅ |
| **OAuth-tokens** (LinkedIn, Google) | — | — | — Raden är fel på två sätt: ingen LinkedIn-integration finns (se revisionsnot punkt 3 ovan — borde ha tagits bort då), och Google finns bara som `signInWithOAuth({provider:'google'})` för inloggning (`authStore.ts`) — tokens hanteras av Supabase Auth, inte av en "Settings → Integrations"-sida som inte finns i `Settings.tsx`. Kontrollerat 2026-08-12 |
| **Rate-limit-records** | 24h rolling window | — Inte körd | ❌ **Inte körd, verifierat 2026-08-12.** `cleanup_rate_limits()` finns (`20260402100000_rate_limits.sql`) men anropas ingenstans i kodbasen och ingen cron kör den — samma `pg_cron`-blockad som allt annat här. Bevis: `rate_limits` hade 673 rader från **2026-04-25** till idag när tabellen mättes, trots att funktionen ska radera allt äldre än 1 timme. `check_rate_limit()` (den funktion som faktiskt anropas, i `api/_utils/rate-limiter.js`) räknar bara inom fönstret — den städar ingenting. Krävs för att starta: `pg_cron` (A6) + ett `cron.schedule`-anrop till `cleanup_rate_limits()`, eller ett anrop från funktionen själv |
| **AF/Bolagsverket cache** | 24h | TTL-cache | ✅ |

### Nya kategorier 2026-07-27 (H7)

Förslagen är markerade `[bekräftas]` där de bör stämmas av med AI-juristen (A2) innan signering —
särskilt STA, där Arbetsförmedlingens dokumentationskrav kan styra tiden.

| Datakategori | Retention | Trigger för borttagning | Implementation |
|---|---|---|---|
| **STA — arbetsprövning** (10 `sta_*`) | `[bekräftas]` 2 år efter avslutad inskrivning | Cron på `sta_enrollments` slutdatum | ❌ Kräver A6 |
| **STA — självskattningar** (`sta_assessments`) | `[bekräftas]` Samma som ovan. Signerade bedömningar kan behöva längre tid | Cron | ❌ Kräver A6 |
| **Konsulentens journal** (`consultant_journal`, `consultant_notes`) | `[bekräftas]` 2 år efter avslutat uppdrag | Cron + vid `revoke_consultant_link` | ❌ Kräver A6 |
| **Konsulentmeddelanden** (`consultant_messages`) | `[bekräftas]` 2 år | Cron | ❌ Kräver A6 |
| **Placeringar** (`consultant_placements`) | `[bekräftas]` 2 år (uppföljning 3/6 mån ingår) | Cron | ❌ Kräver A6 |
| **Jobbansökningar** (`saved_jobs`, `application_*`) | Tills deltagaren raderar | Manuell + cascade vid kontoradering | ✅ Manuell / 🟡 cascade overifierad |
| **Kontaktpersoner hos arbetsgivare** (`application_contacts`) | Tills deltagaren raderar | Manuell | ✅ |
| **Nätverkskontakter** (`network_contacts`) | Tills deltagaren raderar | Manuell | ✅ — men se anmärkning nedan |
| **Jobbaviseringar** (`job_notifications`) | `[bekräftas]` 90 dagar | Cron | ❌ Kräver A6 |
| **E-postleveranslogg** (`email_notifications`) | `[bekräftas]` 90 dagar | Cron | ❌ Kräver A6 |
| **E-postkö** (`email_queue`) | 30 dagar efter `sent_at` | Cron | ❌ Kräver A6 (tabellen finns sedan 2026-07-27) |
| **Inloggningsförsök** (`login_attempts`) | `[bekräftas]` 30 dagar | Cron | ❌ Kräver A6 |
| **Aktivitetslogg** (`user_activity_log`, `user_activities`) | `[bekräftas]` 12 månader | Cron | ❌ Kräver A6 |
| **Inbjudningar** (`invitations`) | `[bekräftas]` 90 dagar efter utgång | Cron | ❌ Kräver A6 |
| **Delningslänkar** (`profile_shares`) | Tills deltagaren återkallar | Manuell via UI | ✅ |
| **Intervjusessioner** (`interview_sessions`) | Tills deltagaren raderar | Manuell | ✅ |
| **Ljudinspelningar från intervjuövning** | **Lagras inte** | — | ✅ Molnlagringen borttagen 2026-07-27 (H6); filen laddas ner lokalt |
| **Karriär-/kompetensdata** (19 tabeller, B16) | Tills deltagaren raderar | Manuell + cascade | ✅ Manuell |
| **Tillgänglighetsinställningar** (`user_preferences`) | Med kontoradering | Cascade | ✅ |
| **Döda tabeller** (15, se Art 30 bilaga A.3) | Raderade i sin helhet | Engångsmigration | ✅ Klart 2026-07-27 — `20260727140000_drop_dead_schema.sql`. 150 → 135 tabeller |

> **Anmärkning om `network_contacts`:** deltagaren lägger själv in andra personers namn, e-post och
> telefon. De personerna har rättigheter enligt GDPR men har ingen relation till portalen och kan
> inte utöva dem här. Detta bör hanteras antingen genom en informationstext i nätverksvyn eller
> genom att fälten begränsas. **Öppen fråga för juristen (A2).**

## SQL-mallar för automatisk gallring

```sql
-- 1. Inaktiva konton (24 mån)
-- Kör dagligen via Supabase cron (pg_cron extension)
SELECT cron.schedule(
  'gallring-inaktiva-konton',
  '0 3 * * *',
  $$
    -- Steg 1: Skicka 18-månaders varning
    INSERT INTO email_queue (user_id, template, scheduled_at)
    SELECT id, 'inactivity_warning', NOW()
    FROM auth.users
    WHERE last_sign_in_at < NOW() - INTERVAL '18 months'
      AND id NOT IN (SELECT user_id FROM email_queue WHERE template = 'inactivity_warning' AND scheduled_at > NOW() - INTERVAL '7 days');

    -- Steg 2: Radera 24-månaders inaktiva
    DELETE FROM auth.users
    WHERE last_sign_in_at < NOW() - INTERVAL '24 months';
  $$
);

-- 2. AI-loggar (90 dagar)
SELECT cron.schedule(
  'gallring-ai-loggar',
  '0 4 * * *',
  $$ DELETE FROM ai_usage_logs WHERE created_at < NOW() - INTERVAL '90 days'; $$
);

-- 3. Audit-loggar (5 år)
SELECT cron.schedule(
  'gallring-audit-loggar',
  '0 5 * * 0',  -- veckovis
  $$
    DELETE FROM consent_history WHERE created_at < NOW() - INTERVAL '5 years';
    DELETE FROM data_sharing_audit WHERE created_at < NOW() - INTERVAL '5 years';
    DELETE FROM admin_audit_log WHERE created_at < NOW() - INTERVAL '5 years';
  $$
);

-- 4. Cascade på Vercel Blob — kräver edge function
-- delete-account/index.ts ska enumera och ta bort:
--   - profile_documents.file_url
--   - cvs där pdf_url är blob URL
--   - profilbilder där profile_image_url är blob URL
```

## Implementation-checklista

- [x] Skapa migration `20260515_retention_cron.sql` med ovan — **filen finns men kördes aldrig**
- [x] `email_queue` skapad i databasen (2026-07-27, H6 — i den form migrationen och edge-funktionen förutsätter)
- [ ] **Aktivera `pg_cron`-extension i Supabase** (`CREATE EXTENSION pg_cron;`) — **A6, Mikael. Blockerar allt nedan.** Utan detta sker ingen automatisk gallring alls. **Senast kontrollerat 2026-08-12:** `SELECT extname FROM pg_extension;` mot prod listar `pg_stat_statements, pgcrypto, plpgsql, supabase_vault, uuid-ossp` — `pg_cron` finns inte i listan. Ingen `cron.job`-tabell existerar heller att fråga
- [ ] Kör `20260515_retention_cron.sql` när pg_cron är på (den innehåller både tabellen och schemaläggningen)
- [ ] Utöka cron med de nya kategorierna ovan (STA, journal, aktivitetslogg, e-postloggar, inbjudningar, inloggningsförsök)
- [ ] Verifiera att `delete-account` edge function tar bort Vercel Blob-filer (cascade)
- [ ] Lägg till email-template `inactivity_warning` i Supabase Auth
- [ ] Verifiera Resends DPA och region innan cron slås på (utskicken börjar då gå på riktigt)
- [ ] Testa med fake-data att gallring funkar
- [ ] Dokumentera i `docs/HOSTING-REGIONS.md` och Privacy.tsx
- [ ] Besluta om `network_contacts` (tredje personers uppgifter — se anmärkning ovan)

## Användarens kontroll

Användaren kan när som helst:
- Radera enskilda dagboksinlägg, mood-loggar, CV-versioner via UI
- Återkalla samtycke per kategori (AI / hälsa / wellness / cookies)
- Begära radering av hela kontot (14 dagars grace + permanent borttagning)
- Begära dataexport (Art 20) i JSON-format
