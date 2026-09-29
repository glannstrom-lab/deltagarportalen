-- FT3-rest (2026-09-29): notisklockan har aldrig uppdaterats i realtid.
--
-- useNotifications.ts prenumererar på postgres_changes för public.notifications
-- (filtrerat på user_id), men publikationen supabase_realtime är TOM i prod —
-- inga händelser når klienten. Mätt 2026-09-29:
--   select * from pg_publication_tables where pubname = 'supabase_realtime';  → 0 rader
--
-- Säkerhet: Realtime tillämpar RLS på postgres_changes. notifications har en enda
-- läspolicy, "Enable all operations for users based on user_id" (auth.uid() = user_id),
-- så en prenumerant får bara sina egna rader oavsett vilket filter klienten skickar.
--
-- Tills detta körs uppdateras klockan av NotificationBell själv var 60:e sekund och
-- vid fönsterfokus (2026-09-29). Efter körning kommer notisen direkt; pollningen
-- blir reserv.

alter publication supabase_realtime add table public.notifications;

-- Kontroll efteråt (förväntat: en rad, public.notifications):
-- select schemaname, tablename from pg_publication_tables where pubname = 'supabase_realtime';
