-- ============================================================================
-- KÖRD 2026-09-27 (del av de kritiska rättelserna, Mikaels "ja kör")
-- ============================================================================
-- Filnamnet har prefixet PENDING_ med flit. Döp om till
-- `20260927xxxxxx_my_ai_policy_org_kind.sql` när den godkänts och körts, och
-- kör `npm run schema:refresh` + `npm run grants:refresh` i samma commit.
--
-- Additiv: en kolumn läggs till SIST i vyn. Inga rader, inga RLS-policyer och
-- inga rättigheter ändras. Risk: låg.
-- ============================================================================
--
-- Vad: vyn `my_ai_policy` får kolumnen `org_kind` (organizations.kind).
--
-- Varför (RD3, rollspelet 2026-09-27): Sara, deltagare hos Demoleverantör
-- (Rusta och matcha), fick i Min vecka och på närvarointyget "kommunens krav
-- enligt socialtjänstlagen" och "visa för din handläggare på försörjningsstöd".
-- Deltagaren behöver veta vilken sorts organisation planen kommer från, men
-- hon kan inte läsa det i dag — verifierat mot prod 2026-09-27:
--   * `organizations` har SELECT-policyerna "Medlem ser sin organisation"
--     (organization_members.user_id = auth.uid()) och "Personal läser
--     företagskonton" (kind = 'arbetsgivare'). En deltagare är ingen medlem.
--   * `my_ai_policy` (definierad i 20260913003000_my_ai_policy_is_demo.sql)
--     ger org_id, org_name, ai_enabled, is_demo — men inte kind.
--   * `activity_plans.forsorjningshinder` avgör inget: Sara har NULL, och en
--     kommunplan kan också ha NULL.
--   * `profiles.program` är NULL för både Anna (kommun) och Sara (leverantör).
-- Vyn är den väg deltagaren redan har till sin organisations uppgifter
-- (närvarointyget läser org_name ur den), så kolumnen läggs där i stället för
-- att öppna `organizations` för deltagare.
--
-- Klienten fungerar före och efter körningen: den läser `select('*')` och
-- tolkar en saknad `org_kind` som "okänt" → neutral text, aldrig kommunens
-- juridik (components/minvecka/planensRegelverk.ts).
--
-- Verifiera efteråt (som Sara, eller med SET request.jwt.claims):
--   select org_name, org_kind from my_ai_policy;
--   → "Demoleverantör (påhittade personer)" | leverantor
-- ============================================================================

CREATE OR REPLACE VIEW public.my_ai_policy AS
SELECT DISTINCT
  o.id         AS org_id,
  o.name       AS org_name,
  o.ai_enabled,
  o.is_demo,
  o.kind       AS org_kind
FROM consultant_participants cp
JOIN organization_members m ON m.user_id = cp.consultant_id
JOIN organizations o ON o.id = m.org_id
WHERE cp.participant_id = auth.uid();

-- CREATE OR REPLACE behåller rättigheterna; upprepat här så filen står för sig
-- själv. anon har ingen rätt (20260924_sak_definervyer_anon.sql).
REVOKE ALL ON public.my_ai_policy FROM anon;
GRANT SELECT ON public.my_ai_policy TO authenticated;

COMMENT ON COLUMN public.my_ai_policy.org_kind IS
  'organizations.kind för deltagarens konsulenters organisationer — styr om Min vecka talar om kommunens aktivitetskrav eller Rusta och matcha (RD3, 2026-09-27).';
