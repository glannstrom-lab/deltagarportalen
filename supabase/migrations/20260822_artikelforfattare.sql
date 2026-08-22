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

-- VARNING till nästa läsare: raden `updated_at = updated_at` nedan gjorde
-- INTE det den ser ut att göra. Tabellen har en BEFORE UPDATE-trigger,
-- `update_articles_updated_at`, som sätter `now()` oavsett vad satsen säger.
-- Alla 163 artiklar kom därför att påstå att de uppdaterades 2026-08-22, och
-- artikelsidan visar `updated_at` som "Uppdaterad {{datum}}" — alltså ett
-- datum utan underlag, direkt synligt för läsaren. Rättat samma dag av
-- `20260822_aterstall_updated_at.sql`, som stänger av triggern under
-- körningen. Ska du röra den här tabellen igen: kontrollera triggern först.

UPDATE articles
SET author = 'Mikael Glännström',
    author_title = 'Arbetskonsulent';

-- Kontroll (ska ge 163 / 1 / 1):
--   SELECT count(*) AS rader,
--          count(DISTINCT author) AS unika_namn,
--          count(DISTINCT author_title) AS unika_titlar
--   FROM articles;
