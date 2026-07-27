-- =============================================================================
-- H3: Avveckla dött schema — 15 tabeller
-- Datum: 2026-07-27
-- Godkänd av: Mikael ("ja, migrera du, men kör en backup först")
-- =============================================================================
--
-- ## Backup före körning
--
-- `supabase db dump` kräver Docker, som inte kördes på maskinen. I stället togs en
-- RIKTAD backup av exakt den data som raderas här — allt annat i databasen berörs
-- inte av migrationen:
--
--   C:\Users\Mikael\Desktop\AI PROJEKT\_db-backups\h3-data-backup-2026-07-27.json
--   (utanför git-repot, eftersom dumpar innehåller persondata)
--
-- Innehåller samtliga 9 rader som fanns i de tre icke-tomma tabellerna, verifierat
-- läsbart efter export. Tabellernas DDL finns kvar i git-historiken
-- (`20260320_community_full.sql`, `20260320_community_features.sql` m.fl.), så både
-- struktur och innehåll går att återskapa.
--
-- ## Rättelse mot planeringsunderlaget
--
-- `PENDING_`-versionen av den här filen påstod att alla 15 tabeller var tomma. Det
-- var fel — kontrollen som gjordes då byggde delvis på `pg_class.reltuples`, som är
-- `-1` för tabeller som aldrig analyserats och därför inte skiljer "tom" från
-- "okänd". Med `pg_stat_user_tables.n_live_tup` visade sig tre ha rader:
--
--   community_categories   5 rader   seed-kategorier för en funktion som inte finns
--   articles_backup        2 rader   `articles` har 133 rader → backupen är ingen enda kopia
--   user_widget_layouts    2 rader   en användares dashboardlayout från 2026-04-29,
--                                    för widget-systemet som arkiverades i C1/C10
--
-- Därför är DROP:en delad i två block med olika säkringar.
--
-- ## Vad som medvetet INTE ingår
--
--   achievements, user_achievements     katalog + koppling med FK — tas som par
--   milestones, user_milestones,
--   user_gamification                   innehåller deltagardata (21/31/20 rader)
--   login_attempts, data_export_logs,
--   data_sharing_audit, admin_audit_log,
--   consent_history                     revisionsloggar, skrivs av triggers/RPC
--
-- Körs med:
--   npx supabase db query --linked -f supabase/migrations/20260727140000_drop_dead_schema.sql
-- Därefter:
--   node client/scripts/refresh-schema-snapshot.cjs   (och committa snapshoten)
-- =============================================================================


-- -----------------------------------------------------------------------------
-- BLOCK A: 12 tomma tabeller — vägrar om någon innehåller en enda rad
-- -----------------------------------------------------------------------------

DO $$
DECLARE
  doomed TEXT[] := ARRAY[
    'community_buddy_checkins',
    'community_buddy_preferences',
    'community_buddies',
    'community_cheers',
    'community_group_invites',
    'community_group_members',
    'community_group_messages',
    'community_groups',
    'community_likes',
    'community_replies',
    'community_topics',
    'community_feed'
  ];
  tbl TEXT;
  n BIGINT;
  blockers TEXT := '';
BEGIN
  -- Kontrollera ALLA innan vi rör NÅGON
  FOREACH tbl IN ARRAY doomed LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables
               WHERE table_schema = 'public' AND table_name = tbl) THEN
      EXECUTE format('SELECT count(*) FROM public.%I', tbl) INTO n;
      IF n > 0 THEN
        blockers := blockers || format('%s (%s rader), ', tbl, n);
      END IF;
    END IF;
  END LOOP;

  IF blockers <> '' THEN
    RAISE EXCEPTION 'BLOCK A avbrutet — dessa skulle vara tomma men har data: %', blockers;
  END IF;

  -- CASCADE behövs: community-tabellerna har FK mot varandra
  FOREACH tbl IN ARRAY doomed LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables
               WHERE table_schema = 'public' AND table_name = tbl) THEN
      EXECUTE format('DROP TABLE public.%I CASCADE', tbl);
      RAISE NOTICE 'Block A: droppade %', tbl;
    END IF;
  END LOOP;
END $$;


-- -----------------------------------------------------------------------------
-- BLOCK B: 3 tabeller med känd data — vägrar om radantalet AVVIKER från backupen
-- -----------------------------------------------------------------------------
-- Säkringen är inte "tom" utan "exakt det jag tog backup av". Har någon skrivit
-- en rad sedan backupen togs stoppar migrationen, så inget faller mellan stolarna.

DO $$
DECLARE
  expected JSONB := '{
    "community_categories": 5,
    "articles_backup": 2,
    "user_widget_layouts": 2
  }'::jsonb;
  tbl TEXT;
  want BIGINT;
  got BIGINT;
  mismatches TEXT := '';
BEGIN
  FOR tbl IN SELECT jsonb_object_keys(expected) LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables
               WHERE table_schema = 'public' AND table_name = tbl) THEN
      want := (expected ->> tbl)::BIGINT;
      EXECUTE format('SELECT count(*) FROM public.%I', tbl) INTO got;
      IF got <> want THEN
        mismatches := mismatches || format('%s (backup: %s, nu: %s), ', tbl, want, got);
      END IF;
    END IF;
  END LOOP;

  IF mismatches <> '' THEN
    RAISE EXCEPTION 'BLOCK B avbrutet — radantal avviker från backupen: %. Ta ny backup och kör igen.', mismatches;
  END IF;

  FOR tbl IN SELECT jsonb_object_keys(expected) LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables
               WHERE table_schema = 'public' AND table_name = tbl) THEN
      EXECUTE format('DROP TABLE public.%I CASCADE', tbl);
      RAISE NOTICE 'Block B: droppade % (backupad)', tbl;
    END IF;
  END LOOP;
END $$;


-- -----------------------------------------------------------------------------
-- Verifiering
-- -----------------------------------------------------------------------------

SELECT
  count(*) FILTER (WHERE table_name LIKE 'community%') AS community_kvar,
  count(*) FILTER (WHERE table_name = 'articles_backup') AS articles_backup_kvar,
  count(*) FILTER (WHERE table_name = 'user_widget_layouts') AS widget_layouts_kvar,
  (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public') AS tabeller_totalt
FROM information_schema.tables
WHERE table_schema = 'public';
