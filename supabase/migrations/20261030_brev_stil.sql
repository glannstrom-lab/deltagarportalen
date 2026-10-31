-- KÖRD mot prod 2026-10-31 (Mikaels ja) (KF13, brevskrivaren lär sig av deltagarens ändringar).
--
-- client/src/lib/brevStil.ts sparar högst fem korta stilpreferenser ("Använd inte
-- utropstecken.") härledda mekaniskt ur skillnaden mellan AI-utkastet och det
-- deltagaren sparade. Kolumnen bär { "pa": bool, "prefs": [{ "id", "text", "at" }] }.
-- Av som standard: pa = false tills deltagaren slår på det under Inställningar.
-- RLS på user_preferences täcker redan raden (egen user_id för SELECT/INSERT/UPDATE).
-- Ingen funktion, inga nya rättigheter. Raderas med kontot (raden hör till användaren).

begin;

alter table public.user_preferences
  add column if not exists brev_stil jsonb not null default '{"pa": false, "prefs": []}'::jsonb;

commit;

-- Efter körning:
--   cd client && npm run schema:refresh
--   sätt BREV_STIL_KOLUMN_FINNS = true i client/src/lib/brevStil.ts
--   committa snapshoten + flaggan i samma commit (och Art. 30-raden + integritetspolicyn, se ROADMAP KF13).
