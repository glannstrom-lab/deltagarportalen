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
const puppeteer = require('puppeteer-core');

// Lazy-importera @sparticuz/chromium endast i prod — den drar in en stor
// binär som inte behövs lokalt (där dev har riktig Chrome installerad).
async function getChromium() {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const chromium = (await import('@sparticuz/chromium')).default;
    return {
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
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
].filter(Boolean);

function getCorsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin)
    || (origin && /^https:\/\/deltagarportal(en)?-[a-z0-9]+-[\w-]+\.vercel\.app$/.test(origin));
  return {
    'Access-Control-Allow-Origin': allowed ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Allow-Credentials': 'true',
  };
}

// Hämta CV via Supabase med användarens Bearer-token. RLS garanterar att
// användaren bara kan se sitt eget CV.
async function fetchUserCV(token) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) throw new Error('Supabase env saknas');

  const supabase = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) throw new Error('Ogiltig token');

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

  // Klienten skickar template + en print-host (för att stödja preview-deploys).
  const template = String(req.body?.template || 'sidebar').slice(0, 50);
  // Print-URL: byggs från Origin så den fungerar mot localhost, preview-
  // deploys och produktion. Klienten måste skicka Origin-header (browsers
  // gör det automatiskt).
  const origin = req.headers.origin || `https://${req.headers.host || 'jobin.se'}`;

  let browser = null;
  try {
    // 1. Hämta CV
    const cv = await fetchUserCV(token);

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

    // 6. Generera PDF med kontrollerade margins
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: false,
      margin: {
        top: '12mm',
        bottom: '10mm',
        left: 0,
        right: 0,
      },
    });

    // 7. Returnera PDF
    const firstName = cv.firstName || 'cv';
    const lastName = cv.lastName || '';
    const filename = `CV_${firstName}_${lastName}.pdf`.replace(/\s+/g, '_');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    return res.status(200).send(pdfBuffer);
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
