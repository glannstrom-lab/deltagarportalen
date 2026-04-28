-- Phase 3 / DATA-02 — Personal Brand audit history (append-only)
-- DISTINCT from existing `personal_brand_audit` (singular, upsert) from migration 20260322183304.
-- This new `personal_brand_audits` (plural) is append-only: each audit run = one row.
-- BrandAuditTab.tsx continues to use existing personalBrandApi for upsert behavior.
-- Widget reads latest row from this table by created_at DESC.

CREATE TABLE IF NOT EXISTS personal_brand_audits (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score       NUMERIC(4,1) NOT NULL,
  dimensions  JSONB NOT NULL DEFAULT '{}',
  summary     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pba_user    ON personal_brand_audits(user_id);
CREATE INDEX IF NOT EXISTS idx_pba_created ON personal_brand_audits(created_at DESC);

ALTER TABLE personal_brand_audits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pba_select" ON personal_brand_audits;
CREATE POLICY "pba_select" ON personal_brand_audits
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "pba_insert" ON personal_brand_audits;
CREATE POLICY "pba_insert" ON personal_brand_audits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "pba_update" ON personal_brand_audits;
CREATE POLICY "pba_update" ON personal_brand_audits
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "pba_delete" ON personal_brand_audits;
CREATE POLICY "pba_delete" ON personal_brand_audits
  FOR DELETE USING (auth.uid() = user_id);

COMMENT ON TABLE personal_brand_audits IS 'Phase 3 DATA-02. Append-only audit history. NOT to be confused with personal_brand_audit (singular, upsert).';
