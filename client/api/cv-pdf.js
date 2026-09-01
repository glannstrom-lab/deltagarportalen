/**
 * Server-side CV PDF Generator
 *
 * Renderar CV via Puppeteer + headless Chromium istället för browser-print.
 * Anledning: ren CSS-print har ingen mekanism för per-sida-padding —
 * antingen vita band (@page margin) eller gleshet (padding på cv-entry).
 * Server-side `page.pdf({ margin })` ger pixel-perfekt kontroll utan
 * tradeoff. Detta är vad Resume.io / Kickresume m.fl. använder.
 *
 * Flöde:
 *   1. Klient POST:ar { template } + Bearer-token
 *   2. Funktionen verifierar token via Supabase
 *   3. Hämtar användarens CV från cvs-tabellen
 *   4. Encoder CV-JSON → base64 → URL-query
 *   5. Lanserar Chromium, öppnar /#/print/cv?data=<base64>&template=X&manual=1
 *   6. Väntar på render, page.pdf med kontrollerade A4-margins
 *   7. Returnerar PDF-bytes till klienten
 *
 * Lokal dev: använder lokal Chrome (PUPPETEER_EXECUTABLE_PATH eller
 * automatisk detektion). Produktion (Vercel): använder @sparticuz/chromium
 * — en optimerad Chromium-binär som ryms i Vercel:s 50MB-funktionslimit
 * (compressed) / 250MB (uncompressed).
 */

const { createClient } = require('@supabase/supabase-js');
// DYNAMISK import, inte `require`. RÖR INTE.
//
// `puppeteer-core@25` ar ESM-only (`"type": "module"`). Med
// `require('puppeteer-core')` pa modulniva kraschade hela funktionen vid
// LADDNING i prod 2026-08-22 — FUNCTION_INVOCATION_FAILED, aven pa den rena
// valideringsvagen som svarar 400 langt fore all puppeteer-anvandning.
// CV-exporten lag nere i cirka 45 minuter.
//
// Min forsta forklaring var att Vercel korde Node < 22.12, dar `require(esm)`
// inte ar tillatet. **Den var fel.** Funktionen fick rapportera sin egen
// runtime pa en autentiserad felvag: **v24.18.1**, dar `require(esm)`
// fungerar utmarkt. Det som aterstar som forklaring ar Vercels bundling av
// en ESM-only modul som `require`:as fran CJS.
//
// Notera ocksa att `"engines"` i `client/package.json` INTE styr Vercels
// runtime — pinnen sa `22.x` och funktionen korde anda 24. Runtimen sätts i
// Vercels projektinstallningar.
//
// `await import()` fungerar fran CJS mot bade CJS och ESM oavsett allt detta,
// och gor filen okanslig for vilken modultyp puppeteer valjer harnast.
// Verifierat i prod med bade v24 och v25: samma PDF, 37 950 byte.
let puppeteerCache = null;
async function laddaPuppeteer() {
  if (!puppeteerCache) {
    const modul = await import('puppeteer-core');
    puppeteerCache = modul.default || modul;
  }
  return puppeteerCache;
}

// Rate-limit: 5 PDF-genereringar per 15 min/user. Puppeteer är resurstung —
// utan limit är det en lätt DoS-vektor.
const RATE_LIMIT_PER_USER_PER_WINDOW = 5;
const RATE_LIMIT_WINDOW_MINUTES = 15;

async function checkRateLimit(supabase, userId) {
  try {
    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_identifier: userId,
      p_endpoint: 'cv-pdf',
      p_max_requests: RATE_LIMIT_PER_USER_PER_WINDOW,
      p_window_minutes: RATE_LIMIT_WINDOW_MINUTES,
    });
    if (error) {
      console.error('[cv-pdf] Rate-limit RPC error:', error.message);
      return { allowed: true, remaining: RATE_LIMIT_PER_USER_PER_WINDOW, resetIn: 0 };
    }
    if (data && data.length > 0) {
      const r = data[0];
      const resetIn = r.reset_at
        ? Math.max(0, new Date(r.reset_at).getTime() - Date.now())
        : RATE_LIMIT_WINDOW_MINUTES * 60 * 1000;
      return { allowed: r.allowed, remaining: r.remaining || 0, resetIn };
    }
    return { allowed: true, remaining: RATE_LIMIT_PER_USER_PER_WINDOW, resetIn: 0 };
  } catch (err) {
    console.error('[cv-pdf] Rate-limit check failed:', err);
    return { allowed: true, remaining: RATE_LIMIT_PER_USER_PER_WINDOW, resetIn: 0 };
  }
}

// Lazy-importera @sparticuz/chromium endast i prod — den drar in en stor
// binär som inte behövs lokalt (där dev har riktig Chrome installerad).
async function getChromium() {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const chromium = (await import('@sparticuz/chromium')).default;
    return {
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      // DR5 (2026-08-17): raden löd tidigare `headless: chromium.headless`.
      // Den egenskapen finns inte i @sparticuz/chromium 148 — uppmätt:
      // `import('@sparticuz/chromium')).default.headless` → `undefined`.
      // Puppeteer tolkade alltså "ej angivet" och körde headless ändå, så
      // inget var trasigt; men raden läste som konfiguration utan att vara
      // det. Hittad av typkontrollen första gången den kördes mot api/.
      headless: true,
    };
  }
  // Lokal dev: använd systemets Chrome. Sätt CHROME_PATH om automatisk
  // detektion inte funkar (Windows: C:\Program Files\Google\Chrome\Application\chrome.exe).
  return {
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    executablePath: process.env.CHROME_PATH || detectLocalChrome(),
    headless: true,
  };
}

function detectLocalChrome() {
  // Vanliga Chrome-paths per OS. Användaren kan override via CHROME_PATH.
  const paths = {
    win32: [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    ],
    darwin: ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'],
    linux: ['/usr/bin/google-chrome', '/usr/bin/chromium-browser', '/usr/bin/chromium'],
  };
  const fs = require('fs');
  const candidates = paths[process.platform] || [];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return undefined; // puppeteer-core kommer kasta tydligt fel
}

// CORS-allowlist (samma som ai.js).
const ALLOWED_ORIGINS = [
  'https://deltagarportalen.se',
  'https://www.deltagarportalen.se',
  'https://jobin.se',
  'https://www.jobin.se',
  process.env.FRONTEND_URL,
  ...(process.env.NODE_ENV !== 'production' ? [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5174',
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
function isAllowedOrigin(origin) {
  return ALLOWED_ORIGINS.includes(origin);
}

function getCorsHeaders(origin) {
  const allowed = isAllowedOrigin(origin);
  return {
    'Access-Control-Allow-Origin': allowed ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Hämta CV via Supabase med användarens Bearer-token. RLS garanterar att
// användaren bara kan se sitt eget CV.
//
// `versionId` (valfritt) hämtar en sparad version ur `cv_versions` i stället
// för det nuvarande CV:t.
//
// Varför servern slår upp versionen själv i stället för att ta emot CV-datan
// från klienten: `/resources` visade PDF-knappar på varje versionskort, men
// knappen skickade bara `template` — servern hämtade `cvs`-raden och
// levererade alltså **dagens** CV under versionens filnamn. Word-knappen
// bredvid exporterade rätt version, så samma kort gav två olika dokument. Två
// konton i prod har dessutom versioner men ingen `cvs`-rad; för dem svarade
// knappen "Inget CV hittades" på ett kort som visade innehåll.
//
// Att i stället låta klienten POSTa hela CV:t hade löst det men gjort
// endpointen till en renderare av godtyckligt klientinnehåll. Ett `versionId`
// är ett ogenomskinligt id, och `cv_versions` har en enda SELECT-policy
// (`auth.uid() = user_id`) — ägarskapet avgörs alltså i databasen, inte här.
async function fetchUserCV(token, versionId) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) throw new Error('Supabase env saknas');

  const supabase = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) throw new Error('Ogiltig token');

  if (versionId) {
    const { data: version, error: versionError } = await supabase
      .from('cv_versions')
      .select('data')
      .eq('id', versionId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (versionError) throw versionError;
    if (!version || !version.data) throw new Error('Versionen hittades inte');
    // `cv_versions.data` lagras redan i camelCase (cvApi.saveVersion sparar
    // klientformen rakt av) — ingen omskrivning behövs här.
    return version.data;
  }

  const { data, error } = await supabase
    .from('cvs')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error('Inget CV hittades — fyll i ditt CV först');

  // Transform snake_case → camelCase (matchar cvApi.getCV-format som
  // PrintCV-routen förväntar sig).
  const { work_experience, color_scheme, first_name, last_name, profile_image, ...rest } = data;
  return {
    ...rest,
    workExperience: work_experience || [],
    colorScheme: color_scheme,
    firstName: first_name,
    lastName: last_name,
    profileImage: profile_image,
  };
}

// Base64-URL-safe encoder (skipping +, /, = som kräver URL-escaping).
function encodeBase64Url(json) {
  // Buffer.from(str, 'utf8').toString('base64') hanterar svenska tecken.
  return Buffer.from(json, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

module.exports = async (req, res) => {
  const corsHeaders = getCorsHeaders(req.headers.origin);
  Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = authHeader.substring(7);

  // Rate-limit-check (kräver verifierad user).
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    return res.status(500).json({ error: 'Supabase env saknas' });
  }
  const rlSupabase = createClient(supabaseUrl, anonKey);
  const { data: { user: rlUser }, error: rlAuthErr } = await rlSupabase.auth.getUser(token);
  if (rlAuthErr || !rlUser) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  const rl = await checkRateLimit(rlSupabase, rlUser.id);
  if (!rl.allowed) {
    const retryAfter = Math.ceil(rl.resetIn / 1000);
    res.setHeader('Retry-After', String(retryAfter));
    return res.status(429).json({
      error: 'För många PDF-genereringar. Försök igen om en stund.',
      retryAfter,
    });
  }

  // Klienten skickar template + en print-host (för att stödja preview-deploys).
  const template = String(req.body?.template || 'sidebar').slice(0, 50);
  // Valfritt: en sparad version i stället för det nuvarande CV:t. Formen
  // valideras här så ett skräpvärde blir 400 i stället för ett tyst fall
  // tillbaka till fel CV — det senare var precis buggen.
  const rawVersionId = req.body?.versionId;
  if (rawVersionId !== undefined && rawVersionId !== null && !UUID.test(String(rawVersionId))) {
    return res.status(400).json({ error: 'Ogiltigt versionId' });
  }
  const versionId = rawVersionId ? String(rawVersionId) : null;
  // Print-URL: Origin används bara om den finns i allowlisten (SSRF-skydd,
  // A11 2026-07-23 — CORS-headers stoppar inte direkta anrop, så en
  // ovaliderad Origin lät anroparen styra vart server-Chromium navigerar).
  // Okänd/saknad Origin → produktionsdomänen.
  const origin = isAllowedOrigin(req.headers.origin) ? req.headers.origin : 'https://jobin.se';

  let browser = null;
  try {
    // 1. Hämta CV
    const cv = await fetchUserCV(token, versionId);

    // 2. Encoder CV-data → base64
    const cvJson = JSON.stringify(cv);
    const cvDataParam = encodeBase64Url(cvJson);

    if (cvDataParam.length > 32 * 1024) {
      // URL-längd över 32 kB är inte praktiskt. Användarens CV är då
      // ovanligt stort — sannolikt felaktig data.
      throw new Error('CV-data för stort för URL (>32 kB)');
    }

    // 3. Bygg print-URL
    const printUrl = `${origin}/#/print/cv?data=${cvDataParam}&template=${encodeURIComponent(template)}&manual=1`;

    // 4. Lansera Chromium
    const chromiumConfig = await getChromium();
    const puppeteer = await laddaPuppeteer();
    browser = await puppeteer.launch({
      args: chromiumConfig.args,
      executablePath: chromiumConfig.executablePath,
      headless: chromiumConfig.headless,
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 1600 });

    // 5. Navigera och vänta på render
    await page.goto(printUrl, { waitUntil: 'networkidle0', timeout: 30000 });
    await page.waitForSelector('.cv-preview', { timeout: 10000 });
    // Kort paus för att fonter ska laddas in färdigt
    await new Promise(r => setTimeout(r, 500));

    // 6. Generera PDF. Sidstorlek/margins styrs helt av print-CSS:en i
    // CVPrintLayout.tsx: @page margin 0, per-sida-säkerhetszoner via
    // box-decoration-break: clone (kräver Chromium ≥130 — vi kör 148) och
    // kant-till-kant-bakgrund via canvas-bg (html-elementet). Tidigare
    // försökte vi sätta margin här, men Chrome respekterar @page-regeln
    // framför Puppeteer:s parameter — så de hade ingen effekt.
    // preferCSSPageSize: true för att vara explicit om att CSS äger
    // sidstorlek + margins.
    const pdfData = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
    });

    // puppeteer-core@24 returnerar Uint8Array, inte Buffer. Vercel:s
    // res.send() JSON-stringifierar Uint8Array till {"0":37,"1":80,...}
    // istället för binär. Konvertera explicit + använd res.end.
    const pdfBuffer = Buffer.isBuffer(pdfData) ? pdfData : Buffer.from(pdfData);

    // 7. Returnera PDF
    const firstName = cv.firstName || 'cv';
    const lastName = cv.lastName || '';
    const filename = `CV_${firstName}_${lastName}.pdf`.replace(/\s+/g, '_');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.status(200);
    return res.end(pdfBuffer);
  } catch (error) {
    console.error('[cv-pdf] error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'PDF-generering misslyckades',
    });
  } finally {
    if (browser) {
      try { await browser.close(); } catch { /* ignore */ }
    }
  }
};
