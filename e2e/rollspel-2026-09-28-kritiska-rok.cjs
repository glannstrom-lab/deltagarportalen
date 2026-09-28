// Röktest i prod av de kritiska rättningarna efter rollspelet 2026-09-28.
// Körs som stegfil med e2e/rollspel-2026-09-28.cjs, en gång per roll:
//   ROK=hanna  → Hanna Handläggare: "Underlag till dig" med två underlag, kvittera ett
//   ROK=chef   → demo@jobin.se: omfångsraden i Rapporter och IVO säger "hela Demokommun"
//   ROK=erik   → Erik (deltagare): mobil, välj arabiska → Googles skript laddas; CV-mallknappen
module.exports = async (p, h) => {
  const vem = process.env.ROK
  if (vem === 'hanna') {
    await h.go('/consultant')
    await p.waitForSelector('[data-testid="mottagna-underlag"]', { timeout: 20000 })
    const t = await p.locator('[data-testid="mottagna-underlag"]').innerText()
    h.log('SARA', /Sara Påhitt/.test(t), 'ANNA', /Anna Exempel/.test(t), 'FÖRKLARAT', /förklarat 1 av 3/.test(t))
    await h.shot('rok-hanna-underlag')
    const knapp = p.getByRole('button', { name: 'Kvittera mottaget' }).first()
    if (await knapp.count()) {
      await knapp.click()
      await p.waitForTimeout(2500)
      h.log('KVITTERAT', /Du kvitterade/.test(await p.locator('[data-testid="mottagna-underlag"]').innerText()))
    } else h.log('KVITTERAT', 'ingen knapp')
  }
  if (vem === 'chef') {
    await h.go('/consultant/analytics')
    await p.waitForSelector('[data-testid="rapporter-omfang"]', { timeout: 30000 })
    h.log('RAPPORTER', await p.locator('[data-testid="rapporter-omfang"]').innerText())
    await p.waitForSelector('[data-testid="rapport-omfang"]', { timeout: 30000 }).catch(() => {})
    const rader = await p.locator('[data-testid="rapport-omfang"]').allInnerTexts()
    h.log('DELAR', JSON.stringify(rader))
    const txt = await h.text()
    h.log('KOLLEGADELTAGARE', /Deltagare hos Kim Kollega/.test(txt))
    await h.shot('rok-chef-rapporter')
  }
  if (vem === 'erik') {
    await h.go('/cv')
    const txt = await h.text()
    h.log('FALSK AI-KNAPP BORTA', !/Generera sammanfattning/.test(txt))
    await p.evaluate(() => localStorage.setItem('googleTranslateLanguage', 'ar'))
    await p.evaluate(() => { document.cookie = 'googtrans=/sv/ar; path=/' })
    await p.reload()
    await p.waitForTimeout(6000)
    const skript = await p.evaluate(() => !!document.querySelector('script[src*="translate.google.com/translate_a/element.js"]'))
    const lang = await p.evaluate(() => document.documentElement.lang + ' ' + document.documentElement.className)
    h.log('GOOGLESKRIPT PÅ MOBIL', skript, 'HTML', lang)
    await h.shot('rok-erik-arabiska', false)
    await p.evaluate(() => { localStorage.removeItem('googleTranslateLanguage'); document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/' })
  }
}
