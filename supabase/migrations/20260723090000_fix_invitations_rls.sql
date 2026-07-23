-- ============================================
-- A10 (2026-07-23): Stäng anonym massläsning av invitations
-- ============================================
-- Problemet: "Anyone can read invitations by token" hade USING (true) utan
-- tokenmatchning i villkoret → vem som helst med anon-nyckeln kunde köra
-- `select * from invitations` utan filter och få ut ALLA rader: e-post,
-- telefon (metadata), roll, consultant_id och den hemliga inbjudningstoken.
--
-- Fixen: samma mönster som planeras för profile_shares (A7) — en
-- SECURITY DEFINER-RPC som gör exakt en tokenmatchad slagning och bara
-- returnerar de fält inbjudningssidan behöver (inte token, inte
-- consultant_id/invited_by). Klienten (InviteHandler.tsx) anropar RPC:n
-- i stället för tabellen.
--
-- Konsulenters egna listor påverkas inte ("Consultants can view their own
-- invitations" med auth.uid() = invited_by finns kvar).

-- 1. Bort med den öppna policyn
DROP POLICY IF EXISTS "Anyone can read invitations by token" ON invitations;

-- 2. Tokenmatchad läsning via RPC — enda vägen in för oautentiserade
CREATE OR REPLACE FUNCTION get_invitation_by_token(p_token text)
RETURNS TABLE (id uuid, email text, role text, metadata jsonb)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT i.id, i.email, i.role, i.metadata
  FROM invitations i
  WHERE i.token = p_token
    AND i.used_at IS NULL
    AND i.expires_at > NOW()
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION get_invitation_by_token(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_invitation_by_token(text) TO anon, authenticated;

-- 3. Defense-in-depth: anon ska inte ha något tabellprivilegium alls
REVOKE ALL ON invitations FROM anon;
