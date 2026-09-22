/**
 * lint:grants såg inte att Vercel-funktionerna behöver anon (2026-09-22).
 *
 * `client/api/ai.js`, `cv-pdf.js` och `upload-image.js` anropar
 * `check_rate_limit` med en klient byggd på ANON-nyckeln. Revokeras anon
 * därifrån faller RPC:n med 42501 och varje anropare tar sin minnesfallback
 * utan att larma — rate-limiten blir per instans, på serverless i praktiken
 * ingen. Grinden kontrollerade bara att anon inte fick FÖR mycket (regel 1)
 * och att webbläsarens anrop når `authenticated` (regel 3). Regel 5 täcker
 * det tredje hållet.
 *
 * Testet kör den riktiga grinden mot en kopia av snapshoten där anon tagits
 * bort från check_rate_limit.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const SKRIPT = resolve(__dirname, '../../scripts/lint-grants.cjs')
const SNAPSHOT = resolve(__dirname, '../../../supabase/grants-snapshot.json')
let katalog = ''

beforeAll(() => {
  katalog = mkdtempSync(join(tmpdir(), 'lint-grants-'))
})
afterAll(() => {
  rmSync(katalog, { recursive: true, force: true })
})

function korMed(andra: (snap: { functions: Array<{ name: string; anon: boolean }> }) => void) {
  const snap = JSON.parse(readFileSync(SNAPSHOT, 'utf8'))
  andra(snap)
  const fil = join(katalog, `snap-${Math.random().toString(36).slice(2)}.json`)
  writeFileSync(fil, JSON.stringify(snap))
  return spawnSync(process.execPath, [SKRIPT], { encoding: 'utf8', env: { ...process.env, GRANTS_SNAPSHOT: fil } })
}

describe('lint:grants regel 5 — client/api anropar med anon-nyckeln', () => {
  it('är grön mot den verkliga snapshoten', () => {
    const r = korMed(() => {})
    expect(r.status, r.stderr).toBe(0)
    expect(r.stdout).toMatch(/\d+ i client\/api nåbara för anon/)
  })

  it('fäller när anon tappar EXECUTE på check_rate_limit', () => {
    const r = korMed((snap) => {
      for (const f of snap.functions) if (f.name === 'check_rate_limit') f.anon = false
    })
    expect(r.status).toBe(1)
    expect(r.stderr).toContain("anropar .rpc('check_rate_limit') med anon-nyckeln")
    expect(r.stderr).toMatch(/client[\\/]api[\\/]ai\.js/)
  })
})
