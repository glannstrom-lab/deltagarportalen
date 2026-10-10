// Fotograferar varje deltagarsida i prod (eller BASE) som demodeltagaren —
// underlag för designgenomgången 2026-10-09 ("för texttungt").
//
// Kör:  NODE_PATH=node_modules node e2e/sidfoto-alla-sidor.cjs <utkatalog> [bredd]
//       PLAYWRIGHT_BASE_URL=http://localhost:3000 för dev-servern (inloggningen går mot prod-Supabase)
// FARGSCHEMA=dark fotograferar i mörkt läge (temat följer systemet som default).
// Mäter också textmängden per sida (antal ord i <main>) så att "texttung"
// blir ett tal och inte ett intryck.
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path')
const ROOT = path.join(__dirname, '..'); const env = { ...process.env }
for (const f of [path.join(ROOT, '.env.test.local'), path.join(ROOT, 'client', '.env')]) {
  if (!fs.existsSync(f)) continue
  for (const l of fs.readFileSync(f, 'utf8').split(/\r?\n/)) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !env[m[1]]) env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
}
const BASE = env.PLAYWRIGHT_BASE_URL || 'https://www.jobin.se'
const EMAIL = env.DEMO_PARTICIPANT_EMAIL, PW = env.DEMO_PARTICIPANT_PASSWORD
const UT = process.argv[2] || path.join(ROOT, 'e2e', 'screenshots', 'sidfoto'); fs.mkdirSync(UT, { recursive: true })
const BREDD = Number(process.argv[3] || 1440)
// SIDOR=/cv,/salary begränsar körningen; utan den fotograferas alla.
const ALLA = ['/oversikt', '/jobb', '/karriar', '/resurser', '/min-vardag', '/job-search', '/applications', '/spontanansökan',
  '/cv', '/cover-letter', '/interview-simulator', '/salary', '/international', '/linkedin-optimizer', '/career',
  '/interest-guide', '/skills-gap-analysis', '/personal-brand', '/education', '/knowledge-base', '/resources',
  '/ai-team', '/wellness', '/diary', '/calendar', '/exercises', '/my-consultant', '/profile', '/settings', '/min-vecka', '/externa-resurser']
// Git Bash skriver om SIDOR=/salary till "C:/Program Files/Git/salary"
// (MSYS-sökvägskonvertering) — då fotograferades tyst fel sida. Ta tillbaka
// rutten i stället för att lita på att alla minns MSYS_NO_PATHCONV=1.
const SIDOR = env.SIDOR ? env.SIDOR.split(',').map((s) => s.replace(/^[A-Za-z]:\/.*?\/Git(?=\/)/, '')) : ALLA
;(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: BREDD, height: 900 }, colorScheme: env.FARGSCHEMA === 'dark' ? 'dark' : 'light' }); const p = await ctx.newPage()
  await p.goto(`${BASE}/#/login`); await p.waitForTimeout(1500)
  await p.locator('input#email').fill(EMAIL); await p.locator('input#password').fill(PW)
  const cookies = p.getByRole('button', { name: /endast nödvändiga/i })
  if (await cookies.isVisible({ timeout: 1500 }).catch(() => false)) await cookies.click()
  await p.getByRole('button', { name: /^logga in$/i }).click()
  await p.waitForURL((u) => !u.toString().includes('/login'), { timeout: 20000 }); await p.waitForTimeout(2000)
  const rader = []
  for (const s of SIDOR) {
    await p.goto(`${BASE}/#${s}`); await p.waitForTimeout(3000)
    const namn = s.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'start'
    await p.screenshot({ path: path.join(UT, `${namn}.png`), fullPage: true })
    const m = await p.evaluate(() => {
      const main = document.querySelector('main'); if (!main) return { ord: 0, bilder: 0, hojd: 0 }
      const ord = (main.innerText || '').split(/\s+/).filter(Boolean).length
      const bilder = [...main.querySelectorAll('img')].filter((i) => i.offsetWidth > 40).length
      return { ord, bilder, hojd: document.documentElement.scrollHeight }
    })
    rader.push({ sida: s, ...m }); console.log(`${s.padEnd(24)} ord=${String(m.ord).padStart(5)} bilder=${m.bilder} höjd=${m.hojd}`)
  }
  fs.writeFileSync(path.join(UT, 'matning.json'), JSON.stringify(rader, null, 2))
  await b.close()
})().catch((e) => { console.error(e); process.exit(1) })
