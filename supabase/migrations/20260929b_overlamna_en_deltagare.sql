-- ============================================================================
-- CH6 / CH13 — körd i prod 2026-09-29 efter Mikaels ja
-- ============================================================================
-- Överlämning av EN deltagare mellan två konsulenter i samma organisation.
-- Vyn organization_handover flyttar bara hela caseloaden (INSTEAD OF INSERT).
-- Här två SECURITY DEFINER-funktioner som gör samma sak för en deltagare,
-- med samma behörighetsregel som vyns trigger: bara chef/admin i organisationen.
--
-- 1. overlamningsdeltagare(org, från)  — namnlista över från-konsulentens
--    deltagare (id + namn), så chefen kan PEKA ut vem. OBS PRODUKTBESLUT:
--    chef/admin har idag ingen RLS-läsrätt på deltagarnamn (caseloadtabellen
--    säger "Bara tal"). Funktionen ger chefen namn på de deltagare som hen
--    ändå har rätt att flytta. Vill Mikael inte det: kör inte migrationen;
--    klienten visar då ett ärligt fel och inget annat går sönder.
-- 2. overlamna_deltagare(org, deltagare, från, till) — flyttar en deltagare,
--    speglar organization_handover_insert (consultant_participants,
--    profiles.consultant_id, aktiva planer, notis). Returnerar 1.
--
-- Prövas (som chef/admin, efter körning):
--   select * from overlamningsdeltagare('<org>','<från>');
--   select overlamna_deltagare('<org>','<deltagare>','<från>','<till>');  -- 1
--   som konsulent (ej chef): båda ger 42501. Anon: permission denied.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.overlamningsdeltagare(p_org_id uuid, p_from_consultant_id uuid)
RETURNS TABLE (participant_id uuid, namn text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  caller uuid := auth.uid();
  caller_role text;
BEGIN
  IF caller IS NULL THEN
    RAISE EXCEPTION 'Inte inloggad' USING ERRCODE = '42501';
  END IF;
  SELECT m.role INTO caller_role FROM organization_members m
  WHERE m.org_id = p_org_id AND m.user_id = caller;
  IF caller_role IS NULL OR caller_role NOT IN ('chef', 'admin') THEN
    RAISE EXCEPTION 'Bara chef eller administratör i organisationen får överlämna deltagare' USING ERRCODE = '42501';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM organization_members m WHERE m.org_id = p_org_id AND m.user_id = p_from_consultant_id) THEN
    RAISE EXCEPTION 'Konsulenten är inte medlem i organisationen' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT cp.participant_id,
         COALESCE(NULLIF(btrim(COALESCE(p.first_name,'') || ' ' || COALESCE(p.last_name,'')), ''), NULLIF(p.full_name,''), 'Namnlös deltagare')
  FROM consultant_participants cp
  JOIN profiles p ON p.id = cp.participant_id
  WHERE cp.consultant_id = p_from_consultant_id
  ORDER BY 2;
END;
$$;

CREATE OR REPLACE FUNCTION public.overlamna_deltagare(
  p_org_id uuid, p_participant_id uuid, p_from_consultant_id uuid, p_to_consultant_id uuid
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  caller uuid := auth.uid();
  caller_role text;
  cp_id uuid;
BEGIN
  IF caller IS NULL THEN
    RAISE EXCEPTION 'Inte inloggad' USING ERRCODE = '42501';
  END IF;
  IF p_org_id IS NULL OR p_participant_id IS NULL OR p_from_consultant_id IS NULL OR p_to_consultant_id IS NULL THEN
    RAISE EXCEPTION 'Organisation, deltagare, från-konsulent och till-konsulent krävs' USING ERRCODE = '22023';
  END IF;
  IF p_from_consultant_id = p_to_consultant_id THEN
    RAISE EXCEPTION 'Från- och till-konsulent är samma person' USING ERRCODE = '22023';
  END IF;

  SELECT m.role INTO caller_role FROM organization_members m
  WHERE m.org_id = p_org_id AND m.user_id = caller;
  IF caller_role IS NULL OR caller_role NOT IN ('chef', 'admin') THEN
    RAISE EXCEPTION 'Bara chef eller administratör i organisationen får överlämna deltagare' USING ERRCODE = '42501';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM organization_members m WHERE m.org_id = p_org_id AND m.user_id = p_from_consultant_id) THEN
    RAISE EXCEPTION 'Konsulenten som lämnar över är inte medlem i organisationen' USING ERRCODE = '42501';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM organization_members m WHERE m.org_id = p_org_id AND m.user_id = p_to_consultant_id AND m.role IN ('konsulent', 'chef', 'admin')) THEN
    RAISE EXCEPTION 'Mottagaren måste vara arbetskonsulent, chef eller administratör i organisationen' USING ERRCODE = '42501';
  END IF;

  SELECT cp.id INTO cp_id FROM consultant_participants cp
  WHERE cp.consultant_id = p_from_consultant_id AND cp.participant_id = p_participant_id;
  IF cp_id IS NULL THEN
    RAISE EXCEPTION 'Deltagaren tillhör inte konsulenten som lämnar över' USING ERRCODE = '22023';
  END IF;

  IF EXISTS (SELECT 1 FROM consultant_participants x WHERE x.consultant_id = p_to_consultant_id AND x.participant_id = p_participant_id) THEN
    DELETE FROM consultant_participants WHERE id = cp_id;
  ELSE
    UPDATE consultant_participants
    SET consultant_id = p_to_consultant_id, assigned_by = caller, assigned_at = now()
    WHERE id = cp_id;
  END IF;
  UPDATE profiles SET consultant_id = p_to_consultant_id
  WHERE id = p_participant_id AND consultant_id = p_from_consultant_id;
  UPDATE activity_plans SET consultant_id = p_to_consultant_id
  WHERE participant_id = p_participant_id AND consultant_id = p_from_consultant_id AND status <> 'ended';
  INSERT INTO notifications (user_id, type, title, message, action_url, data)
  VALUES (
    p_participant_id, 'system', 'Du har fått en ny konsulent',
    'Din tidigare konsulent har lämnat över till en kollega. Du får en fråga om du är okej med att den nya konsulenten ser dina uppgifter — du bestämmer.',
    '/my-consultant', jsonb_build_object('from', p_from_consultant_id, 'to', p_to_consultant_id)
  );
  RETURN 1;
END;
$$;

REVOKE ALL ON FUNCTION public.overlamningsdeltagare(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.overlamna_deltagare(uuid, uuid, uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.overlamningsdeltagare(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.overlamna_deltagare(uuid, uuid, uuid, uuid) TO authenticated;

-- Efter körning: npm run grants:refresh && npm run schema:refresh (i client/),
-- committa snapshotarna. lint:grants räknar authenticated-taket (26) — höj det
-- med 2 medvetet, eller motivera i allowlisten.

-- Tillägg vid körningen 2026-09-29: REVOKE FROM PUBLIC räckte inte — Supabase
-- default privileges ger anon ett eget EXECUTE-grant på nya funktioner i public.
-- Mätt efter första körningen: has_function_privilege('anon', …) = true för båda.
REVOKE EXECUTE ON FUNCTION public.overlamningsdeltagare(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.overlamna_deltagare(uuid, uuid, uuid, uuid) FROM anon;
