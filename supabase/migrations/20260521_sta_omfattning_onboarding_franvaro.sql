-- =============================================================================
-- STA — Aktivitetsomfattning, onboarding-status och frånvaroanmälan
-- =============================================================================
-- Lägger till tre saker till STA-datamodellen:
--   1. weekly_hours på sta_enrollments — 10-40h/vecka, deltagaren kan justera
--      själv via RPC. Konsulent uppdaterar via vanlig UPDATE.
--   2. onboarding_completed_at på sta_enrollments — sätts när deltagaren gått
--      igenom intro-flödet på sidan. Används för att visa onboarding-prompt.
--   3. sta_absences-tabell — deltagaren kan sjukanmäla sig, konsulent ser
--      närvarobilden. Underlag till AF-rapport.

-- 1. weekly_hours + onboarding_completed_at
ALTER TABLE sta_enrollments
  ADD COLUMN IF NOT EXISTS weekly_hours SMALLINT NOT NULL DEFAULT 25
    CHECK (weekly_hours BETWEEN 10 AND 40);

ALTER TABLE sta_enrollments
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

COMMENT ON COLUMN sta_enrollments.weekly_hours IS
  'Aktivitetsomfattning i timmar/vecka (10-40). Deltagaren kan justera via sta_participant_update_self.';
COMMENT ON COLUMN sta_enrollments.onboarding_completed_at IS
  'Tidpunkt då deltagaren slutfört intro-flödet. NULL = ej genomfört (visa onboarding-prompt).';

-- 2. Utvidga participant-RPC så deltagaren kan uppdatera weekly_hours och
--    markera onboarding klart utöver started_at. Behåller den gamla RPC:n
--    bakåtkompatibel — den anropar bara nya med endast datum-fält.
CREATE OR REPLACE FUNCTION sta_participant_update_self(
  p_enrollment_id UUID,
  p_started_at DATE DEFAULT NULL,
  p_weekly_hours SMALLINT DEFAULT NULL,
  p_mark_onboarding_done BOOLEAN DEFAULT FALSE
) RETURNS sta_enrollments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result sta_enrollments;
BEGIN
  -- Validera weekly_hours-intervall innan vi rör DB
  IF p_weekly_hours IS NOT NULL AND (p_weekly_hours < 10 OR p_weekly_hours > 40) THEN
    RAISE EXCEPTION 'weekly_hours måste vara mellan 10 och 40'
      USING ERRCODE = '22023'; -- invalid_parameter_value
  END IF;

  UPDATE sta_enrollments
    SET
      started_at = COALESCE(p_started_at, started_at),
      part_started_at = CASE
        WHEN p_started_at IS NOT NULL THEN p_started_at
        ELSE part_started_at
      END,
      weekly_hours = COALESCE(p_weekly_hours, weekly_hours),
      onboarding_completed_at = CASE
        WHEN p_mark_onboarding_done AND onboarding_completed_at IS NULL THEN NOW()
        ELSE onboarding_completed_at
      END,
      updated_at = NOW()
    WHERE id = p_enrollment_id
      AND participant_id = auth.uid()
    RETURNING * INTO v_result;

  IF v_result.id IS NULL THEN
    RAISE EXCEPTION 'Enrollment finns inte eller ägs inte av dig'
      USING ERRCODE = '42501';
  END IF;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION sta_participant_update_self(UUID, DATE, SMALLINT, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION sta_participant_update_self(UUID, DATE, SMALLINT, BOOLEAN) TO authenticated;

COMMENT ON FUNCTION sta_participant_update_self IS
  'Tillåter deltagare att uppdatera sina egna fält (started_at, weekly_hours, onboarding). Konsulent uppdaterar via vanlig UPDATE. Alla parametrar är optionella — bara icke-null uppdateras.';

-- 3. Frånvaroanmälan
CREATE TABLE IF NOT EXISTS sta_absences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES sta_enrollments(id) ON DELETE CASCADE,
  absence_date DATE NOT NULL,
  kind TEXT NOT NULL DEFAULT 'sick'
    CHECK (kind IN ('sick', 'vab', 'other', 'allowed')),
  -- 'sick' = egen sjukdom, 'vab' = vård av barn,
  -- 'allowed' = beviljad frånvaro (möten, vård), 'other' = annat skäl
  reason TEXT,  -- fritext om deltagaren vill specificera
  reported_by UUID NOT NULL REFERENCES profiles(id),
  reported_at TIMESTAMPTZ DEFAULT NOW(),
  consultant_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- En frånvaroanmälan per dag och deltagare (upsert)
  UNIQUE (enrollment_id, absence_date)
);

CREATE INDEX IF NOT EXISTS idx_sta_absences_enrollment ON sta_absences(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_sta_absences_date ON sta_absences(absence_date);

ALTER TABLE sta_absences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deltagaren ser och hanterar sina frånvaroanmälningar"
  ON sta_absences FOR ALL
  USING (EXISTS (
    SELECT 1 FROM sta_enrollments e
    WHERE e.id = enrollment_id AND e.participant_id = auth.uid()
  ));

CREATE POLICY "Konsulent har full access till sina deltagares frånvaro"
  ON sta_absences FOR ALL
  USING (EXISTS (
    SELECT 1 FROM sta_enrollments e
    WHERE e.id = enrollment_id AND e.consultant_id = auth.uid()
  ));

COMMENT ON TABLE sta_absences IS
  'Frånvaroanmälningar — deltagaren rapporterar själv via portalen. Konsulent kan komplettera med kommentar. Underlag till AF-rapportering.';
