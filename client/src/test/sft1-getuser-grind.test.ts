/**
 * SFT1 (2026-09-29): klienten gjorde 284 anrop till supabase.auth.getUser() — en
 * rundresa till auth-servern vardera, oftast bara för user.id — och två av dem gav
 * CORS-fel under det skarpa testet. Allt går nu genom anvandareFranSession().
 *
 * Grinden fäller på varje nytt direktanrop i klientkoden. Tillåtet:
 *  - authStore.ts: verifierar tokenen mot servern en gång per sidladdning (med flit)
 *  - InviteHandler.tsx: läser användaren direkt efter verifyOtp, innan sessionen satt sig
 *  - lib/anvandareFranSession.ts: reservvägen när ingen session finns
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'

const SRC = resolve(__dirname, '..')
const TILLATNA = new Set([
  'stores/authStore.ts',
  'components/auth/InviteHandler.tsx',
  'lib/anvandareFranSession.ts',
])

function filer(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n)
    if (statSync(p).isDirectory()) return filer(p)
    return /\.(ts|tsx)$/.test(n) && !/\.(test|spec)\./.test(n) ? [p] : []
  })
}

export function direktanrop(kod: string): number[] {
  return kod
    .split(/\r?\n/)
    .map((rad, i) => ({ rad: rad.trim(), i: i + 1 }))
    .filter(({ rad }) => !rad.startsWith('//') && !rad.startsWith('*') && !rad.startsWith('/*'))
    .filter(({ rad }) => /supabase\.auth\.getUser\(\)/.test(rad.replace(/\/\/.*$/, '')))
    .map(({ i }) => i)
}

describe('SFT1: inga direktanrop till auth.getUser() i klientkoden', () => {
  it('bara de tre tillåtna filerna anropar getUser direkt', () => {
    const fel = filer(SRC)
      .map((p) => ({ rel: relative(SRC, p).replace(/\\/g, '/'), rader: direktanrop(readFileSync(p, 'utf8')) }))
      .filter((f) => f.rader.length && !TILLATNA.has(f.rel))
      .map((f) => `${f.rel}:${f.rader.join(',')}`)
    expect(fel, `Använd anvandareFranSession() från @/lib/anvandareFranSession:\n${fel.join('\n')}`).toEqual([])
  })

  it('grinden kan falla', () => {
    expect(direktanrop("const { data } = await supabase.auth.getUser()")).toEqual([1])
    expect(direktanrop('// supabase.auth.getUser() i en kommentar')).toEqual([])
  })
})
