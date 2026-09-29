/**
 * Supabase-klient för RATE-LIMIT-RPC:n — och ingenting annat (RL1, 2026-09-29).
 *
 * `check_rate_limit` ska bara vara körbar för service_role (se
 * supabase/migrations/PENDING_20260929_check_rate_limit_service_role.sql):
 * som anon kunde vem som helst bränna en annan användares kvot. Därför
 * bygger alla anropare sin rate-limit-klient här, med service-nyckeln.
 *
 * REGLER:
 *  - Klienten får ALDRIG användas till något annat än
 *    `rpc('check_rate_limit', …)`. Service-nyckeln kringgår RLS.
 *  - Auth (`auth.getUser`) och användardata går fortfarande via anon-klienten.
 *  - Saknas service-nyckeln loggas det tydligt (en gång per kallstart) och
 *    klienten byggs med anon-nyckeln som förut — ingen krasch. Efter REVOKE
 *    faller RPC:n då tillbaka på minnes-limitern, och `[RateLimit]`-loggen
 *    visar varför.
 *
 * Vaktad av `client/src/test/rate-limit-service-role.test.ts`.
 */
const { createClient } = require('@supabase/supabase-js');

/** @type {import('@supabase/supabase-js').SupabaseClient | null} */
let cached = null;
let varnat = false;

/**
 * @returns {import('@supabase/supabase-js').SupabaseClient | null} null om URL saknas helt
 */
function getRateLimitClient() {
  if (cached) return cached;
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url) return null;
  if (serviceKey) {
    cached = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    return cached;
  }
  if (!varnat) {
    varnat = true;
    console.error(
      '[RateLimit] SUPABASE_SERVICE_ROLE_KEY saknas — rate-limit-klienten bygger på anon-nyckeln. ' +
        'Efter REVOKE på check_rate_limit faller räknaren på in-memory fallback.'
    );
  }
  if (!anonKey) return null;
  cached = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

module.exports = { getRateLimitClient };
