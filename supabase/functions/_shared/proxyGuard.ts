/**
 * Guard för publika proxy-edge-funktioner (A13, 2026-07-23)
 *
 * De sju AF-/utbildningsproxyerna (af-jobsearch, af-taxonomy, af-trends,
 * af-enrichments, af-historical, af-jobed, education-search) är medvetet
 * oautentiserade (anropas före inloggning / från publika vyer), men var
 * helt oskyddade open proxies: vem som helst på internet kunde belasta
 * dem obegränsat — kostnad/kvot för Supabase-projektet och risk att
 * Jobins delade IP blockas av Jobtech vid missbruk.
 *
 * Denna modul ger dem:
 *  1. Per-IP-rate-limit via den distribuerade check_rate_limit-RPC:n
 *     (samma som övriga edge-funktioner använder per user).
 *  2. Allowlistad CORS i stället för wildcard '*' (CORS stoppar inte
 *     curl, men wildcard är onödigt bred för webbläsarkontexten).
 */

import { checkRateLimit, createRateLimitResponse } from './rateLimit.ts'

const ALLOWED_ORIGINS = new Set([
  'https://jobin.se',
  'https://www.jobin.se',
  'https://deltagarportalen.se',
  'https://www.deltagarportalen.se',
  'https://deltagarportalen.vercel.app',
  'https://deltagarportal.vercel.app',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
])

const VERCEL_PREVIEW_RE = /^https:\/\/deltagarportal(en)?-[a-z0-9]+-[\w-]+\.vercel\.app$/

export function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false
  return ALLOWED_ORIGINS.has(origin) || VERCEL_PREVIEW_RE.test(origin)
}

export function buildProxyCorsHeaders(origin: string | null): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': isAllowedOrigin(origin) ? (origin as string) : 'https://jobin.se',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Vary': 'Origin',
  }
}

/**
 * A28 (2026-08-12): identiteten togs tidigare ur FÖRSTA värdet i
 * X-Forwarded-For — men den headern är klientstyrd. Vem som helst kan
 * skicka `X-Forwarded-For: 1.2.3.<n>` och byta värde per anrop för att få
 * en ny rate-limit-identitet varje gång, vilket gjorde A13:s per-IP-grind
 * verkningslös (se docs/review-2026-08-09/sakerhet-gdpr.md #6 — dessa sju
 * funktioner svarade 200 helt utan inloggning/kvot).
 *
 * Dessa proxyer är medvetet oautentiserade (se filkommentaren ovan), så det
 * finns ingen JWT/user-id att falla tillbaka på. Näst bästa identitet är en
 * headerkälla klienten inte kan skriva över:
 *   1. `cf-connecting-ip` — sätts av en Cloudflare-terminerad väg framför
 *      funktionen (om sådan finns) och skrivs över av CF, inte av klienten.
 *   2. SISTA (inte första) hoppet i `x-forwarded-for`. Kedjans format är
 *      "klient, proxy1, proxy2, …" — varje betrodd hopp APPENDAR sin egen
 *      observation sist. Den betrodda edge-gatewayen framför funktionen är
 *      alltså den som skrev den sista posten; allt en angripare själv
 *      skickade in hamnar däremot först. Att läsa första hoppet är därför
 *      att lita på angriparens egen uppgift.
 * Ändra INTE tillbaka till `.split(',')[0]` — det var precis den bugg som
 * gjorde grinden verkningslös.
 */
function getTrustedClientIp(req: Request): string {
  const cfIp = req.headers.get('cf-connecting-ip')
  if (cfIp) return cfIp.trim()

  const xff = req.headers.get('x-forwarded-for')
  if (xff) {
    const hops = xff.split(',').map((h) => h.trim()).filter(Boolean)
    if (hops.length > 0) return hops[hops.length - 1]
  }

  return 'unknown'
}

/**
 * Per-IP-rate-limit. Returnerar ett färdigt 429-svar om gränsen är nådd,
 * annars null (fortsätt). Anropa direkt efter OPTIONS-hanteringen.
 */
export async function enforceIpRateLimit(
  req: Request,
  endpoint: string
): Promise<Response | null> {
  const ip = getTrustedClientIp(req)
  const rl = await checkRateLimit(`ip:${ip}`, endpoint)
  if (!rl.allowed) {
    console.warn(`[${endpoint}] Rate limit för IP ${ip}`)
    return createRateLimitResponse(rl.retryAfter ?? 60, req.headers.get('origin'))
  }
  return null
}
