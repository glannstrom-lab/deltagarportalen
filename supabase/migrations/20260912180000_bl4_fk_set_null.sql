-- BL4: deltagarens data ska överleva att konsulenten raderar sitt konto
--
-- ⚠️ INTE KÖRD MOT PROD. Kräver Mikaels ja (migration mot prod, rör FK-regler
-- på 18 tabeller). Bevisad i rollback-transaktion: e2e/bl4-fk-prov.sql.
--
-- Mätt i prod 2026-09-12 (pg_constraint, confdeltype): 14 tabeller har
-- ON DELETE CASCADE på konsulentens id, sju har NO ACTION/RESTRICT. Konsekvens
-- i dag när en konsulent raderas (profiles cascadar från auth.users):
--   • CASCADE tar med sig deltagarägd data: journal, mål, möten, anteckningar,
--     placeringar, praktikplatser, delade jobb, aktivitetsplaner (kommunens!),
--     samtyckesbevis (art. 7) och delningsinställningar. Deltagarens art. 15-data
--     följer med konsulentens art. 17-radering.
--   • NO ACTION/RESTRICT (followups, assigned_by, sta_*) gör att raderingen i
--     stället FALLER om konsulenten någonsin rört de tabellerna — så dagens
--     execute_scheduled_account_deletions()/execute_inactive_account_retention()
--     loggar ACCOUNT_DELETION_FAILED för varje konsulent med historik.
--
-- Beslut per tabell (deltagarägt = SET NULL, konsulentens eget = CASCADE):
--   SET NULL (kräver DROP NOT NULL där kolumnen är NOT NULL):
--     consultant_journal, consultant_notes, consultant_goals, consultant_meetings,
--     consultant_placements, consultant_work_placements,
--     consultant_work_placement_followups (var NO ACTION), shared_jobs,
--     activity_plans, consultant_consents (art. 7-bevis), participant_data_sharing,
--     consultant_requests, consultant_participants.assigned_by (var NO ACTION),
--     sta_absences.reported_by, sta_assessments.performed_by/signed_by_at_id,
--     sta_documents.submitted_by, sta_quick_notes.author_id,
--     sta_workplace_followups.consultant_id, sta_enrollments.consultant_id (var RESTRICT)
--   CASCADE (oförändrat): consultant_participants.consultant_id (relationen),
--     consultant_goal_templates, consultant_job_collections, consultant_settings,
--     invitations (consultant_id + invited_by — konsulentens egna utskick).
--
-- Efter migrationen: en rad med consultant_id NULL är oläsbar för konsulenter
-- (KS2 b-policyerna kräver aktiv relation + consultant_id = auth.uid() för
-- skrivning, aktiv relation för läsning — läsning via relation fungerar även
-- när consultant_id är NULL) men finns kvar för deltagaren (deltagarpolicyerna
-- filtrerar på participant_id). Det är beslutets avsikt: historiken orörd.
-- execute_account_deletion_immediate() och execute_scheduled_account_deletions()
-- fortsätter att lita på CASCADE för konsulentens eget; för deltagarägt sker
-- nu SET NULL i stället för radering, och NO ACTION-blockeringarna försvinner.
--
-- Kör: npx supabase db query --linked -f supabase/migrations/20260912180000_bl4_fk_set_null.sql
-- Efteråt: cd client && npm run schema:refresh (nullability ändras) && npm run grants:refresh

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT * FROM (VALUES
      ('consultant_journal',                  'consultant_id',   'consultant_journal_consultant_id_fkey',                  'profiles'),
      ('consultant_notes',                    'consultant_id',   'consultant_notes_consultant_id_fkey',                    'profiles'),
      ('consultant_goals',                    'consultant_id',   'consultant_goals_consultant_id_fkey',                    'profiles'),
      ('consultant_meetings',                 'consultant_id',   'consultant_meetings_consultant_id_fkey',                 'profiles'),
      ('consultant_placements',               'consultant_id',   'consultant_placements_consultant_id_fkey',               'profiles'),
      ('consultant_work_placements',          'consultant_id',   'consultant_work_placements_consultant_id_fkey',          'profiles'),
      ('consultant_work_placement_followups', 'consultant_id',   'consultant_work_placement_followups_consultant_id_fkey', 'profiles'),
      ('shared_jobs',                         'consultant_id',   'shared_jobs_consultant_id_fkey',                         'auth.users'),
      ('activity_plans',                      'consultant_id',   'activity_plans_consultant_id_fkey',                      'auth.users'),
      ('consultant_consents',                 'consultant_id',   'consultant_consents_consultant_id_fkey',                 'profiles'),
      ('participant_data_sharing',            'consultant_id',   'participant_data_sharing_consultant_id_fkey',            'profiles'),
      ('consultant_requests',                 'consultant_id',   'consultant_requests_consultant_id_fkey',                 'profiles'),
      ('consultant_participants',             'assigned_by',     'consultant_participants_assigned_by_fkey',               'profiles'),
      ('sta_absences',                        'reported_by',     'sta_absences_reported_by_fkey',                          'profiles'),
      ('sta_assessments',                     'performed_by',    'sta_assessments_performed_by_fkey',                      'profiles'),
      ('sta_assessments',                     'signed_by_at_id', 'sta_assessments_signed_by_at_id_fkey',                   'profiles'),
      ('sta_documents',                       'submitted_by',    'sta_documents_submitted_by_fkey',                        'profiles'),
      ('sta_quick_notes',                     'author_id',       'sta_quick_notes_author_id_fkey',                         'profiles'),
      ('sta_workplace_followups',             'consultant_id',   'sta_workplace_followups_consultant_id_fkey',             'profiles'),
      ('sta_enrollments',                     'consultant_id',   'sta_enrollments_consultant_id_fkey',                     'profiles')
    ) AS v(tabell, kolumn, fk, malt)
  LOOP
    -- Kolumnen måste tillåta NULL för att SET NULL ska kunna avfyras.
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN %I DROP NOT NULL', r.tabell, r.kolumn);
    -- Byt regel: samma namn, samma mål, ON DELETE SET NULL.
    EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT IF EXISTS %I', r.tabell, r.fk);
    EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES %s(id) ON DELETE SET NULL',
                   r.tabell, r.fk, r.kolumn, r.malt);
  END LOOP;
END $$;

-- Verifiering (förväntat: 20 rader, alla deltype 'n'):
--   select conrelid::regclass, conname, confdeltype from pg_constraint
--   where conname in ('consultant_journal_consultant_id_fkey', … ) order by 1;
