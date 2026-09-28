-- SK2 (skarpt test 2026-09-28): intresseguidens historik har inte sparats sedan 10 juni.
-- TestTab.tsx skickar medvetet icf_profile = null när personen inte gett hälsosamtycke
-- (art. 9 — ICF-svaren är hälsouppgifter), men kolumnen var NOT NULL. Varje INSERT föll
-- med 23502 och felet sväljdes (console.error). Null är det avsedda värdet utan samtycke.
ALTER TABLE public.interest_guide_history ALTER COLUMN icf_profile DROP NOT NULL;
COMMENT ON COLUMN public.interest_guide_history.icf_profile IS
  'ICF-profilen (hälsouppgifter). NULL när personen inte gett hälsosamtycke (profiles.health_consent_at).';
