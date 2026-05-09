/**
 * CV Templates Print Audit
 *
 * Genererar PDF + PNG-screenshot per CV-mall i print-mode. Använder
 * /print/cv?demo=mikael så ingen login behövs (PrintCV.tsx har Mikael-
 * fixture inbyggd för iterativ utveckling).
 *
 * Output:
 *   cv-prints/<template>.pdf       — riktig print-PDF (för manual inspection)
 *   cv-prints/<template>-page1.png — print-emulerad screenshot, sida 1
 *   cv-prints/<template>-page2.png — sida 2 (om finns)
 *
 * Kör:  node e2e/cv-templates-print.cjs
 *
 * Kräver att dev-server kör på localhost:5173 (npm run dev:client). Scriptet
 * detekterar och misslyckas om servern inte är uppe.
 */

const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173';
const OUT_DIR = path.join(__dirname, '..', 'cv-prints');

const TEMPLATES = [
  'sidebar',    // Modern (default)
  'minimal',
  'executive',
  'creative',
  'nordic',
  'centered',
  'budapest',
  'rotterdam',
  'chicago',
  'atelier',
  'manhattan',
];

// A4 @ 96dpi
const A4_WIDTH = 794;
const A4_HEIGHT = 1123;

async function main() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: A4_WIDTH, height: A4_HEIGHT },
  });
  const page = await context.newPage();

  // Verifiera att servern är uppe
  try {
    await page.goto(BASE_URL, { timeout: 5000 });
  } catch (err) {
    console.error(`FAIL: kunde inte nå ${BASE_URL}. Kör dev-servern: cd client && npm run dev`);
    await browser.close();
    process.exit(1);
  }

  for (const template of TEMPLATES) {
    console.log(`\n=== ${template} ===`);
    const url = `${BASE_URL}/#/print/cv?demo=mikael&template=${template}&manual=1`;
    await page.goto(url, { waitUntil: 'networkidle' });

    // Vänta på att CVPreview renderats
    await page.waitForSelector('.cv-preview', { timeout: 10000 });
    // Ge layout en tick att stabiliseras (motion-animations osv)
    await page.waitForTimeout(800);

    // Aktivera print-CSS
    await page.emulateMedia({ media: 'print' });

    // 1) PDF för riktig pagebreak-rendering (manual inspection)
    const pdfPath = path.join(OUT_DIR, `${template}.pdf`);
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
    });
    const pdfStat = fs.statSync(pdfPath);
    console.log(`  PDF:  ${path.basename(pdfPath)}  (${(pdfStat.size / 1024).toFixed(1)} kB)`);

    // 2) Per-sida screenshots: sätt viewport till en A4-sida och screencap
    //    område baserat på scrollY. Inte 100% identiskt med PDF-pagebreak
    //    (browser bryter på cv-entry-gränser), men ger oss visuell
    //    bedömning av layout och första-sidan-utseende.
    const totalHeight = await page.evaluate(() => {
      return Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight,
      );
    });
    const numPages = Math.ceil(totalHeight / A4_HEIGHT);
    console.log(`  pages: ~${numPages}  (totalHeight=${totalHeight}px)`);

    for (let i = 0; i < Math.min(numPages, 3); i++) {
      await page.evaluate((y) => window.scrollTo(0, y), i * A4_HEIGHT);
      await page.waitForTimeout(150);
      const pngPath = path.join(OUT_DIR, `${template}-page${i + 1}.png`);
      await page.screenshot({
        path: pngPath,
        clip: { x: 0, y: 0, width: A4_WIDTH, height: A4_HEIGHT },
        fullPage: false,
      });
      console.log(`  PNG:  ${path.basename(pngPath)}`);
    }
  }

  await browser.close();
  console.log(`\nDone. Output: ${OUT_DIR}`);
}

main().catch((err) => {
  console.error('FAIL:', err);
  process.exit(1);
});
