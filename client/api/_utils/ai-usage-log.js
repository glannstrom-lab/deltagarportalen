/**
 * AI usage logger — fire-and-forget skrivning till ai_usage_logs.
 *
 * Lägger till mätbar telemetri för AI-anropen så modellkostnader och
 * funktion-frekvens kan analyseras. Tidigare loggades INGET för Vercel-
 * vägen vilket lämnade kostnadsuppskattningar som rena gissningar
 * (P2-skuld 2026-05-09, audit ai-engineer.md).
 *
 * Använder SUPABASE_SERVICE_ROLE_KEY för insert (RLS bypass) eftersom
 * tabellens insert-policy är begränsad till service_role.
 *
 * Fail-tyst: om något går fel (saknad env, nätverksfel, schema-mismatch)
 * loggas det till console.warn men anropet returnerar utan att kasta.
 * Loggning får ALDRIG bryta AI-svaret till användaren.
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

let serviceClient = null;
function getServiceClient() {
  if (serviceClient) return serviceClient;
  if (!SUPABASE_URL || !SERVICE_KEY) return null;
  serviceClient = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return serviceClient;
}

/**
 * @param {string|null} userId - Bearer-tokens user.id, eller null vid fel
 * @param {string} functionName - t.ex. 'personligt-brev', 'ai-team-chat'
 * @param {string} model - OpenRouter-modell-ID, t.ex. 'openai/gpt-oss-120b'
 * @param {number} tokensUsed - usage.total_tokens från OpenRouter-svaret, eller 0
 */
async function logAiUsage(userId, functionName, model, tokensUsed) {
  try {
    const client = getServiceClient();
    if (!client) {
      // Service-nyckel saknas — tyst skip (loggning är best-effort)
      return;
    }

    await client.from('ai_usage_logs').insert({
      user_id: userId || null,
      function_name: String(functionName).slice(0, 100),
      model: model ? String(model).slice(0, 100) : null,
      tokens_used: typeof tokensUsed === 'number' ? Math.max(0, Math.round(tokensUsed)) : 0,
    });
  } catch (err) {
    console.warn('[ai-usage-log] insert failed:', err?.message || err);
  }
}

module.exports = { logAiUsage };
