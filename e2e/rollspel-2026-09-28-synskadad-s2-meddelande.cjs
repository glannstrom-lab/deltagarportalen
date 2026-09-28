const { tabTrace, axeKor, landmarkOchRubriker } = require('./rollspel-2026-09-28-synskadad-helpers.cjs');
const fs = require('fs');
const path = require('path');

module.exports = async (p, h) => {
  await h.go('/my-consultant');
  await h.shot('03-konsulent-start');
  await landmarkOchRubriker(p, h, 'konsulent');
  await axeKor(p, h, 'konsulent');

  // Hitta meddelandefältet via synligt namn (label "Skriv ett meddelande") och skicka ETT riktigt
  // meddelande med tangentbord, precis som Peter skulle göra med NVDA.
  const falt = p.getByRole('textbox', { name: /skriv (ett )?meddelande/i }).first();
  const finns = await falt.count().then((c) => c > 0).catch(() => false);
  h.log('MEDDELANDEFÄLT HITTAT', finns);
  if (finns) {
    await falt.click();
    const focused = await p.evaluate(() => document.activeElement === document.activeElement); // no-op sanity
    await p.keyboard.type('Hej! Jag undrar när vi kan boka in nästa samtal. Mvh Peter', { delay: 15 });
    await p.screenshot({ path: path.join(h.UT, 'd-03-meddelande-ifyllt.png'), fullPage: true });
    // Skicka med Enter (formuläret säger "Tryck Enter för att skicka")
    await p.keyboard.press('Enter');
    await p.waitForTimeout(2500);
    const txt = await p.locator('main').innerText().catch(() => '');
    fs.writeFileSync(path.join(h.UT, 'txt', 'meddelande-efter-skick.txt'), txt, 'utf8');
    h.log('EFTER SKICK', txt.slice(0, 1500));
    await p.screenshot({ path: path.join(h.UT, 'd-03-meddelande-skickat.png'), fullPage: true });
    // Aria-live-status för "skickat"?
    const live = await p.evaluate(() => [...document.querySelectorAll('[role="status"],[role="alert"],[aria-live]')].map((e) => ({ role: e.getAttribute('role'), live: e.getAttribute('aria-live'), text: (e.textContent || '').slice(0, 150) })));
    fs.writeFileSync(path.join(h.UT, 'txt', 'meddelande-arialive.json'), JSON.stringify(live, null, 2), 'utf8');
    h.log('ARIA-LIVE EFTER SKICK', JSON.stringify(live));
  }

  // Tabordning genom "Snabbåtgärder" och "Säg upp kopplingen" — bara observera, klicka INTE
  await tabTrace(p, h, 'konsulent-snabbatgarder', 20);
};
