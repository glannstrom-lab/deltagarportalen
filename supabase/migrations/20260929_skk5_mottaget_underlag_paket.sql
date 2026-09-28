-- SKK5 (skarpt test 2026-09-28): underlagspaketets PDF gick bara att ladda ner i samma
-- stund som konsulenten markerade underlaget som lämnat. Handläggaren — som behöver
-- dokumentet till sin akt — kunde aldrig hämta det.
--
-- Den här funktionen lämnar ut exakt det paketet bygger på, för ETT underlag som lämnats
-- till den inloggade handläggaren (recipient_user_id = auth.uid()): underlagsraden,
-- planens id/deltagare/organisation/ärendenummer, passen i perioden och namnen på
-- deltagaren och på dem som markerat passen. Ingen läsrätt på deltagarens konto i övrigt
-- (samma princip som mina_mottagna_underlag, 20260928_kh_underlag_till_handlaggare.sql).
-- Ett ångrat underlag lämnas ut (paketet märker det som ångrat) — det är en del av akten.

CREATE OR REPLACE FUNCTION public.mottaget_underlag_paket(p_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  h activity_plan_handovers%ROWTYPE;
  v_plan jsonb;
  v_pass jsonb;
  v_namn jsonb;
  v_org jsonb;
BEGIN
  SELECT * INTO h FROM activity_plan_handovers WHERE id = p_id AND recipient_user_id = auth.uid();
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Underlaget finns inte, eller är inte lämnat till dig' USING ERRCODE = '42501';
  END IF;

  SELECT jsonb_build_object('id', p.id, 'participant_id', p.participant_id, 'org_id', p.org_id, 'case_reference', p.case_reference)
    INTO v_plan FROM activity_plans p WHERE p.id = h.plan_id;

  SELECT coalesce(jsonb_agg(to_jsonb(s) ORDER BY s.date, s.start_time), '[]'::jsonb)
    INTO v_pass
    FROM activity_sessions s
   WHERE s.plan_id = h.plan_id AND s.date BETWEEN h.period_from AND h.period_to;

  SELECT coalesce(jsonb_object_agg(pr.id, trim(coalesce(pr.first_name, '') || ' ' || coalesce(pr.last_name, ''))), '{}'::jsonb)
    INTO v_namn
    FROM profiles pr
   WHERE pr.id = h.participant_id
      OR pr.id = h.handed_over_by
      OR pr.id IN (SELECT s.marked_by FROM activity_sessions s
                    WHERE s.plan_id = h.plan_id AND s.date BETWEEN h.period_from AND h.period_to AND s.marked_by IS NOT NULL);

  SELECT jsonb_build_object('name', o.name, 'kind', o.kind) INTO v_org FROM organizations o WHERE o.id = h.org_id;

  RETURN jsonb_build_object(
    'underlag', to_jsonb(h),
    'plan', v_plan,
    'pass', v_pass,
    'namn', v_namn,
    'org', v_org
  );
END;
$$;
REVOKE ALL ON FUNCTION public.mottaget_underlag_paket(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mottaget_underlag_paket(uuid) TO authenticated;
