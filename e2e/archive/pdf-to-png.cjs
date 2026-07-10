/**
 * Konvertera PDF → PNG via Chromium (för visuell inspektion).
 * pdftoppm finns inte på maskinen så vi använder Chromium:s inbyggda
 * PDF-viewer + screenshot.
 */
const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const PDF_DIR = path.join(__dirname, '..', 'pdf-verify');
const PNG_DIR = path.join(__dirname, '..', 'pdf-verify', 'png');

async function main() {
  if (!fs.existsSync(PNG_DIR)) fs.mkdirSync(PNG_DIR, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 900, height: 1273 },  // A4 @ 108dpi-ish
  });
  const page = await context.newPage();

  const pdfs = fs.readdirSync(PDF_DIR).filter(f => f.endsWith('.pdf'));
  for (const pdfName of pdfs) {
    const url = `file:///${path.join(PDF_DIR, pdfName).replace(/\\/g, '/')}`;
    console.log(`\n=== ${pdfName} ===`);
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);

    // Chromium PDF viewer renders all pages stacked. Scroll & screenshot
    // each "page" worth of viewport.
    const total = await page.evaluate(() => document.body.scrollHeight);
    const pages = Math.ceil(total / 1273);
    console.log(`  ~${pages} pages, total height ${total}px`);

    const base = pdfName.replace('.pdf', '');
    for (let i = 0; i < Math.min(pages, 3); i++) {
      await page.evaluate((y) => window.scrollTo(0, y), i * 1273);
      await page.waitForTimeout(200);
      const pngPath = path.join(PNG_DIR, `${base}-page${i + 1}.png`);
      await page.screenshot({ path: pngPath, fullPage: false });
      console.log(`  ${pngPath}`);
    }
  }
  await browser.close();
}

main().catch(err => { console.error(err); process.exit(1); });
