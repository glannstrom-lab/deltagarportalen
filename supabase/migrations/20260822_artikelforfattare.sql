-- Artiklarnas byline: en verklig, ansvarig person i stället för 36 påhittade
--
-- ROADMAP AR2 / KB-A. Beslut Mikael 2026-08-22.
--
-- Före den här migrationen bar `articles.author` **37 olika namn**, varav
-- ett var organisationen ("Jobin-redaktionen", 30 artiklar) och resten
-- namngivna personer som inte finns:
--
--     22  Maria Lindqvist          14  Erik Johansson
--     10  Lisa Bergström            5  Katarina Holm
--      5  Sara Blom                 …och 31 namn till
--
-- `author_title` gav dem dessutom yrken. Fem artiklar om ersättningsnivåer
-- signerades "Katarina Holm, Handläggare Arbetsförmedlingen" — en påhittad
-- person tillskriven en myndighet, på precis de texter där myndighets-
-- auktoritet väger tyngst. Fem artiklar om depression och avslag signerades
-- "Anna Lindberg, Psykolog", till en målgrupp som CLAUDE.md beskriver som
-- långtidsarbetslösa med psykologiska utmaningar.
--
-- Nu står en verklig person bakom texterna, med ett namn läsaren kan
-- kontrollera och vända sig till. Det är hela skillnaden.
--
-- Körs manuellt (se CLAUDE.md — `db push` failar på konflikter):
--     npx supabase db query --linked -f supabase/migrations/20260822_artikelforfattare.sql
--
-- Backning: `supabase/backups/2026-08-22-artikelforfattare.json` har slug,
-- author och author_title för alla 163 rader som de såg ut före körningen.

UPDATE articles
SET author = 'Mikael Glännström',
    author_title = 'Arbetskonsulent',
    updated_at = updated_at;   -- rör inte "senast uppdaterad" — texten är oförändrad

-- Kontroll (ska ge 163 / 1 / 1):
--   SELECT count(*) AS rader,
--          count(DISTINCT author) AS unika_namn,
--          count(DISTINCT author_title) AS unika_titlar
--   FROM articles;
