/**
 * BL6 (2026-09-12): felrapportering från Vercel-funktionerna till Sentry.
 *
 * Samma sak som `supabase/functions/_shared/sentry.ts`, i CommonJS för
 * `client/api/`. Ingen SDK: `@sentry/node` är ESM-tung och `require()` av en
 * ESM-only modul dödar funktionen vid laddning (lärdomen från puppeteer-core 25,
 * 2026-08-22). Sentrys envelope-API är ett POST-anrop, och `fetch` finns i
 * Node 18+ (Vercel kör 24).
 *
 * Saneringen är poängen: funktionsnamn, felklass och ett meddelande där
 * e-postadresser, personnummer, Bearer-tokens, JWT:er och API-nycklar är
 * maskerade. Aldrig request-body, aldrig headers, aldrig användar-id.
 *
 * Utan `SENTRY_DSN` i Vercel-env är rapporteringen en no-op; wrappen fångar
 * ändå oväntade fel och svarar 500 JSON i stället för FUNCTION_INVOCATION_FAILED.
 *
 * Testas i `client/src/test/backendSentry.test.ts` (mutationstestad sanering).
 */

const KLIENT = 'jobin-vercel/1.0';
const TIDSGRANS_MS = 2000;

/**
 * Maskerar det som aldrig ska lämna portalen. Ordningen spelar roll: tokens
 * och nycklar först (de kan innehålla siffersekvenser), sedan e-post, sedan
 * personnummer.
 * @param {unknown} text
 * @returns {string}
 */
function sanera(text) {
  return String(text)
    .replace(/Bearer\s+[A-Za-z0-9\-._~+/]+=*/g, 'Bearer [token]')
    .replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, '[jwt]')
    .replace(/\bsk-[A-Za-z0-9\-_]{8,}/g, '[api-nyckel]')
    .replace(/\bre_[A-Za-z0-9_]{8,}/g, '[api-nyckel]')
    .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, '[e-post]')
    // Personnummer: ÅÅMMDD-XXXX, ÅÅÅÅMMDD-XXXX, med eller utan skiljetecken
    .replace(/\b(?:19|20)?\d{6}[-+]?\d{4}\b/g, '[personnummer]');
}

/**
 * @param {string} dsn
 * @returns {{ url: string, nyckel: string } | null}
 */
function tolkaDsn(dsn) {
  try {
    const u = new URL(dsn);
    const projekt = u.pathname.replace(/^\/+/, '');
    if (!u.username || !projekt) return null;
    return { url: `${u.protocol}//${u.host}/api/${projekt}/envelope/`, nyckel: u.username };
  } catch {
    return null;
  }
}

/**
 * @typedef {object} Handelse
 * @property {string} funktion
 * @property {string} typ
 * @property {string} meddelande
 * @property {string} [stack]
 * @property {number} [status]
 */

/**
 * Skickar en sanerad händelse. Kastar aldrig; utan DSN gör den ingenting.
 * @param {Handelse} h
 * @param {string} [dsn]
 * @returns {Promise<boolean>}
 */
async function skickaHandelse(h, dsn = process.env.SENTRY_DSN || '') {
  const mal = tolkaDsn(dsn);
  if (!mal) return false;
  const id = require('crypto').randomUUID().replace(/-/g, '');
  const timestamp = new Date().toISOString();
  const event = {
    event_id: id,
    timestamp,
    platform: 'javascript',
    level: 'error',
    logger: 'vercel',
    environment: process.env.SENTRY_ENVIRONMENT || process.env.VERCEL_ENV || 'production',
    tags: { funktion: h.funktion, runtime: 'vercel-node', ...(h.status ? { status: String(h.status) } : {}) },
    exception: { values: [{ type: sanera(h.typ), value: sanera(h.meddelande) }] },
    extra: h.stack ? { stack: sanera(h.stack).slice(0, 4000) } : {},
  };
  const kuvert =
    JSON.stringify({ event_id: id, sent_at: timestamp, dsn }) + '\n' +
    JSON.stringify({ type: 'event' }) + '\n' +
    JSON.stringify(event) + '\n';
  try {
    const res = await fetch(mal.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-sentry-envelope',
        'X-Sentry-Auth': `Sentry sentry_version=7, sentry_client=${KLIENT}, sentry_key=${mal.nyckel}`,
      },
      body: kuvert,
      signal: AbortSignal.timeout(TIDSGRANS_MS),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Wrappar en Vercel-hanterare `(req, res) => …`. Rapporterar fel som slinker
 * ut ur hanteraren, och svar med status ≥ 500 (funktionernas egna catch-block
 * svarar så). Request-body läses aldrig här.
 *
 * DR1 (2026-09-20): varje svar bär `X-Felrapport: pa|av`, satt INNAN hanteraren
 * körs (headers går inte att sätta efter att svaret skickats).
 *
 * Varför en header och inte en ny endpoint: felrapporteringen var en tyst no-op
 * i drift från den byggdes 2026-09-12 till i dag, eftersom SENTRY_DSN aldrig
 * sattes i Vercel. Samma klass som A18, vars vakt svarade 503 för alla i veckor
 * för att CRON_SECRET saknades. Ett läge som bara syns när någon letar efter det
 * kommer att vara fel igen — det här gör det läsbart med ett curl-anrop mot
 * vilken API-rutt som helst, även en som svarar 401.
 *
 * Headern bär ett booleskt läge, aldrig DSN:en, leverantören eller regionen.
 * @template {(req: any, res: any) => any} H
 * @param {string} funktion
 * @param {H} hanterare
 * @returns {(req: any, res: any) => Promise<void>}
 */
function medFelrapport(funktion, hanterare) {
  return async (req, res) => {
    try {
      // Före hanteraren: den äger svaret och kan skicka det när som helst.
      // typeof-kontrollen är inte paranoia — en diagnostikheader får aldrig
      // vara det som fäller en funktion. Vercels res har alltid setHeader;
      // en strömmande eller inslagen res kanske inte har det.
      if (typeof res.setHeader === 'function' && !res.headersSent) {
        res.setHeader('X-Felrapport', tolkaDsn(process.env.SENTRY_DSN || '') ? 'pa' : 'av');
      }
      await hanterare(req, res);
      if (res.statusCode >= 500) {
        await skickaHandelse({
          funktion,
          typ: 'HandlerSvarade5xx',
          meddelande: `${req.method} ${String(req.url || '').split('?')[0]} svarade ${res.statusCode}`,
          status: res.statusCode,
        });
      }
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      console.error(`[${funktion}] oväntat fel:`, sanera(e.message));
      await skickaHandelse({ funktion, typ: e.name || 'Error', meddelande: e.message, stack: e.stack });
      if (!res.headersSent) {
        res.status(500).json({ error: 'Internt fel' });
      }
    }
  };
}

module.exports = { sanera, tolkaDsn, skickaHandelse, medFelrapport };
