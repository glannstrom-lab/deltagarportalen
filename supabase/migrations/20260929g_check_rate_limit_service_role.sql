-- Körd i prod 2026-09-29 (Mikaels ja, efter deploy afb02318) — check_rate_limit: bara service_role
--
-- PREMISSEN HÅLLER (bevisad i prod 2026-09-29, transaktion som avbröts):
--   som anon: 30 anrop check_rate_limit('<offrets uid>','ai-personligt-brev',1000000,15)
--   därefter offrets riktiga anrop (max 20) -> allowed=false remaining=0.
--   Angriparen väljer själv identifier, endpoint, max och fönster. Varje
--   "tillåtet" anrop INSERT:ar en rad -> offrets kvot bränns. (Kräver offrets
--   uuid; konsulenter ser deltagares id.) Samma väg kan fylla rate_limits
--   (städas timvis av cron retention-rate-limits).
--   proacl idag: anon=X, authenticated=X (och service_role).
--
-- VARFÖR DET INTE BARA GÅR ATT REVOKA (minne: vem-anropar-med-anon-nyckeln):
--   alla anropare bygger sin klient med ANON-nyckeln och faller tyst tillbaka på
--   minnes-limitern när RPC:n felar. Ett REVOKE nu = tyst nedgradering till
--   per-instans-minne (på serverless: ingen gräns). Anroparna som måste byta till
--   SUPABASE_SERVICE_ROLE_KEY för just rate-limit-klienten:
--     client/api/ai.js:255 (klienten skapas ~rad 961)
--     client/api/cv-pdf.js:75 (rlSupabase, rad ~395)
--     client/api/job-alerts.js:193 (supabaseAnon, rad ~28)
--     client/api/upload-image.js:110 (klient rad ~151)
--     supabase/functions/bolagsverket/index.ts:324 (klient rad ~316)
--     supabase/functions/_shared/rateLimit.ts:85 (klient rad ~57; täcker proxy-guards)
--   Klienten får ALDRIG användas för annat än RPC:n. Service-nyckeln finns redan
--   i alla tre miljöerna (Vercel: SUPABASE_SERVICE_ROLE_KEY; Deno: automatiskt).
--
-- ORDNING (viktig):
--   1. Ändra de sex anroparna, deploya (Vercel + edge).
--   2. Mät att det fortfarande räknas: rate_limits ska få nya rader efter ett AI-anrop
--        select count(*) from rate_limits where created_at > now() - interval '5 minutes';  -> > 0
--   3. Kör den här filen.
--   4. Verifiera (nedan). Titta i Vercel-loggen efter '[RateLimit] Supabase error,
--      using in-memory fallback' — den raden ska INTE dyka upp efter steg 3.
--
-- PRÖVA (rollback) före steg 3 i prod är meningslöst; efteråt:
--   select has_function_privilege('anon','public.check_rate_limit(text,text,integer,integer)','EXECUTE'),
--          has_function_privilege('authenticated','public.check_rate_limit(text,text,integer,integer)','EXECUTE'),
--          has_function_privilege('service_role','public.check_rate_limit(text,text,integer,integer)','EXECUTE');
--   -> false | false | true
--   (Supabase ger anon ett EGET grant; REVOKE FROM PUBLIC räcker inte. Mät alltid
--    has_function_privilege, inte kommandot.)

begin;

revoke execute on function public.check_rate_limit(text, text, integer, integer) from public;
revoke execute on function public.check_rate_limit(text, text, integer, integer) from anon;
revoke execute on function public.check_rate_limit(text, text, integer, integer) from authenticated;
grant  execute on function public.check_rate_limit(text, text, integer, integer) to service_role;

-- Självtest: abortera om utfallet inte blev rätt.
do $$
begin
  if has_function_privilege('anon', 'public.check_rate_limit(text,text,integer,integer)', 'EXECUTE')
     or has_function_privilege('authenticated', 'public.check_rate_limit(text,text,integer,integer)', 'EXECUTE')
     or not has_function_privilege('service_role', 'public.check_rate_limit(text,text,integer,integer)', 'EXECUTE') then
    raise exception 'check_rate_limit: rättigheterna blev inte som avsett';
  end if;
end $$;

commit;

-- Efter körning: ta bort posten check_rate_limit ur ANON_TILLATNA i
-- client/scripts/lint-grants.cjs (rad ~37; regel 5 fäller annars på en tillåtelse
-- som inte längre behövs), kör cd client && npm run grants:refresh och committa
-- snapshoten i samma commit.
--
-- Ångra (om något gick fel): grant execute on function public.check_rate_limit(text,text,integer,integer) to anon, authenticated;
