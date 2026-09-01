-- KS3 — den enda levande inbjudningsvagen hade ingen samtyckesruta
--
-- MATT MOT PROD: 31 kopplingar i `consultant_participants`, 18 med samtycke i
-- `consultant_consents` — ALLA med program = 'steg_till_arbete'. 13 har inget.
--
-- ORSAKEN, laest i koden:
--   * `InviteHandler.tsx:110` — `consentOk = !isStaInvite || (...)`. Rutorna visas bara
--     for STA-inbjudningar, och STA ar avstangd sedan 3 augusti. Den levande vagen
--     (`InviteParticipantDialog`) visar dem aldrig.
--   * `handle_first_signin()` skriver `consultant_consents` bara nar inbjudan bar
--     `metadata->>'consent_text'`. Bara `staApi.ts` satter det faltet.
--   * `handle_invitation_acceptance()` satter daremot `profiles.consultant_id` och
--     `consultant_participants` OVILLKORLIGT.
--
-- Kopplingen skapas alltsa alltid, samtycket bara ibland. De 13 far sitt CV, sin
-- ATS-poang, sin Hollandkod och sin inloggningsaktivitet visade for en namngiven person
-- utan att ha sagt ja.
--
-- BESLUT MIKAEL 2026-09-01: efterhandsfraga i portalen. Kopplingen bestar tills personen
-- svarar; svarar hen nej bryts den.
--
-- VARFOR EN RPC OCH INTE EN INSERT-POLICY: `consultant_consents` har i dag tre policyer
-- (SELECT for bada parter, UPDATE av `revoked_at` for deltagaren) och INGEN INSERT-policy.
-- Att oppna INSERT for `authenticated` hade latit vem som helst skriva en samtyckesrad
-- om vilken koppling som helst — och en samtyckesrad ar bevisning. Funktionen nedan tar
-- inte emot vare sig deltagar- eller konsulent-id: den harleder bada ur `auth.uid()` och
-- `profiles.consultant_id`, sa den kan strukturellt inte anvandas for nagon annans rakning.

-- `granted_via` bar en CHECK med tre varden: invitation, consultant_request, manual_link.
-- Efterhandsfragan ar en fjarde vag in och maste synas som en egen — den sager nagot annat
-- om samtyckets omstandigheter an de tre befintliga, och det ar hela poangen med kolumnen.
-- (Hittad av torrkorningen: forsta forsoket foll pa 23514.)
ALTER TABLE consultant_consents DROP CONSTRAINT IF EXISTS consultant_consents_granted_via_check;
ALTER TABLE consultant_consents ADD CONSTRAINT consultant_consents_granted_via_check
  CHECK (granted_via = ANY (ARRAY['invitation','consultant_request','manual_link','efterhandsfraga']));

CREATE OR REPLACE FUNCTION public.grant_consultant_consent(
  p_consent_text text,
  p_scope jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $fn$
DECLARE
  v_participant uuid := auth.uid();
  v_consultant uuid;
  v_id uuid;
BEGIN
  IF v_participant IS NULL THEN
    RAISE EXCEPTION 'Inte inloggad' USING ERRCODE = '42501';
  END IF;

  -- Texten ar bevisningen. En samtyckesrad utan den text personen faktiskt sag ar
  -- varre an ingen rad alls — da pastar registret nagot vi inte kan styrka.
  IF p_consent_text IS NULL OR btrim(p_consent_text) = '' THEN
    RAISE EXCEPTION 'Samtyckestexten maste sparas med samtycket' USING ERRCODE = '22023';
  END IF;

  SELECT consultant_id INTO v_consultant FROM profiles WHERE id = v_participant;

  IF v_consultant IS NULL THEN
    RAISE EXCEPTION 'Ingen konsulentkoppling att samtycka till' USING ERRCODE = '22023';
  END IF;

  -- Idempotent, samma villkor som `handle_first_signin` anvander.
  SELECT id INTO v_id
  FROM consultant_consents
  WHERE participant_id = v_participant
    AND consultant_id = v_consultant
    AND revoked_at IS NULL
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    RETURN v_id;
  END IF;

  INSERT INTO consultant_consents (
    participant_id, consultant_id, program, scope, granted_text, granted_via
  ) VALUES (
    v_participant, v_consultant,
    (SELECT program FROM profiles WHERE id = v_participant),
    COALESCE(p_scope, '{}'::jsonb), p_consent_text, 'efterhandsfraga'
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$fn$;

REVOKE ALL ON FUNCTION public.grant_consultant_consent(text, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.grant_consultant_consent(text, jsonb) FROM anon;
GRANT EXECUTE ON FUNCTION public.grant_consultant_consent(text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.grant_consultant_consent(text, jsonb) TO service_role;
