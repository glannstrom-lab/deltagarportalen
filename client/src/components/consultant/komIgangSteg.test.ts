/**
 * Kom igång-guidens steg (2026-10-11). Beteenden som kan falla:
 *   1. Ett steg är klart BARA när datan säger det — inte när lage saknas,
 *      och inte när talet är noll.
 *   2. Kommun och leverantör får olika slutsteg (underlag vs avvikelse + placering).
 *   3. Rollen väljs ur organisationsrollerna; chef går före, handläggare utan
 *      konsulentroll får handläggarens steg.
 *   4. Länkarna går till rätt flik hos rätt deltagare.
 */
import { describe, it, expect } from 'vitest'
import { allaKlara, guideRoll, guideSteg, type KonsulentLage } from './komIgangSteg'

const tomt: KonsulentLage = {
  deltagare: 0, forstaDeltagare: null, planer: 0, forstaPlanDeltagare: null,
  narvaro: 0, journal: 0, underlag: 0, avvikelser: 0, placeringar: 0,
}

const ids = (s: { id: string }[]) => s.map((x) => x.id)

describe('guideRoll', () => {
  it('chef och admin går före allt annat', () => {
    expect(guideRoll(['konsulent', 'chef'])).toBe('chef')
    expect(guideRoll(['admin'])).toBe('chef')
  })
  it('handläggare utan konsulentroll får handläggarens guide', () => {
    expect(guideRoll(['handlaggare'])).toBe('handlaggare')
    expect(guideRoll(['handlaggare', 'konsulent'])).toBe('konsulent')
  })
  it('utan organisation: konsulent', () => {
    expect(guideRoll([])).toBe('konsulent')
  })
})

describe('guideSteg — varianter', () => {
  it('kommun: underlag till handläggaren, ingen avvikelse eller placering', () => {
    const s = guideSteg('konsulent', 'kommun', null)
    expect(ids(s)).toEqual(['bjudIn', 'plan', 'narvaro', 'journal', 'underlag'])
  })
  it('leverantör: avvikelse och placering, inget underlag till handläggaren', () => {
    const s = guideSteg('konsulent', 'leverantor', null)
    expect(ids(s)).toEqual(['bjudIn', 'plan', 'narvaro', 'journal', 'avvikelse', 'placering'])
    expect(s.map((x) => x.text).join(' ')).not.toMatch(/handläggaren|socialnämnd/i)
    expect(s.find((x) => x.id === 'avvikelse')?.text).toMatch(/Arbetsförmedlingen/)
  })
  it('chef i kommun får steget om handläggarens konto, chef hos leverantör inte', () => {
    expect(ids(guideSteg('chef', 'kommun', null))).toContain('handlaggare')
    expect(ids(guideSteg('chef', 'leverantor', null))).not.toContain('handlaggare')
  })
  it('handläggaren får två steg om mottagna underlag', () => {
    expect(ids(guideSteg('handlaggare', 'kommun', null))).toEqual(['mottagna', 'kvittera'])
  })
  it('leverantören har sex steg, kommunen fem', () => {
    expect(guideSteg('konsulent', 'kommun', null)).toHaveLength(5)
    expect(guideSteg('konsulent', 'leverantor', null)).toHaveLength(6)
  })
})

describe('guideSteg — bockas av ur datan', () => {
  it('utan data (laddar/fel) är varje steg okänt, aldrig klart eller ogjort', () => {
    const s = guideSteg('konsulent', 'kommun', null)
    expect(s.every((x) => x.klar === null)).toBe(true)
    expect(allaKlara(s)).toBe(false)
  })

  it('noll i datan = inte gjort', () => {
    const s = guideSteg('konsulent', 'kommun', { roll: 'konsulent', data: tomt })
    expect(s.every((x) => x.klar === false)).toBe(true)
  })

  it('varje steg följer sitt eget tal', () => {
    const s = guideSteg('konsulent', 'kommun', { roll: 'konsulent', data: { ...tomt, deltagare: 1, forstaDeltagare: 'd1', journal: 2 } })
    const klar = Object.fromEntries(s.map((x) => [x.id, x.klar]))
    expect(klar).toEqual({ bjudIn: true, plan: false, narvaro: false, journal: true, underlag: false })
  })

  it('allt i datan = alla klara', () => {
    const allt: KonsulentLage = {
      deltagare: 3, forstaDeltagare: 'd1', planer: 1, forstaPlanDeltagare: 'd2',
      narvaro: 4, journal: 1, underlag: 1, avvikelser: 1, placeringar: 1,
    }
    expect(allaKlara(guideSteg('konsulent', 'kommun', { roll: 'konsulent', data: allt }))).toBe(true)
    expect(allaKlara(guideSteg('konsulent', 'leverantor', { roll: 'konsulent', data: allt }))).toBe(true)
    // Leverantörens avvikelse räknas inte av kommunens underlag
    expect(allaKlara(guideSteg('konsulent', 'leverantor', { roll: 'konsulent', data: { ...allt, avvikelser: 0 } }))).toBe(false)
  })

  it('data för en annan roll räknas inte', () => {
    const s = guideSteg('chef', 'kommun', { roll: 'konsulent', data: { ...tomt, deltagare: 5 } })
    expect(s.every((x) => x.klar === null)).toBe(true)
  })

  it('handläggare: kvitterat kräver ett kvitterat underlag', () => {
    const s = guideSteg('handlaggare', 'kommun', { roll: 'handlaggare', data: { mottagna: 2, kvitterade: 0 } })
    expect(s.map((x) => x.klar)).toEqual([true, false])
  })
})

describe('guideSteg — knapparna', () => {
  it('bjud in öppnar dialogen, plan och journal går till rätt flik hos första deltagaren', () => {
    const s = guideSteg('konsulent', 'kommun', { roll: 'konsulent', data: { ...tomt, deltagare: 1, forstaDeltagare: 'd1', forstaPlanDeltagare: 'd2' } })
    const h = Object.fromEntries(s.map((x) => [x.id, x.knapp.handling]))
    expect(h.bjudIn).toEqual({ typ: 'bjudIn' })
    expect(h.plan).toEqual({ typ: 'lank', till: '/consultant/participants/d1?flik=aktivitet' })
    expect(h.journal).toEqual({ typ: 'lank', till: '/consultant/participants/d1?flik=journal' })
    // Underlaget lämnas där det finns en plan
    expect(h.underlag).toEqual({ typ: 'lank', till: '/consultant/participants/d2?flik=aktivitet' })
  })
  it('utan deltagare går stegen till deltagarlistan', () => {
    const s = guideSteg('konsulent', 'kommun', { roll: 'konsulent', data: tomt })
    expect(s.find((x) => x.id === 'plan')?.knapp.handling).toEqual({ typ: 'lank', till: '/consultant/participants' })
  })
})
