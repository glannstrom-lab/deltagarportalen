-- Lägg till stöd för multipla roller och aktiv roll
-- Datum: 2026-03-15

-- Lägg till kolumn för alla roller (array)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS roles TEXT[] DEFAULT NULL;

-- Lägg till kolumn för aktiv roll
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS active_role TEXT DEFAULT NULL;

-- Uppdatera befintliga användare att ha sin nuvarande roll i båda kolumnerna
UPDATE profiles 
SET roles = ARRAY[role],
    active_role = role
WHERE roles IS NULL;

-- Skapa index för snabbare sökning
CREATE INDEX IF NOT EXISTS idx_profiles_roles ON profiles USING GIN (roles);
CREATE INDEX IF NOT EXISTS idx_profiles_active_role ON profiles (active_role);

-- Kommentarer för dokumentation
COMMENT ON COLUMN profiles.roles IS 'Array av alla roller användaren har (USER, CONSULTANT, ADMIN, SUPERADMIN)';
COMMENT ON COLUMN profiles.active_role IS 'Vilken roll som är aktiv just nu för UI-vy';

-- Uppdatera RLS-policyer om nödvändigt (användare kan uppdatera sin egen active_role)
DROP POLICY IF EXISTS "Users can update own active_role" ON profiles;

CREATE POLICY "Users can update own active_role" ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
