-- AG6 + AG7 + AG8 (2026-09-13): företagskontot som ORGANISATIONSTYP, inte som roll.
--
-- Beslut Mikael 2026-09-13 ("kör, gå på de föreslagna besluten"):
--   1. Företaget är en organisation av slaget `arbetsgivare` i `organizations`,
--      med medlemsrollen `arbetsgivare`. Företagets personer är vanliga USER på
--      profilnivå — ingen av de 20 policyer som nämner en profilroll berörs, och
--      inbjudan, medlemskap, AI-brytare och demobanner ärvs från KM2.
--   2. Ingen direktkontakt företag → deltagare i etapp 1. Meddelanden går per
--      förslag mellan företaget och konsulenten (employer_messages).
--   3. Tre företagssamtal före prissättning (AG9) — Mikaels egen punkt.
--
-- PREMISSER SOM FÖLL VID BYGGET (roadmap "Rättelser"):
--   * "Företaget äger sin plats i samma tabell som konsulentens platsflik" —
--     nej. consultant_work_placements.participant_id är NOT NULL: raden är en
--     PERSON PÅ EN PLATS, inte en ledig plats. Företagets platser får en egen
--     tabell, employer_places; konsulentens placering pekar på den (place_id).
--   * AG7 "utöka spontaneous_companies" — raderna är deltagarens privata
--     anteckningsbok (user_id NOT NULL). Företagets egen text bor i
--     employer_profiles; spontaneous_companies får bara kroken company_account_id.
--   * AG5:s guard stoppade VARJE ändring efter beslut utom tillbakadragning —
--     företagets svar och visningsräkningen hade fällts. Guarden är omskriven här.
--
-- VAD FÖRETAGET ALDRIG NÅR (strukturellt, inte via samtyckesruta):
--   * employer_share_proposals, consultant_work_placements, profiles, cvs läses
--     ALDRIG direkt. Företaget läser två VYER ägda av postgres med vitlistade
--     kolumner: employer_proposals (bara status=accepted, fält per show_*) och
--     employer_placements (bara platser med ett accepterat förslag).
--   * internal_adaptation_notes, employer_future_needs, employer_hiring_interest,
--     notes, participant_supervision_need, supervision_notes, ATS-poäng,
--     ai_summary, mående och dagbok finns inte i någon vy.
--   * Ett nej (status=declined) syns aldrig — vyn filtrerar på accepted.
--
-- INGA nya SECURITY DEFINER-funktioner som authenticated kan anropa: all
-- skrivning från företaget går via INSTEAD OF-triggers på vyerna (mönstret från
-- KM2 organization_colleagues), så lint:grants-taket (29, +1 för AG5) står.
--
-- Kör (AG5 FÖRST):
--   npx supabase db query --linked -f supabase/migrations/20260902100000_ag5_share_proposals.sql
--   npx supabase db query --linked -f supabase/migrations/20260913100000_ag6_foretagskonto.sql
-- Sedan: cd client && npm run schema:refresh && npm run grants:refresh

-- =============================================================================
-- 1. Organisationstyp och medlemsroll
-- =============================================================================

ALTER TABLE organizations DROP CONSTRAINT IF EXISTS organizations_kind_check;
ALTER TABLE organizations ADD CONSTRAINT organizations_kind_check
  CHECK (kind IN ('kommun', 'leverantor', 'annan', 'arbetsgivare'));

ALTER TABLE organization_members DROP CONSTRAINT IF EXISTS organization_members_role_check;
ALTER TABLE organization_members ADD CONSTRAINT organization_members_role_check
  CHECK (role IN ('handlaggare', 'konsulent', 'chef', 'admin', 'arbetsgivare'));

-- Rollen arbetsgivare finns bara i företagskonton, och ett företagskonto har bara
-- den rollen. Definer för att läsa organizations oavsett RLS (en ny medlem är
-- inte medlem än); EXECUTE återkallad — triggern avfyras ändå (KM2-mätningen).
CREATE OR REPLACE FUNCTION public.organization_members_kind_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $fn$
DECLARE v_kind text;
BEGIN
  SELECT kind INTO v_kind FROM organizations WHERE id = NEW.org_id;
  IF v_kind = 'arbetsgivare' AND NEW.role <> 'arbetsgivare' THEN
    RAISE EXCEPTION 'I ett företagskonto finns bara rollen arbetsgivare' USING ERRCODE = '23514';
  END IF;
  IF v_kind IS DISTINCT FROM 'arbetsgivare' AND NEW.role = 'arbetsgivare' THEN
    RAISE EXCEPTION 'Rollen arbetsgivare finns bara i företagskonton' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$fn$;
REVOKE ALL ON FUNCTION public.organization_members_kind_guard() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_organization_members_kind_guard ON organization_members;
CREATE TRIGGER trg_organization_members_kind_guard
  BEFORE INSERT OR UPDATE ON organization_members
  FOR EACH ROW EXECUTE FUNCTION public.organization_members_kind_guard();

-- Självbetjäning (KM2-triggern) får en företagsgren: en kontaktperson lägger
-- till och tar bort kollegor (bara rollen arbetsgivare), aldrig sig själv,
-- aldrig sista personen. Kommungrenen är oförändrad.
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
  v_kind text;
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

  SELECT o.kind INTO v_kind FROM organizations o WHERE o.id = target_org;

  -- ---- Företagskonto (AG6) ----
  IF v_kind = 'arbetsgivare' THEN
    IF caller_role IS DISTINCT FROM 'arbetsgivare' THEN
      RAISE EXCEPTION 'Bara företagets egna kontaktpersoner får ändra medlemmar' USING ERRCODE = '42501';
    END IF;
    IF TG_OP = 'INSERT' THEN
      IF NEW.role <> 'arbetsgivare' THEN
        RAISE EXCEPTION 'I ett företagskonto finns bara rollen arbetsgivare' USING ERRCODE = '22023';
      END IF;
      SELECT p.id INTO target_user FROM profiles p WHERE lower(p.email) = lower(trim(NEW.email));
      IF target_user IS NULL THEN
        RAISE EXCEPTION 'Ingen användare med e-posten %. Bjud in personen via "Bjud in kollega" så får hen ett mejl.', NEW.email USING ERRCODE = 'P0002';
      END IF;
      IF EXISTS (SELECT 1 FROM organization_members m WHERE m.org_id = target_org AND m.user_id = target_user) THEN
        RAISE EXCEPTION 'Personen är redan medlem i företagskontot' USING ERRCODE = '23505';
      END IF;
      INSERT INTO organization_members (org_id, user_id, role) VALUES (target_org, target_user, 'arbetsgivare');
      RETURN NEW;
    END IF;
    IF target_user = caller THEN
      RAISE EXCEPTION 'Du kan inte ändra eller ta bort ditt eget medlemskap' USING ERRCODE = '42501';
    END IF;
    IF TG_OP = 'UPDATE' THEN
      RAISE EXCEPTION 'Rollen kan inte ändras i ett företagskonto' USING ERRCODE = '42501';
    END IF;
    SELECT count(*) INTO ledning_kvar FROM organization_members m
    WHERE m.org_id = target_org AND m.id <> OLD.id;
    IF ledning_kvar = 0 THEN
      RAISE EXCEPTION 'Företagskontot måste ha minst en kontaktperson kvar' USING ERRCODE = '23514';
    END IF;
    DELETE FROM organization_members WHERE id = OLD.id;
    RETURN OLD;
  END IF;

  -- ---- Kommun/leverantör (KM2, oförändrat) ----
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
REVOKE ALL ON FUNCTION public.organization_colleagues_iud() FROM PUBLIC, anon, authenticated;

-- Hjälpare (inte definer, STABLE): "är jag med i det här företagskontot?"
CREATE OR REPLACE FUNCTION public.ar_foretagsmedlem(p_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $fn$
  SELECT EXISTS (
    SELECT 1 FROM organization_members m
    JOIN organizations o ON o.id = m.org_id
    WHERE m.org_id = p_org_id AND m.user_id = auth.uid() AND o.kind = 'arbetsgivare'
  );
$fn$;
REVOKE ALL ON FUNCTION public.ar_foretagsmedlem(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ar_foretagsmedlem(uuid) TO authenticated;

-- "är jag personal?" — samma uttryck som invitations-policyn använder.
CREATE OR REPLACE FUNCTION public.ar_personal()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $fn$
  SELECT EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role IN ('CONSULTANT', 'ADMIN', 'SUPERADMIN')
  );
$fn$;
REVOKE ALL ON FUNCTION public.ar_personal() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ar_personal() TO authenticated;

-- =============================================================================
-- 2. Företagsprofilen (AG7) — företagets egen text, en rad per konto
-- =============================================================================

CREATE TABLE IF NOT EXISTS employer_profiles (
  org_id uuid PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  description text,
  accepts_interns boolean,
  typical_needs text,
  website text,
  city text,
  industry text,
  employee_count text,
  company_data jsonb,
  updated_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE employer_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Företaget läser och skriver sin profil" ON employer_profiles
  FOR ALL USING (ar_foretagsmedlem(org_id)) WITH CHECK (ar_foretagsmedlem(org_id));
CREATE POLICY "Personal läser företagsprofiler" ON employer_profiles
  FOR SELECT USING (ar_personal());
DROP TRIGGER IF EXISTS trg_employer_profiles_updated_at ON employer_profiles;
CREATE TRIGGER trg_employer_profiles_updated_at
  BEFORE UPDATE ON employer_profiles FOR EACH ROW EXECUTE FUNCTION update_consultant_updated_at();
COMMENT ON TABLE employer_profiles IS 'AG7: företagets egen presentation. Bolagsverketdata i company_data. Deltagare läser den inte än (AG7-rest).';

-- Kroken AG7 pekade ut — deltagarens sparade företag kan senare kopplas till ett konto.
ALTER TABLE spontaneous_companies
  ADD COLUMN IF NOT EXISTS company_account_id uuid REFERENCES organizations(id) ON DELETE SET NULL;

-- =============================================================================
-- 3. Företagets platser — det företaget erbjuder, utan person
-- =============================================================================

CREATE TABLE IF NOT EXISTS employer_places (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title text NOT NULL,
  placement_type text NOT NULL
    CHECK (placement_type IN ('praktik', 'arbetstraning', 'arbetsprovning', 'subventionerad_anstallning')),
  description text,
  status text NOT NULL DEFAULT 'oppen' CHECK (status IN ('oppen', 'pausad', 'tillsatt', 'stangd')),
  hours_per_week numeric,
  schedule_days text,
  start_from date,
  address text,
  -- Fysiska krav — samma kolumner som consultant_work_placements (AG1)
  lifting_required boolean,
  standing_required boolean,
  temperature_demands text CHECK (temperature_demands IS NULL OR temperature_demands IN ('normal', 'kyla', 'varme')),
  noise_level text CHECK (noise_level IS NULL OR noise_level IN ('lag', 'mellan', 'hog')),
  pace_level text CHECK (pace_level IS NULL OR pace_level IN ('lag', 'mellan', 'hog')),
  shift_work boolean NOT NULL DEFAULT false,
  physical_notes text,
  -- Handledning från arbetsplatsens sida — den kritiska dimensionen (Mikael 2026-08-31)
  workplace_supervision_capacity text CHECK (workplace_supervision_capacity IS NULL OR workplace_supervision_capacity IN ('lag', 'mellan', 'hog')),
  supervision_notes text,
  language_requirements text,
  drivers_license_required boolean NOT NULL DEFAULT false,
  other_requirements text,
  contact_name text,
  contact_phone text,
  contact_email text,
  sick_call_phone text,
  sick_call_instructions text,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_employer_places_org ON employer_places(org_id);
CREATE INDEX IF NOT EXISTS idx_employer_places_status ON employer_places(status);
ALTER TABLE employer_places ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Företaget hanterar sina platser" ON employer_places
  FOR ALL USING (ar_foretagsmedlem(org_id)) WITH CHECK (ar_foretagsmedlem(org_id));
-- Personal ser alla företags platser: det är arbetsmarknadsinformation, inte
-- personuppgifter, och konsulenten ska kunna föreslå mot en plats hon inte själv
-- registrerat. Andra FÖRETAG ser dem inte (bara medlemspolicyn ovan).
CREATE POLICY "Personal läser företagens platser" ON employer_places
  FOR SELECT USING (ar_personal());
DROP TRIGGER IF EXISTS trg_employer_places_updated_at ON employer_places;
CREATE TRIGGER trg_employer_places_updated_at
  BEFORE UPDATE ON employer_places FOR EACH ROW EXECUTE FUNCTION update_consultant_updated_at();
COMMENT ON TABLE employer_places IS 'AG6: en plats företaget erbjuder (ingen person). Konsulentens placering (consultant_work_placements.place_id) pekar hit.';

-- Konsulentens placering pekar på företaget och (valfritt) på platsen.
ALTER TABLE consultant_work_placements
  ADD COLUMN IF NOT EXISTS place_id uuid REFERENCES employer_places(id) ON DELETE SET NULL;
DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cwp_company_account_fk') THEN
    ALTER TABLE consultant_work_placements
      ADD CONSTRAINT cwp_company_account_fk FOREIGN KEY (company_account_id)
      REFERENCES organizations(id) ON DELETE SET NULL;
  END IF;
END $do$;
CREATE INDEX IF NOT EXISTS idx_cwp_company_account ON consultant_work_placements(company_account_id);

-- =============================================================================
-- 4. Förslaget (AG5) får företagets svar — och guarden skrivs om
-- =============================================================================

ALTER TABLE employer_share_proposals
  ADD COLUMN IF NOT EXISTS employer_response text NOT NULL DEFAULT 'pending'
    CHECK (employer_response IN ('pending', 'interested', 'declined')),
  ADD COLUMN IF NOT EXISTS employer_message text,
  ADD COLUMN IF NOT EXISTS employer_responded_at timestamptz;
DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'esp_company_account_fk') THEN
    ALTER TABLE employer_share_proposals
      ADD CONSTRAINT esp_company_account_fk FOREIGN KEY (company_account_id)
      REFERENCES organizations(id) ON DELETE SET NULL;
  END IF;
END $do$;
CREATE INDEX IF NOT EXISTS idx_esp_company_account ON employer_share_proposals(company_account_id);

-- Guarden (AS1) + tre tillägg:
--   a) INSERT ärver company_account_id från placeringen — förslaget riktas
--      alltid till det företag platsen bär, aldrig till något annat.
--   b) Efter beslut får BARA företagets svar och visningsräkningen ändras
--      (status och alla samtyckesfält oförändrade). Företagets svar kräver att
--      auth.uid() är medlem i mottagarföretaget — konsulenten kan inte svara åt dem.
--   c) Tillbakadragning som förut.
CREATE OR REPLACE FUNCTION public.guard_share_proposal_after_decision()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $fn$
DECLARE samtycke_lika boolean;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status <> 'pending' THEN
      RAISE EXCEPTION 'Ett delningsförslag skapas alltid som pending — bara deltagaren kan besvara det'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
    IF NEW.employer_response <> 'pending' OR NEW.employer_responded_at IS NOT NULL THEN
      RAISE EXCEPTION 'Företagets svar sätts av företaget' USING ERRCODE = 'insufficient_privilege';
    END IF;
    IF NEW.company_account_id IS NULL THEN
      SELECT p.company_account_id INTO NEW.company_account_id
      FROM consultant_work_placements p WHERE p.id = NEW.placement_id;
    END IF;
    RETURN NEW;
  END IF;

  IF OLD.status = 'pending' AND NEW.status <> 'pending' THEN
    IF auth.uid() IS NULL OR auth.uid() <> OLD.participant_id THEN
      RAISE EXCEPTION 'Bara deltagaren själv kan besvara ett delningsförslag (id %)', OLD.id
        USING ERRCODE = 'insufficient_privilege';
    END IF;
    RETURN NEW;
  END IF;

  samtycke_lika :=
       NEW.show_contact = OLD.show_contact AND NEW.show_summary = OLD.show_summary
   AND NEW.show_skills = OLD.show_skills AND NEW.show_experience = OLD.show_experience
   AND NEW.show_education = OLD.show_education AND NEW.show_documents = OLD.show_documents
   AND NEW.presentation_text IS NOT DISTINCT FROM OLD.presentation_text
   AND NEW.participant_id = OLD.participant_id AND NEW.placement_id = OLD.placement_id
   AND NEW.company_account_id IS NOT DISTINCT FROM OLD.company_account_id
   AND NEW.expires_at IS NOT DISTINCT FROM OLD.expires_at
   AND NEW.max_views IS NOT DISTINCT FROM OLD.max_views;

  -- Företagets svar (bara på ett accepterat förslag, bara av företaget självt)
  IF NEW.employer_response IS DISTINCT FROM OLD.employer_response
     OR NEW.employer_message IS DISTINCT FROM OLD.employer_message THEN
    IF OLD.status <> 'accepted' OR NEW.status <> OLD.status OR NOT samtycke_lika THEN
      RAISE EXCEPTION 'Företaget kan bara svara på ett förslag deltagaren godkänt' USING ERRCODE = 'check_violation';
    END IF;
    IF auth.uid() IS NULL OR NOT EXISTS (
      SELECT 1 FROM organization_members m WHERE m.org_id = OLD.company_account_id AND m.user_id = auth.uid()
    ) THEN
      RAISE EXCEPTION 'Bara mottagarföretaget kan svara på förslaget' USING ERRCODE = 'insufficient_privilege';
    END IF;
    IF NEW.employer_response NOT IN ('interested', 'declined') THEN
      RAISE EXCEPTION 'Ogiltigt svar' USING ERRCODE = 'invalid_parameter_value';
    END IF;
    NEW.employer_responded_at := now();
    RETURN NEW;
  END IF;

  IF OLD.status <> 'pending' THEN
    -- Visningsräkning (via vyn) — inget annat ändrat
    IF NEW.status = OLD.status AND samtycke_lika THEN
      RETURN NEW;
    END IF;
    IF NEW.status = 'withdrawn' AND samtycke_lika THEN
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'Ett besvarat delningsförslag kan bara dras tillbaka, inte ändras (id %)', OLD.id
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$fn$;
REVOKE ALL ON FUNCTION public.guard_share_proposal_after_decision() FROM PUBLIC, anon, authenticated;

-- Utgångsdatum: expired sätts av RPC:n vid svar; vyerna filtrerar på expires_at
-- så ett utgånget förslag är osynligt för företaget även utan statusbyte.

-- =============================================================================
-- 5. Företagets läsvyer — vitlistade kolumner, ägda av postgres (ingen invoker)
-- =============================================================================

CREATE OR REPLACE VIEW employer_proposals AS
SELECT
  esp.id,
  esp.company_account_id AS org_id,
  esp.placement_id,
  esp.presentation_text,
  esp.expires_at,
  esp.max_views,
  esp.view_count,
  esp.last_viewed_at,
  esp.decided_at,
  esp.created_at,
  esp.employer_response,
  esp.employer_message,
  esp.employer_responded_at,
  esp.show_contact, esp.show_summary, esp.show_skills, esp.show_experience, esp.show_education,
  p.placement_type,
  p.occupation,
  p.start_date,
  p.end_date,
  p.hours_per_week,
  p.schedule_days,
  p.place_id,
  pl.title AS place_title,
  k.first_name AS consultant_first_name,
  k.last_name  AS consultant_last_name,
  k.email      AS consultant_email,
  k.phone      AS consultant_phone,
  d.first_name AS participant_first_name,
  d.last_name  AS participant_last_name,
  CASE WHEN esp.show_contact THEN d.email END    AS participant_email,
  CASE WHEN esp.show_contact THEN d.phone END    AS participant_phone,
  CASE WHEN esp.show_contact THEN d.location END AS participant_location,
  -- Personens EGEN sammanfattning ur CV:t — aldrig ai_summary (AG4: inget AI-resultat om en person når ett företag)
  CASE WHEN esp.show_summary THEN (SELECT c.summary FROM cvs c WHERE c.user_id = d.id ORDER BY c.updated_at DESC LIMIT 1) END AS participant_summary,
  CASE WHEN esp.show_skills THEN (
    SELECT jsonb_agg(jsonb_build_object('name', s.name, 'category', s.category, 'level', s.level, 'years_experience', s.years_experience) ORDER BY s.name)
    FROM profile_skills s WHERE s.user_id = d.id) END AS participant_skills,
  CASE WHEN esp.show_experience THEN (SELECT c.work_experience FROM cvs c WHERE c.user_id = d.id ORDER BY c.updated_at DESC LIMIT 1) END AS participant_experience,
  CASE WHEN esp.show_education  THEN (SELECT c.education FROM cvs c WHERE c.user_id = d.id ORDER BY c.updated_at DESC LIMIT 1) END AS participant_education
FROM employer_share_proposals esp
JOIN consultant_work_placements p ON p.id = esp.placement_id
LEFT JOIN employer_places pl ON pl.id = p.place_id
JOIN profiles k ON k.id = esp.consultant_id
JOIN profiles d ON d.id = esp.participant_id
WHERE esp.status = 'accepted'
  AND esp.company_account_id IS NOT NULL
  AND (esp.expires_at IS NULL OR esp.expires_at > now())
  AND (esp.max_views IS NULL OR esp.view_count < esp.max_views)
  AND EXISTS (SELECT 1 FROM organization_members m WHERE m.org_id = esp.company_account_id AND m.user_id = auth.uid());

COMMENT ON VIEW employer_proposals IS
  'AG8: företagets enda väg till ett förslag. Bara accepted, bara mottagarföretaget, fält per show_*. Inga AI-resultat, inget mående, inga anpassningsskäl.';

-- Skrivning via vyn: (a) svara — employer_response satt; (b) annars = "öppnad", räknar visning.
CREATE OR REPLACE FUNCTION public.employer_proposals_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $fn$
DECLARE
  v_rad employer_share_proposals%ROWTYPE;
  v_foretag text;
  v_namn text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Inte inloggad' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO v_rad FROM employer_share_proposals WHERE id = OLD.id;
  IF NOT FOUND OR NOT ar_foretagsmedlem(v_rad.company_account_id) THEN
    RAISE EXCEPTION 'Förslaget finns inte' USING ERRCODE = 'P0002';
  END IF;

  IF NEW.employer_response IS DISTINCT FROM OLD.employer_response THEN
    IF NEW.employer_response NOT IN ('interested', 'declined') THEN
      RAISE EXCEPTION 'Svaret måste vara intresserad eller tacka nej' USING ERRCODE = '22023';
    END IF;
    IF v_rad.employer_response = 'declined' THEN
      RAISE EXCEPTION 'Förslaget är redan besvarat' USING ERRCODE = '23514';
    END IF;
    UPDATE employer_share_proposals
       SET employer_response = NEW.employer_response,
           employer_message = NULLIF(left(coalesce(NEW.employer_message, ''), 2000), '')
     WHERE id = OLD.id;

    -- Notis till konsulenten (definer: notifications-policyn gäller inte här)
    SELECT o.name INTO v_foretag FROM organizations o WHERE o.id = v_rad.company_account_id;
    SELECT trim(coalesce(pr.first_name, '') || ' ' || coalesce(pr.last_name, '')) INTO v_namn
      FROM profiles pr WHERE pr.id = v_rad.participant_id;
    INSERT INTO notifications (user_id, type, title, message, action_url, data)
    VALUES (
      v_rad.consultant_id,
      'foretag_svar',
      CASE WHEN NEW.employer_response = 'interested' THEN 'Företaget vill gå vidare' ELSE 'Företaget tackade nej' END,
      coalesce(v_foretag, 'Företaget') || CASE WHEN NEW.employer_response = 'interested'
        THEN ' vill gå vidare med förslaget om ' ELSE ' tackade nej till förslaget om ' END
        || coalesce(nullif(v_namn, ''), 'deltagaren') || '.'
        || CASE WHEN NEW.employer_message IS NOT NULL AND NEW.employer_message <> '' THEN ' "' || left(NEW.employer_message, 200) || '"' ELSE '' END,
      '/consultant/platser',
      jsonb_build_object('proposal_id', v_rad.id, 'placement_id', v_rad.placement_id, 'response', NEW.employer_response)
    );
    RETURN NEW;
  END IF;

  -- Öppnad: räkna visningen, inom taket
  UPDATE employer_share_proposals
     SET view_count = view_count + 1, last_viewed_at = now()
   WHERE id = OLD.id AND (max_views IS NULL OR view_count < max_views);
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Förslaget kan inte visas fler gånger' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$fn$;
REVOKE ALL ON FUNCTION public.employer_proposals_update() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_employer_proposals_update ON employer_proposals;
CREATE TRIGGER trg_employer_proposals_update
  INSTEAD OF UPDATE ON employer_proposals
  FOR EACH ROW EXECUTE FUNCTION public.employer_proposals_update();
GRANT SELECT, UPDATE ON employer_proposals TO authenticated;

-- Pågående: placeringar hos företaget som HAR ett accepterat förslag (samtycket
-- är villkoret för att en person alls syns) och som antingen är igång/avslutad
-- eller där företaget sagt "vill gå vidare".
CREATE OR REPLACE VIEW employer_placements AS
SELECT
  p.id,
  p.company_account_id AS org_id,
  p.placement_type,
  p.status,
  p.occupation,
  p.start_date,
  p.end_date,
  p.hours_per_week,
  p.schedule_days,
  p.can_ramp_up,
  p.ramp_up_plan,
  p.employer_instructions,
  p.work_environment_responsibility,
  p.sick_call_phone,
  p.sick_call_instructions,
  p.place_id,
  pl.title AS place_title,
  d.first_name AS participant_first_name,
  d.last_name  AS participant_last_name,
  k.first_name AS consultant_first_name,
  k.last_name  AS consultant_last_name,
  k.email      AS consultant_email,
  k.phone      AS consultant_phone,
  esp.id AS proposal_id,
  esp.employer_response,
  p.created_at,
  p.updated_at
FROM consultant_work_placements p
JOIN LATERAL (
  SELECT e.id, e.employer_response FROM employer_share_proposals e
  WHERE e.placement_id = p.id AND e.status = 'accepted'
  ORDER BY e.decided_at DESC LIMIT 1
) esp ON true
LEFT JOIN employer_places pl ON pl.id = p.place_id
JOIN profiles d ON d.id = p.participant_id
LEFT JOIN profiles k ON k.id = p.consultant_id
WHERE p.company_account_id IS NOT NULL
  AND (p.status <> 'planerad' OR esp.employer_response = 'interested')
  AND EXISTS (SELECT 1 FROM organization_members m WHERE m.org_id = p.company_account_id AND m.user_id = auth.uid());
COMMENT ON VIEW employer_placements IS
  'AG6: företagets pågående placeringar. Bara med accepterat förslag. Utesluter internal_adaptation_notes, notes, employer_future_needs, employer_hiring_interest, participant_supervision_need, supervision_notes.';
GRANT SELECT ON employer_placements TO authenticated;

-- =============================================================================
-- 6. Företagets avstämningar (3 och 6 månader — deras del av uppföljningen)
-- =============================================================================

CREATE TABLE IF NOT EXISTS employer_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  placement_id uuid NOT NULL REFERENCES consultant_work_placements(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  author_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  milestone_week smallint NOT NULL CHECK (milestone_week > 0),
  going_well text,
  concerns text,
  continue_interest text CHECK (continue_interest IS NULL OR continue_interest IN ('ja', 'kanske', 'nej')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_employer_checkins_placement ON employer_checkins(placement_id);
ALTER TABLE employer_checkins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Företaget läser sina avstämningar" ON employer_checkins
  FOR SELECT USING (ar_foretagsmedlem(org_id));
CREATE POLICY "Företaget skriver avstämning på synlig placering" ON employer_checkins
  FOR INSERT WITH CHECK (
    ar_foretagsmedlem(org_id) AND author_id = auth.uid()
    AND EXISTS (SELECT 1 FROM employer_placements ep WHERE ep.id = placement_id AND ep.org_id = employer_checkins.org_id)
  );
CREATE POLICY "Konsulent läser företagets avstämningar på egna placeringar" ON employer_checkins
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM consultant_work_placements p WHERE p.id = placement_id AND p.consultant_id = auth.uid())
  );

-- Notis till konsulenten när företaget lämnat en avstämning
CREATE OR REPLACE FUNCTION public.employer_checkins_notify()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $fn$
DECLARE v_konsulent uuid; v_foretag text; v_namn text;
BEGIN
  SELECT p.consultant_id, trim(coalesce(d.first_name, '') || ' ' || coalesce(d.last_name, ''))
    INTO v_konsulent, v_namn
  FROM consultant_work_placements p JOIN profiles d ON d.id = p.participant_id WHERE p.id = NEW.placement_id;
  IF v_konsulent IS NULL THEN RETURN NEW; END IF;
  SELECT o.name INTO v_foretag FROM organizations o WHERE o.id = NEW.org_id;
  INSERT INTO notifications (user_id, type, title, message, action_url, data)
  VALUES (v_konsulent, 'foretag_avstamning', 'Avstämning från företaget',
    coalesce(v_foretag, 'Företaget') || ' har lämnat en avstämning (vecka ' || NEW.milestone_week || ') om ' || coalesce(nullif(v_namn, ''), 'deltagaren') || '.',
    '/consultant/platser',
    jsonb_build_object('placement_id', NEW.placement_id, 'checkin_id', NEW.id));
  RETURN NEW;
END;
$fn$;
REVOKE ALL ON FUNCTION public.employer_checkins_notify() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_employer_checkins_notify ON employer_checkins;
CREATE TRIGGER trg_employer_checkins_notify
  AFTER INSERT ON employer_checkins FOR EACH ROW EXECUTE FUNCTION public.employer_checkins_notify();

-- =============================================================================
-- 7. Meddelanden företag ↔ konsulent, en tråd per förslag (beslut 2: aldrig deltagaren)
-- =============================================================================

CREATE TABLE IF NOT EXISTS employer_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL REFERENCES employer_share_proposals(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sender_kind text NOT NULL CHECK (sender_kind IN ('foretag', 'konsulent')),
  content text NOT NULL CHECK (length(content) BETWEEN 1 AND 4000),
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_employer_messages_proposal ON employer_messages(proposal_id, created_at);
ALTER TABLE employer_messages ENABLE ROW LEVEL SECURITY;

-- Företaget: bara trådar på förslag det får se (accepterade, egna)
CREATE POLICY "Företaget läser trådar på sina förslag" ON employer_messages
  FOR SELECT USING (EXISTS (SELECT 1 FROM employer_proposals ep WHERE ep.id = proposal_id));
CREATE POLICY "Företaget skriver i tråden" ON employer_messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND sender_kind = 'foretag'
    AND EXISTS (SELECT 1 FROM employer_proposals ep WHERE ep.id = proposal_id)
  );
-- Konsulenten: sina egna förslag, oavsett status (historiken är hennes)
CREATE POLICY "Konsulent läser trådar på egna förslag" ON employer_messages
  FOR SELECT USING (EXISTS (SELECT 1 FROM employer_share_proposals e WHERE e.id = proposal_id AND e.consultant_id = auth.uid()));
CREATE POLICY "Konsulent skriver i tråden" ON employer_messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND sender_kind = 'konsulent'
    AND EXISTS (SELECT 1 FROM employer_share_proposals e WHERE e.id = proposal_id AND e.consultant_id = auth.uid() AND e.status = 'accepted')
  );
-- Läskvitto: mottagarsidan markerar läst (guarden nedan låser till is_read)
CREATE POLICY "Mottagaren markerar läst" ON employer_messages
  FOR UPDATE USING (
    sender_id <> auth.uid() AND (
      EXISTS (SELECT 1 FROM employer_proposals ep WHERE ep.id = proposal_id)
      OR EXISTS (SELECT 1 FROM employer_share_proposals e WHERE e.id = proposal_id AND e.consultant_id = auth.uid())
    )
  );

CREATE OR REPLACE FUNCTION public.employer_messages_guard()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $fn$
BEGIN
  IF NEW.content <> OLD.content OR NEW.sender_id <> OLD.sender_id OR NEW.proposal_id <> OLD.proposal_id
     OR NEW.sender_kind <> OLD.sender_kind OR NEW.created_at <> OLD.created_at THEN
    RAISE EXCEPTION 'Bara läsmarkeringen kan ändras' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$fn$;
DROP TRIGGER IF EXISTS trg_employer_messages_guard ON employer_messages;
CREATE TRIGGER trg_employer_messages_guard
  BEFORE UPDATE ON employer_messages FOR EACH ROW EXECUTE FUNCTION public.employer_messages_guard();

-- Notis till motparten
CREATE OR REPLACE FUNCTION public.employer_messages_notify()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $fn$
DECLARE v_esp employer_share_proposals%ROWTYPE; v_foretag text; v_avs text; r record;
BEGIN
  SELECT * INTO v_esp FROM employer_share_proposals WHERE id = NEW.proposal_id;
  SELECT o.name INTO v_foretag FROM organizations o WHERE o.id = v_esp.company_account_id;
  SELECT trim(coalesce(pr.first_name, '') || ' ' || coalesce(pr.last_name, '')) INTO v_avs FROM profiles pr WHERE pr.id = NEW.sender_id;
  IF NEW.sender_kind = 'foretag' THEN
    INSERT INTO notifications (user_id, type, title, message, action_url, data)
    VALUES (v_esp.consultant_id, 'foretag_meddelande', 'Meddelande från ' || coalesce(v_foretag, 'företaget'),
      coalesce(nullif(v_avs, ''), 'Företaget') || ': "' || left(NEW.content, 200) || '"',
      '/consultant/platser', jsonb_build_object('proposal_id', NEW.proposal_id, 'message_id', NEW.id));
  ELSE
    FOR r IN SELECT m.user_id FROM organization_members m WHERE m.org_id = v_esp.company_account_id LOOP
      INSERT INTO notifications (user_id, type, title, message, action_url, data)
      VALUES (r.user_id, 'foretag_meddelande', 'Meddelande från konsulenten',
        coalesce(nullif(v_avs, ''), 'Konsulenten') || ': "' || left(NEW.content, 200) || '"',
        '/foretag/meddelanden', jsonb_build_object('proposal_id', NEW.proposal_id, 'message_id', NEW.id));
    END LOOP;
  END IF;
  RETURN NEW;
END;
$fn$;
REVOKE ALL ON FUNCTION public.employer_messages_notify() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_employer_messages_notify ON employer_messages;
CREATE TRIGGER trg_employer_messages_notify
  AFTER INSERT ON employer_messages FOR EACH ROW EXECUTE FUNCTION public.employer_messages_notify();

-- =============================================================================
-- 8. Notiser i förslagsflödet: deltagaren får frågan, företaget får ett ja
-- =============================================================================

CREATE OR REPLACE FUNCTION public.share_proposal_notify()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $fn$
DECLARE v_foretag text; v_kons text; v_namn text; r record;
BEGIN
  SELECT o.name INTO v_foretag FROM organizations o WHERE o.id = NEW.company_account_id;
  IF v_foretag IS NULL THEN
    SELECT p.company_name INTO v_foretag FROM consultant_work_placements p WHERE p.id = NEW.placement_id;
  END IF;
  SELECT trim(coalesce(pr.first_name, '') || ' ' || coalesce(pr.last_name, '')) INTO v_kons FROM profiles pr WHERE pr.id = NEW.consultant_id;
  SELECT trim(coalesce(pr.first_name, '') || ' ' || coalesce(pr.last_name, '')) INTO v_namn FROM profiles pr WHERE pr.id = NEW.participant_id;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO notifications (user_id, type, title, message, action_url, data)
    VALUES (NEW.participant_id, 'foretag_forslag', 'En fråga från din konsulent',
      coalesce(nullif(v_kons, ''), 'Din konsulent') || ' vill föreslå dig för en plats hos ' || coalesce(v_foretag, 'ett företag') || '. Du bestämmer om något delas, och vad.',
      '/my-consultant', jsonb_build_object('proposal_id', NEW.id));
    RETURN NEW;
  END IF;

  IF OLD.status = 'pending' AND NEW.status = 'accepted' THEN
    INSERT INTO notifications (user_id, type, title, message, action_url, data)
    VALUES (NEW.consultant_id, 'foretag_forslag', 'Deltagaren sa ja',
      coalesce(nullif(v_namn, ''), 'Deltagaren') || ' har godkänt att förslaget delas med ' || coalesce(v_foretag, 'företaget') || '.',
      '/consultant/platser', jsonb_build_object('proposal_id', NEW.id));
    IF NEW.company_account_id IS NOT NULL THEN
      FOR r IN SELECT m.user_id FROM organization_members m WHERE m.org_id = NEW.company_account_id LOOP
        INSERT INTO notifications (user_id, type, title, message, action_url, data)
        VALUES (r.user_id, 'foretag_forslag', 'Ett förslag väntar på svar',
          coalesce(nullif(v_kons, ''), 'En konsulent') || ' föreslår en person för ' || coalesce((SELECT coalesce(pl.title, p.occupation) FROM consultant_work_placements p LEFT JOIN employer_places pl ON pl.id = p.place_id WHERE p.id = NEW.placement_id), 'en plats hos er') || '.',
          '/foretag/forslag', jsonb_build_object('proposal_id', NEW.id));
      END LOOP;
    END IF;
  ELSIF OLD.status = 'pending' AND NEW.status = 'declined' THEN
    INSERT INTO notifications (user_id, type, title, message, action_url, data)
    VALUES (NEW.consultant_id, 'foretag_forslag', 'Deltagaren tackade nej',
      coalesce(nullif(v_namn, ''), 'Deltagaren') || ' vill inte att förslaget till ' || coalesce(v_foretag, 'företaget') || ' delas.'
      || CASE WHEN NEW.participant_message IS NOT NULL AND NEW.participant_message <> '' THEN ' "' || left(NEW.participant_message, 200) || '"' ELSE '' END,
      '/consultant/platser', jsonb_build_object('proposal_id', NEW.id));
  ELSIF OLD.status = 'accepted' AND NEW.status = 'withdrawn' THEN
    INSERT INTO notifications (user_id, type, title, message, action_url, data)
    VALUES (NEW.consultant_id, 'foretag_forslag', 'Samtycket är återkallat',
      coalesce(nullif(v_namn, ''), 'Deltagaren') || ' har återkallat delningen med ' || coalesce(v_foretag, 'företaget') || '. Företaget ser inte längre förslaget.',
      '/consultant/platser', jsonb_build_object('proposal_id', NEW.id));
  END IF;
  RETURN NEW;
END;
$fn$;
REVOKE ALL ON FUNCTION public.share_proposal_notify() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_share_proposal_notify ON employer_share_proposals;
CREATE TRIGGER trg_share_proposal_notify
  AFTER INSERT OR UPDATE OF status ON employer_share_proposals
  FOR EACH ROW EXECUTE FUNCTION public.share_proposal_notify();

-- =============================================================================
-- 9. Inbjudan av företaget — från konsulenten (platsens kontaktperson) eller
--    från en kollega i företaget. Vy + INSTEAD OF INSERT (definer).
-- =============================================================================

CREATE OR REPLACE VIEW employer_invitations AS
SELECT
  i.id,
  (i.metadata->>'employer_org_id')::uuid AS org_id,
  i.metadata->>'company_name' AS company_name,
  i.metadata->>'org_number'   AS org_number,
  i.email,
  i.metadata->>'contact_name' AS contact_name,
  NULL::uuid AS placement_id,
  (i.metadata->>'existing_account')::boolean AS existing_account,
  i.email_sent,
  i.used_at,
  i.expires_at,
  i.created_at
FROM invitations i
WHERE i.metadata ? 'employer_org_id'
  AND (
    i.invited_by = auth.uid()
    OR EXISTS (SELECT 1 FROM organization_members m WHERE m.org_id = (i.metadata->>'employer_org_id')::uuid AND m.user_id = auth.uid())
  );

CREATE OR REPLACE FUNCTION public.employer_invitations_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $fn$
DECLARE
  caller uuid := auth.uid();
  v_personal boolean;
  v_medlem boolean := false;
  v_org uuid := NEW.org_id;
  v_orgnr text;
  v_namn text;
  v_existing uuid;
  v_id uuid;
  v_demo boolean;
BEGIN
  IF caller IS NULL THEN
    RAISE EXCEPTION 'Inte inloggad' USING ERRCODE = '42501';
  END IF;
  IF NEW.email IS NULL OR position('@' in NEW.email) = 0 THEN
    RAISE EXCEPTION 'Ange en giltig e-postadress' USING ERRCODE = '22023';
  END IF;

  -- Demokonton skickar aldrig mejl (KM12 (8))
  SELECT EXISTS (SELECT 1 FROM organization_members m JOIN organizations o ON o.id = m.org_id WHERE m.user_id = caller AND o.is_demo) INTO v_demo;
  IF v_demo THEN
    RAISE EXCEPTION 'Demokontot kan inte bjuda in. Personerna i demot är påhittade.' USING ERRCODE = '42501';
  END IF;

  v_personal := ar_personal();
  IF v_org IS NOT NULL THEN
    v_medlem := ar_foretagsmedlem(v_org);
  END IF;
  IF NOT v_personal AND NOT v_medlem THEN
    RAISE EXCEPTION 'Bara personal eller företagets egna kontaktpersoner kan bjuda in' USING ERRCODE = '42501';
  END IF;

  -- Konsulentens väg: hitta eller skapa företagskontot på org.nr
  IF v_org IS NULL THEN
    IF NOT v_personal THEN
      RAISE EXCEPTION 'Företagskonto saknas' USING ERRCODE = '22023';
    END IF;
    v_orgnr := regexp_replace(coalesce(NEW.org_number, ''), '[^0-9]', '', 'g');
    IF length(v_orgnr) <> 10 THEN
      RAISE EXCEPTION 'Organisationsnumret ska ha tio siffror' USING ERRCODE = '22023';
    END IF;
    v_orgnr := left(v_orgnr, 6) || '-' || right(v_orgnr, 4);
    v_namn := nullif(trim(coalesce(NEW.company_name, '')), '');
    SELECT o.id INTO v_org FROM organizations o WHERE o.kind = 'arbetsgivare' AND o.org_number = v_orgnr LIMIT 1;
    IF v_org IS NULL THEN
      IF v_namn IS NULL THEN
        RAISE EXCEPTION 'Ange företagets namn' USING ERRCODE = '22023';
      END IF;
      INSERT INTO organizations (name, kind, org_number) VALUES (v_namn, 'arbetsgivare', v_orgnr) RETURNING id INTO v_org;
    END IF;
  ELSE
    SELECT o.name, o.org_number INTO v_namn, v_orgnr FROM organizations o WHERE o.id = v_org AND o.kind = 'arbetsgivare';
    IF v_namn IS NULL THEN
      RAISE EXCEPTION 'Företagskontot finns inte' USING ERRCODE = 'P0002';
    END IF;
  END IF;
  IF v_namn IS NULL THEN
    SELECT o.name INTO v_namn FROM organizations o WHERE o.id = v_org;
  END IF;

  -- Konsulentens placering pekar på företaget från och med nu
  IF NEW.placement_id IS NOT NULL AND v_personal THEN
    UPDATE consultant_work_placements
       SET company_account_id = v_org
     WHERE id = NEW.placement_id AND consultant_id = caller AND company_account_id IS NULL;
  END IF;

  -- Finns kontot redan? Då blir personen medlem direkt och mejlet säger "logga in".
  SELECT p.id INTO v_existing FROM profiles p WHERE lower(p.email) = lower(trim(NEW.email));
  IF v_existing IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM organization_members m WHERE m.org_id = v_org AND m.user_id = v_existing) THEN
      RAISE EXCEPTION 'Personen är redan med i företagskontot' USING ERRCODE = '23505';
    END IF;
    IF EXISTS (SELECT 1 FROM profiles p WHERE p.id = v_existing AND p.role <> 'USER') THEN
      RAISE EXCEPTION 'E-posten tillhör ett personalkonto och kan inte bli företagskontakt' USING ERRCODE = '23514';
    END IF;
    INSERT INTO organization_members (org_id, user_id, role) VALUES (v_org, v_existing, 'arbetsgivare');
  END IF;

  INSERT INTO invitations (email, role, invited_by, consultant_id, expires_at, used_at, used_by, metadata)
  VALUES (
    lower(trim(NEW.email)), 'USER', caller, NULL, now() + interval '14 days',
    CASE WHEN v_existing IS NOT NULL THEN now() END, v_existing,
    jsonb_build_object(
      'kind', 'arbetsgivare',
      'employer_org_id', v_org,
      'company_name', v_namn,
      'org_number', v_orgnr,
      'contact_name', nullif(trim(coalesce(NEW.contact_name, '')), ''),
      'first_name', split_part(trim(coalesce(NEW.contact_name, '')), ' ', 1),
      'existing_account', v_existing IS NOT NULL,
      'invited_by_name', (SELECT trim(coalesce(p.first_name, '') || ' ' || coalesce(p.last_name, '')) FROM profiles p WHERE p.id = caller),
      'invited_by_kind', CASE WHEN v_personal THEN 'konsulent' ELSE 'foretag' END
    )
  ) RETURNING id INTO v_id;

  NEW.id := v_id;
  NEW.org_id := v_org;
  NEW.company_name := v_namn;
  NEW.org_number := v_orgnr;
  NEW.existing_account := v_existing IS NOT NULL;
  RETURN NEW;
END;
$fn$;
REVOKE ALL ON FUNCTION public.employer_invitations_insert() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_employer_invitations_insert ON employer_invitations;
CREATE TRIGGER trg_employer_invitations_insert
  INSTEAD OF INSERT ON employer_invitations
  FOR EACH ROW EXECUTE FUNCTION public.employer_invitations_insert();
GRANT SELECT, INSERT ON employer_invitations TO authenticated;

-- När kontot skapas: medlemskapet. handle_new_user (auth.users) markerar
-- inbjudan använd INNAN profilraden finns, så handle_invitation_acceptance
-- (AFTER INSERT ON profiles, used_at IS NULL) ser den aldrig — därför en egen
-- trigger som letar på e-post oavsett used_at.
CREATE OR REPLACE FUNCTION public.employer_invitation_membership()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $fn$
DECLARE v_org uuid;
BEGIN
  SELECT (i.metadata->>'employer_org_id')::uuid INTO v_org
  FROM invitations i
  WHERE lower(i.email) = lower(NEW.email)
    AND i.metadata ? 'employer_org_id'
    AND (i.used_by = NEW.id OR i.used_at IS NULL)
    AND i.created_at > now() - interval '30 days'
  ORDER BY i.created_at DESC LIMIT 1;
  IF v_org IS NULL THEN RETURN NEW; END IF;
  IF EXISTS (SELECT 1 FROM organizations o WHERE o.id = v_org AND o.kind = 'arbetsgivare')
     AND NOT EXISTS (SELECT 1 FROM organization_members m WHERE m.org_id = v_org AND m.user_id = NEW.id) THEN
    INSERT INTO organization_members (org_id, user_id, role) VALUES (v_org, NEW.id, 'arbetsgivare');
  END IF;
  RETURN NEW;
END;
$fn$;
REVOKE ALL ON FUNCTION public.employer_invitation_membership() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_employer_invitation_membership ON profiles;
CREATE TRIGGER trg_employer_invitation_membership
  AFTER INSERT ON profiles FOR EACH ROW EXECUTE FUNCTION public.employer_invitation_membership();

-- =============================================================================
-- Verifiering efter körning (förväntat svar)
-- =============================================================================
-- select pg_get_constraintdef(oid) from pg_constraint where conname='organizations_kind_check';   → innehåller 'arbetsgivare'
-- select table_name from information_schema.tables where table_name in ('employer_profiles','employer_places','employer_checkins','employer_messages'); → 4 rader
-- select viewname from pg_views where viewname in ('employer_proposals','employer_placements','employer_invitations'); → 3 rader
-- select has_function_privilege('authenticated','public.employer_proposals_update()','EXECUTE'); → false
-- select has_function_privilege('authenticated','public.employer_invitations_insert()','EXECUTE'); → false
-- select count(*) from pg_policies where tablename in ('employer_profiles','employer_places','employer_checkins','employer_messages'); → 12
