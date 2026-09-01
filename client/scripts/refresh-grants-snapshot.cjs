#!/usr/bin/env node
/**
 * refresh-grants-snapshot — hämtar rättighetsläget ur prod och skriver det till
 * `supabase/grants-snapshot.json`.
 *
 * VARFÖR: A17 (4 augusti) och A22 (1 september) städade samma sak två gånger, och
 * mellan dem hade den öppna mängden VUXIT — från 18 av 53 till 36 av 65 definer-
 * funktioner anropbara av `anon`. En städning utan grind är en engångshändelse.
 *
 * Samma avvägning som `refresh-schema-snapshot.cjs`: snapshoten ligger i repot så att
 * CI kan köra grinden utan DB-hemligheter. Priset är att den kan bli inaktuell — kör
 * detta skript efter varje migration som rör GRANT/REVOKE eller RLS, och committa
 * resultatet i samma commit.
 *
 * Det mätvärde som räknas är `has_function_privilege`, inte vad ett REVOKE-kommando
 * svarade. A17:s dyraste lärdom: `REVOKE ... FROM anon` lyckas tyst utan att ändra
 * någonting när PUBLIC har EXECUTE.
 *
 * Användning:  node client/scripts/refresh-grants-snapshot.cjs
 */

const { execSync } = require('node:child_process')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')

const REPO_ROOT = path.resolve(__dirname, '..', '..')
const OUT_FILE = path.join(REPO_ROOT, 'supabase', 'grants-snapshot.json')

function queryJson(sql) {
  const tmp = path.join(os.tmpdir(), `grants-snapshot-${process.pid}-${Math.abs(sql.length)}.sql`)
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

console.log('Hämtar SECURITY DEFINER-funktioner och deras EXECUTE-rättigheter …')
const functionRows = queryJson(`
  SELECT
    p.proname AS name,
    p.oid::regprocedure::text AS signature,
    has_function_privilege('anon', p.oid, 'EXECUTE') AS anon,
    has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authenticated
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.prosecdef
  ORDER BY p.proname, p.oid::regprocedure::text
`)

console.log('Hämtar RLS-läget per tabell …')
const tableRows = queryJson(`
  SELECT c.relname AS name, c.relrowsecurity AS rls
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind = 'r'
  ORDER BY c.relname
`)

const snapshot = {
  generatedAt: new Date().toISOString(),
  definerFunctions: functionRows.map((r) => ({
    name: r.name,
    signature: r.signature,
    anon: r.anon === true || r.anon === 't',
    authenticated: r.authenticated === true || r.authenticated === 't',
  })),
  tables: tableRows.map((r) => ({ name: r.name, rls: r.rls === true || r.rls === 't' })),
}

fs.writeFileSync(OUT_FILE, JSON.stringify(snapshot, null, 2) + '\n', 'utf8')

const anonCount = snapshot.definerFunctions.filter((f) => f.anon).length
const rlsOff = snapshot.tables.filter((t) => !t.rls).length
console.log(`\nSkrev ${path.relative(REPO_ROOT, OUT_FILE)}`)
console.log(`  ${snapshot.definerFunctions.length} definer-funktioner, varav ${anonCount} anropbara av anon`)
console.log(`  ${snapshot.tables.length} tabeller, varav ${rlsOff} utan RLS`)
