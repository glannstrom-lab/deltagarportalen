/**
 * lint:grants regel 1 och regel 3 måste kunna falla (2026-09-22).
 *
 * Mutationsstickprovet 2026-09-22 (docs/review-2026-09-22/kvalitet/RAPPORT.md,
 * M12c/M12d) stängde av båda reglerna — `f.anon && false` respektive
 * `else if (false)` — och ingenting föll. `skript-lint-grants-anon-anropare.test.ts`
 * prövar bara regel 5.
 *
 *  · Regel 1: en SECURITY DEFINER-funktion som `anon` kan köra, utanför
 *    ANON_TILLATNA. Det är A17:s hela klass — 36 av 65 öppna den 1 september.
 *  · Regel 3: ett `.rpc('…')` i webbläsarkoden mot en funktion `authenticated`
 *    inte kan köra. Den regeln hittade att ingen användare kunde ge eller
 *    återkalla ett samtycke från 2026-08-21 (grant_consent/withdraw_consent
 *    revokade i A17, anropade från consentApi.ts sjutton dagar senare).
 *
 * Testet kör det RIKTIGA skriptet, kopierat till ett minirepo i tmp (det hittar
 * sin rot via `__dirname`), med en ändrad kopia av den riktiga grants-snapshoten
 * och en fixturfil i `client/src` som anropar `withdraw_consent` precis som
 * consentApi.ts. Varje fall kräver rätt felrad, inte bara exit 1.
 *
 * `MUTANT_LINT_GRANTS` pekar ut en annan källfil för skriptet, bara för att
 * bevisa att testet fäller när en regel stängs av i en kopia.
 */
import { describe, it, expect, afterAll } from 'vitest'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, copyFileSync, readFileSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const SKRIPT = process.env.MUTANT_LINT_GRANTS || resolve(__dirname, '../../scripts/lint-grants.cjs')
const SNAPSHOT = resolve(__dirname, '../../../supabase/grants-snapshot.json')

interface Fn { name: string; signature: string; definer: boolean; anon: boolean; authenticated: boolean }
interface Snap { generatedAt: string; functions: Fn[]; tables: unknown[] }

const kataloger: string[] = []
afterAll(() => {
  for (const k of kataloger) rmSync(k, { recursive: true, force: true })
})

const FIXTUR = "export const aterkalla = (typ: string) => supabase.rpc('withdraw_consent', { p_consent_type: typ })\n"

function korMed(andra: (snap: Snap) => void, fixtur = FIXTUR) {
  const rot = mkdtempSync(join(tmpdir(), 'lint-grants-r13-'))
  kataloger.push(rot)
  for (const d of ['scripts', 'src', 'api']) mkdirSync(join(rot, 'client', d), { recursive: true })
  mkdirSync(join(rot, 'supabase'), { recursive: true })
  copyFileSync(SKRIPT, join(rot, 'client', 'scripts', 'lint-grants.cjs'))
  const snap: Snap = JSON.parse(readFileSync(SNAPSHOT, 'utf8'))
  andra(snap)
  const snapFil = join(rot, 'supabase', 'grants-snapshot.json')
  writeFileSync(snapFil, JSON.stringify(snap))
  writeFileSync(join(rot, 'client', 'src', 'samtycke.ts'), fixtur)
  return spawnSync(process.execPath, [join(rot, 'client', 'scripts', 'lint-grants.cjs')], {
    encoding: 'utf8',
    env: { ...process.env, GRANTS_SNAPSHOT: snapFil },
  })
}

const satt = (namn: string, falt: Partial<Fn>) => (snap: Snap) => {
  const traffar = snap.functions.filter((f) => f.name === namn)
  if (traffar.length === 0) throw new Error(`${namn} finns inte i snapshoten — välj en annan funktion för testet`)
  for (const f of traffar) Object.assign(f, falt)
}

describe('lint:grants regel 1 — anon-ytan', () => {
  it('är grön mot den verkliga snapshoten (förutsättning för de fällande fallen)', () => {
    const r = korMed(() => {})
    expect(r.status, r.stderr).toBe(0)
    expect(r.stdout).toContain('1 .rpc()-anrop i klientkoden nåbara')
  })

  it('fäller när anon får EXECUTE på en definer-funktion utanför ANON_TILLATNA', () => {
    const r = korMed(satt('withdraw_consent', { anon: true }))
    expect(r.status, r.stdout).toBe(1)
    expect(r.stderr).toContain('lint:grants — 1 problem')
    expect(r.stderr).toContain('anon kan köra SECURITY DEFINER-funktionen withdraw_consent(text)')
    expect(r.stderr).toContain('REVOKE EXECUTE ... FROM PUBLIC')
  })

  it('godkänner anon på en funktion som står i ANON_TILLATNA (regeln är inte "fäll allt")', () => {
    const r = korMed(satt('get_shared_profile', { anon: true }))
    expect(r.status, r.stderr).toBe(0)
  })
})

describe('lint:grants regel 3 — .rpc() i webbläsaren kräver authenticated', () => {
  it('fäller när authenticated tappar EXECUTE på en funktion klienten anropar (samtyckesbuggen 21 aug)', () => {
    const r = korMed(satt('withdraw_consent', { authenticated: false }))
    expect(r.status, r.stdout).toBe(1)
    expect(r.stderr).toContain('lint:grants — 1 problem')
    expect(r.stderr).toMatch(
      /client[\\/]src[\\/]samtycke\.ts anropar \.rpc\('withdraw_consent'\) men authenticated saknar EXECUTE/
    )
    expect(r.stderr).toContain('GRANT EXECUTE ON FUNCTION public.withdraw_consent(...) TO authenticated')
  })

  it('fäller när klienten anropar en funktion som inte finns i schemat', () => {
    const r = korMed(() => {}, `${FIXTUR}export const x = () => supabase.rpc('finns_inte_funktion')\n`)
    expect(r.status).toBe(1)
    expect(r.stderr).toMatch(/anropar \.rpc\('finns_inte_funktion'\) — funktionen finns inte i schemat/)
  })

  it('bryr sig inte om authenticated på en funktion ingen klientkod anropar', () => {
    const r = korMed(satt('withdraw_consent', { authenticated: false }), '')
    expect(r.status, r.stderr).toBe(0)
  })
})
