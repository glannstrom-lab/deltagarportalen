-- PENDING_20260927d_plan_och_pass — INTE körd. Kräver Mikaels ja.
--
-- Rollspelet 2026-09-27:
--   RK40  ärende-/dossiernummer på planen, så underlag och plan matchas hos
--         handläggaren utan personnummer i Jobin
--   RR27  två märkningar per pass: leverantörsledd/egen och fysisk/digital,
--         så avtalsloggen och 50 %-andelen räknar på ett faktum i stället för
--         en härledning ur typ och platsfält
--   RK37  pass som läggs in från Platser bär platsens id
--   RR28  "AF underrättad" om en avvikelse — konsulentens anteckning;
--         portalen skickar ingenting till Arbetsförmedlingen
--
-- Additiv: bara nya nullbara kolumner och nya, namngivna CHECK-villkor.
-- NULL på gamla rader betyder "inte märkt" — klienten faller då tillbaka på
-- härledningen och säger på kortet hur många pass som bygger på den.
--
-- RLS: inga ändringar behövs, och det är kontrollerat mot prod 2026-09-27:
--   · activity_plans/activity_sessions skrivs bara av planens konsulent
--     (befintliga policyer).
--   · Deltagaren kan INTE sätta de nya pass-kolumnerna: triggern
--     activity_sessions_participant_guard jämför hela raden som jsonb minus en
--     uttrycklig lista (self_checkin_at, absence_*, participant_explanation*,
--     updated_at). Nya kolumner hamnar därför automatiskt på den spärrade sidan.
--
-- Befintliga CHECK-namn lästa ur prod 2026-09-27 (inget av dem ändras):
--   activity_plans_check, activity_plans_forsorjningshinder_check,
--   activity_plans_status_check, activity_sessions_activity_type_check,
--   activity_sessions_attendance_check m.fl.
--
-- Körning:
--   npx supabase db query --linked -f supabase/migrations/PENDING_20260927d_plan_och_pass.sql
-- Efteråt (samma commit):
--   1. cd client && npm run schema:refresh
--   2. client/src/services/planMarkning.ts: PLAN_PASS_KOLUMNER_FINNS = true
--   3. byt namn på filen till 20260927d_plan_och_pass.sql

BEGIN;

-- RK40 ----------------------------------------------------------------------
ALTER TABLE public.activity_plans
  ADD COLUMN IF NOT EXISTS case_reference text;

COMMENT ON COLUMN public.activity_plans.case_reference IS
  'RK40: ärende-/dossiernummer i kommunens verksamhetssystem, eller AF:s ärende-id för leverantörer. Aldrig personnummer.';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'activity_plans_case_reference_check') THEN
    -- Samma regel som valideraArendenummer i klienten: högst 60 tecken, och
    -- ingen sifferföljd med formen ÅÅMMDD-XXXX / ÅÅÅÅMMDDXXXX (bindestreck,
    -- plus eller mellanslag tillåtna), dag 01–31 eller samordningsnummer 61–91.
    -- Klienten prövar dessutom månadens längd (30 feb) — databasen är alltså
    -- något strängare än klienten, aldrig mildare.
    ALTER TABLE public.activity_plans ADD CONSTRAINT activity_plans_case_reference_check CHECK (
      case_reference IS NULL OR (
        char_length(case_reference) BETWEEN 1 AND 60
        AND case_reference !~ '(^|[^0-9])([0-9]{2})?[0-9]{2}(0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01]|6[1-9]|[78][0-9]|9[01]) ?[-+]? ?[0-9]{4}([^0-9]|$)'
      )
    );
  END IF;
END $$;

-- RR27 / RK37 / RR28 --------------------------------------------------------
ALTER TABLE public.activity_sessions
  ADD COLUMN IF NOT EXISTS is_provider_led boolean,
  ADD COLUMN IF NOT EXISTS is_physical boolean,
  ADD COLUMN IF NOT EXISTS work_placement_id uuid REFERENCES public.consultant_work_placements(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS af_notified_at timestamptz,
  ADD COLUMN IF NOT EXISTS af_notified_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.activity_sessions.is_provider_led IS 'RR27: true = leverantören/verksamheten håller i passet, false = deltagarens egen aktivitet, NULL = inte märkt (härleds ur typen).';
COMMENT ON COLUMN public.activity_sessions.is_physical IS 'RR27: true = fysiskt, false = digitalt, NULL = inte märkt (härleds ur typ och platsfält).';
COMMENT ON COLUMN public.activity_sessions.work_placement_id IS 'RK37: platsen under Platser som passet lades in från.';
COMMENT ON COLUMN public.activity_sessions.af_notified_at IS 'RR28: när konsulenten underrättade Arbetsförmedlingen om avvikelsen (konsulentens anteckning).';

DO $$
BEGIN
  -- Underrättad kräver vem, och tvärtom.
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'activity_sessions_af_notified_pair_check') THEN
    ALTER TABLE public.activity_sessions ADD CONSTRAINT activity_sessions_af_notified_pair_check
      CHECK ((af_notified_at IS NULL) = (af_notified_by IS NULL));
  END IF;
END $$;

-- FK-kolumnen indexeras (samma regel som 20260924_index_fk_och_dubbletter).
CREATE INDEX IF NOT EXISTS activity_sessions_work_placement_id_idx
  ON public.activity_sessions (work_placement_id) WHERE work_placement_id IS NOT NULL;

COMMIT;

-- Tillbaka (förlorar märkningarna och ärendenumren):
--   ALTER TABLE public.activity_sessions DROP CONSTRAINT IF EXISTS activity_sessions_af_notified_pair_check;
--   DROP INDEX IF EXISTS public.activity_sessions_work_placement_id_idx;
--   ALTER TABLE public.activity_sessions DROP COLUMN IF EXISTS is_provider_led, DROP COLUMN IF EXISTS is_physical,
--     DROP COLUMN IF EXISTS work_placement_id, DROP COLUMN IF EXISTS af_notified_at, DROP COLUMN IF EXISTS af_notified_by;
--   ALTER TABLE public.activity_plans DROP CONSTRAINT IF EXISTS activity_plans_case_reference_check;
--   ALTER TABLE public.activity_plans DROP COLUMN IF EXISTS case_reference;
