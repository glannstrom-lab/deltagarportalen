/**
 * Delad AI-grind för de två Perplexity-funktionerna (2026-08-19)
 * ============================================================
 *
 * Används av — och BARA av — `ai-company-search` och `ai-company-analysis`.
 * Lägger du till en tredje anropare: läs hela den här filen först, särskilt
 * policyrutorna. De två funktionerna kör portalens dyraste modell
 * (`perplexity/sonar`, ett medvetet undantag i `docs/AI_MODEL_LOCKING.md:8`)
 * och skriver till samma `ai_usage_logs` som CV- och brevfunktionerna.
 *
 * VARFÖR FILEN FINNS
 * ------------------
 * Uppmätt i skarp drift 2026-08-19: kontot `claude-playwright-test@jobin.se`
 * har `profiles.ai_enabled = false` och fick ändå HTTP 200 med fullt AI-svar
 * från BÅDA funktionerna. `grep "ai_enabled" supabase/functions` gav noll
 * träffar — portalens AI-brytare hade ingen verkan alls på edge-sidan.
 * `client/api/ai.js` har grindarna (`checkAiEnabled`, `checkArt9Consent`,
 * `checkDailyTokenCap`); edge-funktionerna hade ingenting. Det gjorde
 * `privacy.sharing.aiDesc` ("endast om du samtyckt") osann i drift.
 *
 * Grindarna nedan är avsiktligt EN portering av ai.js-mönstret, inte en ny
 * uppfinning — samma kolumn, samma default, samma felkodsfamilj — så att
 * "stäng av AI" betyder samma sak oavsett vilken backend UI:t råkar träffa.
 */

// Typ-only-import: raderas vid bundling och drar alltså inte in en andra
// supabase-js-version. Samma version som de två anroparna använder.
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { getCorsHeaders, createCorsRejectionResponse } from './cors.ts'

// ============================================================
// Felkoder — klientens kontrakt
// ============================================================
// Klienten måste kunna skilja "du har stängt av AI" (användarens eget val,
// åtgärdas i Inställningar) från "tjänsten är nere" (försök igen). Därför
// bär varje nekande svar ett stabilt `code` UTÖVER den svenska `error`-texten.
// Texten får skrivas om; koden får inte.
export const AI_GATE_CODES = {
  /** 403 — användaren har `profiles.ai_enabled = false`. Användarens eget val. */
  AI_DISABLED: 'AI_DISABLED',
  /** 403 — uttryckligt samtycke saknas. Emitteras BARA om `requireConsent` slås på (se nedan). */
  AI_CONSENT_REQUIRED: 'AI_CONSENT_REQUIRED',
  /** 503 — vi kunde inte läsa inställningen. Fail closed: vi gissar inte. */
  AI_CHECK_FAILED: 'AI_CHECK_FAILED',
  /** 429 — dygnets tokentak nått. */
  AI_DAILY_LIMIT: 'AI_DAILY_LIMIT',
  /** 503 — vi kunde inte räkna dygnets förbrukning. Fail closed, se motivering. */
  AI_USAGE_CHECK_FAILED: 'AI_USAGE_CHECK_FAILED',
  /** 429 — per-användare-rate-limit. */
  RATE_LIMITED: 'RATE_LIMITED',
  /** 401 */
  UNAUTHORIZED: 'UNAUTHORIZED',
  /** 400 — ogiltig indata från klienten. */
  INVALID_INPUT: 'INVALID_INPUT',
  /** 500 — serverkonfiguration saknas (nyckel/URL). */
  SERVER_MISCONFIGURED: 'SERVER_MISCONFIGURED',
  /** 502 — OpenRouter svarade inte, eller svarade tomt. */
  AI_UPSTREAM_ERROR: 'AI_UPSTREAM_ERROR',
  /** 502 — svar kom men gick inte att tolka. */
  AI_PARSE_ERROR: 'AI_PARSE_ERROR',
  /** 500 — oväntat fel. */
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const

export type AiGateCode = typeof AI_GATE_CODES[keyof typeof AI_GATE_CODES]

export type AiGateReason = 'opted_out' | 'no_consent' | 'lookup_failed'

export interface AiGateResult {
  allowed: boolean
  reason?: AiGateReason
}

// ============================================================
// Svarsbyggare — varför INTE `createCorsResponse`
// ============================================================
// `cors.ts:createCorsResponse` STRYPER svarskroppen för allt med status >= 400
// i produktion: den bygger ett nytt objekt med enbart `error` och kastar
// resten. Det är rätt för oavsiktliga fältläckor — men det åt också upp
// `retryAfter` i `ai-company-search`s 429-svar (klienten fick aldrig se det),
// och det hade ätit upp `code` här. Kropparna nedan är handskrivna konstanter
// utan interna detaljer, så saneringen har inget att skydda mot.
// Rör INTE `createCorsResponse` — åtta andra funktioner delar den.
export function createAiErrorResponse(
  code: AiGateCode,
  error: string,
  status: number,
  origin: string | null,
  extra?: Record<string, unknown>,
): Response {
  const headers = getCorsHeaders(origin)
  if (!headers) return createCorsRejectionResponse(origin)

  const body: Record<string, unknown> = { success: false, error, code, ...extra }

  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...headers,
      'Content-Type': 'application/json',
      ...(typeof extra?.retryAfter === 'number'
        ? { 'Retry-After': String(extra.retryAfter) }
        : {}),
    },
  })
}

// ============================================================
// AI-av-brytaren (`profiles.ai_enabled`) — FAIL CLOSED
// ============================================================
// `ai_enabled` är användarens generella på/av-brytare för AI (GDPR art. 21 —
// invändning mot profilering). Kolumnen har DEFAULT true i prod (verifierat
// 2026-08-19 mot `information_schema`), så bara explicit FALSE är en
// invändning. `null` behandlas som påslaget, precis som i ai.js.
//
// FAIL CLOSED, medvetet: går uppslaget inte att göra vet vi inte om personen
// har stängt av AI, och kostnaden för att gissa fel är en behandling personen
// uttryckligen invänt mot — inte en kostnad i kronor. Motsatt policy mot
// rate-limitens fallback (se anropsstället i respektive funktion).
// Harmonisera dem ALDRIG till samma beteende — se CLAUDE.md, lärdomen
// "Fail closed vs. fail open — välj efter vad felet kostar".
//
// OM `requireConsent`
// -------------------
// De här två funktionerna behandlar INTE särskilda kategorier (art. 9): in går
// söktext respektive företagsnamn/org.nr/bransch, inte hälsa eller mående.
// Därför krävs `ai_consent_at` INTE här — samma avgränsning som ai.js gör med
// `ART9_FUNCTIONS`. Att kräva uttryckligt samtycke för art. 6-funktioner är ett
// produktbeslut för Mikael, inte ett implementationsval: mätt i prod
// 2026-08-19 saknar **75 av 92** profiler `ai_consent_at`, så flaggan hade
// släckt funktionerna för 82 % av användarna. Ligger i ROADMAP:s beslutslogg.
// Flaggan finns färdig här så att beslutet blir en rad, inte ett nytt bygge.
const AI_ENABLED_DEFAULT_WHEN_NULL = true

/**
 * Kontrollerar användarens AI-brytare (och, om påslaget, uttryckligt samtycke).
 *
 * @param client Måste vara en klient som FAKTISKT når användarens profilrad.
 *   Två giltiga val:
 *     1. service-role-klienten (går förbi RLS) — det som används i de två
 *        anroparna, se motiveringen vid anropsstället;
 *     2. en klient som bär användarens `Authorization: Bearer <token>` i
 *        `global.headers` (mönstret i `client/api/ai.js:1615` och
 *        `client/api/cv-pdf.js:133`).
 *   Skicka ALDRIG in en klient byggd på enbart anon-nyckeln: `getUser(token)`
 *   validerar token men sätter ingen session, efterföljande PostgREST-anrop
 *   går som `anon`, RLS ger 0 rader — och den här fail closed-grinden nekar då
 *   ALLA, för alltid. Det är exakt A19-buggen, och den låg i drift en månad.
 * @param userId Användarens id från `auth.getUser(token)` — aldrig från kroppen.
 */
export async function checkAiEnabled(
  client: SupabaseClient,
  userId: string,
  opts?: { requireConsent?: boolean },
): Promise<AiGateResult> {
  if (!client || !userId) {
    console.warn('[AiGate] saknar klient eller userId (blockerar)')
    return { allowed: false, reason: 'lookup_failed' }
  }
  try {
    const { data, error } = await client
      .from('profiles')
      .select('ai_enabled, ai_consent_at')
      .eq('id', userId)
      .maybeSingle()

    if (error || !data) {
      console.warn('[AiGate] profiluppslag misslyckades (blockerar):', error?.message ?? 'ingen rad')
      return { allowed: false, reason: 'lookup_failed' }
    }

    const enabled = data.ai_enabled === null || data.ai_enabled === undefined
      ? AI_ENABLED_DEFAULT_WHEN_NULL
      : data.ai_enabled === true

    if (!enabled) return { allowed: false, reason: 'opted_out' }

    if (opts?.requireConsent && !data.ai_consent_at) {
      return { allowed: false, reason: 'no_consent' }
    }

    return { allowed: true }
  } catch (err) {
    console.warn('[AiGate] profiluppslag kastade (blockerar):', err instanceof Error ? err.message : err)
    return { allowed: false, reason: 'lookup_failed' }
  }
}

/** Bygger 403/503-svaret för en nekad grind. */
export function createGateDenialResponse(
  reason: AiGateReason,
  origin: string | null,
): Response {
  if (reason === 'opted_out') {
    return createAiErrorResponse(
      AI_GATE_CODES.AI_DISABLED,
      'Du har stängt av AI-behandling av dina uppgifter. Slå på det i Inställningar om du vill använda den här funktionen.',
      403,
      origin,
    )
  }
  if (reason === 'no_consent') {
    return createAiErrorResponse(
      AI_GATE_CODES.AI_CONSENT_REQUIRED,
      'Den här funktionen kräver att du först godkänner AI-behandling i Inställningar.',
      403,
      origin,
    )
  }
  return createAiErrorResponse(
    AI_GATE_CODES.AI_CHECK_FAILED,
    'Vi kunde inte kontrollera din AI-inställning just nu, och skickar därför inte dina uppgifter vidare. Försök igen om en stund.',
    503,
    origin,
  )
}

// ============================================================
// Dagligt tokentak — FAIL CLOSED (avviker medvetet från ai.js)
// ============================================================
// `checkDailyTokenCap` fanns bara i `client/api/ai.js`. De här två
// funktionerna hade alltså INGET tak alls, samtidigt som de kör den dyraste
// modellen och skriver till samma `ai_usage_logs` — de åt CV- och
// brevfunktionernas budget utan att räknas mot något.
//
// Taket delas medvetet med ai.js: samma tabell, samma fönster (24 h), samma
// default (50 000). Ändras taket måste `AI_DAILY_TOKEN_CAP` sättas på BÅDA
// hållen — Vercel (ai.js) och Supabase edge-secrets (den här filen) — annars
// gäller olika tak på olika vägar.
//
// POLICY: ai.js failar OPEN här ("loggning är best-effort"). Den här kopian
// failar CLOSED. Det är inte slarv utan en annan riskbild:
//   1. Taket är den ENDA kostnadsgrinden för dessa två, och det ligger under
//      en rate-limit som själv failar open till en per-isolat-fallback. Två
//      fail open ovanpå varandra = ingen grind alls just när räknelagret är
//      trasigt, och det är precis då en skenande kostnad blir stor.
//   2. Tillgänglighetspriset är nära noll: samma DB-väg används av
//      AI-brytaren ovan (som redan failar closed) och av `auth.getUser` —
//      är den nere svarar funktionen ändå inte.
// Kostar felet PENGAR och finns flera skydd: fail open (ai.js). Är taket enda
// skyddet för den dyraste modellen: fail closed. Ändras policyn — skriv om
// rutan. Harmonisera aldrig tyst.
const DAILY_TOKEN_CAP = (() => {
  const raw = parseInt(Deno.env.get('AI_DAILY_TOKEN_CAP') ?? '50000', 10)
  return Number.isFinite(raw) && raw > 0 ? raw : 50000
})()

export interface TokenCapResult {
  allowed: boolean
  used: number
  limit: number
  remaining: number
  reason?: 'over_cap' | 'lookup_failed'
}

/**
 * Räknar användarens `tokens_used` de senaste 24 timmarna ur `ai_usage_logs`.
 *
 * @param serviceClient service-role-klienten. `ai_usage_logs` har RLS; en
 *   användarburen klient ser inte nödvändigtvis sina egna rader och skulle då
 *   räkna fel — och åt fel håll (0 använt = alltid tillåtet). Använd service role.
 */
export async function checkDailyTokenCap(
  serviceClient: SupabaseClient,
  userId: string,
): Promise<TokenCapResult> {
  const base = { used: 0, limit: DAILY_TOKEN_CAP, remaining: 0 }
  if (!serviceClient || !userId) {
    return { ...base, allowed: false, reason: 'lookup_failed' as const }
  }
  try {
    const sedan = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { data, error } = await serviceClient
      .from('ai_usage_logs')
      .select('tokens_used')
      .eq('user_id', userId)
      .gte('created_at', sedan)

    if (error) {
      console.warn('[AiGate] tokentak: uppslag misslyckades (blockerar):', error.message)
      return { ...base, allowed: false, reason: 'lookup_failed' as const }
    }

    const used = (data ?? []).reduce(
      (sum: number, row: { tokens_used: number | null }) => sum + (row.tokens_used ?? 0),
      0,
    )

    return {
      allowed: used < DAILY_TOKEN_CAP,
      used,
      limit: DAILY_TOKEN_CAP,
      remaining: Math.max(0, DAILY_TOKEN_CAP - used),
      reason: used < DAILY_TOKEN_CAP ? undefined : ('over_cap' as const),
    }
  } catch (err) {
    console.warn('[AiGate] tokentak: kastade (blockerar):', err instanceof Error ? err.message : err)
    return { ...base, allowed: false, reason: 'lookup_failed' as const }
  }
}

/** Bygger 429/503-svaret för ett nekat tokentak. */
export function createTokenCapResponse(cap: TokenCapResult, origin: string | null): Response {
  if (cap.reason === 'lookup_failed') {
    return createAiErrorResponse(
      AI_GATE_CODES.AI_USAGE_CHECK_FAILED,
      'Vi kunde inte kontrollera din AI-användning just nu. Försök igen om en stund.',
      503,
      origin,
    )
  }
  return createAiErrorResponse(
    AI_GATE_CODES.AI_DAILY_LIMIT,
    `Du har nått dagens AI-gräns (${cap.limit} tokens). Försök igen i morgon.`,
    429,
    origin,
    { dailyTokensUsed: cap.used, dailyTokenLimit: cap.limit },
  )
}

// ============================================================
// Indatasanering före prompt
// ============================================================
// Motsvarar `sanitizeInput` i `client/api/ai.js`: kapa längd, ta bort
// vinkelparenteser och styrtecken. Allt användarstyrt som interpoleras in i
// en prompt ska gå genom den här — inte bara textfält, se `clampInt` nedan.
export function sanitizeForPrompt(input: unknown, maxLength: number): string {
  if (input === null || input === undefined) return ''
  return String(input)
    .slice(0, maxLength)
    .replace(/[<>]/g, '')
    // Styrtecken (inkl. radbrytningar) → mellanslag: hindrar att en söksträng
    // bryter ut ur sitt stycke och ser ut som en ny instruktion i prompten.
    .replace(/[\u0000-\u001F\u007F]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

/**
 * Klampar ett tal från klienten till ett heltal i [min, max].
 *
 * Finns för att `maxResults` interpolerades otypkontrollerat rakt in i
 * systemprompten (`Max ${maxResults} företag`) — en sträng därifrån hamnade
 * ordagrant i modellens instruktioner, alltså en injektionsvektor, och ett
 * orimligt tal styrde dessutom `slice()` och antalet Bolagsverket-anrop.
 */
export function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === 'number' ? value : parseInt(String(value ?? ''), 10)
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, Math.trunc(n)))
}

export default {
  AI_GATE_CODES,
  checkAiEnabled,
  createGateDenialResponse,
  checkDailyTokenCap,
  createTokenCapResponse,
  createAiErrorResponse,
  sanitizeForPrompt,
  clampInt,
}
