-- A21 (SEC-05 + SEC-09): två permissiva dubblettpolicyer som upphäver de guardade.
--
-- Samma klass som A16 (rollökningen) och som A7/A10 i förra revisionen: Postgres
-- OR-kombinerar permissiva policyer, så den svagaste vinner alltid. En sträng
-- policy skrivs, en äldre eller slarvig permissiv policy står kvar bredvid, och
-- grinden slutar gälla utan att någonting går sönder synligt.
--
-- ===========================================================================
-- 1. mood_logs — wellness-samtyckets grind är neutraliserad
-- ===========================================================================
--
-- Prod 2026-08-04 har TVÅ permissiva INSERT-policyer:
--
--   "Users can create own mood logs"                CHECK (user_id = auth.uid())
--   "Users can insert mood logs with wellness…"     CHECK (auth.uid() = user_id
--                                                          AND check_wellness_consent(auth.uid()))
--
-- Den första saknar samtyckeskontrollen och räcker ensam. Samtyckesgrinden för
-- hälsodata har alltså aldrig gällt på databasnivå — bara i UI:t.
--
-- KONTROLLERAT FÖRE ÄNDRINGEN (annars hade det här brutit måendeloggningen):
--   * Alla levande skrivvägar går genom `WellnessConsentGate`:
--       - components/diary/MoodTab.tsx  → useDiary.logMood   (Diary.tsx:223 gate)
--       - pages/wellness/HealthTab.tsx  → moodApi            (Wellness.tsx:56 gate)
--     `components/calendar/MoodTracker.tsx` skriver inte mood_logs och har
--     dessutom noll importörer.
--   * `check_wellness_consent(uuid)` är korrekt och trivial: EXISTS(profiles
--     WHERE id = user_uuid AND wellness_consent_at IS NOT NULL).
--   * Prod: mood_logs = 4 rader, 2 av 92 profiler har wellness_consent_at.
--     Efter ändringen kan bara de som faktiskt samtyckt skriva — vilket är
--     exakt vad grinden och UX18:s samtyckestext lovar användaren.
--
-- Följden av att INTE göra det här: portalen säger till användaren att
-- hälsodata bara sparas med samtycke, medan databasen tar emot den oavsett.

DROP POLICY IF EXISTS "Users can create own mood logs" ON public.mood_logs;

-- ===========================================================================
-- 2. storage.objects — blanket-INSERT för alla inloggade
-- ===========================================================================
--
-- Prod 2026-08-04:
--   "Allow uploads h83o5u_0"              INSERT  roles=authenticated  CHECK = true
--   "Users can upload own documents"      INSERT  CHECK bucket_id='profile-documents'
--                                                       AND auth.uid() = foldername(name)[1]
--   "Users can upload own profile images" INSERT  CHECK bucket_id='profile-images'  …
--
-- Den första har varken bucket-, sökvägs- eller ägarkontroll och upphäver de två
-- välskrivna. Vilken inloggad deltagare som helst hade kunnat lägga filer i en
-- ANNAN användares mapp i `profile-documents` (offret ser dem sedan som sina
-- egna dokument) och i den publika bucketen `profile-images` under godtycklig
-- sökväg — alltså en öppen filvärd på en URL kopplad till Jobin.
--
-- De tre systergenererade policyerna för SELECT/UPDATE/DELETE (h83o5u_1/_0/_2)
-- är verifierade och begränsar korrekt på `foldername(name)[1] = auth.uid()`.
-- De lämnas orörda — bara INSERT-policyn är hålet.
--
-- Prod: storage.objects = 0 rader. Ingenting befintligt påverkas.

DROP POLICY IF EXISTS "Allow uploads h83o5u_0" ON storage.objects;

-- ===========================================================================
-- 3. Bucketgränser — saknades helt
-- ===========================================================================
--
-- Båda bucketarna hade file_size_limit = NULL och allowed_mime_types = NULL,
-- alltså obegränsad storlek och godtycklig filtyp. `profile-images` är dessutom
-- publik. Utan gränser är en publik bucket en gratis filvärd för vem som helst
-- som kommer åt uppladdningen.

UPDATE storage.buckets
   SET file_size_limit = 5242880,  -- 5 MB
       allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif']
 WHERE id = 'profile-images';

UPDATE storage.buckets
   SET file_size_limit = 10485760, -- 10 MB (CV/intyg kan vara tyngre än en bild)
       allowed_mime_types = ARRAY[
         'application/pdf',
         'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
         'application/msword',
         'image/png',
         'image/jpeg'
       ]
 WHERE id = 'profile-documents';

-- ===========================================================================
-- Verifiering efteråt
-- ===========================================================================
-- select policyname, cmd, with_check from pg_policies
--  where tablename='mood_logs' and cmd='INSERT';
--   → exakt en rad, med check_wellness_consent
--
-- select policyname, cmd, with_check from pg_policies
--  where schemaname='storage' and tablename='objects' and cmd='INSERT';
--   → exakt två rader, båda bucket- och ägarbegränsade
--
-- select id, file_size_limit, allowed_mime_types from storage.buckets;
--   → inga NULL kvar
