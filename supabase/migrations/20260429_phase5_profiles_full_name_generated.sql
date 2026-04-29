-- Phase 5 hotfix: hub-summary loaders SELECT profiles.full_name, but the live
-- schema only has first_name + last_name. Adding full_name as a STORED generated
-- column preserves the loader API (Plan 05-02/03/04/05 contracts) without rewriting
-- contexts/widgets/tests that already consume `full_name`.
--
-- Fix for production 400s on /rest/v1/profiles?select=onboarded_hubs,full_name and
-- /rest/v1/consultant_participants?select=...profiles:consultant_id(id,full_name,...).

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS full_name text
  GENERATED ALWAYS AS (
    NULLIF(TRIM(BOTH ' ' FROM COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')), '')
  ) STORED;
