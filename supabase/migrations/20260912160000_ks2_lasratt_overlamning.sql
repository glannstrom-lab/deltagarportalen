-- KS2 = b (beslut Mikael 2026-09-12): läsrätt efter överlämning
--
-- Bakgrund. KS2 (2026-08-31) band konsulentens ALL-policy på consultant_journal,
-- consultant_goals och consultant_work_placements till (consultant_id = auth.uid())
-- OCH en aktiv rad i consultant_participants. Vid en överlämning (vyn
-- organization_handover, pass 7) flyttas cp-raden till den nya konsulenten men
-- raderna behåller consultant_id = den gamla. Effekten var läge c: låst för båda.
--
-- consultant_participants har ingen historik (bara den aktiva raden; assigned_at,
-- assigned_by), så "vem hade deltagaren förut" går INTE att härleda ur datan.
-- Därför:
--   LÄSA  = aktiv relation till deltagaren (oavsett vem som skrev raden)
--   SKRIVA (INSERT/UPDATE/DELETE) = aktiv relation OCH raden är din egen
--            (consultant_id = auth.uid())
-- Den gamla konsulenten har ingen aktiv relation → ser inget. Den nya kan läsa
-- allt, skriver nytt i eget namn, och kan varken ändra eller radera det gamla.
--
-- consultant_meetings hade INGEN relationskontroll alls (bara consultant_id =
-- auth.uid()) — en uppsagd/överlämnad konsulent behöll sina möten för alltid.
-- Samma mönster läggs där. consultant_work_placement_followups gick via
-- placeringens consultant_id och låstes därför också; nu via placeringens
-- deltagare.
--
-- Radantal i prod före körning (2026-09-12): journal 0, goals 0, meetings 0,
-- placements 0, followups 0. Ändringen är riskfri för data; bevisad med prov i
-- transaktion (se rapporten i ROADMAP).
--
-- Kör: npx supabase db query --linked -f supabase/migrations/20260912160000_ks2_lasratt_overlamning.sql

-- ---------------------------------------------------------------------------
-- Hjälpfunktion: aktiv relation till deltagaren. STABLE, SECURITY INVOKER —
-- läser consultant_participants under anroparens egna rättigheter (konsulenten
-- ser sina egna kopplingar). Ingen definer, ingen EXECUTE att revokera.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.har_aktiv_relation(p_participant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM consultant_participants cp
    WHERE cp.consultant_id = auth.uid()
      AND cp.participant_id = p_participant_id
  );
$$;

-- ---------------------------------------------------------------------------
-- consultant_journal
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Consultant har access till aktiva deltagares journal" ON consultant_journal;

CREATE POLICY "KS2b: konsulent läser aktiva deltagares journal"
  ON consultant_journal FOR SELECT
  USING (public.har_aktiv_relation(participant_id));

CREATE POLICY "KS2b: konsulent skriver egen journalrad"
  ON consultant_journal FOR INSERT
  WITH CHECK (consultant_id = auth.uid() AND public.har_aktiv_relation(participant_id));

CREATE POLICY "KS2b: konsulent ändrar bara egen journalrad"
  ON consultant_journal FOR UPDATE
  USING (consultant_id = auth.uid() AND public.har_aktiv_relation(participant_id))
  WITH CHECK (consultant_id = auth.uid() AND public.har_aktiv_relation(participant_id));

CREATE POLICY "KS2b: konsulent raderar bara egen journalrad"
  ON consultant_journal FOR DELETE
  USING (consultant_id = auth.uid() AND public.har_aktiv_relation(participant_id));

-- ---------------------------------------------------------------------------
-- consultant_goals
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Consultant har access till aktiva deltagares mål" ON consultant_goals;

CREATE POLICY "KS2b: konsulent läser aktiva deltagares mål"
  ON consultant_goals FOR SELECT
  USING (public.har_aktiv_relation(participant_id));

CREATE POLICY "KS2b: konsulent skapar eget mål"
  ON consultant_goals FOR INSERT
  WITH CHECK (consultant_id = auth.uid() AND public.har_aktiv_relation(participant_id));

CREATE POLICY "KS2b: konsulent ändrar bara eget mål"
  ON consultant_goals FOR UPDATE
  USING (consultant_id = auth.uid() AND public.har_aktiv_relation(participant_id))
  WITH CHECK (consultant_id = auth.uid() AND public.har_aktiv_relation(participant_id));

CREATE POLICY "KS2b: konsulent raderar bara eget mål"
  ON consultant_goals FOR DELETE
  USING (consultant_id = auth.uid() AND public.har_aktiv_relation(participant_id));

-- ---------------------------------------------------------------------------
-- consultant_meetings (hade ingen relationskontroll alls)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Consultants can manage their meetings" ON consultant_meetings;

CREATE POLICY "KS2b: konsulent läser aktiva deltagares möten"
  ON consultant_meetings FOR SELECT
  USING (public.har_aktiv_relation(participant_id));

CREATE POLICY "KS2b: konsulent bokar eget möte"
  ON consultant_meetings FOR INSERT
  WITH CHECK (consultant_id = auth.uid() AND public.har_aktiv_relation(participant_id));

CREATE POLICY "KS2b: konsulent ändrar bara eget möte"
  ON consultant_meetings FOR UPDATE
  USING (consultant_id = auth.uid() AND public.har_aktiv_relation(participant_id))
  WITH CHECK (consultant_id = auth.uid() AND public.har_aktiv_relation(participant_id));

CREATE POLICY "KS2b: konsulent raderar bara eget möte"
  ON consultant_meetings FOR DELETE
  USING (consultant_id = auth.uid() AND public.har_aktiv_relation(participant_id));

-- ---------------------------------------------------------------------------
-- consultant_work_placements
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Konsulent har access till aktiva deltagares platser" ON consultant_work_placements;

CREATE POLICY "KS2b: konsulent läser aktiva deltagares platser"
  ON consultant_work_placements FOR SELECT
  USING (public.har_aktiv_relation(participant_id));

CREATE POLICY "KS2b: konsulent skapar egen plats"
  ON consultant_work_placements FOR INSERT
  WITH CHECK (consultant_id = auth.uid() AND public.har_aktiv_relation(participant_id));

CREATE POLICY "KS2b: konsulent ändrar bara egen plats"
  ON consultant_work_placements FOR UPDATE
  USING (consultant_id = auth.uid() AND public.har_aktiv_relation(participant_id))
  WITH CHECK (consultant_id = auth.uid() AND public.har_aktiv_relation(participant_id));

CREATE POLICY "KS2b: konsulent raderar bara egen plats"
  ON consultant_work_placements FOR DELETE
  USING (consultant_id = auth.uid() AND public.har_aktiv_relation(participant_id));

-- ---------------------------------------------------------------------------
-- consultant_work_placement_followups — via placeringens deltagare, inte dess
-- konsulent. Egen uppföljning = followups.consultant_id = auth.uid().
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Konsulent har access till uppföljningar på aktiva platser" ON consultant_work_placement_followups;

CREATE POLICY "KS2b: konsulent läser uppföljningar på aktiva deltagares platser"
  ON consultant_work_placement_followups FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM consultant_work_placements p
    WHERE p.id = consultant_work_placement_followups.placement_id
      AND public.har_aktiv_relation(p.participant_id)
  ));

CREATE POLICY "KS2b: konsulent skriver egen uppföljning"
  ON consultant_work_placement_followups FOR INSERT
  WITH CHECK (consultant_id = auth.uid() AND EXISTS (
    SELECT 1 FROM consultant_work_placements p
    WHERE p.id = consultant_work_placement_followups.placement_id
      AND public.har_aktiv_relation(p.participant_id)
  ));

CREATE POLICY "KS2b: konsulent ändrar bara egen uppföljning"
  ON consultant_work_placement_followups FOR UPDATE
  USING (consultant_id = auth.uid() AND EXISTS (
    SELECT 1 FROM consultant_work_placements p
    WHERE p.id = consultant_work_placement_followups.placement_id
      AND public.har_aktiv_relation(p.participant_id)
  ))
  WITH CHECK (consultant_id = auth.uid() AND EXISTS (
    SELECT 1 FROM consultant_work_placements p
    WHERE p.id = consultant_work_placement_followups.placement_id
      AND public.har_aktiv_relation(p.participant_id)
  ));

CREATE POLICY "KS2b: konsulent raderar bara egen uppföljning"
  ON consultant_work_placement_followups FOR DELETE
  USING (consultant_id = auth.uid() AND EXISTS (
    SELECT 1 FROM consultant_work_placements p
    WHERE p.id = consultant_work_placement_followups.placement_id
      AND public.har_aktiv_relation(p.participant_id)
  ));
