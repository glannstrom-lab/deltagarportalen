-- A17, del 2: REVOKE från `anon` räcker inte — PUBLIC hade EXECUTE.
--
-- Postgres ger som default `EXECUTE` till PUBLIC på nya funktioner. I proacl syns
-- det som `=X/postgres` (tom roll före `=` betyder PUBLIC). Eftersom `anon` är
-- medlem i PUBLIC gav `REVOKE EXECUTE … FROM anon` i föregående migration ingen
-- effekt alls:
--
--   proname                 | acl                                                        | anon_exec
--   post_to_community_feed  | {=X/postgres,postgres=X/postgres,service_role=X/postgres}   | true
--                             ^^^^^^^^^^^^ PUBLIC-grantet står kvar
--
-- Verifierat mot prod 2026-08-04 direkt efter 20260804110000: anon kunde
-- fortfarande köra get_application_stats mot en annan användares uuid.
--
-- ÅTGÄRD: REVOKE från PUBLIC på alla 18, och GRANT tillbaka explicit till de
-- roller som ska ha kvar funktionen. Efter det här ska proacl inte längre
-- innehålla någon post som börjar med `=`.
--
-- Lärdom att bära vidare: kontrollera alltid `proacl`, inte bara att REVOKE-
-- kommandot gick igenom utan fel. Ett REVOKE mot en roll som inte har ett
-- explicit grant lyckas tyst utan att ändra något.

-- ---------------------------------------------------------------------------
-- Ta bort PUBLIC-grantet på alla 18
-- ---------------------------------------------------------------------------

REVOKE EXECUTE ON FUNCTION public.create_learning_path_from_gap(uuid, text, text, integer)         FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.find_buddy_matches(uuid, integer)                                FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.generate_course_recommendations(uuid, uuid, integer)             FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_application_stats(uuid)                                      FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_mood_streak(uuid)                                            FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_or_create_user_preferences(uuid)                             FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_stale_applications(uuid, integer)                            FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_upcoming_reminders(uuid, integer)                            FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_user_courses(uuid)                                           FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_user_learning_stats(uuid)                                    FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.increment_user_points(uuid, integer)                             FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.initialize_user_milestones(uuid)                                 FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.log_user_activity(uuid, text, text, text, integer, jsonb)        FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.post_to_community_feed(uuid, text, text, text, jsonb, boolean)   FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.react_to_feed_item(uuid, uuid, text)                             FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.remove_reaction(uuid, uuid, text)                                FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_milestone_progress(uuid, text, integer)                   FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_user_streak(uuid)                                         FROM PUBLIC;

-- ---------------------------------------------------------------------------
-- GRANT tillbaka till de roller som ska ha kvar funktionerna
--
-- De tre med anropare: authenticated behövs (appen anropar dem som inloggad
-- användare) och de har grinden från 20260804110000. service_role behövs för
-- learning-progress-edgefunktionen.
-- ---------------------------------------------------------------------------

GRANT EXECUTE ON FUNCTION public.get_application_stats(uuid)                                 TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_learning_stats(uuid)                               TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.log_user_activity(uuid, text, text, text, integer, jsonb)   TO authenticated, service_role;

-- De 15 utan anropare behåller service_role (bakvägen för framtida edge-
-- funktioner och för underhåll) men når varken anon eller authenticated.
GRANT EXECUTE ON FUNCTION public.create_learning_path_from_gap(uuid, text, text, integer)       TO service_role;
GRANT EXECUTE ON FUNCTION public.find_buddy_matches(uuid, integer)                              TO service_role;
GRANT EXECUTE ON FUNCTION public.generate_course_recommendations(uuid, uuid, integer)           TO service_role;
GRANT EXECUTE ON FUNCTION public.get_mood_streak(uuid)                                          TO service_role;
GRANT EXECUTE ON FUNCTION public.get_or_create_user_preferences(uuid)                           TO service_role;
GRANT EXECUTE ON FUNCTION public.get_stale_applications(uuid, integer)                          TO service_role;
GRANT EXECUTE ON FUNCTION public.get_upcoming_reminders(uuid, integer)                          TO service_role;
GRANT EXECUTE ON FUNCTION public.get_user_courses(uuid)                                         TO service_role;
GRANT EXECUTE ON FUNCTION public.increment_user_points(uuid, integer)                           TO service_role;
GRANT EXECUTE ON FUNCTION public.initialize_user_milestones(uuid)                               TO service_role;
GRANT EXECUTE ON FUNCTION public.post_to_community_feed(uuid, text, text, text, jsonb, boolean) TO service_role;
GRANT EXECUTE ON FUNCTION public.react_to_feed_item(uuid, uuid, text)                           TO service_role;
GRANT EXECUTE ON FUNCTION public.remove_reaction(uuid, uuid, text)                              TO service_role;
GRANT EXECUTE ON FUNCTION public.update_milestone_progress(uuid, text, integer)                 TO service_role;
GRANT EXECUTE ON FUNCTION public.update_user_streak(uuid)                                       TO service_role;
