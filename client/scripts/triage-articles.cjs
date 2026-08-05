#!/usr/bin/env node
/**
 * Triage: vilka artiklar som kvalificerar för publicering.  (spår K3, 2026-08-05)
 *
 * Skriver om content/publish-list.json utifrån uttryckliga regler, så att
 * urvalet går att granska och köra om — inte en engångsbedömning som ingen
 * kan reproducera.
 *
 * Kör: npm run content:triage        (visar utfallet)
 *      npm run content:triage -- --skriv   (skriver publish-list.json)
 *
 * REGLERNA, och varför de ser ut som de gör:
 *
 * 1. Längd, men ANPASSAD EFTER FORMAT. Första versionen hade en enda gräns
 *    på 350 ord. Den slog ut 13 av 15 lättläst-artiklar — alltså precis den
 *    nisch som är spårets bästa möjlighet (K5). Korthet är formatets POÄNG
 *    i lättläst svenska: korta meningar, en tanke per rad. Gränsen är därför
 *    120 ord för lättläst och 350 för övriga.
 *
 * 2. Checklistorna räknas med. De ligger i kolumnen `checklist`, inte i
 *    `content`, men renderas som riktigt innehåll på sidan. Att räkna bara
 *    `content` underskattade flera artiklar.
 *
 * 3. Portalspecifikt och onboarding publiceras inte. "Så funkar portalen" är
 *    produktdokumentation, inte innehåll någon söker efter.
 *
 * 4. Årtalsmärkt innehåll publiceras inte när året passerat.
 *
 * De som faller på längd är inte dåliga — de är för korta för att stå som
 * egen sida. Rätt åtgärd är att bygga ut eller slå ihop dem, inte att
 * publicera dem tunna. Se ROADMAP K3.
 */

const fs = require('node:fs')
const path = require('node:path')
const { markdownToPlain } = require('./lib/markdown.cjs')

const CONTENT = path.join(__dirname, '..', 'content')
const SNAPSHOT = path.join(CONTENT, 'articles.snapshot.json')
const PUBLISH_LIST = path.join(CONTENT, 'publish-list.json')

const GRANS_LATTLAST = 120
const GRANS_NORMAL = 350
const PORTALSPECIFIK = /portalen|jobin|denna sida|här i appen/i
const AR_I_TITEL = /\b(20\d\d)\b/

const snapshot = JSON.parse(fs.readFileSync(SNAPSHOT, 'utf8'))
const iAr = new Date().getFullYear()

const arLattlast = (a) =>
  a.difficulty === 'easy-swedish' || a.category_key === 'easy-swedish' || /^latt/.test(a.slug)

function bedom(a) {
  const contentOrd = markdownToPlain(a.content).split(/\s+/).filter(Boolean).length
  const checklistOrd = Array.isArray(a.checklist)
    ? a.checklist
        .map((c) => String(c.text || c))
        .join(' ')
        .split(/\s+/)
        .filter(Boolean).length
    : 0
  const ord = contentOrd + checklistOrd
  const grans = arLattlast(a) ? GRANS_LATTLAST : GRANS_NORMAL

  const skal = []
  if (ord < grans) skal.push(`för kort: ${ord} ord (gräns ${grans})`)
  if (PORTALSPECIFIK.test(a.title)) skal.push('portalspecifik titel')
  if (a.category_key === 'getting-started') skal.push('onboarding, inte innehåll')

  const arMatch = (a.title + ' ' + a.slug).match(AR_I_TITEL)
  if (arMatch && Number(arMatch[1]) < iAr) skal.push(`årtalsmärkt (${arMatch[1]}) och passerat`)

  return { slug: a.slug, titel: a.title, kategori: a.category_key, ord, lattlast: arLattlast(a), skal }
}

const bedomda = snapshot.articles.map(bedom)
const kvalificerade = bedomda.filter((b) => b.skal.length === 0)
const uteslutna = bedomda.filter((b) => b.skal.length > 0)

console.log(`Triage av ${bedomda.length} artiklar:`)
console.log(`  kvalificerade : ${kvalificerade.length}`)
console.log(`  uteslutna     : ${uteslutna.length}`)
console.log(`  lättläst med  : ${kvalificerade.filter((b) => b.lattlast).length} av ${bedomda.filter((b) => b.lattlast).length}`)

console.log('\nUteslutna:')
for (const u of uteslutna) console.log(`  ${u.slug.padEnd(34)} ${u.skal.join('; ')}`)

const perKategori = {}
for (const k of kvalificerade) perKategori[k.kategori] = (perKategori[k.kategori] || 0) + 1
console.log('\nKvalificerade per kategori:')
for (const [k, n] of Object.entries(perKategori).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${k.padEnd(22)} ${n}`)
}

if (!process.argv.includes('--skriv')) {
  console.log('\n(Torrkörning. Lägg till --skriv för att uppdatera publish-list.json.)')
  process.exit(0)
}

const lista = {
  _kommentar:
    'Vilka guider som publiceras publikt under /guider/. Genererad av `npm run content:triage -- --skriv` — redigera hellre reglerna i scripts/triage-articles.cjs än den här listan för hand.',
  _regler: `lättläst >= ${GRANS_LATTLAST} ord, övriga >= ${GRANS_NORMAL} ord (checklistor inräknade); ej portalspecifika; ej onboarding; ej passerade årtal`,
  genereradAt: new Date().toISOString().slice(0, 10),
  antal: kvalificerade.length,
  published: kvalificerade.map((k) => k.slug).sort(),
  _uteslutna: Object.fromEntries(uteslutna.map((u) => [u.slug, u.skal.join('; ')])),
}

fs.writeFileSync(PUBLISH_LIST, JSON.stringify(lista, null, 2) + '\n', 'utf8')
console.log(`\nSkrev publish-list.json med ${kvalificerade.length} slugs.`)
