/**
 * Lätt svenska (KM11) — tre saker som annars går sönder tyst:
 *   1. en nyckel i sv-latt.json som inte finns i sv.json renderas aldrig
 *      (överlägget lägger bara på, ingen läser den) — därför måste varje nyckel
 *      finnas i sv.json med samma {{variabler}};
 *   2. att slå på faktiskt byter text, och att slå av återställer den;
 *   3. överlägget får inte ändra myndighetsnamn (samma regel som sprakparitet).
 */
import { describe, it, expect, beforeAll } from 'vitest'
import i18n from './config'
import sv from './locales/sv.json'
import latt from './locales/sv-latt.json'
import { overlaggetsNycklar, sattLattSvenska, tillampaLattSvenska } from './lattSvenska'

type Tree = { [k: string]: unknown }
function hamta(o: Tree, stig: string): unknown {
  return stig.split('.').reduce<unknown>((acc, k) => (acc && typeof acc === 'object' ? (acc as Tree)[k] : undefined), o)
}
const variabler = (s: unknown) => (typeof s === 'string' ? [...s.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]).sort() : [])

describe('sv-latt.json mot sv.json', () => {
  const nycklar = overlaggetsNycklar()

  it('täcker minst de tre vyerna', () => {
    expect(nycklar.some((k) => k.startsWith('minVecka.'))).toBe(true)
    expect(nycklar.some((k) => k.startsWith('consultantConsent.'))).toBe(true)
    expect(nycklar.some((k) => k.startsWith('minVardagHub.features.minVecka.'))).toBe(true)
  })

  it('varje nyckel finns i sv.json', () => {
    const saknas = nycklar.filter((k) => hamta(sv as unknown as Tree, k) === undefined)
    expect(saknas).toEqual([])
  })

  it('samma {{variabler}} som svenskan, per nyckel', () => {
    const fel: string[] = []
    for (const k of nycklar) {
      const a = hamta(sv as unknown as Tree, k)
      const b = hamta(latt as unknown as Tree, k)
      if (Array.isArray(a) && Array.isArray(b)) {
        const va = a.flatMap(variabler).sort()
        const vb = b.flatMap(variabler).sort()
        if (JSON.stringify(va) !== JSON.stringify(vb)) fel.push(k)
      } else if (JSON.stringify(variabler(a)) !== JSON.stringify(variabler(b))) fel.push(k)
    }
    expect(fel).toEqual([])
  })

  it('rör inga myndighetsnamn', () => {
    const text = JSON.stringify(latt)
    for (const namn of ['Arbetsförmedlingen', 'Försäkringskassan', 'Socialtjänsten']) {
      const iSv = JSON.stringify(sv).includes(namn)
      if (iSv) expect(text.includes(namn) || !text.toLowerCase().includes(namn.toLowerCase())).toBe(true)
    }
  })
})

describe('på/av', () => {
  beforeAll(async () => {
    await i18n.changeLanguage('sv')
  })

  it('byter text när det slås på och återställer när det slås av', async () => {
    const fore = i18n.t('minVecka.narvaro.present')
    expect(fore).toBe('Närvarande')
    await sattLattSvenska(true)
    expect(i18n.t('minVecka.narvaro.present')).toBe('Du var där')
    // en nyckel utanför överlägget är orörd
    expect(i18n.t('nav.calendar')).toBe((sv as unknown as Tree & { nav: { calendar: string } }).nav.calendar)
    await sattLattSvenska(false)
    expect(i18n.t('minVecka.narvaro.present')).toBe('Närvarande')
    expect(localStorage.getItem('lattSvenska')).toBeNull()
  })

  it('tillampaLattSvenska är idempotent', () => {
    tillampaLattSvenska(true)
    tillampaLattSvenska(true)
    expect(i18n.t('minVecka.jagArHar')).toBe('Jag är här')
    tillampaLattSvenska(false)
    expect(i18n.t('minVecka.saldo.ingaPass')).toBe('Inget inplanerat den här veckan.')
    // på → av → på: överlägget får inte ha förstörts av återställningen
    tillampaLattSvenska(true)
    expect(i18n.t('minVecka.narvaro.present')).toBe('Du var där')
    expect(i18n.t('consultantConsent.yes')).toBe('Ja, det är okej')
    tillampaLattSvenska(false)
    expect(i18n.t('minVecka.narvaro.present')).toBe('Närvarande')
  })
})
