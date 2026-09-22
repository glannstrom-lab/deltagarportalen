/**
 * lint:kolumner (`scripts/check-insert-columns.cjs`) måste kunna falla (2026-09-22).
 *
 * Mutationsstickprovet 2026-09-22 (docs/review-2026-09-22/kvalitet/RAPPORT.md,
 * M12b) gjorde `saknade = nycklar.filter(() => false)` — och ingenting föll.
 * Grinden täpper luckan lint:schema lämnar öppen (kolumnnycklar i
 * `.insert()/.update()/.upsert()`), den som gömde rollväxlingens
 * `activeRole`-mot-`active_role`-bugg, men hade själv noll tester.
 *
 * Testet kör det RIKTIGA skriptet mot ett minirepo i tmp (skriptet tar roten
 * som argv[2] och läser `<rot>/../supabase/schema-snapshot.json`), med den
 * riktiga snapshoten och en fixturfil med exakt en avvikelse. Det kräver rätt
 * skäl — tabell, operation och den saknade kolumnen i utskriften — inte bara
 * exit 1.
 *
 * `MUTANT_CHECK_INSERT_COLUMNS` pekar ut en annan källfil för skriptet, bara för
 * att bevisa att testet fäller när kontrollen stängs av i en kopia.
 */
import { describe, it, expect, afterAll } from 'vitest'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, copyFileSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const SKRIPT = process.env.MUTANT_CHECK_INSERT_COLUMNS || resolve(__dirname, '../../scripts/check-insert-columns.cjs')
const SNAPSHOT = resolve(__dirname, '../../../supabase/schema-snapshot.json')

const kataloger: string[] = []
afterAll(() => {
  for (const k of kataloger) rmSync(k, { recursive: true, force: true })
})

function korMed(fixtur: string) {
  const rot = mkdtempSync(join(tmpdir(), 'insert-kolumner-'))
  kataloger.push(rot)
  const klient = join(rot, 'client')
  for (const d of ['scripts', 'src', 'api']) mkdirSync(join(klient, d), { recursive: true })
  mkdirSync(join(rot, 'supabase', 'functions'), { recursive: true })
  copyFileSync(SKRIPT, join(klient, 'scripts', 'check-insert-columns.cjs'))
  copyFileSync(SNAPSHOT, join(rot, 'supabase', 'schema-snapshot.json'))
  writeFileSync(join(klient, 'src', 'fixtur.ts'), fixtur)
  return spawnSync(process.execPath, [join(klient, 'scripts', 'check-insert-columns.cjs'), klient], {
    encoding: 'utf8',
  })
}

const GILTIG = [
  "export const a = () => supabase.from('profiles').update({ ai_enabled: false }).eq('id', 'x')",
  "export const b = (id: string) => supabase.from('profiles').upsert({ id, active_role: 'USER' })",
].join('\n')

describe('lint:kolumner — skriptet fäller av rätt skäl', () => {
  it('är grönt när varje skriven nyckel finns i schemat', () => {
    const r = korMed(GILTIG)
    expect(r.status, r.stdout + r.stderr).toBe(0)
    expect(r.stdout).toContain('Genomsökt 1 filer')
    expect(r.stdout).toContain('Inga kolumner utanför schemat.')
  })

  it('fäller på en .update()-nyckel som inte finns', () => {
    const r = korMed(`${GILTIG}\nexport const c = () => supabase.from('profiles').update({ finns_inte_kol2: 1 }).eq('id', 'x')`)
    expect(r.status, r.stdout + r.stderr).toBe(1)
    expect(r.stdout).toContain('=== 1 anrop skriver kolumner som inte finns ===')
    expect(r.stdout).toContain('src/fixtur.ts:3')
    expect(r.stdout).toContain('profiles.update() → SAKNAS: finns_inte_kol2')
  })

  it('fäller på camelCase-felet som rollväxlingen gjorde (activeRole mot active_role) i .upsert()', () => {
    const r = korMed(`${GILTIG}\nexport const c = (id: string) => supabase.from('profiles').upsert({ id, activeRole: 'USER' })`)
    expect(r.status).toBe(1)
    expect(r.stdout).toContain('profiles.upsert() → SAKNAS: activeRole')
    // Den giltiga nyckeln bredvid flaggas inte.
    expect(r.stdout).not.toMatch(/SAKNAS:.*\bid\b/)
  })

  it('fäller på en .insert([{…}])-nyckel som inte finns', () => {
    const r = korMed(`${GILTIG}\nexport const c = () => supabase.from('profiles').insert([{ id: 'x', finns_inte_i_array: true }])`)
    expect(r.status).toBe(1)
    expect(r.stdout).toContain('profiles.insert() → SAKNAS: finns_inte_i_array')
  })
})
