#!/usr/bin/env node
/**
 * check-schema-drift — failar bygget när koden refererar databasobjekt som
 * inte finns i produktionsschemat.
 *
 * ## Varför den här grinden finns
 *
 * Granskningen 2026-07-27 hittade 11 tabeller som koden läste eller skrev till
 * men som inte fanns i prod, plus kolumnreferenser som inte heller fanns. Ingen
 * av dem gav ett testfel, ett typfel eller ett synligt krasch — mönstret
 * `if (error) { console.error(...); return [] }` gör "tabellen finns inte"
 * oskiljbart från "inga rader". Jobbevakningen var därför ur funktion i 3,5
 * månader utan att någon märkte det.
 *
 * Samma buggklass hade då träffat tre gånger: `participant_consultants` (B3),
 * kolumnnamnen i `participant_data_sharing` (UX7), och de elva. Rotorsaken är
 * att migrationsrutinen är manuell (`db query --linked`, se CLAUDE.md) — inget
 * hindrar en migrationsfil från att aldrig köras.
 *
 * ## Hur den fungerar
 *
 * Jämför kodens databasreferenser mot `supabase/schema-snapshot.json`
 * (genererad av refresh-schema-snapshot.cjs — kör om efter varje migration).
 *
 * Kontrollerar:
 *   - `.from('tabell')`            → finns tabellen/vyn?
 *   - `.rpc('funktion')`           → finns funktionen?
 *   - `.storage.from('bucket')`    → finns bucketen?
 *   - `.select('a, b')`, `.eq('col', …)`, `.order('col')`, `onConflict: 'col'`
 *                                  → finns kolumnerna i den tabell kedjan gäller?
 *
 * ## Medvetna begränsningar
 *
 * Detta är en textanalys, inte en typkontroll. Den hittar det vanliga felet
 * (fel namn) men inte allt:
 *   - Kolumner i `.insert()/.update()`-objekt kontrolleras inte (kräver riktig
 *     AST-parsning; objektnycklar är dessutom ofta dynamiska).
 *   - Dynamiska tabellnamn (`.from(variabel)`) hoppas över.
 *   - Testfiler hoppas över — deras tabellnamn är fixtures mot en mockad klient.
 * Hellre en grind som är tyst om det osäkra än en som ropar varg.
 */

const fs = require('node:fs')
const path = require('node:path')

const REPO_ROOT = path.resolve(__dirname, '..', '..')
const SNAPSHOT = path.join(REPO_ROOT, 'supabase', 'schema-snapshot.json')

const SCAN_DIRS = [
  path.join(REPO_ROOT, 'client', 'src'),
  path.join(REPO_ROOT, 'client', 'api'),
  path.join(REPO_ROOT, 'supabase', 'functions'),
  path.join(REPO_ROOT, 'api'),
]

const SKIP_PATH = /(\\|\/)(archive|node_modules|dist|coverage)(\\|\/)|\.test\.|__tests__|\.spec\./

/** `.from()` finns på annat än supabase-klienten. */
const NOT_A_TABLE_OWNER = new Set(['Array', 'Buffer', 'String', 'Number', 'Object', 'Date', 'Set', 'Map'])

/** Kolumnfilter som tar ett kolumnnamn som första argument. */
const COLUMN_FILTERS = [
  'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'ilike', 'is', 'in',
  'contains', 'containedBy', 'order',
]

function readSnapshot() {
  if (!fs.existsSync(SNAPSHOT)) {
    console.error(
      `Hittar ingen schema-snapshot på ${path.relative(REPO_ROOT, SNAPSHOT)}.\n` +
      `Kör: node client/scripts/refresh-schema-snapshot.cjs`
    )
    process.exit(2)
  }
  return JSON.parse(fs.readFileSync(SNAPSHOT, 'utf8'))
}

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (SKIP_PATH.test(full)) continue
    if (entry.isDirectory()) walk(full, out)
    else if (/\.(ts|tsx|js|mjs|cjs)$/.test(entry.name)) out.push(full)
  }
  return out
}

/** Radnummer för ett tecken-index (för klickbara fel). */
function lineAt(content, index) {
  let line = 1
  for (let i = 0; i < index && i < content.length; i++) if (content[i] === '\n') line++
  return line
}

/**
 * Plockar ut kolumnnamn ur en select-sträng.
 *
 * Inbäddade relationer tas bort HELT — både namnet och innehållet. I
 * `select('*, career_milestones(id, title)')` är `career_milestones` en
 * relation, inte en kolumn på moderbordet; att kontrollera den gav falska
 * fynd i första versionen av det här skriptet. Samma sak för alias-formen
 * `profiles:consultant_id(...)`. De inre kolumnerna hör till en annan tabell
 * och ligger utanför vad textanalysen kan avgöra.
 */
function columnsFromSelect(selectStr) {
  let flat = selectStr
  // Upprepa för nästlade grupper (`a(b(c))`) — några varv räcker gott
  for (let i = 0; i < 5; i++) {
    const next = flat.replace(/(?:[a-zA-Z0-9_]+\s*:\s*)?[a-zA-Z0-9_!]+\s*\([^()]*\)/g, '')
    if (next === flat) break
    flat = next
  }
  return flat
    .split(',')
    .map((part) => {
      let p = part.trim()
      if (!p || p === '*') return null
      // alias:kolumn → kolumn   |   tabell:kolumn(...) → kolumn
      if (p.includes(':')) p = p.split(':').pop().trim()
      // count-aggregat och liknande
      if (/^count$/i.test(p)) return null
      return /^[a-z_][a-z0-9_]*$/.test(p) ? p : null
    })
    .filter(Boolean)
}

const snapshot = readSnapshot()
const tableSet = new Set(Object.keys(snapshot.tables))
const routineSet = new Set(snapshot.routines)
const bucketSet = new Set(snapshot.buckets)

const errors = []
const files = SCAN_DIRS.flatMap((d) => walk(d))

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8')
  const rel = path.relative(REPO_ROOT, file).replace(/\\/g, '/')

  // ---- .rpc('name') -------------------------------------------------------
  for (const m of content.matchAll(/\.rpc\(\s*['"`]([a-zA-Z0-9_]+)['"`]/g)) {
    if (!routineSet.has(m[1])) {
      errors.push({ file: rel, line: lineAt(content, m.index), kind: 'RPC', name: m[1] })
    }
  }

  // ---- .storage.from('bucket') -------------------------------------------
  for (const m of content.matchAll(/\.storage\s*\.\s*from\(\s*['"`]([a-zA-Z0-9_-]+)['"`]/g)) {
    if (!bucketSet.has(m[1])) {
      errors.push({ file: rel, line: lineAt(content, m.index), kind: 'BUCKET', name: m[1] })
    }
  }

  // ---- .from('table') + kolumner i samma kedja ---------------------------
  const fromMatches = [...content.matchAll(/(\w+)?\s*\.\s*from\(\s*['"`]([a-zA-Z0-9_]+)['"`]\s*\)/g)]

  for (let i = 0; i < fromMatches.length; i++) {
    const m = fromMatches[i]
    const owner = m[1]
    const table = m[2]

    // Array.from(...) och vänner — inte tabeller
    if (owner && NOT_A_TABLE_OWNER.has(owner)) continue
    // storage-buckets rapporteras redan ovan. `.storage` kan ligga på egen rad
    // före `.from(`, så titta bakåt över radbrytningar i stället för att kräva
    // att uttrycket slutar precis vid matchningen.
    if (/\.storage\s*$/.test(content.slice(Math.max(0, m.index - 40), m.index))) continue

    const line = lineAt(content, m.index)

    if (!tableSet.has(table)) {
      errors.push({ file: rel, line, kind: 'TABELL', name: table })
      continue // kolumnkoll är meningslös utan tabell
    }

    // Kedjan sträcker sig till nästa .from( eller 1500 tecken — vad som kommer först
    const chainEnd = i + 1 < fromMatches.length
      ? Math.min(fromMatches[i + 1].index, m.index + 1500)
      : Math.min(content.length, m.index + 1500)
    const chain = content.slice(m.index, chainEnd)

    const known = new Set(snapshot.tables[table])
    const flag = (col, kind) => {
      if (!known.has(col)) {
        errors.push({ file: rel, line, kind, name: `${table}.${col}` })
      }
    }

    for (const s of chain.matchAll(/\.select\(\s*['"`]([^'"`]*)['"`]/g)) {
      for (const col of columnsFromSelect(s[1])) flag(col, 'KOLUMN')
    }
    for (const f of chain.matchAll(new RegExp(`\\.(${COLUMN_FILTERS.join('|')})\\(\\s*['"\`]([a-z_][a-z0-9_]*)['"\`]`, 'g'))) {
      flag(f[2], 'KOLUMN')
    }
    for (const oc of chain.matchAll(/onConflict:\s*['"`]([a-z_][a-z0-9_,\s]*)['"`]/g)) {
      for (const col of oc[1].split(',').map((c) => c.trim()).filter(Boolean)) flag(col, 'KOLUMN')
    }
  }
}

// ---- Rapport --------------------------------------------------------------

const genAt = snapshot.generatedAt ? snapshot.generatedAt.slice(0, 10) : 'okänt datum'

if (errors.length === 0) {
  console.log(
    `OK — inga schemadriftfel. ${files.length} filer kontrollerade mot ` +
    `snapshot från ${genAt} (${tableSet.size} tabeller, ${routineSet.size} RPC, ${bucketSet.size} buckets).`
  )
  process.exit(0)
}

// Gruppera per typ så utskriften blir läsbar
const byKind = errors.reduce((acc, e) => {
  ;(acc[e.kind] ||= []).push(e)
  return acc
}, {})

console.error(`\nSCHEMADRIFT: ${errors.length} referenser saknas i produktionsschemat`)
console.error(`(snapshot från ${genAt} — är den inaktuell? kör refresh-schema-snapshot.cjs)\n`)

const LABEL = {
  TABELL: 'Tabeller/vyer som inte finns',
  KOLUMN: 'Kolumner som inte finns',
  RPC: 'RPC-funktioner som inte finns',
  BUCKET: 'Storage-buckets som inte finns',
}

for (const kind of ['TABELL', 'KOLUMN', 'RPC', 'BUCKET']) {
  const list = byKind[kind]
  if (!list?.length) continue
  console.error(`${LABEL[kind]} (${list.length}):`)
  const seen = new Set()
  for (const e of list) {
    const key = `${e.name}@${e.file}:${e.line}`
    if (seen.has(key)) continue
    seen.add(key)
    console.error(`  ${e.name}`.padEnd(52) + `${e.file}:${e.line}`)
  }
  console.error('')
}

console.error(
  'Åtgärda genom att antingen köra den migration som saknas (och sedan\n' +
  'refresh-schema-snapshot.cjs), eller ta bort koden om objektet aldrig ska finnas.\n'
)
process.exit(1)
