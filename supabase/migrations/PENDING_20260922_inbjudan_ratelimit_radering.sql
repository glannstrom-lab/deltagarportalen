-- PENDING — KÖRS INTE UTAN MIKAELS JA (trigger + FK + cron mot prod).
-- Förslag från databaspasset 2026-09-22. Tre oberoende delar; kan köras var för sig.

-- ===========================================================================
-- DEL 1 — Inbjuden deltagare kopplas aldrig till konsulenten (consultant_participants)
-- ===========================================================================
-- Ordningen vid signUp:
--   auth.users INSERT → handle_new_user():
--     1. SELECT invitations WHERE email = NEW.email AND used_at IS NULL
--     2. UPDATE invitations SET used_at = NOW(), used_by = NEW.id     ← markeras använd
--     3. INSERT INTO profiles (... consultant_id = invitationens konsulent)
--        → AFTER INSERT-triggern handle_invitation_acceptance():
--          SELECT invitations WHERE email = NEW.email AND used_at IS NULL  ← hittar inget
--          RETURN NEW   (ingen consultant_participants-rad, inget program)
-- Följd: profiles.consultant_id är satt men raden i consultant_participants
-- saknas. Allt i KS2 (journal, CV, sparade jobb, aktivitetsplan, meddelanden,
-- vyn consultant_dashboard_participants) utgår från cp-raden → konsulenten
-- ser inte sin nya deltagare, och deltagaren kan inte skriva till konsulenten.
-- Belägg i prod: alla 19 cp-rader med notes='Inbjuden via länk' skapades
-- 2026-04/05, samtidigt som profilen (inom 60 s). Maj-profilerna saknar till
-- 23 av 30 terms_accepted_at — det mönster fallbacken i handle_new_user ger
-- (huvudblocket kastade, fallbacken skapade en minimal profil och lämnade
-- inbjudan oanvänd, så acceptance-triggern hittade den). Vägen fungerade
-- alltså bara så länge handle_new_user FALLERADE. Invitations-tabellen är
-- tom i dag (retention-invitations raderade 20 rader), så ingen ny
-- inbjudan har gått igenom sedan — nästa kommer att gå fel.
-- Dessutom: e-postjämförelsen är skiftlägeskänslig i båda funktionerna,
-- medan employer_invitations_insert och sta_bulk_* sparar lower(trim(email)).

BEGIN;

CREATE OR REPLACE FUNCTION public.handle_invitation_acceptance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invite_record RECORD;
  v_program TEXT;
  v_sta_enrollment_id UUID;
BEGIN
  -- Inbjudan som handle_new_user redan markerat åt just detta konto, annars en oanvänd.
  SELECT * INTO invite_record
  FROM invitations
  WHERE lower(email) = lower(NEW.email)
    AND (used_by = NEW.id OR (used_at IS NULL AND expires_at > NOW()))
  ORDER BY (used_by = NEW.id) DESC NULLS LAST, created_at DESC
  LIMIT 1;

  IF invite_record.id IS NULL THEN
    RETURN NEW;
  END IF;

  UPDATE invitations
  SET used_at = COALESCE(used_at, NOW()),
      used_by = NEW.id,
      updated_at = NOW()
  WHERE id = invite_record.id;

  IF invite_record.consultant_id IS NOT NULL THEN
    UPDATE profiles
    SET consultant_id = invite_record.consultant_id
    WHERE id = NEW.id;

    INSERT INTO consultant_participants (consultant_id, participant_id, assigned_by, notes)
    VALUES (invite_record.consultant_id, NEW.id, invite_record.invited_by, 'Inbjuden via länk')
    ON CONFLICT (consultant_id, participant_id) DO NOTHING;
  END IF;

  v_program := invite_record.metadata->>'program';
  v_sta_enrollment_id := NULLIF(invite_record.metadata->>'sta_enrollment_id', '')::UUID;

  IF v_program IS NOT NULL AND v_program IN ('steg_till_arbete', 'rusta_och_matcha') THEN
    UPDATE profiles SET program = v_program WHERE id = NEW.id AND program IS NULL;
  END IF;

  IF v_sta_enrollment_id IS NOT NULL AND invite_record.consultant_id IS NOT NULL THEN
    UPDATE sta_enrollments
    SET participant_id = NEW.id, external_email = NULL, updated_at = NOW()
    WHERE id = v_sta_enrollment_id
      AND consultant_id = invite_record.consultant_id
      AND participant_id IS NULL;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_invitation_acceptance() FROM PUBLIC, anon, authenticated;

COMMIT;

-- ===========================================================================
-- DEL 2 — rate_limits städas aldrig (IP-adresser sparas på obestämd tid)
-- ===========================================================================
-- cleanup_rate_limits() finns men inget cron-jobb anropar den (cron.job
-- 2026-09-22: 15 jobb, inget rör rate_limits). Mätt: 1 380 rader, äldsta
-- 2026-04-25, 1 369 äldre än ett dygn; 959 av identifierarna är IP-adresser
-- och 420 är användar-uuid (utan FK — överlever kontoradering). Fönstren är
-- minuter långa; raderna har inget värde efter en timme. IP-adresser är
-- personuppgifter och står inte i gallringsplanen.

SELECT cron.schedule('retention-rate-limits', '50 * * * *',
  $$ SELECT public.cleanup_rate_limits(); $$);

-- ===========================================================================
-- DEL 3 — "Radera kontot nu" faller för konsulenter
-- ===========================================================================
-- audit_logs.user_id → profiles(id) är den ENDA FK mot profiles/auth.users
-- utan ON DELETE-regel (pg_constraint 2026-09-22). Cron-vägarna
-- (execute_scheduled_account_deletions, execute_inactive_account_retention,
-- reset_demo_org) nollar kolumnen först — men execute_account_deletion_immediate,
-- som DeleteAccountSection.tsx anropar, gör det inte. audit_logs.user_id är
-- den som LÄSTE (VIEWED_PARTICIPANT_DATA, 22 rader, 2 konsulenter + 1 superadmin).
-- En konsulent som öppnat en deltagare och trycker "Radera kontot nu" får
-- 23503 och kontot står kvar (art. 17). En FK-regel täcker alla vägar,
-- även nästa som skrivs.

BEGIN;
ALTER TABLE public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_user_id_fkey;
ALTER TABLE public.audit_logs
  ADD CONSTRAINT audit_logs_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
COMMIT;

-- VERIFIERING:
--   select jobname, schedule from cron.job where jobname='retention-rate-limits'; → 1 rad
--   (nästa timme) select count(*) from rate_limits where window_start < now()-interval '1 hour'; → 0
--   select confdeltype from pg_constraint where conname='audit_logs_user_id_fkey'; → 'n'
--   Del 1: bjud in en testadress från km-konsulent, registrera, kontrollera
--     select count(*) from consultant_participants where participant_id=<nytt id>; → 1
-- EFTERÅT: npm run schema:refresh, committa snapshoten i samma commit.
