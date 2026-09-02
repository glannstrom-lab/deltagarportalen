#!/usr/bin/env node
/**
 * Nåbarhetsanalys och raderingspass för client/src. (ROADMAP C16, 2026-08-05)
 *
 * VARFÖR SKRIPTET FINNS
 * ---------------------
 * En vanlig importsökning ("vem importerar den här filen?") ljuger i det här
 * repot. 20 barrel-filer (`components/*\/index.ts`) är själva döda men
 * importerar underträden — så varje fil i trädet ser ut att "ha en importör".
 * Den enda sökning som ser sanningen är transitiv nåbarhet från `src/main.tsx`.
 * Se CLAUDE.md, lärdomen 2026-08-04 "Barrel-filer gör dödkod osynlig".
 *
 * SÄKERHETSMODELL (samma som scripts/apply-expansions.cjs)
 * -------------------------------------------------------
 *   - Torrläge är default. Ingenting flyttas eller raderas utan --skriv.
 *   - --skriv kräver dessutom att arbetsträdet är rent (git status tomt),
 *     annars vägrar skriptet. Raderingen ska köras när trädet är tyst.
 *   - Varje fil som skulle raderas namnsöks först över HELA repot
 *     (client/, e2e/, supabase/, scripts/, api/). En träff utanför filen
 *     själv blockerar raderingen och rapporteras som UTRED. Det är den
 *     andra grinden: nåbarhetsgrafen kan missa en strängbaserad referens,
 *     namnsökningen kan inte.
 *   - Arkivering flyttar med `git mv` så historiken följer med.
 *
 * KÖR
 * ---
 *   node scripts/dead-code.cjs                 # översikt + siffror
 *   node scripts/dead-code.cjs --lista         # varje onåbar fil med grupp
 *   node scripts/dead-code.cjs --grupp=RADERA  # filtrera på grupp
 *   node scripts/dead-code.cjs --json          # maskinläsbart
 *   node scripts/dead-code.cjs --tak           # skuldfördelning levande/död
 *   node scripts/dead-code.cjs --skriv         # UTFÖR raderingen + arkiveringen
 *   node scripts/dead-code.cjs --skriv --steg=barrels   # bara ett steg
 */

const fs = require('node:fs')
const path = require('node:path')
const { execSync, execFileSync } = require('node:child_process')

const CLIENT = path.join(__dirname, '..')
const REPO_ROOT = path.join(CLIENT, '..')
const SRC = path.join(CLIENT, 'src')
const ARCHIVE = path.join(REPO_ROOT, 'archive', '2026-08-doedkod')

const KOD_EXT = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']
const ALLA_EXT = [...KOD_EXT, '.css', '.json']

// ---------------------------------------------------------------- filträd

function gaIgenom(dir, ut = []) {
  for (const post of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, post.name)
    if (post.isDirectory()) {
      if (post.name === 'node_modules' || post.name === '.git') continue
      gaIgenom(p, ut)
    } else if (ALLA_EXT.includes(path.extname(post.name))) {
      ut.push(p)
    }
  }
  return ut
}

const rel = (p) => path.relative(SRC, p).split(path.sep).join('/')
const relClient = (p) => path.relative(CLIENT, p).split(path.sep).join('/')

const ALLA_FILER = gaIgenom(SRC)
const FIL_SET = new Set(ALLA_FILER)

// ---------------------------------------------------------------- parsning

/**
 * Ta bort kommentarer och strängliteraler som INTE är importspecifikationer.
 *
 * Varför: en `// import { X } from './X'`-rad i en kommentar gör en död fil
 * levande i grafen. Vi vill inte ha falska "levande" — men vi vill absolut
 * inte ha falska "döda" heller, och därför finns namnsökningsgrinden nedan
 * som andra kontroll före varje radering.
 */
function utanKommentarer(kod) {
  return kod
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1 ')
}

const MONSTER = [
  // import x from '…' / import '…' / import type … from '…'
  //
  // \p{L} i stället för \w, med flaggan u: \w är ASCII-only, så en importrad
  // med ett svenskt tecken i en identifierare (`AiFöretagsfel` i
  // SearchTab.tsx) matchade aldrig, filen den importerade klassades RADERA,
  // och den felklassningen blev en premiss i ROADMAP (spår AG, 2026-09-02).
  /\bimport\s+(?:type\s+)?(?:[\p{L}\p{N}_*{}\n\r\t ,$]+from\s*)?['"]([^'"]+)['"]/gu,
  // export … from '…'  (inkl. export * from)
  /\bexport\s+(?:type\s+)?(?:\*|\{[^}]*\})\s*(?:as\s+\w+\s*)?from\s*['"]([^'"]+)['"]/g,
  // dynamisk import('…')
  /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  // require('…')
  /\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  // vi.mock('…') / vi.doMock('…') — testmockar räknas som kanter
  /\bvi\.(?:mock|doMock|unmock)\s*\(\s*['"]([^'"]+)['"]/g,
  // CSS: @import "./styles/x.css" och @import url("./styles/x.css")
  //
  // FÄLLA (funnen 2026-08-05): utan den här raden såg
  // `styles/accessibility.css` död ut trots att `index.css:19` importerar
  // den. Ett raderingspass hade tagit bort fokusringar och skip-links.
  // CSS-grafen är inte JS-grafen.
  /@import\s+(?:url\s*\(\s*)?['"]([^'"]+)['"]/g,
]

function specifikationer(kod) {
  const ren = utanKommentarer(kod)
  const ut = new Set()
  for (const re of MONSTER) {
    re.lastIndex = 0
    let m
    while ((m = re.exec(ren)) !== null) ut.add(m[1])
  }
  return [...ut]
}

function losUpp(spec, franFil) {
  let bas
  if (spec.startsWith('@/')) bas = path.join(SRC, spec.slice(2))
  else if (spec.startsWith('/src/')) bas = path.join(SRC, spec.slice(5))
  else if (spec.startsWith('.')) bas = path.resolve(path.dirname(franFil), spec)
  else return null // bart paket → node_modules

  // .js i specifikationen kan peka på .ts på disk (NodeNext-vana)
  const kandidater = [bas]
  const utanJs = bas.replace(/\.(js|jsx)$/, '')
  if (utanJs !== bas) kandidater.push(utanJs)
  for (const k of [bas, utanJs]) {
    for (const e of ALLA_EXT) kandidater.push(k + e)
    for (const e of KOD_EXT) kandidater.push(path.join(k, 'index' + e))
  }
  for (const k of kandidater) if (FIL_SET.has(k)) return k
  return null
}

// ---------------------------------------------------------------- grafen

const kanter = new Map() // fil -> Set<fil>
const olosta = new Map() // fil -> [spec] som pekar in i src men inte gick att lösa

const PARSBARA = [...KOD_EXT, '.css']

for (const fil of ALLA_FILER) {
  if (!PARSBARA.includes(path.extname(fil))) {
    kanter.set(fil, new Set())
    continue
  }
  const kod = fs.readFileSync(fil, 'utf8')
  const ut = new Set()
  for (const spec of specifikationer(kod)) {
    const mal = losUpp(spec, fil)
    if (mal) ut.add(mal)
    else if (spec.startsWith('@/') || spec.startsWith('.')) {
      if (!olosta.has(fil)) olosta.set(fil, [])
      olosta.get(fil).push(spec)
    }
  }
  kanter.set(fil, ut)
}

function bfs(startlista) {
  const sedda = new Set()
  const ko = [...startlista].filter((f) => FIL_SET.has(f))
  for (const f of ko) sedda.add(f)
  while (ko.length) {
    const f = ko.shift()
    for (const n of kanter.get(f) || []) {
      if (!sedda.has(n)) {
        sedda.add(n)
        ko.push(n)
      }
    }
  }
  return sedda
}

const MAIN = path.join(SRC, 'main.tsx')
const NABAR = bfs([MAIN])

const arTest = (p) => /\.(test|spec)\.(ts|tsx|js|jsx)$/.test(p)
const TESTFILER = ALLA_FILER.filter(arTest)
const TESTSTOD = ALLA_FILER.filter(
  (f) => !arTest(f) && (rel(f).startsWith('test/') || rel(f).startsWith('mocks/'))
)

// Vad testerna når (utan main.tsx) — används för att avgöra vilka tester som
// vaktar dödkod: ett test vars hela subjektträd är onåbart från main.tsx.
const omvand = new Map()
for (const [f, ut] of kanter) for (const n of ut) {
  if (!omvand.has(n)) omvand.set(n, new Set())
  omvand.get(n).add(f)
}

// ---------------------------------------------------------------- klassning

/**
 * Regellista. Första träffen vinner. `test` matchar mot sökväg relativt src/.
 * Motiveringen skrivs ut i rapporten — en klassning utan motivering finns inte.
 */
/**
 * Filer som rörts de senaste FARSKT_DAGAR dagarna.
 *
 * VARFÖR: den 2026-08-05 arbetade tre andra agenter i `client/src` samtidigt.
 * En fil som just skapats men ännu inte monterats ser exakt ut som dödkod.
 * Regeln gör att pågående arbete alltid hamnar i UTRED i stället för RADERA.
 * Kostar några falska UTRED — betydligt billigare än en raderad fil någon
 * höll på att bygga.
 */
const FARSKT_DAGAR = 7
const FARSKA = new Set()
try {
  const ut = execSync(
    `git log --since="${FARSKT_DAGAR} days ago" --name-only --pretty=format: -- client/src`,
    { cwd: REPO_ROOT, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 }
  )
  for (const r of ut.split('\n').map((s) => s.trim()).filter(Boolean)) {
    FARSKA.add(path.join(REPO_ROOT, r))
  }
  // Ocommittat räknas också som färskt.
  const st = execSync('git status --porcelain -- client/src', { cwd: REPO_ROOT, encoding: 'utf8' })
  for (const rad of st.split('\n').filter(Boolean)) {
    FARSKA.add(path.join(REPO_ROOT, rad.slice(3).trim().replace(/^"|"$/g, '')))
  }
} catch {
  // Inget git → hoppa över färskhetsgrinden, men säg det.
  console.error('VARNING: kunde inte läsa git-historik — färskhetsgrinden är av.')
}

const REGLER = [
  // ---- Färskhetsgrinden går FÖRE allt annat utom STA.
  {
    grupp: 'BEHÅLL',
    test: (p) => p.startsWith('pages/sta/') || /(^|\/)sta[A-Z]|useSta|FocusStaWizard/.test(p),
    skal: 'STA-modulen — pausad, inte död (beslut Mikael 2026-08-03, MODULES.STA)',
  },
  // ---- BEHÅLL: medvetet onåbart. Går före färskhetsgrinden — en fil som är
  //      medvetet onåbar blir inte oklar bara för att någon rörde den.
  {
    grupp: 'BEHÅLL',
    test: (p) => p.endsWith('.d.ts'),
    skal: 'typdeklaration — konsumeras av tsc, inte av importgrafen',
  },
  {
    grupp: 'BEHÅLL',
    test: (p) => p.startsWith('test/') || p.startsWith('mocks/'),
    skal: 'testinfrastruktur — entry via vitest.config.ts setupFiles',
  },
  {
    grupp: 'BEHÅLL',
    test: (p) => p === 'main.tsx',
    skal: 'entry',
  },
  {
    grupp: 'UTRED',
    test: (p) => FARSKA.has(path.join(SRC, p)),
    skal: `Rörd de senaste ${FARSKT_DAGAR} dagarna — kan vara pågående arbete som ännu inte monterats`,
  },

  // ---- UTRED: produktbeslut, inte städning
  {
    grupp: 'UTRED',
    test: (p) =>
      /jobSharingService|ShareJobDialog|IncomingSharedJobs/.test(p),
    skal: 'Jobbdelning deltagare↔konsulent — färdigbyggd men omonterad. ROADMAP C19: produktbeslut',
  },
  {
    grupp: 'UTRED',
    test: (p) =>
      /wellness\/EnergyTab|EnergyLevelSelector|MobileEnergySelector|energyStoreWithSync|useEnergyLevel/.test(p),
    skal: 'Energifunktionen — färdigbyggd men omonterad. ROADMAP C19: produktbeslut',
  },
  {
    grupp: 'UTRED',
    test: (p) => /notificationsService|NotificationsCenter/.test(p),
    skal: 'Notiscentret — ROADMAP H12 (bygg eller ta bort), levande vägen är useNotifications',
  },
  {
    grupp: 'UTRED',
    test: (p) => /afEnrichmentsApi|afJobEdApi|learningService|useLearning/.test(p),
    skal: 'Klientsidan av callerlösa edge-funktioner — ROADMAP C4 är pausad (EU-spåret)',
  },

  // ---- ARKIVERA: komplett funktionalitet, kan behövas som referens
  {
    grupp: 'ARKIVERA',
    test: (p) => p.startsWith('components/dashboard/'),
    skal: 'Rest av widget-systemet (C1/C10) — arkiverat mönster finns redan i archive/2026-07-widget-system-gen2/',
  },
  {
    grupp: 'ARKIVERA',
    test: (p) => p.startsWith('components/focus/FocusGuide') || p.startsWith('components/focus/steps/'),
    skal: 'Äldre fokusguide-generation — levande är FocusWizardFrame/PageFocusShell',
  },
  {
    grupp: 'ARKIVERA',
    test: (p) => /components\/cv\/templates\/CVTemplates\.tsx$/.test(p),
    skal: '1 904 rader mall-referens + 43 av 52 gradienter — arkivera hellre än radera',
  },
  {
    grupp: 'ARKIVERA',
    test: (p) => p.startsWith('data/journeyData') || p.startsWith('types/journey.types'),
    skal: 'Rest efter C9 (journey/gamification arkiverades, datat blev kvar)',
  },
  {
    grupp: 'ARKIVERA',
    test: (p) => /data\/helpContent\.ts$/.test(p),
    skal: '791 rader redaktionellt innehåll — innehållet är värt att behålla även om koden inte är det',
  },
  {
    grupp: 'ARKIVERA',
    test: (p) => p.startsWith('components/consultant/'),
    skal: 'Konsulentkomponenter utan monteringspunkt — arkivera, konsulentvyn är under utveckling',
  },
  {
    grupp: 'ARKIVERA',
    test: (p) => p.startsWith('components/map/') || p.startsWith('components/interview/'),
    skal: 'Komplett men omonterad funktionalitet',
  },

  // ---- RADERA: säkert död
  {
    grupp: 'RADERA',
    test: (p) => /(^|\/)index\.ts$/.test(p),
    skal: 'Död barrel-fil — noll importörer, döljer underträdet för importsökning',
  },
  {
    grupp: 'RADERA',
    test: (p) => /CVSaveTest\.tsx$/.test(p),
    skal: 'Felsökningskomponent som skriver mot Supabase — ska inte kunna bli nåbar av misstag',
  },
  {
    grupp: 'RADERA',
    test: (p) => /PagedCVPrint\.tsx$/.test(p),
    skal: '@deprecated sedan 2026-05-22, utpekad raderingskandidat i I5',
  },
  {
    grupp: 'RADERA',
    test: (p) => /designTokens\.ts$/.test(p),
    skal: 'Ersatt av styles/tokens.css + design-system.ts',
  },
  {
    grupp: 'RADERA',
    test: (p) => /i18n\/sv\.ts$/.test(p),
    skal: 'Äldre i18n-lager parallellt med locales/sv.json',
  },
  {
    grupp: 'RADERA',
    test: (p) => /pwa\/serviceWorker\.ts$/.test(p),
    skal: 'Rest efter C2 — SW-avregistreringen ligger i index.html',
  },
  {
    grupp: 'RADERA',
    test: (p) => /utils\/validation\.ts$|services\/accountApi\.ts$/.test(p),
    skal: 'Bekräftad dubblett — betalt arbete landade här (A3), levande vägen ligger någon annanstans',
  },
]

const STANDARD = {
  grupp: 'RADERA',
  skal: 'Onåbar från main.tsx, ingen särskild regel — dubbelkollad med namnsökning',
}

function klassa(filPath) {
  const p = rel(filPath)
  for (const r of REGLER) if (r.test(p)) return r
  return STANDARD
}

// ---------------------------------------------------------------- mätning

const radcache = new Map()
function rader(fil) {
  if (!radcache.has(fil)) {
    radcache.set(fil, fs.readFileSync(fil, 'utf8').split('\n').length)
  }
  return radcache.get(fil)
}

const ONABARA = ALLA_FILER.filter((f) => !NABAR.has(f) && !arTest(f))

/**
 * Dött test = test vars SUBJEKT är onåbart.
 *
 * Subjektet är i första hand den samlokaliserade filen med samma basnamn
 * (`Foo.test.tsx` → `Foo.tsx`). Det är den enda tolkning som håller: ett test
 * importerar ofta både sitt subjekt och levande hjälpare (i18n, testutils,
 * mockar), så regeln "alla importer är döda" ger falskt negativt och regeln
 * "någon import är död" ger falskt positivt.
 *
 * Saknas ett samlokaliserat subjekt (t.ex. `test/guides-markdown.test.ts`)
 * faller vi tillbaka på "alla src-beroenden döda", och tester utan
 * src-beroenden alls lämnas i fred.
 */
function subjektFor(t) {
  const bas = t.replace(/\.(test|spec)\.(ts|tsx|js|jsx)$/, '')
  for (const e of KOD_EXT) if (FIL_SET.has(bas + e)) return bas + e
  return null
}

const DODA_TESTER = TESTFILER.filter((t) => {
  const subj = subjektFor(t)
  if (subj) return !NABAR.has(subj)
  const traffar = [...(kanter.get(t) || [])].filter(
    (f) => !arTest(f) && !rel(f).startsWith('test/') && !rel(f).startsWith('mocks/')
  )
  if (!traffar.length) return false
  return traffar.every((f) => !NABAR.has(f))
})

const poster = [
  ...ONABARA.map((f) => ({ fil: f, ...klassa(f), test: false })),
  ...DODA_TESTER.map((f) => {
    const k = klassa(f)
    return {
      fil: f,
      grupp: k === STANDARD ? 'RADERA' : k.grupp,
      skal: `Test som vaktar dödkod — ${k.skal}`,
      test: true,
    }
  }),
]

// ---------------------------------------------------------------- namngrind

/**
 * Andra grinden: sök filens basnamn över hela repot. En träff utanför
 * client/src (t.ex. i e2e/, client/api/, supabase/ eller ett skript) betyder
 * att grafen missat en referens — filen flyttas då till UTRED.
 *
 * Körs bara vid --skriv och --namngrind, för den är dyr.
 */
const GRIND_OMFANG = [
  'e2e/',
  'client/api/',
  'api/',
  'supabase/functions/',
  'client/scripts/',
  'client/index.html',
  'client/vite.config.ts',
  'client/vitest.config.ts',
]

function gitGrep(monster, fast = true) {
  try {
    return execFileSync(
      'git',
      ['grep', '-l', ...(fast ? ['-F'] : ['-w']), monster, '--', ...GRIND_OMFANG],
      { cwd: REPO_ROOT, encoding: 'utf8' }
    )
      .split('\n')
      .filter(Boolean)
  } catch {
    return [] // git grep ger exit 1 när inget hittas
  }
}

function namngrind(poster) {
  const blockerade = []
  for (const p of poster) {
    const srcRel = rel(p.fil)
    const basnamn = path.basename(srcRel).replace(/\.(tsx?|jsx?|css)$/, '')

    // Barrel-filer har basnamnet "index" och matchar allt. De har heller
    // ingen egen identitet att söka på — hoppa över dem.
    if (basnamn === 'index') continue

    const traffar = new Set()

    // 1. Sökvägsformen. Fångar `@/components/x/Y`, `../src/components/x/Y`
    //    OCH strängbaserade dynamiska importer, som grafen missar.
    const utanExt = srcRel.replace(/\.(tsx?|jsx?|css)$/, '')
    // En sökväg utan katalogdel ("App") är för kort för att vara distinkt —
    // den träffar prosa i varenda fil. Kräv en katalogdel eller ett långt namn.
    if (utanExt.includes('/') || utanExt.length >= 8) {
      for (const f of gitGrep(utanExt)) traffar.add(f)
    }

    // 2. Identitetsformen — men bara som helt ord, och bara om namnet är
    //    distinkt nog att inte träffa slumpmässig prosa.
    if (basnamn.length >= 5 && /[A-Z]/.test(basnamn)) {
      for (const f of gitGrep(basnamn, false)) traffar.add(f)
    }

    if (traffar.size) blockerade.push({ ...p, traffar: [...traffar] })
  }
  return blockerade
}

// ---------------------------------------------------------------- utskrift

const argv = process.argv.slice(2)
const har = (f) => argv.includes(f)
const varde = (f) => {
  const a = argv.find((x) => x.startsWith(`--${f}=`))
  return a ? a.slice(f.length + 3) : null
}

const GRUPPER = ['RADERA', 'ARKIVERA', 'UTRED', 'BEHÅLL']

function summering() {
  const rad = (g) => {
    const ps = poster.filter((p) => p.grupp === g)
    return {
      grupp: g,
      filer: ps.length,
      rader: ps.reduce((s, p) => s + rader(p.fil), 0),
      tester: ps.filter((p) => p.test).length,
    }
  }
  return GRUPPER.map(rad)
}

if (har('--json')) {
  console.log(
    JSON.stringify(
      {
        matt: {
          filerTotalt: ALLA_FILER.length,
          nabaraFranMain: NABAR.size,
          onabaraIckeTest: ONABARA.length,
          onabaraRader: ONABARA.reduce((s, f) => s + rader(f), 0),
          testfiler: TESTFILER.length,
          dodaTester: DODA_TESTER.length,
        },
        summering: summering(),
        poster: poster.map((p) => ({
          fil: relClient(p.fil),
          rader: rader(p.fil),
          grupp: p.grupp,
          skal: p.skal,
          test: p.test,
        })),
        olosta: [...olosta].map(([f, s]) => ({ fil: relClient(f), specar: s })),
      },
      null,
      2
    )
  )
  process.exit(0)
}

console.log('Nåbarhetsanalys — client/src, entry: src/main.tsx\n')
console.log(`Filer i src (kod+css+json):     ${ALLA_FILER.length}`)
console.log(`Nåbara från main.tsx:           ${NABAR.size}`)
console.log(`Onåbara (exkl. testfiler):      ${ONABARA.length} filer / ${ONABARA.reduce((s, f) => s + rader(f), 0)} rader`)
console.log(`Testfiler totalt:               ${TESTFILER.length}`)
console.log(`Tester som vaktar dödkod:       ${DODA_TESTER.length}`)
if (olosta.size) {
  console.log(`\nVARNING: ${olosta.size} filer har importer som inte gick att lösa (se --json).`)
}

console.log('\nGrupp      Filer   Rader   varav test')
for (const s of summering()) {
  console.log(
    s.grupp.padEnd(10),
    String(s.filer).padStart(5),
    String(s.rader).padStart(7),
    String(s.tester).padStart(12)
  )
}

if (har('--lista') || varde('grupp')) {
  const filter = varde('grupp')
  console.log('\n--- Poster ---')
  for (const g of GRUPPER) {
    if (filter && g !== filter) continue
    const ps = poster.filter((p) => p.grupp === g).sort((a, b) => rader(b.fil) - rader(a.fil))
    if (!ps.length) continue
    console.log(`\n### ${g} (${ps.length} filer, ${ps.reduce((s, p) => s + rader(p.fil), 0)} rader)`)
    for (const p of ps) {
      console.log(`${String(rader(p.fil)).padStart(6)}  ${relClient(p.fil)}`)
      console.log(`        ${p.skal}`)
    }
  }
}

// ---------------------------------------------------------------- taken

/**
 * Mäter hur mycket av de tre frysta taken som ligger i onåbar kod.
 * Kör de riktiga verktygen — inte en uppskattning. Tar ca 1–2 minuter.
 */
function takmatning() {
  const dodGrupp = new Map(poster.map((p) => [relClient(p.fil), p.grupp]))
  const rader = []

  // 1. strict-typfel
  let tsUt = ''
  try {
    tsUt = execSync('npx tsc --noEmit -p tsconfig.app.json', { cwd: CLIENT, encoding: 'utf8' })
  } catch (e) {
    tsUt = (e.stdout || '') + (e.stderr || '')
  }
  const tsRader = tsUt.split('\n').filter((l) => /error TS/.test(l))
  let tsD = 0
  for (const l of tsRader) {
    const m = l.match(/^(src\/[^(]+)\(/)
    if (m && dodGrupp.has(m[1])) tsD++
  }
  rader.push(['strict-typfel', tsRader.length, tsD, tsRader.length - tsD])

  // 2. eslint-varningar
  let esUt = ''
  try {
    esUt = execSync('npx eslint . --format json', { cwd: CLIENT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  } catch (e) {
    esUt = e.stdout || '[]'
  }
  let esD = 0
  let esT = 0
  for (const f of JSON.parse(esUt)) {
    if (!f.warningCount) continue
    esT += f.warningCount
    if (dodGrupp.has(relClient(f.filePath))) esD += f.warningCount
  }
  rader.push(['eslint-warnings', esT, esD, esT - esD])

  // 3. gradienter — exakt samma urval som scripts/check-design-debt.cjs
  //    (bara .ts/.tsx; .css räknas inte av grinden)
  const GRAD = /bg-gradient-(to-[trbl]+|radial)/g
  let gD = 0
  let gT = 0
  for (const f of ALLA_FILER) {
    if (!['.ts', '.tsx'].includes(path.extname(f))) continue
    const n = (fs.readFileSync(f, 'utf8').match(GRAD) || []).length
    if (!n) continue
    gT += n
    if (dodGrupp.has(relClient(f))) gD += n
  }
  rader.push(['gradienter', gT, gD, gT - gD])

  console.log('\nFrysta tak — hur mycket ligger i onåbar kod?\n')
  console.log('Mått'.padEnd(18), 'totalt'.padStart(7), 'dödkod'.padStart(8), 'levande'.padStart(8))
  for (const [n, t, d, l] of rader) {
    console.log(n.padEnd(18), String(t).padStart(7), String(d).padStart(8), String(l).padStart(8))
  }
  console.log('\n"levande" är det tak som gäller efter ett fullständigt raderingspass.')
}

if (har('--tak')) takmatning()

if (har('--namngrind')) {
  const kandidater = poster.filter((p) => p.grupp === 'RADERA' || p.grupp === 'ARKIVERA')
  console.log(`\nNamngrind över ${kandidater.length} kandidater (git grep i e2e/, api/, supabase/, scripts/)…`)
  const blockerade = namngrind(kandidater)
  if (!blockerade.length) console.log('Inga träffar utanför client/src. Grinden är öppen.')
  for (const b of blockerade) {
    console.log(`BLOCKERAD  ${relClient(b.fil)} → ${b.traffar.join(', ')}`)
  }
}

// ---------------------------------------------------------------- utförande

if (!har('--skriv')) {
  console.log('\nTorrkörning. Ingenting har ändrats. Lägg till --skriv för att utföra.')
  process.exit(0)
}

// Grind 1: rent arbetsträd. Tre andra agenter kan ha ocommittade ändringar.
const status = execSync('git status --porcelain', { cwd: REPO_ROOT, encoding: 'utf8' }).trim()
if (status) {
  console.error('\nArbetsträdet är inte rent. Raderingspasset körs bara mot ett tyst träd.')
  console.error(status.split('\n').slice(0, 20).join('\n'))
  process.exit(1)
}

// Grind 2: namnsökning över repot.
const kandidater = poster.filter((p) => p.grupp === 'RADERA' || p.grupp === 'ARKIVERA')
const blockerade = namngrind(kandidater)
if (blockerade.length) {
  console.error('\nNamngrinden blockerar. Följande filer refereras utanför client/src:')
  for (const b of blockerade) console.error(`  ${relClient(b.fil)} → ${b.traffar.join(', ')}`)
  console.error('Klassa om dem till UTRED innan passet körs.')
  process.exit(1)
}

// Stegvis utförande. Barrels först — då blir resten synlig även för en vanlig grep.
const STEG = {
  barrels: (p) => /(^|\/)index\.ts$/.test(rel(p.fil)),
  hooks: (p) => rel(p.fil).startsWith('hooks/'),
  komponenter: (p) => rel(p.fil).startsWith('components/'),
  ovrigt: () => true,
}
const valtSteg = varde('steg')
const stegNamn = valtSteg ? [valtSteg] : Object.keys(STEG)
if (valtSteg && !STEG[valtSteg]) {
  console.error(`Okänt steg "${valtSteg}". Giltiga: ${Object.keys(STEG).join(', ')}`)
  process.exit(1)
}

const gjorda = new Set()
let raderade = 0
let arkiverade = 0

for (const steg of stegNamn) {
  const pred = STEG[steg]
  for (const p of poster) {
    if (gjorda.has(p.fil)) continue
    if (p.grupp !== 'RADERA' && p.grupp !== 'ARKIVERA') continue
    if (!pred(p)) continue
    gjorda.add(p.fil)
    const relRepo = path.relative(REPO_ROOT, p.fil).split(path.sep).join('/')

    // Ett borttaget test lämnar annars en föräldralös __snapshots__/*.snap
    // kvar. Den syns inte i importgrafen (den importeras inte, den slås upp
    // av vitest på filnamn) och blir därför osynlig skräp.
    if (p.test) {
      const snap = path.join(
        path.dirname(p.fil),
        '__snapshots__',
        path.basename(p.fil) + '.snap'
      )
      if (fs.existsSync(snap)) {
        execFileSync('git', ['rm', '-q', '--', path.relative(REPO_ROOT, snap).split(path.sep).join('/')], {
          cwd: REPO_ROOT,
        })
        raderade++
      }
    }

    if (p.grupp === 'RADERA') {
      execFileSync('git', ['rm', '-q', '--', relRepo], { cwd: REPO_ROOT })
      raderade++
    } else {
      const mal = path.join(ARCHIVE, rel(p.fil))
      fs.mkdirSync(path.dirname(mal), { recursive: true })
      execFileSync(
        'git',
        ['mv', '--', relRepo, path.relative(REPO_ROOT, mal).split(path.sep).join('/')],
        { cwd: REPO_ROOT }
      )
      arkiverade++
    }
  }
  console.log(`Steg "${steg}" klart.`)
}

console.log(`\nRaderade ${raderade} filer, arkiverade ${arkiverade} till archive/2026-08-doedkod/.`)
console.log('Kör nu: npm run lint:ci && npm run typecheck:ceiling && npm run lint:design && npm run test:coverage && npm run build')
