-- AT1 (projektgenomgången 2026-09-24): konsulentens meddelanden når aldrig deltagaren.
--
-- `consultantService.sendMessage`/`sendBulkMessage` skriver bara till
-- `consultant_messages`. Tabellens enda trigger sätter `updated_at`; ingen notis
-- skapas och inget mejl skickas. Deltagaren ser meddelandet bara om hon själv
-- öppnar Min konsulent. Två meddelanden finns i hela historiken, det senaste
-- från april 2026.
--
-- Den här migrationen skapar en notis i klockan för mottagaren, med samma
-- mönster som F1 (`activity_sessions_absence_notify`): definer-funktion, låst
-- search_path, EXECUTE återkallat från alla roller (en trigger avfyras ändå).
-- Typen `message` finns redan i klientens `NotificationType` och har ikon och
-- etikett ("Meddelande") i useNotifications.ts — ingen klientändring behövs.
-- action_url skrivs UTAN brädgård; NotificationBell navigerar med react-router.
--
-- Mejl ingår INTE här. Det kräver en rad i client/vercel.json och en utskicks-
-- väg som pass-paminnelse.js — ett eget beslut.
--
-- KÖRD 2026-09-24. Kräver Mikaels ja (CLAUDE.md: migrationer mot prod). Kör med:
--   npx supabase db query --linked -f supabase/migrations/20260924_at1_meddelande_notis.sql
-- och därefter i client/: npm run schema:refresh && npm run grants:refresh

CREATE OR REPLACE FUNCTION public.consultant_messages_notify()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_avsandare text;
  v_mottagare_ar_personal boolean;
BEGIN
  SELECT nullif(trim(coalesce(pr.first_name, '') || ' ' || coalesce(pr.last_name, '')), '')
    INTO v_avsandare
    FROM profiles pr
   WHERE pr.id = NEW.sender_id;

  SELECT (pr.role IN ('CONSULTANT', 'ADMIN', 'SUPERADMIN'))
    INTO v_mottagare_ar_personal
    FROM profiles pr
   WHERE pr.id = NEW.receiver_id;

  INSERT INTO notifications (user_id, type, title, message, action_url, data)
  VALUES (
    NEW.receiver_id,
    'message',
    'Nytt meddelande',
    coalesce(v_avsandare, 'Din konsulent') || ': ' || left(NEW.content, 140)
      || CASE WHEN length(NEW.content) > 140 THEN '…' ELSE '' END,
    CASE WHEN coalesce(v_mottagare_ar_personal, false)
         THEN '/consultant/participants/' || NEW.sender_id::text
         ELSE '/my-consultant' END,
    jsonb_build_object('message_id', NEW.id, 'sender_id', NEW.sender_id)
  );
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.consultant_messages_notify() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_consultant_messages_notify ON public.consultant_messages;
CREATE TRIGGER trg_consultant_messages_notify
  AFTER INSERT ON public.consultant_messages
  FOR EACH ROW EXECUTE FUNCTION public.consultant_messages_notify();

-- Verifiering (förväntat svar):
--   select tgname from pg_trigger
--    where tgrelid = 'public.consultant_messages'::regclass and not tgisinternal;
--   → update_consultant_messages_updated_at, trg_consultant_messages_notify
--   select has_function_privilege('authenticated', 'public.consultant_messages_notify()', 'EXECUTE');
--   → false
