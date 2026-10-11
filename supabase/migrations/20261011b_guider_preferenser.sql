-- PENDING (Mikaels ja krävs) — beslut 2026-10-11: guidernas läge följer kontot.
--
-- client/src/lib/guideMinne.ts sparade "stängd" bara i localStorage, så guiden kom
-- tillbaka på varje ny enhet. Kolumnen bär { "<guide>": { "stangd": bool, "at": iso } }.
-- RLS på user_preferences täcker redan raden (egen user_id för SELECT/INSERT/UPDATE).
-- Ingen funktion, inga nya rättigheter.

begin;

alter table public.user_preferences
  add column if not exists guider jsonb not null default '{}'::jsonb;

commit;

-- Efter körning:
--   cd client && npm run schema:refresh
--   sätt GUIDER_KOLUMN_FINNS = true i client/src/lib/guideMinne.ts
--   committa snapshoten + flaggan i samma commit.
