-- PENDING_20260927d_resultat_och_msfa — INTE körd. Kräver Mikaels ja.
--
-- Rollspelet 2026-09-27 (Rusta och matcha):
--   RR25  resultatklockan: status per uppföljningspunkt
--         väntar → verifierad → fakturerad på consultant_placements
--   RR24  markeringen "förd över till MSFA" per plan och månad, så
--         disclaimern ("siffrorna för du över för hand") blir ett arbetsflöde
--
-- Additiv: nya nullbara kolumner, nya namngivna CHECK-villkor och en ny tabell.
-- Portalen skickar ingenting till Arbetsförmedlingen — tabellen är
-- konsulentens egen anteckning om att fälten förts över.
--
-- consultant_placements: befintlig policy "Konsulent har access till aktiva
-- deltagares placeringar" (konsulentens egna rader + rad i
-- consultant_participants) gäller de nya kolumnerna — inga RLS-ändringar.
-- Befintliga CHECK-namn lästa ur prod 2026-09-27: cplac_niva,
-- cplac_scope_rimlig, cplac_uppfoljning_ordning, cplac_uppfoljning_utfall,
-- consultant_placements_placement_type_check. Inget av dem ändras.
--
-- msfa_overforingar: RLS PÅ, med uttryckliga policyer (mönstret från
-- activity_plan_handovers):
--   · konsulenten läser, skapar och tar bort sina EGNA rader, för deltagare
--     hen har en aktiv relation till (har_aktiv_relation), och bara för en
--     plan som är hens egen
--   · organisationens chef/admin läser organisationens rader
--   · ingen UPDATE-policy: en markering ändras inte, den ångras (DELETE)
--   · deltagaren har ingen åtkomst (raden är ett arbetsflöde hos leverantören)
--
-- Körning:
--   npx supabase db query --linked -f supabase/migrations/PENDING_20260927d_resultat_och_msfa.sql
-- Efteråt (samma commit):
--   1. cd client && npm run schema:refresh && npm run grants:refresh
--   2. client/src/services/resultatklocka.ts: RESULTAT_MSFA_FINNS = true
--   3. byt namn på filen till 20260927d_resultat_och_msfa.sql

BEGIN;

-- RR25 ----------------------------------------------------------------------
ALTER TABLE public.consultant_placements
  ADD COLUMN IF NOT EXISTS followup_3m_payment_status text,
  ADD COLUMN IF NOT EXISTS followup_3m_payment_status_at timestamptz,
  ADD COLUMN IF NOT EXISTS followup_3m_payment_status_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS followup_6m_payment_status text,
  ADD COLUMN IF NOT EXISTS followup_6m_payment_status_at timestamptz,
  ADD COLUMN IF NOT EXISTS followup_6m_payment_status_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cplac_betalstatus') THEN
    ALTER TABLE public.consultant_placements ADD CONSTRAINT cplac_betalstatus CHECK (
      (followup_3m_payment_status IS NULL OR followup_3m_payment_status IN ('vantar', 'verifierad', 'fakturerad'))
      AND (followup_6m_payment_status IS NULL OR followup_6m_payment_status IN ('vantar', 'verifierad', 'fakturerad'))
      -- En status kräver att uppföljningen är registrerad.
      AND (followup_3m_payment_status IS NULL OR followup_3m = true)
      AND (followup_6m_payment_status IS NULL OR followup_6m = true)
    );
  END IF;
END $$;

COMMENT ON COLUMN public.consultant_placements.followup_3m_payment_status IS 'RR25: resultatersättningen för 3-månaderspunkten: vantar/verifierad/fakturerad.';
COMMENT ON COLUMN public.consultant_placements.followup_6m_payment_status IS 'RR25: resultatersättningen för 6-månaderspunkten: vantar/verifierad/fakturerad.';

-- RR24 ----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.msfa_overforingar (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.activity_plans(id) ON DELETE CASCADE,
  participant_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  consultant_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  org_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  period_month text NOT NULL CHECK (period_month ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
  transferred_at timestamptz NOT NULL DEFAULT now(),
  transferred_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT msfa_overforingar_en_per_manad UNIQUE (plan_id, period_month)
);

COMMENT ON TABLE public.msfa_overforingar IS 'RR24: konsulentens markering att en månads underlag förts över till Mina sidor för fristående aktörer. Portalen skickar inget till AF.';

CREATE INDEX IF NOT EXISTS msfa_overforingar_participant_idx ON public.msfa_overforingar (participant_id);
CREATE INDEX IF NOT EXISTS msfa_overforingar_consultant_idx ON public.msfa_overforingar (consultant_id);
CREATE INDEX IF NOT EXISTS msfa_overforingar_org_idx ON public.msfa_overforingar (org_id) WHERE org_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS msfa_overforingar_transferred_by_idx ON public.msfa_overforingar (transferred_by);
CREATE INDEX IF NOT EXISTS msfa_overforingar_period_idx ON public.msfa_overforingar (period_month);

ALTER TABLE public.msfa_overforingar ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.msfa_overforingar FROM anon;
GRANT SELECT, INSERT, DELETE ON public.msfa_overforingar TO authenticated;

DROP POLICY IF EXISTS "Konsulent läser egna MSFA-markeringar" ON public.msfa_overforingar;
CREATE POLICY "Konsulent läser egna MSFA-markeringar" ON public.msfa_overforingar
  FOR SELECT TO authenticated
  USING (consultant_id = (SELECT auth.uid()) AND public.har_aktiv_relation(participant_id));

DROP POLICY IF EXISTS "Konsulent markerar egen plan som förd över" ON public.msfa_overforingar;
CREATE POLICY "Konsulent markerar egen plan som förd över" ON public.msfa_overforingar
  FOR INSERT TO authenticated
  WITH CHECK (
    consultant_id = (SELECT auth.uid())
    AND transferred_by = (SELECT auth.uid())
    AND public.har_aktiv_relation(participant_id)
    AND EXISTS (
      SELECT 1 FROM public.activity_plans p
      WHERE p.id = msfa_overforingar.plan_id
        AND p.participant_id = msfa_overforingar.participant_id
        AND p.consultant_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Konsulent ångrar egen MSFA-markering" ON public.msfa_overforingar;
CREATE POLICY "Konsulent ångrar egen MSFA-markering" ON public.msfa_overforingar
  FOR DELETE TO authenticated
  USING (consultant_id = (SELECT auth.uid()) AND transferred_by = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Organisationens chef läser MSFA-markeringar" ON public.msfa_overforingar;
CREATE POLICY "Organisationens chef läser MSFA-markeringar" ON public.msfa_overforingar
  FOR SELECT TO authenticated
  USING (
    org_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.organization_members m
      WHERE m.org_id = msfa_overforingar.org_id
        AND m.user_id = (SELECT auth.uid())
        AND m.role = ANY (ARRAY['chef', 'admin'])
    )
  );

COMMIT;

-- Kontroll efter körning (förväntat: rls = true, fyra policyer, anon utan rättighet):
--   SELECT relrowsecurity FROM pg_class WHERE oid = 'public.msfa_overforingar'::regclass;
--   SELECT policyname, cmd FROM pg_policies WHERE tablename = 'msfa_overforingar';
--   SELECT has_table_privilege('anon', 'public.msfa_overforingar', 'SELECT');  -- false
--
-- Tillbaka:
--   DROP TABLE IF EXISTS public.msfa_overforingar;
--   ALTER TABLE public.consultant_placements DROP CONSTRAINT IF EXISTS cplac_betalstatus;
--   ALTER TABLE public.consultant_placements
--     DROP COLUMN IF EXISTS followup_3m_payment_status, DROP COLUMN IF EXISTS followup_3m_payment_status_at,
--     DROP COLUMN IF EXISTS followup_3m_payment_status_by, DROP COLUMN IF EXISTS followup_6m_payment_status,
--     DROP COLUMN IF EXISTS followup_6m_payment_status_at, DROP COLUMN IF EXISTS followup_6m_payment_status_by;
