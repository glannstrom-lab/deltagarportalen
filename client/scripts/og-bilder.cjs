#!/usr/bin/env node
/**
 * Genererar delningsbilderna (og:image, 1200×630) till public/og/ — en per
 * kategori/sidtyp enligt registret i scripts/lib/og-bild.cjs (KG3).
 *
 * Omkörbar: skriver över. Använder Playwright ur repo-roten (inte en
 * byggberoende — bilderna committas, bygget läser dem bara).
 *
 *   NODE_PATH=../node_modules node scripts/og-bilder.cjs
 *
 * Designregler: en hubbfärg per bild (pastell + textfärg ur tokens.css), ingen
 * gradient (DESIGN.md §6), loggan ur public/logo-icon.svg, lugn ton.
 */
const fs = require('node:fs')
const path = require('node:path')
const { OG_BILDER, HUBBAR } = require('./lib/og-bild.cjs')

const PUBLIC = path.join(__dirname, '..', 'public')
const UT = path.join(PUBLIC, 'og')
const LOGGA = fs.readFileSync(path.join(PUBLIC, 'logo-icon.svg'), 'utf8')
const MAX_BYTES = 150 * 1024

function html({ rubrik, underrad, hub }) {
  const c = HUBBAR[hub]
  const logga = `data:image/svg+xml;base64,${Buffer.from(LOGGA).toString('base64')}`
  return `<!doctype html><html lang="sv"><head><meta charset="utf-8"><style>
  html,body{margin:0;width:1200px;height:630px;overflow:hidden}
  body{background:${c.bg};font-family:"Segoe UI",system-ui,-apple-system,Roboto,Arial,sans-serif;color:${c.text};position:relative}
  .rail{position:absolute;left:0;top:0;bottom:0;width:22px;background:${c.solid}}
  .top{position:absolute;left:96px;top:84px;display:flex;align-items:center;gap:22px}
  .top img{width:72px;height:72px;border-radius:18px}
  .top .namn{font-size:34px;font-weight:600;letter-spacing:-0.01em;color:${c.text}}
  .top .dot{width:8px;height:8px;border-radius:50%;background:${c.solid};opacity:.7}
  .top .hubb{font-size:26px;color:${c.solid};font-weight:500}
  h1{position:absolute;left:96px;right:96px;top:230px;margin:0;font-size:84px;line-height:1.05;font-weight:700;letter-spacing:-0.02em}
  p{position:absolute;left:96px;right:96px;top:412px;margin:0;font-size:36px;line-height:1.3;font-weight:400;opacity:.9}
  .foot{position:absolute;left:96px;bottom:64px;font-size:28px;color:${c.solid};font-weight:500}
  </style></head><body>
  <div class="rail"></div>
  <div class="top"><img src="${logga}" alt=""><span class="namn">Jobin</span><span class="dot"></span><span class="hubb">${c.namn}</span></div>
  <h1>${rubrik}</h1>
  <p>${underrad}</p>
  <div class="foot">www.jobin.se</div>
  </body></html>`
}

;(async () => {
  const { chromium } = require('playwright')
  fs.mkdirSync(UT, { recursive: true })
  const browser = await chromium.launch()
  const ctx = await browser.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 })
  const page = await ctx.newPage()
  const gjorda = new Map()
  for (const post of Object.values(OG_BILDER)) {
    if (gjorda.has(post.fil)) continue
    await page.setContent(html(post), { waitUntil: 'load' })
    const fil = path.join(UT, `${post.fil}.png`)
    await page.screenshot({ path: fil, type: 'png', clip: { x: 0, y: 0, width: 1200, height: 630 } })
    const bytes = fs.statSync(fil).size
    gjorda.set(post.fil, bytes)
    const varning = bytes > MAX_BYTES ? '  ⚠ över 150 kB' : ''
    console.log(`${post.fil}.png  ${Math.round(bytes / 1024)} kB${varning}`)
  }
  await browser.close()
  console.log(`\n${gjorda.size} bilder i ${path.relative(process.cwd(), UT)}`)
  if ([...gjorda.values()].some((b) => b > MAX_BYTES)) process.exit(1)
})()
