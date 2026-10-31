import { createRequire } from 'node:module'
import { describe, expect, it } from 'vitest'

const require = createRequire(import.meta.url)
type Platshallare = { id: number; token: string; original: string }
type Aterstalld = {
  text: string
  saknade: string[]
  forvanskade: string[]
  dubblerade: string[]
  normaliserade: number
  ok: boolean
}
const m = require('../../scripts/lib/sprakmatning.cjs') as {
  skyddaNamn: (t: string, namn: string[], bojningar?: string[]) => { text: string; platshallare: Platshallare[] }
  aterstallNamn: (t: string, p: Platshallare[]) => Aterstalld
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

describe('språkmätning (AIX26 omgång 2): ordtal och siffror på arabisk skrift', () => {
  it('arabiska ordtal räknas som tal', () => {
    expect(m.hittaTal('لا تتجاوز أربع جمل')).toEqual(['4'])
    expect(m.hittaTal('وأربع جمل')).toEqual(['4'])
    expect(m.jamforTal('högst 4 meningar', 'لا تتجاوز أربع جمل').saknade).toEqual([])
  })

  it('dual av tidsenhet och sammansatta tal: "أسبوعين" = 2, "أحد عشر" = 11 (inte 10)', () => {
    expect(m.hittaTal('خلال أسبوعين')).toEqual(['2'])
    expect(m.hittaTal('أحد عشر يوما')).toEqual(['11'])
    expect(m.hittaTal('اثنا عشر شهرا')).toEqual(['12'])
  })

  it('persiska ordtal och persiska/östarabiska siffror', () => {
    expect(m.hittaTal('حداکثر چهار جمله')).toEqual(['4'])
    expect(m.hittaTal('ظرف ۳ هفته')).toEqual(['3'])
    expect(m.hittaTal('٦٤٥٠ كرونة')).toEqual(['6450'])
    expect(m.jamforTal('Din hyra är 6 450 kronor', 'إيجارك هو ٦٤٥٠ كرونة').saknade).toEqual([])
  })

  it('tappat tal på arabiska upptäcks fortfarande', () => {
    expect(m.jamforTal('högst 4 meningar', 'لا تتجاوز جمل قليلة').saknade).toEqual(['4'])
    expect(m.jamforTal('högst 4 meningar', 'لا تتجاوز خمس جمل').saknade).toEqual(['4'])
  })

  it('inledande nolla på korta tal är ingen skillnad ("08.00" = "8:00")', () => {
    expect(m.jamforTal('mellan 8 och 16', 'mellan 08.00 och 16.00').saknade).toEqual([])
    expect(m.hittaTal('010-123 45 67')).toContain('010')
  })
})

describe('språkmätning (AIX26 omgång 2): 12-timmarsformat', () => {
  it('"3:00 PM" är samma klockslag som 15:00', () => {
    expect(m.jamforTal('avboka senast klockan 15:00', 'cancel by 3:00 PM').saknade).toEqual([])
    expect(m.jamforTal('klockan 15:00', 'at 3 p.m.').saknade).toEqual([])
    expect(m.jamforTal('klockan 9:00', 'at 9:00 AM').saknade).toEqual([])
  })

  it('12 AM = 00 och 12 PM = 12, och fel eftermiddagstid upptäcks', () => {
    expect(m.hittaTal('12:30 PM')).toEqual(['12', '30'])
    expect(m.hittaTal('12:30 AM')).toEqual(['12', '30'].map((x, i) => (i === 0 ? '0' : x)).sort())
    expect(m.jamforTal('klockan 15:00', 'by 4:00 PM').saknade.length).toBeGreaterThan(0)
    expect(m.jamforTal('klockan 15:00', 'by 3:00 AM').saknade.length).toBeGreaterThan(0)
  })
})

describe('språkmätning (AIX26 omgång 2): mekaniskt namnskydd', () => {
  const skyddade = require('../i18n/skyddadeNamn.json') as { namn: string[]; bojningar: string[] }
  const skydda = (t: string) => m.skyddaNamn(t, skyddade.namn, skyddade.bojningar)

  it('byter varje skyddat namn mot en platshållare och sätter tillbaka det (tur och retur)', () => {
    const ursprung = 'Försäkringskassan har fattat ett beslut. Skatteverket och CSN skickar brev.'
    const s = skydda(ursprung)
    expect(s.text).toBe('⟦N1⟧ har fattat ett beslut. ⟦N2⟧ och ⟦N3⟧ skickar brev.')
    expect(s.platshallare.map((p) => p.original)).toEqual(['Försäkringskassan', 'Skatteverket', 'CSN'])
    const tillbaka = m.aterstallNamn('فورساکرینسکاسن ⟦N1⟧ و ⟦N2⟧ و ⟦N3⟧', s.platshallare)
    expect(tillbaka.text).toBe('فورساکرینسکاسن Försäkringskassan و Skatteverket و CSN')
    expect(tillbaka.ok).toBe(true)
    expect(m.aterstallNamn(s.text, s.platshallare).text).toBe(ursprung)
  })

  it('skyddar böjningsformer och behåller formen vid återinsättning', () => {
    const s = skydda('Skatteverkets brev om din a-kassan, personnumret och Yrkeshögskolan.')
    expect(s.text).toBe('⟦N1⟧ brev om din ⟦N2⟧, ⟦N3⟧ och ⟦N4⟧.')
    expect(s.platshallare.map((p) => p.original)).toEqual(['Skatteverkets', 'a-kassan', 'personnumret', 'Yrkeshögskolan'])
    expect(m.aterstallNamn(s.text, s.platshallare).text).toBe('Skatteverkets brev om din a-kassan, personnumret och Yrkeshögskolan.')
  })

  it('rör inte ord som bara innehåller ett namn eller saknar namn', () => {
    expect(skydda('Hej, jag söker jobb').text).toBe('Hej, jag söker jobb')
    expect(skydda('CSNx och xCSN').platshallare).toEqual([])
    expect(skydda('Jourhavande medmänniska nås dygnet runt').text).toBe('⟦N1⟧ nås dygnet runt')
  })

  it('två likadana namn får var sin platshållare', () => {
    const s = skydda('CSN betalar, och CSN skickar brev')
    expect(s.platshallare).toHaveLength(2)
    expect(m.aterstallNamn('x ⟦N2⟧ y ⟦N1⟧', s.platshallare).text).toBe('x CSN y CSN')
  })

  it('upptäcker en platshållare som modellen tappat', () => {
    const s = skydda('Skatteverket och CSN')
    const r = m.aterstallNamn('اداره مالیات و ⟦N2⟧', s.platshallare)
    expect(r.ok).toBe(false)
    expect(r.saknade).toEqual(['Skatteverket'])
  })

  it('upptäcker en förvanskad platshållare (okänt nummer, halv platshållare)', () => {
    const s = skydda('Skatteverket och CSN')
    const okant = m.aterstallNamn('⟦N1⟧ و ⟦N9⟧ و ⟦N2⟧', s.platshallare)
    expect(okant.ok).toBe(false)
    expect(okant.forvanskade).toEqual(['⟦N9⟧'])
    const halv = m.aterstallNamn('⟦N1⟧ و ⟦N2', s.platshallare)
    expect(halv.ok).toBe(false)
    expect(halv.saknade).toEqual(['CSN'])
    expect(halv.forvanskade).toEqual(['⟦'])
  })

  it('tål blanksteg, riktningstecken och östarabiska siffror i platshållaren men rapporterar det', () => {
    const s = skydda('Skatteverket och CSN')
    const r = m.aterstallNamn('⟦ N١ ⟧ و ⟦\u200fN2⟧', s.platshallare)
    expect(r.text).toBe('Skatteverket و CSN')
    expect(r.ok).toBe(true)
    expect(r.normaliserade).toBe(2)
  })

  it('rapporterar en dubblerad platshållare', () => {
    const s = skydda('CSN betalar')
    const r = m.aterstallNamn('⟦N1⟧ ⟦N1⟧', s.platshallare)
    expect(r.dubblerade).toEqual(['CSN'])
    expect(r.ok).toBe(true)
  })

  it('namnmåttet blir uppfyllt efter återinsättning även när modellen hade översatt omgivningen', () => {
    const orig = 'Försäkringskassan har fattat ett beslut om din sjukpenning.'
    const s = skydda(orig)
    const mal = m.aterstallNamn('⟦N1⟧ تصمیمی درباره مزایای بیماری شما اتخاذ کرده است', s.platshallare).text
    expect(m.jamforNamn(orig, mal, skyddade.namn).saknade).toEqual([])
  })
})
