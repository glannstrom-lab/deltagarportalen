-- Demodeltagare (KM12 (8) rest, persona-fynd PG26/F15, 2026-09-12 kväll)
--
-- Köparen Per kunde inte se deltagarens sida av portalen i demot: demokonsulentens
-- egen deltagarvy är tom. Nu får EN av de fem fiktiva deltagarna — Anna Exempel —
-- ett känt lösenord som står på B2B-sidan bredvid konsulentens. Hon är fortfarande
-- USER (inte konsulent), kopplad till demokonsulenten, AI av på både profil och
-- organisation, inga dagboks-/hälsodata (art. 9 — inget att samtycka till i ett demo).
--
-- Dessutom får Anna alltid pass "i dag" och "i morgon" relativt seedningstillfället,
-- oavsett veckodag: utan det stod Min vecka tom och "Jag är här" saknades på helger,
-- vilket också var skälet till att KM-röktestet inte kunde pröva incheckning en lördag.
-- Passen skapas bara för dagar som inte redan har ett pass ur veckomallen.
--
-- Ersätter seed_demo_org(text) från 20260912190000 med seed_demo_org(text, text):
-- en signaturändring kräver DROP, annars blir anropet seed_demo_org(NULL) tvetydigt.
-- reset_demo_org() rör inte auth.users för de fasta id:n, så lösenorden består.
--
-- Körs manuellt: npx supabase db query --linked -f <denna fil>
-- Efter körning: SELECT seed_demo_org('<konsulentlösenord>', '<deltagarlösenord>') en gång,
-- sedan grants:refresh + schema:refresh.

DROP FUNCTION IF EXISTS public.seed_demo_org(text);

CREATE OR REPLACE FUNCTION public.seed_demo_org(p_password text DEFAULT NULL, p_password_deltagare text DEFAULT NULL)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_org  constant uuid := '22222222-2222-4222-8222-222222222222';
  v_kons constant uuid := '22222222-2222-4222-8222-000000000001';
  v_p1   constant uuid := '22222222-2222-4222-8222-000000000002';
  v_p2   constant uuid := '22222222-2222-4222-8222-000000000003';
  v_p3   constant uuid := '22222222-2222-4222-8222-000000000004';
  v_p4   constant uuid := '22222222-2222-4222-8222-000000000005';
  v_p5   constant uuid := '22222222-2222-4222-8222-000000000006';
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
      (v_p5,   'fatima.exempel@example.com',   'Fatima', 'Exempel',   'deltagare')
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
      role = CASE WHEN r.typ = 'konsulent' THEN 'CONSULTANT' ELSE 'USER' END,
      roles = CASE WHEN r.typ = 'konsulent' THEN ARRAY['CONSULTANT'] ELSE ARRAY['USER'] END,
      active_role = CASE WHEN r.typ = 'konsulent' THEN 'CONSULTANT' ELSE 'USER' END,
      consultant_id = CASE WHEN r.typ = 'konsulent' THEN NULL ELSE v_kons END,
      status = 'ACTIVE', ai_enabled = false, avatar_url = NULL, phone = NULL,
      terms_accepted_at = now(), privacy_accepted_at = now(),
      onboarding_completed = true
    WHERE id = r.id;
  END LOOP;

  UPDATE profiles SET location = 'Demostad', employment_status = 'unemployed' WHERE id IN (v_p1, v_p2, v_p3);
  UPDATE profiles SET location = 'Demostad', employment_status = 'new-to-country' WHERE id = v_p4;
  UPDATE profiles SET location = 'Demostad', employment_status = 'sick-leave' WHERE id = v_p5;

  INSERT INTO organization_members (org_id, user_id, role) VALUES (v_org, v_kons, 'chef')
  ON CONFLICT DO NOTHING;
  UPDATE organization_members SET role = 'chef' WHERE org_id = v_org AND user_id = v_kons;

  FOR r IN SELECT unnest(ARRAY[v_p1, v_p2, v_p3, v_p4, v_p5]) AS pid LOOP
    INSERT INTO consultant_participants (consultant_id, participant_id, assigned_at, assigned_by, priority, last_contact_at)
    VALUES (v_kons, r.pid, now() - interval '40 days', v_kons, 2, now() - interval '3 days')
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
   (v_kons, v_p1, 'Uppföljningssamtal. Anna har sökt två lagerjobb och fått intervju hos Exempel Transport nästa vecka. Vi övade intervjufrågor.', 'PROGRESS', now() - interval '3 days'),
   (v_kons, v_p2, 'Omar behöver hjälp med CV:t innan vi söker bredare. Bokade tid i CV-verktyget tillsammans.', 'GENERAL', now() - interval '6 days'),
   (v_kons, v_p4, 'Erik är ny i Sverige, SFI nivå C. Vi pratade om validering av kockutbildningen från hemlandet.', 'GENERAL', now() - interval '8 days'),
   (v_kons, v_p5, 'Fatima är sjukskriven på deltid, läkarintyg till 30 september. Plan på 10 timmar/vecka tills vidare.', 'CONCERN', now() - interval '10 days');
  INSERT INTO consultant_goals (consultant_id, participant_id, title, description, priority, status, progress, deadline) VALUES
   (v_kons, v_p1, 'Tre ansökningar per vecka', 'Sök minst tre lagerjobb i veckan via platsbanken.', 'HIGH', 'IN_PROGRESS', 60, now() + interval '3 weeks'),
   (v_kons, v_p2, 'Färdigt CV', 'Ett komplett CV med kassavana och kundservice.', 'MEDIUM', 'IN_PROGRESS', 30, now() + interval '2 weeks'),
   (v_kons, v_p3, 'Nattjänst inom äldreomsorgen', 'Sök nattjänster i kommunen och två grannkommuner.', 'HIGH', 'NOT_STARTED', 0, now() + interval '4 weeks'),
   (v_kons, v_p4, 'Validera kockutbildning', 'Kontakta UHR om bedömning av utländsk utbildning.', 'MEDIUM', 'IN_PROGRESS', 20, now() + interval '6 weeks');
  INSERT INTO consultant_meetings (consultant_id, participant_id, scheduled_at, duration_minutes, meeting_type, location, status, notes) VALUES
   -- Det kommande mötet ligger på Omar (kan inte logga in), INTE på Anna: deltagarens
   -- Min konsulent (MyConsultant.tsx ~rad 200) läser `nextMeeting.type` men kolumnen
   -- heter `meeting_type` — `type` är alltid undefined och sidan kraschar med React #130
   -- för VARJE deltagare som har ett kommande schemalagt möte. Skarp bugg, rapporterad
   -- 2026-09-12. När den är rättad kan mötet flyttas tillbaka till v_p1.
   (v_kons, v_p2, date_trunc('day', now()) + interval '1 day 10 hours', 45, 'physical', 'Rum 2, arbetsmarknadsenheten', 'scheduled', 'Intervjuträning'),
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

  -- Alltid ett pass i dag och i morgon (helger inkluderade) så deltagarvyn och
  -- "Jag är här" har något att visa, oavsett när demot provas. Skapas bara om
  -- dagen saknar pass ur mallen. Ett pass i dag är brett (08–20) så knappen
  -- inte hinner bli inaktuell för den som provar på kvällen.
  FOR d IN SELECT unnest(ARRAY[current_date, current_date + 1]) LOOP
    IF NOT EXISTS (SELECT 1 FROM activity_sessions s WHERE s.plan_id = v_plan AND s.date = d) THEN
      INSERT INTO activity_sessions (plan_id, participant_id, date, start_time, end_time, title, activity_type, location, attendance)
      VALUES (v_plan, v_p1, d,
        (CASE WHEN d = current_date THEN '08:00' ELSE '09:00' END)::time,
        (CASE WHEN d = current_date THEN '20:00' ELSE '12:00' END)::time,
        CASE WHEN d = current_date THEN 'Eget jobbsökande (demo — pass i dag)' ELSE 'Jobbsökarverkstad (demo — pass i morgon)' END,
        CASE WHEN d = current_date THEN 'jobsearch_own' ELSE 'jobsearch' END,
        CASE WHEN d = current_date THEN 'Hemma/bibliotek' ELSE 'Arbetsmarknadsenheten' END,
        NULL);
    END IF;
  END LOOP;

  RETURN 'demo seedad';
END;
$$;

-- Reset: oförändrad logik, men anropar den nya signaturen (lösenorden består:
-- auth.users för de fasta id:n rörs inte).
CREATE OR REPLACE FUNCTION public.reset_demo_org()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_org  constant uuid := '22222222-2222-4222-8222-222222222222';
  v_kons constant uuid := '22222222-2222-4222-8222-000000000001';
  v_fasta constant uuid[] := ARRAY['22222222-2222-4222-8222-000000000001','22222222-2222-4222-8222-000000000002',
    '22222222-2222-4222-8222-000000000003','22222222-2222-4222-8222-000000000004',
    '22222222-2222-4222-8222-000000000005','22222222-2222-4222-8222-000000000006']::uuid[];
  v_delt uuid[] := v_fasta[2:6];
  v_extra uuid[];
BEGIN
  SELECT coalesce(array_agg(DISTINCT id), '{}') INTO v_extra FROM (
    SELECT p.id FROM profiles p WHERE p.consultant_id = v_kons AND NOT (p.id = ANY (v_fasta))
    UNION SELECT m.user_id FROM organization_members m WHERE m.org_id = v_org AND NOT (m.user_id = ANY (v_fasta))
    UNION SELECT cp.participant_id FROM consultant_participants cp WHERE cp.consultant_id = v_kons AND NOT (cp.participant_id = ANY (v_fasta))
  ) x;
  IF array_length(v_extra, 1) > 0 THEN
    UPDATE audit_logs SET user_id = NULL WHERE user_id = ANY (v_extra);
    DELETE FROM auth.users WHERE id = ANY (v_extra);
  END IF;

  DELETE FROM activity_sessions WHERE participant_id = ANY (v_delt) OR plan_id IN (SELECT id FROM activity_plans WHERE consultant_id = v_kons OR org_id = v_org);
  DELETE FROM activity_plans WHERE consultant_id = v_kons OR org_id = v_org OR participant_id = ANY (v_delt);
  DELETE FROM activity_template_items WHERE template_id IN (SELECT id FROM activity_templates WHERE owner_id = v_kons OR org_id = v_org);
  DELETE FROM activity_templates WHERE owner_id = v_kons OR org_id = v_org;
  DELETE FROM consultant_journal WHERE consultant_id = v_kons OR participant_id = ANY (v_delt);
  DELETE FROM consultant_notes WHERE consultant_id = v_kons OR participant_id = ANY (v_delt);
  DELETE FROM consultant_goals WHERE consultant_id = v_kons OR participant_id = ANY (v_delt);
  DELETE FROM consultant_meetings WHERE consultant_id = v_kons OR participant_id = ANY (v_delt);
  DELETE FROM consultant_messages WHERE sender_id = ANY (v_fasta) OR receiver_id = ANY (v_fasta);
  DELETE FROM consultant_work_placements WHERE consultant_id = v_kons OR participant_id = ANY (v_delt);
  DELETE FROM consultant_placements WHERE consultant_id = v_kons OR participant_id = ANY (v_delt);
  DELETE FROM invitations WHERE invited_by = v_kons OR consultant_id = v_kons;
  DELETE FROM notifications WHERE user_id = ANY (v_fasta);
  DELETE FROM saved_jobs WHERE user_id = ANY (v_delt);
  DELETE FROM cvs WHERE user_id = ANY (v_delt);
  -- Demodeltagaren kan logga in: allt hon kan ha skapat själv nollas också.
  DELETE FROM diary_entries WHERE user_id = ANY (v_delt);
  DELETE FROM mood_logs WHERE user_id = ANY (v_delt);
  DELETE FROM cover_letters WHERE user_id = ANY (v_delt);
  DELETE FROM consultant_consents WHERE consultant_id = v_kons OR participant_id = ANY (v_delt);
  DELETE FROM consultant_participants WHERE consultant_id = v_kons OR participant_id = ANY (v_delt);
  DELETE FROM organization_members WHERE org_id = v_org;
  UPDATE organizations SET ai_enabled = false, is_demo = true WHERE id = v_org;

  RETURN seed_demo_org(NULL, NULL);
END;
$$;

REVOKE ALL ON FUNCTION public.seed_demo_org(text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.reset_demo_org() FROM PUBLIC, anon, authenticated;
