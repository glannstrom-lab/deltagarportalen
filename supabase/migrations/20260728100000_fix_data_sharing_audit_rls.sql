-- UX9 (prod-persona-testet 2026-07-27): hälsodatasamtycket har aldrig gått att spara.
--
-- Symptom i prod: varje försök att spara "Datadelning med konsulent" gav
--   403 42501 "new row violates row-level security policy for table data_sharing_audit"
-- och deltagaren såg "Kunde inte spara inställningar".
--
-- Orsak: triggern participant_data_sharing_audit kör audit_data_sharing_change(),
-- som var LANGUAGE plpgsql UTAN SECURITY DEFINER. Den kördes alltså som
-- `authenticated`. data_sharing_audit har RLS på och exakt två policies — båda
-- SELECT, ingen INSERT — så triggerns egen auditrad kunde aldrig skrivas, och
-- hela transaktionen rullades tillbaka.
--
-- Bevis som avgjorde saken: participant_data_sharing = 0 rader och
-- data_sharing_audit = 0 rader, sedan tabellerna skapades 2026-03-28. Ingen
-- deltagare har någonsin kunnat slå på ELLER stänga av delning av sina
-- hälso-/välmåendedata. GDPR-mässigt en samtyckesmekanism som inte fungerar.
--
-- Åtgärd: SECURITY DEFINER på triggerfunktionen, så auditraden skrivs som
-- funktionens ägare. Det är standardmönstret för audit-loggar: deltagaren ska
-- kunna LÄSA sin egen auditrad (policyerna finns) men aldrig skriva den
-- direkt — därför läggs medvetet INGEN INSERT-policy för `authenticated`.
-- search_path är redan pinnad till 'public' och behålls (obligatoriskt för
-- SECURITY DEFINER, annars är funktionen sökvägsmanipulerbar).
--
-- Kroppen är oförändrad — kopierad ordagrant ur prod via pg_get_functiondef.

CREATE OR REPLACE FUNCTION public.audit_data_sharing_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO data_sharing_audit (
    participant_id, consultant_id, action, share_health_data, share_wellness_data
  )
  VALUES (
    COALESCE(NEW.participant_id, OLD.participant_id),
    COALESCE(NEW.consultant_id, OLD.consultant_id),
    CASE
      WHEN TG_OP = 'DELETE' THEN 'revoked'
      WHEN TG_OP = 'INSERT' THEN 'granted'
      ELSE 'modified'
    END,
    COALESCE(NEW.share_health_data, OLD.share_health_data),
    COALESCE(NEW.share_wellness_data, OLD.share_wellness_data)
  );

  -- Update the updated_at timestamp on modifications
  IF TG_OP = 'UPDATE' THEN
    NEW.updated_at := NOW();
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$function$;
