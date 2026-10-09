-- Körd mot prod 2026-10-09 (beslut Mikael: "2. ja") med
-- `npx supabase db query --linked -f`. Snapshoten uppdaterad i samma commit.
--
-- Rådgivarens röst (beslut Mikael 2026-10-09): rådgivaren hälsar på varje sida
-- och läser upp nästa steg. På som standard. Låg första dagen bara i
-- localStorage — den som stängde av rösten på telefonen hörde den ändå på
-- datorn. Den här kolumnen gör valet molnsparat som övriga inställningar.

ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS coach_voice boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.user_preferences.coach_voice IS
  'Rådgivaren läser upp hälsning och nästa steg med röst (förinspelade klipp). Standard på. Beslut 2026-10-09.';
