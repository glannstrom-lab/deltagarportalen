-- KH1–KH4 (rollspelet 2026-09-28): underlaget nådde aldrig handläggaren.
--
-- `activity_plan_handovers.recipient` var fritext. Handläggaren (org-roll
-- 'handlaggare') hade ingen läsrätt, fick ingen notis och såg "0 deltagare" på
-- varje flik — leveransen var i praktiken ett telefonsamtal. Samma sak som
-- RK34-rest ("handläggarens läsvy för underlagspaketet").
--
-- Den här migrationen:
--  1. `recipient_user_id` — mottagaren som konto. Fritexten står kvar (externa
--     mottagare, och läsbar historik). En trigger kräver att kontot är handläggare,
--     chef eller admin i samma organisation som underlaget.
--  2. `received_at` — handläggaren kvitterar att underlaget är mottaget.
--  3. `mina_mottagna_underlag()` — handläggarens läsvy: underlaget, deltagarens och
--     konsulentens namn, försörjningshindret, och om deltagaren förklarat sin
--     frånvaro i perioden. Definer-funktion i stället för nya RLS-policyer på
--     profiles/activity_sessions: handläggaren ska se det som lämnats till henne,
--     inte läsa deltagarens hela konto.
--  4. `kvittera_underlag(id)` — sätter received_at, bara för mottagaren.
--  5. Notis i klockan till mottagaren när ett underlag lämnas.
--
-- Mejl ingår inte: aktivitetsnotiserna mejlas inte till någon än (AT4, kräver
-- ja för vercel.json). Notisen syns i klockan.

ALTER TABLE public.activity_plan_handovers
  ADD COLUMN IF NOT EXISTS recipient_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS received_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_handovers_recipient_user
  ON public.activity_plan_handovers(recipient_user_id) WHERE recipient_user_id IS NOT NULL;

COMMENT ON COLUMN public.activity_plan_handovers.recipient_user_id IS
  'KH11: mottagande handläggare som konto (samma organisation). NULL = extern mottagare, bara fritext i recipient.';
COMMENT ON COLUMN public.activity_plan_handovers.received_at IS
  'KH11: när mottagaren kvitterade underlaget i portalen.';

-- 1. Mottagaren måste vara personal i underlagets organisation.
CREATE OR REPLACE FUNCTION public.handover_recipient_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.recipient_user_id IS NOT NULL
     AND (TG_OP = 'INSERT' OR NEW.recipient_user_id IS DISTINCT FROM OLD.recipient_user_id) THEN
    IF NEW.org_id IS NULL OR NOT EXISTS (
      SELECT 1 FROM organization_members m
      WHERE m.org_id = NEW.org_id
        AND m.user_id = NEW.recipient_user_id
        AND m.role IN ('handlaggare', 'chef', 'admin')
    ) THEN
      RAISE EXCEPTION 'Mottagaren är inte handläggare i organisationen' USING ERRCODE = '42501';
    END IF;
  END IF;
  -- received_at sätts bara av kvittera_underlag (definer, som mottagaren).
  IF TG_OP = 'UPDATE' AND NEW.received_at IS DISTINCT FROM OLD.received_at
     AND current_setting('app.kvittering', true) IS DISTINCT FROM 'ja' THEN
    NEW.received_at := OLD.received_at;
  END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.received_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.handover_recipient_guard() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_handover_recipient_guard ON public.activity_plan_handovers;
CREATE TRIGGER trg_handover_recipient_guard
  BEFORE INSERT OR UPDATE ON public.activity_plan_handovers
  FOR EACH ROW EXECUTE FUNCTION public.handover_recipient_guard();

-- 5. Notis till mottagaren.
CREATE OR REPLACE FUNCTION public.handover_recipient_notify()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_konsulent text;
BEGIN
  IF NEW.recipient_user_id IS NULL OR NEW.withdrawn_at IS NOT NULL THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.recipient_user_id IS NOT DISTINCT FROM NEW.recipient_user_id THEN
    RETURN NEW;
  END IF;
  SELECT nullif(trim(coalesce(first_name, '') || ' ' || coalesce(last_name, '')), '')
    INTO v_konsulent FROM profiles WHERE id = NEW.consultant_id;
  INSERT INTO notifications (user_id, type, title, message, action_url, data)
  VALUES (
    NEW.recipient_user_id,
    'info',
    'Nytt underlag',
    coalesce(v_konsulent, 'En konsulent') || ' har lämnat ett underlag för perioden '
      || to_char(NEW.period_from, 'YYYY-MM-DD') || ' – ' || to_char(NEW.period_to, 'YYYY-MM-DD') || '.',
    '/consultant',
    jsonb_build_object('handover_id', NEW.id)
  );
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.handover_recipient_notify() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_handover_recipient_notify ON public.activity_plan_handovers;
CREATE TRIGGER trg_handover_recipient_notify
  AFTER INSERT OR UPDATE OF recipient_user_id ON public.activity_plan_handovers
  FOR EACH ROW EXECUTE FUNCTION public.handover_recipient_notify();

-- 3. Handläggarens läsvy.
CREATE OR REPLACE FUNCTION public.mina_mottagna_underlag()
RETURNS TABLE (
  id uuid,
  handed_over_at timestamptz,
  period_from date,
  period_to date,
  summary jsonb,
  note text,
  withdrawn_at timestamptz,
  withdrawn_reason text,
  received_at timestamptz,
  participant_first_name text,
  participant_last_name text,
  consultant_first_name text,
  consultant_last_name text,
  consultant_email text,
  forsorjningshinder text,
  ogiltig_franvaro integer,
  ogiltig_franvaro_forklarad integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT
    h.id, h.handed_over_at, h.period_from, h.period_to, h.summary, h.note,
    h.withdrawn_at, h.withdrawn_reason, h.received_at,
    dp.first_name, dp.last_name,
    kp.first_name, kp.last_name, kp.email,
    ap.forsorjningshinder,
    (SELECT count(*)::int FROM activity_sessions s
      WHERE s.plan_id = h.plan_id AND s.attendance = 'absent_invalid'
        AND s.date BETWEEN h.period_from AND h.period_to),
    (SELECT count(*)::int FROM activity_sessions s
      WHERE s.plan_id = h.plan_id AND s.attendance = 'absent_invalid'
        AND s.date BETWEEN h.period_from AND h.period_to
        AND nullif(trim(coalesce(s.participant_explanation, '')), '') IS NOT NULL)
  FROM activity_plan_handovers h
  LEFT JOIN profiles dp ON dp.id = h.participant_id
  LEFT JOIN profiles kp ON kp.id = h.consultant_id
  LEFT JOIN activity_plans ap ON ap.id = h.plan_id
  WHERE h.recipient_user_id = auth.uid()
  ORDER BY h.handed_over_at DESC;
$$;
REVOKE ALL ON FUNCTION public.mina_mottagna_underlag() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mina_mottagna_underlag() TO authenticated;

-- 4. Kvittera.
CREATE OR REPLACE FUNCTION public.kvittera_underlag(p_id uuid)
RETURNS timestamptz
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_tid timestamptz;
BEGIN
  PERFORM set_config('app.kvittering', 'ja', true);
  UPDATE activity_plan_handovers
     SET received_at = coalesce(received_at, now())
   WHERE id = p_id AND recipient_user_id = auth.uid()
  RETURNING received_at INTO v_tid;
  IF v_tid IS NULL THEN
    RAISE EXCEPTION 'Underlaget finns inte, eller är inte lämnat till dig' USING ERRCODE = '42501';
  END IF;
  RETURN v_tid;
END;
$$;
REVOKE ALL ON FUNCTION public.kvittera_underlag(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.kvittera_underlag(uuid) TO authenticated;

-- Ett lämnat underlag är oföränderligt (F10-vakten). Kvitteringen är undantaget:
-- received_at får ändras, men bara via kvittera_underlag (se handover_recipient_guard).
CREATE OR REPLACE FUNCTION public.activity_plan_handovers_guard()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF (to_jsonb(OLD) - 'withdrawn_at' - 'withdrawn_reason' - 'updated_at' - 'received_at')
     IS DISTINCT FROM
     (to_jsonb(NEW) - 'withdrawn_at' - 'withdrawn_reason' - 'updated_at' - 'received_at') THEN
    RAISE EXCEPTION 'Ett lämnat underlag går inte att ändra — bara ångra samma dag' USING ERRCODE = '42501';
  END IF;
  IF NEW.withdrawn_at IS DISTINCT FROM OLD.withdrawn_at THEN
    IF OLD.withdrawn_at IS NOT NULL THEN
      RAISE EXCEPTION 'Underlaget är redan ångrat' USING ERRCODE = '42501';
    END IF;
    IF auth.uid() IS DISTINCT FROM OLD.handed_over_by THEN
      RAISE EXCEPTION 'Bara den som lämnade underlaget kan ångra det' USING ERRCODE = '42501';
    END IF;
    IF (OLD.handed_over_at AT TIME ZONE 'Europe/Stockholm')::date <> (now() AT TIME ZONE 'Europe/Stockholm')::date THEN
      RAISE EXCEPTION 'Ett underlag kan bara ångras samma dag som det lämnades' USING ERRCODE = '42501';
    END IF;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$function$;
