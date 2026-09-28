-- FT1 (rollspelet 2026-09-28): en företagsplats markerades aldrig som tillsatt när företaget
-- sa "Vi vill gå vidare". En annan konsulent kunde föreslå en ny deltagare till samma plats
-- (reproducerat i prod: Omar accepterad, sedan Peter föreslagen till "Lagermedarbetare, dagtid").
--
-- En plats är en person (employer_places har ingen kapacitetskolumn). Därför:
--   employer_response → 'interested'  ⇒ platsen 'oppen' → 'tillsatt'
--   ett 'interested' tas tillbaka (declined, eller förslaget dras tillbaka/löper ut)
--   och inget annat förslag på platsen är 'interested' ⇒ 'tillsatt' → 'oppen'
-- Pausade och stängda platser rörs aldrig; det är företagets egna val.
-- Konsulentens platsväljare (PlaceringFormModal) visar redan bara 'oppen'.
--
-- SECURITY DEFINER: svaret skrivs av företaget via vyn employer_proposals (INSTEAD OF),
-- och konsulenten som drar tillbaka ett förslag äger inte platsen. Funktionen ska inte
-- gå att anropa direkt — bara som trigger.

CREATE OR REPLACE FUNCTION public.employer_place_status_from_proposal()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_place uuid;
  v_var_ja boolean;
  v_ar_ja boolean;
BEGIN
  SELECT place_id INTO v_place FROM consultant_work_placements WHERE id = NEW.placement_id;
  IF v_place IS NULL THEN
    RETURN NEW;
  END IF;

  v_ar_ja := NEW.employer_response = 'interested' AND NEW.status NOT IN ('withdrawn', 'expired', 'declined');
  v_var_ja := TG_OP = 'UPDATE'
    AND OLD.employer_response = 'interested' AND OLD.status NOT IN ('withdrawn', 'expired', 'declined');

  IF v_ar_ja AND NOT v_var_ja THEN
    UPDATE employer_places SET status = 'tillsatt' WHERE id = v_place AND status = 'oppen';
  ELSIF v_var_ja AND NOT v_ar_ja THEN
    IF NOT EXISTS (
      SELECT 1
      FROM employer_share_proposals p
      JOIN consultant_work_placements w ON w.id = p.placement_id
      WHERE w.place_id = v_place
        AND p.id <> NEW.id
        AND p.employer_response = 'interested'
        AND p.status NOT IN ('withdrawn', 'expired', 'declined')
    ) THEN
      UPDATE employer_places SET status = 'oppen' WHERE id = v_place AND status = 'tillsatt';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.employer_place_status_from_proposal() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_esp_place_status ON public.employer_share_proposals;
CREATE TRIGGER trg_esp_place_status
  AFTER INSERT OR UPDATE OF employer_response, status ON public.employer_share_proposals
  FOR EACH ROW EXECUTE FUNCTION public.employer_place_status_from_proposal();

-- Engångsrättning: platser som redan har ett aktivt ja men står som öppna.
UPDATE employer_places ep SET status = 'tillsatt'
WHERE ep.status = 'oppen'
  AND EXISTS (
    SELECT 1 FROM employer_share_proposals p
    JOIN consultant_work_placements w ON w.id = p.placement_id
    WHERE w.place_id = ep.id
      AND p.employer_response = 'interested'
      AND p.status NOT IN ('withdrawn', 'expired', 'declined')
  );
