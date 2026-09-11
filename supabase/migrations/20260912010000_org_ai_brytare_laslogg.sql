-- Två avvikelser ur PUB-avtalsutkastet (juridik/PUB-avtal-kommun-UTKAST.md):
--   5. AI-brytare per organisation — kommunen ska kunna stänga AI-funktionerna
--      för alla sina deltagare, inte bara deltagaren själv (art. 21 per person).
--   6. Läslogg deltagaren själv kan se (ROADMAP ÖV1) — vem har öppnat mina uppgifter.
--
-- 1. organizations.ai_enabled (default true). Grinden i client/api/ai.js och
--    supabase/functions/_shared/aiGate.ts läser den med SERVICE ROLE genom en
--    join consultant_participants → organization_members → organizations. Ingen
--    ny funktion behövs (två PostgREST-frågor), så inget rör grants-taket.
--    Deltagaren KAN inte läsa organizations (inte medlem) — därför en vy
--    `my_ai_policy` (ägd av postgres, ingen security_invoker) som ger den
--    inloggade deltagaren svaret på en fråga: gäller en organisationsspärr mig?
-- 2. audit_logs.participant_id + SELECT-policy: deltagaren ser rader om sig
--    själv, men BARA av typen VIEWED_PARTICIPANT_DATA — inte admin-händelser.
--    INSERT-policyn "Aktör loggar egna handlingar" finns redan (konsulent/admin).
--
-- Kör:   npx supabase db query --linked -f supabase/migrations/20260912010000_org_ai_brytare_laslogg.sql
-- Sedan: cd client && npm run schema:refresh && npm run grants:refresh

-- =============================================================================
-- 1. AI-brytare per organisation
-- =============================================================================

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS ai_enabled boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN organizations.ai_enabled IS
  'false = AI-funktionerna är avstängda för alla deltagare kopplade till organisationens konsulenter. Läses av båda AI-grindarna med service role. Sätts av superadmin.';

-- Deltagarens egen läsning: en rad om (och bara om) någon organisation som
-- deltagaren är kopplad till har stängt av AI. Tom = ingen spärr.
CREATE OR REPLACE VIEW my_ai_policy AS
  SELECT DISTINCT o.id AS org_id, o.name AS org_name, o.ai_enabled
  FROM consultant_participants cp
  JOIN organization_members m ON m.user_id = cp.consultant_id
  JOIN organizations o ON o.id = m.org_id
  WHERE cp.participant_id = auth.uid();

ALTER VIEW my_ai_policy OWNER TO postgres;
REVOKE ALL ON my_ai_policy FROM PUBLIC, anon;
GRANT SELECT ON my_ai_policy TO authenticated;

COMMENT ON VIEW my_ai_policy IS
  'Deltagarens vy av organisationens AI-brytare. Körs med ägarens rättigheter, filtrerar på auth.uid().';

-- =============================================================================
-- 2. Läslogg för deltagaren (ÖV1)
-- =============================================================================

ALTER TABLE audit_logs
  ADD COLUMN IF NOT EXISTS participant_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_audit_logs_participant ON audit_logs(participant_id, created_at DESC);

CREATE POLICY "Deltagaren ser vem som öppnat hens uppgifter"
  ON audit_logs FOR SELECT
  USING (participant_id = auth.uid() AND action = 'VIEWED_PARTICIPANT_DATA');

COMMENT ON COLUMN audit_logs.participant_id IS
  'ÖV1: deltagaren en händelse handlar om. Sätts av konsulentvyn vid VIEWED_PARTICIPANT_DATA; deltagaren har SELECT på just de raderna.';

-- VERIFIERING (som authenticated i rullad-tillbaka transaktion):
--   deltagare kopplad till org med ai_enabled=false: select * from my_ai_policy → 1 rad, ai_enabled=false
--   deltagare utan spärr: 0 rader eller ai_enabled=true
--   konsulent: insert into audit_logs (user_id, action, resource_type, resource_id, participant_id) → 1
--   deltagaren: select count(*) from audit_logs where action='VIEWED_PARTICIPANT_DATA' → 1
--   deltagaren: select count(*) from audit_logs (alla) → bara egna VIEWED-rader, inte admin-rader
