-- =============================================================================
-- STA — Tillåt deltagare att redigera startdatum på sin egen enrollment
-- =============================================================================
-- Konsulent har redan FOR ALL via "Konsulent ser sina deltagares enrollments".
-- Deltagaren har bara SELECT idag. Vi vill att hen ska kunna justera startdatum
-- (men inte t.ex. current_part, status, consultant_id).
--
-- Lösning: SECURITY DEFINER-RPC som endast uppdaterar started_at + part_started_at
-- och bara om auth.uid() = participant_id. Säkrare än kolumn-GRANT eftersom RLS
-- inte stödjer kolumn-restriktion direkt.

CREATE OR REPLACE FUNCTION sta_participant_update_start_date(
  p_enrollment_id UUID,
  p_started_at DATE
) RETURNS sta_enrollments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result sta_enrollments;
BEGIN
  -- Endast deltagaren själv kan uppdatera sitt startdatum
  UPDATE sta_enrollments
    SET started_at = p_started_at,
        part_started_at = p_started_at,
        updated_at = NOW()
    WHERE id = p_enrollment_id
      AND participant_id = auth.uid()
    RETURNING * INTO v_result;

  IF v_result.id IS NULL THEN
    RAISE EXCEPTION 'Enrollment finns inte eller ägs inte av dig'
      USING ERRCODE = '42501'; -- insufficient_privilege
  END IF;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION sta_participant_update_start_date(UUID, DATE) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION sta_participant_update_start_date(UUID, DATE) TO authenticated;

COMMENT ON FUNCTION sta_participant_update_start_date IS
  'Tillåter deltagare att uppdatera started_at + part_started_at på sin egen enrollment. Konsulent uppdaterar via vanlig UPDATE.';
