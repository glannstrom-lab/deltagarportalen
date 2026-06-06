-- ============================================================
-- GDPR-spårbarhet: audit_logs + skrivpolicy för konsulenter/admins
-- ============================================================
-- Bakgrund: 007_consultant_dashboard.sql DEFINIERAR audit_logs + en admin-SELECT-
-- policy, men tabellen visade sig SAKNAS i prod 2026-06-06 (007:s audit-del
-- deployades aldrig). Det är i sig en compliance-lucka: ingen revisionskedja för
-- behandling av personuppgifter för en utsatt målgrupp.
--
-- Denna migration är självständig och idempotent: skapar tabellen om den saknas,
-- aktiverar RLS, och lägger båda policyerna. Append-only för aktören:
--   - SELECT: endast admins (revisionsläsning)
--   - INSERT: aktören får skriva SIN EGEN rad (user_id = auth.uid()) om
--     konsulent/admin — kan logga men aldrig läsa/ändra/radera.
-- Ingen UPDATE/DELETE-policy ges. Respekterar no-DROP-normen (villkorad create).

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id),
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id UUID,
    old_value JSONB,
    new_value JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'audit_logs'
          AND policyname = 'Endast admins ser audit logs'
    ) THEN
        CREATE POLICY "Endast admins ser audit logs"
            ON audit_logs FOR SELECT
            USING (EXISTS (
                SELECT 1 FROM profiles
                WHERE id = auth.uid() AND role IN ('SUPERADMIN', 'ADMIN')
            ));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'audit_logs'
          AND policyname = 'Aktör loggar egna handlingar'
    ) THEN
        CREATE POLICY "Aktör loggar egna handlingar"
            ON audit_logs FOR INSERT
            WITH CHECK (
                user_id = auth.uid()
                AND EXISTS (
                    SELECT 1 FROM profiles
                    WHERE id = auth.uid()
                      AND role IN ('SUPERADMIN', 'ADMIN', 'CONSULTANT')
                )
            );
    END IF;
END $$;
