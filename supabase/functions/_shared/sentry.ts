// BL6 (2026-09-12): felrapportering från edge-funktionerna till Sentry.
//
// Bakgrund: `grep -rl sentry supabase/functions/*/index.ts` gav 0 — ingen backend-
// kod rapporterade någonsin ett fel, bara `console.error` i Supabase-loggarna.
// Det är just den koden som bär PII-saneringen, art. 9-grinden, org-brytaren och
// tokentaket. Ett fel där syns i dag först när en användare hör av sig.
//
// Ingen SDK: Sentrys envelope-API är ett POST-anrop, och `@sentry/deno` via esm.sh
// hade dragit in en beroendekedja i varje kallstart. `fetch` finns i Deno.
//
// Saneringen är poängen, inte transporten. Det som skickas är funktionsnamn,
// felklass, ett meddelande där e-postadresser, personnummer, Bearer-tokens,
// JWT:er och API-nycklar är maskerade, och stacken saneras likadant. Aldrig
// request-body, aldrig headers, aldrig användar-id i klartext.
//
// Utan `SENTRY_DSN` i miljön är rapporteringen en no-op — wrappen fångar ändå
// oväntade fel och svarar 500 JSON i stället för att låta plattformen svara
// med en rå stack. Sätt `SENTRY_DSN` med `npx supabase secrets set SENTRY_DSN=…`.
//
// Verifiera i drift: `curl -X POST https://<ref>.supabase.co/functions/v1/health
// -H 'content-type: application/json' -d '{'` (ogiltig body mot en funktion som
// inte tål den) → 500 `{"error":"Internt fel"}` och en händelse i Sentry vars
// meddelande INTE innehåller någon e-postadress.

const SENTRY_DSN = Deno.env.get('SENTRY_DSN') ?? ''
const MILJO = Deno.env.get('SENTRY_ENVIRONMENT') ?? 'production'
const KLIENT = 'jobin-edge/1.0'
const TIDSGRANS_MS = 2000

/** Maskerar det som aldrig ska lämna portalen. Ordningen spelar roll: tokens
 *  och nycklar först (de kan innehålla siffersekvenser), sedan e-post, sedan
 *  personnummer. */
export function sanera(text: string): string {
  return String(text)
    .replace(/Bearer\s+[A-Za-z0-9\-._~+/]+=*/g, 'Bearer [token]')
    .replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, '[jwt]')
    .replace(/\bsk-[A-Za-z0-9\-_]{8,}/g, '[api-nyckel]')
    .replace(/\bre_[A-Za-z0-9_]{8,}/g, '[api-nyckel]')
    .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, '[e-post]')
    // Personnummer: ÅÅMMDD-XXXX, ÅÅÅÅMMDD-XXXX, med eller utan skiljetecken
    .replace(/\b(?:19|20)?\d{6}[-+]?\d{4}\b/g, '[personnummer]')
}

interface Dsn {
  url: string
  nyckel: string
}

export function tolkaDsn(dsn: string): Dsn | null {
  try {
    const u = new URL(dsn)
    const projekt = u.pathname.replace(/^\/+/, '')
    if (!u.username || !projekt) return null
    return { url: `${u.protocol}//${u.host}/api/${projekt}/envelope/`, nyckel: u.username }
  } catch {
    return null
  }
}

function eventId(): string {
  return crypto.randomUUID().replace(/-/g, '')
}

interface Handelse {
  funktion: string
  typ: string
  meddelande: string
  stack?: string
  status?: number
}

/** Skickar en sanerad händelse. Kastar aldrig; utan DSN gör den ingenting. */
export async function skickaHandelse(h: Handelse, dsn: string = SENTRY_DSN): Promise<boolean> {
  const mal = tolkaDsn(dsn)
  if (!mal) return false
  const id = eventId()
  const event = {
    event_id: id,
    timestamp: new Date().toISOString(),
    platform: 'javascript',
    level: 'error',
    logger: 'edge',
    environment: MILJO,
    tags: { funktion: h.funktion, runtime: 'deno-edge', ...(h.status ? { status: String(h.status) } : {}) },
    exception: {
      values: [{ type: sanera(h.typ), value: sanera(h.meddelande) }],
    },
    extra: h.stack ? { stack: sanera(h.stack).slice(0, 4000) } : {},
  }
  const kuvert =
    JSON.stringify({ event_id: id, sent_at: event.timestamp, dsn }) + '\n' +
    JSON.stringify({ type: 'event' }) + '\n' +
    JSON.stringify(event) + '\n'
  try {
    const res = await fetch(mal.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-sentry-envelope',
        'X-Sentry-Auth': `Sentry sentry_version=7, sentry_client=${KLIENT}, sentry_key=${mal.nyckel}`,
      },
      body: kuvert,
      signal: AbortSignal.timeout(TIDSGRANS_MS),
    })
    return res.ok
  } catch {
    return false
  }
}

type Hanterare = (req: Request) => Response | Promise<Response>

/**
 * Wrappar en edge-funktions hanterare. Två saker rapporteras:
 *  1. fel som slinker ut ur hanteraren (annars svarar plattformen med rå stack),
 *  2. svar med status ≥ 500 — funktionernas egna catch-block svarar så, och det
 *     är där de intressanta felen bor (OpenRouter nere, AF-timeout, RLS-fel).
 * Request-body läses aldrig här.
 */
export function medFelrapport(funktion: string, hanterare: Hanterare): (req: Request) => Promise<Response> {
  return async (req: Request): Promise<Response> => {
    try {
      const res = await hanterare(req)
      if (res.status >= 500) {
        // Väntas in: edge-runtimen kan avsluta isolatet när svaret returnerats.
        await skickaHandelse({
          funktion,
          typ: 'HandlerSvarade5xx',
          meddelande: `${req.method} ${new URL(req.url).pathname} svarade ${res.status}`,
          status: res.status,
        })
      }
      return res
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err))
      console.error(`[${funktion}] oväntat fel:`, sanera(e.message))
      await skickaHandelse({ funktion, typ: e.name || 'Error', meddelande: e.message, stack: e.stack })
      return new Response(JSON.stringify({ error: 'Internt fel' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }
  }
}
