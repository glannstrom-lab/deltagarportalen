-- F10-prov: kör migrationens DDL i en transaktion, spelar upp scenariot som
-- konsulent/deltagare/utomstående och RULLAR TILLBAKA via RAISE. Ingenting
-- lämnas i prod. Kör:  npx supabase db query --linked -f e2e/f10-underlag-prov.sql
-- (Migrationsfilen är källan; DDL:n nedan är en kopia — håll dem lika.)
-- Utfall 2026-09-13 mot prod: backfill 1 rad | konsulent lämnar=1, planens datum synkat=i dag |
-- ändra mottagare=42501 | deltagaren ser=2 (backfillraden + den nya) | deltagaren skriver=42501 |
-- utomstående ser=0 | ångra OK, planens datum faller tillbaka på backfillradens datum | radera=42501.
DO $$
DECLARE
  v_plan uuid; v_deltagare uuid; v_konsulent uuid; v_org uuid; v_annan uuid;
  v_h uuid; v_n int; v_datum date; v_txt text;
  r1 text := ''; r2 text := ''; r3 text := ''; r4 text := ''; r5 text := ''; r6 text := ''; r7 text := ''; r8 text := '';
BEGIN
  -- === DDL (samma som migrationen) =========================================
  CREATE TABLE IF NOT EXISTS public.activity_plan_handovers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id uuid NOT NULL REFERENCES public.activity_plans(id) ON DELETE CASCADE,
    participant_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    consultant_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    org_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
    handed_over_at timestamptz NOT NULL DEFAULT now(),
    handed_over_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    recipient text NOT NULL, period_from date NOT NULL, period_to date NOT NULL,
    summary jsonb NOT NULL DEFAULT '{}'::jsonb, note text,
    withdrawn_at timestamptz, withdrawn_reason text,
    created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT activity_plan_handovers_recipient_check CHECK (length(trim(recipient)) BETWEEN 1 AND 200),
    CONSTRAINT activity_plan_handovers_period_check CHECK (period_from <= period_to),
    CONSTRAINT activity_plan_handovers_withdrawn_pair_check CHECK ((withdrawn_at IS NULL) = (withdrawn_reason IS NULL))
  );
  ALTER TABLE public.activity_plan_handovers ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "Konsulent hanterar underlag för aktiva deltagare" ON public.activity_plan_handovers FOR ALL
    USING (consultant_id = auth.uid() AND EXISTS (SELECT 1 FROM public.consultant_participants cp WHERE cp.consultant_id = auth.uid() AND cp.participant_id = activity_plan_handovers.participant_id))
    WITH CHECK (consultant_id = auth.uid() AND handed_over_by = auth.uid()
      AND EXISTS (SELECT 1 FROM public.consultant_participants cp WHERE cp.consultant_id = auth.uid() AND cp.participant_id = activity_plan_handovers.participant_id)
      AND EXISTS (SELECT 1 FROM public.activity_plans p WHERE p.id = activity_plan_handovers.plan_id AND p.participant_id = activity_plan_handovers.participant_id AND p.consultant_id = auth.uid()));
  CREATE POLICY "Organisationens chef läser underlag" ON public.activity_plan_handovers FOR SELECT
    USING (org_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.organization_members m WHERE m.org_id = activity_plan_handovers.org_id AND m.user_id = auth.uid() AND m.role = ANY (ARRAY['chef'::text,'admin'::text])));
  CREATE POLICY "Deltagaren ser lämnade underlag om sig" ON public.activity_plan_handovers FOR SELECT USING (participant_id = auth.uid());

  CREATE OR REPLACE FUNCTION public.activity_plan_handovers_guard() RETURNS trigger LANGUAGE plpgsql AS $f$
  BEGIN
    IF (to_jsonb(OLD) - 'withdrawn_at' - 'withdrawn_reason' - 'updated_at') IS DISTINCT FROM (to_jsonb(NEW) - 'withdrawn_at' - 'withdrawn_reason' - 'updated_at') THEN
      RAISE EXCEPTION 'Ett lämnat underlag går inte att ändra — bara ångra samma dag' USING ERRCODE = '42501'; END IF;
    IF NEW.withdrawn_at IS DISTINCT FROM OLD.withdrawn_at THEN
      IF OLD.withdrawn_at IS NOT NULL THEN RAISE EXCEPTION 'Underlaget är redan ångrat' USING ERRCODE = '42501'; END IF;
      IF auth.uid() IS DISTINCT FROM OLD.handed_over_by THEN RAISE EXCEPTION 'Bara den som lämnade underlaget kan ångra det' USING ERRCODE = '42501'; END IF;
      IF (OLD.handed_over_at AT TIME ZONE 'Europe/Stockholm')::date <> (now() AT TIME ZONE 'Europe/Stockholm')::date THEN RAISE EXCEPTION 'Ett underlag kan bara ångras samma dag som det lämnades' USING ERRCODE = '42501'; END IF;
    END IF;
    NEW.updated_at := now(); RETURN NEW;
  END; $f$;
  CREATE TRIGGER trg_activity_plan_handovers_guard BEFORE UPDATE ON public.activity_plan_handovers FOR EACH ROW EXECUTE FUNCTION public.activity_plan_handovers_guard();
  CREATE OR REPLACE FUNCTION public.activity_plan_handovers_no_delete() RETURNS trigger LANGUAGE plpgsql AS $f$
  BEGIN RAISE EXCEPTION 'Lämnade underlag raderas inte — ångra i stället' USING ERRCODE = '42501'; END; $f$;
  CREATE TRIGGER trg_activity_plan_handovers_no_delete BEFORE DELETE ON public.activity_plan_handovers FOR EACH ROW EXECUTE FUNCTION public.activity_plan_handovers_no_delete();
  CREATE OR REPLACE FUNCTION public.activity_plan_handovers_sync_plan() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $f$
  DECLARE v_plan uuid; BEGIN
    v_plan := COALESCE(NEW.plan_id, OLD.plan_id);
    UPDATE activity_plans p SET nedsattning_underlag_lamnat_at = (SELECT (max(h.handed_over_at) AT TIME ZONE 'Europe/Stockholm')::date FROM activity_plan_handovers h WHERE h.plan_id = v_plan AND h.withdrawn_at IS NULL) WHERE p.id = v_plan;
    RETURN COALESCE(NEW, OLD); END; $f$;
  CREATE TRIGGER trg_activity_plan_handovers_sync_plan AFTER INSERT OR UPDATE OF withdrawn_at ON public.activity_plan_handovers FOR EACH ROW EXECUTE FUNCTION public.activity_plan_handovers_sync_plan();

  -- Backfill som i migrationen
  INSERT INTO public.activity_plan_handovers (plan_id, participant_id, consultant_id, org_id, handed_over_at, handed_over_by, recipient, period_from, period_to, summary, note)
  SELECT p.id, p.participant_id, p.consultant_id, p.org_id, (p.nedsattning_underlag_lamnat_at::timestamp AT TIME ZONE 'Europe/Stockholm'), p.consultant_id,
         'Ej angiven (migrerad från planens datum)', p.start_date, LEAST(COALESCE(p.end_date, p.nedsattning_underlag_lamnat_at), p.nedsattning_underlag_lamnat_at), '{}'::jsonb, 'migrerad'
  FROM public.activity_plans p WHERE p.nedsattning_underlag_lamnat_at IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.activity_plan_handovers h WHERE h.plan_id = p.id);
  SELECT count(*) INTO v_n FROM public.activity_plan_handovers WHERE note = 'migrerad';
  r1 := 'backfill: ' || v_n || ' rad(er) (väntat = antal planer med datum)';

  -- === Scenario: Testkommuns plan (km-konsulent ↔ km-deltagare) ============
  SELECT p.id, p.participant_id, p.consultant_id, p.org_id INTO v_plan, v_deltagare, v_konsulent, v_org
  FROM public.activity_plans p JOIN auth.users u ON u.id = p.consultant_id
  WHERE u.email = 'km-konsulent@jobin.test' AND p.status = 'active' ORDER BY p.created_at DESC LIMIT 1;
  IF v_plan IS NULL THEN RAISE EXCEPTION 'PROV: ingen aktiv plan hos km-konsulent'; END IF;
  SELECT id INTO v_annan FROM auth.users WHERE email = 'claude-playwright-consultant@jobin.test';

  -- Konsulenten lämnar underlag
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_konsulent, 'role', 'authenticated')::text, true);
  PERFORM set_config('role', 'authenticated', true);
  INSERT INTO public.activity_plan_handovers (plan_id, participant_id, consultant_id, org_id, handed_over_by, recipient, period_from, period_to, summary, note)
  VALUES (v_plan, v_deltagare, v_konsulent, v_org, v_konsulent, 'Anna Handläggare, Försörjningsstöd', date_trunc('month', now())::date, now()::date,
          '{"pass": 4, "present": 3, "absent_invalid": 1}'::jsonb, 'F10-prov')
  RETURNING id INTO v_h;
  SELECT nedsattning_underlag_lamnat_at INTO v_datum FROM public.activity_plans WHERE id = v_plan;
  r2 := 'konsulent lämnar=1 | planens datum synkat=' || COALESCE(v_datum::text, 'NULL') || ' (väntat i dag)';

  -- Konsulenten försöker ändra mottagaren → 42501
  BEGIN
    UPDATE public.activity_plan_handovers SET recipient = 'Hackad' WHERE id = v_h;
    r3 := 'ändra mottagare=GICK (FEL)';
  EXCEPTION WHEN insufficient_privilege THEN r3 := 'ändra mottagare=42501 (rätt)'; END;

  -- Deltagaren ser raden, kan inte skriva
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_deltagare, 'role', 'authenticated')::text, true);
  SELECT count(*) INTO v_n FROM public.activity_plan_handovers WHERE plan_id = v_plan;
  r4 := 'deltagaren ser=' || v_n || ' (väntat 1)';
  BEGIN
    INSERT INTO public.activity_plan_handovers (plan_id, participant_id, consultant_id, handed_over_by, recipient, period_from, period_to)
    VALUES (v_plan, v_deltagare, v_deltagare, v_deltagare, 'x', now()::date, now()::date);
    r5 := 'deltagaren skriver=GICK (FEL)';
  EXCEPTION WHEN insufficient_privilege THEN r5 := 'deltagaren skriver=42501 (rätt)'; END;

  -- Utomstående konsulent ser inget
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_annan, 'role', 'authenticated')::text, true);
  SELECT count(*) INTO v_n FROM public.activity_plan_handovers WHERE plan_id = v_plan;
  r6 := 'utomstående ser=' || v_n || ' (väntat 0)';

  -- Konsulenten ångrar samma dag → planens datum blir NULL igen (eller förra underlagets)
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_konsulent, 'role', 'authenticated')::text, true);
  UPDATE public.activity_plan_handovers SET withdrawn_at = now(), withdrawn_reason = 'Fel period' WHERE id = v_h;
  SELECT nedsattning_underlag_lamnat_at INTO v_datum FROM public.activity_plans WHERE id = v_plan;
  r7 := 'ångra=OK | planens datum efter ångra=' || COALESCE(v_datum::text, 'NULL');
  BEGIN
    DELETE FROM public.activity_plan_handovers WHERE id = v_h;
    r8 := 'radera=GICK (FEL)';
  EXCEPTION WHEN insufficient_privilege THEN r8 := 'radera=42501 (rätt)'; END;

  RAISE EXCEPTION 'F10-PROV (rullas tillbaka): % | % | % | % | % | % | % | %', r1, r2, r3, r4, r5, r6, r7, r8;
END $$;
