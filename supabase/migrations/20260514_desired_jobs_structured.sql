-- =============================================================================
-- profiles.desired_jobs: backfill från text-array till strukturerad JSON
-- =============================================================================
-- Före: jsonb innehöll string[] (rena yrkestitlar som fritext)
-- Efter: jsonb innehåller DesiredOccupation[] = { label, priority, conceptId?, ssyk? }
--
-- Bakåtkompatibilitet sker även i app-lagret (userApi normaliserar), så denna
-- migration är "best effort" — om någon rad har gammalt format kommer det fungera
-- i UI, men nya skrivningar använder strukturerat format.

DO $$
DECLARE
  r RECORD;
  new_jobs jsonb;
  item jsonb;
  idx int;
BEGIN
  FOR r IN
    SELECT id, desired_jobs
    FROM profiles
    WHERE desired_jobs IS NOT NULL
      AND jsonb_typeof(desired_jobs) = 'array'
      AND jsonb_array_length(desired_jobs) > 0
  LOOP
    new_jobs := '[]'::jsonb;
    idx := 1;

    -- Itererar genom varje element och konverterar strängar → {label, priority}
    FOR item IN SELECT * FROM jsonb_array_elements(r.desired_jobs)
    LOOP
      IF jsonb_typeof(item) = 'string' THEN
        new_jobs := new_jobs || jsonb_build_array(jsonb_build_object(
          'label', trim(both '"' from item::text),
          'priority', idx
        ));
        idx := idx + 1;
      ELSIF jsonb_typeof(item) = 'object' AND item ? 'label' THEN
        -- Redan strukturerat — säkerställ priority
        IF NOT (item ? 'priority') THEN
          new_jobs := new_jobs || jsonb_build_array(item || jsonb_build_object('priority', idx));
        ELSE
          new_jobs := new_jobs || jsonb_build_array(item);
        END IF;
        idx := idx + 1;
      END IF;
    END LOOP;

    UPDATE profiles SET desired_jobs = new_jobs WHERE id = r.id;
  END LOOP;
END $$;

COMMENT ON COLUMN profiles.desired_jobs IS
  'Önskade yrken som DesiredOccupation[]: { label, priority, conceptId?, ssyk? }. Priority 1=högsta. Max 10 element.';
