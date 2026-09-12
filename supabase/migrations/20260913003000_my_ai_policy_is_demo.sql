-- KM12 (8) / PG26 (2026-09-12): deltagare i en demoorganisation ska se demobannern.
-- DemoBanner läste bara organization_members (personal). Vyn my_ai_policy går
-- redan kedjan consultant_participants → organization_members → organizations för
-- deltagaren; en kolumn till räcker. Samma SELECT-rättigheter som förut (vyn är
-- security invoker och filtrerar på auth.uid()).
CREATE OR REPLACE VIEW public.my_ai_policy AS
 SELECT DISTINCT o.id AS org_id,
    o.name AS org_name,
    o.ai_enabled,
    o.is_demo
   FROM consultant_participants cp
     JOIN organization_members m ON m.user_id = cp.consultant_id
     JOIN organizations o ON o.id = m.org_id
  WHERE cp.participant_id = auth.uid();
