-- ============================================================================
-- VÄNTAR PÅ MIKAELS GODKÄNNANDE — KÖRS INTE AUTOMATISKT
-- ============================================================================
-- Döp om till 20260924xxxxxx_sak_trigger_search_path.sql när den godkänts och
-- körts. Ingen data ändras.
-- ============================================================================
--
-- ALLVAR: LÅG (hygien — stänger advisorn function_search_path_mutable, 4 st).
--
-- Vad: fyra triggerfunktioner saknar `SET search_path`. Alla fyra är
-- SECURITY INVOKER (prosecdef = false) och körs bara som triggers, så en
-- anropare kan inte styra deras sökväg på något sätt som ger mer än hen redan
-- har. Men två av dem är säkerhetsvakter:
--   activity_sessions_participant_guard  — deltagaren får bara ändra incheckning/frånvaro
--   organizations_chef_guard             — chef får bara ändra ai_enabled
-- och `organizations_chef_guard` anropar `is_admin_or_superadmin()` OKVALIFICERAT.
-- Med en muterbar sökväg är det sökvägen i sessionen som avgör vilken funktion
-- som körs. Av de 116 funktionerna i public är 87 definer, och alla 87 har
-- redan `search_path=public`; av de 29 invoker-funktionerna saknar exakt de
-- här fyra inställningen.
--
-- Bevis (2026-09-24):
--   select proname, prosecdef, proconfig from pg_proc
--    where proname in ('activity_sessions_participant_guard','organizations_chef_guard',
--                      'activity_plan_handovers_guard','activity_plan_handovers_no_delete');
--     → alla fyra: prosecdef = false, proconfig = null
--
-- Kropparna är lästa: de använder bara public-tabeller, auth.uid(), now(),
-- to_jsonb och is_admin_or_superadmin() — allt nås med search_path = public
-- (pg_catalog söks alltid först implicit).
--
-- Risk: mycket låg. Samma inställning som resten av projektets funktioner.
-- ============================================================================

ALTER FUNCTION public.activity_sessions_participant_guard() SET search_path = public;
ALTER FUNCTION public.organizations_chef_guard()            SET search_path = public;
ALTER FUNCTION public.activity_plan_handovers_guard()       SET search_path = public;
ALTER FUNCTION public.activity_plan_handovers_no_delete()   SET search_path = public;

-- ----------------------------------------------------------------------------
-- VERIFIERING
-- ----------------------------------------------------------------------------
-- select proname, proconfig from pg_proc
--  where pronamespace = 'public'::regnamespace
--    and proname in ('activity_sessions_participant_guard','organizations_chef_guard',
--                    'activity_plan_handovers_guard','activity_plan_handovers_no_delete');
--   → alla fyra: {search_path=public}
--
-- Advisorn (MCP get_advisors type=security): function_search_path_mutable → 0 fynd.
-- Röktest: e2e/km-aktivitetskrav-prod.cjs (pass, frånvaro, underlag) ska gå grönt.
-- ============================================================================
