import { describe, it, expect } from 'vitest'
import { normaliseraKompetens, skillNamn, skillNamnLista } from './skillText'

describe('skillNamn — prod-form är objekt, strängform hanteras', () => {
  it('läser name ur ett Skill-objekt', () => {
    expect(skillNamn({ id: '1', name: 'React', level: 4, category: 'technical' })).toBe('React')
  })
  it('returnerar strängen som den är', () => {
    expect(skillNamn('  Excel ')).toBe('  Excel ')
  })
  it('ger tom sträng för null, undefined, tal och objekt utan name', () => {
    expect(skillNamn(null)).toBe('')
    expect(skillNamn(undefined)).toBe('')
    expect(skillNamn(42)).toBe('')
    expect(skillNamn({ id: 'x' })).toBe('')
    expect(skillNamn({ name: 7 })).toBe('')
  })
})

describe('normaliseraKompetens — trim + gemener, diakritik kvar', () => {
  it('trimmar och gör gemener', () => {
    expect(normaliseraKompetens('  Kundservice ')).toBe('kundservice')
  })
  it('tar objektform', () => {
    expect(normaliseraKompetens({ name: 'Truckkort B1' })).toBe('truckkort b1')
  })
  it('behåller åäö och accenter', () => {
    expect(normaliseraKompetens('Löneadministration')).toBe('löneadministration')
    expect(normaliseraKompetens('Café')).toBe('café')
  })
  it('tom och whitespace ger tom sträng', () => {
    expect(normaliseraKompetens('')).toBe('')
    expect(normaliseraKompetens('   ')).toBe('')
  })
})

describe('skillNamnLista', () => {
  it('blandar objekt och strängar, filtrerar tomma', () => {
    expect(skillNamnLista([{ name: 'A' }, 'B', '', { id: '3' }, null, ' C '])).toEqual(['A', 'B', 'C'])
  })
  it('icke-array ger tom lista', () => {
    expect(skillNamnLista(undefined)).toEqual([])
    expect(skillNamnLista('React')).toEqual([])
  })
})
