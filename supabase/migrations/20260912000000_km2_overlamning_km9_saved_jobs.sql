-- KM2, steg 4 — överlämning av caseload när en konsulent slutar.
-- KM9-rest — konsulentens läsrätt på deltagarens sparade jobb via relationstabellen.
--
-- Överlämning: chef/admin i organisationen flyttar ALLA deltagare från en konsulent
-- till en annan i samma organisation. Chefen behöver inte se deltagarna för det
-- (inre sekretess — chefsvyn är bara tal), därför en vy med tre kolumner och en
-- INSTEAD OF INSERT-trigger, samma mönster som organization_colleagues
-- (20260911230000): SECURITY DEFINER utan EXECUTE för någon roll, nås bara via vyn.
--
-- Vad som flyttas:            consultant_participants, profiles.consultant_id,
--                             activity_plans (aktiva och pausade — kravet fortsätter)
-- Vad som INTE flyttas:       consultant_journal, consultant_goals, consultant_meetings,
--                             consultant_placements, consultant_work_placements.
--   De bär den gamla konsulentens consultant_id och blir enligt KS2-policyerna
--   oläsbara för båda när relationen upphör (läge (c) i KS2-noten, 20260831140000).
--   Att flytta eller arkivera dem är ett PRODUKTBESLUT Mikael inte tagit — skriv
--   inte in det här utan beslut.
-- Deltagaren:                 får en notis, och samtyckesfrågan om konsulenten ställs
--                             om av KonsulentSamtyckeFraga eftersom profiles.consultant_id
--                             nu pekar på en konsulent utan samtycke.
--
-- Kör:   npx supabase db query --linked -f supabase/migrations/20260912000000_km2_overlamning_km9_saved_jobs.sql
-- Sedan: cd client && npm run schema:refresh && npm run grants:refresh

-- =============================================================================
-- 1. Överlämning
-- =============================================================================

CREATE OR REPLACE VIEW organization_handover AS
  SELECT
    m.org_id,
    m.user_id AS from_consultant_id,
    NULL::uuid AS to_consultant_id,
    (SELECT count(*) FROM consultant_participants cp WHERE cp.consultant_id = m.user_id)::int AS antal_deltagare
  FROM organization_members m
  WHERE EXISTS (
    SELECT 1 FROM organization_members me
    WHERE me.org_id = m.org_id AND me.user_id = auth.uid() AND me.role IN ('chef', 'admin')
  );

CREATE OR REPLACE FUNCTION public.organization_handover_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  caller uuid := auth.uid();
  caller_role text;
  flyttade int := 0;
  r record;
BEGIN
  IF caller IS NULL THEN
    RAISE EXCEPTION 'Inte inloggad' USING ERRCODE = '42501';
  END IF;
  IF NEW.org_id IS NULL OR NEW.from_consultant_id IS NULL OR NEW.to_consultant_id IS NULL THEN
    RAISE EXCEPTION 'Organisation, från-konsulent och till-konsulent krävs' USING ERRCODE = '22023';
  END IF;
  IF NEW.from_consultant_id = NEW.to_consultant_id THEN
    RAISE EXCEPTION 'Från- och till-konsulent är samma person' USING ERRCODE = '22023';
  END IF;

  SELECT m.role INTO caller_role FROM organization_members m
  WHERE m.org_id = NEW.org_id AND m.user_id = caller;
  IF caller_role IS NULL OR caller_role NOT IN ('chef', 'admin') THEN
    RAISE EXCEPTION 'Bara chef eller administratör i organisationen får överlämna deltagare' USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM organization_members m WHERE m.org_id = NEW.org_id AND m.user_id = NEW.from_consultant_id) THEN
    RAISE EXCEPTION 'Konsulenten som lämnar över är inte medlem i organisationen' USING ERRCODE = '42501';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM organization_members m WHERE m.org_id = NEW.org_id AND m.user_id = NEW.to_consultant_id AND m.role IN ('konsulent', 'chef', 'admin')) THEN
    RAISE EXCEPTION 'Mottagaren måste vara arbetskonsulent, chef eller administratör i organisationen' USING ERRCODE = '42501';
  END IF;

  FOR r IN SELECT cp.id, cp.participant_id FROM consultant_participants cp WHERE cp.consultant_id = NEW.from_consultant_id LOOP
    IF EXISTS (SELECT 1 FROM consultant_participants x WHERE x.consultant_id = NEW.to_consultant_id AND x.participant_id = r.participant_id) THEN
      -- Mottagaren har redan relationen: släpp den gamla raden i stället för dubblett.
      DELETE FROM consultant_participants WHERE id = r.id;
    ELSE
      UPDATE consultant_participants
      SET consultant_id = NEW.to_consultant_id, assigned_by = caller, assigned_at = now()
      WHERE id = r.id;
    END IF;
    UPDATE profiles SET consultant_id = NEW.to_consultant_id
    WHERE id = r.participant_id AND consultant_id = NEW.from_consultant_id;
    UPDATE activity_plans SET consultant_id = NEW.to_consultant_id
    WHERE participant_id = r.participant_id AND consultant_id = NEW.from_consultant_id AND status <> 'ended';
    INSERT INTO notifications (user_id, type, title, message, action_url, data)
    VALUES (
      r.participant_id, 'system', 'Du har fått en ny konsulent',
      'Din tidigare konsulent har lämnat över till en kollega. Du får en fråga om du är okej med att den nya konsulenten ser dina uppgifter — du bestämmer.',
      '/my-consultant', jsonb_build_object('from', NEW.from_consultant_id, 'to', NEW.to_consultant_id)
    );
    flyttade := flyttade + 1;
  END LOOP;

  NEW.antal_deltagare := flyttade;
  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.organization_handover_insert() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_organization_handover_insert ON organization_handover;
CREATE TRIGGER trg_organization_handover_insert
  INSTEAD OF INSERT ON organization_handover
  FOR EACH ROW EXECUTE FUNCTION public.organization_handover_insert();

ALTER VIEW organization_handover OWNER TO postgres;
REVOKE ALL ON organization_handover FROM PUBLIC, anon;
GRANT SELECT, INSERT ON organization_handover TO authenticated;

COMMENT ON VIEW organization_handover IS
  'KM2: överlämning av hela caseloaden från en konsulent till en annan i samma organisation. INSERT (org_id, from_consultant_id, to_consultant_id) som chef/admin. Journal/mål/möten flyttas INTE (KS2-beslut väntar).';

-- =============================================================================
-- 2. KM9-rest: sparade jobb läsbara via relationstabellen
-- =============================================================================
-- Befintlig policy går via profiles.consultant_id (1:1). Sedan 2026-08-31 är
-- consultant_participants sanningen för aktiva relationer (RLS på journal/mål/
-- pass). En deltagare kopplad bara via relationstabellen gav null-grenen i
-- JobbsokTidKort. Samma EXISTS-mönster som övriga konsulentpolicyer.

CREATE POLICY "Konsulent läser aktiva deltagares sparade jobb"
  ON saved_jobs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM consultant_participants cp
    WHERE cp.consultant_id = auth.uid() AND cp.participant_id = saved_jobs.user_id
  ));

-- VERIFIERING (som authenticated i rullad-tillbaka transaktion):
--   chef: insert into organization_handover (org_id, from, to) → antal_deltagare = N
--   → consultant_participants, profiles.consultant_id, activity_plans pekar på to
--   → notifications har N nya rader typ system
--   konsulent (inte chef): insert → 42501; from = to → 22023; mottagare utanför org → 42501
--   has_function_privilege('authenticated','organization_handover_insert()','EXECUTE') → false
