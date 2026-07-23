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
 * Per-IP-rate-limit. Returnerar ett färdigt 429-svar om gränsen är nådd,
 * annars null (fortsätt). Anropa direkt efter OPTIONS-hanteringen.
 */
export async function enforceIpRateLimit(
  req: Request,
  endpoint: string
): Promise<Response | null> {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('cf-connecting-ip') ||
    'unknown'
  const rl = await checkRateLimit(`ip:${ip}`, endpoint)
  if (!rl.allowed) {
    console.warn(`[${endpoint}] Rate limit för IP ${ip}`)
    return createRateLimitResponse(rl.retryAfter ?? 60, req.headers.get('origin'))
  }
  return null
}
