-- F1 "Jag kan inte komma" — deltagaren anmäler frånvaro på ett kommande pass
-- (persona-genomgång 2026-09-12, PG5/F1). INTE KÖRD MOT PROD — väntar på Mikaels ja.
-- Bevisad i rollback: e2e/f1-franvaro-prov.sql (innehåller exakt den här DDL:n).
--
-- Premiss mätt i prod 2026-09-12: activity_sessions har attendance (CHECK present/
-- absent_valid/absent_invalid/sick_certified/external), attendance_note, marked_by,
-- marked_at, self_checkin_at. Deltagaren har UPDATE-policy (participant_id = auth.uid())
-- men triggern activity_sessions_participant_guard nekar allt utom self_checkin_at.
-- Konsulenten sätter närvaron (markAttendance). notifications har INSERT-policy som
-- låter KONSULENTEN skriva aktivitetsnotiser åt deltagaren — inte tvärtom. Därför
-- skapas notisen till konsulenten här i databasen (definer-trigger), inte i klienten.
--
-- Vad ändras: tre nullable kolumner, guarden släpper igenom dem för deltagaren så
-- länge konsulenten inte markerat passet, och en AFTER-trigger lägger en notis hos
-- planens konsulent när en anmälan kommer in (inte vid ångrad anmälan). Konsulentens
-- flöde är orört: hon ser "Anmäld: sjuk" på passet och markerar som förut.

ALTER TABLE public.activity_sessions
  ADD COLUMN IF NOT EXISTS absence_reported_at timestamptz,
  ADD COLUMN IF NOT EXISTS absence_reason text,
  ADD COLUMN IF NOT EXISTS absence_note text;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'activity_sessions_absence_reason_check') THEN
    ALTER TABLE public.activity_sessions
      ADD CONSTRAINT activity_sessions_absence_reason_check
      CHECK (absence_reason IS NULL OR absence_reason IN ('sick', 'child_care', 'authority_meeting', 'other'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'activity_sessions_absence_pair_check') THEN
    -- Orsak och tidsstämpel hör ihop: aldrig det ena utan det andra.
    ALTER TABLE public.activity_sessions
      ADD CONSTRAINT activity_sessions_absence_pair_check
      CHECK ((absence_reported_at IS NULL) = (absence_reason IS NULL));
  END IF;
END $$;

COMMENT ON COLUMN public.activity_sessions.absence_reported_at IS 'F1: när deltagaren anmälde att hen inte kan komma. Konsulenten bekräftar sedan via attendance som förut.';
COMMENT ON COLUMN public.activity_sessions.absence_reason IS 'F1: sick | child_care | authority_meeting | other';
COMMENT ON COLUMN public.activity_sessions.absence_note IS 'F1: deltagarens egen fritext till konsulenten';

-- Guarden: deltagaren får ändra incheckning + anmälan, inget annat, och bara på
-- pass konsulenten inte markerat. (Samma funktion som förut, en tillåten mängd till.)
CREATE OR REPLACE FUNCTION public.activity_sessions_participant_guard()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  is_plan_consultant boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.activity_plans p
    WHERE p.id = OLD.plan_id AND p.consultant_id = auth.uid()
  ) INTO is_plan_consultant;

  IF is_plan_consultant THEN
    RETURN NEW;
  END IF;

  IF auth.uid() = OLD.participant_id THEN
    IF (to_jsonb(OLD) - 'self_checkin_at' - 'absence_reported_at' - 'absence_reason' - 'absence_note' - 'updated_at')
       IS DISTINCT FROM
       (to_jsonb(NEW) - 'self_checkin_at' - 'absence_reported_at' - 'absence_reason' - 'absence_note' - 'updated_at') THEN
      RAISE EXCEPTION 'Deltagaren får bara ändra sin egen incheckning och frånvaroanmälan' USING ERRCODE = '42501';
    END IF;
    IF OLD.attendance IS NOT NULL AND (
         NEW.absence_reported_at IS DISTINCT FROM OLD.absence_reported_at
      OR NEW.absence_reason      IS DISTINCT FROM OLD.absence_reason
      OR NEW.absence_note        IS DISTINCT FROM OLD.absence_note) THEN
      RAISE EXCEPTION 'Passet är redan markerat av din konsulent' USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'Ingen skrivrätt på passet' USING ERRCODE = '42501';
END;
$$;

-- Notis till planens konsulent när en anmälan kommer in. Definer: deltagaren har
-- ingen INSERT-policy på konsulentens notiser, och ska inte ha det.
CREATE OR REPLACE FUNCTION public.activity_sessions_absence_notify()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_consultant uuid;
  v_namn text;
  v_orsak text;
  v_datum text;
BEGIN
  IF NEW.absence_reported_at IS NULL OR OLD.absence_reported_at IS NOT NULL THEN
    RETURN NEW; -- bara första anmälan; ändringar och ångra ger ingen ny notis
  END IF;
  SELECT p.consultant_id INTO v_consultant FROM activity_plans p WHERE p.id = NEW.plan_id;
  IF v_consultant IS NULL THEN RETURN NEW; END IF;

  SELECT trim(coalesce(pr.first_name, '') || ' ' || coalesce(pr.last_name, '')) INTO v_namn
  FROM profiles pr WHERE pr.id = NEW.participant_id;
  IF v_namn IS NULL OR v_namn = '' THEN v_namn := 'En deltagare'; END IF;

  v_orsak := CASE NEW.absence_reason
    WHEN 'sick' THEN 'sjuk'
    WHEN 'child_care' THEN 'vård av barn'
    WHEN 'authority_meeting' THEN 'möte hos myndighet'
    ELSE 'annat skäl' END;
  v_datum := to_char(NEW.date, 'FMDD') || ' ' ||
    (ARRAY['januari','februari','mars','april','maj','juni','juli','augusti','september','oktober','november','december'])[extract(month from NEW.date)::int];

  INSERT INTO notifications (user_id, type, title, message, action_url, data)
  VALUES (
    v_consultant,
    'aktivitet_franvaro',
    'Anmäld frånvaro',
    v_namn || ' kan inte komma till ' || NEW.title || ' den ' || v_datum || ' kl ' || to_char(NEW.start_time, 'HH24:MI') || ' (' || v_orsak || ').'
      || CASE WHEN NEW.absence_note IS NOT NULL AND NEW.absence_note <> '' THEN ' "' || left(NEW.absence_note, 200) || '"' ELSE '' END,
    '/consultant/participants/' || NEW.participant_id::text,
    jsonb_build_object('session_id', NEW.id, 'plan_id', NEW.plan_id, 'participant_id', NEW.participant_id,
                       'date', NEW.date, 'reason', NEW.absence_reason, 'anmald', true)
  );
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.activity_sessions_absence_notify() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_activity_sessions_absence_notify ON public.activity_sessions;
CREATE TRIGGER trg_activity_sessions_absence_notify
  AFTER UPDATE OF absence_reported_at ON public.activity_sessions
  FOR EACH ROW EXECUTE FUNCTION public.activity_sessions_absence_notify();

-- Efter körning: cd client && npm run schema:refresh && npm run grants:refresh, committa
-- båda snapshoten i samma commit.
