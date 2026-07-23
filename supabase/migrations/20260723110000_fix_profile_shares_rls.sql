-- ============================================
-- A7 (2026-07-23): Stäng anonym enumeration av profile_shares
-- ============================================
-- Problemet (LOW-2605-03, uppgraderad): "Public can view shares by code"
-- hade USING (true) + GRANT SELECT TO anon → vem som helst kunde lista
-- ALLA delningar (share_code, user_id, visningsflaggor) utan att kunna
-- koden. Samma klass som invitations-hålet (A10).
--
-- Fixen: tokenmatchad SECURITY DEFINER-RPC som gör hela jobbet server-
-- side — validerar delningen (utgång/max_views), räknar upp view_count
-- (fungerade tidigare inte alls för anonyma besökare: de saknade
-- UPDATE-rättighet) och bygger den filtrerade profilen enligt
-- delningens flaggor. Klienten (profileEnhancementsApi.getSharedProfile)
-- anropar RPC:n i stället för fyra separata tabelläsningar.
-- password_hash exponeras aldrig (var tidigare med i SELECT *).

-- 1. Bort med den öppna policyn + anon-grantet
DROP POLICY IF EXISTS "Public can view shares by code" ON profile_shares;
REVOKE ALL ON profile_shares FROM anon;

-- 2. Kodmatchad läsning via RPC
CREATE OR REPLACE FUNCTION get_shared_profile(p_share_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_share profile_shares%ROWTYPE;
  v_prof profiles%ROWTYPE;
  v_profile jsonb;
  v_cv record;
BEGIN
  SELECT * INTO v_share FROM profile_shares WHERE share_code = p_share_code;
  IF NOT FOUND THEN RETURN NULL; END IF;
  IF v_share.expires_at IS NOT NULL AND v_share.expires_at < now() THEN RETURN NULL; END IF;
  IF v_share.max_views IS NOT NULL AND v_share.view_count >= v_share.max_views THEN RETURN NULL; END IF;

  UPDATE profile_shares
  SET view_count = view_count + 1, last_viewed_at = now()
  WHERE id = v_share.id;

  SELECT * INTO v_prof FROM profiles WHERE id = v_share.user_id;
  IF NOT FOUND THEN RETURN NULL; END IF;

  v_profile := jsonb_build_object(
    'first_name', v_prof.first_name,
    'last_name', v_prof.last_name,
    'profile_image_url', v_prof.profile_image_url
  );

  IF v_share.show_contact THEN
    v_profile := v_profile || jsonb_build_object(
      'email', v_prof.email,
      'phone', v_prof.phone,
      'location', v_prof.location
    );
  END IF;

  IF v_share.show_summary THEN
    v_profile := v_profile || jsonb_build_object('ai_summary', v_prof.ai_summary);
  END IF;

  IF v_share.show_skills THEN
    v_profile := v_profile || jsonb_build_object('skills',
      COALESCE(
        (SELECT jsonb_agg(to_jsonb(s)) FROM profile_skills s WHERE s.user_id = v_share.user_id),
        '[]'::jsonb
      ));
  END IF;

  IF v_share.show_experience OR v_share.show_education THEN
    SELECT work_experience, education INTO v_cv FROM cvs WHERE user_id = v_share.user_id LIMIT 1;
    IF v_share.show_experience THEN
      v_profile := v_profile || jsonb_build_object('work_experience', v_cv.work_experience);
    END IF;
    IF v_share.show_education THEN
      v_profile := v_profile || jsonb_build_object('education', v_cv.education);
    END IF;
  END IF;

  IF v_share.show_documents THEN
    v_profile := v_profile || jsonb_build_object('documents',
      COALESCE(
        (SELECT jsonb_agg(to_jsonb(d)) FROM profile_documents d WHERE d.user_id = v_share.user_id),
        '[]'::jsonb
      ));
  END IF;

  RETURN jsonb_build_object(
    'profile', v_profile,
    'share', jsonb_build_object(
      'id', v_share.id,
      'name', v_share.name,
      'show_contact', v_share.show_contact,
      'show_skills', v_share.show_skills,
      'show_experience', v_share.show_experience,
      'show_education', v_share.show_education,
      'show_documents', v_share.show_documents,
      'show_summary', v_share.show_summary,
      'expires_at', v_share.expires_at,
      'view_count', v_share.view_count + 1,
      'max_views', v_share.max_views,
      'created_at', v_share.created_at
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION get_shared_profile(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_shared_profile(text) TO anon, authenticated;
