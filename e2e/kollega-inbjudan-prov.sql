-- Kolleginbjudan — torrkörning mot prod i en transaktion som ALLTID rullas tillbaka.
-- Kör: npx supabase db query --linked -f e2e/kollega-inbjudan-prov.sql
-- Mellan BEGIN; och provblocket står en ORDAGRANN kopia av allt mellan BEGIN; och
-- COMMIT; i supabase/migrations/20260927_kollega_inbjudan.sql. Kontroll:
--   diff <(sed -n '/^BEGIN;$/,/^COMMIT;$/p' supabase/migrations/20260927_kollega_inbjudan.sql | sed '1d;$d') \
--        <(sed -n '/^BEGIN;$/,/^-- === PROV ===$/p' e2e/kollega-inbjudan-prov.sql | sed '1d;$d')
-- Utfallet kommer som felmeddelandet "PROV-RESULTAT: …" — avsiktligt: RAISE
-- EXCEPTION garanterar rollback, även av migrationen. ROLLBACK sist är andra bältet.
-- Bara @example.com-adresser. Inga mejl skickas (edge-funktionen anropas inte).
BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Guarden på invitations
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.invitations_kollega_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller uuid := auth.uid();
  v_super boolean := false;
  v_org uuid;
  v_roll text;
  v_email text;
  v_org_namn text;
  v_org_kind text;
  v_org_demo boolean;
  v_caller_roll text;
BEGIN
  -- Bara rader som bär kollega-markeringen. Allt annat (deltagare, AG6) orört.
  -- coalesce är nödvändig: en deltagarinbjudan saknar kind, `NULL = 'kollega'`
  -- är NULL, och NOT (false OR NULL) är NULL — då föll IF:en igenom och VARJE
  -- deltagarinbjudan nekades med "Ogiltig inbjudan" (fångat av prov 3 i
  -- torrkörningen 2026-09-27).
  IF NOT (coalesce(NEW.metadata, '{}'::jsonb) ? 'kollega_org_id'
          OR coalesce(NEW.metadata->>'kind' = 'kollega', false)) THEN
    RETURN NEW;
  END IF;

  IF caller IS NULL THEN
    RAISE EXCEPTION 'Inte inloggad' USING ERRCODE = '42501';
  END IF;

  IF NEW.metadata->>'kind' IS DISTINCT FROM 'kollega' THEN
    RAISE EXCEPTION 'Ogiltig inbjudan' USING ERRCODE = '22023';
  END IF;

  BEGIN
    v_org := (NEW.metadata->>'kollega_org_id')::uuid;
  EXCEPTION WHEN invalid_text_representation THEN
    v_org := NULL;
  END;
  IF v_org IS NULL THEN
    RAISE EXCEPTION 'Organisation saknas' USING ERRCODE = '22023';
  END IF;

  SELECT o.name, o.kind, coalesce(o.is_demo, false)
    INTO v_org_namn, v_org_kind, v_org_demo
  FROM organizations o WHERE o.id = v_org;
  IF v_org_namn IS NULL THEN
    RAISE EXCEPTION 'Organisationen finns inte' USING ERRCODE = 'P0002';
  END IF;
  IF v_org_kind = 'arbetsgivare' THEN
    RAISE EXCEPTION 'Företagskonton bjuder in kollegor under Om oss' USING ERRCODE = '22023';
  END IF;

  -- Demokonton skickar aldrig mejl (KM12 (8)) — samma regel som
  -- employer_invitations_insert och send-invite-email.
  IF v_org_demo OR EXISTS (
    SELECT 1 FROM organization_members m JOIN organizations o ON o.id = m.org_id
    WHERE m.user_id = caller AND o.is_demo
  ) THEN
    RAISE EXCEPTION 'Demokontot kan inte bjuda in. Personerna i demot är påhittade.' USING ERRCODE = '42501';
  END IF;

  SELECT p.role IN ('ADMIN', 'SUPERADMIN') INTO v_super FROM profiles p WHERE p.id = caller;
  v_super := coalesce(v_super, false);

  SELECT m.role INTO v_caller_roll
  FROM organization_members m WHERE m.org_id = v_org AND m.user_id = caller;

  IF NOT v_super AND (v_caller_roll IS NULL OR v_caller_roll NOT IN ('chef', 'admin')) THEN
    RAISE EXCEPTION 'Bara chef eller administratör i organisationen får bjuda in kollegor' USING ERRCODE = '42501';
  END IF;

  v_roll := NEW.metadata->>'org_role';
  IF v_roll IS NULL OR v_roll NOT IN ('handlaggare', 'konsulent', 'chef', 'admin') THEN
    RAISE EXCEPTION 'Okänd roll' USING ERRCODE = '22023';
  END IF;
  IF v_roll = 'admin' AND NOT v_super AND v_caller_roll IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'Bara en administratör kan ge rollen administratör' USING ERRCODE = '42501';
  END IF;

  v_email := lower(trim(coalesce(NEW.email, '')));
  IF position('@' in v_email) = 0 THEN
    RAISE EXCEPTION 'Ange en giltig e-postadress' USING ERRCODE = '22023';
  END IF;

  IF EXISTS (SELECT 1 FROM profiles p WHERE lower(p.email) = v_email) THEN
    RAISE EXCEPTION 'Det finns redan ett konto med e-posten %. Lägg till personen direkt i stället.', v_email USING ERRCODE = '23505';
  END IF;

  IF EXISTS (
    SELECT 1 FROM invitations i
    WHERE lower(i.email) = v_email
      AND i.metadata->>'kind' = 'kollega'
      AND i.metadata->>'kollega_org_id' = v_org::text
      AND i.used_at IS NULL
      AND i.expires_at > now()
      -- Bara en SKICKAD inbjudan spärrar. Föll mejlet ska chefen kunna försöka
      -- igen — det finns ingen DELETE-policy, så annars satt hen fast i 14 dagar.
      AND i.email_sent IS TRUE
  ) THEN
    RAISE EXCEPTION 'Det finns redan en obesvarad inbjudan till % i organisationen.', v_email USING ERRCODE = '23505';
  END IF;

  -- Servern bestämmer resten av raden.
  NEW.email := v_email;
  NEW.role := 'CONSULTANT';
  NEW.invited_by := caller;
  NEW.consultant_id := NULL;
  NEW.token := encode(extensions.gen_random_bytes(32), 'hex');
  NEW.expires_at := now() + interval '14 days';
  NEW.used_at := NULL;
  NEW.used_by := NULL;
  NEW.email_sent := false;
  NEW.email_sent_at := NULL;
  NEW.email_error := NULL;
  NEW.metadata := jsonb_build_object(
    'kind', 'kollega',
    'kollega_org_id', v_org,
    'org_role', v_roll,
    'org_name', v_org_namn,
    'invited_by_name', (SELECT nullif(trim(coalesce(p.first_name, '') || ' ' || coalesce(p.last_name, '')), '') FROM profiles p WHERE p.id = caller)
  );
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.invitations_kollega_guard() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_invitations_kollega_guard ON public.invitations;
CREATE TRIGGER trg_invitations_kollega_guard
  BEFORE INSERT ON public.invitations
  FOR EACH ROW EXECUTE FUNCTION public.invitations_kollega_guard();

-- ---------------------------------------------------------------------------
-- 2. INSERT-policyn: en ny gren, de tre gamla ordagrant
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authorized users can create invitations" ON public.invitations;
CREATE POLICY "Authorized users can create invitations" ON public.invitations
  FOR INSERT
  WITH CHECK (
    ((SELECT auth.uid() AS uid) = invited_by)
    AND (EXISTS (SELECT 1 FROM profiles
                 WHERE profiles.id = (SELECT auth.uid() AS uid)
                   AND profiles.role = ANY (ARRAY['CONSULTANT'::text, 'ADMIN'::text, 'SUPERADMIN'::text])))
    AND (
      (role = 'USER'::text)
      OR ((role = 'CONSULTANT'::text) AND (EXISTS (SELECT 1 FROM profiles
                 WHERE profiles.id = (SELECT auth.uid() AS uid)
                   AND profiles.role = ANY (ARRAY['ADMIN'::text, 'SUPERADMIN'::text]))))
      OR ((role = 'ADMIN'::text) AND (EXISTS (SELECT 1 FROM profiles
                 WHERE profiles.id = (SELECT auth.uid() AS uid)
                   AND profiles.role = 'SUPERADMIN'::text)))
      -- NY: kolleginbjudan. Guarden ovan har redan prövat allt och skrivit om raden.
      OR ((role = 'CONSULTANT'::text)
          AND (metadata->>'kind') = 'kollega'
          AND (EXISTS (SELECT 1 FROM organization_members m
                       WHERE m.org_id::text = (metadata->>'kollega_org_id')
                         AND m.user_id = (SELECT auth.uid() AS uid)
                         AND m.role = ANY (ARRAY['chef'::text, 'admin'::text]))))
    )
  );

-- ---------------------------------------------------------------------------
-- 3. Medlemskapet när kontot skapas
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.kollega_inbjudan_medlemskap()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inv RECORD;
  v_org uuid;
  v_roll text;
  v_inbjudare_roll text;
  v_inbjudare_super boolean;
BEGIN
  BEGIN
    -- Bara den inbjudan handle_invitation_acceptance markerat åt just detta konto.
    SELECT i.* INTO inv
    FROM invitations i
    WHERE i.used_by = NEW.id
      AND i.metadata->>'kind' = 'kollega'
    ORDER BY i.used_at DESC NULLS LAST, i.created_at DESC
    LIMIT 1;

    IF inv.id IS NULL THEN
      RETURN NEW;
    END IF;

    IF NEW.role IS DISTINCT FROM 'CONSULTANT' OR inv.role IS DISTINCT FROM 'CONSULTANT' THEN
      RAISE WARNING 'kollega_inbjudan_medlemskap: profilen % blev inte CONSULTANT — inget medlemskap', NEW.id;
      RETURN NEW;
    END IF;

    v_org := (inv.metadata->>'kollega_org_id')::uuid;
    v_roll := inv.metadata->>'org_role';
    IF v_roll IS NULL OR v_roll NOT IN ('handlaggare', 'konsulent', 'chef', 'admin') THEN
      RAISE WARNING 'kollega_inbjudan_medlemskap: okänd roll % på inbjudan %', v_roll, inv.id;
      RETURN NEW;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM organizations o
      WHERE o.id = v_org AND o.kind <> 'arbetsgivare' AND NOT coalesce(o.is_demo, false)
    ) THEN
      RAISE WARNING 'kollega_inbjudan_medlemskap: organisationen % finns inte eller tar inte emot kolleginbjudan', v_org;
      RETURN NEW;
    END IF;

    -- Pröva om inbjudaren NU: en chef som tagits bort efter inbjudan ger ingen medlem.
    SELECT m.role INTO v_inbjudare_roll
    FROM organization_members m WHERE m.org_id = v_org AND m.user_id = inv.invited_by;
    SELECT coalesce(p.role IN ('ADMIN', 'SUPERADMIN'), false) INTO v_inbjudare_super
    FROM profiles p WHERE p.id = inv.invited_by;
    v_inbjudare_super := coalesce(v_inbjudare_super, false);

    IF NOT v_inbjudare_super AND (v_inbjudare_roll IS NULL OR v_inbjudare_roll NOT IN ('chef', 'admin')) THEN
      RAISE WARNING 'kollega_inbjudan_medlemskap: inbjudaren på % är inte längre chef/admin i organisationen', inv.id;
      RETURN NEW;
    END IF;
    IF v_roll = 'admin' AND NOT v_inbjudare_super AND v_inbjudare_roll IS DISTINCT FROM 'admin' THEN
      RAISE WARNING 'kollega_inbjudan_medlemskap: rollen admin på % gavs inte av en administratör', inv.id;
      RETURN NEW;
    END IF;

    INSERT INTO organization_members (org_id, user_id, role)
    VALUES (v_org, NEW.id, v_roll)
    ON CONFLICT (org_id, user_id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    -- Aldrig låta registreringen falla hit (BP4): profilen med namn och samtycken
    -- är viktigare än medlemsraden, som chefen kan lägga till för hand.
    RAISE WARNING 'kollega_inbjudan_medlemskap misslyckades för %: %', NEW.id, SQLERRM;
  END;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.kollega_inbjudan_medlemskap() FROM PUBLIC, anon, authenticated;

-- Namnet ska sortera EFTER on_profile_created_handle_invitation (se ovan).
DROP TRIGGER IF EXISTS trg_kollega_inbjudan_medlemskap ON public.profiles;
CREATE TRIGGER trg_kollega_inbjudan_medlemskap
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.kollega_inbjudan_medlemskap();

-- === PROV ===
DO $$
DECLARE
  testkommun uuid := '11111111-1111-4111-8111-111111111111';
  chef  uuid := (SELECT id FROM auth.users WHERE email = 'km-konsulent@jobin.test');
  kons  uuid := (SELECT id FROM auth.users WHERE email = 'claude-playwright-consultant@jobin.test');
  demo  uuid := (SELECT id FROM organizations WHERE is_demo AND kind = 'kommun' LIMIT 1);
  annan uuid;
  suffix text := substr(md5(random()::text), 1, 8);
  e_kollega text := 'kollega.prov.' || suffix || '@example.com';
  e_delt    text := 'deltagare.prov.' || suffix || '@example.com';
  e_ftg     text := 'foretag.prov.' || suffix || '@example.com';
  inv_id uuid; nytt_id uuid; inv_token text; ny uuid; n int; r text := ''; rad record; t text;
BEGIN
  -- En annan riktig (icke-demo) kommun där chefen INTE är medlem, för prov 4.
  INSERT INTO organizations (name, kind) VALUES ('Provkommun ' || suffix, 'kommun') RETURNING id INTO annan;
  -- En vanlig konsulent (ej chef) i Testkommun, för prov 4.
  INSERT INTO organization_members (org_id, user_id, role) VALUES (testkommun, kons, 'konsulent');

  -- ====================================================================
  -- (1) Chefen i Testkommun skapar en kolleginbjudan — som authenticated
  -- ====================================================================
  EXECUTE 'SET LOCAL ROLE authenticated';
  PERFORM set_config('request.jwt.claims', json_build_object('sub', chef, 'role', 'authenticated')::text, true);

  -- Klienten skickar bara e-post, organisation och roll. Försöker också smuggla
  -- in consultant_id, fel roll, egen token och ett extra metadatafält.
  INSERT INTO invitations (email, role, invited_by, consultant_id, token, metadata)
  VALUES ('  ' || upper(e_kollega) || ' ', 'USER', chef, chef, 'min-egen-token',
          jsonb_build_object('kind', 'kollega', 'kollega_org_id', testkommun, 'org_role', 'konsulent', 'smuggel', 'x'))
  RETURNING id, token INTO inv_id, inv_token;

  SELECT * INTO rad FROM invitations WHERE id = inv_id;   -- läses som chefen (RLS)
  r := r || E'\n(1) chef skapar: rad synlig för chefen=' || (rad.id IS NOT NULL)
         || ' email=' || rad.email || ' role=' || rad.role
         || ' consultant_id=' || coalesce(rad.consultant_id::text, 'NULL')
         || ' egen_token_ignorerad=' || (rad.token <> 'min-egen-token')
         || ' email_sent=' || rad.email_sent
         || ' org_role=' || (rad.metadata->>'org_role')
         || ' org_name=' || (rad.metadata->>'org_name')
         || ' smuggel_borta=' || (NOT (rad.metadata ? 'smuggel'))
         || ' giltig_dagar=' || round(extract(epoch FROM rad.expires_at - now()) / 86400);

  -- Chefen försöker ge admin (bara admin får) → nekas
  BEGIN
    INSERT INTO invitations (email, role, invited_by, metadata)
    VALUES ('admin.prov.' || suffix || '@example.com', 'USER', chef,
            jsonb_build_object('kind', 'kollega', 'kollega_org_id', testkommun, 'org_role', 'admin'));
    r := r || E'\n(1b) chef ger admin: GICK IGENOM (FEL)';
  EXCEPTION WHEN OTHERS THEN r := r || E'\n(1b) chef ger admin: ' || SQLSTATE || ' ' || SQLERRM; END;

  -- Adress som redan har konto → hänvisas till "lägg till direkt"
  BEGIN
    INSERT INTO invitations (email, role, invited_by, metadata)
    VALUES ('km-deltagare@jobin.test', 'USER', chef,
            jsonb_build_object('kind', 'kollega', 'kollega_org_id', testkommun, 'org_role', 'konsulent'));
    r := r || E'\n(1c) befintligt konto: GICK IGENOM (FEL)';
  EXCEPTION WHEN OTHERS THEN r := r || E'\n(1c) befintligt konto: ' || SQLSTATE || ' ' || SQLERRM; END;

  -- Dubblett: en OSKICKAD inbjudan spärrar inte (mejlet kan ha fallit) ...
  INSERT INTO invitations (email, role, invited_by, metadata)
  VALUES (e_kollega, 'USER', chef,
          jsonb_build_object('kind', 'kollega', 'kollega_org_id', testkommun, 'org_role', 'konsulent'))
  RETURNING id INTO nytt_id;
  r := r || E'\n(1d) ny inbjudan när den förra är oskickad: OK';
  -- ... men en SKICKAD gör det. Markera båda som skickade (edge-funktionen gör det med service role).
  EXECUTE 'RESET ROLE';
  UPDATE invitations SET email_sent = true WHERE id IN (inv_id, nytt_id);
  EXECUTE 'SET LOCAL ROLE authenticated';
  PERFORM set_config('request.jwt.claims', json_build_object('sub', chef, 'role', 'authenticated')::text, true);
  BEGIN
    INSERT INTO invitations (email, role, invited_by, metadata)
    VALUES (e_kollega, 'USER', chef,
            jsonb_build_object('kind', 'kollega', 'kollega_org_id', testkommun, 'org_role', 'chef'));
    r := r || E'\n(1e) dubblett av skickad: GICK IGENOM (FEL)';
  EXCEPTION WHEN OTHERS THEN r := r || E'\n(1e) dubblett av skickad: ' || SQLSTATE || ' ' || SQLERRM; END;

  -- ====================================================================
  -- (3a) Vanlig deltagarinbjudan från samma konsulent (skapas som förut)
  -- ====================================================================
  INSERT INTO invitations (email, role, invited_by, consultant_id, metadata)
  VALUES (e_delt, 'USER', chef, chef, jsonb_build_object('first_name', 'Dana'));
  r := r || E'\n(3a) deltagarinbjudan skapad som förut: OK';

  -- ====================================================================
  -- (4) Nekas: vanlig konsulent, annan organisation, smuggelvägar
  -- ====================================================================
  PERFORM set_config('request.jwt.claims', json_build_object('sub', kons, 'role', 'authenticated')::text, true);
  BEGIN
    INSERT INTO invitations (email, role, invited_by, metadata)
    VALUES ('neka1.' || suffix || '@example.com', 'USER', kons,
            jsonb_build_object('kind', 'kollega', 'kollega_org_id', testkommun, 'org_role', 'konsulent'));
    r := r || E'\n(4a) konsulent (ej chef) bjuder in: GICK IGENOM (FEL)';
  EXCEPTION WHEN OTHERS THEN r := r || E'\n(4a) konsulent (ej chef) bjuder in: ' || SQLSTATE || ' ' || SQLERRM; END;

  BEGIN  -- nyckeln under ett annat kind
    INSERT INTO invitations (email, role, invited_by, metadata)
    VALUES ('neka2.' || suffix || '@example.com', 'USER', kons,
            jsonb_build_object('kind', 'deltagare', 'kollega_org_id', testkommun, 'org_role', 'chef'));
    r := r || E'\n(4b) smuggla kollega_org_id: GICK IGENOM (FEL)';
  EXCEPTION WHEN OTHERS THEN r := r || E'\n(4b) smuggla kollega_org_id: ' || SQLSTATE || ' ' || SQLERRM; END;

  BEGIN  -- CONSULTANT-roll utan kollega-markering (gamla grenen: bara ADMIN)
    INSERT INTO invitations (email, role, invited_by, metadata)
    VALUES ('neka3.' || suffix || '@example.com', 'CONSULTANT', kons, '{}'::jsonb);
    r := r || E'\n(4c) konsulent ger CONSULTANT direkt: GICK IGENOM (FEL)';
  EXCEPTION WHEN OTHERS THEN r := r || E'\n(4c) konsulent ger CONSULTANT direkt: ' || SQLSTATE || ' ' || SQLERRM; END;

  UPDATE invitations SET metadata = metadata || '{"org_role":"admin"}'::jsonb WHERE id = inv_id;
  GET DIAGNOSTICS n = ROW_COUNT;
  r := r || E'\n(4d) konsulent UPDATE på chefens inbjudan: rader=' || n;

  PERFORM set_config('request.jwt.claims', json_build_object('sub', chef, 'role', 'authenticated')::text, true);
  BEGIN
    INSERT INTO invitations (email, role, invited_by, metadata)
    VALUES ('neka4.' || suffix || '@example.com', 'USER', chef,
            jsonb_build_object('kind', 'kollega', 'kollega_org_id', annan, 'org_role', 'konsulent'));
    r := r || E'\n(4e) chef bjuder in till ANNAN kommun: GICK IGENOM (FEL)';
  EXCEPTION WHEN OTHERS THEN r := r || E'\n(4e) chef bjuder in till ANNAN kommun: ' || SQLSTATE || ' ' || SQLERRM; END;

  UPDATE invitations SET metadata = metadata || '{"org_role":"admin"}'::jsonb WHERE id = inv_id;
  GET DIAGNOSTICS n = ROW_COUNT;
  r := r || E'\n(4f) chef UPDATE på egen inbjudan (höja rollen i efterhand): rader=' || n;

  -- ====================================================================
  -- (5a) Företagsinbjudan (AG6) som förut, via vyn employer_invitations
  -- ====================================================================
  INSERT INTO employer_invitations (org_number, company_name, email, contact_name)
  VALUES ('559999-' || lpad((floor(random() * 9999))::int::text, 4, '0'), 'Provbolaget ' || suffix, e_ftg, 'Frida Företag');
  r := r || E'\n(5a) företagsinbjudan skapad som förut: OK';

  EXECUTE 'RESET ROLE';

  -- ====================================================================
  -- (2) Simulerad registrering med kolleginbjudans token
  -- ====================================================================
  SELECT email INTO t FROM get_invitation_by_token(inv_token);   -- som InviteHandler
  r := r || E'\n(2) get_invitation_by_token(token) → ' || coalesce(t, 'INGEN');
  ny := gen_random_uuid();
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  VALUES (ny, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', t, '',
          '{"provider":"email","providers":["email"]}'::jsonb,
          jsonb_build_object('first_name', 'Kim', 'last_name', 'Kollega', 'terms_accepted', true, 'privacy_accepted', true, 'ai_consent', false),
          now(), now());
  SELECT * INTO rad FROM profiles WHERE id = ny;
  r := r || E'\n(2) profil: role=' || rad.role || ' roles=' || rad.roles::text || ' active_role=' || rad.active_role
         || ' namn=' || coalesce(rad.first_name, 'NULL') || ' ' || coalesce(rad.last_name, 'NULL')
         || ' villkor=' || (rad.terms_accepted_at IS NOT NULL) || ' integritet=' || (rad.privacy_accepted_at IS NOT NULL)
         || ' ai=' || (rad.ai_consent_at IS NOT NULL)
         || ' consultant_id=' || coalesce(rad.consultant_id::text, 'NULL');
  SELECT string_agg(o.name || ':' || m.role, ', ') INTO t FROM organization_members m JOIN organizations o ON o.id = m.org_id WHERE m.user_id = ny;
  r := r || E'\n(2) medlemskap: ' || coalesce(t, 'INGET');
  SELECT count(*) INTO n FROM consultant_participants WHERE participant_id = ny;
  r := r || ' | deltagarkoppling=' || n;
  SELECT count(*) INTO n FROM consent_history WHERE user_id = ny;
  r := r || ' | consent_history-rader=' || n;
  r := r || ' | inbjudan markerad använd=' || (SELECT used_by = ny AND used_at IS NOT NULL FROM invitations WHERE id = inv_id);

  -- ====================================================================
  -- (3b) Registrering via deltagarinbjudan — som förut
  -- ====================================================================
  ny := gen_random_uuid();
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  VALUES (ny, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', e_delt, '',
          '{"provider":"email","providers":["email"]}'::jsonb,
          jsonb_build_object('first_name', 'Dana', 'last_name', 'Deltagare', 'terms_accepted', true, 'privacy_accepted', true),
          now(), now());
  SELECT * INTO rad FROM profiles WHERE id = ny;
  r := r || E'\n(3b) deltagare: role=' || rad.role || ' active_role=' || rad.active_role
         || ' namn=' || coalesce(rad.first_name, 'NULL') || ' villkor=' || (rad.terms_accepted_at IS NOT NULL)
         || ' consultant_id=chef:' || (rad.consultant_id = chef);
  SELECT count(*) INTO n FROM consultant_participants WHERE participant_id = ny AND consultant_id = chef;
  r := r || ' deltagarkoppling=' || n;
  SELECT count(*) INTO n FROM organization_members WHERE user_id = ny;
  r := r || ' medlemskap=' || n;

  -- ====================================================================
  -- (5b) Registrering via företagsinbjudan — som förut
  -- ====================================================================
  ny := gen_random_uuid();
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  VALUES (ny, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', e_ftg, '',
          '{"provider":"email","providers":["email"]}'::jsonb,
          jsonb_build_object('first_name', 'Frida', 'last_name', '', 'terms_accepted', true, 'privacy_accepted', true),
          now(), now());
  SELECT * INTO rad FROM profiles WHERE id = ny;
  SELECT string_agg(o.kind || ':' || m.role, ', ') INTO t FROM organization_members m JOIN organizations o ON o.id = m.org_id WHERE m.user_id = ny;
  r := r || E'\n(5b) företag: role=' || rad.role || ' villkor=' || (rad.terms_accepted_at IS NOT NULL)
         || ' medlemskap=' || coalesce(t, 'INGET');

  -- ====================================================================
  -- (6) Demo: chef som också är medlem i en demoorganisation nekas
  -- ====================================================================
  IF demo IS NOT NULL THEN
    INSERT INTO organization_members (org_id, user_id, role) VALUES (demo, chef, 'konsulent');
    EXECUTE 'SET LOCAL ROLE authenticated';
    PERFORM set_config('request.jwt.claims', json_build_object('sub', chef, 'role', 'authenticated')::text, true);
    BEGIN
      INSERT INTO invitations (email, role, invited_by, metadata)
      VALUES ('demo.' || suffix || '@example.com', 'USER', chef,
              jsonb_build_object('kind', 'kollega', 'kollega_org_id', testkommun, 'org_role', 'konsulent'));
      r := r || E'\n(6) demomedlem bjuder in: GICK IGENOM (FEL)';
    EXCEPTION WHEN OTHERS THEN r := r || E'\n(6) demomedlem bjuder in: ' || SQLSTATE || ' ' || SQLERRM; END;
    EXECUTE 'RESET ROLE';
  END IF;

  RAISE EXCEPTION 'PROV-RESULTAT: %', r;
END $$;
ROLLBACK;
