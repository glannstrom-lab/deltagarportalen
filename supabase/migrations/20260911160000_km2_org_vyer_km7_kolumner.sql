-- KM2 (organisation, steg 2) + KM7 (IVO-underlag, kolumner).
--
-- VARFÖR DEN HÄR MIGRATIONEN FINNS — ett fel i den förra:
-- 20260911120000 skapade policyn "Medlem ser organisationens medlemmar" på
-- organization_members med en subfråga mot organization_members själv. Postgres
-- svarar då `42P17: infinite recursion detected in policy` på VARJE läsning av
-- tabellen som inloggad användare. Uppmätt 2026-09-11 i en rullad-tillbaka
-- transaktion med `set local role authenticated` — tabellen var obrukbar för
-- alla utom superadmin (som går via is_admin_or_superadmin(), en definer-funktion
-- som inte läser under RLS). Noll rader fanns, så ingen drabbades.
--
-- Lösning utan ny SECURITY DEFINER-funktion (lint:grants har fryst tak för
-- authenticated, och taket är nått):
--   1. organization_members får en policy som INTE refererar sig själv:
--      användaren ser sina egna medlemsrader. Superadmin hanterar allt.
--   2. Kollegor och chefens caseload läses genom två VYER ägda av postgres
--      UTAN security_invoker — de körs med ägarens rättigheter, förbi RLS, och
--      filtrerar själva på auth.uid(). Det är samma klass som en definer-funktion
--      och kräver samma disciplin: varje rad i vyn måste vara gated på att den
--      inloggade är medlem (kollegor) respektive chef/admin (caseload) i just
--      den organisationen. Läs filtret innan du ändrar vyn.
--      (consultant_dashboard_participants har security_invoker=true; de här två
--      har det MEDVETET inte — det är hela poängen.)
--   3. activity_plans får två KM7-kolumner: försörjningshinder (kategori) och
--      datum då underlag till nedsättning lämnats till handläggaren.
--
-- Kör:   npx supabase db query --linked -f supabase/migrations/20260911160000_km2_org_vyer_km7_kolumner.sql
-- Sedan: cd client && npm run schema:refresh && npm run grants:refresh

-- =============================================================================
-- 1. Icke-rekursiva policyer
-- =============================================================================

DROP POLICY IF EXISTS "Medlem ser organisationens medlemmar" ON organization_members;

CREATE POLICY "Användaren ser sina egna medlemskap"
  ON organization_members FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Superadmin hanterar medlemskap"
  ON organization_members FOR ALL
  USING (is_admin_or_superadmin())
  WITH CHECK (is_admin_or_superadmin());

CREATE POLICY "Superadmin hanterar organisationer"
  ON organizations FOR ALL
  USING (is_admin_or_superadmin())
  WITH CHECK (is_admin_or_superadmin());

-- "Medlem ser sin organisation" (organizations, SELECT) står kvar: dess
-- subfråga går mot organization_members, som nu har en policy utan
-- självreferens — ingen rekursion. Samma sak gäller "Organisationens chef
-- läser planer/pass" på activity_plans/activity_sessions och org-policyn på
-- activity_templates.

-- =============================================================================
-- 2. Vyer (ägare postgres, INTE security_invoker — se huvudet)
-- =============================================================================

-- Kollegorna i de organisationer jag själv är medlem i, med namn ur profiles.
-- E-post tas med: konsulenterna i en kommun ska kunna nå varandra. Deltagare
-- är aldrig medlemmar, så inga deltagaruppgifter passerar här.
CREATE OR REPLACE VIEW organization_colleagues AS
  SELECT
    m.id,
    m.org_id,
    o.name        AS org_name,
    o.kind        AS org_kind,
    m.user_id,
    m.role,
    m.created_at,
    p.first_name,
    p.last_name,
    p.email
  FROM organization_members m
  JOIN organizations o ON o.id = m.org_id
  JOIN profiles p ON p.id = m.user_id
  WHERE EXISTS (
    SELECT 1 FROM organization_members me
    WHERE me.org_id = m.org_id AND me.user_id = auth.uid()
  );

-- Chefens caseload: en rad per konsulent i organisationer där jag är chef eller
-- admin. Bara tal — inga deltagarnamn, ingen journal. Talen:
--   antal_deltagare        aktiva kopplingar (consultant_participants)
--   antal_aktiva_planer    activity_plans med status active
--   ogiltig_franvaro_30d   pass med attendance = absent_invalid senaste 30 dagarna
CREATE OR REPLACE VIEW organization_caseload AS
  SELECT
    m.org_id,
    o.name AS org_name,
    m.user_id AS consultant_id,
    m.role,
    p.first_name,
    p.last_name,
    (SELECT count(*) FROM consultant_participants cp WHERE cp.consultant_id = m.user_id)::int AS antal_deltagare,
    (SELECT count(*) FROM activity_plans ap WHERE ap.consultant_id = m.user_id AND ap.status = 'active')::int AS antal_aktiva_planer,
    (SELECT count(*) FROM activity_sessions s
       JOIN activity_plans ap ON ap.id = s.plan_id
      WHERE ap.consultant_id = m.user_id
        AND s.attendance = 'absent_invalid'
        AND s.date >= current_date - 30)::int AS ogiltig_franvaro_30d
  FROM organization_members m
  JOIN organizations o ON o.id = m.org_id
  JOIN profiles p ON p.id = m.user_id
  WHERE m.role IN ('konsulent', 'handlaggare', 'chef', 'admin')
    AND EXISTS (
      SELECT 1 FROM organization_members me
      WHERE me.org_id = m.org_id
        AND me.user_id = auth.uid()
        AND me.role IN ('chef', 'admin')
    );

ALTER VIEW organization_colleagues OWNER TO postgres;
ALTER VIEW organization_caseload OWNER TO postgres;
REVOKE ALL ON organization_colleagues FROM PUBLIC, anon;
REVOKE ALL ON organization_caseload FROM PUBLIC, anon;
GRANT SELECT ON organization_colleagues TO authenticated;
GRANT SELECT ON organization_caseload TO authenticated;

COMMENT ON VIEW organization_colleagues IS
  'KM2: medlemmar i mina organisationer. Körs med ägarens rättigheter (ingen security_invoker) för att undvika RLS-rekursion — filtret på auth.uid() ÄR skyddet.';
COMMENT ON VIEW organization_caseload IS
  'KM2: caseload per konsulent för chef/admin i samma organisation. Bara tal, inga deltagaruppgifter. Körs med ägarens rättigheter — filtret på auth.uid() + roll ÄR skyddet.';

-- =============================================================================
-- 3. KM7-kolumner på planen
-- =============================================================================

-- Försörjningshinder enligt kategorierna i Socialstyrelsens register över
-- ekonomiskt bistånd (den indelning IVO:s kvartalsrapport ska fördelas på).
-- 'annat' finns för det registret kallar övrigt/okänt. Fritext undviks med flit:
-- underlaget ska gå att räkna.
ALTER TABLE activity_plans
  ADD COLUMN IF NOT EXISTS forsorjningshinder text
    CHECK (forsorjningshinder IS NULL OR forsorjningshinder IN (
      'arbetslos',
      'sjukskriven_med_intyg',
      'sjuk_eller_aktivitetsersattning',
      'arbetshinder_sociala_skal',
      'foraldraledig',
      'arbetar_deltid',
      'sprakhinder',
      'utan_forsorjningshinder',
      'annat'
    )),
  ADD COLUMN IF NOT EXISTS nedsattning_underlag_lamnat_at date;

COMMENT ON COLUMN activity_plans.forsorjningshinder IS
  'KM7: kategori enligt Socialstyrelsens register över ekonomiskt bistånd. Används i IVO-kvartalsunderlaget.';
COMMENT ON COLUMN activity_plans.nedsattning_underlag_lamnat_at IS
  'KM7: datum då konsulenten lämnat avvikelseunderlag till biståndshandläggaren. Beslutet fattas av socialnämnden, inte här.';

-- =============================================================================
-- VERIFIERING — kör som authenticated i en rullad-tillbaka transaktion:
--   begin; insert org + medlem; set local role authenticated; set_config(...);
--   select count(*) from organization_members;   → 1, INTE 42P17
--   select count(*) from organization_colleagues; → 1
--   rollback;
-- =============================================================================
