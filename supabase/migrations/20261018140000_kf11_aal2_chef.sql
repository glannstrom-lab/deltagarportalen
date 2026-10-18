-- KF11 (spår KF, 2026-10-18): chefens och administratörens ORGANISATIONSBREDA rätt kräver
-- tvåstegsinloggning (aal2) även mot direkta API-anrop — inte bara i UI:t (KravTvaSteg).
-- Demoorganisationer (is_demo) undantas: delade, publicerade demokonton kan inte ha en
-- autentiseringsapp, och datan är påhittad.
--
-- Bara de policyer som ger chef/admin något UTÖVER en vanlig konsulent ändras. Konsulentens
-- egna deltagare (policyn "Konsulent har access ...") rörs inte — en chef som också är
-- konsulent når sina egna deltagare med aal1, precis som vilken konsulent som helst.
-- ALTER POLICY behåller namn, kommando och roller; bara villkoret skärps med AND.
-- Mät efteråt med en aal1-session (se ROADMAP KF11).

alter policy "Chef skapar katalogposter i organisationen" on public.activity_catalog_items
  with check ((((org_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM organization_members m
  WHERE ((m.org_id = activity_catalog_items.org_id) AND (m.user_id = ( SELECT auth.uid() AS uid)) AND (m.role = ANY (ARRAY['chef'::text, 'admin'::text]))))))) and ((select auth.jwt()->>'aal') = 'aal2' or exists (select 1 from public.organizations o where o.id = activity_catalog_items.org_id and o.is_demo)));

alter policy "Chef tar bort katalogposter i organisationen" on public.activity_catalog_items
  using ((((org_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM organization_members m
  WHERE ((m.org_id = activity_catalog_items.org_id) AND (m.user_id = ( SELECT auth.uid() AS uid)) AND (m.role = ANY (ARRAY['chef'::text, 'admin'::text]))))))) and ((select auth.jwt()->>'aal') = 'aal2' or exists (select 1 from public.organizations o where o.id = activity_catalog_items.org_id and o.is_demo)));

alter policy "Chef ändrar katalogposter i organisationen" on public.activity_catalog_items
  using ((((org_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM organization_members m
  WHERE ((m.org_id = activity_catalog_items.org_id) AND (m.user_id = ( SELECT auth.uid() AS uid)) AND (m.role = ANY (ARRAY['chef'::text, 'admin'::text]))))))) and ((select auth.jwt()->>'aal') = 'aal2' or exists (select 1 from public.organizations o where o.id = activity_catalog_items.org_id and o.is_demo)))
  with check ((((org_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM organization_members m
  WHERE ((m.org_id = activity_catalog_items.org_id) AND (m.user_id = ( SELECT auth.uid() AS uid)) AND (m.role = ANY (ARRAY['chef'::text, 'admin'::text]))))))) and ((select auth.jwt()->>'aal') = 'aal2' or exists (select 1 from public.organizations o where o.id = activity_catalog_items.org_id and o.is_demo)));

alter policy "Organisationens chef läser underlag" on public.activity_plan_handovers
  using ((((org_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM organization_members m
  WHERE ((m.org_id = activity_plan_handovers.org_id) AND (m.user_id = ( SELECT auth.uid() AS uid)) AND (m.role = ANY (ARRAY['chef'::text, 'admin'::text]))))))) and ((select auth.jwt()->>'aal') = 'aal2' or exists (select 1 from public.organizations o where o.id = activity_plan_handovers.org_id and o.is_demo)));

alter policy "Organisationens chef läser planer" on public.activity_plans
  using ((((org_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM organization_members m
  WHERE ((m.org_id = activity_plans.org_id) AND (m.user_id = ( SELECT auth.uid() AS uid)) AND (m.role = ANY (ARRAY['chef'::text, 'admin'::text]))))))) and ((select auth.jwt()->>'aal') = 'aal2' or exists (select 1 from public.organizations o where o.id = activity_plans.org_id and o.is_demo)));

alter policy "Organisationens chef läser pass" on public.activity_sessions
  using (((EXISTS ( SELECT 1
   FROM (activity_plans p
     JOIN organization_members m ON ((m.org_id = p.org_id)))
  WHERE ((p.id = activity_sessions.plan_id) AND (m.user_id = ( SELECT auth.uid() AS uid)) AND (m.role = ANY (ARRAY['chef'::text, 'admin'::text])))))) and ((select auth.jwt()->>'aal') = 'aal2' or exists (select 1 from public.activity_plans p join public.organizations o on o.id = p.org_id where p.id = activity_sessions.plan_id and o.is_demo)));

alter policy "Organisationens chef läser MSFA-markeringar" on public.msfa_overforingar
  using ((((org_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM organization_members m
  WHERE ((m.org_id = msfa_overforingar.org_id) AND (m.user_id = ( SELECT auth.uid() AS uid)) AND (m.role = ANY (ARRAY['chef'::text, 'admin'::text]))))))) and ((select auth.jwt()->>'aal') = 'aal2' or exists (select 1 from public.organizations o where o.id = msfa_overforingar.org_id and o.is_demo)));

alter policy "Chef ändrar sin organisations AI-brytare" on public.organizations
  using (((EXISTS ( SELECT 1
   FROM organization_members m
  WHERE ((m.org_id = organizations.id) AND (m.user_id = ( SELECT auth.uid() AS uid)) AND (m.role = ANY (ARRAY['chef'::text, 'admin'::text])))))) and ((select auth.jwt()->>'aal') = 'aal2' or organizations.is_demo))
  with check (((EXISTS ( SELECT 1
   FROM organization_members m
  WHERE ((m.org_id = organizations.id) AND (m.user_id = ( SELECT auth.uid() AS uid)) AND (m.role = ANY (ARRAY['chef'::text, 'admin'::text])))))) and ((select auth.jwt()->>'aal') = 'aal2' or organizations.is_demo));

-- Överlämningen (definer-funktioner, bara chef/admin) får samma krav.
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
  -- KF11 (2026-10-18): chef/admin kräver tvåstegsinloggning (aal2), utom i demoorganisationer.
  IF caller_role IN ('chef', 'admin') AND coalesce(auth.jwt()->>'aal', '') <> 'aal2'
     AND NOT EXISTS (SELECT 1 FROM organizations o WHERE o.id = NEW.org_id AND o.is_demo) THEN
    RAISE EXCEPTION 'Tvåstegsinloggning krävs för att överlämna deltagare' USING ERRCODE = '42501';
  END IF;
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

CREATE OR REPLACE FUNCTION public.overlamna_deltagare(p_org_id uuid, p_participant_id uuid, p_from_consultant_id uuid, p_to_consultant_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
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
  -- KF11 (2026-10-18): chef/admin kräver tvåstegsinloggning (aal2), utom i demoorganisationer.
  IF caller_role IN ('chef', 'admin') AND coalesce(auth.jwt()->>'aal', '') <> 'aal2'
     AND NOT EXISTS (SELECT 1 FROM organizations o WHERE o.id = p_org_id AND o.is_demo) THEN
    RAISE EXCEPTION 'Tvåstegsinloggning krävs för att överlämna deltagare' USING ERRCODE = '42501';
  END IF;
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
$function$;

CREATE OR REPLACE FUNCTION public.overlamningsdeltagare(p_org_id uuid, p_from_consultant_id uuid)
 RETURNS TABLE(participant_id uuid, namn text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  caller uuid := auth.uid();
  caller_role text;
BEGIN
  IF caller IS NULL THEN
    RAISE EXCEPTION 'Inte inloggad' USING ERRCODE = '42501';
  END IF;
  SELECT m.role INTO caller_role FROM organization_members m
  WHERE m.org_id = p_org_id AND m.user_id = caller;
  -- KF11 (2026-10-18): chef/admin kräver tvåstegsinloggning (aal2), utom i demoorganisationer.
  IF caller_role IN ('chef', 'admin') AND coalesce(auth.jwt()->>'aal', '') <> 'aal2'
     AND NOT EXISTS (SELECT 1 FROM organizations o WHERE o.id = p_org_id AND o.is_demo) THEN
    RAISE EXCEPTION 'Tvåstegsinloggning krävs för att överlämna deltagare' USING ERRCODE = '42501';
  END IF;
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
$function$;

