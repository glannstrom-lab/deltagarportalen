-- Kvar i KM-spåret punkt 5 (2026-09-12): activity_sessions_participant_guard() hade
-- EXECUTE för PUBLIC (Postgres default). Den är en triggerfunktion, inte SECURITY
-- DEFINER, så det var harmlöst — men lint:grants räknar, och en trigger avfyras ändå
-- utan EXECUTE (lärdom KM: "definer utan EXECUTE avfyras ändå"). Mätt före:
-- proacl visade PUBLIC. Körd 2026-09-12.
REVOKE EXECUTE ON FUNCTION public.activity_sessions_participant_guard() FROM PUBLIC, anon, authenticated;
