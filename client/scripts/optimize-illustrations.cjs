/* Engångsskript: ChatGPT-bilderna saknar alfa och har transparens-rutmönstret
   (neutralgrått ~243/254) inbränt som pixlar. Vi flood-fillar bort det
   kantanslutna neutralgrå mönstret -> äkta transparens, lämnar färgade/pastell-
   ytor orörda, och skriver optimerad webp till client/public/illustrations/. */
const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

// Källbilderna (ChatGPT-PNG) ligger ogitspårade i design-source/illustrations-raw/
const SRC = path.resolve(__dirname, '..', '..', 'design-source', 'illustrations-raw')
const OUT = path.resolve(__dirname, '..', 'public', 'illustrations')
fs.mkdirSync(OUT, { recursive: true })

// Spot-illustrationer (kvadrat, ~360px) för tomtillstånd.
const MAP = [
  { src: 'söka jobb.png', out: 'empty-jobb' },
  { src: 'karriär.png', out: 'empty-karriar' },
  { src: 'resurser.png', out: 'empty-resurser' },
  { src: 'min vardag.png', out: 'empty-vardag' },
  { src: 'översikt.png', out: 'empty-oversikt' },
]

// Hero-illustrationer (bredformat, ~1200px brett) för hub-landningssidornas hero.
// Genererade på solid magenta -> chroma-key.
const HEROES = [
  { src: 'översikt hero.png', out: 'hero-oversikt' },
  { src: 'hero jobb.png', out: 'hero-jobb' },
  { src: 'hero karriär.png', out: 'hero-karriar' },
  { src: 'hero resurser.png', out: 'hero-resurser' },
  { src: 'hero vardag.png', out: 'hero-vardag' },
]

// Spot-illustrationer genererade på solid magenta (chroma-key) — framgång,
// onboarding och editorial. Kvadratiska, ~360px.
const SPOTS_MAGENTA = [
  { src: 'success cv.png', out: 'success-cv' },
  { src: 'success ansokan.png', out: 'success-ansokan' },
  { src: 'success klart.png', out: 'success-klart' },
  { src: 'success valkommen.png', out: 'spot-valkommen' },
  { src: 'spot intervju.png', out: 'spot-intervju' },
  { src: 'spot ekonomi.png', out: 'spot-ekonomi' },
  { src: 'spot ratt.png', out: 'spot-ratt' },
  { src: 'spot halsa.png', out: 'spot-halsa' },
  // Kunskapsbankens kategori-banners (§7.5) — sky-blå, chroma-key på magenta.
  { src: 'spot start.png', out: 'spot-start' },
  { src: 'spot sjalvkannedom.png', out: 'spot-sjalvkannedom' },
  { src: 'spot natverk.png', out: 'spot-natverk' },
  { src: 'spot digital.png', out: 'spot-digital' },
  { src: 'spot karriarutveckling.png', out: 'spot-karriarutveckling' },
  { src: 'spot arbetsmarknad.png', out: 'spot-arbetsmarknad' },
  { src: 'spot verktyg.png', out: 'spot-verktyg' },
  { src: 'spot tillgänglighet.png', out: 'spot-tillganglighet' },
  { src: 'spot lattsvenska.png', out: 'spot-lattsvenska' },
]

// En pixel räknas som nära-neutral+ljus (kandidat för rutmönster-bakgrund).
// Rutmönstret är 243/254; pastellfärger har färgton (diff > 10) och undantas.
const NEUTRAL_DIFF = 9
const MIN_BRIGHT = 235
function neutralBright(d, i) {
  const r = d[i], g = d[i + 1], b = d[i + 2]
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  return (max - min) <= NEUTRAL_DIFF && min >= MIN_BRIGHT
}
const isNeutral = (d, i) => {
  const r = d[i], g = d[i + 1], b = d[i + 2]
  return (Math.max(r, g, b) - Math.min(r, g, b)) <= NEUTRAL_DIFF
}

// mode='spot'    -> ChatGPT-PNG med inbränt rutmönster: textur + kant-floodfill.
// mode='magenta' -> ChatGPT-PNG på SOLID MAGENTA: chroma-key bort magentan med
//                   mjuk alfa-kant + spill-suppression (tar bort rosa fransar).
async function clean(input, mode = 'spot') {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width, height, channels } = info // channels = 4
  const out = Buffer.from(data)
  const N = width * height

  if (mode === 'magenta') {
    // Chroma-key mot solid magenta. Magentaness = min(R,B) - G: magenta #FF00FF
    // (R och B höga, G=0) -> 255; vitt -> 0; korall-rosa (lågt B) och lavendel
    // (lågt R) -> lågt; sky/grönt -> negativt. Skiljer alltså äkta magenta från
    // alla hub-färger. score >= HIGH => transparent, <= LOW => behåll, mellan =>
    // mjuk kant + de-spill (höjer G mot min(R,B) så rosa kantfransar blir neutrala).
    const LOW = 60, HIGH = 160
    for (let p = 0; p < N; p++) {
      const i = p * channels
      const r = data[i], g = data[i + 1], b = data[i + 2]
      const score = Math.min(r, b) - g
      if (score <= LOW) continue
      if (score >= HIGH) { out[i + 3] = 0; continue }
      out[i + 3] = Math.round(255 * (HIGH - score) / (HIGH - LOW))
      const floor = Math.min(r, b)            // de-spill: neutralisera magenta-tinten
      if (g < floor) out[i + 1] = floor
    }
    return sharp(out, { raw: { width, height, channels } })
  }

  // --- spot: rutmönster-borttagning (textur + kant-floodfill) ---
  const bg = new Uint8Array(N) // 1 = ska bli transparent

  // Steg 1: texturdetektor. En neutralljus pixel som har BÅDE en mörkare (<=247)
  // OCH ljusare (>=252) neutral granne inom några rutors avstånd ligger i ett
  // rutmönster. Jämna ljusytor (enfärgad anslagstavla) saknar växlingen, bevaras.
  const RINGS = [7, 14, 21]
  const DIRS = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]]
  const sampleNeutral = (x, y, lo, hi) => {
    const found = { lo: false, hi: false }
    for (const r of RINGS) for (const [dx, dy] of DIRS) {
      const nx = x + dx * r, ny = y + dy * r
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue
      const j = (ny * width + nx) * channels
      if (!isNeutral(data, j)) continue
      const v = data[j]
      if (v <= lo) found.lo = true
      else if (v >= hi) found.hi = true
      if (found.lo && found.hi) return true
    }
    return false
  }
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const p = y * width + x
      if (neutralBright(data, p * channels) && sampleNeutral(x, y, 247, 252)) bg[p] = 1
    }
  }

  // Steg 2: flood-fill från kanten — yttre bakgrund + antialias-kanter (enstaka
  // mellangrå nyans som texturtestet missar) som hänger ihop med ramen.
  const visited = new Uint8Array(N)
  const stack = []
  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return
    const p = y * width + x
    if (visited[p]) return
    visited[p] = 1
    if (neutralBright(data, p * channels)) { bg[p] = 1; stack.push(p) }
  }
  for (let x = 0; x < width; x++) { push(x, 0); push(x, height - 1) }
  for (let y = 0; y < height; y++) { push(0, y); push(width - 1, y) }
  while (stack.length) {
    const p = stack.pop()
    const x = p % width, y = (p / width) | 0
    push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1)
  }

  for (let p = 0; p < N; p++) if (bg[p]) out[p * channels + 3] = 0
  return sharp(out, { raw: { width, height, channels } })
}

async function process(list, mode, resize) {
  for (const { src, out } of list) {
    const input = path.join(SRC, src)
    if (!fs.existsSync(input)) { console.log(`(hoppar ${src} — saknas)`); continue }
    const output = path.join(OUT, `${out}.webp`)
    const before = fs.statSync(input).size
    const cleaned = await clean(input, mode)
    await cleaned
      .trim()                              // beskär äkta transparent luft
      .resize(resize)
      .webp({ quality: 82, alphaQuality: 95, effort: 6 })
      .toFile(output)
    const after = fs.statSync(output).size
    console.log(`${out}.webp  ${(before / 1024).toFixed(0)}KB -> ${(after / 1024).toFixed(1)}KB`)
  }
}

;(async () => {
  await process(MAP, 'spot', { width: 360, height: 360, fit: 'inside', withoutEnlargement: true })
  await process(HEROES, 'magenta', { width: 1200, withoutEnlargement: true })
  await process(SPOTS_MAGENTA, 'magenta', { width: 360, height: 360, fit: 'inside', withoutEnlargement: true })
})()
