import { createRequire } from 'node:module'
import { describe, expect, it } from 'vitest'

const require = createRequire(import.meta.url)
const m = require('../../scripts/lib/sprakmatning.cjs') as {
  hittaTal: (t: string) => string[]
  jamforTal: (a: string, b: string) => { saknade: string[]; andel: number }
  jamforNamn: (a: string, b: string, n: string[]) => { forvantat: string[]; saknade: string[]; andel: number }
  likhet: (a: string, b: string) => number
  langdkvot: (a: string, b: string) => number
  bedomMening: (
    p: { original: string; mal: string; tillbaka: string },
    namn: string[],
  ) => { ok: boolean; poang: number; skal: string[] }
  sammanfatta: (b: unknown[]) => { godkanda: number; tomma: number }
  samsta: (b: { poang: number; skal: string[] }[], k?: number) => { poang: number }[]
}

const NAMN = ['Arbetsförmedlingen', 'a-kassa', 'CSN']
const ORIG = 'Du är kallad till Arbetsförmedlingen den 12 november klockan 10:30.'

describe('språkmätning (AIX26): siffror', () => {
  it('slår ihop tusentalsgrupper men delar tid och datum', () => {
    expect(m.hittaTal('1 200 kronor, 15 000, 10:30')).toEqual(['10', '1200', '15000', '30'])
  })

  it('räknar små tal skrivna som ord, men inte "en"', () => {
    expect(m.hittaTal('högst fyra meningar')).toEqual(['4'])
    expect(m.hittaTal('no more than Four sentences')).toEqual(['4'])
    expect(m.jamforTal('i 5 år', 'i fem år').saknade).toEqual([])
    expect(m.hittaTal('en gång')).toEqual([])
  })

  it('läser östarabiska och persiska siffror som vanliga', () => {
    expect(m.hittaTal('١٢ و ۳۰')).toEqual(['12', '30'])
  })

  it('hittar tal som tappats eller ändrats', () => {
    expect(m.jamforTal(ORIG, 'Mötet är den 12 november klockan 10:30').saknade).toEqual([])
    expect(m.jamforTal(ORIG, 'Mötet är den 13 november klockan 10:30').saknade).toEqual(['12'])
    expect(m.jamforTal(ORIG, 'Mötet är i november').andel).toBe(0)
  })

  it('en mening utan tal har full andel', () => {
    expect(m.jamforTal('Hej', 'Hello').andel).toBe(1)
  })
})

describe('språkmätning (AIX26): namn', () => {
  it('kräver att namnet står kvar, även böjt', () => {
    expect(m.jamforNamn(ORIG, 'يجب أن تأتي إلى Arbetsförmedlingen', NAMN).saknade).toEqual([])
    expect(m.jamforNamn(ORIG, 'يجب أن تأتي إلى مكتب التوظيف', NAMN).saknade).toEqual(['Arbetsförmedlingen'])
    expect(m.jamforNamn('Din a-kassa', 'Your a-kassan', NAMN).saknade).toEqual([])
  })

  it('kräver bara namn som finns i originalet', () => {
    expect(m.jamforNamn('Hej', 'Hello', NAMN).forvantat).toEqual([])
  })
})

describe('språkmätning (AIX26): likhet och längd', () => {
  it('identisk text = 1, oberoende text nära 0, tom = 0', () => {
    expect(m.likhet('Du får ersättning', 'Du får ersättning')).toBe(1)
    expect(m.likhet('Du får ersättning', 'xzqwv kjhg')).toBeLessThan(0.1)
    expect(m.likhet('', '')).toBe(0)
  })

  it('längdkvoten ser ett förkortat svar', () => {
    expect(m.langdkvot('abcdefghij', 'abcde')).toBe(0.5)
    expect(m.langdkvot('', 'abc')).toBe(0)
  })
})

describe('språkmätning (AIX26): bedömning', () => {
  const bra = { original: ORIG, mal: 'Arbetsförmedlingen 12 10:30 ...', tillbaka: 'Du är kallad till Arbetsförmedlingen den 12 november klockan 10:30.' }

  it('godkänner en trogen tillbakaöversättning', () => {
    const b = m.bedomMening(bra, NAMN)
    expect(b.ok).toBe(true)
    expect(b.poang).toBeGreaterThan(0.9)
  })

  it('ett tomt svar får poäng 0 trots att tillbakaöversättningen inte tappar något', () => {
    const b = m.bedomMening({ original: ORIG, mal: '', tillbaka: '' }, NAMN)
    expect(b.ok).toBe(false)
    expect(b.poang).toBe(0)
  })

  it('ett kraftigt förkortat svar underkänns på längdkvoten', () => {
    const b = m.bedomMening({ ...bra, tillbaka: 'Du är kallad.' }, NAMN)
    expect(b.skal.join()).toMatch(/längdkvot/)
    expect(b.poang).toBe(0)
  })

  it('en oöversatt kopia underkänns', () => {
    const b = m.bedomMening({ ...bra, mal: ORIG }, NAMN)
    expect(b.skal).toContain('oöversatt kopia')
    expect(b.poang).toBe(0)
  })

  it('översatt myndighetsnamn och tappat tal sänker poängen', () => {
    const utanNamn = m.bedomMening({ ...bra, mal: 'arbetsförmedling 12 10:30' }, NAMN)
    expect(utanNamn.skal.join()).toMatch(/namn borta/)
    const utanTal = m.bedomMening({ ...bra, tillbaka: 'Du är kallad till Arbetsförmedlingen i november.' }, NAMN)
    expect(utanTal.skal.join()).toMatch(/tal saknas i tillbaka/)
    expect(utanTal.poang).toBeLessThan(0.5)
  })

  it('samsta sorterar lägst poäng först och sammanfatta räknar tomma', () => {
    const a = m.bedomMening(bra, NAMN)
    const t = m.bedomMening({ original: ORIG, mal: '', tillbaka: '' }, NAMN)
    expect(m.samsta([a, t], 1)[0].poang).toBe(0)
    expect(m.sammanfatta([a, t])).toMatchObject({ godkanda: 1, tomma: 1 })
  })
})
