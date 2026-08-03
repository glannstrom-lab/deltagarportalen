-- ============================================
-- UX12 (2026-08-03): Deltagare kan inte se sin egen konsulent
-- ============================================
-- Problemet: `profiles` har tre SELECT-policies — egen profil, admin, och
-- "Consultants can view assigned participant profiles" (consultant_id =
-- auth.uid()). Den OMVÄNDA riktningen saknades helt: en deltagare får inte
-- läsa profilen för den konsulent som är tilldelad hen.
--
-- Mätt i prod 2026-08-03: **31 deltagare har en konsulent tilldelad och ingen
-- av dem kan se vem det är.** `/my-consultant` svarar 406 PGRST116 och visar
-- "Ingen konsulent tilldelad ännu"; samtyckesvyn (DataSharingSettings) sväljer
-- felet tyst och skriver ut inget namn — deltagaren ska alltså godkänna
-- datadelning med en person portalen vägrar namnge.
--
-- Vald lösning: SECURITY DEFINER-RPC, inte en ny SELECT-policy.
-- En policy i stil med `id IN (SELECT consultant_id FROM profiles WHERE
-- id = auth.uid())` hade gett deltagaren HELA konsulentens profilrad —
-- samtyckestidsstämplar, hälsoflaggor, roller, allt. RPC:n lämnar ut exakt de
-- sex fält som kontaktkortet behöver. Samma mönster som `get_shared_profile`
-- (A7, 20260723110000).

CREATE OR REPLACE FUNCTION get_my_consultant()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_consultant_id uuid;
  v_prof profiles%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;

  -- Uppslaget utgår ALLTID från den inloggades egen rad. Funktionen tar inga
  -- parametrar med flit: utan indata finns inget att manipulera, och ingen kan
  -- be om någon annans konsulent.
  SELECT consultant_id INTO v_consultant_id
  FROM profiles
  WHERE id = auth.uid();

  IF v_consultant_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT * INTO v_prof FROM profiles WHERE id = v_consultant_id;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Endast kontaktuppgifter. Ingen roll, inga samtyckesfält, ingen fritext.
  RETURN jsonb_build_object(
    'id',         v_prof.id,
    'first_name', v_prof.first_name,
    'last_name',  v_prof.last_name,
    'email',      v_prof.email,
    'phone',      v_prof.phone,
    'avatar_url', v_prof.avatar_url
  );
END;
$$;

COMMENT ON FUNCTION get_my_consultant() IS
  'UX12: returnerar kontaktuppgifter för den inloggade deltagarens tilldelade konsulent. SECURITY DEFINER — profiles saknar SELECT-policy i den riktningen med flit.';

REVOKE ALL ON FUNCTION get_my_consultant() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_my_consultant() TO authenticated;
