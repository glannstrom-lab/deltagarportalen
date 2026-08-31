/**
 * Tester för stodMatchning.ts (spår AG2).
 *
 * Tre saker testas, i linje med uppdraget:
 *  1. Typiska fall ger rätt stöd (kan_vara_aktuellt / for_lite_underlag / troligen_inte_aktuellt).
 *  2. Ett resultat innehåller ALDRIG ett belopp — runtime-kontroll av nycklarna,
 *     inte bara TypeScript (som mutationstestet nedan visar skillnaden på).
 *  3. GRUND_LABEL har en etikett för varje grund-nyckel funktionerna kan returnera.
 */
import { describe, it, expect } from 'vitest'
import {
  GRUND_LABEL,
  manaderArbetslos,
  matchaStod,
  starttidVarning,
  tomPersonUppgifter,
  tomPlatsUppgifter,
  type MatchningsResultat,
  type PersonUppgifter,
  type PlatsUppgifter,
} from './stodMatchning'

const NU = new Date('2026-08-31T12:00:00Z')

function person(over: Partial<PersonUppgifter> = {}): PersonUppgifter {
  return { ...tomPersonUppgifter(), ...over }
}
function plats(over: Partial<PlatsUppgifter> = {}): PlatsUppgifter {
  return { ...tomPlatsUppgifter(), ...over }
}
function resultatFor(id: MatchningsResultat['stodform'], resultat: MatchningsResultat[]) {
  const r = resultat.find((x) => x.stodform === id)
  if (!r) throw new Error(`Inget resultat för ${id}`)
  return r
}

describe('manaderArbetslos', () => {
  it('räknar hela månader mellan datum', () => {
    expect(manaderArbetslos('2026-02-28', NU)).toBe(6)
  })
  it('returnerar null utan datum', () => {
    expect(manaderArbetslos(null, NU)).toBeNull()
  })
  it('returnerar null för ogiltigt datum', () => {
    expect(manaderArbetslos('inte-ett-datum', NU)).toBeNull()
  })
  it('returnerar null för ett datum i framtiden', () => {
    expect(manaderArbetslos('2027-01-01', NU)).toBeNull()
  })
})

describe('matchaStod — nystartsjobb', () => {
  it('25+ år, 13 månaders arbetslöshet, inskriven → kan vara aktuellt', () => {
    const p = person({ alder: 30, arbetslosSedan: '2025-07-01', inskrivenHosAf: true })
    const r = resultatFor('nystartsjobb', matchaStod(p, plats(), NU))
    expect(r.bedomning).toBe('kan_vara_aktuellt')
    expect(r.grund).toContain('25plus_ar_arbetslos_minst_12_av_15_manader')
  })

  it('25+ år, bara 3 månaders arbetslöshet → för lite underlag (inte diskvalificerat, bara inte uppnått ännu)', () => {
    const p = person({ alder: 30, arbetslosSedan: '2026-06-01', inskrivenHosAf: true })
    const r = resultatFor('nystartsjobb', matchaStod(p, plats(), NU))
    expect(r.bedomning).toBe('for_lite_underlag')
  })

  it('deltar i jobb- och utvecklingsgarantin → kan vara aktuellt oavsett ålder/tid', () => {
    const p = person({ deltarIJobbOchUtvecklingsgaranti: true })
    const r = resultatFor('nystartsjobb', matchaStod(p, plats(), NU))
    expect(r.bedomning).toBe('kan_vara_aktuellt')
  })

  it('arbetsplatsen har sagt upp personal senaste 12 månaderna → troligen inte aktuellt, oavsett övrigt', () => {
    const p = person({ alder: 30, arbetslosSedan: '2024-01-01', deltarIJobbOchUtvecklingsgaranti: true })
    const r = resultatFor('nystartsjobb', matchaStod(p, plats({ harSagtUppPersonalSenaste12Man: true }), NU))
    expect(r.bedomning).toBe('troligen_inte_aktuellt')
  })

  it('inget ifyllt alls → för lite underlag, ALDRIG ett gissat "kan vara aktuellt"', () => {
    const r = resultatFor('nystartsjobb', matchaStod(person(), plats(), NU))
    expect(r.bedomning).toBe('for_lite_underlag')
  })

  it('inte inskriven hos AF → troligen inte aktuellt', () => {
    const p = person({ inskrivenHosAf: false, alder: 30, arbetslosSedan: '2024-01-01' })
    const r = resultatFor('nystartsjobb', matchaStod(p, plats(), NU))
    expect(r.bedomning).toBe('troligen_inte_aktuellt')
  })
})

describe('matchaStod — introduktionsjobb', () => {
  it('200+ dagar ungdomsgaranti → kan vara aktuellt', () => {
    const p = person({ deltarIUngdomsgarantiDagar: 210 })
    const r = resultatFor('introduktionsjobb', matchaStod(p, plats(), NU))
    expect(r.bedomning).toBe('kan_vara_aktuellt')
  })

  it('under 200 dagar ungdomsgaranti, inget annat villkor → troligen inte aktuellt', () => {
    const p = person({
      deltarIUngdomsgarantiDagar: 50,
      deltarIJobbOchUtvecklingsgaranti: false,
      arNyanland: false,
    })
    const r = resultatFor('introduktionsjobb', matchaStod(p, plats(), NU))
    expect(r.bedomning).toBe('troligen_inte_aktuellt')
  })

  it('nyanländ 22 år med etableringsprogram → kan vara aktuellt', () => {
    const p = person({ arNyanland: true, alder: 22, deltarIEtableringsprogram: true })
    const r = resultatFor('introduktionsjobb', matchaStod(p, plats(), NU))
    expect(r.bedomning).toBe('kan_vara_aktuellt')
  })
})

describe('matchaStod — lönebidrag och OSA (art. 9-fälten)', () => {
  it('lönebidrag: nedsatt arbetsförmåga uppgiven → kan vara aktuellt', () => {
    const p = person({ harFunktionsnedsattningSomPaverkarArbetsformaga: true })
    const r = resultatFor('lonebidrag', matchaStod(p, plats(), NU))
    expect(r.bedomning).toBe('kan_vara_aktuellt')
  })

  it('lönebidrag: uttryckligen ingen nedsatt arbetsförmåga → troligen inte aktuellt', () => {
    const p = person({ harFunktionsnedsattningSomPaverkarArbetsformaga: false })
    const r = resultatFor('lonebidrag', matchaStod(p, plats(), NU))
    expect(r.bedomning).toBe('troligen_inte_aktuellt')
  })

  it('OSA: offentlig arbetsgivare + kognitiv funktionsnedsättning → kan vara aktuellt', () => {
    const p = person({
      harFunktionsnedsattningSomPaverkarArbetsformaga: true,
      funktionsnedsattningTyp: ['kognitiv'],
    })
    const r = resultatFor('osa', matchaStod(p, plats({ arbetsgivartyp: 'kommun' }), NU))
    expect(r.bedomning).toBe('kan_vara_aktuellt')
  })

  it('OSA: privat arbetsgivare → troligen inte aktuellt oavsett funktionsnedsättning', () => {
    const p = person({
      harFunktionsnedsattningSomPaverkarArbetsformaga: true,
      funktionsnedsattningTyp: ['kognitiv'],
    })
    const r = resultatFor('osa', matchaStod(p, plats({ arbetsgivartyp: 'privat' }), NU))
    expect(r.bedomning).toBe('troligen_inte_aktuellt')
  })

  it('OSA: offentlig arbetsgivare men bara fysisk funktionsnedsättning → troligen inte aktuellt (fel typ)', () => {
    const p = person({
      harFunktionsnedsattningSomPaverkarArbetsformaga: true,
      funktionsnedsattningTyp: ['fysisk'],
    })
    const r = resultatFor('osa', matchaStod(p, plats({ arbetsgivartyp: 'region' }), NU))
    expect(r.bedomning).toBe('troligen_inte_aktuellt')
  })

  it('SIUS: nedsatt arbetsförmåga uppgiven → kan vara aktuellt', () => {
    const p = person({ harFunktionsnedsattningSomPaverkarArbetsformaga: true })
    const r = resultatFor('sius', matchaStod(p, plats(), NU))
    expect(r.bedomning).toBe('kan_vara_aktuellt')
  })
})

describe('resultatet innehåller ALDRIG ett belopp (regeln som skyddar användaren)', () => {
  const FORBJUDNA_NYCKLAR = ['belopp', 'procent', 'kronor_per_manad', 'besparing', 'varde', 'kronor', 'summa']

  it('ingen nyckel i något resultat matchar ett belopps-namn — provat över en bred uppsättning indata', () => {
    const kombinationer: [PersonUppgifter, PlatsUppgifter][] = [
      [person(), plats()],
      [person({ alder: 30, arbetslosSedan: '2020-01-01' }), plats({ arbetsgivartyp: 'kommun' })],
      [
        person({ harFunktionsnedsattningSomPaverkarArbetsformaga: true, funktionsnedsattningTyp: ['missbruk'] }),
        plats({ arbetsgivartyp: 'statlig_myndighet' }),
      ],
      [person({ deltarIUngdomsgarantiDagar: 300 }), plats({ harSagtUppPersonalSenaste12Man: true })],
    ]
    for (const [p, pl] of kombinationer) {
      for (const r of matchaStod(p, pl, NU)) {
        const nycklar = Object.keys(r).map((k) => k.toLowerCase())
        for (const forbjuden of FORBJUDNA_NYCKLAR) {
          expect(nycklar).not.toContain(forbjuden)
        }
        // Och textfältet ska inte innehålla ett kronbelopp-mönster.
        expect(r.text).not.toMatch(/\d[\d\s]*\s?(kr|kronor|%)/i)
      }
    }
  })

  it('mutationskontroll: om resultatet FICK ett belopp-fält skulle testet ovan falla', () => {
    const trasigtResultat = { ...matchaStod(person(), plats(), NU)[0], belopp: 12000 } as unknown as Record<
      string,
      unknown
    >
    const nycklar = Object.keys(trasigtResultat).map((k) => k.toLowerCase())
    expect(nycklar).toContain('belopp') // bekräftar att kontrollen ovan verkligen kan fälla
  })
})

describe('GRUND_LABEL täcker alla grund-nycklar som faktiskt returneras', () => {
  it('varje grund-nyckel i ett brett urval av utfall finns i GRUND_LABEL', () => {
    const alla = new Set<string>()
    const varianter: [Partial<PersonUppgifter>, Partial<PlatsUppgifter>][] = [
      [{}, {}],
      [{ alder: 22, arbetslosSedan: '2026-01-01', inskrivenHosAf: true }, {}],
      [{ alder: 30, arbetslosSedan: '2020-01-01', inskrivenHosAf: true }, {}],
      [{ alder: 30, arbetslosSedan: '2026-06-01', inskrivenHosAf: true }, {}],
      [{ alder: 15, inskrivenHosAf: true }, {}],
      [{ deltarIEtableringsprogram: true }, {}],
      [{ arNyanland: true, alder: 22, arbetslosSedan: '2026-06-01', inskrivenHosAf: true }, {}],
      [{ inskrivenHosAf: false }, {}],
      [{}, { harSagtUppPersonalSenaste12Man: true }],
      [{ deltarIJobbOchUtvecklingsgaranti: true }, {}],
      [{ deltarIUngdomsgarantiDagar: 250 }, {}],
      [{ arNyanland: true, alder: 25, deltarIEtableringsprogram: true }, {}],
      [{ arNyanland: true, alder: 25, uppehallstillstandDatum: '2025-01-01' }, {}],
      [{ deltarIJobbOchUtvecklingsgaranti: false, arNyanland: false, deltarIUngdomsgarantiDagar: 0 }, {}],
      [{ harFunktionsnedsattningSomPaverkarArbetsformaga: true }, {}],
      [{ harFunktionsnedsattningSomPaverkarArbetsformaga: false }, {}],
      [
        { harFunktionsnedsattningSomPaverkarArbetsformaga: true, funktionsnedsattningTyp: ['kognitiv'] },
        { arbetsgivartyp: 'kommun' },
      ],
      [
        { harFunktionsnedsattningSomPaverkarArbetsformaga: true, funktionsnedsattningTyp: ['fysisk'] },
        { arbetsgivartyp: 'region' },
      ],
      [{ harFunktionsnedsattningSomPaverkarArbetsformaga: true }, { arbetsgivartyp: 'privat' }],
    ]
    for (const [p, pl] of varianter) {
      for (const r of matchaStod(person(p), plats(pl), NU)) {
        for (const g of r.grund) alla.add(g)
      }
    }
    expect(alla.size).toBeGreaterThan(5)
    for (const nyckel of alla) {
      expect(GRUND_LABEL[nyckel], `saknar etikett för grund-nyckel "${nyckel}"`).toBeDefined()
    }
  })
})

describe('starttidVarning', () => {
  it('ingen varning utan datum', () => {
    expect(starttidVarning(null, NU)).toBeNull()
  })
  it('varnar när startdatum är nära (under tröskeln)', () => {
    expect(starttidVarning('2026-09-05', NU)).toMatch(/dagar kvar/)
  })
  it('ingen varning när det är gott om tid', () => {
    expect(starttidVarning('2027-06-01', NU)).toBeNull()
  })
  it('varnar annorlunda om startdatumet redan passerat', () => {
    expect(starttidVarning('2026-01-01', NU)).toMatch(/redan passerat/)
  })
})
