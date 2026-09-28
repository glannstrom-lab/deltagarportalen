-- KH11/CH1 (rollspelet 2026-09-28): demon visar handläggarkedjan och "hela enheten".
-- seed_demo_org återskapad ur prod (pg_get_functiondef 2026-09-28) med ett tillägg före RETURN:
-- en plan för Kims deltagare Sara och två underlag till Hanna Handläggare (ett okvitterat,
-- ett kvitterat). reset_demo_org (cron 01:00 UTC) anropar funktionen varje natt.

CREATE OR REPLACE FUNCTION public.seed_demo_org(p_password text DEFAULT NULL::text, p_password_deltagare text DEFAULT NULL::text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth', 'extensions'
AS $function$
DECLARE
  v_org  constant uuid := '22222222-2222-4222-8222-222222222222';
  v_kons constant uuid := '22222222-2222-4222-8222-000000000001';
  v_p1   constant uuid := '22222222-2222-4222-8222-000000000002';
  v_p2   constant uuid := '22222222-2222-4222-8222-000000000003';
  v_p3   constant uuid := '22222222-2222-4222-8222-000000000004';
  v_p4   constant uuid := '22222222-2222-4222-8222-000000000005';
  v_p5   constant uuid := '22222222-2222-4222-8222-000000000006';
  -- RK41 (2026-09-27): en andra konsulent, en handläggare och kollegans två deltagare.
  v_koll  constant uuid := '55555555-5555-4555-8555-000000000001';
  v_handl constant uuid := '55555555-5555-4555-8555-000000000002';
  v_k1    constant uuid := '55555555-5555-4555-8555-000000000003';
  v_k2    constant uuid := '55555555-5555-4555-8555-000000000004';
  v_plan_sara uuid;
  v_h_sara uuid;
  v_h_anna uuid;
  v_plan_fatima uuid;
  v_plan_erik uuid;
  v_plan_lisa uuid;
  v_mall uuid;
  v_plan uuid;
  v_monday date := date_trunc('week', current_date)::date;
  v_pw text;
  r record;
  d date;
BEGIN
  -- Organisation
  INSERT INTO organizations (id, name, kind, org_number, ai_enabled, is_demo)
  VALUES (v_org, 'Demokommun (påhittade personer)', 'kommun', '212000-9999', false, true)
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, kind = EXCLUDED.kind,
    org_number = EXCLUDED.org_number, ai_enabled = false, is_demo = true;
  -- Konton i auth.users (triggern handle_new_user skapar profiles-raden).
  -- roll: 'konsulent' = demokonsulenten, 'deltagare_login' = Anna (känt lösenord),
  -- 'deltagare' = de fyra övriga (slumpat lösenord, kan aldrig logga in).
  FOR r IN SELECT * FROM (VALUES
      (v_kons, 'demo@jobin.se',                'Demo',   'Konsulent', 'konsulent'),
      (v_p1,   'anna.exempel@example.com',     'Anna',   'Exempel',   'deltagare_login'),
      (v_p2,   'omar.demo@example.com',        'Omar',   'Demo',      'deltagare'),
      (v_p3,   'lisa.fiktiv@example.com',      'Lisa',   'Fiktiv',    'deltagare'),
      (v_p4,   'erik.testsson@example.com',    'Erik',   'Testsson',  'deltagare'),
      (v_p5,   'fatima.exempel@example.com',   'Fatima', 'Exempel',   'deltagare'),
      -- RK41: nya konton får slumpat lösenord (v_pw NULL) och kan aldrig logga in
      -- med ett känt lösenord. @example.com tar inte emot post.
      (v_koll,  'kim.kollega.demo@example.com',     'Kim',    'Kollega',     'kollega'),
      (v_handl, 'hanna.handlaggare.demo@example.com', 'Hanna', 'Handläggare', 'handlaggare'),
      (v_k1,    'sara.pahitt@example.com',          'Sara',   'Påhitt',      'deltagare_kollega'),
      (v_k2,    'johan.exempelsson@example.com',    'Johan',  'Exempelsson', 'deltagare_kollega')
    ) AS t(id, email, fnamn, enamn, typ)
  LOOP
    v_pw := CASE r.typ WHEN 'konsulent' THEN p_password WHEN 'deltagare_login' THEN p_password_deltagare ELSE NULL END;
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = r.id) THEN
      INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
        confirmation_token, recovery_token, email_change_token_new, email_change,
        email_change_token_current, phone_change, phone_change_token, reauthentication_token)
      VALUES (r.id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', r.email,
        crypt(coalesce(v_pw, gen_random_uuid()::text), gen_salt('bf')),
        now(), '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('first_name', r.fnamn, 'last_name', r.enamn, 'email_verified', true),
        now(), now(), '', '', '', '', '', '', '', '');
      INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
      VALUES (gen_random_uuid(), r.id, r.id::text, 'email',
        jsonb_build_object('sub', r.id::text, 'email', r.email, 'email_verified', true),
        NULL, now(), now());
    ELSIF v_pw IS NOT NULL THEN
      UPDATE auth.users SET encrypted_password = crypt(v_pw, gen_salt('bf')) WHERE id = r.id;
    END IF;
    INSERT INTO profiles (id, email, first_name, last_name, role) VALUES (r.id, r.email, r.fnamn, r.enamn, 'USER')
    ON CONFLICT (id) DO NOTHING;
    UPDATE profiles SET
      email = r.email, first_name = r.fnamn, last_name = r.enamn,
      role = CASE WHEN r.typ IN ('konsulent', 'kollega', 'handlaggare') THEN 'CONSULTANT' ELSE 'USER' END,
      roles = CASE WHEN r.typ IN ('konsulent', 'kollega', 'handlaggare') THEN ARRAY['CONSULTANT'] ELSE ARRAY['USER'] END,
      active_role = CASE WHEN r.typ IN ('konsulent', 'kollega', 'handlaggare') THEN 'CONSULTANT' ELSE 'USER' END,
      consultant_id = CASE WHEN r.typ IN ('konsulent', 'kollega', 'handlaggare') THEN NULL
                           WHEN r.typ = 'deltagare_kollega' THEN v_koll ELSE v_kons END,
      status = 'ACTIVE', ai_enabled = false, avatar_url = NULL, phone = NULL,
      terms_accepted_at = now(), privacy_accepted_at = now(),
      onboarding_completed = true
    WHERE id = r.id;
  END LOOP;
  UPDATE profiles SET location = 'Demostad', employment_status = 'unemployed' WHERE id IN (v_p1, v_p2, v_p3);
  UPDATE profiles SET location = 'Demostad', employment_status = 'new-to-country' WHERE id = v_p4;
  UPDATE profiles SET location = 'Demostad', employment_status = 'sick-leave' WHERE id = v_p5;
  UPDATE profiles SET location = 'Demostad', employment_status = 'unemployed' WHERE id IN (v_k1, v_k2);
  INSERT INTO organization_members (org_id, user_id, role) VALUES (v_org, v_kons, 'chef')
  ON CONFLICT DO NOTHING;
  UPDATE organization_members SET role = 'chef' WHERE org_id = v_org AND user_id = v_kons;
  -- RK41: kollegan och handläggaren i samma kommun — överlämning, caseload per
  -- konsulent och handläggarens roll går att visa.
  INSERT INTO organization_members (org_id, user_id, role) VALUES
    (v_org, v_koll, 'konsulent'),
    (v_org, v_handl, 'handlaggare')
  ON CONFLICT DO NOTHING;
  UPDATE organization_members SET role = 'konsulent' WHERE org_id = v_org AND user_id = v_koll;
  UPDATE organization_members SET role = 'handlaggare' WHERE org_id = v_org AND user_id = v_handl;
  FOR r IN SELECT unnest(ARRAY[v_k1, v_k2]) AS pid LOOP
    INSERT INTO consultant_participants (consultant_id, participant_id, assigned_at, assigned_by, priority, last_contact_at)
    VALUES (v_koll, r.pid, now() - interval '20 days', v_koll, 0, now() - interval '6 days')
    ON CONFLICT DO NOTHING;
    INSERT INTO consultant_consents (participant_id, consultant_id, program, scope, granted_text, granted_at, granted_via)
    SELECT r.pid, v_koll, 'rusta_och_matcha', '{"kalla":"demo"}'::jsonb,
      'Demodata — påhittad person, inget verkligt samtycke behövs.', now() - interval '20 days', 'manual_link'
    WHERE NOT EXISTS (SELECT 1 FROM consultant_consents c WHERE c.participant_id = r.pid AND c.consultant_id = v_koll AND c.revoked_at IS NULL);
  END LOOP;
  FOR r IN SELECT unnest(ARRAY[v_p1, v_p2, v_p3, v_p4, v_p5]) AS pid LOOP
    INSERT INTO consultant_participants (consultant_id, participant_id, assigned_at, assigned_by, priority, last_contact_at)
    VALUES (v_kons, r.pid, now() - interval '40 days', v_kons, CASE WHEN r.pid = v_p5 THEN 1 ELSE 0 END, now() - interval '3 days')
    ON CONFLICT DO NOTHING;
    INSERT INTO consultant_consents (participant_id, consultant_id, program, scope, granted_text, granted_at, granted_via)
    SELECT r.pid, v_kons, 'rusta_och_matcha', '{"kalla":"demo"}'::jsonb,
      'Demodata — påhittad person, inget verkligt samtycke behövs.', now() - interval '40 days', 'manual_link'
    WHERE NOT EXISTS (SELECT 1 FROM consultant_consents c WHERE c.participant_id = r.pid AND c.consultant_id = v_kons AND c.revoked_at IS NULL);
  END LOOP;
  INSERT INTO cvs (user_id, first_name, last_name, title, email, location, summary, template, ats_score,
    work_experience, education, skills, languages, certificates, links, "references")
  VALUES
   (v_p1, 'Anna', 'Exempel', 'Lagermedarbetare', 'anna.exempel@example.com', 'Demostad',
    'Noggrann och van vid truck och plocksystem. Söker heltid inom lager och logistik.', 'sidokolumn', 72,
    '[{"id":"e1","title":"Lagermedarbetare","company":"Fiktiva Logistik AB","startDate":"2022-03","endDate":"2025-06","description":"Plock, pack och truckkörning."}]',
    '[{"id":"u1","school":"Demostads gymnasium","degree":"Fordonsprogrammet","startDate":"2016","endDate":"2019"}]',
    '[{"id":"s1","name":"Truckkort A+B","level":"expert","category":"technical"},{"id":"s2","name":"Plocksystem","level":"advanced","category":"technical"}]',
    '[{"id":"l1","name":"Svenska","level":"native"},{"id":"l2","name":"Engelska","level":"good"}]', '[]', '[]', '[]'),
   (v_p2, 'Omar', 'Demo', 'Butiksbiträde', 'omar.demo@example.com', 'Demostad',
    'Serviceinriktad med kassavana. Vill arbeta i dagligvaruhandel.', 'centrerad', 58,
    '[{"id":"e1","title":"Butiksbiträde","company":"Demobutiken","startDate":"2023-01","endDate":"2024-12","description":"Kassa, varuplock, kundservice."}]',
    '[]', '[{"id":"s1","name":"Kassavana","level":"advanced","category":"technical"},{"id":"s2","name":"Kundservice","level":"advanced","category":"soft"}]',
    '[{"id":"l1","name":"Svenska","level":"good"},{"id":"l2","name":"Arabiska","level":"native"}]', '[]', '[]', '[]'),
   (v_p3, 'Lisa', 'Fiktiv', 'Undersköterska', 'lisa.fiktiv@example.com', 'Demostad',
    'Undersköterska med erfarenhet från äldreomsorg. Söker dag- eller kvällstjänst.', 'minimal', 81,
    '[{"id":"e1","title":"Undersköterska","company":"Demostads kommun, äldreboendet Björken","startDate":"2019-08","endDate":"2025-02","description":"Omvårdnad, dokumentation, delegering."}]',
    '[{"id":"u1","school":"Vård- och omsorgsprogrammet","degree":"Undersköterska","startDate":"2016","endDate":"2019"}]',
    '[{"id":"s1","name":"Omvårdnad","level":"expert","category":"technical"},{"id":"s2","name":"Dokumentation","level":"advanced","category":"technical"}]',
    '[{"id":"l1","name":"Svenska","level":"native"}]', '[]', '[]', '[]')
  ON CONFLICT DO NOTHING;
  -- Sparade jobb / ansökningar. Anna får tre: en skickad, en intervju, en sparad —
  -- så både Översiktens "det som är igång" och Ansökningar har något att visa.
  INSERT INTO saved_jobs (user_id, job_id, job_title, company_name, location, status, source, application_date, created_at, job_data)
  VALUES
   (v_p1, 'demo-1', 'Lagermedarbetare', 'Fiktiva Logistik AB', 'Demostad', 'APPLIED', 'demo', now() - interval '9 days', now() - interval '12 days', '{"demo":true}'),
   (v_p1, 'demo-2', 'Truckförare', 'Exempel Transport', 'Demostad', 'INTERVIEW', 'demo', now() - interval '20 days', now() - interval '25 days', '{"demo":true}'),
   (v_p1, 'demo-6', 'Lagerarbetare kvällsskift', 'Demostads Grossist AB', 'Demostad', 'SAVED', 'demo', NULL, now() - interval '1 day', '{"demo":true}'),
   (v_p2, 'demo-3', 'Butiksmedarbetare', 'Demobutiken Centrum', 'Demostad', 'SAVED', 'demo', NULL, now() - interval '2 days', '{"demo":true}'),
   (v_p3, 'demo-4', 'Undersköterska natt', 'Demostads kommun', 'Demostad', 'APPLIED', 'demo', now() - interval '4 days', now() - interval '5 days', '{"demo":true}'),
   (v_p4, 'demo-5', 'Köksbiträde', 'Fiktiva Restaurangen', 'Demostad', 'SAVED', 'demo', NULL, now() - interval '1 day', '{"demo":true}')
  ON CONFLICT DO NOTHING;
  INSERT INTO consultant_journal (consultant_id, participant_id, content, category, created_at) VALUES
   (v_kons, v_p1, 'Uppföljningssamtal. Anna har sökt två lagerjobb och fått intervju hos Exempel Transport nästa vecka. Vi övade intervjufrågor.', 'PROGRESS', date_trunc('day', now()) - interval '3 days' + interval '8 hours 30 minutes'),
   (v_kons, v_p2, 'Omar behöver hjälp med CV:t innan vi söker bredare. Bokade tid i CV-verktyget tillsammans.', 'GENERAL', date_trunc('day', now()) - interval '6 days' + interval '8 hours 30 minutes'),
   (v_kons, v_p4, 'Erik är ny i Sverige, SFI nivå C. Vi pratade om validering av kockutbildningen från hemlandet.', 'GENERAL', date_trunc('day', now()) - interval '8 days' + interval '8 hours 30 minutes'),
   (v_kons, v_p5, 'Fatima är sjukskriven på deltid, läkarintyg till 30 september. Plan på 10 timmar/vecka tills vidare.', 'CONCERN', date_trunc('day', now()) - interval '10 days' + interval '8 hours 30 minutes'),
   (v_koll, v_k1, 'Första samtalet. Sara vill tillbaka till restaurang, helst dagtid. Vi börjar med CV.', 'GENERAL', date_trunc('day', now()) - interval '6 days' + interval '10 hours');
  INSERT INTO consultant_goals (consultant_id, participant_id, title, description, priority, status, progress, deadline) VALUES
   (v_kons, v_p1, 'Tre ansökningar per vecka', 'Sök minst tre lagerjobb i veckan via platsbanken.', 'HIGH', 'IN_PROGRESS', 60, now() + interval '3 weeks'),
   (v_kons, v_p2, 'Färdigt CV', 'Ett komplett CV med kassavana och kundservice.', 'MEDIUM', 'IN_PROGRESS', 30, now() + interval '2 weeks'),
   (v_kons, v_p3, 'Nattjänst inom äldreomsorgen', 'Sök nattjänster i kommunen och två grannkommuner.', 'HIGH', 'NOT_STARTED', 0, now() + interval '4 weeks'),
   (v_kons, v_p4, 'Validera kockutbildning', 'Kontakta UHR om bedömning av utländsk utbildning.', 'MEDIUM', 'IN_PROGRESS', 20, now() + interval '6 weeks');
  INSERT INTO consultant_meetings (consultant_id, participant_id, scheduled_at, duration_minutes, meeting_type, location, status, notes) VALUES
   -- Kommande möte på Anna (flyttat tillbaka 2026-09-27: MyConsultant läser meeting_type sedan 2026-09-12).
   (v_kons, v_p1, date_trunc('day', now()) + interval '1 day 10 hours', 45, 'physical', 'Rum 2, arbetsmarknadsenheten', 'scheduled', 'Intervjuträning'),
   (v_kons, v_p3, date_trunc('day', now()) + interval '2 days 13 hours', 30, 'phone', NULL, 'scheduled', 'Avstämning ansökningar'),
   (v_kons, v_p2, date_trunc('day', now()) - interval '5 days' + interval '9 hours', 60, 'physical', 'Rum 1', 'completed', 'CV-genomgång');
  -- Aktivitetskrav: mall + plan för Anna med pass förra och denna vecka
  INSERT INTO activity_templates (owner_id, org_id, name, description, is_public)
  VALUES (v_kons, v_org, 'Demomall: jobbsökning + motivation', 'Standardvecka för deltagare med försörjningsstöd (demo).', true)
  RETURNING id INTO v_mall;
  INSERT INTO activity_template_items (template_id, weekday, start_time, end_time, title, activity_type, location, sort_order) VALUES
   (v_mall, 1, '09:00', '12:00', 'Jobbsökarverkstad', 'jobsearch', 'Arbetsmarknadsenheten', 1),
   (v_mall, 2, '09:00', '11:00', 'Motivationsgrupp', 'motivation', 'Rum 3', 2),
   (v_mall, 3, '09:00', '12:00', 'Eget jobbsökande', 'jobsearch_own', 'Hemma/bibliotek', 3),
   (v_mall, 4, '13:00', '16:00', 'Praktikbesök', 'workplace', 'Fiktiva Logistik AB', 4);
  INSERT INTO activity_plans (participant_id, consultant_id, org_id, template_id, template_name, start_date, weekly_hours_target, jobsearch_hours_per_week, target_reason, status, plan_text, decided_at, forsorjningshinder)
  VALUES (v_p1, v_kons, v_org, v_mall, 'Demomall: jobbsökning + motivation', v_monday - 7, 11, 3, 'Heltidsaktivitet enligt aktivitetskravet.', 'active', 'Jobbsökarverkstad och motivationsgrupp, praktikbesök torsdagar.', v_monday - 7, 'arbetslos')
  RETURNING id INTO v_plan;
  FOR d IN SELECT generate_series(v_monday - 7, v_monday + 4, '1 day')::date LOOP
    FOR r IN SELECT * FROM activity_template_items WHERE template_id = v_mall AND weekday = extract(isodow from d) LOOP
      INSERT INTO activity_sessions (plan_id, participant_id, date, start_time, end_time, title, activity_type, location, attendance, marked_by, marked_at)
      VALUES (v_plan, v_p1, d, r.start_time, r.end_time, r.title, r.activity_type, r.location,
        CASE WHEN d >= current_date THEN NULL
             WHEN r.weekday = 2 AND d < v_monday THEN 'absent_valid'
             WHEN r.weekday = 4 AND d < v_monday THEN 'absent_invalid'
             ELSE 'present' END,
        CASE WHEN d < current_date THEN v_kons END,
        CASE WHEN d < current_date THEN d + time '16:30' END);
    END LOOP;
  END LOOP;
  -- RK41/RK36: Lisa går i samma Jobbsökarverkstad och motivationsgrupp som Anna,
  -- så gruppnärvaron ("Markera hela passet") har ett pass med två deltagare.
  INSERT INTO activity_plans (participant_id, consultant_id, org_id, template_id, template_name, start_date, weekly_hours_target, jobsearch_hours_per_week, target_reason, status, plan_text, decided_at, forsorjningshinder)
  VALUES (v_p3, v_kons, v_org, v_mall, 'Demomall: jobbsökning + motivation', v_monday - 7, 5, 0, 'Deltid i väntan på nattjänst.', 'active', 'Jobbsökarverkstad måndagar och motivationsgrupp tisdagar.', v_monday - 7, 'arbetslos')
  RETURNING id INTO v_plan_lisa;
  FOR d IN SELECT generate_series(v_monday - 7, current_date + 1, '1 day')::date LOOP
    FOR r IN SELECT * FROM activity_template_items WHERE template_id = v_mall AND weekday = extract(isodow from d) AND weekday IN (1, 2) LOOP
      INSERT INTO activity_sessions (plan_id, participant_id, date, start_time, end_time, title, activity_type, location, attendance, marked_by, marked_at)
      VALUES (v_plan_lisa, v_p3, d, r.start_time, r.end_time, r.title, r.activity_type, r.location,
        CASE WHEN d >= current_date THEN NULL ELSE 'present' END,
        CASE WHEN d < current_date THEN v_kons END,
        CASE WHEN d < current_date THEN d + time '16:30' END);
    END LOOP;
  END LOOP;
  -- Alltid ett pass i dag och i morgon (helger inkluderade) så deltagarvyn och
  -- "Jag är här" har något att visa, oavsett när demot provas. Skapas bara om
  -- dagen saknar pass ur mallen. Ett pass i dag är brett (08–17) så knappen
  -- inte hinner bli inaktuell för den som provar på kvällen.
  FOR d IN SELECT unnest(ARRAY[current_date, current_date + 1]) LOOP
    IF NOT EXISTS (SELECT 1 FROM activity_sessions s WHERE s.plan_id = v_plan AND s.date = d) THEN
      INSERT INTO activity_sessions (plan_id, participant_id, date, start_time, end_time, title, activity_type, location, attendance)
      VALUES (v_plan, v_p1, d,
        (CASE WHEN d = current_date THEN '08:00' ELSE '09:00' END)::time,
        (CASE WHEN d = current_date THEN '17:00' ELSE '12:00' END)::time,
        CASE WHEN d = current_date THEN 'Eget jobbsökande' ELSE 'Jobbsökarverkstad' END,
        CASE WHEN d = current_date THEN 'jobsearch_own' ELSE 'jobsearch' END,
        CASE WHEN d = current_date THEN 'Hemma/bibliotek' ELSE 'Arbetsmarknadsenheten' END,
        NULL);
    END IF;
  END LOOP;
  -- KH11 (rollspelet 2026-09-28): Kims deltagare Sara får en plan, så enheten har planer
  -- från två konsulenter (chefens "hela enheten" i IVO och nämndrapporten), och Hanna
  -- Handläggare får två underlag: ett från Kim som väntar på kvittering, ett från
  -- Demo Konsulent som redan är kvitterat. Sara har tre ogiltiga frånvaron — en förklarad
  -- av henne själv i portalen, två inte — så handläggarens rad om förklaringar syns.
  INSERT INTO activity_plans (participant_id, consultant_id, org_id, template_id, template_name, start_date, weekly_hours_target, jobsearch_hours_per_week, target_reason, status, plan_text, decided_at, forsorjningshinder)
  VALUES (v_k1, v_koll, v_org, v_mall, 'Demomall: jobbsökning + motivation', v_monday - 14, 11, 3, 'Heltidsaktivitet enligt aktivitetskravet.', 'active', 'Jobbsökarverkstad, motivationsgrupp och praktikbesök.', v_monday - 14, 'arbetslos')
  RETURNING id INTO v_plan_sara;
  FOR d IN SELECT generate_series(v_monday - 14, v_monday + 4, '1 day')::date LOOP
    FOR r IN SELECT * FROM activity_template_items WHERE template_id = v_mall AND weekday = extract(isodow from d) LOOP
      INSERT INTO activity_sessions (plan_id, participant_id, date, start_time, end_time, title, activity_type, location, attendance, marked_by, marked_at, participant_explanation, participant_explanation_at)
      VALUES (v_plan_sara, v_k1, d, r.start_time, r.end_time, r.title, r.activity_type, r.location,
        CASE WHEN d >= current_date THEN NULL
             WHEN r.weekday = 2 AND d < v_monday - 7 THEN 'absent_invalid'
             WHEN r.weekday = 4 AND d < v_monday THEN 'absent_invalid'
             ELSE 'present' END,
        CASE WHEN d < current_date THEN v_koll END,
        CASE WHEN d < current_date THEN d + time '16:30' END,
        CASE WHEN r.weekday = 2 AND d < v_monday - 7 THEN 'Bussen gick inte på grund av snöovädret, jag ringde men kom inte fram.' END,
        CASE WHEN r.weekday = 2 AND d < v_monday - 7 THEN d + time '18:10' END);
    END LOOP;
  END LOOP;
  INSERT INTO activity_plan_handovers (plan_id, participant_id, consultant_id, org_id, handed_over_at, handed_over_by, recipient, recipient_user_id, period_from, period_to, summary, note)
  VALUES (v_plan_sara, v_k1, v_koll, v_org, now() - interval '3 hours', v_koll, 'Hanna Handläggare', v_handl, v_monday - 14, v_monday - 1,
    jsonb_build_object('pass', 8, 'present', 5, 'absent_invalid', 3, 'absent_valid', 0, 'sick_certified', 0, 'sjuk_utan_intyg', 0, 'anmald_franvaro', 0, 'external', 0, 'omarkerade', 0),
    'Tre ogiltiga frånvaron. Sara har förklarat en av dem i portalen; de andra två har vi inte pratat om än.')
  RETURNING id INTO v_h_sara;
  INSERT INTO activity_plan_handovers (plan_id, participant_id, consultant_id, org_id, handed_over_at, handed_over_by, recipient, recipient_user_id, period_from, period_to, summary, note)
  VALUES (v_plan, v_p1, v_kons, v_org, now() - interval '4 days', v_kons, 'Hanna Handläggare', v_handl, v_monday - 7, v_monday - 1,
    jsonb_build_object('pass', 4, 'present', 2, 'absent_invalid', 1, 'absent_valid', 1, 'sick_certified', 0, 'sjuk_utan_intyg', 0, 'anmald_franvaro', 1, 'external', 0, 'omarkerade', 0),
    NULL)
  RETURNING id INTO v_h_anna;
  PERFORM set_config('app.kvittering', 'ja', true);
  UPDATE activity_plan_handovers SET received_at = now() - interval '3 days' WHERE id = v_h_anna;
  PERFORM set_config('app.kvittering', '', true);
  -- Demodatan ska hålla ihop med journalen (rollspelet 2026-09-28): Fatimas journal säger
  -- "Plan på 10 timmar/vecka tills vidare" men ingen plan fanns, och Erik ("ny i Sverige,
  -- SFI nivå C") hade ingen plan alls. Fatima: deltid under sjukskrivning, en anmäld
  -- frånvaro för vård av barn. Erik: SFI fyra förmiddagar och jobbsökarverkstad på fredag.
  INSERT INTO activity_plans (participant_id, consultant_id, org_id, start_date, weekly_hours_target, jobsearch_hours_per_week, target_reason, status, plan_text, decided_at, forsorjningshinder)
  VALUES (v_p5, v_kons, v_org, v_monday - 14, 10, 0, 'Deltid enligt läkarintyget, till och med 30 september.', 'active', 'Motivationsgrupp måndagar och hälsopass onsdagar.', v_monday - 14, 'sjukskriven_med_intyg')
  RETURNING id INTO v_plan_fatima;
  FOR d IN SELECT generate_series(v_monday - 14, v_monday + 4, '1 day')::date LOOP
    IF extract(isodow from d) IN (1, 3) THEN
      INSERT INTO activity_sessions (plan_id, participant_id, date, start_time, end_time, title, activity_type, location, attendance, marked_by, marked_at, absence_reported_at, absence_reason)
      VALUES (v_plan_fatima, v_p5, d,
        CASE WHEN extract(isodow from d) = 1 THEN '09:00'::time ELSE '10:00'::time END,
        CASE WHEN extract(isodow from d) = 1 THEN '11:00'::time ELSE '12:00'::time END,
        CASE WHEN extract(isodow from d) = 1 THEN 'Motivationsgrupp' ELSE 'Hälsopass' END,
        CASE WHEN extract(isodow from d) = 1 THEN 'motivation' ELSE 'halsa' END,
        CASE WHEN extract(isodow from d) = 1 THEN 'Rum 3' ELSE 'Friskvårdsrummet' END,
        CASE WHEN d >= current_date THEN NULL
             WHEN d = v_monday - 5 THEN 'absent_valid'
             ELSE 'present' END,
        CASE WHEN d < current_date THEN v_kons END,
        CASE WHEN d < current_date THEN d + time '16:30' END,
        CASE WHEN d = v_monday - 5 THEN d - 1 + time '19:40' END,
        CASE WHEN d = v_monday - 5 THEN 'child_care' END);
    END IF;
  END LOOP;
  INSERT INTO activity_plans (participant_id, consultant_id, org_id, start_date, weekly_hours_target, jobsearch_hours_per_week, target_reason, status, plan_text, decided_at, forsorjningshinder)
  VALUES (v_p4, v_kons, v_org, v_monday - 7, 15, 3, 'SFI räknas som aktivitet; jobbsökarverkstad en gång i veckan.', 'active', 'SFI kurs C måndag till torsdag, jobbsökarverkstad fredag.', v_monday - 7, 'sprakhinder')
  RETURNING id INTO v_plan_erik;
  FOR d IN SELECT generate_series(v_monday - 7, v_monday + 4, '1 day')::date LOOP
    IF extract(isodow from d) BETWEEN 1 AND 5 THEN
      INSERT INTO activity_sessions (plan_id, participant_id, date, start_time, end_time, title, activity_type, location, attendance, marked_by, marked_at)
      VALUES (v_plan_erik, v_p4, d,
        CASE WHEN extract(isodow from d) = 5 THEN '09:00'::time ELSE '08:30'::time END,
        CASE WHEN extract(isodow from d) = 5 THEN '12:00'::time ELSE '11:30'::time END,
        CASE WHEN extract(isodow from d) = 5 THEN 'Jobbsökarverkstad' ELSE 'SFI kurs C' END,
        CASE WHEN extract(isodow from d) = 5 THEN 'jobsearch' ELSE 'sfi' END,
        CASE WHEN extract(isodow from d) = 5 THEN 'Arbetsmarknadsenheten' ELSE 'Komvux, Demostad' END,
        CASE WHEN d >= current_date THEN NULL ELSE 'present' END,
        CASE WHEN d < current_date THEN v_kons END,
        CASE WHEN d < current_date THEN d + time '16:30' END);
    END IF;
  END LOOP;
  RETURN 'demo seedad (två konsulenter, en handläggare, två underlag till handläggaren)';
END;
$function$;
