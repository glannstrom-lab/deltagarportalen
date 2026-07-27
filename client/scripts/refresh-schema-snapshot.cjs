#!/usr/bin/env node
/**
 * refresh-schema-snapshot — hämtar prod-schemat och skriver det till
 * `supabase/schema-snapshot.json`.
 *
 * VARFÖR EN SNAPSHOT I REPOT, i stället för att fråga databasen i CI:
 *  - CI behöver då inga DB-hemligheter och kan köra grinden på varje PR.
 *  - Grinden blir deterministisk och snabb (ingen nätverksrundtur).
 *  - Schemat blir läsbart i repot, vilket också är underlag för Art 30-arbetet.
 *
 * Priset är att snapshoten kan bli inaktuell. Därför:
 *  - Kör detta skript efter varje körd migration (samma tillfälle som
 *    `db query --linked`), och committa resultatet i samma commit.
 *  - Snapshoten har `generatedAt` så det syns när den senast stämdes av.
 *
 * Kräver att `npx supabase` är inloggad och länkad (samma förutsättning som
 * migrationsrutinen i CLAUDE.md).
 *
 * Användning:  node client/scripts/refresh-schema-snapshot.cjs
 */

const { execSync } = require('node:child_process')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')

const REPO_ROOT = path.resolve(__dirname, '..', '..')
const OUT_FILE = path.join(REPO_ROOT, 'supabase', 'schema-snapshot.json')

/**
 * Kör SQL via supabase-CLI:n och returnerar rader.
 *
 * SQL:en går via en temporär fil (`-f`) i stället för som argument: Windows +
 * Node 24 kan inte spawna `npx.cmd` utan shell, och med shell blir citattecken
 * i SQL:en ohanterliga. `-f` sidstepper hela problemet.
 *
 * CLI:n skriver "Initialising login role..." före JSON:en och lägger på en
 * boundary-varning — plocka ut det första JSON-objektet.
 */
function queryJson(sql) {
  const tmp = path.join(os.tmpdir(), `schema-snapshot-${process.pid}-${Math.abs(sql.length)}.sql`)
  fs.writeFileSync(tmp, sql, 'utf8')
  try {
    const raw = execSync(
      `npx supabase db query --linked -f "${tmp}" --output json`,
      { cwd: REPO_ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] }
    )
    const start = raw.indexOf('{')
    if (start === -1) throw new Error(`Oväntat CLI-svar:\n${raw.slice(0, 400)}`)
    return JSON.parse(raw.slice(start)).rows
  } finally {
    try { fs.unlinkSync(tmp) } catch { /* temp-filen är inte kritisk */ }
  }
}

console.log('Hämtar tabeller och kolumner …')
const columnRows = queryJson(`
  SELECT c.table_name AS t, string_agg(c.column_name, ',' ORDER BY c.column_name) AS cols
  FROM information_schema.columns c
  JOIN information_schema.tables tb
    ON tb.table_schema = c.table_schema AND tb.table_name = c.table_name
  WHERE c.table_schema = 'public'
  GROUP BY c.table_name
`)

console.log('Hämtar RPC-funktioner …')
const routineRows = queryJson(`
  SELECT string_agg(DISTINCT p.proname, ',' ORDER BY p.proname) AS names
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
`)

console.log('Hämtar storage-buckets …')
const bucketRows = queryJson(`SELECT string_agg(id, ',' ORDER BY id) AS ids FROM storage.buckets`)

const tables = {}
for (const row of columnRows) {
  tables[row.t] = String(row.cols || '').split(',').filter(Boolean)
}

const snapshot = {
  // Datumet sätts av den som kör skriptet — inte av grinden.
  generatedAt: new Date().toISOString(),
  note: 'Genererad av client/scripts/refresh-schema-snapshot.cjs. Kör om efter varje migration och committa i samma commit. Läses av check-schema-drift.cjs.',
  tables,
  routines: String(routineRows[0]?.names || '').split(',').filter(Boolean),
  buckets: String(bucketRows[0]?.ids || '').split(',').filter(Boolean),
}

fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true })
fs.writeFileSync(OUT_FILE, JSON.stringify(snapshot, null, 2) + '\n', 'utf8')

const tableCount = Object.keys(snapshot.tables).length
const colCount = Object.values(snapshot.tables).reduce((a, b) => a + b.length, 0)
console.log(
  `\nSkrev ${path.relative(REPO_ROOT, OUT_FILE)}\n` +
  `  ${tableCount} tabeller/vyer, ${colCount} kolumner\n` +
  `  ${snapshot.routines.length} RPC-funktioner\n` +
  `  ${snapshot.buckets.length} storage-buckets`
)
