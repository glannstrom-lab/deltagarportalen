-- Phase 4 — user_widget_layouts: per-breakpoint widget layout persistence
-- Apply with: npx supabase db query --linked -f supabase/migrations/20260429_user_widget_layouts.sql
-- DO NOT use `npx supabase db push` (per CLAUDE.md project rule).
--
-- INVIOLABLE: This migration is strictly additive. No DROP, no destructive ALTER.
-- Idempotent — safe to run repeatedly.

-- ============================================================
-- TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS user_widget_layouts (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hub_id      TEXT        NOT NULL,
  breakpoint  TEXT        NOT NULL CHECK (breakpoint IN ('desktop', 'mobile')),
  widgets     JSONB       NOT NULL DEFAULT '[]'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, hub_id, breakpoint)
);

CREATE INDEX IF NOT EXISTS idx_uwl_user_hub
  ON user_widget_layouts(user_id, hub_id);

ALTER TABLE user_widget_layouts ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- updated_at trigger (conflict detection per Pitfall 5)
-- ============================================================
CREATE OR REPLACE FUNCTION update_uwl_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Trigger: idempotent via CREATE OR REPLACE on the function +
-- conditional creation of trigger
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_uwl_updated_at'
  ) THEN
    CREATE TRIGGER trg_uwl_updated_at
      BEFORE UPDATE ON user_widget_layouts
      FOR EACH ROW EXECUTE FUNCTION update_uwl_timestamp();
  END IF;
END $$;

-- ============================================================
-- RLS policies — idempotent (DO blocks catch duplicate_object)
-- 4 policies: select / insert / update / delete on auth.uid() = user_id
-- ============================================================
DO $$ BEGIN
  CREATE POLICY "Users can select own layouts"
    ON user_widget_layouts
    FOR SELECT
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert own layouts"
    ON user_widget_layouts
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own layouts"
    ON user_widget_layouts
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete own layouts"
    ON user_widget_layouts
    FOR DELETE
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
