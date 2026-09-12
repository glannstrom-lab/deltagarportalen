-- PG19 / F13 (persona-genomgång 2026-09-12): chefen kan inte själv slå av eller på
-- organisationens AI-brytare. Mätt i prod: organizations har bara två policyer —
-- "Medlem ser sin organisation" (SELECT) och "Superadmin hanterar organisationer"
-- (ALL). Ingen INSTEAD OF-vy, ingen definer-funktion rör organizations.ai_enabled;
-- pass 8 byggde grinden (_shared/aiGate.ts checkOrgAiEnabled + my_ai_policy) men
-- skrivvägen blev SQL för Mikael.
--
-- **EJ KÖRD — väntar på Mikaels ja** (migration mot prod). Bevisad i rullad-tillbaka
-- transaktion: e2e/pg19-ai-brytare-prov.sql.
--
-- Lösning utan ny vy (lint:schema känner bara snapshoten, och en ny vy före
-- körning hade fällt grinden): en UPDATE-policy på organizations för chef/admin i
-- organisationen, plus en BEFORE UPDATE-trigger som ser till att en chef bara kan
-- ändra ai_enabled — namn, kind, org_number och is_demo är superadmins. RLS kan inte
-- begränsa kolumner; triggern gör det. Permissiva policyer OR:as (lärdom 2026-08-04),
-- så superadmins ALL-policy fortsätter gälla oförändrad.
--
-- Efteråt: cd client && npm run schema:refresh && npm run grants:refresh
-- (ingen ny anropbar definer-funktion: triggerfunktionen är invoker och har
-- REVOKE EXECUTE — precis som activity_sessions_participant_guard).

CREATE OR REPLACE FUNCTION public.organizations_chef_guard()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Superadmin/admin får ändra allt (deras egen policy släpper dem igenom).
  IF is_admin_or_superadmin() THEN
    RETURN NEW;
  END IF;
  -- Alla andra som RLS släppt igenom är chef/admin i organisationen och får
  -- ändra EN kolumn: ai_enabled. updated_at sätts av trg_organizations_updated_at.
  IF NEW.name IS DISTINCT FROM OLD.name
     OR NEW.kind IS DISTINCT FROM OLD.kind
     OR NEW.org_number IS DISTINCT FROM OLD.org_number
     OR NEW.is_demo IS DISTINCT FROM OLD.is_demo
     OR NEW.id IS DISTINCT FROM OLD.id
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Chef får bara ändra organisationens AI-brytare' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.organizations_chef_guard() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_organizations_chef_guard ON organizations;
CREATE TRIGGER trg_organizations_chef_guard
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION public.organizations_chef_guard();

DROP POLICY IF EXISTS "Chef ändrar sin organisations AI-brytare" ON organizations;
CREATE POLICY "Chef ändrar sin organisations AI-brytare" ON organizations
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members m
      WHERE m.org_id = organizations.id AND m.user_id = auth.uid() AND m.role IN ('chef', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members m
      WHERE m.org_id = organizations.id AND m.user_id = auth.uid() AND m.role IN ('chef', 'admin')
    )
  );

COMMENT ON TRIGGER trg_organizations_chef_guard ON organizations IS
  'PG19: chef/admin i organisationen får (via policyn ovan) uppdatera raden, men triggern tillåter bara ai_enabled. Övriga kolumner är superadmins.';

-- VERIFIERING (e2e/pg19-ai-brytare-prov.sql, rullas alltid tillbaka):
--   chef:      update organizations set ai_enabled = false where id = <org>   → 1 rad
--   chef:      update organizations set name = 'x' where id = <org>           → 42501
--   konsulent: update organizations set ai_enabled = false where id = <org>   → 0 rader (RLS)
--   utomstående: samma → 0 rader
--   select has_function_privilege('authenticated', 'organizations_chef_guard()', 'EXECUTE') → false
