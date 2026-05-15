# Retention Policy — Deltagarportalen

**Lagkrav:** GDPR Art 5.1.e (storage limitation), Art 32 (säkerhet).
**Datum:** 2026-05-15

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
| **OAuth-tokens** (LinkedIn, Google) | Tills användaren kopplar ner | Settings → Integrations | ✅ |
| **Rate-limit-records** | 24h rolling window | Auto-rensa via Supabase RPC | ✅ |
| **AF/Bolagsverket cache** | 24h | TTL-cache | ✅ |

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

- [ ] Skapa migration `20260515_retention_cron.sql` med ovan
- [ ] Aktivera `pg_cron`-extension i Supabase (`CREATE EXTENSION pg_cron;`)
- [ ] Verifiera att `delete-account` edge function tar bort Vercel Blob-filer (cascade)
- [ ] Lägg till email-template `inactivity_warning` i Supabase Auth
- [ ] Testa med fake-data att gallring funkar
- [ ] Dokumentera i `docs/HOSTING-REGIONS.md` och Privacy.tsx

## Användarens kontroll

Användaren kan när som helst:
- Radera enskilda dagboksinlägg, mood-loggar, CV-versioner via UI
- Återkalla samtycke per kategori (AI / hälsa / wellness / cookies)
- Begära radering av hela kontot (14 dagars grace + permanent borttagning)
- Begära dataexport (Art 20) i JSON-format
