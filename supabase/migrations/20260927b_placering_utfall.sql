-- PENDING_20260927b_placering_utfall — INTE körd. Kräver Mikaels ja.
--
-- RR5/RR7 (rollspelet 2026-09-27, Rusta och matcha): en placering bar bara
-- arbetsgivare, titel, startdatum och två kryssrutor. Resultatersättningen
-- betalas efter anställning ELLER studier och följs upp efter 3 och 6 månader —
-- det underlaget fanns inte.
--
-- Additiv: nya nullbara kolumner, och CHECK-villkoret för placement_type
-- vidgas med 'studies' (inga befintliga värden blir ogiltiga). Inga RLS-
-- ändringar — tabellens befintliga policy (konsulent + aktiv relation) gäller.
--
-- Körning:
--   npx supabase db query --linked -f supabase/migrations/PENDING_20260927b_placering_utfall.sql
-- Efteråt (samma commit):
--   1. cd client && npm run schema:refresh
--   2. client/src/services/placeringUtfall.ts: UTFALL_KOLUMNER_FINNS = true
--   3. byt namn på filen till 20260927b_placering_utfall.sql

ALTER TABLE public.consultant_placements
  ADD COLUMN IF NOT EXISTS end_date date,
  ADD COLUMN IF NOT EXISTS hours_per_week numeric(4,1),
  ADD COLUMN IF NOT EXISTS scope_percent smallint,
  ADD COLUMN IF NOT EXISTS outcome_level text,
  ADD COLUMN IF NOT EXISTS followup_3m_date date,
  ADD COLUMN IF NOT EXISTS followup_3m_outcome text,
  ADD COLUMN IF NOT EXISTS followup_3m_evidence text,
  ADD COLUMN IF NOT EXISTS followup_3m_note text,
  ADD COLUMN IF NOT EXISTS followup_3m_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS followup_6m_date date,
  ADD COLUMN IF NOT EXISTS followup_6m_outcome text,
  ADD COLUMN IF NOT EXISTS followup_6m_evidence text,
  ADD COLUMN IF NOT EXISTS followup_6m_note text,
  ADD COLUMN IF NOT EXISTS followup_6m_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.consultant_placements
  DROP CONSTRAINT IF EXISTS consultant_placements_placement_type_check;
ALTER TABLE public.consultant_placements
  ADD CONSTRAINT consultant_placements_placement_type_check
  CHECK (placement_type::text = ANY (ARRAY['permanent', 'temp', 'trial', 'studies']));

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cplac_scope_rimlig') THEN
    ALTER TABLE public.consultant_placements ADD CONSTRAINT cplac_scope_rimlig CHECK (
      (hours_per_week IS NULL OR (hours_per_week > 0 AND hours_per_week <= 60))
      AND (scope_percent IS NULL OR (scope_percent BETWEEN 1 AND 100))
      AND (end_date IS NULL OR start_date IS NULL OR end_date >= start_date)
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cplac_niva') THEN
    ALTER TABLE public.consultant_placements ADD CONSTRAINT cplac_niva
      CHECK (outcome_level IS NULL OR outcome_level IN ('A', 'B', 'C'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cplac_uppfoljning_utfall') THEN
    ALTER TABLE public.consultant_placements ADD CONSTRAINT cplac_uppfoljning_utfall CHECK (
      (followup_3m_outcome IS NULL OR followup_3m_outcome IN ('kvar', 'kvar_annan', 'studier', 'slutat', 'ej_nadd'))
      AND (followup_6m_outcome IS NULL OR followup_6m_outcome IN ('kvar', 'kvar_annan', 'studier', 'slutat', 'ej_nadd'))
      AND (followup_3m_evidence IS NULL OR followup_3m_evidence IN ('anstallningsbevis', 'lonespecifikation', 'studieintyg', 'arbetsgivaren_muntligt', 'deltagaren_muntligt', 'inget'))
      AND (followup_6m_evidence IS NULL OR followup_6m_evidence IN ('anstallningsbevis', 'lonespecifikation', 'studieintyg', 'arbetsgivaren_muntligt', 'deltagaren_muntligt', 'inget'))
    );
  END IF;
  -- Ordningen: 6 månader kan inte vara gjord före 3 månader.
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cplac_uppfoljning_ordning') THEN
    ALTER TABLE public.consultant_placements ADD CONSTRAINT cplac_uppfoljning_ordning CHECK (
      followup_6m_date IS NULL OR (followup_3m_date IS NOT NULL AND followup_6m_date >= followup_3m_date)
    );
  END IF;
END $$;

COMMENT ON COLUMN public.consultant_placements.outcome_level IS 'Ersättningsnivå A/B/C enligt Rusta och matcha-avtalet (RR7).';
COMMENT ON COLUMN public.consultant_placements.followup_3m_evidence IS 'Underlag för 3-månadersuppföljningen (RR5).';
