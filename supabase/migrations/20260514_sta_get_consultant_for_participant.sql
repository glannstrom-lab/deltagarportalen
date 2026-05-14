-- =============================================================================
-- STA — RPC så deltagaren kan se sin tilldelade konsulents kontaktinfo
-- =============================================================================
-- profiles-tabellens RLS-policy "Users can view own profile" tillåter inte
-- deltagaren att läsa andra profiler. Vi behöver visa konsulentens namn på
-- deltagar-sidan. Lösning: SECURITY DEFINER-RPC som kollar att caller är
-- deltagaren i en aktiv enrollment och bara returnerar konsulentens
-- offentliga kontaktfält.

CREATE OR REPLACE FUNCTION sta_get_consultant_for_participant(p_enrollment_id UUID)
RETURNS TABLE (
  id UUID,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.first_name, p.last_name, p.email, p.phone, p.avatar_url
  FROM sta_enrollments e
  JOIN profiles p ON p.id = e.consultant_id
  WHERE e.id = p_enrollment_id
    AND e.participant_id = auth.uid();
END;
$$;

REVOKE ALL ON FUNCTION sta_get_consultant_for_participant(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION sta_get_consultant_for_participant(UUID) TO authenticated;

COMMENT ON FUNCTION sta_get_consultant_for_participant IS
  'Returnerar deltagarens tilldelade konsulent (namn/email/telefon). Kontrollerar att caller är participant_id i enrollment.';
