-- DP2 (driftpasset 2026-09-23) — KÖRD mot prod med Mikaels ja.
-- notifications saknade index på user_id: 8 369 seq_scan mot 17 idx_scan, och
-- klockans fråga (eq user_id + order created_at desc) körs ~6 800 gånger.
-- Tabellen är liten i dag (34 rader) men läses vid varje sidvisning.
CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON public.notifications (user_id, created_at DESC);
-- VERIFIERING: select indexname from pg_indexes where tablename='notifications'; → idx_notifications_user_created
