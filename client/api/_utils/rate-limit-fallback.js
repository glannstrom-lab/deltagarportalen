/**
 * Minnesfallback för rate-limit när den distribuerade räknaren fallerar.
 *
 * SD2 (2026-09-08). `cv-pdf.js` och `upload-image.js` svarade
 * `{ allowed: true }` på tre ställen vardera när RPC:n `check_rate_limit`
 * gav fel, kastade eller kom tillbaka utan rad — dörren stod alltså öppen
 * exakt när databasen strulade. CV-PDF startar Chromium (1 024 MB) per
 * anrop; en öppen dörr där är dyr. `ai.js` och `job-alerts.js` hade redan
 * en per-instans-räknare i minnet för samma fall. Det här är samma mönster,
 * lyft till en fil så att båda kan importera det. `ai.js` och
 * `job-alerts.js` behåller sina egna kopior orörda — de är inte fel, bara
 * dubblerade.
 *
 * Fail closed-ish, med avsikt (jfr CLAUDE.md, lärdomen 2026-08-03 om fail
 * closed vs. fail open). Räknaren lever i en varm instans och delas inte
 * mellan instanser, så den är svagare än RPC:n — men den gör att en enskild
 * instans aldrig blir obegränsad. Första anropet i ett fönster släpps
 * igenom: en RPC-störning ska inte stänga verktyget för den som använder
 * det normalt.
 *
 * Vaktad av `client/src/test/api-rate-limit-fallback.test.ts`.
 *
 * @typedef {{ limit: number, windowMinutes: number }} RateLimitConfig
 * @typedef {{ allowed: boolean, remaining: number, resetIn: number }} RateLimitResult
 */

/** @type {Map<string, { count: number, resetTime: number }>} */
const rlFallbackStore = new Map();

// Kartan växer per varm instans. Städa utgångna poster när den blir stor —
// annars är minnet självt nästa läcka.
const STAD_TROSKEL = 10000;

/**
 * @param {string} identifier - user-id eller IP
 * @param {string} endpoint - t.ex. 'cv-pdf', 'upload-image'
 * @param {RateLimitConfig} config
 * @returns {RateLimitResult}
 */
function rateLimitFallback(identifier, endpoint, config) {
  const key = `${identifier}:${endpoint}`;
  const now = Date.now();
  const windowMs = config.windowMinutes * 60 * 1000;

  if (rlFallbackStore.size > STAD_TROSKEL) {
    for (const [k, v] of rlFallbackStore) {
      if (now > v.resetTime) rlFallbackStore.delete(k);
    }
  }

  const entry = rlFallbackStore.get(key);
  if (!entry || now > entry.resetTime) {
    rlFallbackStore.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: config.limit - 1, resetIn: windowMs };
  }
  if (entry.count >= config.limit) {
    return { allowed: false, remaining: 0, resetIn: Math.max(0, entry.resetTime - now) };
  }
  entry.count++;
  return { allowed: true, remaining: config.limit - entry.count, resetIn: Math.max(0, entry.resetTime - now) };
}

module.exports = { rateLimitFallback };
