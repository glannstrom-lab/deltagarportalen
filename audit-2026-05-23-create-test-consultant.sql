-- =============================================================================
-- Skapa test-konsulent för e2e-tester
-- =============================================================================
-- Email: claude-playwright-consultant@jobin.test
-- Password: Konsulent-Test-2026-05-23-Jobin!
-- Role: CONSULTANT
--
-- .test är reserved TLD (RFC 2606) → email kan ALDRIG nå en riktig adress.
-- Säker att använda för test-konton i prod-DB utan risk för att deltagare
-- råkar få mail.
-- =============================================================================

DO $$
DECLARE
  v_user_id UUID;
  v_existing_id UUID;
BEGIN
  -- Idempotent: skapa bara om den inte redan finns
  SELECT id INTO v_existing_id FROM auth.users
  WHERE email = 'claude-playwright-consultant@jobin.test';

  IF v_existing_id IS NOT NULL THEN
    RAISE NOTICE 'Test-konsulent finns redan (id=%) — uppdaterar bara role', v_existing_id;
    UPDATE profiles SET role = 'CONSULTANT', first_name = 'Claude', last_name = 'Test'
    WHERE id = v_existing_id;
    RETURN;
  END IF;

  v_user_id := gen_random_uuid();

  -- Skapa auth.users-rad
  -- NOTE: GoTrue (Supabase Auth) förväntar sig tom sträng '' (inte NULL)
  -- på *_token-kolumnerna — annars ger login "Database error querying schema".
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change,
    email_change_token_current,
    reauthentication_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    v_user_id,
    'authenticated',
    'authenticated',
    'claude-playwright-consultant@jobin.test',
    crypt('Konsulent-Test-2026-05-23-Jobin!', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    NOW(),
    NOW(),
    '', '', '', '', '', ''
  );

  -- auth.identities-rad behövs för GoTrue v2 — annars ger login schema-fel.
  -- email-kolumnen är genererad → utelämnas.
  INSERT INTO auth.identities (
    id, user_id, provider_id, provider, identity_data,
    last_sign_in_at, created_at, updated_at
  ) VALUES (
    gen_random_uuid(),
    v_user_id,
    v_user_id::text,
    'email',
    jsonb_build_object(
      'sub', v_user_id::text,
      'email', 'claude-playwright-consultant@jobin.test',
      'email_verified', true,
      'phone_verified', false
    ),
    NOW(), NOW(), NOW()
  );

  -- handle_new_user-triggern skapar profiles-raden automatiskt.
  PERFORM pg_sleep(0.1);

  UPDATE profiles
  SET role = 'CONSULTANT',
      first_name = 'Claude',
      last_name = 'Test'
  WHERE id = v_user_id;

  RAISE NOTICE 'Test-konsulent skapad: id=%, email=claude-playwright-consultant@jobin.test', v_user_id;
END $$;

-- Bekräfta
SELECT
  u.id, u.email, p.role, p.first_name, p.last_name
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
WHERE u.email = 'claude-playwright-consultant@jobin.test';
