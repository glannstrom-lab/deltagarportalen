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
 * automatisk detektion). Produktion (Vercel): använder
 * @sparticuz/chromium-min plus en Chromium-binär som hämtas från
 * CHROMIUM_PACK_URL vid kallstart — se `getChromium()` nedan för varför.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { medFelrapport } = require('./_utils/sentry.js');
const { rateLimitFallback } = require('./_utils/rate-limit-fallback');
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
const RATE_LIMIT_CONFIG = { limit: RATE_LIMIT_PER_USER_PER_WINDOW, windowMinutes: RATE_LIMIT_WINDOW_MINUTES };

// SD2 (2026-09-08): de tre felvägarna svarade tidigare `{ allowed: true }` —
// dörren stod öppen exakt när databasen strulade, och varje anrop startar
// Chromium med 1 024 MB. Nu samma minnesfallback som ai.js/job-alerts.js,
// via `_utils/rate-limit-fallback.js`. Vaktat av
// `src/test/api-rate-limit-fallback.test.ts`: ett `allowed: true` i den här
// funktionen fäller bygget.
async function checkRateLimit(supabase, userId) {
  try {
    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_identifier: userId,
      p_endpoint: 'cv-pdf',
      p_max_requests: RATE_LIMIT_PER_USER_PER_WINDOW,
      p_window_minutes: RATE_LIMIT_WINDOW_MINUTES,
    });
    if (error) {
      console.error('[cv-pdf] Rate-limit RPC error, using in-memory fallback:', error.message);
      return rateLimitFallback(userId, 'cv-pdf', RATE_LIMIT_CONFIG);
    }
    if (data && data.length > 0) {
      const r = data[0];
      const resetIn = r.reset_at
        ? Math.max(0, new Date(r.reset_at).getTime() - Date.now())
        : RATE_LIMIT_WINDOW_MINUTES * 60 * 1000;
      return { allowed: r.allowed, remaining: r.remaining || 0, resetIn };
    }
    // RPC:n ska alltid ge en rad. Ingen rad är ett fel, inte fritt fram.
    console.error('[cv-pdf] Rate-limit RPC returned no row, using in-memory fallback');
    return rateLimitFallback(userId, 'cv-pdf', RATE_LIMIT_CONFIG);
  } catch (err) {
    console.error('[cv-pdf] Rate-limit check failed, using in-memory fallback:', err);
    return rateLimitFallback(userId, 'cv-pdf', RATE_LIMIT_CONFIG);
  }
}

// Dit paketet packar upp Chromium-paketet. Namnet är bibliotekets, inte vårt:
// `downloadAndExtract()` skriver alltid till `<tmpdir>/chromium-pack`.
const CHROMIUM_PACK_DIR = path.join(os.tmpdir(), 'chromium-pack');

// Binären ligger INTE i funktionsbundlen. RÖR INTE utan att läsa det här.
//
// `@sparticuz/chromium` bär `bin/chromium.br` — 64 MB — och den följde med i
// VARJE deploy. Uppmätt 2026-09-17: cv-pdf-bundlen var 90 MB av ~120 MB per
// deploy, och Functions Storage (en GB-månadsmätare som summerar varje
// faktureringsdygns maxvärde, se docs/deployment-storage) låg över Hobby-taket.
// Paketet är därför utbytt mot `@sparticuz/chromium-min` (52 kB, samma kod
// utan binär), och binären hämtas från CHROMIUM_PACK_URL — en tar i Vercel
// Blob med exakt samma fyra .br-filer som 148.0.0 levererade.
//
// TARREN SKA VARA DEN OFFICIELLA från Sparticuz-releasen
// (`chromium-v<version>-pack.x64.tar`), inte en egenbyggd. Första försöket
// packade `node_modules/@sparticuz/chromium/bin/` med `tar-fs` på Windows.
// Innehållet blev bit för bit rätt — men Windows har ingen exekveringsbit, så
// `fs.stat` gav 0666 även för katalogen, och tar-fs skrev in det troget. På
// Linux går en katalog utan x-bit inte att traversera: prod svarade
// `EACCES: permission denied, open '/tmp/chromium-pack/al2023.tar.br'`.
// Den officiella tarren har 0644 på filerna och ingen katalogpost alls.
//
// Byter du version av @sparticuz/chromium-min MÅSTE du lägga upp en ny tar
// och peka om CHROMIUM_PACK_URL. Paket och binär versioneras ihop. Lägg den
// på en NY sökväg i blobben — den gamla ligger med `max-age=31536000` och
// serveras ur CDN-cachen även om du skriver över den.
//
// Mätt 2026-09-17 genom bibliotekets egen kodväg mot blobben: kallstart 3,4 s
// (varav 2,6 s nedladdning över en vanlig hemuppkoppling — funktionen ligger i
// fra1, samma region som blobben), varm start 0,00 s. /tmp-förbrukningen går
// från ~190 MB till ~256 MB, eftersom paketet nu ligger kvar där bredvid den
// uppackade binären. Taket är 512 MB.
async function getChromium() {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const chromium = (await import('@sparticuz/chromium-min')).default;
    // `executablePath(url)` laddar ner OVILLKORLIGT vid varje anrop —
    // biblioteket har ingen nedladdningscache (build/cjs/index.cjs,
    // `downloadAndExtract`). Cachen som README:n beskriver sitter en nivå
    // senare, i `inflate()`, och nås bara om man skickar in en katalog.
    // Vid varm start finns paketet redan i /tmp; peka då på katalogen, så
    // hoppas 66 MB nedladdning över och den redan uppackade binären används.
    const redanHamtad = fs.existsSync(path.join(CHROMIUM_PACK_DIR, 'chromium.br'));
    const kalla = redanHamtad ? CHROMIUM_PACK_DIR : process.env.CHROMIUM_PACK_URL;
    if (!kalla) {
      throw new Error(
        'CHROMIUM_PACK_URL saknas. @sparticuz/chromium-min bär ingen binär, ' +
        'så PDF-rendering kan inte starta utan den.'
      );
    }
    return {
      args: chromium.args,
      executablePath: await chromium.executablePath(kalla),
      // DR5 (2026-08-17): raden löd tidigare `headless: chromium.headless`.
      // Egenskapen `headless` finns inte i paketets 148-API — uppmätt: att
      // läsa den på default-exporten ger `undefined`.
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
/**
 * Ett fel vars text är skriven FÖR användaren. Bara sådana fel visas i
 * 500-svaret; allt annat — PostgREST, puppeteer, Chromium-nedladdningen —
 * bär interna detaljer (tabellnamn, sökvägar, miljövariabler, blob-URL:er)
 * och ersätts med ett allmänt meddelande. PDFExportButton visar texten rakt
 * av. Vaktat av src/test/api-cv-pdf-felsvar.test.ts.
 */
class AnvandarFel extends Error {
  /**
   * @param {string} meddelande
   * @param {number} [status] HTTP-status. Ett saknat CV är inget serverfel —
   *   som 500 larmade det dessutom i Sentry (medFelrapport rapporterar ≥ 500).
   */
  constructor(meddelande, status = 500) {
    super(meddelande);
    this.status = status;
  }
}

const ALLMANT_FEL = 'PDF-generering misslyckades. Försök igen om en stund.';

async function fetchUserCV(token, versionId) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) throw new Error('Supabase env saknas');

  const supabase = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) throw new AnvandarFel('Ogiltig token', 401);

  if (versionId) {
    const { data: version, error: versionError } = await supabase
      .from('cv_versions')
      .select('data')
      .eq('id', versionId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (versionError) throw versionError;
    if (!version || !version.data) throw new AnvandarFel('Versionen hittades inte', 404);
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
  if (!data) throw new AnvandarFel('Inget CV hittades — fyll i ditt CV först', 404);

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

/**
 * Content-Disposition för den färdiga PDF:en (2026-09-22).
 *
 * Namnet stoppades tidigare rått in i `filename="…"`. Node vägrar
 * headervärden med tecken utanför Latin-1 (`ERR_INVALID_CHAR`), så en
 * deltagare som heter Łukasz, Nguyễn eller محمد fick "Invalid character in
 * header content" som felmeddelande — EFTER att Chromium renderat hela PDF:en.
 * Ett `"` i namnet bröt dessutom parametern.
 *
 * Nu: en ASCII-reserv i `filename` och det riktiga namnet i `filename*`
 * (RFC 6266/5987), som alla moderna webbläsare läser. Vaktat av
 * src/test/api-cv-pdf-filnamn.test.ts.
 *
 * @param {unknown} firstName
 * @param {unknown} lastName
 * @returns {string}
 */
function byggContentDisposition(firstName, lastName) {
  const namn = `CV_${firstName || 'cv'}_${lastName || ''}`.replace(/\s+/g, '_').slice(0, 120) + '.pdf';
  const ascii = namn
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9._-]/g, '_');
  const utf8 = encodeURIComponent(namn).replace(/['()*!]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());
  return `attachment; filename="${ascii}"; filename*=UTF-8''${utf8}`;
}

const hanterare = async (req, res) => {
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
      throw new AnvandarFel('Ditt CV är för stort för att göras om till PDF. Korta ner det och försök igen.', 413);
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
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', byggContentDisposition(cv.firstName, cv.lastName));
    res.setHeader('Content-Length', pdfBuffer.length);
    res.status(200);
    return res.end(pdfBuffer);
  } catch (error) {
    console.error('[cv-pdf] error:', error);
    // Detaljen stannar i loggen ovan; användaren får bara text vi själva skrivit.
    if (error instanceof AnvandarFel) {
      return res.status(error.status).json({ error: error.message });
    }
    return res.status(500).json({ error: ALLMANT_FEL });
  } finally {
    if (browser) {
      try { await browser.close(); } catch { /* ignore */ }
    }
  }
};

// BL6: felrapportering till Sentry (sanerad) — se _utils/sentry.js
module.exports = medFelrapport('cv-pdf', hanterare);
// Exponerat för test — Vercel anropar bara default-exporten.
module.exports.byggContentDisposition = byggContentDisposition;
