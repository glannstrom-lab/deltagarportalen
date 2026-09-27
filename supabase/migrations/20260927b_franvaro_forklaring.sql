-- RD11 (rollspelet 2026-09-27): deltagaren förklarar en markerad frånvaro i efterhand.
-- INTE KÖRD MOT PROD — väntar på Mikaels ja. Byt namn (ta bort PENDING_) när den körts.
--
-- Premiss mätt i prod 2026-09-27 (läsning):
--   · activity_sessions har absence_reported_at/absence_reason/absence_note (F1)
--     och attendance, men ingen kolumn för en förklaring EFTER markeringen.
--   · Guarden activity_sessions_participant_guard (pg_get_functiondef, prod)
--     nekar deltagaren varje ändring av absence_* när OLD.attendance IS NOT NULL
--     — alltså precis på de pass hon vill förklara. absence_note kan därför inte
--     återanvändas utan att guarden ändras, och den hör dessutom ihop med en
--     anmälan FÖRE passet (CHECK-paret absence_reported_at/absence_reason).
--   · notifications har ingen CHECK på type; F1 skriver 'aktivitet_franvaro'.
--
-- Vad ändras:
--   1. Två nullable kolumner: participant_explanation (≤ 500 tecken) och
--      participant_explanation_at. Aldrig det ena utan det andra.
--   2. Guarden: deltagaren får också ändra de två kolumnerna — men BARA på pass
--      som konsulenten markerat som frånvaro (absent_invalid/absent_valid).
--      Allt annat är oförändrat. search_path sätts som i 20260924_sak_trigger_search_path.
--   3. En AFTER-trigger lägger en notis hos planens konsulent när en förklaring
--      skrivs eller ändras (inte när den tas bort).
--
-- Klienten fungerar före körningen: knappen "Förklara frånvaron" visas bara när
-- passets rad bär kolumnen (kanForklaraFranvaro i services/franvaroApi.ts), och
-- intyget visar förklaringen bara när den finns.

ALTER TABLE public.activity_sessions
  ADD COLUMN IF NOT EXISTS participant_explanation text,
  ADD COLUMN IF NOT EXISTS participant_explanation_at timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'activity_sessions_explanation_len_check') THEN
    ALTER TABLE public.activity_sessions
      ADD CONSTRAINT activity_sessions_explanation_len_check
      CHECK (participant_explanation IS NULL OR char_length(participant_explanation) <= 500);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'activity_sessions_explanation_pair_check') THEN
    ALTER TABLE public.activity_sessions
      ADD CONSTRAINT activity_sessions_explanation_pair_check
      CHECK ((participant_explanation IS NULL) = (participant_explanation_at IS NULL));
  END IF;
END $$;

COMMENT ON COLUMN public.activity_sessions.participant_explanation IS 'RD11: deltagarens egen förklaring till en frånvaro som konsulenten markerat. Visas på närvarointyget som "Deltagarens förklaring".';
COMMENT ON COLUMN public.activity_sessions.participant_explanation_at IS 'RD11: när förklaringen skrevs eller senast ändrades.';

CREATE OR REPLACE FUNCTION public.activity_sessions_participant_guard()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
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
    IF (to_jsonb(OLD) - 'self_checkin_at' - 'absence_reported_at' - 'absence_reason' - 'absence_note'
                      - 'participant_explanation' - 'participant_explanation_at' - 'updated_at')
       IS DISTINCT FROM
       (to_jsonb(NEW) - 'self_checkin_at' - 'absence_reported_at' - 'absence_reason' - 'absence_note'
                      - 'participant_explanation' - 'participant_explanation_at' - 'updated_at') THEN
      RAISE EXCEPTION 'Deltagaren får bara ändra sin egen incheckning, frånvaroanmälan och förklaring' USING ERRCODE = '42501';
    END IF;
    IF OLD.attendance IS NOT NULL AND (
         NEW.absence_reported_at IS DISTINCT FROM OLD.absence_reported_at
      OR NEW.absence_reason      IS DISTINCT FROM OLD.absence_reason
      OR NEW.absence_note        IS DISTINCT FROM OLD.absence_note) THEN
      RAISE EXCEPTION 'Passet är redan markerat av din konsulent' USING ERRCODE = '42501';
    END IF;
    -- RD11: förklaringen hör till en markerad frånvaro, inget annat.
    IF (NEW.participant_explanation IS DISTINCT FROM OLD.participant_explanation
        OR NEW.participant_explanation_at IS DISTINCT FROM OLD.participant_explanation_at)
       AND (OLD.attendance IS NULL OR OLD.attendance NOT IN ('absent_invalid', 'absent_valid')) THEN
      RAISE EXCEPTION 'Förklaringen gäller bara pass som konsulenten markerat som frånvaro' USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'Ingen skrivrätt på passet' USING ERRCODE = '42501';
END;
$$;

-- Notis till planens konsulent när en förklaring kommer in eller ändras.
-- Definer av samma skäl som activity_sessions_absence_notify (F1): deltagaren
-- har ingen INSERT-rätt på konsulentens notiser.
CREATE OR REPLACE FUNCTION public.activity_sessions_explanation_notify()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_consultant uuid;
  v_namn text;
  v_datum text;
BEGIN
  IF NEW.participant_explanation IS NULL
     OR NEW.participant_explanation IS NOT DISTINCT FROM OLD.participant_explanation THEN
    RETURN NEW;
  END IF;
  SELECT p.consultant_id INTO v_consultant FROM activity_plans p WHERE p.id = NEW.plan_id;
  IF v_consultant IS NULL THEN RETURN NEW; END IF;

  SELECT trim(coalesce(pr.first_name, '') || ' ' || coalesce(pr.last_name, '')) INTO v_namn
  FROM profiles pr WHERE pr.id = NEW.participant_id;
  IF v_namn IS NULL OR v_namn = '' THEN v_namn := 'En deltagare'; END IF;

  v_datum := to_char(NEW.date, 'FMDD') || ' ' ||
    (ARRAY['januari','februari','mars','april','maj','juni','juli','augusti','september','oktober','november','december'])[extract(month from NEW.date)::int];

  INSERT INTO notifications (user_id, type, title, message, action_url, data)
  VALUES (
    v_consultant,
    'aktivitet_franvaro',
    'Förklaring till frånvaro',
    v_namn || ' har förklarat frånvaron på ' || NEW.title || ' den ' || v_datum || ': "' || left(NEW.participant_explanation, 200) || '"',
    '/consultant/participants/' || NEW.participant_id::text,
    jsonb_build_object('session_id', NEW.id, 'plan_id', NEW.plan_id, 'participant_id', NEW.participant_id,
                       'date', NEW.date, 'forklaring', true)
  );
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.activity_sessions_explanation_notify() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_activity_sessions_explanation_notify ON public.activity_sessions;
CREATE TRIGGER trg_activity_sessions_explanation_notify
  AFTER UPDATE OF participant_explanation ON public.activity_sessions
  FOR EACH ROW EXECUTE FUNCTION public.activity_sessions_explanation_notify();

-- ----------------------------------------------------------------------------
-- EFTER KÖRNING
--   cd client && npm run schema:refresh && npm run grants:refresh
--   Skriv om raden i franvaroApi.forklara() till en objektliteral (lint:kolumner
--   ser den då), och committa båda snapshoten i samma commit.
-- VERIFIERING
--   select column_name from information_schema.columns
--    where table_name='activity_sessions' and column_name like 'participant_explanation%';
--     → 2 rader
--   select proname, proconfig, has_function_privilege('authenticated', oid, 'EXECUTE') as auth_exec
--     from pg_proc where proname in ('activity_sessions_participant_guard','activity_sessions_explanation_notify');
--     → guard: {search_path=public}; notify: {search_path=public}, auth_exec = false
-- Röktest (Anna, demo): pass 17/9 markerat absent_invalid → "Förklara frånvaron"
--   syns i Min vecka, sparas, konsulenten får notisen, intyget för september
--   visar "Deltagarens förklaring: …". Ett försök att förklara ett pass markerat
--   'present' ska ge 42501.
-- ----------------------------------------------------------------------------
