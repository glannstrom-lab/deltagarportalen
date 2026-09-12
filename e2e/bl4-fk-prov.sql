-- BL4 — prov i transaktion mot prod (rullas ALLTID tillbaka via RAISE).
-- Kör: npx supabase db query --linked -f e2e/bl4-fk-prov.sql
-- Utfallet kommer som felmeddelandet "PROV-RESULTAT: …" — avsiktligt, RAISE
-- EXCEPTION garanterar rollback (även av ALTER TABLE-stegen).
--
-- Scenario: claude-playwright-consultant har claude-playwright-test som deltagare
-- och har skrivit journal, mål, möte och en praktikplats med uppföljning.
-- FÖRE (dagens regler): DELETE på konsulentens auth.users → deltagarens rader
--   försvinner (CASCADE) — eller raderingen faller på uppföljningens NO ACTION.
-- EFTER (migrationen applicerad i samma transaktion): raderna finns kvar med
--   consultant_id NULL, relationen (consultant_participants) är borta.
DO $$
DECLARE
  kons uuid := (SELECT id FROM auth.users WHERE email = 'claude-playwright-consultant@jobin.test');
  delt uuid := (SELECT id FROM auth.users WHERE email = 'claude-playwright-test@jobin.se');
  pid uuid; r text := ''; n int;
  fore_journal int; fore_mal int; fore_moten int; fore_platser int; fore_uppf int;
BEGIN
  DELETE FROM consultant_participants WHERE participant_id = delt;
  INSERT INTO consultant_participants (consultant_id, participant_id, assigned_by) VALUES (kons, delt, kons);
  INSERT INTO consultant_journal (consultant_id, participant_id, content, category) VALUES (kons, delt, 'BL4-prov', 'GENERAL');
  INSERT INTO consultant_goals (consultant_id, participant_id, title, status, priority) VALUES (kons, delt, 'BL4-provmål', 'NOT_STARTED', 'MEDIUM');
  INSERT INTO consultant_meetings (consultant_id, participant_id, scheduled_at, status) VALUES (kons, delt, now() + interval '1 day', 'scheduled');
  INSERT INTO consultant_work_placements (consultant_id, participant_id, placement_type, status, company_name)
    VALUES (kons, delt, 'praktik', 'planerad', 'BL4 Provbolag') RETURNING id INTO pid;
  INSERT INTO consultant_work_placement_followups (placement_id, consultant_id, week_number, followup_date, is_completed, status)
    VALUES (pid, kons, 1, current_date + 7, false, NULL);

  -- === FÖRE: dagens regler ===
  BEGIN
    DELETE FROM auth.users WHERE id = kons;
    SELECT count(*) INTO n FROM consultant_journal WHERE participant_id = delt;
    r := r || 'FÖRE: radering gick igenom, journal kvar=' || n;
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'inner-rollback';
  EXCEPTION
    WHEN foreign_key_violation THEN r := r || 'FÖRE: raderingen FALLER (' || SQLERRM || ')';
    WHEN OTHERS THEN IF SQLERRM <> 'inner-rollback' THEN RAISE; END IF;
  END;
  -- (det inre blocket är rullat tillbaka; testraderna finns kvar)

  -- === EFTER: applicera migrationen i samma transaktion ===
  DECLARE f RECORD;
  BEGIN
    FOR f IN SELECT * FROM (VALUES
      ('consultant_journal','consultant_id','consultant_journal_consultant_id_fkey','profiles'),
      ('consultant_notes','consultant_id','consultant_notes_consultant_id_fkey','profiles'),
      ('consultant_goals','consultant_id','consultant_goals_consultant_id_fkey','profiles'),
      ('consultant_meetings','consultant_id','consultant_meetings_consultant_id_fkey','profiles'),
      ('consultant_placements','consultant_id','consultant_placements_consultant_id_fkey','profiles'),
      ('consultant_work_placements','consultant_id','consultant_work_placements_consultant_id_fkey','profiles'),
      ('consultant_work_placement_followups','consultant_id','consultant_work_placement_followups_consultant_id_fkey','profiles'),
      ('shared_jobs','consultant_id','shared_jobs_consultant_id_fkey','auth.users'),
      ('activity_plans','consultant_id','activity_plans_consultant_id_fkey','auth.users'),
      ('consultant_consents','consultant_id','consultant_consents_consultant_id_fkey','profiles'),
      ('participant_data_sharing','consultant_id','participant_data_sharing_consultant_id_fkey','profiles'),
      ('consultant_requests','consultant_id','consultant_requests_consultant_id_fkey','profiles'),
      ('consultant_participants','assigned_by','consultant_participants_assigned_by_fkey','profiles'),
      ('sta_absences','reported_by','sta_absences_reported_by_fkey','profiles'),
      ('sta_assessments','performed_by','sta_assessments_performed_by_fkey','profiles'),
      ('sta_assessments','signed_by_at_id','sta_assessments_signed_by_at_id_fkey','profiles'),
      ('sta_documents','submitted_by','sta_documents_submitted_by_fkey','profiles'),
      ('sta_quick_notes','author_id','sta_quick_notes_author_id_fkey','profiles'),
      ('sta_workplace_followups','consultant_id','sta_workplace_followups_consultant_id_fkey','profiles'),
      ('sta_enrollments','consultant_id','sta_enrollments_consultant_id_fkey','profiles')
    ) AS v(tabell, kolumn, fk, malt)
    LOOP
      EXECUTE format('ALTER TABLE public.%I ALTER COLUMN %I DROP NOT NULL', f.tabell, f.kolumn);
      EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT IF EXISTS %I', f.tabell, f.fk);
      EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES %s(id) ON DELETE SET NULL', f.tabell, f.fk, f.kolumn, f.malt);
    END LOOP;
  END;

  SELECT count(*) INTO fore_journal FROM consultant_journal WHERE participant_id = delt;
  SELECT count(*) INTO fore_mal FROM consultant_goals WHERE participant_id = delt;
  SELECT count(*) INTO fore_moten FROM consultant_meetings WHERE participant_id = delt;
  SELECT count(*) INTO fore_platser FROM consultant_work_placements WHERE participant_id = delt;
  SELECT count(*) INTO fore_uppf FROM consultant_work_placement_followups WHERE placement_id = pid;

  DELETE FROM auth.users WHERE id = kons;

  SELECT count(*) INTO n FROM consultant_journal WHERE participant_id = delt AND consultant_id IS NULL;
  r := r || ' | EFTER: journal ' || fore_journal || '→' || n || ' (NULL-konsulent)';
  SELECT count(*) INTO n FROM consultant_goals WHERE participant_id = delt AND consultant_id IS NULL;
  r := r || ', mål ' || fore_mal || '→' || n;
  SELECT count(*) INTO n FROM consultant_meetings WHERE participant_id = delt AND consultant_id IS NULL;
  r := r || ', möten ' || fore_moten || '→' || n;
  SELECT count(*) INTO n FROM consultant_work_placements WHERE participant_id = delt AND consultant_id IS NULL;
  r := r || ', platser ' || fore_platser || '→' || n;
  SELECT count(*) INTO n FROM consultant_work_placement_followups WHERE placement_id = pid AND consultant_id IS NULL;
  r := r || ', uppföljningar ' || fore_uppf || '→' || n;
  SELECT count(*) INTO n FROM consultant_participants WHERE participant_id = delt;
  r := r || ', relation kvar=' || n || ' (ska vara 0)';
  SELECT count(*) INTO n FROM profiles WHERE id = kons;
  r := r || ', konsulentprofil kvar=' || n || ' (ska vara 0)';
  SELECT count(*) INTO n FROM profiles WHERE id = delt;
  r := r || ', deltagarprofil kvar=' || n || ' (ska vara 1)';

  RAISE EXCEPTION 'PROV-RESULTAT: %', r;
END $$;
