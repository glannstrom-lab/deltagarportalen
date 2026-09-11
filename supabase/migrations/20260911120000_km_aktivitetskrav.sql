-- KM2 (minimum) + KM3 + KM4 + KM6 — aktivitetskravet i försörjningsstödet.
--
-- Bakgrund: prop. 2025/26:207, SoL (2025:400) 12 kap. 4 a–6 a §§, SFS 2026:730.
-- Kommunen ska från oktober 2026 anvisa aktivitet (max 40 h/vecka, −10 h vid
-- barn under 8), upprätta individuell plan, följa närvaro och rapportera
-- kvartalsvis till IVO. Underlag: artifakten "Jobin och aktivitetskravet"
-- (2026-09-11) och ROADMAP.md spår KM.
--
-- Vad den här migrationen gör:
--   1. organizations + organization_members (KM2, minimum — bara datamodell
--      och läsrätt; chefsvy och inbjudan kommer i egen post)
--   2. activity_templates + activity_template_items (KM3, schemamallar —
--      speglar consultant_goal_templates: is_public/is_starred/usage_count)
--   3. activity_plans (individuell plan per deltagare, veckomål i timmar)
--   4. activity_sessions (ett pass per rad, genererat ur mallen; närvaro med
--      giltig/ogiltig frånvaro, läkarintyg, deltagarens egen incheckning — KM4)
--
-- Vad den INTE gör: rör ingen befintlig tabell eller policy. calendar_events
-- lämnas orörd — deltagarens "Min vecka" läser activity_sessions direkt.
-- Ingen ny SECURITY DEFINER-funktion (lint:grants har fryst tak 26 för
-- authenticated); deltagarens incheckning vaktas av en vanlig trigger.
--
-- RLS-mönster: samma som AG1 (20260831130000_ag1_work_placements.sql) —
-- konsulenten når bara deltagare med en AKTIV rad i consultant_participants,
-- deltagaren läser sina egna rader. Organisationens chef/admin läser
-- organisationens rader (KM2-golvet); inre sekretess (handläggare ser
-- närvaro men inte journal) ligger i att journal/mående/dagbok INTE får
-- någon org-policy här — bara de fyra nya tabellerna.
--
-- Kör:   npx supabase db query --linked -f supabase/migrations/20260911120000_km_aktivitetskrav.sql
-- Sedan: cd client && npm run schema:refresh && npm run grants:refresh
-- Verifiera (längst ned) innan snapshoten committas.

-- =============================================================================
-- 1. Organisationer (KM2, minimum)
-- =============================================================================

CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('kommun', 'leverantor', 'annan')),
  org_number text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('handlaggare', 'konsulent', 'chef', 'admin')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_org_members_user ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org ON organization_members(org_id);

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- Medlem ser sin organisation och dess medlemmar. Inga INSERT/UPDATE-policyer
-- för authenticated ännu: organisationer och medlemskap skapas av superadmin
-- (service role) tills KM2:s inbjudningsflöde finns. Fail closed.
CREATE POLICY "Medlem ser sin organisation"
  ON organizations FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM organization_members m
    WHERE m.org_id = organizations.id AND m.user_id = auth.uid()
  ));

CREATE POLICY "Medlem ser organisationens medlemmar"
  ON organization_members FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM organization_members m
    WHERE m.org_id = organization_members.org_id AND m.user_id = auth.uid()
  ));

DROP TRIGGER IF EXISTS trg_organizations_updated_at ON organizations;
CREATE TRIGGER trg_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_consultant_updated_at();

COMMENT ON TABLE organizations IS
  'Kommun eller leverantör som konsulenter tillhör (KM2). Skapas av superadmin tills inbjudningsflödet finns.';

-- =============================================================================
-- 2. Schemamallar (KM3)
-- =============================================================================

CREATE TABLE IF NOT EXISTS activity_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  is_public boolean NOT NULL DEFAULT false,
  is_starred boolean NOT NULL DEFAULT false,
  usage_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Lagens fyra aktivitetstyper (12 kap. 6 a §) + eget jobbsökande, som ska ha
-- tid i planen men INTE räknas som anvisad aktivitet.
CREATE TABLE IF NOT EXISTS activity_template_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES activity_templates(id) ON DELETE CASCADE,
  weekday smallint NOT NULL CHECK (weekday BETWEEN 1 AND 7), -- ISO: 1 = måndag
  start_time time NOT NULL,
  end_time time NOT NULL CHECK (end_time > start_time),
  title text NOT NULL,
  activity_type text NOT NULL CHECK (activity_type IN ('motivation', 'language', 'jobsearch', 'workplace', 'jobsearch_own')),
  location text,
  notes text,
  sort_order smallint NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_activity_templates_owner ON activity_templates(owner_id);
CREATE INDEX IF NOT EXISTS idx_activity_template_items_template ON activity_template_items(template_id);

ALTER TABLE activity_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_template_items ENABLE ROW LEVEL SECURITY;

-- Ägaren gör allt. Publika mallar och organisationens mallar går att läsa.
CREATE POLICY "Ägaren hanterar sina schemamallar"
  ON activity_templates FOR ALL
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Publika och organisationens schemamallar går att läsa"
  ON activity_templates FOR SELECT
  USING (
    is_public = true
    OR (org_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM organization_members m
      WHERE m.org_id = activity_templates.org_id AND m.user_id = auth.uid()
    ))
  );

-- Raderna följer mallen: läsbar mall → läsbara rader; ägd mall → skrivbara rader.
CREATE POLICY "Mallens rader läses med mallen"
  ON activity_template_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM activity_templates t WHERE t.id = template_id
  ));

CREATE POLICY "Ägaren hanterar mallens rader"
  ON activity_template_items FOR ALL
  USING (EXISTS (
    SELECT 1 FROM activity_templates t WHERE t.id = template_id AND t.owner_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM activity_templates t WHERE t.id = template_id AND t.owner_id = auth.uid()
  ));

DROP TRIGGER IF EXISTS trg_activity_templates_updated_at ON activity_templates;
CREATE TRIGGER trg_activity_templates_updated_at
  BEFORE UPDATE ON activity_templates
  FOR EACH ROW EXECUTE FUNCTION update_consultant_updated_at();

COMMENT ON TABLE activity_templates IS
  'Schemamall för aktivitet (KM3): en veckas pass som tillämpas på en deltagare. Inga personuppgifter här — det personliga bor i activity_plans.';

-- =============================================================================
-- 3. Individuell plan (KM3/KM5)
-- =============================================================================

CREATE TABLE IF NOT EXISTS activity_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consultant_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
  template_id uuid REFERENCES activity_templates(id) ON DELETE SET NULL,
  template_name text,
  start_date date NOT NULL,
  end_date date,
  -- Lagens tak 40 h/vecka, −10 h vid barn under 8 år, lägre vid deltid.
  weekly_hours_target numeric(4,1) NOT NULL DEFAULT 40 CHECK (weekly_hours_target >= 0 AND weekly_hours_target <= 40),
  jobsearch_hours_per_week numeric(4,1) NOT NULL DEFAULT 0 CHECK (jobsearch_hours_per_week >= 0),
  target_reason text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'ended')),
  plan_text text,
  decided_at date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_activity_plans_participant ON activity_plans(participant_id);
CREATE INDEX IF NOT EXISTS idx_activity_plans_consultant ON activity_plans(consultant_id);

ALTER TABLE activity_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deltagaren ser sin aktivitetsplan"
  ON activity_plans FOR SELECT
  USING (participant_id = auth.uid());

CREATE POLICY "Konsulent har access till aktiva deltagares aktivitetsplan"
  ON activity_plans FOR ALL
  USING (
    consultant_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM consultant_participants cp
      WHERE cp.consultant_id = auth.uid()
        AND cp.participant_id = activity_plans.participant_id
    )
  )
  WITH CHECK (
    consultant_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM consultant_participants cp
      WHERE cp.consultant_id = auth.uid()
        AND cp.participant_id = activity_plans.participant_id
    )
  );

-- KM2-golvet: chef/admin i samma organisation läser planer (inte journal).
CREATE POLICY "Organisationens chef läser planer"
  ON activity_plans FOR SELECT
  USING (
    org_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM organization_members m
      WHERE m.org_id = activity_plans.org_id
        AND m.user_id = auth.uid()
        AND m.role IN ('chef', 'admin')
    )
  );

DROP TRIGGER IF EXISTS trg_activity_plans_updated_at ON activity_plans;
CREATE TRIGGER trg_activity_plans_updated_at
  BEFORE UPDATE ON activity_plans
  FOR EACH ROW EXECUTE FUNCTION update_consultant_updated_at();

COMMENT ON TABLE activity_plans IS
  'Individuell plan för aktivitet enligt SoL 12 kap. (KM3/KM5). Veckomålet föreslås 40/30 h, alltid redigerbart med motivering i target_reason.';

-- =============================================================================
-- 4. Pass + närvaro (KM3/KM4)
-- =============================================================================

CREATE TABLE IF NOT EXISTS activity_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES activity_plans(id) ON DELETE CASCADE,
  participant_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL CHECK (end_time > start_time),
  title text NOT NULL,
  activity_type text NOT NULL CHECK (activity_type IN ('motivation', 'language', 'jobsearch', 'workplace', 'jobsearch_own')),
  location text,
  notes text,
  -- Närvaro sätts BARA av konsulenten. NULL = inte markerad ännu.
  attendance text CHECK (attendance IN ('present', 'absent_valid', 'absent_invalid', 'sick_certified', 'external')),
  attendance_note text,
  sick_certificate_received boolean NOT NULL DEFAULT false,
  marked_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  marked_at timestamptz,
  -- Deltagarens egen incheckning — en redovisning, inte ett beslut.
  self_checkin_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_sessions_plan ON activity_sessions(plan_id);
CREATE INDEX IF NOT EXISTS idx_activity_sessions_participant_date ON activity_sessions(participant_id, date);

ALTER TABLE activity_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deltagaren ser sina pass"
  ON activity_sessions FOR SELECT
  USING (participant_id = auth.uid());

-- Deltagaren får UPPDATERA sina pass, men triggern nedan släpper bara igenom
-- self_checkin_at. Utan triggern hade den här policyn låtit deltagaren sätta
-- sin egen närvaro — det är triggern som är spärren, inte policyn.
CREATE POLICY "Deltagaren checkar in på sina pass"
  ON activity_sessions FOR UPDATE
  USING (participant_id = auth.uid())
  WITH CHECK (participant_id = auth.uid());

CREATE POLICY "Konsulent har access till aktiva deltagares pass"
  ON activity_sessions FOR ALL
  USING (EXISTS (
    SELECT 1 FROM activity_plans p
    JOIN consultant_participants cp
      ON cp.consultant_id = p.consultant_id AND cp.participant_id = p.participant_id
    WHERE p.id = activity_sessions.plan_id AND p.consultant_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM activity_plans p
    JOIN consultant_participants cp
      ON cp.consultant_id = p.consultant_id AND cp.participant_id = p.participant_id
    WHERE p.id = activity_sessions.plan_id AND p.consultant_id = auth.uid()
  ));

CREATE POLICY "Organisationens chef läser pass"
  ON activity_sessions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM activity_plans p
    JOIN organization_members m ON m.org_id = p.org_id
    WHERE p.id = activity_sessions.plan_id
      AND m.user_id = auth.uid()
      AND m.role IN ('chef', 'admin')
  ));

-- Triggern: en deltagare (inte planens konsulent) får bara ändra
-- self_checkin_at. Allt annat på raden måste vara oförändrat, annars fel.
-- Vanlig trigger (SECURITY INVOKER) — ingen ny definer-funktion, inget grant.
CREATE OR REPLACE FUNCTION public.activity_sessions_participant_guard()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  is_plan_consultant boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.activity_plans p
    WHERE p.id = OLD.plan_id AND p.consultant_id = auth.uid()
  ) INTO is_plan_consultant;

  IF is_plan_consultant THEN
    RETURN NEW;
  END IF;

  IF auth.uid() = OLD.participant_id THEN
    IF (to_jsonb(OLD) - 'self_checkin_at' - 'updated_at') IS DISTINCT FROM (to_jsonb(NEW) - 'self_checkin_at' - 'updated_at') THEN
      RAISE EXCEPTION 'Deltagaren får bara ändra sin egen incheckning' USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
  END IF;

  -- Vare sig konsulent eller deltagare (t.ex. chef via SELECT-policy försöker
  -- skriva): fail closed.
  RAISE EXCEPTION 'Ingen skrivrätt på passet' USING ERRCODE = '42501';
END;
$function$;

DROP TRIGGER IF EXISTS trg_activity_sessions_participant_guard ON activity_sessions;
CREATE TRIGGER trg_activity_sessions_participant_guard
  BEFORE UPDATE ON activity_sessions
  FOR EACH ROW EXECUTE FUNCTION public.activity_sessions_participant_guard();

DROP TRIGGER IF EXISTS trg_activity_sessions_updated_at ON activity_sessions;
CREATE TRIGGER trg_activity_sessions_updated_at
  BEFORE UPDATE ON activity_sessions
  FOR EACH ROW EXECUTE FUNCTION update_consultant_updated_at();

COMMENT ON TABLE activity_sessions IS
  'Ett pass per rad ur planen (KM3) med närvaro satt av konsulenten (KM4). attendance NULL = inte markerad. Deltagaren kan bara sätta self_checkin_at (trigger).';

-- =============================================================================
-- VERIFIERING — kör efter körningen. Förväntat svar står vid varje rad.
-- =============================================================================
-- npx supabase db query --linked "select tablename, rowsecurity from pg_tables where tablename in ('organizations','organization_members','activity_templates','activity_template_items','activity_plans','activity_sessions') order by 1;" --output table
--   → 6 rader, rowsecurity = t på alla
-- npx supabase db query --linked "select tablename, count(*) from pg_policies where tablename like 'activity_%' or tablename like 'organization%' group by 1 order by 1;" --output table
--   → activity_plans 3, activity_sessions 4, activity_template_items 2, activity_templates 2, organization_members 1, organizations 1
-- npx supabase db query --linked "select proname, prosecdef from pg_proc where proname = 'activity_sessions_participant_guard';" --output table
--   → prosecdef = f (INTE definer)
