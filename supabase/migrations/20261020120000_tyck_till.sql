-- Tyck till (FN15 + idélåda), 2026-10-20, beslut Mikael.
--
-- Användaren skickar en idé eller en felrapport. Raden skrivs ALDRIG direkt av
-- klienten: /api/tyck-till verifierar token, tvättar personnummer, sätter
-- user_id från den verifierade sessionen och skriver med service role, och
-- mejlar sedan superadmin. Därför finns ingen INSERT-policy för authenticated.
--
-- Läsning och statusbyte: bara SUPERADMIN. Inte is_admin_or_superadmin() —
-- den släpper in ADMIN, och en organisations admin ska inte läsa vad andra
-- organisationers deltagare skrivit.

CREATE TABLE IF NOT EXISTS public.tyck_till (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  typ text NOT NULL CHECK (typ IN ('ide', 'fel')),
  meddelande text NOT NULL CHECK (char_length(meddelande) BETWEEN 1 AND 4000),
  sida text,
  roll text,
  sprak text,
  webblasare text,
  klientfel jsonb NOT NULL DEFAULT '[]'::jsonb,
  far_kontakta boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'ny' CHECK (status IN ('ny', 'last', 'atgardad')),
  mejl_skickat boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tyck_till_created_at_idx ON public.tyck_till (created_at DESC);

ALTER TABLE public.tyck_till ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.tyck_till FROM anon, authenticated;
GRANT SELECT, UPDATE (status) ON public.tyck_till TO authenticated;

DROP POLICY IF EXISTS "Superadmin läser tyck till" ON public.tyck_till;
CREATE POLICY "Superadmin läser tyck till" ON public.tyck_till
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.role = 'SUPERADMIN'));

DROP POLICY IF EXISTS "Superadmin ändrar status på tyck till" ON public.tyck_till;
CREATE POLICY "Superadmin ändrar status på tyck till" ON public.tyck_till
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.role = 'SUPERADMIN'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.role = 'SUPERADMIN'));
