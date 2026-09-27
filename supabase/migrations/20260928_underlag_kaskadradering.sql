-- 2026-09-28: lämnade underlag stoppade radering av konto, plan och demots nollställning.
--
-- activity_plan_handovers_no_delete (BEFORE DELETE) höjde alltid 42501 — också när
-- raden raderades via ON DELETE CASCADE från activity_plans (plan_id) eller profiles
-- (participant_id). Följder: ett konto med ett lämnat underlag gick inte att radera
-- (art. 17, delete-account och gallringen), och reset_demo_org fastnade när rollspelet
-- 2026-09-27 lämnat ett underlag på en demoplan (upptäckt i torrkörning; nattjobbet
-- 01:00 UTC hade fallerat samma natt).
--
-- Nu: en DIREKT radering av ett underlag är fortfarande förbjuden ("ångra i stället").
-- När planen eller deltagarens profil redan är borta i samma sats (kaskaden körs
-- efter föräldraraden) följer underlaget med.
--
-- Ingen RLS ändras. Körs manuellt: npx supabase db query --linked -f <denna fil>

CREATE OR REPLACE FUNCTION public.activity_plan_handovers_no_delete()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM activity_plans WHERE id = OLD.plan_id)
     OR NOT EXISTS (SELECT 1 FROM profiles WHERE id = OLD.participant_id) THEN
    RETURN OLD;
  END IF;
  RAISE EXCEPTION 'Lämnade underlag raderas inte — ångra i stället' USING ERRCODE = '42501';
END;
$function$;
