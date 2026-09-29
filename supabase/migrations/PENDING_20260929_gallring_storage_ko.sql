-- PENDING 2026-09-29 — gallringen städar inte filer: köa uid:n så en sopare kan
--
-- PREMISSEN HÅLLER (prod 2026-09-29):
--  * execute_inactive_account_retention() och execute_scheduled_account_deletions()
--    gör bara DELETE FROM auth.users (+ auditrad). Ingen av dem rör filer.
--  * Supabase Storage: storage.objects.owner är ON DELETE SET NULL, så filerna blir
--    ägarlösa men ligger kvar (profile-documents/<uid>/..., inkl. <uid>/cv/...).
--    Idag 1 objekt totalt, ägaren finns kvar -> 0 föräldralösa
--    (select count(*) from storage.objects o where not exists (select 1 from
--     auth.users u where u.id::text=(storage.foldername(o.name))[1]) -> 0).
--    profile-images är tom (bilder går till Vercel Blob).
--  * Vercel Blob: upload-image.js lägger allt under prefix user-<uid>/. Det finns
--    1 profil med Blob-URL; cvs.profile_image har 7 Blob-URL:er. Efter cron-radering
--    ligger filerna kvar publikt (access: public). Redan hänt en gång:
--    admin_audit_log har 1 ACCOUNT_DELETION med deleted_by=retention_cron.
--  * Edge-funktionen delete-account (den manuella art. 17-vägen) städar BÅDA —
--    storageCleanup.ts (Storage API) och Blob via list?prefix=user-<uid>/ + delete.
--    Det är bara cron-vägarna som saknar det.
--
-- VAD SOM INTE GÅR FRÅN SQL:
--  * DELETE FROM storage.objects blockeras av triggern storage.protect_delete
--    (och skulle ändå lämna själva filen i S3). Storage måste städas via Storage API.
--  * Vercel Blob nås bara med BLOB_READ_WRITE_TOKEN över HTTP. pg_net är INTE
--    installerat (bara pg_cron och supabase_vault), så pg_cron kan inte anropa en
--    funktion direkt.
--
-- LÖSNING I TVÅ DELAR:
--  1. (den här filen) En kö: när cron raderar ett konto skrivs uid:t till
--     public.storage_gallring_ko i SAMMA delförfrågan som raderingen. Misslyckas
--     köandet återrullas raderingen och loggas som ACCOUNT_DELETION_FAILED — kontot
--     står kvar och försöks igen nästa natt (fail closed, samma policy som art. 17).
--     Bara uid sparas, ingen e-post.
--  2. (BESLUT KRÄVS, inte skriven här) en sopare som tömmer kön:
--       Alt A: ny edge-funktion storage-gallring som återanvänder
--              delete-account/storageCleanup.ts (cleanupUserStorage) + Blob-blocket
--              ur delete-account/index.ts, och sätter done_at/resultat. Körs av
--              GitHub Actions med schedule: (kräver Mikaels ja: .github/workflows/)
--              eller av pg_cron via pg_net + service-nyckel i supabase_vault
--              (kräver create extension pg_net = ett ja).
--       Alt B: låt sopan vara manuell tills volymen motiverar mer — 1 cron-radering
--              hittills. Kön gör att ingenting glöms, även om sopan kommer senare.
--     Rekommendation: A med GitHub Actions (mönster finns i den nattliga backup.yml).
--
-- PRÖVA (rollback): kör filen inom begin; ... rollback;
--   select to_regclass('public.storage_gallring_ko');   -> storage_gallring_ko
--   select relrowsecurity from pg_class where oid = 'public.storage_gallring_ko'::regclass;   -> t
--   select has_table_privilege('anon','public.storage_gallring_ko','SELECT'),
--          has_table_privilege('authenticated','public.storage_gallring_ko','SELECT');   -> f | f
--   select prosrc ilike '%storage_gallring_ko%' from pg_proc
--    where proname in ('execute_inactive_account_retention','execute_scheduled_account_deletions');   -> t, t
-- Funktionerna körs inte i provet (de raderar riktiga konton om något är >24 mån).
--
-- Efter körning: cd client && npm run schema:refresh && npm run grants:refresh
-- och committa snapshotarna (ny tabell + RLS utan policy).
--
-- Bakåtfyllnad: det redan raderade cron-kontot (admin_audit_log: ACCOUNT_DELETION med
-- old_value->>deleted_by = retention_cron, target_id = uid) saknar köpost. Kör soparen
-- en gång manuellt mot det id:t. De 8 user_request-raderna städades av delete-account.

begin;

create table if not exists public.storage_gallring_ko (
  user_id    uuid primary key,          -- ingen FK: kontot är redan borta
  reason     text not null,
  queued_at  timestamptz not null default now(),
  done_at    timestamptz,
  resultat   text
);

alter table public.storage_gallring_ko enable row level security;
-- Ingen policy med flit: bara service_role (kringgår RLS) läser/skriver kön.
revoke all on public.storage_gallring_ko from public, anon, authenticated;

comment on table public.storage_gallring_ko is
  'uid:n vars konton raderats av gallringscron. Soparen raderar Storage <uid>/ och Vercel Blob user-<uid>/ och sätter done_at. Inga personuppgifter utöver uid.';

CREATE OR REPLACE FUNCTION public.execute_inactive_account_retention()
 RETURNS TABLE(user_id uuid, utfall text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
DECLARE
  r RECORD;
  v_email text;
BEGIN
  -- Steg 1: 18-månadersvarning, en gång per konto (konsumeras av
  -- send-inactivity-warning, som läser email_queue).
  INSERT INTO email_queue (user_id, template, scheduled_at)
  SELECT u.id, 'inactivity_warning_18m', NOW()
  FROM auth.users u
  WHERE u.last_sign_in_at < NOW() - INTERVAL '18 months'
    AND u.last_sign_in_at > NOW() - INTERVAL '19 months'
    AND NOT EXISTS (
      SELECT 1 FROM email_queue eq
      WHERE eq.user_id = u.id AND eq.template = 'inactivity_warning_18m'
    );

  -- Steg 2: radering vid 24 månader, per konto med auditrad.
  -- Konton som aldrig loggat in (last_sign_in_at IS NULL) rörs inte här —
  -- de är inbjudningar som inte fullföljts och har en egen livscykel.
  FOR r IN
    SELECT u.id FROM auth.users u
    WHERE u.last_sign_in_at < NOW() - INTERVAL '24 months'
  LOOP
    BEGIN
      SELECT p.email INTO v_email FROM profiles p WHERE p.id = r.id;

      INSERT INTO admin_audit_log (admin_id, action, target_table, target_id, old_value)
      VALUES (NULL, 'ACCOUNT_DELETION', 'profiles', r.id,
              jsonb_build_object('email', v_email, 'deleted_by', 'retention_cron',
                                 'reason', 'inactive_24_months'));

      UPDATE audit_logs SET user_id = NULL WHERE audit_logs.user_id = r.id;

      -- Filerna (Storage + Vercel Blob) städas av soparen — kön är kvittot.
      INSERT INTO storage_gallring_ko (user_id, reason)
      VALUES (r.id, 'inactive_24_months')
      ON CONFLICT DO NOTHING;

      DELETE FROM auth.users u WHERE u.id = r.id;

      user_id := r.id; utfall := 'raderad'; RETURN NEXT;
    EXCEPTION WHEN OTHERS THEN
      INSERT INTO admin_audit_log (admin_id, action, target_table, target_id, new_value)
      VALUES (NULL, 'ACCOUNT_DELETION_FAILED', 'profiles', r.id,
              jsonb_build_object('deleted_by', 'retention_cron', 'error', SQLERRM));
      user_id := r.id; utfall := 'misslyckades: ' || SQLERRM; RETURN NEXT;
    END;
  END LOOP;
  RETURN;
END;
$function$;

CREATE OR REPLACE FUNCTION public.execute_scheduled_account_deletions()
 RETURNS TABLE(user_id uuid, utfall text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
DECLARE
  r RECORD;
  v_email text;
BEGIN
  FOR r IN
    SELECT adr.id, adr.user_id
    FROM account_deletion_requests adr
    WHERE adr.scheduled_deletion_at < NOW()
      AND adr.executed_at IS NULL
      AND adr.cancelled_at IS NULL
  LOOP
    BEGIN
      SELECT p.email INTO v_email FROM profiles p WHERE p.id = r.user_id;

      INSERT INTO admin_audit_log (admin_id, action, target_table, target_id, old_value)
      VALUES (NULL, 'ACCOUNT_DELETION', 'profiles', r.user_id,
              jsonb_build_object('email', v_email, 'deleted_by', 'retention_cron',
                                 'reason', 'deletion_request_grace_expired',
                                 'request_id', r.id));

      UPDATE audit_logs SET user_id = NULL WHERE audit_logs.user_id = r.user_id;

      UPDATE account_deletion_requests
      SET executed_at = NOW(), executed_by = 'retention_cron'
      WHERE id = r.id;

      -- Filerna (Storage + Vercel Blob) städas av soparen — kön är kvittot.
      INSERT INTO storage_gallring_ko (user_id, reason)
      VALUES (r.user_id, 'deletion_request_grace_expired')
      ON CONFLICT DO NOTHING;

      DELETE FROM auth.users u WHERE u.id = r.user_id;

      user_id := r.user_id; utfall := 'raderad'; RETURN NEXT;
    EXCEPTION WHEN OTHERS THEN
      -- Kontot står kvar; felet syns i auditloggen och i nästa körning igen.
      INSERT INTO admin_audit_log (admin_id, action, target_table, target_id, new_value)
      VALUES (NULL, 'ACCOUNT_DELETION_FAILED', 'profiles', r.user_id,
              jsonb_build_object('deleted_by', 'retention_cron', 'error', SQLERRM));
      user_id := r.user_id; utfall := 'misslyckades: ' || SQLERRM; RETURN NEXT;
    END;
  END LOOP;
  RETURN;
END;
$function$;

commit;
