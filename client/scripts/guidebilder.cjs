#!/usr/bin/env node
/**
 * Gör sidbilderna till de publika sidorna webbfärdiga (2026-11-09).
 *
 *   npm run guidebilder              — bearbeta nya original, hoppa över befintliga
 *   npm run guidebilder -- --om      — bearbeta om alla
 *   npm run guidebilder -- --saknas  — lista publicerade sidor utan bild (exit 1 om några)
 *
 * Källor:
 *   · design-source/sidbilder-seo/raw/<nyckel>.webp  — ElevenLabs-original
 *     (recraft-v4.1-flash, 1344×768, gitignorerat; motiven i omgang-*-motiv.json)
 *   · public/illustrations/sida-<sidnyckel>-mjuk.webp — appens sidbilder,
 *     återanvända för verktygssidorna enligt VERKTYG_SIDBILD
 *
 * Ut: public/guidebilder/<nyckel>.webp, 1040×520 (2:1, beskuret mot mitten).
 * Nycklarna: se scripts/lib/guidebild.cjs.
 */
const fs = require('node:fs')
const path = require('node:path')
const sharp = require('sharp')
const { KATALOG, BREDD, HOJD, VERKTYG_SIDBILD, filFor } = require('./lib/guidebild.cjs')
const { getPublishedArticles } = require('./lib/guides.cjs')

const CLIENT = path.join(__dirname, '..')
const RAW = path.join(CLIENT, '..', 'design-source', 'sidbilder-seo', 'raw')
const ILLUSTRATIONER = path.join(CLIENT, 'public', 'illustrations')

const args = new Set(process.argv.slice(2))

function allaNycklar() {
  const lasJson = (f) => JSON.parse(fs.readFileSync(path.join(CLIENT, 'content', f), 'utf8'))
  return [
    ...getPublishedArticles().map((a) => a.slug),
    ...lasJson('situationer.json').sidor.map((s) => `for-dig-som--${s.slug}`),
    ...lasJson('b2b.json').sidor.map((b) => `b2b--${b.slug}`),
    ...lasJson('tools.json').verktyg.map((t) => `verktyg--${t.slug}`),
  ]
}

function kallaFor(nyckel) {
  const raw = path.join(RAW, `${nyckel}.webp`)
  if (fs.existsSync(raw)) return raw
  if (nyckel.startsWith('verktyg--')) {
    const sidnyckel = VERKTYG_SIDBILD[nyckel.slice('verktyg--'.length)]
    const fil = sidnyckel && path.join(ILLUSTRATIONER, `sida-${sidnyckel}-mjuk.webp`)
    if (fil && fs.existsSync(fil)) return fil
  }
  return null
}

async function main() {
  const nycklar = allaNycklar()

  if (args.has('--saknas')) {
    const saknas = nycklar.filter((n) => !fs.existsSync(filFor(n)))
    console.log(`${nycklar.length - saknas.length} av ${nycklar.length} sidor har bild.`)
    if (saknas.length) {
      console.log(`Saknar bild (${saknas.length}):\n  ${saknas.join('\n  ')}`)
      process.exit(1)
    }
    return
  }

  fs.mkdirSync(KATALOG, { recursive: true })
  let gjorda = 0, hoppade = 0, utanKalla = 0, bytes = 0
  for (const nyckel of nycklar) {
    const ut = filFor(nyckel)
    if (fs.existsSync(ut) && !args.has('--om')) { hoppade++; continue }
    const kalla = kallaFor(nyckel)
    if (!kalla) { utanKalla++; continue }
    await sharp(kalla)
      .resize(BREDD, HOJD, { fit: 'cover', position: 'centre' })
      .webp({ quality: 62, effort: 6 })
      .toFile(ut)
    bytes += fs.statSync(ut).size
    gjorda++
  }
  console.log(`Bearbetade ${gjorda} (snitt ${gjorda ? Math.round(bytes / gjorda / 1024) : 0} kB), hoppade över ${hoppade} befintliga, ${utanKalla} utan original.`)
}

main().catch((e) => { console.error(e); process.exit(1) })
