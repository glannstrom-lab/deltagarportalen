-- =============================================================================
-- STA — AT-roll, arbetsplats-uppföljning och AI-veckosumma-cache
-- =============================================================================
-- Tre saker:
--   1. ARBETSTERAPEUT-roll i profiles.role + profiles.roles[] för att skilja
--      arbetsterapeutens signering av skattningar från konsulent-uppdrag.
--   2. signed_by_at_id + signed_at på sta_assessments — endast en AT kan
--      signera och datum lagras.
--   3. sta_workplace_followups — veckovis uppföljning av arbetsprövning (Del 3-4).
--      Uppdraget kräver minst en uppföljning per vecka enligt AF.
--   4. ai_week_summary + ai_week_summary_generated_at på sta_enrollments —
--      cachar AI-veckosumma så konsulent inte regenererar varje gång drawer öppnas.

-- 1. Utvidga rolltyperna
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('USER', 'CONSULTANT', 'ADMIN', 'SUPERADMIN', 'ARBETSTERAPEUT'));

COMMENT ON COLUMN profiles.role IS
  'Huvudroll. ARBETSTERAPEUT är specialroll i Steg till arbete-uppdraget — bara AT får signera DOA/WRI/MOHOST/AWP/AWC.';

-- 2. Signaturkolumner på sta_assessments
ALTER TABLE sta_assessments
  ADD COLUMN IF NOT EXISTS signed_by_at_id UUID REFERENCES profiles(id);
ALTER TABLE sta_assessments
  ADD COLUMN IF NOT EXISTS signed_at TIMESTAMPTZ;

COMMENT ON COLUMN sta_assessments.signed_by_at_id IS
  'Arbetsterapeut som signerat skattningen. Krav från AF för att räkna som klar.';
COMMENT ON COLUMN sta_assessments.signed_at IS
  'Tidpunkt för AT-signering.';

-- RPC: signera en skattning. Endast användare med roll ARBETSTERAPEUT (eller
-- ADMIN/SUPERADMIN) får anropa.
CREATE OR REPLACE FUNCTION sta_sign_assessment(
  p_assessment_id UUID
) RETURNS sta_assessments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_role TEXT;
  v_result sta_assessments;
BEGIN
  SELECT role INTO v_user_role FROM profiles WHERE id = auth.uid();
  IF v_user_role NOT IN ('ARBETSTERAPEUT', 'ADMIN', 'SUPERADMIN') THEN
    RAISE EXCEPTION 'Endast arbetsterapeut kan signera skattningar (din roll: %)', v_user_role
      USING ERRCODE = '42501';
  END IF;

  UPDATE sta_assessments
    SET signed_by_at_id = auth.uid(),
        signed_at = NOW(),
        status = 'complete',
        updated_at = NOW()
    WHERE id = p_assessment_id
    RETURNING * INTO v_result;

  IF v_result.id IS NULL THEN
    RAISE EXCEPTION 'Skattningen finns inte' USING ERRCODE = '42704';
  END IF;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION sta_sign_assessment(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION sta_sign_assessment(UUID) TO authenticated;

COMMENT ON FUNCTION sta_sign_assessment IS
  'Signera en sta_assessments-rad — sätter signed_by_at_id + signed_at + status=complete. Bara ARBETSTERAPEUT/ADMIN/SUPERADMIN får anropa.';

-- 3. Veckovis uppföljning av arbetsprövning
CREATE TABLE IF NOT EXISTS sta_workplace_followups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workplace_id UUID NOT NULL REFERENCES sta_workplaces(id) ON DELETE CASCADE,
  week_number SMALLINT NOT NULL CHECK (week_number BETWEEN 1 AND 26),
  followup_date DATE NOT NULL,
  consultant_id UUID NOT NULL REFERENCES profiles(id),
  -- Vad observerades / kom upp denna vecka
  notes TEXT,
  -- Strukturerade frågor som uppdraget kräver:
  attendance_pct SMALLINT CHECK (attendance_pct BETWEEN 0 AND 100),
  -- 'good' = går bra, 'concerns' = vissa svårigheter, 'critical' = behöver omplanering
  status TEXT DEFAULT 'good' CHECK (status IN ('good', 'concerns', 'critical')),
  next_step TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (workplace_id, week_number)
);

CREATE INDEX IF NOT EXISTS idx_sta_workplace_followups_workplace ON sta_workplace_followups(workplace_id);
CREATE INDEX IF NOT EXISTS idx_sta_workplace_followups_date ON sta_workplace_followups(followup_date);

ALTER TABLE sta_workplace_followups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deltagaren ser uppföljningar på sin arbetsplats"
  ON sta_workplace_followups FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM sta_workplaces w
    JOIN sta_enrollments e ON e.id = w.enrollment_id
    WHERE w.id = workplace_id AND e.participant_id = auth.uid()
  ));

CREATE POLICY "Konsulent full access till uppföljningar"
  ON sta_workplace_followups FOR ALL
  USING (EXISTS (
    SELECT 1 FROM sta_workplaces w
    JOIN sta_enrollments e ON e.id = w.enrollment_id
    WHERE w.id = workplace_id AND e.consultant_id = auth.uid()
  ));

COMMENT ON TABLE sta_workplace_followups IS
  'Veckovis uppföljning av arbetsprövning (Del 3-4). Uppdraget kräver minst en per vecka. Underlag till delredovisning.';

-- 4. AI-veckosumma-cache
ALTER TABLE sta_enrollments
  ADD COLUMN IF NOT EXISTS ai_week_summary TEXT;
ALTER TABLE sta_enrollments
  ADD COLUMN IF NOT EXISTS ai_week_summary_generated_at TIMESTAMPTZ;

COMMENT ON COLUMN sta_enrollments.ai_week_summary IS
  'Cachad AI-genererad veckosumma. Regenereras manuellt av konsulent från drawer.';
