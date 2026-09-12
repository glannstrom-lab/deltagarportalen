const { createClient } = require('@supabase/supabase-js');
const { logAiUsage } = require('./_utils/ai-usage-log');
// BL6 (2026-09-12): felrapport till Sentry, sanerad — se _utils/sentry.js
const { medFelrapport } = require('./_utils/sentry.js');

// ============================================
// Modell-låsning (B18, 2026-08-05)
// ============================================
// `openai/gpt-oss-120b` är låst av kostnadsskäl — användarbeslut 2026-05-09,
// se docs/AI_MODEL_LOCKING.md. Byt ALDRIG modell utan explicit beslut.
//
// Varför en funktion i stället för fyra literaler: modellnamnet stod tidigare
// på fyra ställen i den här filen, och ett av dem läste dessutom
// `process.env.AI_MODEL_HAIKU` först — en kvarleva från Anthropic-eran som
// inte fanns någon annanstans i repot och som kommentaren bredvid påstod
// motsatsen om ("samma modell som AI_MODEL"). Var den satt i Vercels miljö
// körde följdfrågorna en annan modell än låsningen anger, utan att någon kod
// eller dokumentation avslöjade det. Nu finns exakt en väg till modellnamnet.
//
// `AI_MODEL` är kvar som dokumenterad rollback-spak (sätt den i Vercel om
// modellen behöver bytas i drift); den gäller då alla vägar samtidigt.
const LOCKED_MODEL = 'openai/gpt-oss-120b';

/** Enda källan till modellnamnet i den här filen. Lägg aldrig till en till. */
function resolveModel() {
  return process.env.AI_MODEL || LOCKED_MODEL;
}

// ============================================
// SECURITY: Input Sanitization (paritet med supabase/functions/ai-assistant)
// ============================================

// ============================================
// SECURITY: Server-side PII-sanering (B29, 2026-08-12)
// ============================================
// Servern saniterade tidigare BARA `[<>]` ovan — prompt-injection-skydd, INTE
// PII-sanering. Klientens `sanitizeForAi` (client/src/lib/piiSanitizer.ts) gör
// den riktiga PII-strippningen, men den körs bara i webbläsaren. En direkt
// POST mot /api/ai (curl, devtools, en framtida integration) gick alltså
// igenom med personnummer och bankkontonummer intakta ända till OpenRouter —
// bevisat live. Klientsaneringen är ingen sanering; den är en artighet som
// går att kringgå. Servern måste sanera OBEROENDE av vad klienten gjorde.
//
// Mönstren är PORTERADE (inte importerade) från piiSanitizer.ts: den filen är
// ESM/TypeScript som Vite bygger för webbläsaren, den här filen är en
// CommonJS Vercel-funktion — samma klient/server-gräns som redan finns för
// ART9_FUNCTIONS (se synk-kommentaren i aiApi.ts). HÅLL MÖNSTREN I SYNK MED
// piiSanitizer.ts MANUELLT — ändras ett regex där, ändra det här också.
//
// Strategi: MASKERA, avvisa inte. Ett regexbaserat personnummer-/bankkonto-
// mönster ger då och då falska positiva (långa referensnummer, vissa datum-
// kombinationer) — att avvisa hela anropet på en falsk positiv gör
// funktionen oanvändbar för ett legitimt ärende. Ingen av mallarna i PROMPTS
// nedan behöver en riktig e-post/telefon/personnummer/bankkonto i själva
// PROMPTEN för att generera sitt svar (enda undantaget är `data.name` i
// `profile-summary`, som är ett namn, inte en kontrolluppgift) — så en
// maskerad platshållare kostar ingen funktionalitet.
//
// E-post och telefon MASKERAS här (till skillnad från klienten, som bara
// VARNAR och behåller dem obrutna) — uppdraget (B29) kräver dem uttryckligen,
// och ingen prompt-mall behöver dem för att fungera.

/** Luhn-algoritmen — identisk med piiSanitizer.ts. */
function luhnCheck(digits) {
  let sum = 0;
  let shouldDouble = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = parseInt(digits[i], 10);
    if (shouldDouble) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

/**
 * Maskerar PII i en sträng innan den kan nå en AI-prompt. Ordningen är
 * medveten: IBAN före bankkonto (siffrorna överlappar annars).
 */
function stripPii(text) {
  if (typeof text !== 'string' || !text) return text;
  let out = text;

  // Svenska personnummer/samordningsnummer: YYYYMMDD-XXXX, YYMMDD-XXXX,
  // YYMMDD+XXXX, YYYYMMDDXXXX — med och utan sekel, med och utan bindestreck.
  out = out.replace(
    /\b(?:19|20)?\d{2}(?:0[1-9]|1[0-2])(?:[0-2][0-9]|3[01]|[6-8][0-9]|9[01])\s*[-+]?\s*\d{4}\b/g,
    '[BORTTAGET-PERSONNUMMER]'
  );

  // Kreditkortsnummer (Luhn-verifierat) — grov match, sedan checksumma.
  out = out.replace(/\b(?:\d[ -]?){12,18}\d\b/g, (match) => {
    const digits = match.replace(/\D/g, '');
    return digits.length >= 13 && digits.length <= 19 && luhnCheck(digits)
      ? '[BORTTAGET-KORTNUMMER]'
      : match;
  });

  // IBAN — svensk: SE + 22 tecken. Måste köras FÖRE bankRegex.
  out = out.replace(
    /\bSE\d{2}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b/gi,
    '[BORTTAGET-IBAN]'
  );

  // Svenska bankkonto (clearing + nummer), PlusGiro, BankGiro.
  out = out.replace(/\b\d{4,5}[\s-]\d{3,4}[\s-]\d{3,4}(?:[\s-]\d{1,4})?\b/g, (match) => {
    const digits = match.replace(/\D/g, '');
    return digits.length >= 10 && digits.length <= 16 ? '[BORTTAGET-BANKKONTO]' : match;
  });

  // E-post.
  out = out.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, '[BORTTAGET-EPOST]');

  // Svenska telefonnummer: 070-XXX XX XX, +46 70 XXX XX XX, 08-XX XX XX, etc.
  out = out.replace(/\b(?:\+46[-\s]?|0)(?:\d[-\s]?){8,11}\b/g, '[BORTTAGET-TELEFON]');

  return out;
}

/**
 * Sanera en sträng innan den interpoleras i en AI-prompt.
 * Tar bort potentiella HTML/XML-taggar, maskerar PII (B29) och kapar längd
 * för att förhindra prompt-injection och token-overflow.
 */
function sanitizeInput(input, maxLength = 5000) {
  if (input == null) return '';
  const withoutTags = String(input).slice(0, maxLength).replace(/[<>]/g, '');
  return stripPii(withoutTags).trim();
}

/**
 * Rekursivt sanera alla strängvärden i ett data-objekt.
 * Bevarar struktur (arrays, nested objects, numbers, booleans).
 * Anropas i toppen av handler så att efterföljande PROMPTS-templates får
 * redan saniterad data — ingen sanering behövs sedan i prompt-templates.
 */
function sanitizeAll(obj, depth = 0) {
  if (depth > 10) return obj; // Recursion safety
  if (obj == null) return obj;
  if (typeof obj === 'string') return sanitizeInput(obj);
  if (Array.isArray(obj)) return obj.map((v) => sanitizeAll(v, depth + 1));
  if (typeof obj === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      out[k] = sanitizeAll(v, depth + 1);
    }
    return out;
  }
  return obj; // numbers, booleans
}

// KA3 (2026-09-12): promptbiblioteket och dess delade konstanter (REGELVERKSREGEL,
// SANNINGSREGEL, AGENT_PROMPTS m.fl.) bor i ./_prompts/ — en fil per domän och
// sammansättningen (inkl. sanningsregeln på varje prompt) i ./_prompts/index.js.
const { PROMPTS } = require('./_prompts');

// ============================================
// Rate Limiting Configuration
// ============================================

// Rate limits per AI function (requests per 15 minutes)
const RATE_LIMITS = {
  'personligt-brev': { limit: 10, windowMinutes: 15 },
  'cv-writing': { limit: 20, windowMinutes: 15 },
  'intervju-simulator': { limit: 20, windowMinutes: 15 },
  'intervju-sammanfattning': { limit: 10, windowMinutes: 15 },
  'karriarplan': { limit: 5, windowMinutes: 15 },
  'kompetensgap': { limit: 10, windowMinutes: 15 },
  'adaptation-recommendations': { limit: 10, windowMinutes: 15 },
  'adaptation-conversation': { limit: 10, windowMinutes: 15 },
  'cv-jobbmatchning': { limit: 10, windowMinutes: 15 },
  // CV-importen är TVÅ anrop som körs parallellt (rubrikdelen och
  // erfarenhetsdelen). Uppmätt mot prod 2026-08-19: den låsta modellen ger
  // ~9 tokens/s, och Vercel-funktionen dör vid 60 s. Ett odelat anrop som
  // skulle återge ett helt CV krävde 800–1200 tokens ut och timade ut med
  // 504 för varje CV av normal längd. Två mindre svar hinner klart.
  'cv-import': { limit: 10, windowMinutes: 60 },
  'cv-import-erfarenhet': { limit: 10, windowMinutes: 60 },
  'linkedin-optimering': { limit: 15, windowMinutes: 15 },
  'profile-summary': { limit: 10, windowMinutes: 15 },
  'chatbot': { limit: 30, windowMinutes: 15 },
  'ai-team-chat': { limit: 50, windowMinutes: 15 },
  'vecko-reflektion': { limit: 5, windowMinutes: 60 },
  'konsulent-rapportutkast': { limit: 10, windowMinutes: 15 },
  'default': { limit: 20, windowMinutes: 15 }
};

// In-memory fallback för rate limiting när Supabase-RPC failar. Serverless →
// per-instans (delas ej mellan varma instanser), men förhindrar att en
// enskild instans blir helt obegränsad vid DB-avbrott (fail-closed-ish istället
// för fail-open). Föredras framför att släppa igenom allt.
const rlFallbackStore = new Map();
function rateLimitFallback(userId, functionName, config) {
  const key = `${userId}:${functionName}`;
  const now = Date.now();
  const windowMs = config.windowMinutes * 60 * 1000;
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

/**
 * Check rate limit using Supabase distributed storage
 * @param {object} supabase - Supabase client
 * @param {string} userId - User ID for rate limiting
 * @param {string} functionName - AI function name
 * @returns {Promise<{allowed: boolean, remaining: number, resetIn: number}>}
 */
async function checkRateLimit(supabase, userId, functionName) {
  const config = RATE_LIMITS[functionName] || RATE_LIMITS.default;

  try {
    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_identifier: userId,
      p_endpoint: `ai-${functionName}`,
      p_max_requests: config.limit,
      p_window_minutes: config.windowMinutes
    });

    if (error) {
      console.error('[RateLimit] Supabase error, using in-memory fallback:', error.message);
      return rateLimitFallback(userId, functionName, config);
    }

    if (data && data.length > 0) {
      const result = data[0];
      const resetIn = result.reset_at
        ? Math.max(0, new Date(result.reset_at).getTime() - Date.now())
        : config.windowMinutes * 60 * 1000;

      return {
        allowed: result.allowed,
        remaining: result.remaining || 0,
        resetIn
      };
    }

    return { allowed: true, remaining: config.limit, resetIn: 0 };
  } catch (err) {
    console.error('[RateLimit] Error, using in-memory fallback:', err.message);
    return rateLimitFallback(userId, functionName, config);
  }
}

// ============================================
// Daily Token Cap (C4) — kostnadsskydd per användare
// ============================================
// Räkna tokens_used per dygn från ai_usage_logs. Block om > N.
// Default 50k tokens/dygn räcker för normal användning men stoppar
// abuse där en user kunde bränna 16M tokens/dygn inom rate-limit.
const DAILY_TOKEN_CAP = parseInt(process.env.AI_DAILY_TOKEN_CAP || '50000', 10);

async function checkDailyTokenCap(serviceClient, userId) {
  if (!serviceClient || !userId) return { allowed: true, used: 0 };
  try {
    const { data, error } = await serviceClient
      .from('ai_usage_logs')
      .select('tokens_used')
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
    if (error) {
      console.warn('[TokenCap] query failed (allowing):', error.message);
      return { allowed: true, used: 0 };
    }
    const used = (data || []).reduce((sum, row) => sum + (row.tokens_used || 0), 0);
    return {
      allowed: used < DAILY_TOKEN_CAP,
      used,
      limit: DAILY_TOKEN_CAP,
      remaining: Math.max(0, DAILY_TOKEN_CAP - used),
    };
  } catch (err) {
    console.warn('[TokenCap] threw (allowing):', err.message);
    return { allowed: true, used: 0 };
  }
}

// ============================================
// Art. 9-samtyckesgrind (UX13, 2026-08-03)
// ============================================
// Funktioner som tar emot SÄRSKILDA KATEGORIER av personuppgifter (GDPR art. 9)
// — hälsa, mående, funktionsnedsättning, behov av arbetsplatsanpassning.
// För dem finns ingen laglig grund utan UTTRYCKLIGT samtycke (art. 9.2.a), och
// data går vidare till OpenRouter i USA. Klientens AiConsentGate räcker inte:
// den går att kringgå med ett direkt POST mot /api/ai.
//
// Medvetet UTANFÖR listan:
//  - Konsulentfunktionen (`konsulent-rapportutkast`) behandlar en
//    ANNAN persons uppgifter än den inloggade. Att grinda dem på konsulentens
//    eget `ai_consent_at` vore fel person och falsk trygghet — deras rättsliga
//    grund är en egen fråga för AI-juristen (ROADMAP A2).
//  - Övriga funktioner (CV, brev, intervju, kompetensgap …) är art. 6-data.
//    Att grinda ALL AI på samtycket är ett produktbeslut för Mikael — 75 av 92
//    profiler saknar `ai_consent_at` (mätt i prod 2026-08-03), så det skulle
//    släcka AI för 82 % av användarna. Ligger i ROADMAP:s beslutslogg.
const ART9_FUNCTIONS = new Set([
  'vecko-reflektion',            // dagboksanteckningar + måendeloggar
  'adaptation-recommendations',  // behov av arbetsplatsanpassning
  'adaptation-conversation',     // samma behov, formulerade till arbetsgivaren
  // B16 (2026-08-05): AI-team-chatten skickar art. 9-data om användaren SJÄLV.
  // Inte som en teoretisk möjlighet — det byggs in i prompten:
  //   - `useAITeamContext.ts:421-427` lägger ett [ENERGINIVÅ]-block för
  //     agenten `arbetsterapeut`
  //   - `:295-309` lägger [STÖDMÅL] med `supportGoals.challenges` för
  //     `arbetsterapeut` och `motivationscoach` — personens egna beskrivna
  //     hinder, i praktiken hälsa/funktionsnedsättning
  //   - `AGENT_PROMPTS.arbetsterapeut` nedan säger uttryckligen att agenten
  //     har tillgång till användarens energinivå
  // Att den låg utanför listan var ett förbiseende, inte ett beslut — de tre
  // raderna ovan skrevs innan AI-teamet fick sin kontextbyggare.
  'ai-team-chat',
]);

/**
 * Kontrollerar art. 9-samtycke för den inloggade användaren.
 *
 * **Fail closed.** Går uppslaget inte att göra vet vi inte om samtycke finns,
 * och då får särskilda kategorier inte lämna portalen. Det är motsatt policy
 * mot token-taket ovan (som släpper igenom vid fel) — där är risken en kostnad,
 * här är risken en olaglig överföring.
 *
 * @param {object} supabase - klient som bär användarens token i
 *   `global.headers.Authorization`, så att uppslaget går som `authenticated`
 *   och RLS släpper fram den egna profilraden. En klient byggd på enbart
 *   anon-nyckeln går som `anon` och får 0 rader — då nekar den här grinden
 *   alla, för alltid (A19). Skicka aldrig in den oautentiserade klienten.
 * @param {string} userId
 */
async function checkArt9Consent(supabase, userId) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('ai_consent_at, ai_enabled')
      .eq('id', userId)
      .single();
    if (error || !data) {
      console.warn('[Art9Consent] uppslag misslyckades (blockerar):', error?.message);
      return { allowed: false, reason: 'lookup_failed' };
    }
    if (!data.ai_consent_at) return { allowed: false, reason: 'no_consent' };
    // ai_enabled är default TRUE; bara explicit FALSE är en art. 21-invändning
    if (data.ai_enabled === false) return { allowed: false, reason: 'opted_out' };
    return { allowed: true };
  } catch (err) {
    console.warn('[Art9Consent] kastade (blockerar):', err.message);
    return { allowed: false, reason: 'lookup_failed' };
  }
}

// ============================================
// Allmän AI-av-grind (B28, 2026-08-12)
// ============================================
// `profiles.ai_enabled` är användarens GENERELLA på/av-brytare för AI (GDPR
// art. 21 — invändning mot profilering, se useAiConsent.ts). Inställnings-
// sidans knapp heter "Pausa AI" och texten lovar "AI-funktioner är pausade"
// — inte "art. 9-funktionerna är pausade". Innan den här ändringen kollades
// `ai_enabled` bara INUTI `checkArt9Consent`, dvs för de 4 funktionerna i
// ART9_FUNCTIONS. Bevisat live: med `ai_enabled = false` svarade både
// `personligt-brev` och `chatbot` HTTP 200 — 14 av 18 funktioner skickade
// alltså användarens uppgifter till OpenRouter trots att personen stängt av
// AI i Inställningar.
//
// Samma policy som art. 9-grinden ovan: FAIL CLOSED. Går uppslaget fel vet vi
// inte om personen har stängt av AI, och kostnaden för att gissa fel är en
// överföring personen uttryckligen invänt mot — inte en kostnad i kronor.
// Det är den MOTSATTA policyn mot `checkDailyTokenCap` nedan (som failar
// open, för att dess fel bara kostar pengar). Harmonisera dem ALDRIG till
// samma beteende — se CLAUDE.md, lärdomen "Fail closed vs. fail open".
//
// Medvetet UNDANTAGNA — namngivna, inte tyst utelämnade (samma resonemang
// som ART9_FUNCTIONS ovan): konsulentfunktionen behandlar en ANNAN
// persons uppgifter (deltagarens) på uppdrag av den inloggade konsulenten.
// Konsulentens EGEN "Pausa AI"-brytare är fel kontroll för deltagarens data
// — deltagarens rätt att invända mot att konsulenten kör AI på deras
// journal-/aktivitetsdata är en öppen fråga för AI-juristen (ROADMAP A2),
// inte löst här. Art. 6-funktionerna (CV, brev, intervju, kompetensgap …)
// är INTE undantagna — de är precis den läcka B28 hittade.
const AI_ENABLED_EXEMPT_FUNCTIONS = new Set([
  'konsulent-rapportutkast',
]);

/**
 * Kontrollerar den inloggade användarens `profiles.ai_enabled` — den
 * allmänna AI-av-brytaren. Skild från `checkArt9Consent` ovan (som redan
 * kontrollerar `ai_enabled` OCH `ai_consent_at` för ART9_FUNCTIONS); den här
 * funktionen anropas för alla ÖVRIGA funktioner utom
 * `AI_ENABLED_EXEMPT_FUNCTIONS`.
 *
 * **Fail closed** — se motivering ovan.
 *
 * @param {object} supabase - måste vara den RLS-medvetna, tokenbärande
 *   klienten (`supabaseAsUser`), ALDRIG den oautentiserade — se A19-
 *   kommentaren vid `supabaseAsUser` i handlern. En anon-klient ger 0 rader
 *   och den här grinden nekar då alla, för alltid.
 * @param {string} userId
 */
async function checkAiEnabled(supabase, userId) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('ai_enabled')
      .eq('id', userId)
      .single();
    if (error || !data) {
      console.warn('[AiEnabledGate] uppslag misslyckades (blockerar):', error?.message);
      return { allowed: false, reason: 'lookup_failed' };
    }
    // ai_enabled är default TRUE; bara explicit FALSE är en art. 21-invändning
    if (data.ai_enabled === false) return { allowed: false, reason: 'opted_out' };
    return { allowed: true };
  } catch (err) {
    console.warn('[AiEnabledGate] kastade (blockerar):', err.message);
    return { allowed: false, reason: 'lookup_failed' };
  }
}

/**
 * Organisationens AI-brytare (kommunspåret, PUB-avvikelse 5). En kommun kan
 * stänga AI för ALLA deltagare kopplade till dess konsulenter, oavsett
 * deltagarens egen `ai_enabled`. Läses genom vyn `my_ai_policy`
 * (migration 20260912010000), som körs med ägarens rättigheter och filtrerar
 * på auth.uid() — därför MÅSTE klienten vara den tokenbärande
 * `supabaseAsUser`, precis som för `checkAiEnabled` (A19-fällan).
 *
 * Ingen rad = deltagaren är inte kopplad till någon organisation = ingen spärr.
 * Fail closed vid uppslagsfel, samma policy som de två andra grindarna:
 * kostnaden för att gissa fel är en behandling kommunen förbjudit.
 */
async function checkOrgAiEnabled(supabase, userId) {
  if (!supabase || !userId) return { allowed: false, reason: 'lookup_failed' };
  try {
    const { data, error } = await supabase.from('my_ai_policy').select('org_name, ai_enabled');
    if (error) {
      console.warn('[OrgAiGate] uppslag misslyckades (blockerar):', error.message);
      return { allowed: false, reason: 'lookup_failed' };
    }
    const sparr = (data || []).find((r) => r && r.ai_enabled === false);
    if (sparr) return { allowed: false, reason: 'org_disabled', orgName: sparr.org_name || null };
    return { allowed: true };
  } catch (err) {
    console.warn('[OrgAiGate] kastade (blockerar):', err.message);
    return { allowed: false, reason: 'lookup_failed' };
  }
}

// ============================================
// Retry-helper för OpenRouter (C6)
// ============================================
// Retrierar 5xx + 429 från OpenRouter med exponential backoff.
// 2 retries totalt → räddar ~80% av tillfälliga 502/503/529-fel.
async function fetchWithRetry(url, options, maxRetries = 2) {
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      // 5xx + 429 → retry. Annars returnera direkt (succees eller permanenta fel)
      if (response.ok || (response.status < 500 && response.status !== 429)) {
        return response;
      }
      lastError = new Error(`HTTP ${response.status}`);
      if (attempt < maxRetries) {
        const backoff = 2000 * Math.pow(2, attempt); // 2s, 4s
        console.warn(`[AI] ${response.status} from OpenRouter, retry ${attempt + 1}/${maxRetries} in ${backoff}ms`);
        await new Promise(r => setTimeout(r, backoff));
        continue;
      }
      return response; // sista försöket: returnera vad vi har
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) {
        const backoff = 2000 * Math.pow(2, attempt);
        console.warn(`[AI] Network error, retry ${attempt + 1}/${maxRetries} in ${backoff}ms:`, err.message);
        await new Promise(r => setTimeout(r, backoff));
        continue;
      }
      throw lastError;
    }
  }
  throw lastError;
}

// ============================================
// Security: Allowed origins for CORS
// ============================================
const ALLOWED_ORIGINS = [
  // Production domains
  'https://deltagarportalen.se',
  'https://www.deltagarportalen.se',
  'https://deltagarportalen.vercel.app',
  'https://deltagarportal.vercel.app',
  // Legacy domains
  'https://jobin.se',
  'https://www.jobin.se',
  // Environment-specific frontend URL
  process.env.FRONTEND_URL,
  // Allow localhost in development only
  ...(process.env.NODE_ENV !== 'production' ? [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
    'http://127.0.0.1:5173'
  ] : []),
  // Deployens egen URL. Vercel satter dessa per deployment - de kan inte sattas av
  // nagon annans projekt, till skillnad fran den gamla namnmatchningen (A32).
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
  process.env.VERCEL_BRANCH_URL ? `https://${process.env.VERCEL_BRANCH_URL}` : null,
  process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null,
].filter(Boolean);

/**
 * A32 (2026-09-01) - den gamla preview-regexen var forfalskningsbar.
 *
 * Den matchade VILKEN vercel.app-deploy som helst vars projektnamn borjar med
 * `deltagarportal`. Vem som helst kan skapa ett Vercel-projekt med det namnet och far da
 * en URL pa formen `deltagarportalen-<hash>-<egen-team-slug>.vercel.app`.
 *
 * Bevisat mot skarp drift 2026-09-01:
 *   curl -i -X POST https://www.jobin.se/api/ai
 *        -H 'Origin: https://deltagarportalen-abc123-evilteam.vercel.app'
 *   -> Access-Control-Allow-Origin reflekterade angriparens origin,
 *      och svaret bar dessutom credentials-rubriken.
 * (En helt frammande origin foll korrekt tillbaka pa deltagarportalen.se.)
 *
 * ATGARD: monstermatchningen ar borta. I stallet tillater varje deploy SIN EGEN URL,
 * hamtad ur Vercels systemvariabler. De satts av plattformen per deployment och kan inte
 * sattas av nagon annans projekt, sa previews fortsatter fungera medan gissningsytan ar noll.
 *
 * Credentials-rubriken ar ocksa borttagen. Portalen autentiserar med
 * `Authorization: Bearer <supabase-token>` - en header, inte en cookie - och `credentials:`
 * finns inte i nagon fetch i `client/src`. Rubriken gav alltsa ingen funktion, bara den
 * egenskap som gor en reflekterad origin farlig.
 *
 * Vaktat av `client/src/test/cors-preview.test.ts`. Vakten matchar KODFORMEN med
 * citattecken och kolon - inte det losa ordet, som ju star har i kommentaren. En vakt som
 * matchar sin egen forklaring kan aldrig bli gron (lardomen fran 2026-08-21).
 */

/**
 * Get CORS headers with origin validation
 */
function getCorsHeaders(requestOrigin) {
  const isAllowed = ALLOWED_ORIGINS.includes(requestOrigin);
  const origin = isAllowed ? requestOrigin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

/**
 * DR5 (2026-08-17): svarsformen från OpenRouter, avsmalnad i stället för
 * tagen för given. `await res.json()` ger `unknown`, och typkontrollen av
 * `client/api/` (som kördes för första gången i dag) fällde på tre läsningar
 * av `.choices` och `.usage`. Samma grepp som B21: beskriv formen en gång, så
 * blir det synligt den dag leverantören ändrar den.
 *
 * `finish_reason` och `usage.completion_tokens_details.reasoning_tokens`
 * tillkom 2026-08-19: när `content` är tomt är de enda sättet att se om
 * budgeten tog slut under modellens tänkande eller om något annat hände.
 *
 * @typedef {{ choices?: Array<{ message?: { content?: string }, finish_reason?: string }>, usage?: { total_tokens?: number, completion_tokens?: number, completion_tokens_details?: { reasoning_tokens?: number } } }} OpenRouterSvar
 */

// ============================================
// Svarsvalidering för JSON-funktioner (B17, 2026-08-05)
// ============================================
//
// Handlern gjorde tidigare `try { JSON.parse(content) } catch { content = { raw: content } }`
// och skickade resultatet vidare orört. Två problem:
//
//  1. **Code fences.** Modellen svarar då och då med ```json … ``` trots
//     "Svara ENDAST med JSON". `JSON.parse` fäller det, svaret blev `{ raw }`
//     och funktioner utan Zod på klienten renderade `undefined`.
//  2. **Ingen formkontroll.** Ett objekt som parsade men saknade fälten UI:t
//     läser gick rakt in i vyn. `intervju-simulator` har ingen Zod-validering
//     hos anroparen (`sta-doa-sammanfattning` hade det inte heller — borta 2026-09-12).
//
// `extractJsonContent` löser (1) för ALLA parseJson-funktioner — de som redan
// Zod-validerar (`karriarplan`, `kompetensgap`, `intervju-sammanfattning`,
// `vecko-reflektion`) blir bara mer robusta, deras
// `{ raw }`-fallback finns kvar orörd. `RESPONSE_VALIDATORS` löser (2) för
// funktionen som saknar skydd hos anroparen.
//
// Designval: en validator får **normalisera bort** enskilda trasiga fält, men
// fälla hela svaret bara när det inte går att använda. Ett hårt fel på
// "nastaFraga saknades" hade stoppat en intervju som annars fungerar; ett
// tyst `undefined` i ett betygsfält hade däremot blivit ett påhittat betyg
// (precis vad B12 rättade). Skillnaden är vad felet kostar.

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/** Trimmad sträng om det finns text, annars undefined. */
function nonEmptyString(value) {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/**
 * Tolkar modellens svar som JSON, även när det är inbäddat i markdown eller
 * omgivet av prosa.
 *
 * @returns {{ ok: true, value: unknown } | { ok: false }}
 */
function extractJsonContent(raw) {
  if (typeof raw !== 'string') return { ok: false };
  const text = raw.trim();
  if (!text) return { ok: false };

  const candidates = [text];

  // ```json … ``` eller ``` … ```
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fenced && fenced[1]) candidates.push(fenced[1].trim());

  // Första { … sista } respektive [ … ] — fångar "Här kommer JSON: {…}"
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    candidates.push(text.slice(firstBrace, lastBrace + 1));
  }
  const firstBracket = text.indexOf('[');
  const lastBracket = text.lastIndexOf(']');
  if (firstBracket !== -1 && lastBracket > firstBracket) {
    candidates.push(text.slice(firstBracket, lastBracket + 1));
  }

  for (const candidate of candidates) {
    try {
      return { ok: true, value: JSON.parse(candidate) };
    } catch {
      // nästa kandidat
    }
  }
  return { ok: false };
}

/**
 * Formkontroll per funktion. Nyckeln är funktionsnamnet; körs bara när
 * mallen har `parseJson: true`.
 *
 * @returns {{ ok: true, value: unknown } | { ok: false, error: string }}
 */
const RESPONSE_VALIDATORS = {
  // Feedback-grenen: {"rating":1-5,"feedback":"…","nastaFraga":"…"}
  // Klienten (`pages/InterviewSimulator.tsx`) har sedan B12 egna vakter på
  // rating och feedback, men ingen på svarets FORM — en `{ raw: "…" }` eller
  // en array hade tagit den tysta vägen: inget betyg, ingen feedback, och en
  // hårdkodad reservfråga som ser ut som ett AI-svar.
  'intervju-simulator': (value) => {
    if (!isPlainObject(value)) {
      return { ok: false, error: 'intervjusvaret var inte ett JSON-objekt' };
    }
    const feedback = nonEmptyString(value.feedback);
    const nastaFraga = nonEmptyString(value.nastaFraga);
    if (!feedback && !nastaFraga) {
      return { ok: false, error: 'intervjusvaret saknade både feedback och nästa fråga' };
    }
    const out = {};
    // Betyget släpps bara igenom som heltal 1-5. Allt annat utelämnas hellre
    // än normaliseras — ett gissat betyg är värre än inget betyg.
    const rating = typeof value.rating === 'number' ? Math.round(value.rating) : NaN;
    if (Number.isFinite(rating) && rating >= 1 && rating <= 5) out.rating = rating;
    if (feedback) out.feedback = feedback;
    if (nastaFraga) out.nastaFraga = nastaFraga;
    return { ok: true, value: out };
  },

  // Ett uppladdat CV som tolkas fel blir ett TOMT CV i "Dina CV" — och den
  // som laddat upp sin fil tror då att portalen sparat det. Fäll hellre
  // anropet: klienten visar "vi kunde inte läsa filen" och erbjuder att
  // fylla i för hand. Fälten passeras oförändrade; validatorn skalar bort
  // former som inte går att rendera, den skriver aldrig om innehåll.
  // Ett uppladdat CV som tolkas fel blir ett TOMT CV i byggaren — och den som
  // laddat upp sin fil tror då att portalen läst den. Fäll hellre anropet:
  // klienten visar "vi kunde inte läsa filen" och erbjuder att fylla i för
  // hand. Validatorerna skalar bort former som inte går att rendera; de
  // skriver aldrig om innehåll.
  //
  // Två validatorer eftersom importen är två anrop — se kommentaren vid
  // prompterna. Den som slår ihop dem igen får tillbaka 504:an.
  'cv-import': (value) => {
    if (!isPlainObject(value)) {
      return { ok: false, error: 'CV-importen var inte ett JSON-objekt' };
    }
    const str = (v) => (typeof v === 'string' ? v.trim() : '');
    const objArray = (v, falt, tak) => (Array.isArray(v) ? v.filter(isPlainObject).slice(0, tak).map((rad) => {
      const ut = {};
      falt.forEach((f) => { const t = str(rad[f]); if (t) ut[f] = t; });
      return ut;
    }).filter((rad) => Object.keys(rad).length > 0) : []);

    const ut = {
      firstName: str(value.firstName),
      lastName: str(value.lastName),
      title: str(value.title),
      email: str(value.email),
      phone: str(value.phone),
      location: str(value.location),
      summary: str(value.summary).substring(0, 400),
      skills: Array.isArray(value.skills) ? value.skills.map(str).filter(Boolean).slice(0, 20) : [],
      languages: objArray(value.languages, ['language', 'level'], 10),
      certificates: objArray(value.certificates, ['name', 'issuer', 'date'], 10),
    };

    const harInnehall = Boolean(
      ut.firstName || ut.lastName || ut.title || ut.summary || ut.skills.length
    );
    if (!harInnehall) {
      return { ok: false, error: 'CV-importen innehöll inga läsbara fält' };
    }
    return { ok: true, value: ut };
  },

  // Expanderar det KOMPAKTA svaret till den objektform klienten väntar sig.
  //
  // Prompten ber om positionella arrayer — `[titel, företag, start, slut,
  // pågående]` — eftersom nyckelnamnen annars är merparten av utdatan och
  // sprängde 60-sekunderstaket (se kommentaren vid prompten). Expansionen
  // hör hemma här och inte i klienten: formatet är en förhandling mellan
  // prompt och modell, och klienten ska inte behöva veta om den.
  //
  // Objektform accepteras fortfarande som fallback. Modellen faller ibland
  // tillbaka på den, och ett svar vi kan läsa ska inte fällas för att det kom
  // i fel skepnad.
  'cv-import-erfarenhet': (value) => {
    if (!isPlainObject(value)) {
      return { ok: false, error: 'erfarenhetsimporten var inte ett JSON-objekt' };
    }
    const str = (v) => (typeof v === 'string' ? v.trim() : '');

    /** [titel, företag, start, slut, pågående] → { title, company, ... } */
    const franArray = (rad) => {
      if (!Array.isArray(rad)) return null;
      const ut = {};
      const title = str(rad[0]); if (title) ut.title = title;
      const company = str(rad[1]); if (company) ut.company = company;
      const startDate = str(rad[2]); if (startDate) ut.startDate = startDate;
      const endDate = str(rad[3]); if (endDate) ut.endDate = endDate;
      // Pågående kommer som 1/0, men true/"1"/"ja" har setts i praktiken.
      const p = rad[4];
      if (p === 1 || p === true || p === '1' || (typeof p === 'string' && /^(ja|yes|true)$/i.test(p))) {
        ut.current = true;
      }
      return Object.keys(ut).length > 0 ? ut : null;
    };

    /** [skola, examen, inriktning, startår, slutår] → { school, degree, ... } */
    const franUtbildningsArray = (rad) => {
      if (!Array.isArray(rad)) return null;
      const ut = {};
      const school = str(rad[0]); if (school) ut.school = school;
      const degree = str(rad[1]); if (degree) ut.degree = degree;
      const field = str(rad[2]); if (field) ut.field = field;
      const startDate = str(rad[3]); if (startDate) ut.startDate = startDate;
      const endDate = str(rad[4]); if (endDate) ut.endDate = endDate;
      return Object.keys(ut).length > 0 ? ut : null;
    };

    /** Fallback: objektform, som prompten hade tidigare. */
    const franObjekt = (rad, falt) => {
      if (!isPlainObject(rad)) return null;
      const ut = {};
      falt.forEach((f) => { const t = str(rad[f]); if (t) ut[f] = t; });
      if (rad.current === true) ut.current = true;
      return Object.keys(ut).length > 0 ? ut : null;
    };

    const lasLista = (v, franKompakt, falt, tak) => (Array.isArray(v)
      ? v.slice(0, tak)
          .map((rad) => (Array.isArray(rad) ? franKompakt(rad) : franObjekt(rad, falt)))
          .filter(Boolean)
      : []);

    const ut = {
      workExperience: lasLista(
        value.w ?? value.workExperience,
        franArray,
        ['title', 'company', 'location', 'startDate', 'endDate'],
        10,
      ).filter((rad) => rad.title || rad.company),
      education: lasLista(
        value.e ?? value.education,
        franUtbildningsArray,
        ['school', 'degree', 'field', 'startDate', 'endDate'],
        5,
      ).filter((rad) => rad.school || rad.degree),
    };

    // Här är tomt ett giltigt svar: alla CV har inte utbildning listad, och
    // ett förstagångssökande CV kan sakna arbetslivserfarenhet. Att fälla
    // anropet då hade gjort ett sant svar till ett fel. Rubrikdelen bär
    // kravet på innehåll.
    return { ok: true, value: ut };
  },

};

const hanterare = async (req, res) => {
  const requestOrigin = req.headers.origin;
  const corsHeaders = getCorsHeaders(requestOrigin);

  // Set CORS headers
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const token = authHeader.substring(7);
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
    );
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return res.status(401).json({ error: 'Invalid token' });

    // A19: `auth.getUser(token)` VALIDERAR token men sätter ingen session i
    // supabase-js v2 — efterföljande PostgREST-anrop på `supabase` går därför
    // som `anon`. Med RLS (`Users can view own profile USING (auth.uid() = id)`)
    // ger ett profiluppslag då 0 rader, `.single()` → PGRST116, och den fail
    // closed-grindade art. 9-kontrollen nekade ALLA — även de med samtycke.
    // Klienten nedan bär användarens token och går alltså som `authenticated`.
    // Samma mönster som client/api/cv-pdf.js:133.
    const supabaseAsUser = createClient(
      process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );

    const fn = req.body.function;
    // SECURITY: sanera all användardata innan den når PROMPTS-templates.
    // Förhindrar prompt-injection via t.ex. companyName: "Acme\n\nIgnorera alla instruktioner..."
    const data = sanitizeAll(req.body.data || req.body);

    // Check rate limit before processing
    const rateLimit = await checkRateLimit(supabase, user.id, fn);
    if (!rateLimit.allowed) {
      const retryAfter = Math.ceil(rateLimit.resetIn / 1000);
      res.setHeader('Retry-After', String(retryAfter));
      res.setHeader('X-RateLimit-Remaining', '0');
      return res.status(429).json({
        error: 'För många förfrågningar. Vänta en stund och försök igen.',
        retryAfter
      });
    }

    // Add rate limit headers
    res.setHeader('X-RateLimit-Remaining', String(rateLimit.remaining));

    // UX13: art. 9-data får inte lämna portalen utan uttryckligt samtycke.
    // Ligger efter rate limit så att en flod av blockerade anrop ändå bromsas,
    // men före token-taket och före att prompten byggs — vi vill inte ens
    // konstruera en prompt av hälsodata vi saknar grund för att behandla.
    // Kommunspåret: organisationens AI-brytare gäller alla funktioner som
    // rör deltagarens egna uppgifter — samma undantag som B28-grinden (de
    // konsulentfunktioner som behandlar en annan persons data).
    if (!AI_ENABLED_EXEMPT_FUNCTIONS.has(fn)) {
      const orgGate = await checkOrgAiEnabled(supabaseAsUser, user.id);
      if (!orgGate.allowed) {
        return res.status(403).json({
          error:
            orgGate.reason === 'org_disabled'
              ? `AI-funktionerna är avstängda av ${orgGate.orgName || 'din organisation'}. Det gäller oavsett din egen inställning — prata med din konsulent om du har frågor.`
              : 'Vi kunde inte kontrollera din organisations AI-inställning just nu, och skickar därför inte dina uppgifter vidare. Försök igen om en stund.',
          code: 'AI_CONSENT_REQUIRED',
          reason: orgGate.reason,
        });
      }
    }

    if (ART9_FUNCTIONS.has(fn)) {
      const consent = await checkArt9Consent(supabaseAsUser, user.id);
      if (!consent.allowed) {
        return res.status(403).json({
          error:
            consent.reason === 'opted_out'
              ? 'Du har stängt av AI-behandling av dina uppgifter. Slå på det i Inställningar om du vill använda den här funktionen.'
              : consent.reason === 'no_consent'
                ? 'Den här funktionen läser dina anteckningar om hälsa och mående. Den kräver att du först godkänner AI-behandling i Inställningar.'
                : 'Vi kunde inte kontrollera ditt samtycke just nu, och skickar därför inte dina uppgifter vidare. Försök igen om en stund.',
          code: 'AI_CONSENT_REQUIRED',
          reason: consent.reason,
        });
      }
    } else if (!AI_ENABLED_EXEMPT_FUNCTIONS.has(fn)) {
      // B28: den allmänna AI-av-grinden för de 14 funktioner som inte redan
      // täcks av art. 9-kontrollen ovan (som kollar `ai_enabled` för sina 4).
      const aiGate = await checkAiEnabled(supabaseAsUser, user.id);
      if (!aiGate.allowed) {
        return res.status(403).json({
          error:
            aiGate.reason === 'opted_out'
              ? 'Du har stängt av AI-behandling av dina uppgifter. Slå på det i Inställningar om du vill använda den här funktionen.'
              : 'Vi kunde inte kontrollera din AI-inställning just nu, och skickar därför inte dina uppgifter vidare. Försök igen om en stund.',
          code: 'AI_CONSENT_REQUIRED',
          reason: aiGate.reason,
        });
      }
    }

    // C4: Daily token cap — kostnadsskydd. Skipas om service-key saknas
    // (loggning är best-effort, vi blockerar inte AI om vi inte kan räkna).
    const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
    if (SUPABASE_URL && SERVICE_KEY) {
      const serviceClient = createClient(SUPABASE_URL, SERVICE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const tokenCap = await checkDailyTokenCap(serviceClient, user.id);
      if (!tokenCap.allowed) {
        return res.status(429).json({
          error: `Du har nått dagens AI-gräns (${tokenCap.limit} tokens). Försök igen i morgon.`,
          dailyTokensUsed: tokenCap.used,
          dailyTokenLimit: tokenCap.limit,
        });
      }
      res.setHeader('X-Daily-Tokens-Remaining', String(tokenCap.remaining));
    }
    const stream = req.body.stream === true;

    if (!fn || !PROMPTS[fn]) return res.status(400).json({ error: 'Invalid function: ' + fn });

    const prompt = PROMPTS[fn](data);

    // Streaming mode for ai-team-chat
    if (stream && fn === 'ai-team-chat') {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://jobin.se',
          'X-Title': 'Jobin'
        },
        body: JSON.stringify({
          // Låst modell — se resolveModel() i toppen av filen.
          model: resolveModel(),
          messages: [
            { role: 'system', content: prompt.system },
            { role: 'user', content: prompt.user }
          ],
          max_tokens: prompt.maxTokens,
          temperature: 0.7,
          stream: true
        })
      });

      if (!aiResponse.ok) {
        res.write(`data: ${JSON.stringify({ error: 'AI request failed' })}\n\n`);
        return res.end();
      }

      // Stream the response
      const reader = aiResponse.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullResponse = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const jsonStr = line.slice(6).trim();
              if (jsonStr === '[DONE]') {
                continue;
              }
              try {
                const parsed = JSON.parse(jsonStr);
                const token = parsed.choices?.[0]?.delta?.content;
                if (token) {
                  fullResponse += token;
                  // Skickar BÅDE { token } (legacy-fält för AgentChat) och
                  // { content } (matchar ai-stream.js + aiStreamService).
                  // Ny kod ska läsa { content }; { token } är deprecated och
                  // tas bort när AgentChat är migrerad till useAIStream.
                  res.write(`data: ${JSON.stringify({ token, content: token })}\n\n`);
                }
              } catch {
                // Skip malformed JSON
              }
            }
          }
        }
      } catch (streamError) {
        console.error('Stream error:', streamError);
      }

      // Generate follow-up suggestions
      try {
        const suggestionsResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://jobin.se',
            'X-Title': 'Jobin'
          },
          body: JSON.stringify({
            // B18 (2026-08-05): läste tidigare `AI_MODEL_HAIKU` först och kunde
            // därmed köra en annan modell än låsningen. Nu samma väg som allt
            // annat — se resolveModel().
            model: resolveModel(),
            messages: [
              { role: 'system', content: 'Du genererar korta, relevanta följdfrågor baserat på en konversation. Svara ENDAST med en JSON-array med exakt 3 korta frågor (max 8 ord var). Exempel: ["Hur skriver jag ett bra CV?", "Vilka jobb passar mig?", "Tips för intervjuer?"]' },
              { role: 'user', content: `Användaren frågade: "${data?.meddelande}"\n\nAssistenten svarade: "${fullResponse.substring(0, 500)}"\n\nGenerera 3 naturliga följdfrågor på svenska:` }
            ],
            max_tokens: 150,
            temperature: 0.8
          })
        });

        if (suggestionsResponse.ok) {
          const suggestionsData = /** @type {OpenRouterSvar} */ (await suggestionsResponse.json());
          const suggestionsText = suggestionsData.choices?.[0]?.message?.content || '[]';
          try {
            const suggestions = JSON.parse(suggestionsText);
            if (Array.isArray(suggestions) && suggestions.length > 0) {
              res.write(`data: ${JSON.stringify({ suggestions: suggestions.slice(0, 3) })}\n\n`);
            }
          } catch {
            // Couldn't parse suggestions, skip
          }
        }
      } catch {
        // Suggestions failed, continue without them
      }

      // Logga AI-usage (fire-and-forget). Tokens approximeras från svarslängd
      // eftersom OpenRouter:s SSE-stream inte alltid inkluderar usage-fältet.
      // ~4 chars per token är en rimlig avg för svenska/engelska.
      const streamModel = resolveModel();
      const approxTokens = Math.ceil((fullResponse?.length || 0) / 4);
      void logAiUsage(user.id, fn, streamModel, approxTokens);

      res.write('data: [DONE]\n\n');
      return res.end();
    }

    // Non-streaming mode (original behavior)
    // C6: fetchWithRetry retrierar 5xx + 429 upp till 2 ggr med 2s/4s backoff
    const aiResponse = await fetchWithRetry('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://jobin.se',
        'X-Title': 'Jobin'
      },
      body: JSON.stringify({
        // Låst modell — se resolveModel() i toppen av filen.
        model: resolveModel(),
        messages: [
          { role: 'system', content: prompt.system },
          { role: 'user', content: prompt.user }
        ],
        max_tokens: prompt.maxTokens,
        temperature: 0.7,
        // `openai/gpt-oss-120b` är en RESONERANDE modell: den tänker först och
        // svarar sedan, och båda delarna ryms inom `max_tokens`. Räcker inte
        // budgeten till efter tänkandet kommer `content` tillbaka TOMT — och
        // servern svarar då "No response from AI", vilket ser ut som ett
        // nätverksfel men är en budgetfråga. Uppmätt 2026-08-19: CV-importens
        // erfarenhetsdel föll 3/3 på ett CV med tio tjänster, på 6–34 s (alltså
        // inte en timeout), medan samma anrop klarade ett kort CV 3/3.
        //
        // `reasoning.effort` sätts bara för de prompts som uttryckligen ber om
        // det, så inget befintligt anrop ändrar beteende. Skickas fältet inte
        // alls är begäran identisk med tidigare.
        ...(prompt.reasoningEffort ? { reasoning: { effort: prompt.reasoningEffort } } : {})
      })
    });

    if (!aiResponse.ok) {
      // Statuskoden från OpenRouter fördes tidigare inte vidare någonstans, så
      // ett 400 (t.ex. ett fält modellen inte stöder) såg likadant ut som ett
      // överbelastat API. Den som felsöker nästa gång ska slippa gissa.
      let detalj = '';
      try { detalj = (await aiResponse.text()).slice(0, 300); } catch { /* strunt samma */ }
      console.error(`[AI] ${fn}: OpenRouter svarade ${aiResponse.status} — ${detalj}`);
      return res.status(502).json({ error: 'AI request failed' });
    }

    const aiData = /** @type {OpenRouterSvar} */ (await aiResponse.json());
    // DR5 (2026-08-17): `content` bär tre olika former beroende på väg, och
    // inferensen från raden nedan (string) stämde bara på den första:
    //   1. rå text från modellen (de flesta funktioner)
    //   2. `{ raw: string }` när JSON-tolkningen misslyckas men svaret ändå
    //      ska nå klienten (B17:s fence-toleranta fallback)
    //   3. det validerade objektet när prompten har en `validator`
    // Typkontrollen av api/ (första körningen någonsin) fällde på 2 och 3.
    // Formen skrivs ut i stället för att döljas — den som lägger till en fjärde
    // väg ska se att det finns tre.
    /** @type {string | { raw: string } | unknown} */
    let content = aiData.choices?.[0]?.message?.content;
    if (!content) {
      // "No response from AI" har varit ett återvändsgränd-fel: svaret var
      // 200 OK, men `content` tomt, och loggen sa ingenting om varför.
      //
      // Den låsta modellen är RESONERANDE — den tänker först och svarar
      // sedan, och båda delarna ryms inom `max_tokens`. Räcker budgeten inte
      // till efter tänkandet kommer `content` tillbaka tomt. `finish_reason`
      // och `usage` avgör saken: 'length' + reasoning_tokens nära taket
      // betyder budget, allt annat betyder något annat. Utan de här två
      // fälten går det bara att gissa — och det har kostat tre deployer.
      const val = aiData.choices?.[0] ?? {};
      console.error(
        `[AI] ${fn}: tomt content trots 200. finish_reason=${val.finish_reason ?? '?'} ` +
        `usage=${JSON.stringify(aiData.usage ?? {})} maxTokens=${prompt.maxTokens}`
      );
      return res.status(502).json({
        error: 'No response from AI',
        code: 'AI_EMPTY_RESPONSE',
        finishReason: val.finish_reason ?? null,
        usage: aiData.usage ?? null,
      });
    }

    if (prompt.parseJson) {
      // B17: fence-tolerant tolkning först. `{ raw }`-fallbacken finns kvar
      // för funktioner som Zod-validerar hos anroparen — de visar ett ärligt
      // formatfel i UI:t och ska inte förlora den vägen.
      const extracted = extractJsonContent(content);
      const validator = RESPONSE_VALIDATORS[fn];

      if (!extracted.ok) {
        if (validator) {
          return res.status(502).json({
            error: 'AI-svaret gick inte att tolka. Försök igen om en stund.',
            code: 'AI_INVALID_RESPONSE',
          });
        }
        content = { raw: content };
      } else if (validator) {
        const checked = validator(extracted.value);
        if (!checked.ok) {
          console.warn(`[AI] ${fn}: ogiltig svarsform — ${checked.error}`);
          return res.status(502).json({
            error: 'AI-svaret hade inte det format som behövdes. Försök igen om en stund.',
            code: 'AI_INVALID_RESPONSE',
          });
        }
        content = checked.value;
      } else {
        content = extracted.value;
      }
    }

    // Logga AI-usage (fire-and-forget). OpenRouter returnerar usage-objekt
    // i icke-streaming-svar — använd det för exakt tokensiffra.
    const nonStreamModel = resolveModel();
    void logAiUsage(user.id, fn, nonStreamModel, aiData.usage?.total_tokens || 0);

    return res.status(200).json({ success: true, [prompt.responseKey]: content });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = medFelrapport('ai', hanterare);

// Exponerat enbart för test — Vercel anropar bara default-exporten ovan.
// Art. 9-grinden är den enda kontroll som inte går att kringgå från klienten,
// så dess fail-closed-beteende ska vara testat, inte antaget (UX13).
module.exports.ART9_FUNCTIONS = ART9_FUNCTIONS;
module.exports.checkArt9Consent = checkArt9Consent;
// B28: den allmänna AI-av-grinden och dess namngivna undantagslista — samma
// motivering som ovan, testat är bättre än antaget för en fail-closed-grind.
module.exports.AI_ENABLED_EXEMPT_FUNCTIONS = AI_ENABLED_EXEMPT_FUNCTIONS;
module.exports.checkAiEnabled = checkAiEnabled;
// B29: PII-maskeringen. Exponerad så att servermaskering kan testas oberoende
// av OpenRouter-anropet — annars syns ett trasigt regex bara som ett
// personnummer i en riktig leverantörs loggar.
module.exports.stripPii = stripPii;
// AR4 (2026-08-17): promptbiblioteket. Exponerat så att sanningsregeln kan
// kontrolleras maskinellt i stället för att upptäckas i en granskning var
// tredje vecka. `personligt-brev` fick regeln i C11, `ai-cover-letter` fick
// den aldrig, `profile-summary` skrev påhittad persona till databasen och
// `karriarplan` gav amerikanska medelklassråd till någon utan inkomst — fyra
// prompter, samma lucka, upptäckt en i taget. Testet gör luckan omöjlig att
// införa tyst i en femte.
module.exports.PROMPTS = PROMPTS;
module.exports.sanitizeInput = sanitizeInput;
// B14: prompt-mallarna exponeras så att sanningskraven i CV-prompten kan
// testas. En prompt som ber modellen "föreslå rimliga siffror" syns inte i
// något annat test — den syns bara i användarens färdiga CV.
module.exports.PROMPTS = PROMPTS;
// B17/B18: svarsvalideringen och modell-låsningen är de två grindar som
// bestämmer vad som lämnar respektive når portalen. Båda exponeras för test —
// ett fel i dem syns annars först som en tom ruta i ett AF-dokument eller som
// en oväntad faktura.
module.exports.extractJsonContent = extractJsonContent;
module.exports.RESPONSE_VALIDATORS = RESPONSE_VALIDATORS;
module.exports.resolveModel = resolveModel;
module.exports.LOCKED_MODEL = LOCKED_MODEL;
