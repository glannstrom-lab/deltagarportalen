-- AG5 (omscopad 2026-09-02): samtycke per delning och per mottagare.
--
-- PREMISSEN SOM FÖLL
-- ------------------
-- ROADMAP AG5 sa "ny samtyckestyp i grant_consent/withdraw_consent". Den vägen
-- ger EN tidsstämpelkolumn på profiles per typ (se CASE-satsen i
-- 20260901110000_a30_consent_history_trigger.sql:111-119) — alltså en
-- generell brytare "jag godkänner delning med arbetsgivare", precis det som
-- Mikaels val (3) 2026-08-31 utesluter: "deltagaren godkänner VARJE delning".
-- Ett samtycke per delning och per mottagare kan inte bo i en kolumn på
-- profilraden. Det måste bo i en RAD per delning.
--
-- FORMEN
-- ------
-- Förslagsraden ÄR samtycket. Konsulenten skapar ett förslag (plats +
-- deltagare + vilka fält + en presentationstext), deltagaren svarar ja eller
-- nej, och först vid ja finns något att visa för ett företag. Bevisspåret
-- (art. 7.1) läggs i consent_history med typen `employer_share` och
-- `reference_id` = förslagsraden, så att "vilket samtycke, till vem, för vad"
-- går att svara på i efterhand — inte bara "när".
--
-- Fältvalen är lånade från profile_shares (20260417120000_profile_enhancements.sql),
-- som ROADMAP pekar ut som rätt mönster, med EN skillnad: alla show_* är
-- DEFAULT false här. profile_shares har DEFAULT true på fem av sex, vilket är
-- opt-out. En delning till en arbetsgivare ska vara opt-in per fält.
--
-- VAD SOM INTE FINNS HÄR, MED FLIT
-- --------------------------------
-- · Ingen läsväg för företag. company_account_id är nullbar och ingen policy
--   släpper in någon annan än deltagaren och hennes konsulent. Företagets
--   vy (AG8) byggs som en SECURITY DEFINER-funktion med en VITLISTA av
--   kolumner — aldrig SELECT * — så att mående, dagbok, anpassningsbehov,
--   ATS-poäng och Hollandkod är strukturellt uteslutna (ROADMAP "Utformningen").
-- · Ingen AI-kolumn. presentation_text får vara AI-formulerad, men det är
--   konsulenten som väljer personen. Tabellen bär inget poäng- eller
--   rangordningsfält, och ska inte få något (Annex III 4(a)).
-- · Ingen UPDATE-policy för deltagaren. Hon svarar genom RPC:n nedan, som
--   bara kan flytta status pending→accepted/declined och accepted→withdrawn.
--   Annars kunde en klient sätta show_documents=true på ett redan besvarat
--   förslag.
--
-- KOSTNAD SOM SYNS FÖRST VID KÖRNING
-- ----------------------------------
-- RPC:n ges EXECUTE till authenticated. `npm run lint:grants` har ett fryst
-- tak AUTH_TAK = 29 (client/scripts/lint-grants.cjs:63). Den här funktionen
-- är deltagarens ENDA väg att svara — samma klass som grant_consent — så
-- taket ska höjas 29 → 30 med en rad i takloggen, i SAMMA commit som
-- grants:refresh. Höj inte taket för något annat i förbifarten.
--
-- INTE KÖRD ÄN. Kräver Mikaels ja enligt CLAUDE.md (migrationer mot prod).
-- Kör manuellt när klartecken finns:
--   npx supabase db query --linked -f supabase/migrations/20260902100000_ag5_share_proposals.sql
-- Uppdatera sedan BÅDA snapshotarna i SAMMA commit som körningen:
--   cd client && npm run schema:refresh && npm run grants:refresh
-- Först därefter får kod referera employer_share_proposals — lint:schema
-- fäller annars bygget (och ska göra det).

-- =============================================================================
-- 1. consent_history: sjunde typen + referens till det samtycket gäller
-- =============================================================================

ALTER TABLE consent_history DROP CONSTRAINT IF EXISTS consent_history_consent_type_check;
ALTER TABLE consent_history
  ADD CONSTRAINT consent_history_consent_type_check
  CHECK (consent_type IN (
    'terms', 'privacy', 'ai_processing', 'marketing', 'health_data', 'wellness_data',
    'employer_share'
  ));

-- Nullbar: de sex profiltyperna har ingen referens. Ingen FK — raden i
-- registret ska överleva att förslaget raderas (art. 7.1 gäller efteråt också).
ALTER TABLE consent_history ADD COLUMN IF NOT EXISTS reference_id uuid;
CREATE INDEX IF NOT EXISTS idx_consent_history_reference ON consent_history(reference_id)
  WHERE reference_id IS NOT NULL;

COMMENT ON COLUMN consent_history.reference_id IS
  'AG5: för consent_type=employer_share pekar den på employer_share_proposals.id. NULL för profiltyperna.';

-- OBS: log_consent_column_change() (A30) mappar SEX profilkolumner och rör
-- inte den här typen — employer_share skrivs bara av RPC:n nedan. Lägg INTE
-- till typen i triggerns array; det finns ingen profilkolumn att koppla den till.

-- =============================================================================
-- 2. Förslagsraden
-- =============================================================================

CREATE TABLE IF NOT EXISTS employer_share_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Vilken plats, vilken person, vilken konsulent
  placement_id uuid NOT NULL REFERENCES consultant_work_placements(id) ON DELETE CASCADE,
  participant_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  consultant_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- AG6: blir FK till företagskontot när rollen EMPLOYER finns. Nullbar med
  -- flit — fram till dess är mottagaren den arbetsgivare platsraden bär
  -- (company_name/org_number på consultant_work_placements).
  company_account_id uuid,

  -- Vad som får visas. DEFAULT false på allt — opt-in per fält, aldrig opt-out.
  show_contact    boolean NOT NULL DEFAULT false,
  show_summary    boolean NOT NULL DEFAULT false,
  show_skills     boolean NOT NULL DEFAULT false,
  show_experience boolean NOT NULL DEFAULT false,
  show_education  boolean NOT NULL DEFAULT false,
  show_documents  boolean NOT NULL DEFAULT false,

  -- Konsulentens presentation av personen för just den här platsen. AI får
  -- formulera, konsulenten redigerar, deltagaren ser texten INNAN hon svarar.
  presentation_text text,

  -- Tillståndsmaskinen. pending → accepted | declined; accepted → withdrawn;
  -- pending → expired (av RPC:n när expires_at passerats). Inget annat.
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'declined', 'withdrawn', 'expired')),
  participant_message text,
  decided_at timestamptz,

  -- Samma begränsningar som profile_shares
  expires_at timestamptz,
  max_views integer CHECK (max_views IS NULL OR max_views > 0),
  view_count integer NOT NULL DEFAULT 0,
  last_viewed_at timestamptz,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Ett besvarat förslag har alltid ett svarsdatum, ett obesvarat aldrig.
  CONSTRAINT esp_decided_matches_status CHECK (
    (status = 'pending' AND decided_at IS NULL) OR
    (status <> 'pending' AND decided_at IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_esp_participant ON employer_share_proposals(participant_id);
CREATE INDEX IF NOT EXISTS idx_esp_consultant  ON employer_share_proposals(consultant_id);
CREATE INDEX IF NOT EXISTS idx_esp_placement   ON employer_share_proposals(placement_id);
CREATE INDEX IF NOT EXISTS idx_esp_status      ON employer_share_proposals(status);

COMMENT ON TABLE employer_share_proposals IS
  'AG5/AG8: ett förslag = ett samtycke per delning och per mottagare. Företag läser aldrig tabellen direkt; AG8 bygger en vitlistad läsfunktion.';

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------

ALTER TABLE employer_share_proposals ENABLE ROW LEVEL SECURITY;

-- Deltagaren ser sina förslag — även efter att konsulentrelationen upphört,
-- det är hennes egen samtyckeshistorik. Hon SKRIVER bara genom RPC:n.
CREATE POLICY "Deltagaren ser sina delningsförslag"
  ON employer_share_proposals FOR SELECT
  USING (participant_id = auth.uid());

-- Konsulenten: full åtkomst BARA med aktiv relation (KS2-mönstret, samma som
-- consultant_work_placements). Och deltagaren i förslaget måste vara den
-- platsen gäller — annars kan ett förslag om person A hängas på B:s plats.
CREATE POLICY "Konsulent hanterar förslag för aktiva deltagare"
  ON employer_share_proposals FOR ALL
  USING (
    consultant_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM consultant_participants cp
      WHERE cp.consultant_id = auth.uid()
        AND cp.participant_id = employer_share_proposals.participant_id
    )
  )
  WITH CHECK (
    consultant_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM consultant_participants cp
      WHERE cp.consultant_id = auth.uid()
        AND cp.participant_id = employer_share_proposals.participant_id
    )
    AND EXISTS (
      SELECT 1 FROM consultant_work_placements p
      WHERE p.id = employer_share_proposals.placement_id
        AND p.participant_id = employer_share_proposals.participant_id
    )
  );

DROP TRIGGER IF EXISTS trg_esp_updated_at ON employer_share_proposals;
CREATE TRIGGER trg_esp_updated_at
  BEFORE UPDATE ON employer_share_proposals
  FOR EACH ROW EXECUTE FUNCTION update_consultant_updated_at();

-- Konsulenten får inte ändra ett förslag som deltagaren redan svarat på —
-- då vore fälten hon godkände inte längre de som gäller. Hon får bara dra
-- tillbaka det (status → withdrawn). RLS kan inte uttrycka "vilka kolumner",
-- så det bor i en trigger.
CREATE OR REPLACE FUNCTION public.guard_share_proposal_after_decision()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $fn$
BEGIN
  IF OLD.status <> 'pending' THEN
    -- Tillåtet: bara status → withdrawn (+ updated_at/decided_at via samma sats)
    IF NEW.status = 'withdrawn'
       AND NEW.show_contact = OLD.show_contact AND NEW.show_summary = OLD.show_summary
       AND NEW.show_skills = OLD.show_skills AND NEW.show_experience = OLD.show_experience
       AND NEW.show_education = OLD.show_education AND NEW.show_documents = OLD.show_documents
       AND NEW.presentation_text IS NOT DISTINCT FROM OLD.presentation_text
       AND NEW.participant_id = OLD.participant_id AND NEW.placement_id = OLD.placement_id
    THEN
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'Ett besvarat delningsförslag kan bara dras tillbaka, inte ändras (id %)', OLD.id
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$fn$;

REVOKE ALL ON FUNCTION public.guard_share_proposal_after_decision() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.guard_share_proposal_after_decision() FROM anon;
REVOKE ALL ON FUNCTION public.guard_share_proposal_after_decision() FROM authenticated;

DROP TRIGGER IF EXISTS trg_esp_guard_after_decision ON employer_share_proposals;
CREATE TRIGGER trg_esp_guard_after_decision
  BEFORE UPDATE ON employer_share_proposals
  FOR EACH ROW EXECUTE FUNCTION guard_share_proposal_after_decision();

-- =============================================================================
-- 3. Deltagarens svar — den enda skrivvägen, och den loggar
-- =============================================================================
--
-- Samma mönster som grant_consent (A30): läser auth.uid() själv, tar inget
-- användar-id som argument, skriver tillstånd OCH registerrad i en transaktion.
-- FAIL CLOSED: varje avvikelse är ett RAISE, aldrig ett tyst false.

CREATE OR REPLACE FUNCTION public.respond_to_share_proposal(
  p_proposal_id uuid,
  p_decision text,          -- 'accepted' | 'declined' | 'withdrawn'
  p_message text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $fn$
DECLARE
  rad employer_share_proposals%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Inte inloggad' USING ERRCODE = 'insufficient_privilege';
  END IF;
  IF p_decision NOT IN ('accepted', 'declined', 'withdrawn') THEN
    RAISE EXCEPTION 'Ogiltigt svar: %', p_decision USING ERRCODE = 'invalid_parameter_value';
  END IF;

  SELECT * INTO rad FROM employer_share_proposals
    WHERE id = p_proposal_id AND participant_id = auth.uid()
    FOR UPDATE;
  IF NOT FOUND THEN
    -- Samma svar för "finns inte" och "inte ditt": ingen uppräkning av id:n.
    RAISE EXCEPTION 'Förslaget finns inte' USING ERRCODE = 'no_data_found';
  END IF;

  -- Ett förslag som gått ut kan inte längre accepteras — markera och stoppa.
  IF rad.status = 'pending' AND rad.expires_at IS NOT NULL AND rad.expires_at <= now() THEN
    UPDATE employer_share_proposals
      SET status = 'expired', decided_at = now()
      WHERE id = p_proposal_id;
    RAISE EXCEPTION 'Förslaget har gått ut' USING ERRCODE = 'check_violation';
  END IF;

  IF p_decision IN ('accepted', 'declined') THEN
    IF rad.status <> 'pending' THEN
      RAISE EXCEPTION 'Förslaget är redan besvarat (%)', rad.status USING ERRCODE = 'check_violation';
    END IF;
  ELSE -- withdrawn
    IF rad.status <> 'accepted' THEN
      RAISE EXCEPTION 'Bara ett godkänt förslag kan återkallas (%)', rad.status USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  UPDATE employer_share_proposals
    SET status = p_decision,
        decided_at = now(),
        participant_message = COALESCE(p_message, participant_message)
    WHERE id = p_proposal_id;

  -- Registret: ja → granted, återkallat → withdrawn. Ett nej loggas INTE som
  -- samtycke — inget gavs. Förslagsraden själv (status=declined, decided_at)
  -- är beviset för att frågan ställdes och besvarades.
  IF p_decision = 'accepted' THEN
    INSERT INTO consent_history (user_id, consent_type, action, reference_id)
      VALUES (auth.uid(), 'employer_share', 'granted', p_proposal_id);
  ELSIF p_decision = 'withdrawn' THEN
    INSERT INTO consent_history (user_id, consent_type, action, reference_id)
      VALUES (auth.uid(), 'employer_share', 'withdrawn', p_proposal_id);
  END IF;
END;
$fn$;

-- Lärdomen från A17/A30: REVOKE … FROM anon gör ingenting när PUBLIC har
-- EXECUTE. Ta bort från PUBLIC först, ge sedan uttryckligen.
REVOKE ALL ON FUNCTION public.respond_to_share_proposal(uuid, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.respond_to_share_proposal(uuid, text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.respond_to_share_proposal(uuid, text, text) TO authenticated;

-- =============================================================================
-- Verifiering efter körning (förväntat svar utskrivet — CLAUDE.md 2026-08-09)
-- =============================================================================
-- select has_function_privilege('anon', 'public.respond_to_share_proposal(uuid,text,text)', 'EXECUTE');
--   → false
-- select has_function_privilege('authenticated', 'public.respond_to_share_proposal(uuid,text,text)', 'EXECUTE');
--   → true
-- select policyname, cmd from pg_policies where tablename = 'employer_share_proposals' order by cmd;
--   → 2 rader: "Konsulent hanterar förslag för aktiva deltagare" (ALL), "Deltagaren ser sina delningsförslag" (SELECT)
-- select conname from pg_constraint where conname = 'consent_history_consent_type_check';
--   → 1 rad, och pg_get_constraintdef ska innehålla 'employer_share'
