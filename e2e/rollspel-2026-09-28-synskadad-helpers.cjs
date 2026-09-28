// Delade hjälpfunktioner för Peters (synskadad, skärmläsare + tangentbord) rollspel 2026-09-28.
const { AxeBuilder } = require('@axe-core/playwright');
const fs = require('fs');
const path = require('path');

// Tabbar N steg och loggar varje fokuserat elements tillgängliga namn/roll (ariaSnapshot av :focus).
async function tabTrace(p, h, namn, antal) {
  const rader = [];
  for (let i = 1; i <= antal; i++) {
    await p.keyboard.press('Tab');
    let info;
    try {
      const cnt = await p.locator(':focus').count();
      if (cnt === 0) { info = '(inget fokuserat element — fokus tappat, troligen på <body>)'; }
      else {
        const snap = await p.locator(':focus').first().ariaSnapshot({ timeout: 1500 });
        info = snap.trim().replace(/\n/g, ' ').slice(0, 220);
      }
    } catch (e) { info = `FEL: ${String(e.message || e).slice(0, 150)}`; }
    rader.push(`${i}. ${info}`);
  }
  const txt = rader.join('\n');
  fs.writeFileSync(path.join(h.UT, 'txt', `tab-${namn}.txt`), txt, 'utf8');
  h.log('TAB', namn, '\n' + txt);
  return rader;
}

// Kör axe-core mot sidan i sitt nuvarande tillstånd och sparar fynden.
async function axeKor(p, h, namn) {
  const results = await new AxeBuilder({ page: p }).analyze();
  const viktiga = results.violations.map(
    (v) => `${v.id} (${v.impact}) x${v.nodes.length}: ${v.help} — ${v.nodes.map((n) => n.target?.join(' ')).slice(0, 3).join(' | ')}`
  );
  fs.writeFileSync(path.join(h.UT, 'txt', `axe-${namn}.json`), JSON.stringify(results.violations, null, 2), 'utf8');
  h.log('AXE', namn, viktiga.length ? '\n' + viktiga.join('\n') : 'inga fynd');
  return results.violations;
}

// Loggar landmärken (role) och rubrikhierarki på sidan.
async function landmarkOchRubriker(p, h, namn) {
  const data = await p.evaluate(() => {
    const roller = ['banner', 'navigation', 'main', 'contentinfo', 'complementary', 'search', 'form', 'region'];
    const landmarks = [];
    document.querySelectorAll('body *').forEach((el) => {
      const rolAttr = el.getAttribute('role');
      const tag = el.tagName.toLowerCase();
      const implicit = { header: 'banner', nav: 'navigation', main: 'main', footer: 'contentinfo', aside: 'complementary' }[tag];
      const rol = rolAttr || implicit;
      if (rol && roller.includes(rol)) {
        landmarks.push(`${rol}${el.getAttribute('aria-label') ? ' "' + el.getAttribute('aria-label') + '"' : ''}`);
      }
    });
    const rubriker = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map(
      (h) => `${h.tagName} "${h.innerText.trim().slice(0, 60)}"`
    );
    return { landmarks, rubriker };
  });
  const txt = `LANDMÄRKEN:\n${data.landmarks.join('\n') || '(inga)'}\n\nRUBRIKER:\n${data.rubriker.join('\n') || '(inga)'}`;
  fs.writeFileSync(path.join(h.UT, 'txt', `struktur-${namn}.txt`), txt, 'utf8');
  h.log('STRUKTUR', namn, '\n' + txt);
  return data;
}

// Kollar om en skip-länk finns och blir synlig/fungerar vid Tab #1.
async function skipLank(p, h, namn) {
  await p.keyboard.press('Tab');
  const info = await p.evaluate(() => {
    const el = document.activeElement;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return {
      tag: el.tagName, text: (el.innerText || el.textContent || '').trim().slice(0, 80),
      href: el.getAttribute('href'), synlig: rect.width > 0 && rect.height > 0,
    };
  });
  fs.writeFileSync(path.join(h.UT, 'txt', `skiplank-${namn}.json`), JSON.stringify(info, null, 2), 'utf8');
  h.log('SKIPLÄNK', namn, JSON.stringify(info));
  return info;
}

module.exports = { tabTrace, axeKor, landmarkOchRubriker, skipLank };
