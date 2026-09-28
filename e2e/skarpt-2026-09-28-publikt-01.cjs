// Skarpt funktionstest 2026-09-28 — område "publikt" (SP-prefix).
// Fristående Playwright-skript (kräver inget konto för de flesta punkterna).
// Körning: node e2e/skarpt-2026-09-28-publikt-01.cjs
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BAS = 'https://www.jobin.se';
const UT = path.join(__dirname, '..', 'docs', 'review-2026-09-28-rollspel', 'skarpt-publikt');
fs.mkdirSync(path.join(UT, 'txt'), { recursive: true });

function natverkLogg(page, taggarPrefix) {
  page.on('response', (r) => {
    if (r.status() >= 400 && /supabase\.co|\/api\//.test(r.url())) {
      fs.appendFileSync(path.join(UT, 'natverk.txt'), `${new Date().toISOString()} [${taggarPrefix}] ${r.request().method()} ${r.status()} ${r.url().slice(0, 200)}\n`);
    }
  });
  const konsol = [];
  page.on('console', (m) => { if (m.type() === 'error') konsol.push(m.text().slice(0, 300)); });
  return konsol;
}

async function shot(page, namn) {
  const f = path.join(UT, `${namn}.png`);
  await page.screenshot({ path: f, fullPage: true }).catch(() => {});
  const txt = await page.locator('body').innerText().catch(() => '');
  fs.writeFileSync(path.join(UT, 'txt', `${namn}.txt`), txt);
  console.log('SHOT', namn, txt.length);
  return txt;
}

async function acceptCookiesNecessaryOnly(page) {
  await page.getByRole('button', { name: /Endast nödvändiga/ }).click({ timeout: 3000 }).catch(() => {});
}

(async () => {
  const b = await chromium.launch();
  const resultat = {};

  // ============ 1. STARTSIDAN (desktop, ljust läge) ============
  {
    const ctx = await b.newContext({ viewport: { width: 1366, height: 900 }, locale: 'sv-SE' });
    const page = await ctx.newPage();
    natverkLogg(page, 'start');
    await page.goto(`${BAS}/`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    // Cookiebanner ska synas innan val
    const bannerSynlig = await page.locator('[data-cookie-banner]').isVisible().catch(() => false);
    resultat.cookieBannerSynlig = bannerSynlig;
    await shot(page, '01-start-cookiebanner');

    // Testa "Anpassa" (customize) -> se växlarna, spara
    const anpassaBtn = page.getByRole('button', { name: /Anpassa/i });
    if (await anpassaBtn.isVisible().catch(() => false)) {
      await anpassaBtn.click();
      await page.waitForTimeout(300);
      await shot(page, '02-start-cookie-anpassa');
    }
    await acceptCookiesNecessaryOnly(page);
    await page.waitForTimeout(500);
    await shot(page, '03-start-efter-cookieval');

    // Läs localStorage för att se att valet sparades
    const cookieState = await page.evaluate(() => ({
      consent: localStorage.getItem('jobin_cookie_consent'),
      prefs: localStorage.getItem('jobin_cookie_preferences'),
    }));
    resultat.cookieLocalStorage = cookieState;
    console.log('COOKIE STATE', JSON.stringify(cookieState));

    // Ladda om sidan - bannern ska INTE visas igen
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    const bannerEfterReload = await page.locator('[data-cookie-banner]').isVisible().catch(() => false);
    resultat.cookieBannerEfterReload = bannerEfterReload;
    await shot(page, '04-start-efter-reload');

    await ctx.close();
  }

  // ============ 2. B2B-SIDOR, PRISER, OM OSS ============
  {
    const ctx = await b.newContext({ viewport: { width: 1366, height: 900 }, locale: 'sv-SE' });
    const page = await ctx.newPage();
    natverkLogg(page, 'b2b');
    const sidor = [
      ['for-rusta-och-matcha', '/for-rusta-och-matcha/'],
      ['for-arbetsmarknadsenheter', '/for-arbetsmarknadsenheter/'],
      ['for-arbetsgivare', '/for-arbetsgivare/'],
      ['for-dig-som', '/for-dig-som/'],
      ['om-oss', '/om-oss/'],
    ];
    for (const [namn, vag] of sidor) {
      await page.goto(`${BAS}${vag}`, { waitUntil: 'networkidle' }).catch((e) => console.log('FEL vid', vag, e.message));
      await page.waitForTimeout(600);
      await acceptCookiesNecessaryOnly(page);
      const h1 = await page.locator('h1').first().innerText().catch(() => '(ingen h1)');
      console.log(namn, '-> h1:', h1);
      resultat[`h1_${namn}`] = h1;
      await shot(page, `10-b2b-${namn}`);
    }

    // Priser: scrolla till #priser på startsidan
    await page.goto(`${BAS}/#priser`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    await acceptCookiesNecessaryOnly(page);
    const prisSektion = await page.locator('#priser').isVisible().catch(() => false);
    resultat.prisSektionSynlig = prisSektion;
    await shot(page, '11-priser-sektion');

    await ctx.close();
  }

  // ============ 3. LAGLIGA SIDOR ============
  {
    const ctx = await b.newContext({ viewport: { width: 1366, height: 900 }, locale: 'sv-SE' });
    const page = await ctx.newPage();
    natverkLogg(page, 'legal');
    for (const [namn, vag] of [
      ['privacy', '/privacy'],
      ['terms', '/terms'],
      ['tillganglighet', '/tillganglighet'],
      ['ai-policy', '/ai-policy'],
    ]) {
      await page.goto(`${BAS}/#${vag}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(600);
      await acceptCookiesNecessaryOnly(page);
      const txt = await shot(page, `20-legal-${namn}`);
      resultat[`legal_${namn}_langd`] = txt.length;
    }
    await ctx.close();
  }

  // ============ 4. 404 / okänd sökväg (SPA hash catch-all) ============
  {
    const ctx = await b.newContext({ viewport: { width: 1366, height: 900 }, locale: 'sv-SE' });
    const page = await ctx.newPage();
    natverkLogg(page, '404');
    await page.goto(`${BAS}/#/nagot-som-inte-finns-alls-12345`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await acceptCookiesNecessaryOnly(page);
    const slutligUrl = page.url();
    resultat.fyrahundrafyra_slutlig_url = slutligUrl;
    await shot(page, '30-hash-404');
    await ctx.close();
  }

  // ============ 5. /guider/ index + 10 slumpade guider ============
  {
    const ctx = await b.newContext({ viewport: { width: 1366, height: 900 }, locale: 'sv-SE' });
    const page = await ctx.newPage();
    natverkLogg(page, 'guider');
    await page.goto(`${BAS}/guider/`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    await acceptCookiesNecessaryOnly(page);
    await shot(page, '40-guider-index');

    // Samla interna guide-länkar
    const lankar = await page.$$eval('a[href^="/guider/"]', (as) =>
      Array.from(new Set(as.map((a) => a.getAttribute('href')).filter((h) => h && h !== '/guider/' && !h.includes('/kategori/'))))
    );
    console.log('Antal guide-lankar pa index:', lankar.length);
    resultat.antalGuideLankarPaIndex = lankar.length;

    // Slumpa 10
    const slump = [...lankar].sort(() => Math.random() - 0.5).slice(0, 10);
    fs.writeFileSync(path.join(UT, 'slumpade-guider.json'), JSON.stringify(slump, null, 2));

    let i = 0;
    for (const vag of slump) {
      i++;
      await page.goto(`${BAS}${vag}`, { waitUntil: 'networkidle' }).catch((e) => console.log('FEL', vag, e.message));
      await page.waitForTimeout(400);
      await acceptCookiesNecessaryOnly(page);
      const h1 = await page.locator('h1').first().innerText().catch(() => '(ingen h1)');
      const interna = await page.$$eval('main a[href^="/guider/"], main a[href^="/verktyg/"]', (as) => as.length).catch(() => 0);
      const cta = await page.locator('a', { hasText: /Skapa konto|Kom igång|Registrera/i }).first();
      const ctaHref = await cta.getAttribute('href').catch(() => null);
      console.log(`guide ${i}/10 ${vag} -> h1="${h1}" interna_lankar=${interna} cta_href=${ctaHref}`);
      resultat[`guide_${i}`] = { vag, h1, interna, ctaHref };
      if (i <= 3) await shot(page, `41-guide-${i}`);
    }
    await ctx.close();
  }

  // ============ 6. CTA -> registrering med returnTo ============
  {
    const ctx = await b.newContext({ viewport: { width: 1366, height: 900 }, locale: 'sv-SE' });
    const page = await ctx.newPage();
    natverkLogg(page, 'cta-returnto');
    await page.goto(`${BAS}/guider/a-kassa-sa-fungerar-det/`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    await acceptCookiesNecessaryOnly(page);
    const ctaLank = page.locator('a', { hasText: /Skapa konto|Kom igång|Registrera|Bygg ditt CV/i }).first();
    const href = await ctaLank.getAttribute('href').catch(() => null);
    console.log('CTA href pa guide:', href);
    resultat.ctaHrefPaGuide = href;
    if (href) {
      await ctaLank.click().catch(() => {});
      await page.waitForTimeout(1000);
      resultat.ctaSlutligUrl = page.url();
      await shot(page, '50-cta-klick-resultat');
    }
    await ctx.close();
  }

  // ============ 7. LOGIN-SIDAN ============
  {
    const ctx = await b.newContext({ viewport: { width: 1366, height: 900 }, locale: 'sv-SE' });
    const page = await ctx.newPage();
    const konsol = natverkLogg(page, 'login');
    await page.goto(`${BAS}/#/login`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    await acceptCookiesNecessaryOnly(page);
    await shot(page, '60-login-start');

    // Sok efter "glomt losenord"-lank
    const bodyTxt = await page.locator('body').innerText();
    const harGlomtLosenord = /glömt|forgot|återställ.*lösenord/i.test(bodyTxt);
    resultat.harGlomtLosenordLank = harGlomtLosenord;
    console.log('Har "glomt losenord"-lank:', harGlomtLosenord);

    // Google-knapp finns?
    const googleBtn = await page.getByRole('button', { name: /Google/i }).isVisible().catch(() => false);
    resultat.googleKnappFinns = googleBtn;

    // Fel losenord -> begripligt fel
    await page.getByLabel(/E-post/i).fill('skarpt-publikt-test-2026-09-28@jobin.test').catch(async () => {
      await page.locator('#email').fill('skarpt-publikt-test-2026-09-28@jobin.test');
    });
    await page.locator('#password').fill('FelLosenord12345!');
    // Kolla fokus innan submit
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(2500);
    const felmeddelande = await page.locator('[role="alert"]').first().innerText().catch(() => '(inget alert)');
    console.log('Felmeddelande efter fel losenord:', felmeddelande);
    resultat.felLosenordMeddelande = felmeddelande;
    // Var hamnade fokus?
    const aktivtElement = await page.evaluate(() => {
      const el = document.activeElement;
      return el ? { tag: el.tagName, id: el.id, role: el.getAttribute('role') } : null;
    });
    resultat.fokusEfterFel = aktivtElement;
    console.log('Fokus efter fel:', JSON.stringify(aktivtElement));
    await shot(page, '61-login-fel-losenord');

    // Landmarks / skip-link
    const harSkipLink = await page.locator('a[href="#main-content"], a.skip-link, [data-skip-link]').count();
    const harMain = await page.locator('main').count();
    const harNav = await page.locator('nav').count();
    resultat.landmarks = { skipLink: harSkipLink, main: harMain, nav: harNav };
    console.log('Landmarks pa /login:', JSON.stringify(resultat.landmarks));

    if (konsol.length) {
      fs.appendFileSync(path.join(UT, 'natverk.txt'), `KONSOLFEL [login]: ${[...new Set(konsol)].join(' | ')}\n`);
    }
    await ctx.close();
  }

  // ============ 8. REGISTRERINGSSIDAN (validering, ej submit) ============
  {
    const ctx = await b.newContext({ viewport: { width: 1366, height: 900 }, locale: 'sv-SE' });
    const page = await ctx.newPage();
    natverkLogg(page, 'register');
    await page.goto(`${BAS}/#/register`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    await acceptCookiesNecessaryOnly(page);
    await shot(page, '70-register-start');

    // Fyll i ogiltig e-post + svagt losenord, blur, se fel - SKICKA INTE
    const emailField = page.locator('#email');
    if (await emailField.count()) {
      await emailField.fill('inte-en-epost');
      await emailField.blur();
      await page.waitForTimeout(300);
    }
    const pwField = page.locator('#password');
    if (await pwField.count()) {
      await pwField.fill('123');
      await pwField.blur();
      await page.waitForTimeout(300);
    }
    const felTexter = await page.locator('[role="alert"], p.text-red-600, p.text-red-400').allInnerTexts().catch(() => []);
    console.log('Valideringsfel pa register (utan submit):', JSON.stringify(felTexter));
    resultat.registerValideringsfel = felTexter;
    await shot(page, '71-register-valideringsfel');
    await ctx.close();
  }

  fs.writeFileSync(path.join(UT, 'resultat.json'), JSON.stringify(resultat, null, 2));
  await b.close();
  console.log('KLART. Resultat i', path.join(UT, 'resultat.json'));
})();
