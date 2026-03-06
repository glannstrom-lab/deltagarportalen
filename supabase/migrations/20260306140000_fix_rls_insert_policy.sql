-- ============================================
-- FIX RLS INSERT POLICIES
-- ============================================
-- Problem: RLS-policyerna tillåter inte inserts även med rätt user_id
-- Lösning: Uppdatera policyerna för att explicit tillåta inserts

-- ============================================
-- 1. DASHBOARD_PREFERENCES - Fixa insert policy
-- ============================================
DROP POLICY IF EXISTS "Enable all operations for users based on user_id" ON dashboard_preferences;
DROP POLICY IF EXISTS "Anonymous users cannot access dashboard_preferences" ON dashboard_preferences;

-- Separata policies för olika operationer
CREATE POLICY "Users can select own dashboard preferences" 
ON dashboard_preferences
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own dashboard preferences" 
ON dashboard_preferences
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own dashboard preferences" 
ON dashboard_preferences
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own dashboard preferences" 
ON dashboard_preferences
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ============================================
-- 2. USER_PREFERENCES - Fixa insert policy
-- ============================================
DROP POLICY IF EXISTS "Enable all operations for users based on user_id" ON user_preferences;
DROP POLICY IF EXISTS "Anonymous users cannot access user_preferences" ON user_preferences;

CREATE POLICY "Users can select own user preferences" 
ON user_preferences
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own user preferences" 
ON user_preferences
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own user preferences" 
ON user_preferences
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own user preferences" 
ON user_preferences
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ============================================
-- 3. ARTICLE_BOOKMARKS - Fixa insert policy
-- ============================================
DROP POLICY IF EXISTS "Enable all operations for users based on user_id" ON article_bookmarks;

CREATE POLICY "Users can select own bookmarks" 
ON article_bookmarks
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bookmarks" 
ON article_bookmarks
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own bookmarks" 
ON article_bookmarks
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ============================================
-- VERIFICATION
-- ============================================
SELECT 
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename IN ('dashboard_preferences', 'user_preferences', 'article_bookmarks')
ORDER BY tablename, cmd;
