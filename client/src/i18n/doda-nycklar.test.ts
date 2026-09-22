/**
 * Vakt över DÖDA i18n-nycklar — det omvända av `nycklar-finns.test.ts`.
 *
 * VARFÖR DEN FINNS. Svepet 2026-09-22 hittade 2 603 nycklar (27 % av filen)
 * i `sv.json`/`en.json` som ingen levande kod längre läser — kvarlevor från
 * upprepade omdesigner (`dashboard.*` efter att `components/dashboard/`
 * arkiverades, hela namnrymden `coverLetterGenerator.*` efter att sidan bytte
 * namn, `layout.bottomBar.*` efter att `BottomBar.tsx` togs bort, m.fl.).
 * Ingenting vaktade det — `sprakparitet.test.ts` jämför bara sv mot en och
 * ser inte källkoden alls, och ett mekaniskt "finns nyckeln i värdet 0
 * filer"-svep hade fällt på alla legitimt DYNAMISKA nycklar (mallar med
 * `${variabel}`, `*Key`/`*Nyckel`-indirektion, `returnObjects`-subträd,
 * CLDR-pluralformer) och därmed varit obrukbart.
 *
 * DETEKTORN (samma metod som svepet, sammanfattad):
 *   1. Statiska anrop: `t('a.b.c', …)`, `i18n.t('a.b.c')`, `i18nKey="a.b.c"`.
 *   2. Mall-interpolation: `t(\`a.b.${x}\`)` → matchas mot en regex där varje
 *      `${...}` är ETT sökvägssegment (`[^.]+`), och `t('a.b.' + x)` → resten
 *      är ETT ELLER FLER segment (`.+`).
 *   3. Tvåstegsindirektion: `const bas = \`a.b.${x}\`` följt av
 *      `t(\`${bas}.title\`)` i SAMMA fil — `${bas}` expanderas textuellt
 *      innan mallen blir en regex (sett i NastaSteg.tsx, LinkedInOptimizer.tsx,
 *      IntegrationTab.tsx).
 *   4. `*Key`/`*Keys`-konventionen OCH dess svenska syskon `*Nyckel`/`*Nycklar`
 *      SAMT den bara `nyckel`/`nycklar` (t.ex. `{ titleKey: 'cv.createCV' }`
 *      … `t(item.titleKey)`, eller `{ nyckel: 'focus.intl.optionX' }`) —
 *      literalen antas använd även om vi inte spårar var `t(x.titleKey)`
 *      faktiskt anropas.
 *   5. `returnObjects: true` gör hela undernodens delträd levande — även när
 *      noden själv är dynamisk (`t(\`salary.negotiation.steps.${x}\`,
 *      {returnObjects:true})` gör ALLA `steps.<x>.*` levande, inte bara den
 *      matchade noden).
 *   6. CLDR-pluralformer: `key_one`/`key_other`/… räknas levande om
 *      GRUNDNYCKELN `key` används med `{ count }` (samma logik som
 *      `scripts/i18n-saknade-nycklar.cjs`).
 *   7. Ett generiskt säkerhetsnät: VARJE strängliteral i nåbar kod som exakt
 *      matchar en riktig nyckel i sv.json räknas som använd, oavsett var i
 *      koden den står — fångar indirektionskonventioner vi inte förutsett
 *      (t.ex. `motivation: 'minVecka.typ.motivation'`, `0: 'profile.messages
 *      .completion.welcome'`) utan att räkna upp varje egennamnskonvention
 *      för hand. Kollisionsrisken är försumbar: nycklarna är fleraordiga
 *      camelCase-sökvägar specifika för den här domänen.
 *
 * NÅBARHETSFILTER MED FLIT (samma skäl som `nycklar-finns.test.ts`): filer
 * som `dead-code.cjs --json` klassar som onåbara räknas inte som
 * "användning" — annars döljs döda nycklar bakom dödkod som ändå ska bort,
 * och raderingspasset blockeras i onödan (lärdomen 2026-08-09 i CLAUDE.md).
 *
 * FRYST TAK, precis som `lint:ci`/`typecheck:ceiling`/`lint:design`: talet
 * kan bara sjunka. Höj det ALDRIG för att bli grön — om testet fäller på en
 * nyckel som visar sig vara levande (detektorn missade ett mönster), fixa
 * detektorn eller skriv en motiverad rad i undantagslistan, sänk aldrig
 * garden genom att bara höja siffran.
 *
 * MÄTT 2026-09-22, direkt efter städningen: 0 döda nycklar kvar av 7 067
 * (efter att 2 603 togs bort ur BÅDA filerna). Taket sätts därför till 0.
 *
 * Mutationstestat manuellt vid skrivandet: en påhittad nyckel
 * `__test__.doesNotExist` tillagd i sv.json fick testet att falla
 * (1 > 0, med nyckeln listad), borttagen igen fick det att gå grönt.
 */
import { describe, it, expect } from 'vitest'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(__dirname, '../..') // client/
const SRC = path.resolve(__dirname, '..') // client/src/

type Tradning = { [k: string]: string | string[] | Tradning }

const PLURAL_SUFFIX = ['_zero', '_one', '_two', '_few', '_many', '_other']

/** Fryst tak. Kan bara sänkas. Se docstring ovan. */
const FRUSET_TAK = 0

/**
 * Nycklar som medvetet får vänta, med skäl. Formatet är exakt sökvägen som
 * `deadKeys` (nedan) rapporterar den. Tom med flit — se `nycklar-finns.test.ts`
 * för samma mönster.
 */
const TILLATNA_UNDANTAG: string[] = []

function laddLocale(namn: string): Tradning {
  return JSON.parse(fs.readFileSync(path.join(SRC, 'i18n/locales', namn), 'utf8')) as Tradning
}

function platta(o: Tradning, prefix = '', ut: Array<{ key: string; type: string }> = []) {
  for (const k of Object.keys(o)) {
    const v = o[k]
    const key = prefix ? `${prefix}.${k}` : k
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      ut.push({ key, type: 'object' })
      platta(v as Tradning, key, ut)
    } else if (Array.isArray(v)) {
      ut.push({ key, type: 'array' })
    } else {
      ut.push({ key, type: typeof v })
    }
  }
  return ut
}

/**
 * VIKTIG SKILLNAD mot `i18n-saknade-nycklar.cjs`s `hamtaOnabaraFiler()`: den
 * utesluter ALLA onåbara filer (RADERA+ARKIVERA+UTRED+BEHÅLL) — rätt för att
 * hitta SAKNADE nycklar, där en bred uteslutning bara är extra försiktig.
 * Här är riktningen den motsatta: att utesluta en fil gör dess nycklar DÖDA
 * kandidater, dvs redo att raderas. UTRED-filer är uttryckligen INTE
 * dödförklarade (t.ex. `EnergyTab.tsx`: "färdigbyggd men omonterad,
 * produktbeslut väntar") — bara RADERA/ARKIVERA är bekräftat döda och får
 * släcka sina nycklar. Se uppdraget: "listan: grupperna RADERA och ARKIVERA".
 */
function hamtaOnabaraFiler(): Set<string> {
  const out = execFileSync('node', [path.join(ROOT, 'scripts/dead-code.cjs'), '--json'], {
    cwd: ROOT,
    maxBuffer: 1024 * 1024 * 32,
  }).toString('utf8')
  const data = JSON.parse(out) as { poster?: Array<{ fil: string; grupp: string }> }
  return new Set(
    (data.poster || []).filter((p) => p.grupp === 'RADERA' || p.grupp === 'ARKIVERA').map((p) => p.fil)
  )
}

function allaKallfiler(dir: string, ut: string[] = []): string[] {
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

/** Stryker JS-kommentarer grovt utan att gå in i strängar (samma grepp som `i18n-saknade-nycklar.cjs`). */
function strykKommentarer(kod: string): string {
  let ut = ''
  let i = 0
  const n = kod.length
  let inStr: string | null = null
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

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** `a.b.${x}.title` → RegExp där varje `${...}` = ett segment; `${__CONCAT__}` = resten. */
function templateToRegex(raw: string): RegExp {
  const CONCAT_MARK = '${__CONCAT__}'
  let pattern = ''
  let rest = raw
  while (rest.length > 0) {
    const concatIdx = rest.indexOf(CONCAT_MARK)
    const interpIdx = rest.search(/\$\{[^}]*\}/)
    if (concatIdx !== -1 && (interpIdx === -1 || concatIdx <= interpIdx)) {
      pattern += escapeRegex(rest.slice(0, concatIdx))
      pattern += '.+'
      rest = rest.slice(concatIdx + CONCAT_MARK.length)
      continue
    }
    if (interpIdx === -1) {
      pattern += escapeRegex(rest)
      rest = ''
      break
    }
    pattern += escapeRegex(rest.slice(0, interpIdx))
    pattern += '[^.]+'
    const endIdx = rest.indexOf('}', interpIdx) + 1
    rest = rest.slice(endIdx)
  }
  return new RegExp('^' + pattern + '$')
}

interface Usage {
  exact: Set<string>
  templates: string[]
  returnObjectsKeys: Set<string>
  returnObjectsTemplates: string[]
  allLiterals: Set<string>
}

function extractUsage(kod: string): Usage {
  const exact = new Set<string>()
  const templates: string[] = []
  const returnObjectsKeys = new Set<string>()
  const returnObjectsTemplates: string[] = []

  // Tvåstegsindirektion: `const bas = \`prefix.${x}\`` i samma fil.
  const basVarRe = /\bconst\s+(\w+)\s*=\s*`((?:\\.|[^\\`])*)`/g
  const basVars = new Map<string, string>()
  let bm: RegExpExecArray | null
  while ((bm = basVarRe.exec(kod))) {
    if (bm[2].includes('${')) basVars.set(bm[1], bm[2])
  }
  function expandBasVars(raw: string): string {
    let out = raw
    for (const [name, body] of basVars) out = out.split('${' + name + '}').join(body)
    return out
  }

  let m: RegExpExecArray | null

  const tCallRe = /\bt\(\s*(['"`])((?:\\.|(?!\1)[^\\])*)\1/g
  while ((m = tCallRe.exec(kod))) {
    const raw = expandBasVars(m[2])
    if (raw.includes('${')) templates.push(raw)
    else exact.add(raw)
  }

  const i18nTCallRe = /\bi18n\.t\(\s*(['"`])((?:\\.|(?!\1)[^\\])*)\1/g
  while ((m = i18nTCallRe.exec(kod))) {
    const raw = expandBasVars(m[2])
    if (raw.includes('${')) templates.push(raw)
    else exact.add(raw)
  }

  const i18nKeyRe = /\bi18nKey\s*=\s*\{?\s*(['"`])((?:\\.|(?!\1)[^\\])*)\1/g
  while ((m = i18nKeyRe.exec(kod))) {
    const raw = expandBasVars(m[2])
    if (raw.includes('${')) templates.push(raw)
    else exact.add(raw)
  }

  const concatRe = /\bt\(\s*(['"`])((?:\\.|(?!\1)[^\\])*)\1\s*\+/g
  while ((m = concatRe.exec(kod))) {
    templates.push(m[2] + '${__CONCAT__}')
  }

  // `*Key`/`*Keys`/`*Nyckel`/`*Nycklar` (även bara "key"/"nyckel").
  const keyPropRe = /\b\w*(?:[Kk]eys?|[Nn]yck(?:el|lar))\s*:\s*(['"`])((?:\\.|(?!\1)[^\\])*)\1/g
  while ((m = keyPropRe.exec(kod))) {
    const raw = m[2]
    if (raw.includes('.')) {
      if (raw.includes('${')) templates.push(raw)
      else exact.add(raw)
    }
  }

  const returnObjRe = /\bt\(\s*(['"`])((?:\\.|(?!\1)[^\\])*)\1\s*,\s*\{[^}]*returnObjects\s*:\s*true/g
  while ((m = returnObjRe.exec(kod))) {
    const raw = expandBasVars(m[2])
    if (!raw.includes('${')) returnObjectsKeys.add(raw)
    else returnObjectsTemplates.push(raw)
  }

  // Generiskt säkerhetsnät: alla strängliteraler med minst en punkt, matchas
  // senare mot den RIKTIGA nyckelmängden av anroparen.
  const allLiterals = new Set<string>()
  const anyLiteralRe = /(['"`])((?:\\.|(?!\1)[^\\])*)\1/g
  while ((m = anyLiteralRe.exec(kod))) {
    const raw = m[2]
    if (raw.includes('.') && !raw.includes('${') && /^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z0-9_]+)+$/.test(raw)) {
      allLiterals.add(raw)
    }
    // Samma säkerhetsnät för MALLSTRÄNGAR utanför t(): en funktion som
    // returnerar nyckeln (`spaltformNyckel()` i data/cvMallar.ts ger
    // `cvBuilder.templates.spaltform.${spaltform}` som CVBuilder.tsx sedan
    // skickar till t()). Städningen 2026-09-22 tog de tre nycklarna på
    // just det viset; varje mallsträng vars statiska prefix är en nyckelväg
    // med minst en punkt räknas därför som ett levande mönster.
    //
    // Samma sak med bas-variabeln expanderad: `t(v.idag ? \`${bas}.bodyToday\`
    // : \`${bas}.bodyTomorrow\`)` (NastaSteg.tsx) börjar inte med en quote
    // direkt efter `t(`, så tCallRe missade den och Översiktens "nästa
    // steg"-texter togs bort som döda. Expanderat blir det
    // `hubOverview.nasta.${steg.id}.bodyToday`, som har ett nyckelprefix.
    else if (m[1] === '`' && raw.includes('${')) {
      const exp = expandBasVars(raw)
      const prefix = exp.slice(0, exp.indexOf('${'))
      if (/^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z0-9_]+)+\.$/.test(prefix)) templates.push(exp)
    }
  }

  return { exact, templates, returnObjectsKeys, returnObjectsTemplates, allLiterals }
}

function finnDodaNycklar() {
  const sv = laddLocale('sv.json')
  const svFlat = platta(sv)
  const svByKey = new Map(svFlat.map((e) => [e.key, e]))
  const svLeafKeys = svFlat.filter((e) => e.type === 'string' || e.type === 'array').map((e) => e.key)

  const onabara = hamtaOnabaraFiler()
  const srcFiles = allaKallfiler(SRC).filter((abs) => {
    const rel = 'src/' + path.relative(SRC, abs).replace(/\\/g, '/')
    return !onabara.has(rel) && !rel.includes('/__tests__/')
  })
  const apiDir = path.join(ROOT, 'api')
  const apiFiles = fs.existsSync(apiDir) ? allaKallfiler(apiDir) : []
  const allFiles = [...srcFiles, ...apiFiles]

  const usedExact = new Set<string>()
  const templates = new Set<string>()
  const returnObjectsKeys = new Set<string>()
  const returnObjectsTemplates = new Set<string>()
  const allLiteralsGlobal = new Set<string>()

  for (const abs of allFiles) {
    const kod = strykKommentarer(fs.readFileSync(abs, 'utf8'))
    const u = extractUsage(kod)
    for (const e of u.exact) usedExact.add(e)
    for (const t of u.templates) templates.add(t)
    for (const r of u.returnObjectsKeys) returnObjectsKeys.add(r)
    for (const rt of u.returnObjectsTemplates) returnObjectsTemplates.add(rt)
    for (const l of u.allLiterals) allLiteralsGlobal.add(l)
  }

  for (const lit of allLiteralsGlobal) {
    if (svByKey.has(lit)) usedExact.add(lit)
  }

  const templateRegexes = [...templates].map((raw) => ({ raw, re: templateToRegex(raw) }))
  const returnObjTemplateRegexes = [...returnObjectsTemplates].map((raw) => ({ raw, re: templateToRegex(raw) }))

  const subtreeAliveRoots: string[] = []
  for (const k of new Set([...usedExact, ...returnObjectsKeys])) {
    const entry = svByKey.get(k)
    if (entry && entry.type === 'object') subtreeAliveRoots.push(k)
  }
  if (returnObjTemplateRegexes.length > 0) {
    for (const entry of svFlat) {
      if (entry.type !== 'object') continue
      for (const { re } of returnObjTemplateRegexes) {
        if (re.test(entry.key)) { subtreeAliveRoots.push(entry.key); break }
      }
    }
  }

  function isAlive(key: string): boolean {
    if (usedExact.has(key)) return true
    if (returnObjectsKeys.has(key)) return true
    for (const suf of PLURAL_SUFFIX) {
      if (key.endsWith(suf) && usedExact.has(key.slice(0, -suf.length))) return true
    }
    for (const root of subtreeAliveRoots) {
      if (key === root || key.startsWith(root + '.')) return true
    }
    for (const { re } of templateRegexes) {
      if (re.test(key)) return true
      // Pluralformer under ett mallmönster: `t(\`${bas}.body\`, { count })`
      // slår upp `hubOverview.nasta.followUp.body_one`/`body_other`.
      for (const suf of PLURAL_SUFFIX) {
        if (key.endsWith(suf) && re.test(key.slice(0, -suf.length))) return true
      }
    }
    return false
  }

  const dead = svLeafKeys.filter((k) => !isAlive(k))
  return { dead, totalKeys: svLeafKeys.length, filesScanned: allFiles.length, templatesFound: templates.size }
}

describe('döda i18n-nycklar — nycklar i sv.json som ingen nåbar kod längre läser', () => {
  const { dead, totalKeys, filesScanned, templatesFound } = finnDodaNycklar()

  it('detektorn producerar ett rimligt, icke-kraschande resultat (positiv kontroll)', () => {
    // Utan den kan hela grinden bli grön av att detektorn slutat hitta något
    // alls, t.ex. efter en refaktorering av t()-anropsmönstret.
    expect(totalKeys).toBeGreaterThan(1000)
    expect(filesScanned).toBeGreaterThan(100)
    expect(templatesFound).toBeGreaterThan(50)
  })

  it(`inga döda nycklar utöver det frusna taket (${FRUSET_TAK})`, () => {
    const otillatna = dead.filter((k) => !TILLATNA_UNDANTAG.includes(k))
    expect(
      otillatna.length,
      `${otillatna.length} död(a) nyckel/nycklar över taket ${FRUSET_TAK} (av ${dead.length} döda totalt):\n` +
        otillatna.slice(0, 40).join('\n')
    ).toBeLessThanOrEqual(FRUSET_TAK)
  })

  it('undantagslistan innehåller inga döda undantag (nycklar som redan är åtgärdade)', () => {
    const kvarstaende = new Set(dead)
    const dodaUndantag = TILLATNA_UNDANTAG.filter((u) => !kvarstaende.has(u))
    expect(dodaUndantag, `Döda undantag (ta bort ur listan): ${dodaUndantag.join(', ')}`).toEqual([])
  })
})
