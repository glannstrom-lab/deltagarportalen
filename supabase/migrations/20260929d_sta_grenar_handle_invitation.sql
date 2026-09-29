-- Körd i prod 2026-09-29 (Mikaels ja) — ta bort STA-grenarna ur handle_first_signin och
-- handle_invitation_acceptance (STA arkiverad 2026-09-12)
--
-- PREMISSEN HÅLLER (prod 2026-09-29): båda funktionerna rör fortfarande sta_enrollments.
--  * handle_first_signin: UPDATE sta_enrollments SET link_status='linked' WHERE
--    participant_id = NEW.id AND link_status='invited'. Vid en användares FÖRSTA
--    inloggning kan ingen enrollment redan peka på NEW.id -> satsen är en no-op i
--    praktiken. Konsulttext ("STA-invitation") i kommentaren städas.
--  * handle_invitation_acceptance: v_sta_enrollment_id ur invitations.metadata
--    ->>'sta_enrollment_id' + UPDATE sta_enrollments. 0 av alla invitations har
--    nyckeln (select count(*) from invitations where metadata ? 'sta_enrollment_id'
--    -> 0), och ingen kod skriver den längre (grep: bara edge-mejlmallar.test.ts).
--
-- Beteende som BEVARAS med flit (ändra inte utan beslut):
--  * program-vitlistan ('steg_till_arbete','rusta_och_matcha'): värdet
--    steg_till_arbete finns kvar i profiles.program (20 rader) som data; en gammal
--    inbjudan kan bära det. Vill Mikael stänga den: ta bort 'steg_till_arbete' ur
--    IN-listan (separat beslut).
--  * consultant_consents-loggningen i handle_first_signin (gäller alla program,
--    inte bara STA — den enda vägen samtycket ur en inbjudan blir en logg).
--  * SECURITY DEFINER, search_path, EXCEPTION-svalget i handle_first_signin.
-- De 18 'invited' / 1 'unlinked' / 12 'linked' raderna i sta_enrollments rörs inte
-- (gallras av jobbet retention-sta). sta_*-RPC:erna (sta_bulk_invite m.fl., ~9 st) är
-- kvar och hör till en egen avpublicering — utanför den här filen.
--
-- PRÖVA (rollback):
--   begin; <kör hela filen nedan utan commit>;
--   select proname, prosrc ilike '%sta_enrollment%' as har_sta from pg_proc
--    where proname in ('handle_first_signin','handle_invitation_acceptance');
--   -> false, false
--   rollback;
-- Funktionsattribut ska vara oförändrade:
--   select proname, prosecdef, proconfig from pg_proc where proname in (...);
--   -> t | {search_path=public}  (båda)

begin;

CREATE OR REPLACE FUNCTION public.handle_first_signin()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_invite RECORD;
  v_program TEXT;
  v_consent_text TEXT;
  v_consent_scope JSONB;
  v_consultant_id UUID;
BEGIN
  -- Bara intresserade när last_sign_in_at flippar från NULL → NOT NULL
  IF OLD.last_sign_in_at IS NOT NULL OR NEW.last_sign_in_at IS NULL THEN
    RETURN NEW;
  END IF;

  -- Hitta invitation:en som användes (used_by = NEW.id) för att skapa consent.
  -- Om personen kom in via en inbjudan med consent_text i metadata, logga
  -- consultant_consents nu.
  SELECT * INTO v_invite
  FROM public.invitations
  WHERE used_by = NEW.id
    AND metadata->>'consent_text' IS NOT NULL
    AND consultant_id IS NOT NULL
  ORDER BY used_at DESC NULLS LAST, created_at DESC
  LIMIT 1;

  IF v_invite.id IS NOT NULL THEN
    v_program := v_invite.metadata->>'program';
    v_consent_text := v_invite.metadata->>'consent_text';
    v_consent_scope := COALESCE(v_invite.metadata->'consent_scope', '{}'::jsonb);
    v_consultant_id := v_invite.consultant_id;

    -- Idempotent: skapa bara om det inte redan finns ett aktivt samtycke
    IF NOT EXISTS (
      SELECT 1 FROM public.consultant_consents
      WHERE participant_id = NEW.id
        AND consultant_id = v_consultant_id
        AND COALESCE(program, '') = COALESCE(v_program, '')
        AND revoked_at IS NULL
    ) THEN
      INSERT INTO public.consultant_consents (
        participant_id, consultant_id, program, scope, granted_text, granted_via
      ) VALUES (
        NEW.id, v_consultant_id, v_program,
        v_consent_scope, v_consent_text, 'invitation'
      );
    END IF;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Logga men låt inte sign-in falla
  RAISE WARNING 'handle_first_signin failed for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_invitation_acceptance()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  invite_record RECORD;
  v_program TEXT;
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

  IF v_program IS NOT NULL AND v_program IN ('steg_till_arbete', 'rusta_och_matcha') THEN
    UPDATE profiles SET program = v_program WHERE id = NEW.id AND program IS NULL;
  END IF;

  RETURN NEW;
END;
$function$;

commit;
