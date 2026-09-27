-- VS2: Demoleverantör — Rusta och matcha-leverantör med påhittade personer (2026-09-27)
--
-- Motsvarigheten till Demokommun (20260912190000_demo_org.sql) för den andra
-- kundgruppen. Syns i superadmin → "Visa som" (is_demo = true). Egna funktioner
-- och eget cron-jobb: Demokommun rörs inte.
--
-- R&M-specifikt i datan, så avtalskravskortet (FFU §4.1.1), mötesrytmen och
-- placeringsuppföljningen har något att visa:
--   Sara  — plan sedan 8 veckor, 4 h/vecka, allt fysiskt → klarar kravet
--   Jonas — plan sedan 6 veckor, mest digitalt eget sökande, en frånvarovecka → missar
--   Amina — anställd (placering), 3-månadersuppföljning snart
--   Peter — ny, första mötet bokat
--
-- Fasta id:n (33333333-… är Nordfrakt, demoföretaget — krockade i första torrkörningen):
--   org        44444444-4444-4444-8444-444444444444
--   konsulent  44444444-4444-4444-8444-000000000001  demo-leverantor@jobin.se (chef)
--   deltagare  44444444-4444-4444-8444-000000000002 … 005
--
-- Inget känt lösenord: kontot nås via "Visa som". seed_demo_leverantor(p_password)
-- kan sätta ett om det ska delas publikt senare.
--
-- Körs manuellt: npx supabase db query --linked -f <denna fil>
-- Efteråt: cd client && npm run schema:refresh && npm run grants:refresh

CREATE OR REPLACE FUNCTION public.seed_demo_leverantor(p_password text DEFAULT NULL)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_org  constant uuid := '44444444-4444-4444-8444-444444444444';
  v_kons constant uuid := '44444444-4444-4444-8444-000000000001';
  v_p1   constant uuid := '44444444-4444-4444-8444-000000000002';
  v_p2   constant uuid := '44444444-4444-4444-8444-000000000003';
  v_p3   constant uuid := '44444444-4444-4444-8444-000000000004';
  v_p4   constant uuid := '44444444-4444-4444-8444-000000000005';
  v_monday date := date_trunc('week', current_date)::date;
  v_plan1 uuid;
  v_plan2 uuid;
  r record;
  d date;
BEGIN
  INSERT INTO organizations (id, name, kind, org_number, ai_enabled, is_demo)
  VALUES (v_org, 'Demoleverantör (påhittade personer)', 'leverantor', '559999-9999', false, true)
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, kind = EXCLUDED.kind,
    org_number = EXCLUDED.org_number, ai_enabled = false, is_demo = true;

  FOR r IN SELECT * FROM (VALUES
      (v_kons, 'demo-leverantor@jobin.se', 'Demo',  'Coach',    true),
      (v_p1,   'sara.exempel@example.com', 'Sara',  'Exempel',  false),
      (v_p2,   'jonas.demo@example.com',   'Jonas', 'Demo',     false),
      (v_p3,   'amina.fiktiv@example.com', 'Amina', 'Fiktiv',   false),
      (v_p4,   'peter.testsson@example.com','Peter','Testsson', false)
    ) AS t(id, email, fnamn, enamn, ar_konsulent)
  LOOP
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = r.id) THEN
      INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
        confirmation_token, recovery_token, email_change_token_new, email_change,
        email_change_token_current, phone_change, phone_change_token, reauthentication_token)
      VALUES (r.id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', r.email,
        crypt(CASE WHEN r.ar_konsulent THEN coalesce(p_password, gen_random_uuid()::text) ELSE gen_random_uuid()::text END, gen_salt('bf')),
        now(), '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('first_name', r.fnamn, 'last_name', r.enamn, 'email_verified', true),
        now(), now(), '', '', '', '', '', '', '', '');
      INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
      VALUES (gen_random_uuid(), r.id, r.id::text, 'email',
        jsonb_build_object('sub', r.id::text, 'email', r.email, 'email_verified', true),
        NULL, now(), now());
    ELSIF r.ar_konsulent AND p_password IS NOT NULL THEN
      UPDATE auth.users SET encrypted_password = crypt(p_password, gen_salt('bf')) WHERE id = r.id;
    END IF;
    INSERT INTO profiles (id, email, first_name, last_name, role) VALUES (r.id, r.email, r.fnamn, r.enamn, 'USER')
    ON CONFLICT (id) DO NOTHING;
    UPDATE profiles SET
      email = r.email, first_name = r.fnamn, last_name = r.enamn,
      role = CASE WHEN r.ar_konsulent THEN 'CONSULTANT' ELSE 'USER' END,
      roles = CASE WHEN r.ar_konsulent THEN ARRAY['CONSULTANT'] ELSE ARRAY['USER'] END,
      active_role = CASE WHEN r.ar_konsulent THEN 'CONSULTANT' ELSE 'USER' END,
      consultant_id = CASE WHEN r.ar_konsulent THEN NULL ELSE v_kons END,
      status = 'ACTIVE', ai_enabled = false, avatar_url = NULL, phone = NULL,
      terms_accepted_at = now(), privacy_accepted_at = now(),
      onboarding_completed = true,
      location = CASE WHEN r.ar_konsulent THEN NULL ELSE 'Demostad' END,
      employment_status = CASE WHEN r.ar_konsulent THEN NULL WHEN r.id = v_p3 THEN 'employed' ELSE 'unemployed' END
    WHERE id = r.id;
  END LOOP;

  INSERT INTO organization_members (org_id, user_id, role) VALUES (v_org, v_kons, 'chef')
  ON CONFLICT DO NOTHING;
  UPDATE organization_members SET role = 'chef' WHERE org_id = v_org AND user_id = v_kons;

  FOR r IN SELECT * FROM (VALUES (v_p1, 60), (v_p2, 45), (v_p3, 150), (v_p4, 5)) AS t(pid, dagar) LOOP
    INSERT INTO consultant_participants (consultant_id, participant_id, assigned_at, assigned_by, priority, last_contact_at)
    VALUES (v_kons, r.pid, now() - make_interval(days => r.dagar), v_kons, CASE WHEN r.pid = v_p2 THEN 1 ELSE 0 END, now() - interval '4 days')
    ON CONFLICT DO NOTHING;
    INSERT INTO consultant_consents (participant_id, consultant_id, program, scope, granted_text, granted_at, granted_via)
    SELECT r.pid, v_kons, 'rusta_och_matcha', '{"kalla":"demo"}'::jsonb,
      'Demodata — påhittad person, inget verkligt samtycke behövs.', now() - make_interval(days => r.dagar), 'manual_link'
    WHERE NOT EXISTS (SELECT 1 FROM consultant_consents c WHERE c.participant_id = r.pid AND c.consultant_id = v_kons AND c.revoked_at IS NULL);
  END LOOP;

  INSERT INTO cvs (user_id, first_name, last_name, title, email, location, summary, template, ats_score,
    work_experience, education, skills, languages, certificates, links, "references")
  VALUES
   (v_p1, 'Sara', 'Exempel', 'Bagerimedarbetare', 'sara.exempel@example.com', 'Demostad',
    'Praktiserar på ett bageri och vill arbeta med livsmedel. Van vid tidiga morgnar.', 'sidokolumn', 69,
    '[{"id":"e1","title":"Praktikant","company":"Demobageriet","startDate":"2026-08","endDate":"","description":"Degberedning, bakning, disk."}]',
    '[]', '[{"id":"s1","name":"Livsmedelshygien","level":"advanced","category":"technical"},{"id":"s2","name":"Samarbete","level":"advanced","category":"soft"}]',
    '[{"id":"l1","name":"Svenska","level":"good"},{"id":"l2","name":"Somaliska","level":"native"}]', '[]', '[]', '[]'),
   (v_p2, 'Jonas', 'Demo', 'Lagerarbetare', 'jonas.demo@example.com', 'Demostad',
    'Söker lagerjobb. Har B-körkort.', 'minimal', 44,
    '[]', '[]', '[{"id":"s1","name":"B-körkort","level":"expert","category":"technical"}]',
    '[{"id":"l1","name":"Svenska","level":"native"}]', '[]', '[]', '[]')
  ON CONFLICT DO NOTHING;

  INSERT INTO saved_jobs (user_id, job_id, job_title, company_name, location, status, source, application_date, created_at, job_data)
  VALUES
   (v_p1, 'demo-rm-1', 'Bagare', 'Demobageriet', 'Demostad', 'INTERVIEW', 'demo', now() - interval '6 days', now() - interval '10 days', '{"demo":true}'),
   (v_p2, 'demo-rm-2', 'Lagermedarbetare', 'Fiktiva Logistik AB', 'Demostad', 'SAVED', 'demo', NULL, now() - interval '3 days', '{"demo":true}')
  ON CONFLICT DO NOTHING;

  INSERT INTO consultant_journal (consultant_id, participant_id, content, category, created_at) VALUES
   (v_kons, v_p1, 'Praktiken på Demobageriet går bra. Handledaren vill prata om anställning efter praktiken.', 'PROGRESS', now() - interval '4 days'),
   (v_kons, v_p2, 'Jonas har svårt att komma till gruppträffarna. Vi provar individuella möten i stället och ses på kontoret nästa vecka.', 'CONCERN', now() - interval '9 days'),
   (v_kons, v_p3, 'Amina började som lokalvårdare på Exempel Städ AB. Följer upp efter tre månader enligt avtalet.', 'PROGRESS', now() - interval '80 days'),
   (v_kons, v_p4, 'Nyinskriven. Första mötet bokat, kartläggning av mål och förutsättningar.', 'GENERAL', now() - interval '5 days');

  INSERT INTO consultant_goals (consultant_id, participant_id, title, description, priority, status, progress, deadline) VALUES
   (v_kons, v_p1, 'Anställning efter praktiken', 'Förbereda samtal med Demobageriet om anställning.', 'HIGH', 'IN_PROGRESS', 70, now() + interval '3 weeks'),
   (v_kons, v_p2, 'Delta varje vecka', 'Minst en fysisk aktivitet i veckan på kontoret.', 'HIGH', 'IN_PROGRESS', 25, now() + interval '4 weeks');

  -- Möten: ett var fjärde vecka är avtalets rytm. Jonas senaste ligger över fyra veckor bak.
  INSERT INTO consultant_meetings (consultant_id, participant_id, scheduled_at, duration_minutes, meeting_type, location, status, notes) VALUES
   (v_kons, v_p1, date_trunc('day', now()) - interval '12 days' + interval '10 hours', 45, 'physical', 'Leverantörens kontor, Demostad', 'completed', 'Uppföljning av praktiken'),
   (v_kons, v_p1, date_trunc('day', now()) + interval '14 days' + interval '10 hours', 45, 'physical', 'Leverantörens kontor, Demostad', 'scheduled', 'Inför anställningssamtal'),
   (v_kons, v_p2, date_trunc('day', now()) - interval '33 days' + interval '13 hours', 30, 'phone', NULL, 'completed', 'Avstämning'),
   (v_kons, v_p4, date_trunc('day', now()) + interval '2 days' + interval '9 hours', 60, 'physical', 'Leverantörens kontor, Demostad', 'scheduled', 'Kartläggning');

  INSERT INTO consultant_placements (consultant_id, participant_id, employer_name, job_title, placement_type, start_date, followup_3m, followup_6m, notes)
  VALUES (v_kons, v_p3, 'Exempel Städ AB', 'Lokalvårdare', 'permanent', (current_date - 80), false, false, 'Tillsvidare, 75 %.');

  -- Aktivitetsplaner (utan kommunens försörjningshinder — det är R&M)
  INSERT INTO activity_plans (participant_id, consultant_id, org_id, start_date, weekly_hours_target, jobsearch_hours_per_week, status, plan_text, decided_at)
  VALUES (v_p1, v_kons, v_org, v_monday - 56, 4, 1, 'active', 'Praktik på Demobageriet tisdag och torsdag, jobbsökarträff på kontoret.', v_monday - 56)
  RETURNING id INTO v_plan1;
  INSERT INTO activity_plans (participant_id, consultant_id, org_id, start_date, weekly_hours_target, jobsearch_hours_per_week, status, plan_text, decided_at)
  VALUES (v_p2, v_kons, v_org, v_monday - 42, 2, 1, 'active', 'Eget jobbsökande hemifrån och gruppträff på kontoret varannan vecka.', v_monday - 42)
  RETURNING id INTO v_plan2;

  FOR d IN SELECT generate_series(v_monday - 56, v_monday + 4, '1 day')::date LOOP
    -- Sara: tis + tors praktik (fysiskt, 2 h) — klarar kravet varje vecka
    IF extract(isodow from d) IN (2, 4) THEN
      INSERT INTO activity_sessions (plan_id, participant_id, date, start_time, end_time, title, activity_type, location, attendance, marked_by, marked_at)
      VALUES (v_plan1, v_p1, d, '08:00', '10:00', 'Praktik', 'workplace', 'Demobageriet',
        CASE WHEN d >= current_date THEN NULL ELSE 'present' END,
        CASE WHEN d < current_date THEN v_kons END, CASE WHEN d < current_date THEN d + time '16:00' END);
    END IF;
    -- Jonas: onsdag eget sökande (digitalt, 1 h); gruppträff på kontoret varannan fredag
    IF d >= v_monday - 42 AND extract(isodow from d) = 3 THEN
      INSERT INTO activity_sessions (plan_id, participant_id, date, start_time, end_time, title, activity_type, location, attendance, marked_by, marked_at)
      VALUES (v_plan2, v_p2, d, '10:00', '11:00', 'Eget jobbsökande', 'jobsearch_own', NULL,
        CASE WHEN d >= current_date THEN NULL WHEN d BETWEEN v_monday - 21 AND v_monday - 15 THEN 'absent_invalid' ELSE 'present' END,
        CASE WHEN d < current_date THEN v_kons END, CASE WHEN d < current_date THEN d + time '16:00' END);
    END IF;
    IF d >= v_monday - 42 AND extract(isodow from d) = 5 AND ((d - (v_monday - 42)) / 7) % 2 = 0 THEN
      INSERT INTO activity_sessions (plan_id, participant_id, date, start_time, end_time, title, activity_type, location, attendance, marked_by, marked_at)
      VALUES (v_plan2, v_p2, d, '13:00', '14:00', 'Gruppträff: jobbsökning', 'jobsearch', 'Leverantörens kontor',
        CASE WHEN d >= current_date THEN NULL ELSE 'absent_invalid' END,
        CASE WHEN d < current_date THEN v_kons END, CASE WHEN d < current_date THEN d + time '16:00' END);
    END IF;
  END LOOP;

  RETURN 'demoleverantör seedad';
END;
$$;

CREATE OR REPLACE FUNCTION public.reset_demo_leverantor()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_org  constant uuid := '44444444-4444-4444-8444-444444444444';
  v_kons constant uuid := '44444444-4444-4444-8444-000000000001';
  v_fasta constant uuid[] := ARRAY['44444444-4444-4444-8444-000000000001','44444444-4444-4444-8444-000000000002',
    '44444444-4444-4444-8444-000000000003','44444444-4444-4444-8444-000000000004',
    '44444444-4444-4444-8444-000000000005']::uuid[];
  v_delt uuid[] := v_fasta[2:5];
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
  DELETE FROM consultant_consents WHERE consultant_id = v_kons OR participant_id = ANY (v_delt);
  DELETE FROM consultant_participants WHERE consultant_id = v_kons OR participant_id = ANY (v_delt);
  DELETE FROM organization_members WHERE org_id = v_org;

  RETURN seed_demo_leverantor(NULL);
END;
$$;

REVOKE ALL ON FUNCTION public.seed_demo_leverantor(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.reset_demo_leverantor() FROM PUBLIC, anon, authenticated;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'demo-reset-leverantor') THEN
    PERFORM cron.schedule('demo-reset-leverantor', '5 1 * * *', $job$ SELECT public.reset_demo_leverantor(); $job$);
  END IF;
END $$;

SELECT public.reset_demo_leverantor();
