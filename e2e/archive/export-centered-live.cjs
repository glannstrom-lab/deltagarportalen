/**
 * Live-export av centered-mall mot jobin.se.
 * Loggar in som testkontot, går till CV, väljer centered, klickar export,
 * väntar på download, sparar PDF:en till pdf-verify/centered-LIVE.pdf.
 */

const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const EMAIL = process.env.TEST_USER_EMAIL || 'claude-playwright-test@jobin.se';
const PASSWORD = process.env.TEST_USER_PASSWORD;
if (!PASSWORD) { console.error('Sätt TEST_USER_PASSWORD i miljön.'); process.exit(1); }
const BASE_URL = 'https://jobin.se';
const OUT_DIR = path.join(__dirname, '..', 'pdf-verify');

(async () => {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    acceptDownloads: true,
    viewport: { width: 1400, height: 900 },
  });
  const page = await context.newPage();

  // Logga konsolfel för diagnostik
  page.on('console', (msg) => {
    if (msg.type() === 'error') console.log(`[console.error] ${msg.text()}`);
  });
  page.on('pageerror', (err) => console.log(`[pageerror] ${err.message}`));

  console.log('Logga in...');
  await page.goto(`${BASE_URL}/#/login`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // Cookie-banner
  try {
    const accept = page.getByRole('button', { name: /endast nödvändiga/i });
    if (await accept.isVisible({ timeout: 2000 })) await accept.click();
  } catch {}

  await page.locator('input#email').fill(EMAIL);
  await page.locator('input#password').fill(PASSWORD);
  await page.getByRole('button', { name: /^logga in$/i }).click();

  // Vänta på inloggning (URL byter eller dashboard syns)
  await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 20000 });
  console.log('Inloggad. URL:', page.url());

  // Gå till CV
  await page.goto(`${BASE_URL}/#/cv`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  console.log('CV-sidan laddad.');

  // Stäng onboarding-modal ("Välkommen till CV-byggaren")
  try {
    const skip = page.getByRole('button', { name: /hoppa över|hoppa \xf6ver/i }).first();
    if (await skip.isVisible({ timeout: 3000 })) {
      await skip.click();
      console.log('Klickade "Hoppa över".');
      await page.waitForTimeout(800);
    }
  } catch {}
  // Backup: stäng-X
  try {
    const closeX = page.locator('button[aria-label*="St\xe4ng" i], button[aria-label*="Close" i]').first();
    if (await closeX.isVisible({ timeout: 1000 })) {
      await closeX.click();
      console.log('Klickade stäng-X.');
      await page.waitForTimeout(500);
    }
  } catch {}
  await page.keyboard.press('Escape').catch(() => {});
  await page.waitForTimeout(500);

  await page.screenshot({ path: path.join(OUT_DIR, 'cv-page.png'), fullPage: true });

  // Hitta template-väljaren och välj centered
  // CVPreview använder data.template - måste sätta via UI eller via direktanrop
  // Försök först via UI: leta efter knapp/dropdown med "centered" eller "Centered"
  // Välj Centered-mallen via dess kort (texten "Centrerad" på svenska
  // i nyaste versionen, eller "Centered")
  try {
    const card = page.locator('button, [role="button"], [class*="card"]').filter({
      hasText: /^centrerad$|^centered$/i,
    }).first();
    if (await card.isVisible({ timeout: 3000 })) {
      await card.click();
      console.log('Valde centered-kortet.');
    } else {
      // Fallback: text-match utan strikt anchor
      const byText = page.getByText(/centrerad|centered/i).first();
      if (await byText.isVisible({ timeout: 2000 })) {
        await byText.click();
        console.log('Valde centered via text.');
      } else {
        console.log('VARNING: hittade inte centered-väljare');
      }
    }
  } catch (e) {
    console.log('Template-väljare ej hittad:', e.message);
  }

  await page.waitForTimeout(2500);
  await page.screenshot({ path: path.join(OUT_DIR, 'cv-after-template-pick.png'), fullPage: true });

  // Trigga PDF-export. Knapp heter typ "Ladda ner PDF" eller liknande.
  console.log('Söker exportknapp...');
  let exportBtn = page.getByRole('button', { name: /ladda ner pdf|export pdf|exportera/i }).first();
  if (!(await exportBtn.isVisible({ timeout: 3000 }).catch(() => false))) {
    exportBtn = page.getByRole('button', { name: /pdf/i }).first();
  }
  if (!(await exportBtn.isVisible({ timeout: 3000 }).catch(() => false))) {
    console.log('Hittade ingen exportknapp. Tar screenshot för diagnostik.');
    await page.screenshot({ path: path.join(OUT_DIR, 'no-export-btn.png'), fullPage: true });
    await browser.close();
    process.exit(1);
  }

  console.log('Klickar export...');
  const downloadPromise = page.waitForEvent('download', { timeout: 90000 });
  await exportBtn.click();

  // Vissa UI:er har en submenu. Försök klicka "Ladda ner" om den dyker upp.
  try {
    const dlMenuItem = page.getByRole('menuitem', { name: /ladda ner/i }).first();
    if (await dlMenuItem.isVisible({ timeout: 1500 })) {
      await dlMenuItem.click();
      console.log('Klickade på "Ladda ner" i meny.');
    }
  } catch {}

  const download = await downloadPromise;
  const outPath = path.join(OUT_DIR, 'centered-LIVE.pdf');
  await download.saveAs(outPath);
  const stat = fs.statSync(outPath);
  console.log(`PDF sparad: ${outPath} (${(stat.size / 1024).toFixed(1)} kB)`);

  // Snabb sanity: börjar filen med %PDF?
  const fd = fs.openSync(outPath, 'r');
  const head = Buffer.alloc(8);
  fs.readSync(fd, head, 0, 8, 0);
  fs.closeSync(fd);
  console.log(`First bytes: ${JSON.stringify(head.toString('utf8'))}`);

  await browser.close();
})().catch(err => {
  console.error('FAIL:', err);
  process.exit(1);
});
