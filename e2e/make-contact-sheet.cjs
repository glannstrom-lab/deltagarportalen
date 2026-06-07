/**
 * Bygg kontaktkartor av fold-screenshots så vi kan granska många sidor per bild.
 * Skalar varje fold till 220px bredd, etiketterar med filnamn, packar i rader om 6.
 */
const sharp = require('./../client/node_modules/sharp')
const fs = require('fs')
const path = require('path')

const dir = path.join(__dirname, 'screenshots', 'mobile-full-audit')
const suffix = process.argv[2] || 'fold'
const files = fs.readdirSync(dir).filter(f => f.endsWith(`-${suffix}.png`)).sort()

const CW = 200, GAP = 10, COLS = 6, LABEL = 22
;(async () => {
  const cells = []
  for (const f of files) {
    const img = sharp(path.join(dir, f))
    const meta = await img.metadata()
    const ch = Math.round(meta.height * (CW / meta.width))
    const resized = await sharp(path.join(dir, f)).resize(CW).png().toBuffer()
    const label = f.replace(`-${suffix}.png`, '')
    const svg = Buffer.from(`<svg width="${CW}" height="${LABEL}"><rect width="100%" height="100%" fill="#111"/><text x="4" y="15" font-family="sans-serif" font-size="12" fill="#fff">${label}</text></svg>`)
    const labelImg = await sharp(svg).png().toBuffer()
    const cell = await sharp({ create: { width: CW, height: ch + LABEL, channels: 3, background: '#fff' } })
      .composite([{ input: labelImg, top: 0, left: 0 }, { input: resized, top: LABEL, left: 0 }])
      .png().toBuffer()
    cells.push({ buf: cell, h: ch + LABEL })
  }

  // Pack into rows of COLS; each row height = max cell height in that row
  const rows = []
  for (let i = 0; i < cells.length; i += COLS) rows.push(cells.slice(i, i + COLS))
  let totalH = GAP
  const rowHeights = rows.map(r => Math.max(...r.map(c => c.h)))
  rowHeights.forEach(h => totalH += h + GAP)
  const totalW = COLS * CW + (COLS + 1) * GAP

  const composites = []
  let y = GAP
  rows.forEach((row, ri) => {
    let x = GAP
    for (const c of row) { composites.push({ input: c.buf, top: y, left: x }); x += CW + GAP }
    y += rowHeights[ri] + GAP
  })
  const outPath = path.join(dir, `_sheet-${suffix}.png`)
  await sharp({ create: { width: totalW, height: totalH, channels: 3, background: '#e5e5e5' } })
    .composite(composites).png().toFile(outPath)
  console.log('Wrote', outPath, `(${files.length} pages)`)
})()
