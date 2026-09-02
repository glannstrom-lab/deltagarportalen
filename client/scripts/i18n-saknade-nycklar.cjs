#!/usr/bin/env node
/**
 * Hittar t('nyckel', ...)-anrop i NÅBAR kod (från main.tsx, via dead-code.cjs)
 * vars nyckel saknas i sv.json ELLER en.json.
 *
 * VARFÖR DEN FINNS: sprakparitet.test.ts jämför sv.json mot en.json — en nyckel
 * som saknas i BÅDA filerna är osynlig för den grinden. Koden renderar då
 * t()-anropets fallback-argument (svenska) på båda språken, tyst.
 *
 * VARFÖR NÅBARHETSFILTER: ett mekaniskt svep över hela src/ betalar för
 * dödkod och kan blockera raderingspasset för den (lärdomen 2026-08-09,
 * CLAUDE.md). Den här scriptet kör därför `node scripts/dead-code.cjs --json`
 * först och hoppar över alla filer i dess onåbara lista.
 *
 * Användning:
 *   node scripts/i18n-saknade-nycklar.cjs [--json] [--dir=src/pages/foo]
 *
 * Utan --json: människoläsbar rapport (fil → [nycklar]).
 * Med --json: maskinläsbart, för återanvändning av andra agenter/skript.
 *
 * BEGRÄNSNING: hittar bara statiska strängliteraler som första argument till
 * t(...). Dynamiska nycklar (t(variabel), t(`prefix.${x}`)) syns inte —
 * de måste läsas i koden för hand.
 */
const fs = require('fs')
const path = require('path')
const { execFileSync } = require('child_process')

const ROOT = path.resolve(__dirname, '..')
const SRC = path.join(ROOT, 'src')

function laddLocale(namn) {
  return JSON.parse(fs.readFileSync(path.join(SRC, 'i18n/locales', namn), 'utf8'))
}

const PLURAL_SUFFIX = ['_zero', '_one', '_two', '_few', '_many', '_other']

function slaUppRatt(trad, nyckel) {
  let nod = trad
  for (const del of nyckel.split('.')) {
    if (typeof nod !== 'object' || nod === null || !(del in nod)) return undefined
    nod = nod[del]
  }
  return nod
}

/**
 * En nyckel "löser ut" antingen som en vanlig sträng/array, ELLER — eftersom
 * anrop med `{ count }` löses av i18next via CLDR-pluralformer utan att
 * grundnyckeln själv behöver finnas — om minst en `<nyckel>_one`/`_other`/...
 * -variant finns. Annars ger t('key', {count}) falska positiva här trots att
 * den fungerar i produktion (upptäckt 2026-09-02: samtliga count-nycklar i
 * `applications.*`/`consultant.overview.myDay.*` m.fl. var redan fullt
 * översatta som pluralpar, bara osynliga för en exakt sökvägsjämförelse).
 */
function loserUt(trad, nyckel) {
  const direkt = slaUppRatt(trad, nyckel)
  if (typeof direkt === 'string' || Array.isArray(direkt)) return true
  return PLURAL_SUFFIX.some((suf) => {
    const v = slaUppRatt(trad, nyckel + suf)
    return typeof v === 'string' || Array.isArray(v)
  })
}

/** Kör dead-code.cjs --json och returnerar Set av onåbara relativa sökvägar (src/...). */
function hamtaOnabaraFiler() {
  const out = execFileSync('node', [path.join(__dirname, 'dead-code.cjs'), '--json'], {
    cwd: ROOT,
    maxBuffer: 1024 * 1024 * 32,
  }).toString('utf8')
  const data = JSON.parse(out)
  return new Set((data.poster || []).map((p) => p.fil))
}

/** Rekursiv filträdsgenomgång under src/, .ts/.tsx, exkl. .test./.spec./.d.ts. */
function allaKallfiler(dir, ut = []) {
  for (const namn of fs.readdirSync(dir)) {
    const full = path.join(dir, namn)
    const stat = fs.statSync(full)
    if (stat.isDirectory()) {
      if (namn === 'node_modules' || namn === '__tests__') continue
      allaKallfiler(full, ut)
    } else if (/\.(tsx?|jsx?)$/.test(namn) && !/\.(test|spec)\.[tj]sx?$/.test(namn) && !namn.endsWith('.d.ts')) {
      ut.push(full)
    }
  }
  return ut
}

/**
 * Stryker JS-kommentarer (block- och radkommentarer) grovt, så att t('...')
 * som bara nämns i en kommentar (dokumentation av en gammal bugg t.ex.)
 * inte räknas som ett levande anrop. Ersätter med mellanslag för att
 * bevara radnummer/positioner. Går inte in i strängar (naiv men i praktiken
 * tillräcklig för den här kodbasen — kod med '//' eller '/*' inuti en
 * strängliteral är sällsynt och skulle ändå bara ge en falsk NEGATIV, inte
 * en falsk positiv nyckel).
 */
function strykKommentarer(kod) {
  let ut = ''
  let i = 0
  const n = kod.length
  let inStr = null // "'" | '"' | '`' | null
  while (i < n) {
    const c = kod[i]
    if (inStr) {
      ut += c
      if (c === '\\') { ut += kod[i + 1] ?? ''; i += 2; continue }
      if (c === inStr) inStr = null
      i++
      continue
    }
    if (c === '"' || c === "'" || c === '`') { inStr = c; ut += c; i++; continue }
    if (c === '/' && kod[i + 1] === '/') {
      while (i < n && kod[i] !== '\n') { ut += ' '; i++ }
      continue
    }
    if (c === '/' && kod[i + 1] === '*') {
      ut += '  '
      i += 2
      while (i < n && !(kod[i] === '*' && kod[i + 1] === '/')) { ut += kod[i] === '\n' ? '\n' : ' '; i++ }
      ut += '  '
      i += 2
      continue
    }
    ut += c
    i++
  }
  return ut
}

/**
 * Extraherar statiska t('a.b.c', 'fallback')-anrop ur en fils källkod.
 * Returnerar Map<nyckel, fallbackTextEllerNull>. Fångar bara fallback när
 * andra argumentet är en enkel strängliteral direkt efter kommat (täcker
 * `t('key', 'text')`); `t('key', { defaultValue: '...' })`,
 * `t('key', { count })` m.fl. ger fallback=null (måste läsas för hand).
 */
function nycklarIKod(kod) {
  const funna = new Map()
  const re = /\bt\(\s*(['"`])([a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_]+)+)\1(?:\s*,\s*(['"`])((?:\\.|(?!\3).)*)\3)?/g
  let m
  while ((m = re.exec(kod))) {
    const nyckel = m[2]
    const fallback = m[4] !== undefined ? m[4].replace(/\\(.)/g, '$1') : null
    if (!funna.has(nyckel) || fallback) funna.set(nyckel, fallback)
  }
  return funna
}

/**
 * Kärnfunktionen: hittar saknade nycklar under `scanRoot` (default: hela src/).
 * Exporterad så `nycklar-finns.test.ts` kan anropa den direkt utan att gå
 * via CLI/stdout-parsning.
 */
function finnSaknade(scanRoot = SRC) {
  const onabara = hamtaOnabaraFiler()
  const sv = laddLocale('sv.json')
  const en = laddLocale('en.json')

  const filer = allaKallfiler(scanRoot)
  const resultat = [] // { fil, nycklar: [...] }
  let totaltSaknade = 0

  for (const abs of filer) {
    const rel = 'src/' + path.relative(SRC, abs).replace(/\\/g, '/')
    if (onabara.has(rel)) continue
    const kodRa = fs.readFileSync(abs, 'utf8')
    const kod = strykKommentarer(kodRa)
    const nycklarMap = nycklarIKod(kod)
    const saknade = [...nycklarMap.keys()].filter((n) => !loserUt(sv, n) || !loserUt(en, n)).sort()
    if (saknade.length > 0) {
      resultat.push({
        fil: rel,
        nycklar: saknade.map((n) => ({ nyckel: n, fallback: nycklarMap.get(n) })),
      })
      totaltSaknade += saknade.length
    }
  }

  resultat.sort((a, b) => b.nycklar.length - a.nycklar.length)
  return { filerMedSaknade: resultat.length, totaltSaknade, resultat }
}

function main() {
  const args = process.argv.slice(2)
  const jsonOut = args.includes('--json')
  const dirArg = args.find((a) => a.startsWith('--dir='))
  const scanRoot = dirArg ? path.join(ROOT, dirArg.slice('--dir='.length)) : SRC

  const { filerMedSaknade, totaltSaknade, resultat } = finnSaknade(scanRoot)

  if (jsonOut) {
    console.log(JSON.stringify({ filerMedSaknade, totaltSaknade, resultat }, null, 2))
  } else {
    console.log(`${totaltSaknade} saknade nycklar i ${filerMedSaknade} nåbara filer\n`)
    for (const r of resultat) {
      console.log(`${r.fil} (${r.nycklar.length})`)
      for (const n of r.nycklar) console.log(`  ${n.nyckel}${n.fallback !== null ? ' = ' + JSON.stringify(n.fallback) : '  [INGEN FALLBACK]'}`)
    }
  }
}

module.exports = { finnSaknade, loserUt, nycklarIKod, strykKommentarer, hamtaOnabaraFiler }

if (require.main === module) main()
