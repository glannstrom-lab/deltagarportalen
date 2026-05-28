-- =============================================================================
-- STA — Deltagar-självskattning för DOA
-- =============================================================================
--
-- Syfte: låt deltagaren själv skatta DOA-items (sta_assessments.scores.person)
-- utan att kunna manipulera bedömar-skattningar, sammanfattningar eller status.
--
-- Säkerhetsmodell:
--   1. Ny RLS-policy: deltagaren får skapa sta_assessments-raden för sin egen
--      enrollment, men endast för instrument='DOA' och part=1.
--   2. RPC sta_participant_save_doa_score körs som SECURITY DEFINER och
--      validerar ägarskap + uppdaterar endast person-fält i scores-JSONB.
--   3. AT:s bedömar-fält och status='complete'/'submitted_to_af' kan ALDRIG
--      ändras via deltagar-RPC.
--
-- Datalayout i scores (matchar AssessmentEditor):
--   {
--     "_bedomningar": [{ "id": "b1" }],
--     "b1_c0_i0": { "person": 4, "bedomare": 3, "comment": "..." },
--     "b1_c0_i1": { "person": 5, "comment": "" },
--     ...
--     "_participant_completed_at": "2026-05-28T12:34:56Z"
--   }
-- =============================================================================

-- INSERT-policy: deltagaren får skapa sin egen DOA Del 1-skattning (men inga
-- andra instrument eller delar — det är AT:s jobb).
DROP POLICY IF EXISTS "Deltagaren skapar egen DOA Del 1" ON sta_assessments;
CREATE POLICY "Deltagaren skapar egen DOA Del 1"
  ON sta_assessments FOR INSERT
  WITH CHECK (
    instrument = 'DOA'
    AND part = 1
    AND status = 'draft'
    AND EXISTS (
      SELECT 1 FROM sta_enrollments e
      WHERE e.id = enrollment_id AND e.participant_id = auth.uid()
    )
  );

-- Notera: vi GER INTE deltagaren generell UPDATE-rättighet. Uppdateringar
-- sker via RPC nedan, som validerar exakt vilka fält som får ändras.

-- =============================================================================
-- RPC: sta_participant_save_doa_score
-- =============================================================================
-- Uppdaterar EN items person-skattning och kommentar.
-- Skapar assessment-raden om den inte finns.
-- Returnerar uppdaterad assessment.
--
-- Anropas från frontend en gång per item när deltagaren ändrar sin skattning.
-- Effektivt eftersom JSONB-fältuppdatering är cheap, och vi får audit-trail
-- via sta_assessments.updated_at.

CREATE OR REPLACE FUNCTION sta_participant_save_doa_score(
  p_enrollment_id UUID,
  p_cat_index INT,
  p_item_index INT,
  p_person_value INT,          -- 1-5 eller NULL för att rensa
  p_comment TEXT               -- valfri kommentar, eller NULL för att lämna
)
RETURNS sta_assessments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_assessment sta_assessments;
  v_item_key TEXT;
  v_current_entry JSONB;
  v_new_entry JSONB;
  v_new_scores JSONB;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'unauthorized' USING ERRCODE = '42501';
  END IF;

  -- Validera att enrollment tillhör inloggad användare som deltagare
  IF NOT EXISTS (
    SELECT 1 FROM sta_enrollments
    WHERE id = p_enrollment_id AND participant_id = v_user
  ) THEN
    RAISE EXCEPTION 'enrollment not found or access denied' USING ERRCODE = '42501';
  END IF;

  -- Validera input
  IF p_cat_index < 0 OR p_cat_index > 4 THEN
    RAISE EXCEPTION 'invalid cat_index — must be 0-4 for DOA' USING ERRCODE = '22023';
  END IF;
  IF p_item_index < 0 OR p_item_index > 8 THEN
    RAISE EXCEPTION 'invalid item_index — must be 0-8' USING ERRCODE = '22023';
  END IF;
  IF p_person_value IS NOT NULL AND (p_person_value < 1 OR p_person_value > 5) THEN
    RAISE EXCEPTION 'invalid person_value — must be 1-5 or NULL' USING ERRCODE = '22023';
  END IF;

  -- Hämta eller skapa assessment-raden
  SELECT * INTO v_assessment
    FROM sta_assessments
    WHERE enrollment_id = p_enrollment_id
      AND part = 1
      AND instrument = 'DOA'
    ORDER BY created_at DESC
    LIMIT 1;

  IF v_assessment IS NULL THEN
    INSERT INTO sta_assessments (enrollment_id, part, instrument, status, scores)
    VALUES (
      p_enrollment_id, 1, 'DOA', 'draft',
      jsonb_build_object('_bedomningar', jsonb_build_array(jsonb_build_object('id', 'b1')))
    )
    RETURNING * INTO v_assessment;
  END IF;

  -- Block: får inte ändras om AT signerat
  IF v_assessment.status = 'submitted_to_af' THEN
    RAISE EXCEPTION 'assessment already submitted, no further edits allowed' USING ERRCODE = '22000';
  END IF;

  -- Bygg item-nyckel enligt AssessmentEditor-format: b1_c{cat}_i{item}
  v_item_key := 'b1_c' || p_cat_index || '_i' || p_item_index;

  -- Hämta nuvarande värde, bevara bedomare-fältet (AT:s data)
  v_current_entry := COALESCE(v_assessment.scores -> v_item_key, '{}'::jsonb);

  -- Bygg nytt värde — endast person och comment, bedomare bevaras
  v_new_entry := v_current_entry;
  IF p_person_value IS NULL THEN
    v_new_entry := v_new_entry - 'person';
  ELSE
    v_new_entry := jsonb_set(v_new_entry, '{person}', to_jsonb(p_person_value), true);
  END IF;

  IF p_comment IS NOT NULL THEN
    v_new_entry := jsonb_set(v_new_entry, '{comment}', to_jsonb(p_comment), true);
  END IF;

  -- Uppdatera scores med nytt item-värde, behåll _bedomningar och alla andra items
  v_new_scores := COALESCE(v_assessment.scores, '{}'::jsonb);
  v_new_scores := jsonb_set(v_new_scores, ARRAY[v_item_key], v_new_entry, true);

  -- Säkerställ att _bedomningar finns
  IF NOT (v_new_scores ? '_bedomningar') THEN
    v_new_scores := jsonb_set(
      v_new_scores, '{_bedomningar}',
      jsonb_build_array(jsonb_build_object('id', 'b1')),
      true
    );
  END IF;

  UPDATE sta_assessments
  SET scores = v_new_scores,
      updated_at = NOW()
  WHERE id = v_assessment.id
  RETURNING * INTO v_assessment;

  RETURN v_assessment;
END;
$$;

REVOKE ALL ON FUNCTION sta_participant_save_doa_score(UUID, INT, INT, INT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION sta_participant_save_doa_score(UUID, INT, INT, INT, TEXT) TO authenticated;

COMMENT ON FUNCTION sta_participant_save_doa_score IS
  'Deltagaren skattar sin egen DOA-rad. Kan endast skriva person-värde och kommentar, aldrig bedömar-värde eller status.';

-- =============================================================================
-- RPC: sta_participant_mark_doa_done
-- =============================================================================
-- Markerar deltagar-skattningen som klar (sätter scores._participant_completed_at).
-- Status flyttas INTE till 'complete' — det är fortfarande AT som måste skatta
-- bedömar-kolumnen och signera.

CREATE OR REPLACE FUNCTION sta_participant_mark_doa_done(
  p_enrollment_id UUID
)
RETURNS sta_assessments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_assessment sta_assessments;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'unauthorized' USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM sta_enrollments
    WHERE id = p_enrollment_id AND participant_id = v_user
  ) THEN
    RAISE EXCEPTION 'enrollment not found or access denied' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_assessment
    FROM sta_assessments
    WHERE enrollment_id = p_enrollment_id
      AND part = 1
      AND instrument = 'DOA'
    ORDER BY created_at DESC
    LIMIT 1;

  IF v_assessment IS NULL THEN
    RAISE EXCEPTION 'no DOA assessment to mark done — fill in some items first' USING ERRCODE = '22000';
  END IF;

  UPDATE sta_assessments
  SET scores = jsonb_set(
        COALESCE(scores, '{}'::jsonb),
        '{_participant_completed_at}',
        to_jsonb(NOW()),
        true
      ),
      updated_at = NOW()
  WHERE id = v_assessment.id
  RETURNING * INTO v_assessment;

  RETURN v_assessment;
END;
$$;

REVOKE ALL ON FUNCTION sta_participant_mark_doa_done(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION sta_participant_mark_doa_done(UUID) TO authenticated;

COMMENT ON FUNCTION sta_participant_mark_doa_done IS
  'Deltagaren markerar sin DOA-självskattning som klar. Påverkar inte assessment.status — det är AT:s ansvar.';
