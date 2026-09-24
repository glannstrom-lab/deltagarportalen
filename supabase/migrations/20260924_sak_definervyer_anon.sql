-- ============================================================================
-- VÄNTAR PÅ MIKAELS GODKÄNNANDE — KÖRS INTE AUTOMATISKT
-- ============================================================================
-- Döp om till 20260924xxxxxx_sak_definervyer_anon.sql när den godkänts och
-- körts. Ingen data ändras; bara rättigheter på två vyer.
-- ============================================================================
--
-- ALLVAR: MEDEL (försvar på djupet — ingen läcka i dag).
--
-- Vad: Supabase-advisorn `security_definer_view` (ERROR) listar sju vyer som
-- körs med ägarens (postgres, BYPASSRLS) rättigheter. Alla sju är MEDVETET
-- definer — de är vitlistor som skalar av vad en roll får se (AG6/KM-spåret).
-- Varje vy filtrerar själv på `auth.uid()`, vilket är NULL för anon, så en
-- anon-läsning ger noll rader i dag. De ska alltså INTE göras om till
-- security_invoker (då slutar de fungera — företaget har ingen RLS-väg till
-- underliggande tabeller, det är hela poängen).
--
-- Men två av dem har ALLA rättigheter för `anon`, till skillnad från de fyra
-- organisationsvyerna och my_ai_policy, där anon redan är borttagen:
--
--   select c.relname, has_table_privilege('anon', c.oid, 'SELECT') anon_sel
--     from pg_class c where c.relname in ('employer_placements','employer_proposals',
--       'my_ai_policy','organization_caseload','organization_colleagues','organization_handover');
--     → employer_placements true, employer_proposals true, övriga false
--   (employer_invitations och organization_handover har egna PENDING-filer.)
--
-- Vyerna exponerar deltagares namn, e-post, telefon, CV-sammanfattning,
-- erfarenhet och kompetenser. Den enda spärren mot anon är ett
-- `m.user_id = auth.uid()` djupt inne i en EXISTS. En framtida ändring av
-- vydefinitionen som tappar det villkoret blir en publik läcka direkt, utan
-- att någon grind larmar (`lint:grants` ser inte vyer). Det finns ingen
-- anon-anropare: /foretag kräver inloggning.
--
-- `employer_placements` är inte uppdaterbar (joins, inga triggers), så
-- skrivrättigheterna för authenticated är döda — de tas bort för tydlighet.
-- `employer_proposals` behåller UPDATE för authenticated: INSTEAD OF UPDATE-
-- triggern `employer_proposals_update` är företagets väg att svara och räkna
-- visningar (services/foretagApi.ts:395, :411).
--
-- Risk med åtgärden: låg.
-- ============================================================================

REVOKE ALL ON public.employer_placements FROM anon;
REVOKE ALL ON public.employer_proposals  FROM anon;

REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.employer_placements FROM authenticated;
REVOKE INSERT, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.employer_proposals FROM authenticated;
GRANT SELECT ON public.employer_placements TO authenticated;
GRANT SELECT, UPDATE ON public.employer_proposals TO authenticated;

-- ----------------------------------------------------------------------------
-- VERIFIERING
-- ----------------------------------------------------------------------------
-- select v,
--        has_table_privilege('anon', v, 'SELECT') anon_sel,
--        has_table_privilege('authenticated', v, 'SELECT') auth_sel,
--        has_table_privilege('authenticated', v, 'UPDATE') auth_upd
--   from unnest(array['public.employer_placements','public.employer_proposals']) v;
--   → employer_placements: false, true, false
--   → employer_proposals:  false, true, true
--
-- Röktest: logga in som foretag.demo@example.com → Förslag (lista + öppna ett
-- förslag, svara) och Pågående ska fungera som förut.
-- ============================================================================
