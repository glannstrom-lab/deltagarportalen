-- ============================================
-- FIX: Signup Trigger - Säkerställ att alla kolumner finns
-- Datum: 2026-04-08
-- Problem: handle_new_user() trigger misslyckas för att roles/active_role kolumner saknas
-- ============================================

-- 1. Lägg till saknade kolumner (IF NOT EXISTS säkerställer idempotens)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS roles TEXT[] DEFAULT NULL;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS active_role TEXT DEFAULT NULL;

-- 2. Lägg till consent-kolumner om de saknas
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS privacy_accepted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS ai_consent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS marketing_consent_at TIMESTAMPTZ;

-- 3. Skapa consent_history tabell om den saknas
CREATE TABLE IF NOT EXISTS consent_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  consent_type TEXT NOT NULL CHECK (consent_type IN ('terms', 'privacy', 'ai_processing', 'marketing')),
  action TEXT NOT NULL CHECK (action IN ('granted', 'withdrawn')),
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS för consent_history
ALTER TABLE consent_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own consent history" ON consent_history;
CREATE POLICY "Users can view own consent history" ON consent_history
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert consent records" ON consent_history;
CREATE POLICY "System can insert consent records" ON consent_history
  FOR INSERT WITH CHECK (TRUE);

-- 4. Skapa invitations tabell om den saknas (refereras av triggern)
CREATE TABLE IF NOT EXISTS invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'USER',
  consultant_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  invited_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  used_at TIMESTAMPTZ,
  used_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Uppdatera handle_new_user trigger med bättre felhantering
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  invite_record RECORD;
  user_role TEXT DEFAULT 'USER';
  user_consultant_id UUID DEFAULT NULL;
  consent_timestamp TIMESTAMPTZ DEFAULT NOW();
BEGIN
  -- Försök hitta invitation (med felhantering om tabellen inte finns)
  BEGIN
    SELECT * INTO invite_record
    FROM invitations
    WHERE email = NEW.email
      AND used_at IS NULL
      AND expires_at > NOW()
    LIMIT 1;

    IF invite_record.id IS NOT NULL THEN
      user_role := invite_record.role;
      user_consultant_id := invite_record.consultant_id;

      UPDATE invitations
      SET used_at = NOW(), used_by = NEW.id
      WHERE id = invite_record.id;
    END IF;
  EXCEPTION WHEN undefined_table THEN
    -- invitations-tabellen finns inte, fortsätt med default roll
    NULL;
  END;

  -- Skapa profil med ALLA fält
  INSERT INTO public.profiles (
    id,
    email,
    first_name,
    last_name,
    role,
    roles,
    active_role,
    consultant_id,
    terms_accepted_at,
    privacy_accepted_at,
    ai_consent_at,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    user_role,
    ARRAY[user_role]::TEXT[],
    user_role,
    user_consultant_id,
    CASE WHEN (NEW.raw_user_meta_data->>'terms_accepted')::boolean = true
         THEN consent_timestamp ELSE NULL END,
    CASE WHEN (NEW.raw_user_meta_data->>'privacy_accepted')::boolean = true
         THEN consent_timestamp ELSE NULL END,
    CASE WHEN (NEW.raw_user_meta_data->>'ai_consent')::boolean = true
         THEN consent_timestamp ELSE NULL END,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = COALESCE(EXCLUDED.first_name, profiles.first_name),
    last_name = COALESCE(EXCLUDED.last_name, profiles.last_name),
    terms_accepted_at = COALESCE(profiles.terms_accepted_at, EXCLUDED.terms_accepted_at),
    privacy_accepted_at = COALESCE(profiles.privacy_accepted_at, EXCLUDED.privacy_accepted_at),
    ai_consent_at = COALESCE(profiles.ai_consent_at, EXCLUDED.ai_consent_at),
    updated_at = NOW();

  -- Logga consent (med felhantering)
  BEGIN
    IF (NEW.raw_user_meta_data->>'terms_accepted')::boolean = true THEN
      INSERT INTO consent_history (user_id, consent_type, action)
      VALUES (NEW.id, 'terms', 'granted');
    END IF;

    IF (NEW.raw_user_meta_data->>'privacy_accepted')::boolean = true THEN
      INSERT INTO consent_history (user_id, consent_type, action)
      VALUES (NEW.id, 'privacy', 'granted');
    END IF;

    IF (NEW.raw_user_meta_data->>'ai_consent')::boolean = true THEN
      INSERT INTO consent_history (user_id, consent_type, action)
      VALUES (NEW.id, 'ai_processing', 'granted');
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Ignorera fel vid consent logging, profilen är viktigare
    RAISE WARNING 'Could not log consent for user %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Logga felet men tillåt att användaren skapas ändå
  RAISE WARNING 'Error in handle_new_user for %: %', NEW.id, SQLERRM;

  -- Fallback: skapa minimal profil
  BEGIN
    INSERT INTO public.profiles (id, email, role, created_at, updated_at)
    VALUES (NEW.id, NEW.email, 'USER', NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Fallback profile creation also failed for %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Säkerställ att triggern är korrekt kopplad
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 7. Verifiera att allt fungerar
DO $$
DECLARE
  col_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO col_count
  FROM information_schema.columns
  WHERE table_name = 'profiles'
    AND column_name IN ('roles', 'active_role', 'terms_accepted_at');

  IF col_count = 3 THEN
    RAISE NOTICE '✅ Alla nödvändiga kolumner finns i profiles-tabellen';
  ELSE
    RAISE WARNING '⚠️ Saknar % av 3 kolumner', 3 - col_count;
  END IF;
END $$;
