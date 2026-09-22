/**
 * Sparade jobb: "sparat" är två statusar, inte en.
 *
 * `SPARADE_STATUSAR` (data/ansokningsstatus.ts) är ['saved', 'interested'].
 * JobSearch.tsx filtrerade fliken Sparade och rubrikens räknare på
 * `status === 'saved'` — fyra rader med INTERESTED i prod syntes varken i
 * listan eller i räknaren (2026-09-22). Komponenten är inte exporterad och
 * sidan är tung att montera, så vakten läser källan; logiken själv är testad
 * i data/ansokningsstatus.
 *
 * Mutation: skriv tillbaka `j.status === 'saved'` → testet faller.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { arSparat } from '@/data/ansokningsstatus'

const kod = readFileSync(join(__dirname, 'JobSearch.tsx'), 'utf8')

describe('JobSearch — sparade jobb', () => {
  it('filtrerar inte på en enda status', () => {
    expect(kod).not.toMatch(/status\s*===\s*'saved'/)
    expect(kod).toMatch(/arSparat\(j\.status\)/)
  })

  it('arSparat tar med både saved och interested, men inte applied', () => {
    expect(arSparat('saved')).toBe(true)
    expect(arSparat('INTERESTED')).toBe(true)
    expect(arSparat('applied')).toBe(false)
  })

  it('fliken visar hookens fel i stället för en tom lista', () => {
    expect(kod).toMatch(/error: hamtfel/)
    expect(kod).toMatch(/<ErrorState[^>]*message=\{hamtfel\}/)
  })
})
