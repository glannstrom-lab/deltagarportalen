-- F10 (persona-genomgång 2026-09-12, konsulentens förslag 2 + skav S7):
-- Spårbart underlag till handläggaren.
--
-- Premiss i prod före den här migrationen: "Underlag till handläggaren" var EN
-- tidsstämpel på planen, `activity_plans.nedsattning_underlag_lamnat_at` (KM7),
-- satt av konsulenten med en Ångra-knapp utan spår. Ingen mottagare, ingen
-- anteckning, ingen "vem", inget "vad". IVO-kvartalsunderlaget räknade planer
-- med datumet i kvartalet. Mätt 2026-09-12: 1 av 3 planer hade datumet satt.
--
-- Nu: en rad per lämnat underlag i `activity_plan_handovers` — när, av vem,
-- till vem (fritext: handläggare/enhet), för vilken period, med
-- närvarosammanfattning (jsonb, räknad i klienten ur passen vid lämnandet) och
-- anteckning. Ångra = `withdrawn_at` samma dag, aldrig radering. Planens gamla
-- kolumn hålls synkad av en trigger (senaste ej ångrade underlaget) så att PDF,
-- IVO-räkningen och äldre läsare fortsätter fungera. Det befintliga datumet
-- migreras till en rad med mottagare "Ej angiven (migrerad)".
--
-- Beslut om nedsättning fattas av socialnämnden, aldrig här — underlaget är
-- konsulentens överlämning, inte ett beslut.
--
-- KÖRS INTE utan Mikaels ja. Bevisad i rollback: e2e/f10-underlag-prov.sql.
-- Efter körning: cd client && npm run schema:refresh && npm run grants:refresh.

CREATE TABLE IF NOT EXISTS public.activity_plan_handovers (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id          uuid NOT NULL REFERENCES public.activity_plans(id) ON DELETE CASCADE,
  participant_id   uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  consultant_id    uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  org_id           uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  handed_over_at   timestamptz NOT NULL DEFAULT now(),
  handed_over_by   uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  recipient        text NOT NULL,
  period_from      date NOT NULL,
  period_to        date NOT NULL,
  summary          jsonb NOT NULL DEFAULT '{}'::jsonb,
  note             text,
  withdrawn_at     timestamptz,
  withdrawn_reason text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT activity_plan_handovers_recipient_check CHECK (length(trim(recipient)) BETWEEN 1 AND 200),
  CONSTRAINT activity_plan_handovers_period_check CHECK (period_from <= period_to),
  CONSTRAINT activity_plan_handovers_withdrawn_pair_check CHECK ((withdrawn_at IS NULL) = (withdrawn_reason IS NULL))
);

CREATE INDEX IF NOT EXISTS activity_plan_handovers_plan_idx ON public.activity_plan_handovers (plan_id, handed_over_at DESC);
CREATE INDEX IF NOT EXISTS activity_plan_handovers_participant_idx ON public.activity_plan_handovers (participant_id);

COMMENT ON TABLE public.activity_plan_handovers IS 'F10: varje underlag som lämnats till biståndshandläggaren — när, av vem, till vem, period, närvarosammanfattning. Ångra = withdrawn_at samma dag, aldrig radering.';
COMMENT ON COLUMN public.activity_plan_handovers.recipient IS 'Handläggare/enhet som tog emot, fritext. Inga personnummer.';
COMMENT ON COLUMN public.activity_plan_handovers.summary IS 'Närvarosammanfattning för perioden räknad vid lämnandet: {pass, present, absent_valid, absent_invalid, sick_certified, external, reported}.';

ALTER TABLE public.activity_plan_handovers ENABLE ROW LEVEL SECURITY;

-- Speglar activity_plans-policyerna (mätt 2026-09-12): konsulenten med aktiv
-- relation, chefen i organisationen läser, deltagaren läser sitt eget.
DROP POLICY IF EXISTS "Konsulent hanterar underlag för aktiva deltagare" ON public.activity_plan_handovers;
CREATE POLICY "Konsulent hanterar underlag för aktiva deltagare"
  ON public.activity_plan_handovers
  FOR ALL
  USING (
    consultant_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.consultant_participants cp
                WHERE cp.consultant_id = auth.uid() AND cp.participant_id = activity_plan_handovers.participant_id)
  )
  WITH CHECK (
    consultant_id = auth.uid()
    AND handed_over_by = auth.uid()
    AND EXISTS (SELECT 1 FROM public.consultant_participants cp
                WHERE cp.consultant_id = auth.uid() AND cp.participant_id = activity_plan_handovers.participant_id)
    AND EXISTS (SELECT 1 FROM public.activity_plans p
                WHERE p.id = activity_plan_handovers.plan_id
                  AND p.participant_id = activity_plan_handovers.participant_id
                  AND p.consultant_id = auth.uid())
  );

DROP POLICY IF EXISTS "Organisationens chef läser underlag" ON public.activity_plan_handovers;
CREATE POLICY "Organisationens chef läser underlag"
  ON public.activity_plan_handovers
  FOR SELECT
  USING (
    org_id IS NOT NULL
    AND EXISTS (SELECT 1 FROM public.organization_members m
                WHERE m.org_id = activity_plan_handovers.org_id AND m.user_id = auth.uid()
                  AND m.role = ANY (ARRAY['chef'::text, 'admin'::text]))
  );

DROP POLICY IF EXISTS "Deltagaren ser lämnade underlag om sig" ON public.activity_plan_handovers;
CREATE POLICY "Deltagaren ser lämnade underlag om sig"
  ON public.activity_plan_handovers
  FOR SELECT
  USING (participant_id = auth.uid());

-- Ändringsvakt: ett lämnat underlag är ett spår. Det enda som får ändras är
-- withdrawn_at/withdrawn_reason (ångra), av den som lämnade det, samma dag
-- (svensk tid). Radering är stängd för alla utom CASCADE från planen.
CREATE OR REPLACE FUNCTION public.activity_plan_handovers_guard()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF (to_jsonb(OLD) - 'withdrawn_at' - 'withdrawn_reason' - 'updated_at')
     IS DISTINCT FROM
     (to_jsonb(NEW) - 'withdrawn_at' - 'withdrawn_reason' - 'updated_at') THEN
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
$$;
REVOKE ALL ON FUNCTION public.activity_plan_handovers_guard() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_activity_plan_handovers_guard ON public.activity_plan_handovers;
CREATE TRIGGER trg_activity_plan_handovers_guard
  BEFORE UPDATE ON public.activity_plan_handovers
  FOR EACH ROW EXECUTE FUNCTION public.activity_plan_handovers_guard();

CREATE OR REPLACE FUNCTION public.activity_plan_handovers_no_delete()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'Lämnade underlag raderas inte — ångra i stället' USING ERRCODE = '42501';
END;
$$;
REVOKE ALL ON FUNCTION public.activity_plan_handovers_no_delete() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_activity_plan_handovers_no_delete ON public.activity_plan_handovers;
-- Bara direkta DELETE stoppas; CASCADE från activity_plans går via samma
-- trigger, så planen måste raderas med triggern avstängd (admin-åtgärd).
CREATE TRIGGER trg_activity_plan_handovers_no_delete
  BEFORE DELETE ON public.activity_plan_handovers
  FOR EACH ROW EXECUTE FUNCTION public.activity_plan_handovers_no_delete();

-- Synk av planens gamla kolumn: senaste ej ångrade underlaget, annars NULL.
-- SECURITY DEFINER eftersom deltagaren inte får uppdatera planen själv och
-- konsulentens UPDATE-policy på planen annars räcker — men definer gör
-- synken oberoende av vem som ångrar.
CREATE OR REPLACE FUNCTION public.activity_plan_handovers_sync_plan()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan uuid;
BEGIN
  v_plan := COALESCE(NEW.plan_id, OLD.plan_id);
  UPDATE activity_plans p
     SET nedsattning_underlag_lamnat_at = (
       SELECT (max(h.handed_over_at) AT TIME ZONE 'Europe/Stockholm')::date
       FROM activity_plan_handovers h
       WHERE h.plan_id = v_plan AND h.withdrawn_at IS NULL
     )
   WHERE p.id = v_plan;
  RETURN COALESCE(NEW, OLD);
END;
$$;
REVOKE ALL ON FUNCTION public.activity_plan_handovers_sync_plan() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_activity_plan_handovers_sync_plan ON public.activity_plan_handovers;
CREATE TRIGGER trg_activity_plan_handovers_sync_plan
  AFTER INSERT OR UPDATE OF withdrawn_at ON public.activity_plan_handovers
  FOR EACH ROW EXECUTE FUNCTION public.activity_plan_handovers_sync_plan();

-- Migrera det befintliga datumet (1 plan 2026-09-12) till en rad, så att
-- historiken inte försvinner när UI:t byter källa.
INSERT INTO public.activity_plan_handovers
  (plan_id, participant_id, consultant_id, org_id, handed_over_at, handed_over_by, recipient, period_from, period_to, summary, note)
SELECT p.id, p.participant_id, p.consultant_id, p.org_id,
       (p.nedsattning_underlag_lamnat_at::timestamp AT TIME ZONE 'Europe/Stockholm'),
       p.consultant_id,
       'Ej angiven (migrerad från planens datum)',
       p.start_date,
       LEAST(COALESCE(p.end_date, p.nedsattning_underlag_lamnat_at), p.nedsattning_underlag_lamnat_at),
       '{}'::jsonb,
       'Migrerad 2026-09-13 från activity_plans.nedsattning_underlag_lamnat_at — mottagare och period okända.'
FROM public.activity_plans p
WHERE p.nedsattning_underlag_lamnat_at IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.activity_plan_handovers h WHERE h.plan_id = p.id);
