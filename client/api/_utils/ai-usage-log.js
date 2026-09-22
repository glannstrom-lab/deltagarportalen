/**
 * AI usage logger — skrivning till ai_usage_logs.
 *
 * Lägger till mätbar telemetri för AI-anropen så modellkostnader och
 * funktion-frekvens kan analyseras. Tidigare loggades INGET för Vercel-
 * vägen vilket lämnade kostnadsuppskattningar som rena gissningar
 * (P2-skuld 2026-05-09, audit ai-engineer.md).
 *
 * Använder SUPABASE_SERVICE_ROLE_KEY för insert (RLS bypass) eftersom
 * tabellens insert-policy är begränsad till service_role.
 *
 * FELPOLICY (2026-09-22): fail open, men HÖGLJUTT.
 *
 * Tabellen är inte bara telemetri — `checkDailyTokenCap` i `ai.js` summerar
 * den för att stoppa en användare som bränner tokens. En rad som inte skrivs
 * är alltså tokens som taket aldrig ser. Trots det blockerar vi inte
 * AI-svaret när loggningen fallerar: felet kostar pengar, inte en rättighet
 * eller en olaglig överföring (jämför art. 9-grinden, som är fail closed).
 * Användaren har redan fått — och vi har redan betalat — svaret.
 *
 * Det som INTE är okej är att felet är tyst. supabase-js kastar inte vid
 * PostgREST-fel; den returnerar `{ error }`. Fram till 2026-09-22 stod
 * insertet i en try/catch som alltså aldrig fångade något — ett schemafel,
 * en borttagen kolumn eller en återkallad rättighet hade stängt av tokentaket
 * helt utan en enda loggrad. Nu: console.error med fast prefix + en händelse
 * till Sentry (no-op utan SENTRY_DSN). Vaktat av
 * src/test/api-ai-usage-log-fel.test.ts.
 *
 * AWAITA ANROPET. `void logAiUsage(...)` följt av `res.json(...)` betyder att
 * Vercel kan frysa eller återvinna instansen innan insertet gått iväg —
 * 2026-09-22 kväll: 8 lyckade svar i loggen, 3 rader i tabellen. Kostnaden
 * för att vänta är ett insert; taket är LOGG_TIDSGRANS_MS.
 *
 * Loggning får ALDRIG bryta AI-svaret till användaren — funktionen kastar
 * aldrig, och returnerar `true` bara när raden faktiskt skrevs.
 */

const { createClient } = require('@supabase/supabase-js');
const { skickaHandelse } = require('./sentry.js');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

/** Ett hängande insert får inte hålla AI-svaret. */
const LOGG_TIDSGRANS_MS = 3000;

let serviceClient = null;
function getServiceClient() {
  if (serviceClient) return serviceClient;
  if (!SUPABASE_URL || !SERVICE_KEY) return null;
  serviceClient = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (url, init) => fetch(url, { ...init, signal: AbortSignal.timeout(LOGG_TIDSGRANS_MS) }),
    },
  });
  return serviceClient;
}

/**
 * Larmar om att en rad inte skrevs. Kastar aldrig.
 * @param {string} functionName
 * @param {string} meddelande
 */
async function larma(functionName, meddelande) {
  // Prefixet är fast så det går att söka fram i Vercels loggar.
  console.error(`[ai-usage-log] RADEN SKREVS INTE — tokentaket ser inte anropet (${functionName}): ${meddelande}`);
  try {
    await skickaHandelse({
      funktion: 'ai-usage-log',
      typ: 'TokenloggFel',
      meddelande: `${functionName}: ${meddelande}`,
    });
  } catch {
    // skickaHandelse kastar inte, men larmet får aldrig vara det som fäller något.
  }
}

/**
 * @param {string|null} userId - Bearer-tokens user.id, eller null vid fel
 * @param {string} functionName - t.ex. 'personligt-brev', 'ai-team-chat'
 * @param {string} model - OpenRouter-modell-ID, t.ex. 'openai/gpt-oss-120b'
 * @param {number} tokensUsed - usage.total_tokens från OpenRouter-svaret, eller 0
 * @param {{ success?: boolean, errorMessage?: string | null, durationMs?: number }} [utfall]
 *   Anropets utfall. Kolumnen `success` har default true i databasen, så utan
 *   det här fältet såg varje misslyckat anrop ut som ett lyckat (2026-09-22:
 *   alla rader i prod hade success=true). Ett misslyckat anrop som ändå
 *   brände tokens — t.ex. ett tomt svar efter resonemang — ska räknas mot
 *   taket, så tokens loggas även när success är false.
 * @returns {Promise<boolean>} true om raden skrevs
 */
async function logAiUsage(userId, functionName, model, tokensUsed, utfall = {}) {
  try {
    const client = getServiceClient();
    if (!client) {
      // Service-nyckel saknas — då kan inte heller checkDailyTokenCap köra
      // (ai.js skippar taket utan nyckel), så det finns inget tak att svika.
      return false;
    }

    const misslyckat = utfall.success === false;
    const { error } = await client.from('ai_usage_logs').insert({
      user_id: userId || null,
      function_name: String(functionName).slice(0, 100),
      model: model ? String(model).slice(0, 100) : null,
      tokens_used: typeof tokensUsed === 'number' && Number.isFinite(tokensUsed) ? Math.max(0, Math.round(tokensUsed)) : 0,
      success: !misslyckat,
      error_message: misslyckat && utfall.errorMessage ? String(utfall.errorMessage).slice(0, 500) : null,
      duration_ms: typeof utfall.durationMs === 'number' && Number.isFinite(utfall.durationMs)
        ? Math.max(0, Math.round(utfall.durationMs))
        : null,
    });
    if (error) {
      await larma(functionName, `${error.code || '?'} ${error.message || ''}`.trim());
      return false;
    }
    return true;
  } catch (err) {
    await larma(functionName, String(err?.message || err));
    return false;
  }
}

module.exports = { logAiUsage };
