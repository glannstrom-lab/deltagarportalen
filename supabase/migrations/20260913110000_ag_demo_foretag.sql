-- Demoföretag (AG6, 2026-09-13): "det minsta som går att visa i ett säljsamtal".
--
-- Demokommunen (20260912190000/20260912210000) får ett företag bredvid sig:
-- Nordfrakt Logistik (demo), organisationstyp arbetsgivare, is_demo. En
-- kontaktperson (foretag.demo@example.com) med känt lösenord som Mikael sätter
-- via seed_demo_foretag('<lösenord>') en gång. Företaget har två platser, ett
-- accepterat förslag om Anna (företaget har sagt "vill gå vidare" → pågående
-- placering) och ett accepterat förslag om Omar som väntar på företagets svar.
--
-- Guarden på employer_share_proposals kräver auth.uid() = deltagaren för
-- pending → accepted. Seeden kör som postgres utan JWT, så den sätter
-- request.jwt.claims lokalt till deltagarens id under de två UPDATE-satserna
-- (samma sak RPC:n respond_to_share_proposal skulle ha sett). Det ger också
-- notiser via share_proposal_notify — till demokonton, aldrig mejl (demospärren
-- i send-invite-email/employer_invitations_insert gäller is_demo).
--
-- reset_demo_org() städar företaget innan den seedar om (kl 01 UTC varje natt).
--
-- Kör:  npx supabase db query --linked -f supabase/migrations/20260913110000_ag_demo_foretag.sql
-- Sedan EN gång: SELECT seed_demo_foretag('<lösenord>');  (lösenordet består över reset)
-- Sedan: cd client && npm run schema:refresh && npm run grants:refresh

CREATE OR REPLACE FUNCTION public.seed_demo_foretag(p_password text DEFAULT NULL)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_org   constant uuid := '33333333-3333-4333-8333-333333333333';
  v_ali   constant uuid := '33333333-3333-4333-8333-000000000001';
  v_kons  constant uuid := '22222222-2222-4222-8222-000000000001';
  v_anna  constant uuid := '22222222-2222-4222-8222-000000000002';
  v_omar  constant uuid := '22222222-2222-4222-8222-000000000003';
  v_plats_lager uuid; v_plats_kontor uuid;
  v_pl_anna uuid; v_pl_omar uuid;
  v_esp_anna uuid; v_esp_omar uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = v_kons) THEN
    RETURN 'demokommunen saknas — kör seed_demo_org först';
  END IF;

  INSERT INTO organizations (id, name, kind, org_number, ai_enabled, is_demo)
  VALUES (v_org, 'Nordfrakt Logistik (demo)', 'arbetsgivare', '559999-0001', false, true)
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, kind = 'arbetsgivare',
    org_number = EXCLUDED.org_number, ai_enabled = false, is_demo = true;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_ali) THEN
    INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    VALUES (v_ali, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'foretag.demo@example.com',
      crypt(coalesce(p_password, gen_random_uuid()::text), gen_salt('bf')),
      now(), '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('first_name', 'Ali', 'last_name', 'Demo', 'email_verified', true),
      now(), now(), '', '', '', '', '', '', '', '');
    INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), v_ali, v_ali::text, 'email',
      jsonb_build_object('sub', v_ali::text, 'email', 'foretag.demo@example.com', 'email_verified', true),
      NULL, now(), now());
  ELSIF p_password IS NOT NULL THEN
    UPDATE auth.users SET encrypted_password = crypt(p_password, gen_salt('bf')) WHERE id = v_ali;
  END IF;
  INSERT INTO profiles (id, email, first_name, last_name, role) VALUES (v_ali, 'foretag.demo@example.com', 'Ali', 'Demo', 'USER')
  ON CONFLICT (id) DO NOTHING;
  UPDATE profiles SET email = 'foretag.demo@example.com', first_name = 'Ali', last_name = 'Demo',
    role = 'USER', roles = ARRAY['USER'], active_role = 'USER', consultant_id = NULL,
    status = 'ACTIVE', ai_enabled = false, phone = '070-000 00 00',
    terms_accepted_at = now(), privacy_accepted_at = now(), onboarding_completed = true
  WHERE id = v_ali;

  INSERT INTO organization_members (org_id, user_id, role) VALUES (v_org, v_ali, 'arbetsgivare')
  ON CONFLICT DO NOTHING;

  INSERT INTO employer_profiles (org_id, description, accepts_interns, typical_needs, website, city, industry, employee_count, updated_by)
  VALUES (v_org, 'Tredjepartslogistik med lager och distribution i Demostad. 40 anställda, två skift.', true,
    'Lagermedarbetare, truckförare och kontorsstöd. Vi tar gärna emot praktikanter som vill lära sig lagerarbete från grunden.',
    'https://example.com', 'Demostad', 'Transport och logistik', '20–49', v_ali)
  ON CONFLICT (org_id) DO UPDATE SET description = EXCLUDED.description, accepts_interns = true,
    typical_needs = EXCLUDED.typical_needs, city = EXCLUDED.city, industry = EXCLUDED.industry;

  INSERT INTO employer_places (org_id, title, placement_type, description, status, hours_per_week, schedule_days, address,
    lifting_required, standing_required, temperature_demands, noise_level, pace_level, shift_work, physical_notes,
    workplace_supervision_capacity, supervision_notes, language_requirements, drivers_license_required,
    contact_name, contact_phone, contact_email, sick_call_phone, sick_call_instructions, created_by)
  VALUES (v_org, 'Lagermedarbetare, dagtid', 'praktik', 'Plock, pack och inleverans. Vi börjar med enkla plockrundor och bygger på.',
    'oppen', 30, 'Måndag–fredag 07:00–13:00', 'Fraktvägen 4, Demostad',
    true, true, 'normal', 'mellan', 'mellan', false, 'Lyft upp till 15 kg, mest stående. Truckkort är en fördel men inget krav.',
    'hog', 'Handledaren Ali finns på plats hela dagen första två veckorna, sedan vid behov.', 'Svenska i tal för säkerhetsinstruktioner', false,
    'Ali Demo', '070-000 00 00', 'foretag.demo@example.com', '070-000 00 01', 'Ring Ali mellan 06:30 och 07:00 samma dag.', v_ali)
  RETURNING id INTO v_plats_lager;
  INSERT INTO employer_places (org_id, title, placement_type, description, status, hours_per_week, schedule_days, address,
    lifting_required, standing_required, noise_level, pace_level, workplace_supervision_capacity, supervision_notes,
    contact_name, contact_email, sick_call_phone, sick_call_instructions, created_by)
  VALUES (v_org, 'Kontorsassistent, deltid', 'arbetstraning', 'Orderregistrering, kundmejl och enklare fakturering i vårt affärssystem.',
    'tillsatt', 20, 'Tisdag–torsdag 09:00–15:30', 'Fraktvägen 4, Demostad',
    false, false, 'lag', 'lag', 'mellan', 'Handledning en timme om dagen, resten självständigt arbete med checklista.',
    'Ali Demo', 'foretag.demo@example.com', '070-000 00 01', 'Mejla eller ring Ali före 09:00.', v_ali)
  RETURNING id INTO v_plats_kontor;

  -- Anna: pågående arbetsträning som kontorsassistent, vecka 2 av 12
  INSERT INTO consultant_work_placements (consultant_id, participant_id, company_account_id, place_id, placement_type, status,
    company_name, org_number, occupation, industry, contact_name, contact_email, address, start_date, end_date, hours_per_week, schedule_days,
    can_ramp_up, ramp_up_plan, lifting_required, standing_required, noise_level, pace_level, workplace_supervision_capacity, participant_supervision_need,
    employer_instructions, internal_adaptation_notes, sick_call_phone, sick_call_instructions, employer_future_needs, employer_hiring_interest)
  VALUES (v_kons, v_anna, v_org, v_plats_kontor, 'arbetstraning', 'pagaende',
    'Nordfrakt Logistik (demo)', '559999-0001', 'Kontorsassistent', 'Transport och logistik', 'Ali Demo', 'foretag.demo@example.com', 'Fraktvägen 4, Demostad',
    current_date - 13, current_date + 70, 20, 'Tisdag–torsdag 09:00–15:30',
    true, 'Vecka 1–2: 3 timmar/dag. Vecka 3–: full tid enligt schema.', false, false, 'lag', 'lag', 'mellan', 'mellan',
    'Skriftliga instruktioner per arbetsuppgift. En uppgift i taget. Kort paus var 90:e minut.',
    'DEMO — intern anteckning som företaget aldrig ser.', '070-000 00 01', 'Mejla eller ring Ali före 09:00.',
    'Behöver en till på kontoret till våren', 'positiv')
  RETURNING id INTO v_pl_anna;
  INSERT INTO employer_share_proposals (placement_id, participant_id, consultant_id, show_contact, show_summary, show_skills, show_experience, show_education, presentation_text, expires_at, created_at)
  VALUES (v_pl_anna, v_anna, v_kons, true, true, true, true, false,
    'Anna är noggrann och van vid plocksystem och administration kring leveranser. Hon vill in på kontorssidan och har en tydlig plan.',
    now() + interval '60 days', now() - interval '16 days')
  RETURNING id INTO v_esp_anna;

  -- Omar: planerad praktik som lagermedarbetare, förslaget väntar på företaget
  INSERT INTO consultant_work_placements (consultant_id, participant_id, company_account_id, place_id, placement_type, status,
    company_name, org_number, occupation, industry, contact_name, contact_email, address, start_date, hours_per_week, schedule_days,
    lifting_required, standing_required, noise_level, pace_level, workplace_supervision_capacity, participant_supervision_need,
    employer_instructions, sick_call_phone, sick_call_instructions)
  VALUES (v_kons, v_omar, v_org, v_plats_lager, 'praktik', 'planerad',
    'Nordfrakt Logistik (demo)', '559999-0001', 'Lagermedarbetare', 'Transport och logistik', 'Ali Demo', 'foretag.demo@example.com', 'Fraktvägen 4, Demostad',
    current_date + 10, 30, 'Måndag–fredag 07:00–13:00',
    true, true, 'mellan', 'mellan', 'hog', 'hog',
    'Visa varje moment praktiskt först. Kort daglig avstämning vid dagens slut.', '070-000 00 01', 'Ring Ali mellan 06:30 och 07:00 samma dag.')
  RETURNING id INTO v_pl_omar;
  INSERT INTO employer_share_proposals (placement_id, participant_id, consultant_id, show_contact, show_skills, show_experience, presentation_text, expires_at, created_at)
  VALUES (v_pl_omar, v_omar, v_kons, false, true, true,
    'Omar är serviceinriktad och punktlig, vill lära sig lagerarbete från grunden och tar instruktioner bra.',
    now() + interval '14 days', now() - interval '4 days')
  RETURNING id INTO v_esp_omar;

  -- Deltagarnas ja (guarden kräver att auth.uid() är deltagaren)
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_anna, 'role', 'authenticated')::text, true);
  UPDATE employer_share_proposals SET status = 'accepted', decided_at = now() - interval '15 days' WHERE id = v_esp_anna;
  INSERT INTO consent_history (user_id, consent_type, action, reference_id) VALUES (v_anna, 'employer_share', 'granted', v_esp_anna);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_omar, 'role', 'authenticated')::text, true);
  UPDATE employer_share_proposals SET status = 'accepted', decided_at = now() - interval '3 days' WHERE id = v_esp_omar;
  INSERT INTO consent_history (user_id, consent_type, action, reference_id) VALUES (v_omar, 'employer_share', 'granted', v_esp_omar);
  -- Företagets svar om Anna (guarden kräver medlem i företaget)
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_ali, 'role', 'authenticated')::text, true);
  UPDATE employer_share_proposals SET employer_response = 'interested', employer_message = 'Vi tar gärna emot Anna. Hör av dig om startdatum.' WHERE id = v_esp_anna;
  PERFORM set_config('request.jwt.claims', '', true);

  INSERT INTO employer_messages (proposal_id, sender_id, sender_kind, content, is_read, created_at) VALUES
    (v_esp_anna, v_kons, 'konsulent', 'Hej Ali! Anna börjar tisdag. Jag följer med första dagen och vi går igenom checklistan tillsammans.', true, now() - interval '14 days'),
    (v_esp_anna, v_ali, 'foretag', 'Toppen, vi ses tisdag 09:00. Kaffe finns.', true, now() - interval '14 days' + interval '2 hours'),
    (v_esp_anna, v_kons, 'konsulent', 'Avstämning efter vecka 12 finns i ert konto under Pågående när det är dags — det tar fem minuter.', false, now() - interval '2 days');

  RETURN 'demoföretag seedat';
END;
$$;

-- Reset: samma som 20260912210000 + företagets rader före omseedning.
CREATE OR REPLACE FUNCTION public.reset_demo_org()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_org  constant uuid := '22222222-2222-4222-8222-222222222222';
  v_forg constant uuid := '33333333-3333-4333-8333-333333333333';
  v_ali  constant uuid := '33333333-3333-4333-8333-000000000001';
  v_kons constant uuid := '22222222-2222-4222-8222-000000000001';
  v_fasta constant uuid[] := ARRAY['22222222-2222-4222-8222-000000000001','22222222-2222-4222-8222-000000000002',
    '22222222-2222-4222-8222-000000000003','22222222-2222-4222-8222-000000000004',
    '22222222-2222-4222-8222-000000000005','22222222-2222-4222-8222-000000000006',
    '33333333-3333-4333-8333-000000000001']::uuid[];
  v_delt uuid[] := v_fasta[2:6];
  v_extra uuid[];
  v_svar text;
BEGIN
  SELECT coalesce(array_agg(DISTINCT id), '{}') INTO v_extra FROM (
    SELECT p.id FROM profiles p WHERE p.consultant_id = v_kons AND NOT (p.id = ANY (v_fasta))
    UNION SELECT m.user_id FROM organization_members m WHERE m.org_id IN (v_org, v_forg) AND NOT (m.user_id = ANY (v_fasta))
    UNION SELECT cp.participant_id FROM consultant_participants cp WHERE cp.consultant_id = v_kons AND NOT (cp.participant_id = ANY (v_fasta))
  ) x;
  IF array_length(v_extra, 1) > 0 THEN
    UPDATE audit_logs SET user_id = NULL WHERE user_id = ANY (v_extra);
    DELETE FROM auth.users WHERE id = ANY (v_extra);
  END IF;

  -- Företaget (förslag, trådar och avstämningar går via cascade från placeringarna)
  DELETE FROM employer_checkins WHERE org_id = v_forg;
  DELETE FROM employer_places WHERE org_id = v_forg;
  DELETE FROM employer_profiles WHERE org_id = v_forg;
  DELETE FROM invitations WHERE invited_by = v_ali OR (metadata->>'employer_org_id') = v_forg::text;
  DELETE FROM consent_history WHERE consent_type = 'employer_share' AND user_id = ANY (v_delt);

  DELETE FROM activity_sessions WHERE participant_id = ANY (v_delt) OR plan_id IN (SELECT id FROM activity_plans WHERE consultant_id = v_kons OR org_id = v_org);
  DELETE FROM activity_plans WHERE consultant_id = v_kons OR org_id = v_org OR participant_id = ANY (v_delt);
  DELETE FROM activity_template_items WHERE template_id IN (SELECT id FROM activity_templates WHERE owner_id = v_kons OR org_id = v_org);
  DELETE FROM activity_templates WHERE owner_id = v_kons OR org_id = v_org;
  DELETE FROM consultant_journal WHERE consultant_id = v_kons OR participant_id = ANY (v_delt);
  DELETE FROM consultant_notes WHERE consultant_id = v_kons OR participant_id = ANY (v_delt);
  DELETE FROM consultant_goals WHERE consultant_id = v_kons OR participant_id = ANY (v_delt);
  DELETE FROM consultant_meetings WHERE consultant_id = v_kons OR participant_id = ANY (v_delt);
  DELETE FROM consultant_messages WHERE sender_id = ANY (v_fasta) OR receiver_id = ANY (v_fasta);
  DELETE FROM consultant_work_placements WHERE consultant_id = v_kons OR participant_id = ANY (v_delt) OR company_account_id = v_forg;
  DELETE FROM consultant_placements WHERE consultant_id = v_kons OR participant_id = ANY (v_delt);
  DELETE FROM invitations WHERE invited_by = v_kons OR consultant_id = v_kons;
  DELETE FROM notifications WHERE user_id = ANY (v_fasta);
  DELETE FROM saved_jobs WHERE user_id = ANY (v_delt);
  DELETE FROM cvs WHERE user_id = ANY (v_delt);
  DELETE FROM diary_entries WHERE user_id = ANY (v_delt);
  DELETE FROM mood_logs WHERE user_id = ANY (v_delt);
  DELETE FROM cover_letters WHERE user_id = ANY (v_delt);
  DELETE FROM consultant_consents WHERE consultant_id = v_kons OR participant_id = ANY (v_delt);
  DELETE FROM consultant_participants WHERE consultant_id = v_kons OR participant_id = ANY (v_delt);
  DELETE FROM organization_members WHERE org_id IN (v_org, v_forg);
  UPDATE organizations SET ai_enabled = false, is_demo = true WHERE id IN (v_org, v_forg);

  v_svar := seed_demo_org(NULL, NULL);
  PERFORM seed_demo_foretag(NULL);
  RETURN v_svar || ' + demoföretag';
END;
$$;

REVOKE ALL ON FUNCTION public.seed_demo_foretag(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.reset_demo_org() FROM PUBLIC, anon, authenticated;

-- Verifiering efter körning + seed:
-- select count(*) from employer_places where org_id='33333333-3333-4333-8333-333333333333'; → 2
-- select status, employer_response from employer_share_proposals where company_account_id='33333333-3333-4333-8333-333333333333'; → accepted/interested, accepted/pending
-- select has_function_privilege('authenticated','public.seed_demo_foretag(text)','EXECUTE'); → false
