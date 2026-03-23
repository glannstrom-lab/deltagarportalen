-- ============================================
-- SUPERADMIN: Kan se alla användare
-- ============================================
-- Lösning: Skapa en SECURITY DEFINER funktion som kollar rollen
-- utan att orsaka rekursion i RLS-policyn

-- 1. Skapa en hjälpfunktion som returnerar användarens roll
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM profiles
  WHERE id = auth.uid();

  RETURN COALESCE(user_role, 'USER');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 2. Skapa en funktion som kollar om användaren är superadmin/admin
CREATE OR REPLACE FUNCTION is_admin_or_superadmin()
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM profiles
  WHERE id = auth.uid();

  RETURN user_role IN ('SUPERADMIN', 'ADMIN');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 3. Lägg till policy för superadmin/admin att se alla profiler
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT
  USING (is_admin_or_superadmin());

-- 4. Lägg till policy för superadmin/admin att uppdatera alla profiler (t.ex. ändra roll)
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE
  USING (is_admin_or_superadmin());

-- 5. Verifiera att SUPERADMIN finns som giltig roll
-- (Uppdatera CHECK constraint om det behövs)
DO $$
BEGIN
  -- Lägg till SUPERADMIN i role check om det inte redan finns
  ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
  ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
    CHECK (role IN ('USER', 'CONSULTANT', 'ADMIN', 'SUPERADMIN'));
EXCEPTION
  WHEN OTHERS THEN
    -- Constraint kanske inte finns eller har annat namn, ignorera
    NULL;
END $$;

-- 6. Säkerställ att status-kolumnen finns (för att visa aktiv/inaktiv)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ACTIVE';
