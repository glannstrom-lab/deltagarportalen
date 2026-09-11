-- KM8 — aktivitetskatalog: kommunens utbud av gruppaktiviteter (jobbsökarverkstad,
-- språkcafé, hälsogrupp …) med plats och tider, som schemamallarna hämtar rader ur.
--
-- Bakgrund: lagen (SoL 12 kap. 4 a §) ålägger kommunen att TILLHANDAHÅLLA
-- aktiviteter. Katalogen är vad kommunen erbjuder; en schemamall är hur en
-- deltagares vecka sätts ihop av det. Praktikplatser (lagens typ 4) finns redan
-- i consultant_work_placements och dubbleras INTE här — katalogen är för det
-- som återkommer på samma tid och plats för flera deltagare.
--
-- org_id NULL = konsulentens egen, personliga katalog (owner_id). Med org_id
-- delas posten med hela organisationen; chef/admin skriver, medlemmar läser.
--
-- RLS-VARNING (lärdom 2026-09-11, 42P17): en policy får ALDRIG referera sin
-- egen tabell. Referenser till organization_members är OK — dess policyer är
-- "egna rader" + superadmin sedan 20260911160000, utan självreferens.
--
-- Kör:   npx supabase db query --linked -f supabase/migrations/20260911200000_km8_aktivitetskatalog.sql
-- Sedan: cd client && npm run schema:refresh && npm run grants:refresh
-- Verifiera (längst ned) INNAN snapshoten committas.

CREATE TABLE IF NOT EXISTS activity_catalog_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  -- Lagens fyra typer + eget jobbsökande, samma CHECK som activity_template_items.
  activity_type text NOT NULL CHECK (activity_type IN ('motivation', 'language', 'jobsearch', 'workplace', 'jobsearch_own')),
  description text,
  location text,
  weekday smallint CHECK (weekday IS NULL OR weekday BETWEEN 1 AND 7), -- ISO: 1 = måndag
  start_time time,
  end_time time,
  capacity integer CHECK (capacity IS NULL OR capacity > 0),
  contact text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  -- Tid utan dag, eller dag utan tid, är tillåtet (t.ex. "drop-in tisdagar").
  -- Men finns båda tiderna ska slutet ligga efter starten.
  CHECK (start_time IS NULL OR end_time IS NULL OR end_time > start_time)
);

CREATE INDEX IF NOT EXISTS idx_activity_catalog_org ON activity_catalog_items(org_id);
CREATE INDEX IF NOT EXISTS idx_activity_catalog_owner ON activity_catalog_items(owner_id);

ALTER TABLE activity_catalog_items ENABLE ROW LEVEL SECURITY;

-- Ägaren gör allt med sina egna poster (personlig katalog eller egna org-poster).
CREATE POLICY "Ägaren hanterar sina katalogposter"
  ON activity_catalog_items FOR ALL
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Medlemmar i organisationen läser organisationens katalog.
CREATE POLICY "Medlemmar läser organisationens katalog"
  ON activity_catalog_items FOR SELECT
  USING (
    org_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM organization_members m
      WHERE m.org_id = activity_catalog_items.org_id AND m.user_id = auth.uid()
    )
  );

-- Chef/admin i organisationen skriver i organisationens katalog — tre
-- policyer (INSERT/UPDATE/DELETE) i stället för FOR ALL, så SELECT-rätten
-- ovan förblir den enda läsvägen och läses för sig.
CREATE POLICY "Chef skapar katalogposter i organisationen"
  ON activity_catalog_items FOR INSERT
  WITH CHECK (
    org_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM organization_members m
      WHERE m.org_id = activity_catalog_items.org_id
        AND m.user_id = auth.uid()
        AND m.role IN ('chef', 'admin')
    )
  );

CREATE POLICY "Chef ändrar katalogposter i organisationen"
  ON activity_catalog_items FOR UPDATE
  USING (
    org_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM organization_members m
      WHERE m.org_id = activity_catalog_items.org_id
        AND m.user_id = auth.uid()
        AND m.role IN ('chef', 'admin')
    )
  )
  WITH CHECK (
    org_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM organization_members m
      WHERE m.org_id = activity_catalog_items.org_id
        AND m.user_id = auth.uid()
        AND m.role IN ('chef', 'admin')
    )
  );

CREATE POLICY "Chef tar bort katalogposter i organisationen"
  ON activity_catalog_items FOR DELETE
  USING (
    org_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM organization_members m
      WHERE m.org_id = activity_catalog_items.org_id
        AND m.user_id = auth.uid()
        AND m.role IN ('chef', 'admin')
    )
  );

CREATE POLICY "Superadmin hanterar katalogen"
  ON activity_catalog_items FOR ALL
  USING (is_admin_or_superadmin())
  WITH CHECK (is_admin_or_superadmin());

DROP TRIGGER IF EXISTS trg_activity_catalog_items_updated_at ON activity_catalog_items;
CREATE TRIGGER trg_activity_catalog_items_updated_at
  BEFORE UPDATE ON activity_catalog_items
  FOR EACH ROW EXECUTE FUNCTION update_consultant_updated_at();

COMMENT ON TABLE activity_catalog_items IS
  'KM8: kommunens (org_id) eller konsulentens egen (org_id NULL) katalog över gruppaktiviteter. Schemamallar hämtar rader härifrån. Inga personuppgifter.';

-- =============================================================================
-- VERIFIERING — kör efter körningen. Förväntat svar står vid varje fråga.
-- =============================================================================
-- 1. RLS på och sex policyer:
-- npx supabase db query --linked "select rowsecurity from pg_tables where tablename='activity_catalog_items';" --output table
--   → true
-- npx supabase db query --linked "select count(*) from pg_policies where tablename='activity_catalog_items';" --output table
--   → 6
--
-- 2. Som authenticated i en rullad-tillbaka transaktion (byt UUID:erna mot
--    två riktiga konsulenter, A = chef i org, B = konsulent i samma org, C = utomstående):
-- begin;
-- insert into organizations (id, name, kind) values ('00000000-0000-0000-0000-00000000aa08','KM8-test','kommun');
-- insert into organization_members (org_id, user_id, role) values
--   ('00000000-0000-0000-0000-00000000aa08', '<A>', 'chef'),
--   ('00000000-0000-0000-0000-00000000aa08', '<B>', 'konsulent');
-- insert into activity_catalog_items (org_id, owner_id, title, activity_type) values
--   ('00000000-0000-0000-0000-00000000aa08', '<A>', 'Språkcafé', 'language');
-- insert into activity_catalog_items (org_id, owner_id, title, activity_type) values
--   (null, '<B>', 'Min egen verkstad', 'jobsearch');
-- select set_config('request.jwt.claims', json_build_object('sub','<B>','role','authenticated')::text, true);
-- set local role authenticated;
-- select 'B_ser' as t, count(*) from activity_catalog_items;            → 2 (org-posten + sin egen)
-- update activity_catalog_items set title = 'x' where title = 'Språkcafé';
-- select 'B_andrade_org' as t, count(*) from activity_catalog_items where title = 'x';   → 0 (konsulent får inte skriva i org-katalogen)
-- rollback;
--
-- begin; (samma insert som ovan)
-- select set_config('request.jwt.claims', json_build_object('sub','<A>','role','authenticated')::text, true);
-- set local role authenticated;
-- update activity_catalog_items set title = 'x' where title = 'Språkcafé';
-- select 'A_andrade_org' as t, count(*) from activity_catalog_items where title = 'x';   → 1 (chef får)
-- select 'A_ser_B_egen' as t, count(*) from activity_catalog_items where title = 'Min egen verkstad';  → 0
-- rollback;
--
-- begin; (samma insert som ovan)
-- select set_config('request.jwt.claims', json_build_object('sub','<C>','role','authenticated')::text, true);
-- set local role authenticated;
-- select 'C_ser' as t, count(*) from activity_catalog_items;            → 0
-- rollback;
--
-- 3. Ingen 42P17 i någon av frågorna ovan — det är själva poängen.
