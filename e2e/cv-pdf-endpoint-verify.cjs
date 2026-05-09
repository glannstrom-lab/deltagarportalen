/**
 * CV PDF Endpoint Verification
 *
 * Simulerar exakt vad /api/cv-pdf gör — men lokalt mot dev-servern, utan
 * vercel dev. Validerar att:
 *   1. PrintCV.tsx läser ?data=<base64> korrekt och renderar mallen
 *   2. Puppeteer page.pdf med margin: { top: 12mm, bottom: 10mm } ger
 *      A4-PDF utan vita band, utan gleshet, utan block-i-kanten
 *   3. Sidbrytningar respekterar .cv-entry / .cv-keep
 *
 * Output: pdf-verify/<template>.pdf — visuell inspektion.
 */

const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173';
const OUT_DIR = path.join(__dirname, '..', 'pdf-verify');

// Mikael-fixture i samma form som cvApi.getCV() returnerar (camelCase).
// Detta är vad endpointen kommer skicka till print-routen via base64-query.
const MIKAEL_CV = {
  template: 'sidebar',
  firstName: 'Mikael',
  lastName: 'Glannström',
  title: 'Senior fullstack-utvecklare',
  email: 'glannstrom@gmail.com',
  phone: '0707-12 34 56',
  location: 'Stockholm, Sverige',
  summary:
    'Erfaren utvecklare med fokus på React, TypeScript och accessibility. ' +
    'Bygger AI-drivna verktyg för långtidsarbetslösa. Trivs i team där ' +
    'användarvärdet styr besluten och där små detaljer spelar roll.',
  workExperience: [
    {
      id: '1', title: 'Senior fullstack-utvecklare', company: 'Jobin',
      location: 'Stockholm', startDate: '2024', endDate: '', current: true,
      description:
        'Bygger Deltagarportalen — en AI-driven plattform för långtidsarbetslösa. ' +
        'Ansvarar för CV-byggare, intervjusimulator och integrationer mot ' +
        'Arbetsförmedlingen och Bolagsverket. Stack: React 19, TypeScript, ' +
        'Supabase, Vercel.',
    },
    {
      id: '2', title: 'Tech Lead', company: 'Förra Bolaget AB',
      location: 'Stockholm', startDate: '2020', endDate: '2024', current: false,
      description:
        'Ledde team om 6 utvecklare. Migrerade från legacy-monolit till ' +
        'modulariserad serverless-arkitektur. Lyfte teamets täckning från ' +
        '34% till 78% på 18 månader.',
    },
    {
      id: '3', title: 'Frontend-utvecklare', company: 'Startup Sthlm',
      location: 'Stockholm', startDate: '2017', endDate: '2020', current: false,
      description:
        'Byggde första versionen av produkt från scratch. Tog ansvar för ' +
        'design system, A/B-testning och feature flags.',
    },
    {
      id: '4', title: 'Junior utvecklare', company: 'Konsultbyrå AB',
      location: 'Göteborg', startDate: '2015', endDate: '2017', current: false,
      description:
        'Roterade mellan kunder. Lärde mig React, Node och AWS. Byggde ' +
        'flera interna verktyg som fortfarande används.',
    },
  ],
  education: [
    {
      id: '1', degree: 'Civilingenjör', field: 'Datateknik',
      school: 'KTH', location: 'Stockholm', startDate: '2010', endDate: '2015',
    },
    {
      id: '2', degree: 'Utbytesår', field: 'Computer Science',
      school: 'University of Edinburgh', location: 'Edinburgh',
      startDate: '2013', endDate: '2014',
    },
  ],
  skills: [
    { name: 'React' }, { name: 'TypeScript' }, { name: 'Node.js' },
    { name: 'Supabase' }, { name: 'PostgreSQL' }, { name: 'Tailwind CSS' },
    { name: 'Framer Motion' }, { name: 'Vitest' }, { name: 'Playwright' },
    { name: 'AWS' }, { name: 'Docker' }, { name: 'WCAG 2.1' },
  ],
  languages: [
    { id: '1', language: 'Svenska', level: 'native' },
    { id: '2', language: 'Engelska', level: 'fluent' },
    { id: '3', language: 'Tyska', level: 'intermediate' },
  ],
  certificates: [
    { id: '1', name: 'AWS Solutions Architect', issuer: 'Amazon', date: '2023' },
    { id: '2', name: 'Accessibility Specialist', issuer: 'IAAP', date: '2022' },
  ],
  links: [
    { id: '1', label: 'LinkedIn', url: 'linkedin.com/in/glannstrom' },
    { id: '2', label: 'GitHub', url: 'github.com/glannstrom' },
  ],
  hobbies: ['Löpning', 'Foto', 'Kaffebryggning'],
};

function encodeBase64Url(json) {
  return Buffer.from(json, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

const TEMPLATES = [
  'sidebar', 'minimal', 'executive', 'creative', 'nordic', 'centered',
  'budapest', 'rotterdam', 'chicago', 'atelier', 'manhattan',
];

async function main() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Verifiera dev-server
  try {
    await page.goto(BASE_URL, { timeout: 5000 });
  } catch {
    console.error(`FAIL: dev-server inte uppe på ${BASE_URL}`);
    await browser.close();
    process.exit(1);
  }

  for (const template of TEMPLATES) {
    const cv = { ...MIKAEL_CV, template };
    const dataParam = encodeBase64Url(JSON.stringify(cv));
    const url = `${BASE_URL}/#/print/cv?data=${dataParam}&template=${template}&manual=1`;

    console.log(`\n=== ${template} === (data length: ${dataParam.length} chars)`);

    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForSelector('.cv-preview', { timeout: 10000 });
    await page.waitForTimeout(600);

    // EXAKT samma page.pdf-config som /api/cv-pdf använder
    const pdfPath = path.join(OUT_DIR, `${template}.pdf`);
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: false,
      margin: { top: '12mm', bottom: '10mm', left: 0, right: 0 },
    });

    const stat = fs.statSync(pdfPath);
    console.log(`  PDF: ${path.basename(pdfPath)} (${(stat.size / 1024).toFixed(1)} kB)`);

    // Sanity: namnet ska finnas i renderad text (case-insensitive eftersom
    // vissa mallar UPPERCASE-ar via text-transform och innerText respekterar det)
    const hasName = await page.evaluate(() =>
      document.body.innerText.toLowerCase().includes('mikael') &&
      document.body.innerText.toLowerCase().includes('glannström'),
    );
    if (!hasName) {
      console.error(`  FAIL: namn inte synligt — base64-decode fungerade inte`);
      process.exitCode = 1;
    } else {
      console.log(`  OK: data renderad`);
    }
  }

  await browser.close();
  console.log(`\nDone. PDFs i: ${OUT_DIR}`);
}

main().catch((err) => {
  console.error('FAIL:', err);
  process.exit(1);
});
