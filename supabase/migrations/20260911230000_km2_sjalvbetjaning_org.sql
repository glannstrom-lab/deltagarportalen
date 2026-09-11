-- KM2, steg 3 — självbetjäning för organisationens chef/admin.
--
-- Problemet: en policy på organization_members som refererar organization_members
-- ger 42P17 (rekursion), och en SECURITY DEFINER-RPC som authenticated får anropa
-- spräcker lint:grants (taket 29 är nått).
--
-- Lösningen: vyn organization_colleagues (ägd av postgres, ingen security_invoker)
-- får INSTEAD OF-triggers för INSERT/UPDATE/DELETE. Triggerfunktionen är SECURITY
-- DEFINER men EXECUTE är återkallad från PUBLIC/anon/authenticated — uppmätt
-- 2026-09-11: triggern avfyras ändå som postgres, direktanrop ger 42501. Den
-- räknas därför inte som "anropbar definer-funktion" i lint:grants, och kan bara
-- nås genom vyn, med kontrollerna nedan.
--
-- Regler (alla i funktionen, fail closed):
--   * anroparen måste vara chef eller admin i org_id
--   * bara admin får ge rollen admin
--   * medlemmen läggs till på e-post och måste redan ha ett konto (ingen inbjudan
--     via mejl — DE1)
--   * sista chef/admin i en organisation kan inte tas bort eller nedgraderas
--   * ingen får ändra sin egen roll (annars kan en admin låsa ut sig, eller en
--     chef göra sig till admin genom två steg)
--
-- Kör:   npx supabase db query --linked -f supabase/migrations/20260911230000_km2_sjalvbetjaning_org.sql
-- Sedan: cd client && npm run schema:refresh && npm run grants:refresh

CREATE OR REPLACE FUNCTION public.organization_colleagues_iud()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  caller uuid := auth.uid();
  caller_role text;
  target_org uuid;
  target_user uuid;
  target_role text;
  ledning_kvar int;
BEGIN
  IF caller IS NULL THEN
    RAISE EXCEPTION 'Inte inloggad' USING ERRCODE = '42501';
  END IF;

  target_org := COALESCE(NEW.org_id, OLD.org_id);
  IF TG_OP <> 'INSERT' THEN
    SELECT m.user_id, m.role INTO target_user, target_role
    FROM organization_members m WHERE m.id = OLD.id;
    IF target_user IS NULL THEN
      RAISE EXCEPTION 'Medlemskapet finns inte' USING ERRCODE = 'P0002';
    END IF;
    target_org := (SELECT m.org_id FROM organization_members m WHERE m.id = OLD.id);
  END IF;

  SELECT m.role INTO caller_role
  FROM organization_members m
  WHERE m.org_id = target_org AND m.user_id = caller;

  IF caller_role IS NULL OR caller_role NOT IN ('chef', 'admin') THEN
    RAISE EXCEPTION 'Bara chef eller administratör i organisationen får ändra medlemmar' USING ERRCODE = '42501';
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.role NOT IN ('handlaggare', 'konsulent', 'chef', 'admin') THEN
      RAISE EXCEPTION 'Okänd roll' USING ERRCODE = '22023';
    END IF;
    IF NEW.role = 'admin' AND caller_role <> 'admin' THEN
      RAISE EXCEPTION 'Bara en administratör kan ge rollen administratör' USING ERRCODE = '42501';
    END IF;
    SELECT p.id INTO target_user FROM profiles p WHERE lower(p.email) = lower(trim(NEW.email));
    IF target_user IS NULL THEN
      RAISE EXCEPTION 'Ingen användare med e-posten %. Personen behöver skapa ett konto på jobin.se först.', NEW.email USING ERRCODE = 'P0002';
    END IF;
    IF EXISTS (SELECT 1 FROM organization_members m WHERE m.org_id = target_org AND m.user_id = target_user) THEN
      RAISE EXCEPTION 'Personen är redan medlem i organisationen' USING ERRCODE = '23505';
    END IF;
    INSERT INTO organization_members (org_id, user_id, role) VALUES (target_org, target_user, NEW.role);
    RETURN NEW;
  END IF;

  -- UPDATE / DELETE
  IF target_user = caller THEN
    RAISE EXCEPTION 'Du kan inte ändra eller ta bort ditt eget medlemskap' USING ERRCODE = '42501';
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NEW.role NOT IN ('handlaggare', 'konsulent', 'chef', 'admin') THEN
      RAISE EXCEPTION 'Okänd roll' USING ERRCODE = '22023';
    END IF;
    IF (NEW.role = 'admin' OR target_role = 'admin') AND caller_role <> 'admin' THEN
      RAISE EXCEPTION 'Bara en administratör kan ge eller ta bort rollen administratör' USING ERRCODE = '42501';
    END IF;
    IF target_role IN ('chef', 'admin') AND NEW.role NOT IN ('chef', 'admin') THEN
      SELECT count(*) INTO ledning_kvar FROM organization_members m
      WHERE m.org_id = target_org AND m.role IN ('chef', 'admin') AND m.id <> OLD.id;
      IF ledning_kvar = 0 THEN
        RAISE EXCEPTION 'Organisationen måste ha minst en chef eller administratör kvar' USING ERRCODE = '23514';
      END IF;
    END IF;
    UPDATE organization_members SET role = NEW.role WHERE id = OLD.id;
    RETURN NEW;
  END IF;

  -- DELETE
  IF target_role = 'admin' AND caller_role <> 'admin' THEN
    RAISE EXCEPTION 'Bara en administratör kan ta bort en administratör' USING ERRCODE = '42501';
  END IF;
  IF target_role IN ('chef', 'admin') THEN
    SELECT count(*) INTO ledning_kvar FROM organization_members m
    WHERE m.org_id = target_org AND m.role IN ('chef', 'admin') AND m.id <> OLD.id;
    IF ledning_kvar = 0 THEN
      RAISE EXCEPTION 'Organisationen måste ha minst en chef eller administratör kvar' USING ERRCODE = '23514';
    END IF;
  END IF;
  DELETE FROM organization_members WHERE id = OLD.id;
  RETURN OLD;
END;
$function$;

-- Inte anropbar direkt av någon roll. Triggern avfyras ändå (uppmätt).
REVOKE ALL ON FUNCTION public.organization_colleagues_iud() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_organization_colleagues_iud ON organization_colleagues;
CREATE TRIGGER trg_organization_colleagues_iud
  INSTEAD OF INSERT OR UPDATE OR DELETE ON organization_colleagues
  FOR EACH ROW EXECUTE FUNCTION public.organization_colleagues_iud();

GRANT INSERT, UPDATE, DELETE ON organization_colleagues TO authenticated;

COMMENT ON FUNCTION public.organization_colleagues_iud() IS
  'KM2: självbetjäning för chef/admin genom vyn organization_colleagues. SECURITY DEFINER utan EXECUTE för någon roll — nås bara som INSTEAD OF-trigger.';

-- VERIFIERING (som authenticated i rullad-tillbaka transaktion):
--   chef: insert into organization_colleagues (org_id, email, role) → 1 rad
--   chef: samma e-post igen → 23505
--   chef: e-post som saknas → P0002
--   chef: role admin → 42501 (bara admin)
--   konsulent: insert → 42501
--   chef: delete sig själv → 42501; delete sista chefen → 23514
--   utomstående: insert → 42501
--   select has_function_privilege('authenticated', 'organization_colleagues_iud()', 'EXECUTE') → false
