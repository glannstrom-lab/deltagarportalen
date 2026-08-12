#!/usr/bin/env node
/**
 * Rättar `title`/`summary` på befintliga artiklar i prod.  (spår K14, 2026-08-12)
 *
 * Varför ett eget skript: `apply-expansions.cjs` kan visserligen ändra titel,
 * men bara som en följd av att brödtexten byggs ut — den kräver en `.md`-fil
 * per slug. Här ändras ingenting i texten, bara det som står i sökresultatet.
 *
 * Varför mot databasen: tabellen `articles` är sanningen. Appen läser den och
 * guidesidorna byggs ur en snapshot av den; rättar man bara snapshoten glider
 * portalen och de publika sidorna isär.
 *
 * Säkerhet: torrkörning som default, backup av de gamla värdena innan något
 * skrivs, dollar-citering, och `--rollback` som återställer ur backupen.
 *
 * Kör:
 *   node scripts/apply-title-fixes.cjs             # visar vad som skulle ändras
 *   node scripts/apply-title-fixes.cjs --skriv
 *   node scripts/apply-title-fixes.cjs --rollback --skriv
 */

const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { execSync } = require('node:child_process')

const REPO_ROOT = path.join(__dirname, '..', '..')
const SNAPSHOT = path.join(__dirname, '..', 'content', 'articles.snapshot.json')
const BACKUP = path.join(__dirname, '..', 'content', '_backup-title-fixes.json')
const DOLLAR_TAG = '$jobin_titel$'

/**
 * RÄTTELSERNA.
 *
 * Två artikelpar hade ORDAGRANT samma titel. Det är ett fel oavsett vilken
 * sida som på sikt ska vinna sökningen (den frågan kräver Search Console,
 * ROADMAP K8): två rader med identisk rubrik på /guider/ och /guider/lattlast/
 * går inte att skilja åt för en läsare, och i ett sökresultat konkurrerar de
 * med sig själva.
 *
 * Rättelsen ändrar INTE vilken sida som är bäst — den får varje titel att
 * beskriva sin egen artikel. Innehållet är oförändrat.
 */
const RATTELSER = {
  // Paret hade titeln "Hitta dina värderingar – nyckeln till rätt jobb" båda två.
  // Läst innehåll: den ena är en övningsbok, den andra en katalog över
  // värderingstyper. Alltså två olika artiklar, inte en dubblett.
  'hitta-dina-varderingar': {
    title: 'Hitta dina värderingar – två övningar som ger svar',
    summary:
      'Två konkreta övningar som hjälper dig sätta ord på vad som betyder mest för dig i ett jobb.',
    _varfor: 'Artikeln är övningsdriven (Topp-5-metoden m.fl.) — titeln säger det nu.',
  },
  'varderingar-i-arbetslivet': {
    title: 'Vanliga arbetsvärderingar – och vad de betyder',
    summary:
      'Ekonomiska, sociala och utvecklingsinriktade värderingar — vad de innebär och hur de skiljer sig från intressen.',
    _varfor:
      'Artikeln är en genomgång av värderingstyper, inte en övning. Titeln pekade tidigare på fel innehåll.',
  },

  // Paret hade titeln "Vad är ett CV?" båda två, och båda visas på
  // /guider/lattlast/ — samma rubrik två gånger i samma lista.
  'latt-svenska-cv': {
    title: 'Vad ska stå i ett CV?',
    summary: 'En enkel guide om vad du skriver i ditt CV. På lätt svenska.',
    _varfor:
      'Artikelns avsnitt är "Vad ska ett CV ha?" och "Tips" — den handlar om innehållet i CV:t. Den definitionella frågan äger lattsvenska-vad-ar-cv, som förklarar vad förkortningen betyder.',
  },
  // lattsvenska-vad-ar-cv behåller "Vad är ett CV?" — den förklarar begreppet
  // ("Vad betyder CV?") och ligger dessutom i rätt kategori (easy-swedish).
}

function kor(sql) {
  const tmp = path.join(os.tmpdir(), `apply-title-fixes-${process.pid}.sql`)
  fs.writeFileSync(tmp, sql, 'utf8')
  try {
    return execSync(`npx supabase db query --linked -f "${tmp}"`, {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      maxBuffer: 32 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'pipe'],
    })
  } finally {
    try { fs.unlinkSync(tmp) } catch { /* temp-filen är inte kritisk */ }
  }
}

const citera = (s) => {
  if (String(s).includes(DOLLAR_TAG)) {
    console.error('Text innehåller dollar-taggen — kan inte citeras säkert. Avbryter.')
    process.exit(1)
  }
  return `${DOLLAR_TAG}${s}${DOLLAR_TAG}`
}

const skriv = process.argv.includes('--skriv')
const rollback = process.argv.includes('--rollback')

if (rollback) {
  if (!fs.existsSync(BACKUP)) {
    console.error('Ingen backup att återställa från.')
    process.exit(1)
  }
  const backup = JSON.parse(fs.readFileSync(BACKUP, 'utf8'))
  const satser = backup.artiklar.map(
    (a) =>
      `UPDATE articles SET title = ${citera(a.title)}, summary = ${citera(a.summary)} ` +
      `WHERE slug = ${citera(a.slug)};`
  )
  if (!skriv) {
    console.log(`Torrkörning: skulle återställa ${satser.length} titlar. Lägg till --skriv.`)
    process.exit(0)
  }
  kor(satser.join('\n'))
  console.log(`Återställde ${satser.length} titlar.`)
  process.exit(0)
}

const snapshot = JSON.parse(fs.readFileSync(SNAPSHOT, 'utf8'))
const bySlug = new Map(snapshot.articles.map((a) => [a.slug, a]))

const andringar = []
for (const [slug, ny] of Object.entries(RATTELSER)) {
  const gammal = bySlug.get(slug)
  if (!gammal) {
    console.error(`Ingen artikel med slug "${slug}" i snapshoten — avbryter.`)
    process.exit(1)
  }
  if (ny.summary && ny.summary.length > 155) {
    console.error(`"${slug}": summary är ${ny.summary.length} tecken (max 155). Avbryter.`)
    process.exit(1)
  }
  andringar.push({ slug, ny, gammal })
}

// Grinden: efter rättelsen får inga två PUBLICERADE artiklar ha samma titel.
// Annars har vi flyttat problemet i stället för att lösa det.
const publicerade = new Set(
  JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'content', 'publish-list.json'), 'utf8'))
    .published
)
const efterTitel = new Map()
for (const a of snapshot.articles) {
  if (!publicerade.has(a.slug)) continue
  const titel = (RATTELSER[a.slug]?.title || a.title).toLowerCase().replace(/\s+/g, ' ').trim()
  ;(efterTitel.get(titel) || efterTitel.set(titel, []).get(titel)).push(a.slug)
}
const kvarDubbletter = [...efterTitel.entries()].filter(([, v]) => v.length > 1)

for (const a of andringar) {
  console.log(`${a.slug}`)
  console.log(`   titel:  ${a.gammal.title}`)
  console.log(`        →  ${a.ny.title}`)
  if (a.ny.summary) console.log(`   summary ändras (${a.ny.summary.length} tecken)`)
}

if (kvarDubbletter.length) {
  console.error('\nEFTER rättelsen skulle dessa titlar fortfarande vara dubbletter:')
  for (const [t, slugs] of kvarDubbletter) console.error(`  "${t}" → ${slugs.join(', ')}`)
  console.error('Avbryter — rättelsen löser inte det den ska.')
  process.exit(1)
}
console.log('\nGrind: noll dubblerade titlar bland de publicerade efter rättelsen.')

if (!skriv) {
  console.log(`\nTorrkörning. ${andringar.length} titlar skulle ändras. Lägg till --skriv.`)
  process.exit(0)
}

fs.writeFileSync(
  BACKUP,
  JSON.stringify(
    {
      _kommentar:
        'Titlar och sammanfattningar FÖRE rättelsen (K14, 2026-08-12). Återställ med `node scripts/apply-title-fixes.cjs --rollback --skriv`.',
      skrivet: new Date().toISOString().slice(0, 10),
      artiklar: andringar.map((a) => ({
        slug: a.slug,
        title: a.gammal.title,
        summary: a.gammal.summary,
      })),
    },
    null,
    2
  ) + '\n',
  'utf8'
)
console.log(`Backup skriven: ${path.relative(REPO_ROOT, BACKUP)}`)

const satser = andringar.map((a) => {
  const satt = [`title = ${citera(a.ny.title)}`, 'updated_at = now()']
  if (a.ny.summary) satt.push(`summary = ${citera(a.ny.summary)}`)
  return `UPDATE articles SET ${satt.join(', ')} WHERE slug = ${citera(a.slug)};`
})
kor(satser.join('\n'))

const slugLista = andringar.map((a) => `'${a.slug}'`).join(',')
console.log('\nUtfall i prod:')
console.log(kor(`SELECT slug, title FROM articles WHERE slug IN (${slugLista}) ORDER BY slug;`))
console.log('Nästa steg: npm run content:refresh && npm run build')
