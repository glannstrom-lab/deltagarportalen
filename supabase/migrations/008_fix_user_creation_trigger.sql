-- ============================================
-- Fix: Användarskapande och roller
-- ============================================

-- 1. Lägg till status-kolumn först (om den saknas)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'status'
    ) THEN
        ALTER TABLE profiles ADD COLUMN status TEXT DEFAULT 'ACTIVE';
    END IF;
END $$;

-- 2. Lägg till consultant_id-kolumn (om den saknas)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'consultant_id'
    ) THEN
        ALTER TABLE profiles ADD COLUMN consultant_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 3. Uppdatera profiles-tabellen för att stödja alla roller
ALTER TABLE profiles 
    DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE profiles 
    ADD CONSTRAINT profiles_role_check 
    CHECK (role IN ('SUPERADMIN', 'ADMIN', 'CONSULTANT', 'USER'));

-- 4. Lägg till constraint för status
ALTER TABLE profiles 
    DROP CONSTRAINT IF EXISTS profiles_status_check;

ALTER TABLE profiles 
    ADD CONSTRAINT profiles_status_check 
    CHECK (status IN ('ACTIVE', 'INACTIVE', 'COMPLETED', 'ON_HOLD'));

-- 5. Uppdatera handle_new_user funktionen för att hantera alla fält
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
  user_status TEXT;
  consultant_id UUID;
BEGIN
  -- Hämta metadata
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'USER');
  user_status := COALESCE(NEW.raw_user_meta_data->>'status', 'ACTIVE');
  
  -- Validera roll
  IF user_role NOT IN ('SUPERADMIN', 'ADMIN', 'CONSULTANT', 'USER') THEN
    user_role := 'USER';
  END IF;
  
  -- Försök hämta consultant_id från metadata
  BEGIN
    consultant_id := (NEW.raw_user_meta_data->>'consultant_id')::UUID;
  EXCEPTION WHEN OTHERS THEN
    consultant_id := NULL;
  END;
  
  -- Skapa profil
  INSERT INTO public.profiles (
    id, 
    email, 
    first_name, 
    last_name, 
    role,
    status,
    consultant_id,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    user_role,
    user_status,
    consultant_id,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    status = EXCLUDED.status,
    consultant_id = COALESCE(EXCLUDED.consultant_id, profiles.consultant_id),
    updated_at = NOW();
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Logga felet men tillåt fortfarande att användaren skapas
  RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Se till att triggen finns och är korrekt
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- 7. Se till att RLS är aktiverat men tillåter inserts från trigger
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 8. Policy för att tillåta trigger att skapa profiler
DROP POLICY IF EXISTS "Allow trigger to create profiles" ON profiles;
CREATE POLICY "Allow trigger to create profiles"
  ON profiles FOR INSERT
  WITH CHECK (true);

-- 9. Policy för att användare kan se sin egen profil
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- 10. Policy för att användare kan uppdatera sin egen profil
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- 11. Policy för att konsulenter kan se sina deltagare
DROP POLICY IF EXISTS "Consultants can view their participants" ON profiles;
CREATE POLICY "Consultants can view their participants"
  ON profiles FOR SELECT
  USING (
    auth.uid() = consultant_id OR 
    auth.uid() = id OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('SUPERADMIN', 'ADMIN')
    )
  );

-- 12. Policy för att admins kan se alla profiler
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('SUPERADMIN', 'ADMIN')
    )
  );

-- 13. Fyll på saknande profiler för befintliga användare
INSERT INTO profiles (id, email, role, status, created_at, updated_at)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'role', 'USER'),
  'ACTIVE',
  COALESCE(au.created_at, NOW()),
  NOW()
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 14. Verifiera att funktionen fungerar
DO $$
DECLARE
  test_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO test_count FROM profiles;
  RAISE NOTICE 'Total profiles: %', test_count;
  
  SELECT COUNT(*) INTO test_count FROM auth.users;
  RAISE NOTICE 'Total auth users: %', test_count;
END $$;
