-- Phase 3 / DATA-01 — Interview session score persistence
-- Strictly additive: ADD COLUMN IF NOT EXISTS guards make this safe to re-run.
-- Existing rows keep score = NULL; widget renders "Ingen poäng" for null.
-- RLS unchanged (auth.uid() = user_id already enforced by 20260227130000).

ALTER TABLE interview_sessions
  ADD COLUMN IF NOT EXISTS score NUMERIC(4,1) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS score_breakdown JSONB DEFAULT NULL;

-- Comment to document append-only, nullable semantics
COMMENT ON COLUMN interview_sessions.score IS 'Session total score 0.0–100.0 (Phase 3 DATA-01). NULL = no score yet.';
COMMENT ON COLUMN interview_sessions.score_breakdown IS 'Per-question scores + AI feedback strings (Phase 3 DATA-01). NULL = no breakdown yet.';
