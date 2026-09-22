/**
 * lint:schema (`scripts/check-schema-drift.cjs`) måste kunna falla (2026-09-22).
 *
 * Mutationsstickprovet 2026-09-22 (docs/review-2026-09-22/kvalitet/RAPPORT.md,
 * M12a) stängde av kolumnkontrollen — `if (!known.has(col))` → `if (false)` —
 * och ingenting föll: inget test refererade skriptet. Grinden som hittade
 * fantomtabellerna och fyra skarpa kolumnbuggar 2026-07-27 var alltså själv
 * oskyddad; det enda som körde den var den själv.
 *
 * Testet kör det RIKTIGA skriptet mot ett litet konstruerat repo i tmp: skriptet
 * kopieras till `<tmp>/client/scripts/`, där det hittar sin rot via `__dirname`,
 * och får den riktiga schema-snapshoten plus en fixturfil med exakt en avvikelse.
 * Varje fall kräver att skriptet fäller AV RÄTT SKÄL — rätt rubrik och rätt namn
 * i utskriften, och ingen annan kategori — inte bara exit 1 (ett skript som
 * kraschar på syntaxfel ger också en exitkod skild från 0).
 *
 * `MUTANT_CHECK_SCHEMA_DRIFT` pekar ut en annan källfil för skriptet. Den finns
 * bara för att bevisa att testet fäller när kontrollen stängs av i en kopia;
 * sätt den aldrig i CI.
 */
import { describe, it, expect, afterAll } from 'vitest'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, copyFileSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const SKRIPT = process.env.MUTANT_CHECK_SCHEMA_DRIFT || resolve(__dirname, '../../scripts/check-schema-drift.cjs')
const SNAPSHOT = resolve(__dirname, '../../../supabase/schema-snapshot.json')

const kataloger: string[] = []
afterAll(() => {
  for (const k of kataloger) rmSync(k, { recursive: true, force: true })
})

/** Bygger ett minirepo med en fixturfil och kör skriptet i det. */
function korMed(fixtur: string) {
  const rot = mkdtempSync(join(tmpdir(), 'schema-drift-'))
  kataloger.push(rot)
  mkdirSync(join(rot, 'client', 'scripts'), { recursive: true })
  mkdirSync(join(rot, 'client', 'src'), { recursive: true })
  mkdirSync(join(rot, 'supabase'), { recursive: true })
  copyFileSync(SKRIPT, join(rot, 'client', 'scripts', 'check-schema-drift.cjs'))
  copyFileSync(SNAPSHOT, join(rot, 'supabase', 'schema-snapshot.json'))
  writeFileSync(join(rot, 'client', 'src', 'fixtur.ts'), fixtur)
  return spawnSync(process.execPath, [join(rot, 'client', 'scripts', 'check-schema-drift.cjs')], {
    encoding: 'utf8',
  })
}

const GILTIG = [
  "export const a = () => supabase.from('profiles').select('id, ai_enabled').eq('id', 'x')",
  "export const b = () => supabase.rpc('withdraw_consent', { p: 1 })",
  "export const c = () => supabase.storage.from('profile-images').upload('p', 'x')",
].join('\n')

describe('lint:schema — skriptet fäller av rätt skäl', () => {
  it('är grönt mot en fixtur som bara refererar objekt som finns', () => {
    const r = korMed(GILTIG)
    expect(r.status, r.stderr).toBe(0)
    expect(r.stdout).toMatch(/OK — inga schemadriftfel\. 1 filer kontrollerade/)
  })

  it('fäller på en kolumn i .select() som inte finns — som KOLUMN, inte som tabell', () => {
    const r = korMed(`${GILTIG}\nexport const d = () => supabase.from('profiles').select('id, finns_inte_kol')`)
    expect(r.status, r.stdout + r.stderr).toBe(1)
    expect(r.stderr).toContain('Kolumner som inte finns (1):')
    expect(r.stderr).toMatch(/profiles\.finns_inte_kol\s+client\/src\/fixtur\.ts:4/)
    expect(r.stderr).not.toContain('Tabeller/vyer som inte finns')
  })

  it('fäller på en kolumn i ett filter (.eq) som inte finns', () => {
    const r = korMed(`${GILTIG}\nexport const d = () => supabase.from('profiles').select('id').eq('finns_inte_filter', 1)`)
    expect(r.status).toBe(1)
    expect(r.stderr).toContain('Kolumner som inte finns (1):')
    expect(r.stderr).toContain('profiles.finns_inte_filter')
  })

  it('fäller på en tabell som inte finns — som TABELL, och kolumnkollen hoppas över', () => {
    const r = korMed(`${GILTIG}\nexport const d = () => supabase.from('finns_inte_tabell').select('id')`)
    expect(r.status).toBe(1)
    expect(r.stderr).toContain('Tabeller/vyer som inte finns (1):')
    expect(r.stderr).toMatch(/finns_inte_tabell\s+client\/src\/fixtur\.ts:4/)
    expect(r.stderr).not.toContain('Kolumner som inte finns')
  })

  it('fäller på en RPC som inte finns', () => {
    const r = korMed(`${GILTIG}\nexport const d = () => supabase.rpc('finns_inte_funktion')`)
    expect(r.status).toBe(1)
    expect(r.stderr).toContain('RPC-funktioner som inte finns (1):')
    expect(r.stderr).toContain('finns_inte_funktion')
  })

  it('fäller på en storage-bucket som inte finns', () => {
    const r = korMed(`${GILTIG}\nexport const d = () => supabase.storage.from('finns-inte-bucket').upload('p', 'x')`)
    expect(r.status).toBe(1)
    expect(r.stderr).toContain('Storage-buckets som inte finns (1):')
    expect(r.stderr).toContain('finns-inte-bucket')
    // En bucket får inte feltolkas som en tabell.
    expect(r.stderr).not.toContain('Tabeller/vyer som inte finns')
  })
})
