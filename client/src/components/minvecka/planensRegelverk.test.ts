/**
 * RD3 (rollspelet 2026-09-27): vilket regelverk deltagarens plan hör till.
 * Utan belägg blir svaret null (neutral text) — aldrig kommunens juridik.
 * Motprov: låt valjRegelverk svara 'kommun' när typen saknas → testet
 * "före migrationen" faller.
 */
import { describe, it, expect } from 'vitest'
import { valjRegelverk } from './planensRegelverk'

describe('valjRegelverk', () => {
  it('planens organisation avgör', () => {
    const rader = [
      { org_id: 'k', org_kind: 'kommun' },
      { org_id: 'l', org_kind: 'leverantor' },
    ]
    expect(valjRegelverk(rader, 'l')).toBe('leverantor')
    expect(valjRegelverk(rader, 'k')).toBe('kommun')
  })

  it('utan planens organisation: bara en entydig typ räknas', () => {
    expect(valjRegelverk([{ org_id: 'l', org_kind: 'leverantor' }], null)).toBe('leverantor')
    expect(valjRegelverk([{ org_id: 'k', org_kind: 'kommun' }, { org_id: 'l', org_kind: 'leverantor' }], null)).toBeNull()
    expect(valjRegelverk([{ org_id: 'a', org_kind: 'annan' }], null)).toBeNull()
    expect(valjRegelverk([], 'x')).toBeNull()
  })

  it('före migrationen saknar vyn org_kind — då neutral, inte kommun', () => {
    expect(valjRegelverk([{ org_id: 'k' }], 'k')).toBeNull()
    expect(valjRegelverk([{ org_id: 'k' }], null)).toBeNull()
  })
})
