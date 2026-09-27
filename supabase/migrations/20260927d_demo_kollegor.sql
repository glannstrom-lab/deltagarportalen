-- RK41 (rollspelet 2026-09-27): demoorganisationen får två konsulenter och en handläggare.
-- INTE KÖRD MOT PROD — väntar på Mikaels ja. Byt namn (ta bort PENDING_) när den körts.
--
-- Premiss mätt i prod 2026-09-27 (läsning):
--   · "Demokommun (påhittade personer)" (22222222-…-222222222222, kind kommun)
--     har EN medlem: demo@jobin.se som chef. Överlämning, caseload per
--     konsulent och handläggarens roll gick därför inte att visa (RK18, 48-overlamna.png).
--   · seed_demo_org/reset_demo_org: SECURITY DEFINER, EXECUTE bara postgres och
--     service_role. Definitionerna nedan utgår ordagrant från pg_get_functiondef
--     i prod 2026-09-27; bara RK41-raderna är tillagda.
--   · Prefixet 55555555 är ledigt: 0 rader i auth.users, profiles, organizations
--     och activity_plans (`where id::text like '55555555%'`). Upptagna: 11111111,
--     22222222 (…0001–0006 Demokommun), 33333333 (Nordfrakt), 44444444 (Demoleverantör).
--   · De nya adresserna finns inte i auth.users.
--
-- Vad ändras:
--   seed_demo_org
--     + Kim Kollega (…5551), konsulent i Demokommun, med två egna påhittade
--       deltagare: Sara Påhitt (…5553) och Johan Exempelsson (…5554).
--     + Hanna Handläggare (…5552), rollen "Handläggare (ekonomiskt bistånd)".
--     + Lisa får en plan med Jobbsökarverkstad och motivationsgrupp — samma pass
--       som Anna, så gruppnärvaron (RK36) har ett pass med två deltagare.
--     Alla nya konton: @example.com (tar inte emot post), slumpat lösenord
--     (gen_random_uuid, samma väg som de fyra deltagarna) — inget känt lösenord.
--     Profilroll CONSULTANT för kollegan och handläggaren, samma som en
--     kolleginbjudan ger (kollega_inbjudan_medlemskap).
--   reset_demo_org
--     + de nya id:na i v_fasta (annars raderar "extra"-städningen kontona), och
--       kollegans data (planer, journal, möten, kopplingar) nollställs med demot.
--     + journalhistoriken (RK38) för demodeltagarna, när den tabellen finns.
--
-- Efter körning:
--   1. select reset_demo_org();   -- som service_role/postgres, fyller demot
--   2. Verifiera:
--      select m.role, p.first_name from organization_members m join profiles p on p.id = m.user_id
--        where m.org_id = '22222222-2222-4222-8222-222222222222' order by 1;
--        → chef Demo, handlaggare Hanna, konsulent Kim
--      select has_function_privilege('anon', 'public.seed_demo_org(text,text)', 'EXECUTE'),
--             has_function_privilege('authenticated', 'public.reset_demo_org()', 'EXECUTE');  → false, false
--   3. npm run grants:refresh (ACL oförändrad, men kontrollera).

BEGIN;

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
  RETURN 'demo seedad (två konsulenter, en handläggare)';
END;
$function$;

CREATE OR REPLACE FUNCTION public.reset_demo_org()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth', 'extensions'
AS $function$
DECLARE
  v_org  constant uuid := '22222222-2222-4222-8222-222222222222';
  v_forg constant uuid := '33333333-3333-4333-8333-333333333333';
  v_ali  constant uuid := '33333333-3333-4333-8333-000000000001';
  v_kons constant uuid := '22222222-2222-4222-8222-000000000001';
  -- RK41: kollegan (…5551) och handläggaren (…5552) är konsulentkonton, …5553–4 kollegans deltagare.
  v_koll constant uuid := '55555555-5555-4555-8555-000000000001';
  v_fasta constant uuid[] := ARRAY['22222222-2222-4222-8222-000000000001','22222222-2222-4222-8222-000000000002',
    '22222222-2222-4222-8222-000000000003','22222222-2222-4222-8222-000000000004',
    '22222222-2222-4222-8222-000000000005','22222222-2222-4222-8222-000000000006',
    '33333333-3333-4333-8333-000000000001',
    '55555555-5555-4555-8555-000000000001','55555555-5555-4555-8555-000000000002',
    '55555555-5555-4555-8555-000000000003','55555555-5555-4555-8555-000000000004']::uuid[];
  v_konsulter constant uuid[] := ARRAY['22222222-2222-4222-8222-000000000001','55555555-5555-4555-8555-000000000001',
    '55555555-5555-4555-8555-000000000002']::uuid[];
  v_delt uuid[] := ARRAY['22222222-2222-4222-8222-000000000002','22222222-2222-4222-8222-000000000003',
    '22222222-2222-4222-8222-000000000004','22222222-2222-4222-8222-000000000005',
    '22222222-2222-4222-8222-000000000006',
    '55555555-5555-4555-8555-000000000003','55555555-5555-4555-8555-000000000004']::uuid[];
  v_extra uuid[];
  v_svar text;
BEGIN
  SELECT coalesce(array_agg(DISTINCT id), '{}') INTO v_extra FROM (
    SELECT p.id FROM profiles p WHERE p.consultant_id = ANY (v_konsulter) AND NOT (p.id = ANY (v_fasta))
    UNION SELECT m.user_id FROM organization_members m WHERE m.org_id IN (v_org, v_forg) AND NOT (m.user_id = ANY (v_fasta))
    UNION SELECT cp.participant_id FROM consultant_participants cp WHERE cp.consultant_id = ANY (v_konsulter) AND NOT (cp.participant_id = ANY (v_fasta))
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
  DELETE FROM activity_sessions WHERE participant_id = ANY (v_delt) OR plan_id IN (SELECT id FROM activity_plans WHERE consultant_id = ANY (v_konsulter) OR org_id = v_org);
  DELETE FROM activity_plans WHERE consultant_id = ANY (v_konsulter) OR org_id = v_org OR participant_id = ANY (v_delt);
  DELETE FROM activity_template_items WHERE template_id IN (SELECT id FROM activity_templates WHERE owner_id = ANY (v_konsulter) OR org_id = v_org);
  DELETE FROM activity_templates WHERE owner_id = ANY (v_konsulter) OR org_id = v_org;
  DELETE FROM consultant_journal WHERE consultant_id = ANY (v_konsulter) OR participant_id = ANY (v_delt);
  -- RK38: journalhistoriken (PENDING_20260927d_journal_sol) — raderingen ovan
  -- skriver versioner via triggern. Tabellen finns bara efter den migrationen.
  IF to_regclass('public.consultant_journal_revisions') IS NOT NULL THEN
    EXECUTE 'DELETE FROM public.consultant_journal_revisions WHERE participant_id = ANY ($1)' USING v_delt;
  END IF;
  DELETE FROM consultant_notes WHERE consultant_id = ANY (v_konsulter) OR participant_id = ANY (v_delt);
  DELETE FROM consultant_goals WHERE consultant_id = ANY (v_konsulter) OR participant_id = ANY (v_delt);
  DELETE FROM consultant_meetings WHERE consultant_id = ANY (v_konsulter) OR participant_id = ANY (v_delt);
  DELETE FROM consultant_messages WHERE sender_id = ANY (v_fasta) OR receiver_id = ANY (v_fasta);
  DELETE FROM consultant_work_placements WHERE consultant_id = ANY (v_konsulter) OR participant_id = ANY (v_delt) OR company_account_id = v_forg;
  DELETE FROM consultant_placements WHERE consultant_id = ANY (v_konsulter) OR participant_id = ANY (v_delt);
  DELETE FROM invitations WHERE invited_by = ANY (v_konsulter) OR consultant_id = ANY (v_konsulter);
  DELETE FROM notifications WHERE user_id = ANY (v_fasta);
  DELETE FROM saved_jobs WHERE user_id = ANY (v_delt);
  DELETE FROM cvs WHERE user_id = ANY (v_delt);
  DELETE FROM diary_entries WHERE user_id = ANY (v_delt);
  DELETE FROM mood_logs WHERE user_id = ANY (v_delt);
  DELETE FROM cover_letters WHERE user_id = ANY (v_delt);
  DELETE FROM consultant_consents WHERE consultant_id = ANY (v_konsulter) OR participant_id = ANY (v_delt);
  DELETE FROM consultant_participants WHERE consultant_id = ANY (v_konsulter) OR participant_id = ANY (v_delt);
  DELETE FROM organization_members WHERE org_id IN (v_org, v_forg);
  UPDATE organizations SET ai_enabled = false, is_demo = true WHERE id IN (v_org, v_forg);
  v_svar := seed_demo_org(NULL, NULL);
  PERFORM seed_demo_foretag(NULL);
  RETURN v_svar || ' + demoföretag';
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.seed_demo_org(text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.reset_demo_org() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.seed_demo_org(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.reset_demo_org() TO service_role;

COMMIT;
