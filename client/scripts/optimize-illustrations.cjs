/* Engångsskript: ChatGPT-bilderna saknar alfa och har transparens-rutmönstret
   (neutralgrått ~243/254) inbränt som pixlar. Vi flood-fillar bort det
   kantanslutna neutralgrå mönstret -> äkta transparens, lämnar färgade/pastell-
   ytor orörda, och skriver optimerad webp till client/public/illustrations/. */
const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..', '..')
const OUT = path.resolve(__dirname, '..', 'public', 'illustrations')
fs.mkdirSync(OUT, { recursive: true })

const MAP = [
  { src: 'söka jobb.png', out: 'empty-jobb' },
  { src: 'karriär.png', out: 'empty-karriar' },
  { src: 'resurser.png', out: 'empty-resurser' },
  { src: 'min vardag.png', out: 'empty-vardag' },
  { src: 'översikt.png', out: 'empty-oversikt' },
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

async function clean(input) {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width, height, channels } = info // channels = 4
  const out = Buffer.from(data)
  const N = width * height
  const bg = new Uint8Array(N) // 1 = ska bli transparent

  // --- Steg 1: texturdetektor ---
  // Rutmönstret växlar mellan ljus (~254) och grå (~243). En neutralljus pixel
  // som har BÅDE en mörkare grå (<=247) OCH en ljusare (>=252) neutral granne
  // inom några rutors avstånd ligger i ett rutmönster. Jämna ljusytor (en
  // enda nyans, t.ex. anslagstavlan) saknar denna växling och bevaras.
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

  // --- Steg 2: flood-fill från kanten ---
  // Fångar den yttre bakgrunden + antialias-kanter (en enda mellangrå nyans
  // som texturtestet missar) som hänger ihop med ramen.
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

;(async () => {
  for (const { src, out } of MAP) {
    const input = path.join(ROOT, src)
    const output = path.join(OUT, `${out}.webp`)
    const before = fs.statSync(input).size
    const cleaned = await clean(input)
    await cleaned
      .trim()                              // beskär nu äkta transparent luft
      .resize(360, 360, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82, alphaQuality: 95, effort: 6 })
      .toFile(output)
    const after = fs.statSync(output).size
    console.log(`${out}.webp  ${(before / 1024).toFixed(0)}KB -> ${(after / 1024).toFixed(1)}KB`)
  }
})()
