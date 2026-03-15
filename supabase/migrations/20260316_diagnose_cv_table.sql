-- ============================================
-- Diagnostik: Verifiera CV-tabell och work_experience-fält
-- Kör detta i Supabase SQL Editor för att se om allt är korrekt
-- ============================================

-- 1. Kolla om tabellen finns och dess struktur
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'cvs' 
ORDER BY ordinal_position;

-- 2. Kolla om det finns några rader i cvs-tabellen
SELECT 
  id, 
  user_id, 
  jsonb_array_length(work_experience) as work_exp_count,
  work_experience,
  updated_at
FROM cvs 
LIMIT 5;

-- 3. Verifiera RLS är aktiverat
SELECT 
  relname as table_name,
  relrowsecurity as rls_enabled
FROM pg_class 
WHERE relname = 'cvs';

-- 4. Lista alla policies för cvs-tabellen
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'cvs';

-- 5. TEST: Uppdatera work_experience direkt (byt ut USER_ID mot din faktiska user ID)
-- OBS: Avkommentera och kör endast om du vill testa uppdatering
-- UPDATE cvs 
-- SET work_experience = '[{"id":"test1","company":"Test AB","title":"Testare","startDate":"2024-01"}]'::jsonb,
--     updated_at = NOW()
-- WHERE user_id = 'BYT_UT_MOT_DIN_USER_ID'::uuid
-- RETURNING id, jsonb_array_length(work_experience) as count;

-- 6. Kolla om det finns triggers som kan störa
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'cvs';

-- 7. Verifiera att användaren har behörighet (för den inloggade användaren)
-- Detta visar om RLS tillåter åtkomst
SELECT 
  has_table_privilege('authenticated', 'cvs', 'SELECT') as can_select,
  has_table_privilege('authenticated', 'cvs', 'INSERT') as can_insert,
  has_table_privilege('authenticated', 'cvs', 'UPDATE') as can_update,
  has_table_privilege('authenticated', 'cvs', 'DELETE') as can_delete;
