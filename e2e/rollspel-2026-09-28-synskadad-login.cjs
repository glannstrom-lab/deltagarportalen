// Peter (synskadad, NVDA + endast tangentbord) prövar /login-formuläret UTAN att logga in där
// (inloggning i övriga steg sker via Visa som, enligt rollspelsreglerna). Fristående skript —
// använder INTE den delade körarens Visa som-inloggning, eftersom den redan skulle vara inloggad.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { tabTrace, axeKor, landmarkOchRubriker, skipLank } = require('./rollspel-2026-09-28-synskadad-helpers.cjs');

const BAS = 'https://www.jobin.se';

(async () => {
  const UT = path.join(__dirname, '..', 'docs', 'review-2026-09-28-rollspel', 'synskadad');
  fs.mkdirSync(path.join(UT, 'txt'), { recursive: true });
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1366, height: 900 }, locale: 'sv-SE', timezoneId: 'Europe/Stockholm' });
  const p = await ctx.newPage();
  const h = { UT, log: (...a) => console.log(...a) };

  await p.goto(`${BAS}/#/login`);
  await p.waitForTimeout(2500);
  await p.getByRole('button', { name: /Endast nödvändiga/ }).click({ timeout: 2000 }).catch(() => {});
  await p.waitForTimeout(500);
  await p.screenshot({ path: path.join(UT, 'login-01-start.png'), fullPage: true });

  await landmarkOchRubriker(p, h, 'login');
  await skipLank(p, h, 'login');
  // Fortsätt tabba till formuläret (skip-länken tog fokus #1)
  await tabTrace(p, h, 'login-forts', 14);

  // Fyll formuläret med tangentbord, med FEL uppgifter — vi vill se felhanteringen, inte logga in.
  await p.keyboard.press('Home').catch(() => {});
  const epostFalt = p.getByLabel(/e-post/i).first();
  const harEpost = await epostFalt.count().then((c) => c > 0).catch(() => false);
  if (harEpost) {
    await epostFalt.click();
    await p.keyboard.type('fel.testperson@example.com', { delay: 20 });
    await p.keyboard.press('Tab');
    await p.keyboard.type('feltestlösenord123', { delay: 20 });
    await p.screenshot({ path: path.join(UT, 'login-02-ifyllt.png'), fullPage: true });
    await p.keyboard.press('Enter');
    await p.waitForTimeout(3000);
    await p.screenshot({ path: path.join(UT, 'login-03-fel.png'), fullPage: true });
    const txt = await p.locator('body').innerText().catch(() => '');
    fs.writeFileSync(path.join(UT, 'txt', 'login-03-fel.txt'), txt, 'utf8');
    h.log('LOGIN-FEL-TEXT', txt.slice(0, 2000));
    // Var landade fokus efter felet? Kritiskt för skärmläsare — flyttas det till felmeddelandet?
    const fokusEfterFel = await p.evaluate(() => {
      const el = document.activeElement;
      return el ? { tag: el.tagName, id: el.id, aria: el.getAttribute('aria-describedby'), text: (el.innerText || '').slice(0, 60) } : null;
    });
    fs.writeFileSync(path.join(UT, 'txt', 'login-fokus-efter-fel.json'), JSON.stringify(fokusEfterFel, null, 2), 'utf8');
    h.log('FOKUS EFTER FEL', JSON.stringify(fokusEfterFel));
    // Har felmeddelandet aria-live eller role=alert?
    const ariaLive = await p.evaluate(() => {
      const cands = [...document.querySelectorAll('[role="alert"],[aria-live]')];
      return cands.map((c) => ({ role: c.getAttribute('role'), live: c.getAttribute('aria-live'), text: (c.innerText || '').slice(0, 120) }));
    });
    fs.writeFileSync(path.join(UT, 'txt', 'login-arialive.json'), JSON.stringify(ariaLive, null, 2), 'utf8');
    h.log('ARIA-LIVE-KANDIDATER', JSON.stringify(ariaLive));
  } else {
    h.log('VARNING', 'Hittade inget fält med label som matchar /e-post/i — spara skärmdump och läs manuellt.');
  }

  await axeKor(p, h, 'login');

  // 320px reflow
  await p.setViewportSize({ width: 320, height: 800 });
  await p.waitForTimeout(500);
  await p.screenshot({ path: path.join(UT, 'login-04-320px.png'), fullPage: true });
  const scrollBredd = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  h.log('320PX SIDLEDSSCROLL (px, 0=ok)', scrollBredd);
  fs.writeFileSync(path.join(UT, 'txt', 'login-320px-scroll.txt'), String(scrollBredd), 'utf8');

  await b.close();
})();
