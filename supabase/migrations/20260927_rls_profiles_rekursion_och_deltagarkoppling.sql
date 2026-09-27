-- RD1 + RD2 (rollspelet 2026-09-27): två RLS-fel som slog mot deltagare i prod.
--
-- RD2 — 42P17 "infinite recursion detected in policy for relation profiles"
--   på VARJE UPDATE av profiles. Kedjan: profiles-policyn "Konsulent kan ändra
--   status på sin tilldelade deltagare" (KS10) gör EXISTS mot consultant_participants,
--   vars SELECT-policy "Konsulenter ser sina deltagare" gör EXISTS mot profiles
--   (admin-kontrollen) → profiles igen. Permissiva policyer OR:as, så även en
--   deltagare som sparar sin egen profil får felet. Fix: admin-kontrollen via
--   is_admin_or_superadmin() (SECURITY DEFINER, går inte genom RLS).
--
-- RD1 — deltagare kan inte skicka meddelanden till sin konsulent (42501).
--   INSERT-policyn på consultant_messages kräver en synlig consultant_participants-
--   rad, men ingen policy ger deltagaren läsrätt till sin egen koppling.
--   Fix: deltagaren ser sin(a) egen(na) rad(er). Avslöjar bara consultant_id, som
--   deltagaren redan får via get_my_consultant().
--
-- Körs manuellt: npx supabase db query --linked -f <denna fil>
-- Efteråt: cd client && npm run schema:refresh && npm run grants:refresh

ALTER POLICY "Konsulenter ser sina deltagare" ON public.consultant_participants
  USING ((consultant_id = (select auth.uid())) OR is_admin_or_superadmin());

DROP POLICY IF EXISTS "Deltagare ser sin egen koppling" ON public.consultant_participants;
CREATE POLICY "Deltagare ser sin egen koppling" ON public.consultant_participants
  FOR SELECT TO authenticated
  USING (participant_id = (select auth.uid()));
