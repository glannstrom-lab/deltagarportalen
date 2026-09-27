-- RK38 (rollspelet 2026-09-27): journalen enligt socialtjänstlagen.
-- INTE KÖRD MOT PROD — väntar på Mikaels ja. Byt namn (ta bort PENDING_) när den körts.
--
-- Premiss mätt i prod 2026-09-27 (läsning):
--   · consultant_journal har id, consultant_id, participant_id, content,
--     category, created_at — inget klockslag för kontakten (bara när raden
--     skrevs), ingen kontaktform, ingen updated_at och ingen historik. En
--     UPDATE skriver över texten; en DELETE tar bort den spårlöst.
--   · Policyer (KS2b): konsulenten läser aktiva deltagares journal
--     (har_aktiv_relation), skriver/ändrar/raderar bara egna rader; deltagaren
--     läser sina egna rader (alla kategorier, beslut Mikael 2026-08-31).
--   · FK: consultant_id → profiles ON DELETE SET NULL (en UPDATE när en
--     konsulent tas bort), participant_id → profiles ON DELETE CASCADE.
--   · Inga triggers på tabellen. 10 rader.
--   · consultant_dashboard_participants.last_note_date = max(created_at)
--     (security_invoker = true).
--
-- Vad ändras (additivt):
--   1. Fyra nullable kolumner på consultant_journal:
--        occurred_at   när kontakten skedde (null = samma som created_at)
--        contact_form  telefon/besok/video/meddelande/annat (null = ingen
--                      kontakt angiven, t.ex. en egen anteckning)
--        updated_at, updated_by  senaste ändring (sätts av triggern)
--   2. Ny tabell consultant_journal_revisions: originalet bevaras. Varje ändring
--      av text, kategori, klockslag eller kontaktform, och varje radering,
--      sparar raden SÅ SOM DEN VAR före ändringen, med vem som ändrade och när.
--      Ingen FK till consultant_journal (en raderad rad ska ha kvar sin
--      historik); participant_id → profiles ON DELETE CASCADE så historiken
--      gallras med kontot, precis som journalen.
--      RLS: SELECT för konsulent med aktiv relation (har_aktiv_relation) och
--      för deltagaren själv (samma insyn som journalen). INGA skrivpolicyer —
--      bara triggern (SECURITY DEFINER) skriver. anon har ingen rättighet.
--   3. Triggern consultant_journal_historik (BEFORE UPDATE OR DELETE):
--      skyddar författare, deltagare och skapad-tid mot ändring, sätter
--      updated_at/updated_by och skriver versionen. En UPDATE som inte rör
--      innehållet (t.ex. SET NULL på consultant_id när en konsulent tas bort)
--      går igenom orörd. En radering som följer av att deltagarens konto tas
--      bort (profilen är redan borta) sparar ingen historik — kontot gallras.
--   4. consultant_dashboard_participants.last_note_date räknar kontaktens
--      klockslag (coalesce(occurred_at, created_at)) — ett samtal i går som
--      journalförs i dag är en kontakt i går.
--
-- Klienten fungerar före körningen: JOURNAL_SOL_KOLUMNER = false i
-- client/src/services/journalSol.ts döljer klockslag, kontaktform och
-- ändringsloggen och skickar aldrig de nya kolumnerna.
--
-- Efter körning (i ordning):
--   1. cd client && npm run schema:refresh && npm run grants:refresh
--   2. client/src/services/journalSol.ts: JOURNAL_SOL_KOLUMNER = true, och
--      byt REVISIONSTABELL-konstanten mot en literal i .from() så lint:schema
--      täcker tabellen.
--   3. ParticipantDetailPage (spår B): sprid `...journalKolumner(extra)` i
--      insert/update och `...journalMetaFranRad(j)` i mappningen — se
--      journalSol.ts.
--   4. Verifiera:
--      select column_name from information_schema.columns
--        where table_name = 'consultant_journal' and column_name in
--        ('occurred_at','contact_form','updated_at','updated_by');   → 4 rader
--      select has_function_privilege('anon', 'public.consultant_journal_historik()', 'EXECUTE');  → false
--      select relrowsecurity from pg_class where relname = 'consultant_journal_revisions';  → true

BEGIN;

-- 1. Kolumner ---------------------------------------------------------------
ALTER TABLE public.consultant_journal
  ADD COLUMN IF NOT EXISTS occurred_at  timestamptz,
  ADD COLUMN IF NOT EXISTS contact_form text,
  ADD COLUMN IF NOT EXISTS updated_at   timestamptz,
  ADD COLUMN IF NOT EXISTS updated_by   uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'consultant_journal_contact_form_check') THEN
    ALTER TABLE public.consultant_journal
      ADD CONSTRAINT consultant_journal_contact_form_check
      CHECK (contact_form IS NULL OR contact_form IN ('telefon', 'besok', 'video', 'meddelande', 'annat'));
  END IF;
END $$;

COMMENT ON COLUMN public.consultant_journal.occurred_at IS 'RK38: när kontakten skedde. NULL = samma som created_at.';
COMMENT ON COLUMN public.consultant_journal.contact_form IS 'RK38: telefon/besok/video/meddelande/annat. NULL = ingen kontaktform angiven.';
COMMENT ON COLUMN public.consultant_journal.updated_at IS 'RK38: senaste ändring av innehållet (sätts av triggern consultant_journal_historik).';
COMMENT ON COLUMN public.consultant_journal.updated_by IS 'RK38: vem som ändrade senast (sätts av triggern).';

-- 2. Historiktabellen -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.consultant_journal_revisions (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_id          uuid NOT NULL,
  participant_id      uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  author_id           uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  action              text NOT NULL CHECK (action IN ('update', 'delete')),
  content             text NOT NULL,
  category            varchar,
  occurred_at         timestamptz,
  contact_form        text,
  original_created_at timestamptz,
  version_from        timestamptz,
  changed_by          uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  changed_at          timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.consultant_journal_revisions IS 'RK38: tidigare versioner av journalrader (ändrade eller raderade). Skrivs bara av triggern consultant_journal_historik.';

CREATE INDEX IF NOT EXISTS idx_journal_revisions_journal ON public.consultant_journal_revisions (journal_id, changed_at);
CREATE INDEX IF NOT EXISTS idx_journal_revisions_participant ON public.consultant_journal_revisions (participant_id);

ALTER TABLE public.consultant_journal_revisions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "RK38: konsulent läser aktiva deltagares journalhistorik" ON public.consultant_journal_revisions;
CREATE POLICY "RK38: konsulent läser aktiva deltagares journalhistorik"
  ON public.consultant_journal_revisions FOR SELECT TO authenticated
  USING (public.har_aktiv_relation(participant_id));

DROP POLICY IF EXISTS "RK38: deltagaren läser sin journalhistorik" ON public.consultant_journal_revisions;
CREATE POLICY "RK38: deltagaren läser sin journalhistorik"
  ON public.consultant_journal_revisions FOR SELECT TO authenticated
  USING (participant_id = (SELECT auth.uid()));

REVOKE ALL ON public.consultant_journal_revisions FROM PUBLIC, anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.consultant_journal_revisions FROM authenticated;
GRANT SELECT ON public.consultant_journal_revisions TO authenticated;

-- 3. Triggern ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.consultant_journal_historik()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- Inget i innehållet ändras (t.ex. ON DELETE SET NULL på consultant_id): släpp igenom.
    IF NEW.content      IS NOT DISTINCT FROM OLD.content
       AND NEW.category     IS NOT DISTINCT FROM OLD.category
       AND NEW.occurred_at  IS NOT DISTINCT FROM OLD.occurred_at
       AND NEW.contact_form IS NOT DISTINCT FROM OLD.contact_form THEN
      RETURN NEW;
    END IF;
    -- Författare, deltagare och skapad-tid är historik — de ändras aldrig.
    NEW.consultant_id  := OLD.consultant_id;
    NEW.participant_id := OLD.participant_id;
    NEW.created_at     := OLD.created_at;
    NEW.updated_at     := now();
    NEW.updated_by     := auth.uid();
    INSERT INTO public.consultant_journal_revisions
      (journal_id, participant_id, author_id, action, content, category, occurred_at, contact_form,
       original_created_at, version_from, changed_by)
    VALUES
      (OLD.id, OLD.participant_id, OLD.consultant_id, 'update', OLD.content, OLD.category, OLD.occurred_at, OLD.contact_form,
       OLD.created_at, coalesce(OLD.updated_at, OLD.created_at), auth.uid());
    RETURN NEW;
  END IF;

  -- DELETE. Följer raderingen av att deltagarens konto tas bort är profilen
  -- redan borta i samma sats — då gallras historiken med kontot i stället.
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = OLD.participant_id) THEN
    INSERT INTO public.consultant_journal_revisions
      (journal_id, participant_id, author_id, action, content, category, occurred_at, contact_form,
       original_created_at, version_from, changed_by)
    VALUES
      (OLD.id, OLD.participant_id, OLD.consultant_id, 'delete', OLD.content, OLD.category, OLD.occurred_at, OLD.contact_form,
       OLD.created_at, coalesce(OLD.updated_at, OLD.created_at), auth.uid());
  END IF;
  RETURN OLD;
END;
$$;

-- En triggerfunktion anropas aldrig direkt. PUBLIC har EXECUTE som standard —
-- REVOKE mot bara anon gör ingenting (CLAUDE.md, lärdomen 2026-08-04).
REVOKE EXECUTE ON FUNCTION public.consultant_journal_historik() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS consultant_journal_historik ON public.consultant_journal;
CREATE TRIGGER consultant_journal_historik
  BEFORE UPDATE OR DELETE ON public.consultant_journal
  FOR EACH ROW EXECUTE FUNCTION public.consultant_journal_historik();

-- 4. Senaste kontakt räknar kontaktens klockslag ------------------------------
-- Samma definition som i prod (pg_get_viewdef 2026-09-27); bara last_note_date ändras.
CREATE OR REPLACE VIEW public.consultant_dashboard_participants
WITH (security_invoker = true) AS
 SELECT cp.consultant_id,
    p.id AS participant_id,
    p.id AS user_id,
    p.email,
    p.first_name,
    p.last_name,
    p.phone,
    p.avatar_url,
    p.status,
    p.created_at AS registered_at,
    cp.assigned_at,
    cp.priority,
    cp.tags,
    cp.last_contact_at,
    cp.next_meeting_scheduled,
    cp.notes AS consultant_notes,
        CASE
            WHEN c.id IS NOT NULL THEN true
            ELSE false
        END AS has_cv,
    c.ats_score,
    c.updated_at AS cv_updated_at,
        CASE
            WHEN ir.id IS NOT NULL THEN true
            ELSE false
        END AS completed_interest_test,
    ir.holland_code,
    COALESCE(( SELECT count(*) AS count
           FROM saved_jobs
          WHERE saved_jobs.user_id = p.id), 0::bigint) AS saved_jobs_count,
    COALESCE(( SELECT count(*) AS count
           FROM consultant_journal
          WHERE consultant_journal.participant_id = p.id), 0::bigint) AS notes_count,
    ( SELECT max(COALESCE(consultant_journal.occurred_at, consultant_journal.created_at)) AS max
           FROM consultant_journal
          WHERE consultant_journal.participant_id = p.id) AS last_note_date,
    p.updated_at AS last_login
   FROM consultant_participants cp
     JOIN profiles p ON cp.participant_id = p.id
     LEFT JOIN cvs c ON c.user_id = p.id
     LEFT JOIN interest_results ir ON ir.user_id = p.id
  WHERE cp.consultant_id = auth.uid() OR is_admin_or_superadmin();

COMMIT;
