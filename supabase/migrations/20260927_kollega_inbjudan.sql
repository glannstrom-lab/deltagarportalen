-- ============================================================================
-- KÖRD 2026-09-27 efter Mikaels ja ("ja kör"). Edge + klient deployade först.
-- Torrkörd i en återrullad transaktion mot prod 2026-09-27:
--   npx supabase db query --linked -f e2e/kollega-inbjudan-prov.sql
-- Provfilen bär en ORDAGRANN kopia av allt mellan BEGIN; och COMMIT; här.
-- ============================================================================
--
-- KOLLEGA-INBJUDAN VIA MEJL (Inställningar → Din organisation → Lägg till kollega)
--
-- Behov: chef/admin i en kommun/leverantör kan bara lägga till en kollega som
-- redan har ett konto (organization_colleagues_iud svarar P0002 "Ingen användare
-- med e-posten …"). Saknas kontot ska chefen kunna skicka en inbjudan: kollegan
-- registrerar sig via länken, blir medlem i organisationen med vald roll och
-- får konsulentvyn (profiles.role/roles/active_role = CONSULTANT).
--
-- Premissgranskning (läst UR PROD 2026-09-27, inte ur migrationsfilerna):
--   · handle_new_user tar rollen ur den senaste oanvända inbjudan på e-posten
--     (lower(email)) och sätter role, roles och active_role till den. En inbjudan
--     med role = 'CONSULTANT' ger alltså redan konsulentvyn — handle_new_user
--     behöver INTE ändras, och ändras inte här.
--   · handle_invitation_acceptance (AFTER INSERT på profiles) markerar inbjudan
--     used_at/used_by och kopplar till consultant_id OM det är satt. Kollega-
--     inbjudan har consultant_id NULL → bara markeringen sker. Ändras inte.
--   · INSERT-policyn på invitations släpper bara role 'CONSULTANT' för ADMIN/
--     SUPERADMIN. En chef (profilroll CONSULTANT) kan inte skapa den i dag.
--   · Ingen UPDATE- eller DELETE-policy finns på invitations för authenticated;
--     email_sent skrivs bara av send-invite-email med service role.
--   · Matchningen vid registrering sker på E-POST, inte på token. Token används
--     av InviteHandler (get_invitation_by_token) för att visa adressen.
--
-- Varför ingen ny vy/RPC: lint:schema känner bara snapshoten, och en ny vy eller
-- anropbar definer-RPC före körningen hade fällt grinden (samma skäl som PG19).
-- Klienten skriver i stället direkt i tabellen invitations, som redan finns.
--
-- Tre delar:
--   1. invitations_kollega_guard (BEFORE INSERT på invitations, definer). Den som
--      bestämmer. Gäller varje rad som bär metadata.kind = 'kollega' ELLER nyckeln
--      kollega_org_id — det går alltså inte att smuggla in nyckeln under ett annat
--      kind. Kräver: inloggad; organisationen finns och är inte ett företagskonto
--      eller en demoorganisation; anroparen är inte medlem i någon demo-
--      organisation; anroparen är chef/admin i just den organisationen (eller
--      ADMIN/SUPERADMIN på profilen); rollen är handlaggare/konsulent/chef/admin
--      (samma fyra som organization_colleagues_iud); bara admin (eller
--      ADMIN/SUPERADMIN) ger admin; e-posten saknar konto (annars: lägg till
--      direkt); ingen obesvarad kolleginbjudan till samma adress och organisation.
--      Skriver sedan om raden: role = 'CONSULTANT', invited_by = anroparen,
--      consultant_id = NULL, ny token, 14 dagars giltighet, oanvänd och oskickad,
--      och metadata byggd av servern (kind, kollega_org_id, org_role, org_name,
--      invited_by_name). Klienten bestämmer alltså bara e-post, organisation och roll.
--   2. INSERT-policyn på invitations får EN ny gren: role 'CONSULTANT' med
--      kind 'kollega' när anroparen är chef/admin i metadata.kollega_org_id.
--      De tre befintliga grenarna är ordagrant oförändrade. (WITH CHECK prövas
--      efter BEFORE-triggern, så policyn ser den omskrivna raden.)
--   3. kollega_inbjudan_medlemskap (AFTER INSERT på profiles, definer). Lägger
--      medlemsraden. Läser BARA den inbjudan som handle_invitation_acceptance just
--      markerat åt kontot (used_by = NEW.id) — triggern heter trg_k… och körs
--      därför efter on_profile_created_handle_invitation (Postgres kör AFTER-
--      triggrar i namnordning). Kräver att profilen faktiskt blev CONSULTANT och
--      prövar OM att inbjudaren fortfarande är chef/admin i organisationen och
--      att admin bara getts av admin. Varje fel fångas och blir en WARNING:
--      ett undantag här skulle rulla tillbaka handle_new_user:s huvudblock och
--      ge reservprofilen utan namn och samtycken (BP4-fällan 2026-09-22).
--
-- Företagsinbjudan (AG6, metadata.employer_org_id) och deltagarinbjudan rörs
-- inte: guarden släpper igenom varje rad utan kollega-markering orörd, och
-- medlemstriggern läser bara kind = 'kollega'.
--
-- Efteråt: cd client && npm run schema:refresh && npm run grants:refresh
-- (inga nya anropbara funktioner: båda triggerfunktionerna har REVOKE ALL).
-- Edge-funktionen send-invite-email måste vara deployad med kollegamallen
-- (kind 'kollega') INNAN klienten börjar skapa sådana inbjudningar — annars
-- skickas deltagarmallen ("vägen tillbaka till arbetsmarknaden").
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Guarden på invitations
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.invitations_kollega_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller uuid := auth.uid();
  v_super boolean := false;
  v_org uuid;
  v_roll text;
  v_email text;
  v_org_namn text;
  v_org_kind text;
  v_org_demo boolean;
  v_caller_roll text;
BEGIN
  -- Bara rader som bär kollega-markeringen. Allt annat (deltagare, AG6) orört.
  -- coalesce är nödvändig: en deltagarinbjudan saknar kind, `NULL = 'kollega'`
  -- är NULL, och NOT (false OR NULL) är NULL — då föll IF:en igenom och VARJE
  -- deltagarinbjudan nekades med "Ogiltig inbjudan" (fångat av prov 3 i
  -- torrkörningen 2026-09-27).
  IF NOT (coalesce(NEW.metadata, '{}'::jsonb) ? 'kollega_org_id'
          OR coalesce(NEW.metadata->>'kind' = 'kollega', false)) THEN
    RETURN NEW;
  END IF;

  IF caller IS NULL THEN
    RAISE EXCEPTION 'Inte inloggad' USING ERRCODE = '42501';
  END IF;

  IF NEW.metadata->>'kind' IS DISTINCT FROM 'kollega' THEN
    RAISE EXCEPTION 'Ogiltig inbjudan' USING ERRCODE = '22023';
  END IF;

  BEGIN
    v_org := (NEW.metadata->>'kollega_org_id')::uuid;
  EXCEPTION WHEN invalid_text_representation THEN
    v_org := NULL;
  END;
  IF v_org IS NULL THEN
    RAISE EXCEPTION 'Organisation saknas' USING ERRCODE = '22023';
  END IF;

  SELECT o.name, o.kind, coalesce(o.is_demo, false)
    INTO v_org_namn, v_org_kind, v_org_demo
  FROM organizations o WHERE o.id = v_org;
  IF v_org_namn IS NULL THEN
    RAISE EXCEPTION 'Organisationen finns inte' USING ERRCODE = 'P0002';
  END IF;
  IF v_org_kind = 'arbetsgivare' THEN
    RAISE EXCEPTION 'Företagskonton bjuder in kollegor under Om oss' USING ERRCODE = '22023';
  END IF;

  -- Demokonton skickar aldrig mejl (KM12 (8)) — samma regel som
  -- employer_invitations_insert och send-invite-email.
  IF v_org_demo OR EXISTS (
    SELECT 1 FROM organization_members m JOIN organizations o ON o.id = m.org_id
    WHERE m.user_id = caller AND o.is_demo
  ) THEN
    RAISE EXCEPTION 'Demokontot kan inte bjuda in. Personerna i demot är påhittade.' USING ERRCODE = '42501';
  END IF;

  SELECT p.role IN ('ADMIN', 'SUPERADMIN') INTO v_super FROM profiles p WHERE p.id = caller;
  v_super := coalesce(v_super, false);

  SELECT m.role INTO v_caller_roll
  FROM organization_members m WHERE m.org_id = v_org AND m.user_id = caller;

  IF NOT v_super AND (v_caller_roll IS NULL OR v_caller_roll NOT IN ('chef', 'admin')) THEN
    RAISE EXCEPTION 'Bara chef eller administratör i organisationen får bjuda in kollegor' USING ERRCODE = '42501';
  END IF;

  v_roll := NEW.metadata->>'org_role';
  IF v_roll IS NULL OR v_roll NOT IN ('handlaggare', 'konsulent', 'chef', 'admin') THEN
    RAISE EXCEPTION 'Okänd roll' USING ERRCODE = '22023';
  END IF;
  IF v_roll = 'admin' AND NOT v_super AND v_caller_roll IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'Bara en administratör kan ge rollen administratör' USING ERRCODE = '42501';
  END IF;

  v_email := lower(trim(coalesce(NEW.email, '')));
  IF position('@' in v_email) = 0 THEN
    RAISE EXCEPTION 'Ange en giltig e-postadress' USING ERRCODE = '22023';
  END IF;

  IF EXISTS (SELECT 1 FROM profiles p WHERE lower(p.email) = v_email) THEN
    RAISE EXCEPTION 'Det finns redan ett konto med e-posten %. Lägg till personen direkt i stället.', v_email USING ERRCODE = '23505';
  END IF;

  IF EXISTS (
    SELECT 1 FROM invitations i
    WHERE lower(i.email) = v_email
      AND i.metadata->>'kind' = 'kollega'
      AND i.metadata->>'kollega_org_id' = v_org::text
      AND i.used_at IS NULL
      AND i.expires_at > now()
      -- Bara en SKICKAD inbjudan spärrar. Föll mejlet ska chefen kunna försöka
      -- igen — det finns ingen DELETE-policy, så annars satt hen fast i 14 dagar.
      AND i.email_sent IS TRUE
  ) THEN
    RAISE EXCEPTION 'Det finns redan en obesvarad inbjudan till % i organisationen.', v_email USING ERRCODE = '23505';
  END IF;

  -- Servern bestämmer resten av raden.
  NEW.email := v_email;
  NEW.role := 'CONSULTANT';
  NEW.invited_by := caller;
  NEW.consultant_id := NULL;
  NEW.token := encode(extensions.gen_random_bytes(32), 'hex');
  NEW.expires_at := now() + interval '14 days';
  NEW.used_at := NULL;
  NEW.used_by := NULL;
  NEW.email_sent := false;
  NEW.email_sent_at := NULL;
  NEW.email_error := NULL;
  NEW.metadata := jsonb_build_object(
    'kind', 'kollega',
    'kollega_org_id', v_org,
    'org_role', v_roll,
    'org_name', v_org_namn,
    'invited_by_name', (SELECT nullif(trim(coalesce(p.first_name, '') || ' ' || coalesce(p.last_name, '')), '') FROM profiles p WHERE p.id = caller)
  );
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.invitations_kollega_guard() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_invitations_kollega_guard ON public.invitations;
CREATE TRIGGER trg_invitations_kollega_guard
  BEFORE INSERT ON public.invitations
  FOR EACH ROW EXECUTE FUNCTION public.invitations_kollega_guard();

-- ---------------------------------------------------------------------------
-- 2. INSERT-policyn: en ny gren, de tre gamla ordagrant
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authorized users can create invitations" ON public.invitations;
CREATE POLICY "Authorized users can create invitations" ON public.invitations
  FOR INSERT
  WITH CHECK (
    ((SELECT auth.uid() AS uid) = invited_by)
    AND (EXISTS (SELECT 1 FROM profiles
                 WHERE profiles.id = (SELECT auth.uid() AS uid)
                   AND profiles.role = ANY (ARRAY['CONSULTANT'::text, 'ADMIN'::text, 'SUPERADMIN'::text])))
    AND (
      (role = 'USER'::text)
      OR ((role = 'CONSULTANT'::text) AND (EXISTS (SELECT 1 FROM profiles
                 WHERE profiles.id = (SELECT auth.uid() AS uid)
                   AND profiles.role = ANY (ARRAY['ADMIN'::text, 'SUPERADMIN'::text]))))
      OR ((role = 'ADMIN'::text) AND (EXISTS (SELECT 1 FROM profiles
                 WHERE profiles.id = (SELECT auth.uid() AS uid)
                   AND profiles.role = 'SUPERADMIN'::text)))
      -- NY: kolleginbjudan. Guarden ovan har redan prövat allt och skrivit om raden.
      OR ((role = 'CONSULTANT'::text)
          AND (metadata->>'kind') = 'kollega'
          AND (EXISTS (SELECT 1 FROM organization_members m
                       WHERE m.org_id::text = (metadata->>'kollega_org_id')
                         AND m.user_id = (SELECT auth.uid() AS uid)
                         AND m.role = ANY (ARRAY['chef'::text, 'admin'::text]))))
    )
  );

-- ---------------------------------------------------------------------------
-- 3. Medlemskapet när kontot skapas
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.kollega_inbjudan_medlemskap()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inv RECORD;
  v_org uuid;
  v_roll text;
  v_inbjudare_roll text;
  v_inbjudare_super boolean;
BEGIN
  BEGIN
    -- Bara den inbjudan handle_invitation_acceptance markerat åt just detta konto.
    SELECT i.* INTO inv
    FROM invitations i
    WHERE i.used_by = NEW.id
      AND i.metadata->>'kind' = 'kollega'
    ORDER BY i.used_at DESC NULLS LAST, i.created_at DESC
    LIMIT 1;

    IF inv.id IS NULL THEN
      RETURN NEW;
    END IF;

    IF NEW.role IS DISTINCT FROM 'CONSULTANT' OR inv.role IS DISTINCT FROM 'CONSULTANT' THEN
      RAISE WARNING 'kollega_inbjudan_medlemskap: profilen % blev inte CONSULTANT — inget medlemskap', NEW.id;
      RETURN NEW;
    END IF;

    v_org := (inv.metadata->>'kollega_org_id')::uuid;
    v_roll := inv.metadata->>'org_role';
    IF v_roll IS NULL OR v_roll NOT IN ('handlaggare', 'konsulent', 'chef', 'admin') THEN
      RAISE WARNING 'kollega_inbjudan_medlemskap: okänd roll % på inbjudan %', v_roll, inv.id;
      RETURN NEW;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM organizations o
      WHERE o.id = v_org AND o.kind <> 'arbetsgivare' AND NOT coalesce(o.is_demo, false)
    ) THEN
      RAISE WARNING 'kollega_inbjudan_medlemskap: organisationen % finns inte eller tar inte emot kolleginbjudan', v_org;
      RETURN NEW;
    END IF;

    -- Pröva om inbjudaren NU: en chef som tagits bort efter inbjudan ger ingen medlem.
    SELECT m.role INTO v_inbjudare_roll
    FROM organization_members m WHERE m.org_id = v_org AND m.user_id = inv.invited_by;
    SELECT coalesce(p.role IN ('ADMIN', 'SUPERADMIN'), false) INTO v_inbjudare_super
    FROM profiles p WHERE p.id = inv.invited_by;
    v_inbjudare_super := coalesce(v_inbjudare_super, false);

    IF NOT v_inbjudare_super AND (v_inbjudare_roll IS NULL OR v_inbjudare_roll NOT IN ('chef', 'admin')) THEN
      RAISE WARNING 'kollega_inbjudan_medlemskap: inbjudaren på % är inte längre chef/admin i organisationen', inv.id;
      RETURN NEW;
    END IF;
    IF v_roll = 'admin' AND NOT v_inbjudare_super AND v_inbjudare_roll IS DISTINCT FROM 'admin' THEN
      RAISE WARNING 'kollega_inbjudan_medlemskap: rollen admin på % gavs inte av en administratör', inv.id;
      RETURN NEW;
    END IF;

    INSERT INTO organization_members (org_id, user_id, role)
    VALUES (v_org, NEW.id, v_roll)
    ON CONFLICT (org_id, user_id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    -- Aldrig låta registreringen falla hit (BP4): profilen med namn och samtycken
    -- är viktigare än medlemsraden, som chefen kan lägga till för hand.
    RAISE WARNING 'kollega_inbjudan_medlemskap misslyckades för %: %', NEW.id, SQLERRM;
  END;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.kollega_inbjudan_medlemskap() FROM PUBLIC, anon, authenticated;

-- Namnet ska sortera EFTER on_profile_created_handle_invitation (se ovan).
DROP TRIGGER IF EXISTS trg_kollega_inbjudan_medlemskap ON public.profiles;
CREATE TRIGGER trg_kollega_inbjudan_medlemskap
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.kollega_inbjudan_medlemskap();

COMMIT;

-- ----------------------------------------------------------------------------
-- VERIFIERING efter skarp körning
-- ----------------------------------------------------------------------------
-- select tgname from pg_trigger where tgname in
--   ('trg_invitations_kollega_guard','trg_kollega_inbjudan_medlemskap');          → 2 rader
-- select has_function_privilege('authenticated','public.invitations_kollega_guard()','EXECUTE'),
--        has_function_privilege('anon','public.kollega_inbjudan_medlemskap()','EXECUTE'); → false, false
-- select pg_get_expr(polwithcheck, polrelid) from pg_policy
--   where polname = 'Authorized users can create invitations';                   → innehåller 'kollega'
--
-- Röktest: Inställningar → Din organisation → Lägg till kollega med en adress
-- utan konto → "Skicka inbjudan via mejl" → status "skickad" (email_sent = true).
-- ============================================================================
