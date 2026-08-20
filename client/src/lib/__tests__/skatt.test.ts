import { describe, it, expect } from 'vitest'
import {
  beraknaNetto,
  grundavdragPerAr,
  jobbskatteavdragPerAr,
  KOMMUNALSKATT_RIKSGENOMSNITT,
  SKATTEAR,
} from '../skatt'

/**
 * Testerna vaktar det som gick sönder: kalkylatorn räknade nettolön som
 * `brutto * 0.78` oavsett inkomst. Assertionerna nedan ska falla om någon
 * återinför en platt schablon, tar bort den statliga skatten eller glömmer
 * jobbskatteavdraget.
 */
describe('skatt — grundavdrag', () => {
  it('följer trappan: högst i mitten, lägst för höga inkomster', () => {
    const lag = grundavdragPerAr(120_000)
    const mitten = grundavdragPerAr(180_000)
    const hog = grundavdragPerAr(600_000)

    expect(mitten).toBeGreaterThan(lag)
    expect(mitten).toBeGreaterThan(hog)
    // Golvet i trappan (0,293 prisbasbelopp) ligger strax över 17 000 kr.
    expect(hog).toBeGreaterThan(17_000)
    expect(hog).toBeLessThan(17_500)
  })

  it('överstiger aldrig inkomsten', () => {
    expect(grundavdragPerAr(5_000)).toBeLessThanOrEqual(5_000)
  })
})

describe('skatt — jobbskatteavdrag', () => {
  it('växer med inkomsten upp till taket och planar sedan ut', () => {
    const vid20k = jobbskatteavdragPerAr(20_000 * 12, KOMMUNALSKATT_RIKSGENOMSNITT)
    const vid40k = jobbskatteavdragPerAr(40_000 * 12, KOMMUNALSKATT_RIKSGENOMSNITT)
    const vid90k = jobbskatteavdragPerAr(90_000 * 12, KOMMUNALSKATT_RIKSGENOMSNITT)

    expect(vid40k).toBeGreaterThan(vid20k)
    expect(vid90k).toBeCloseTo(vid40k, -2) // taket är nått, avdraget slutar växa
  })

  it('är större i en kommun med högre skattesats', () => {
    const lagSats = jobbskatteavdragPerAr(400_000, 29)
    const hogSats = jobbskatteavdragPerAr(400_000, 35)
    expect(hogSats).toBeGreaterThan(lagSats)
  })
})

describe('skatt — beraknaNetto', () => {
  it('returnerar null för indata som inte går att räkna på', () => {
    expect(beraknaNetto(0)).toBeNull()
    expect(beraknaNetto(-1000)).toBeNull()
    expect(beraknaNetto(Number.NaN)).toBeNull()
  })

  it('är INTE en platt procentsats — effektiv skatt stiger med inkomsten', () => {
    const lag = beraknaNetto(25_000)!
    const mellan = beraknaNetto(45_000)!
    const hog = beraknaNetto(85_000)!

    expect(lag.effektivSkattProcent).toBeLessThan(mellan.effektivSkattProcent)
    expect(mellan.effektivSkattProcent).toBeLessThan(hog.effektivSkattProcent)
    // Den gamla schablonen gav 22,0 % överallt. Ingen av de tre får ligga där.
    expect(lag.effektivSkattProcent).toBeLessThan(21)
    expect(hog.effektivSkattProcent).toBeGreaterThan(30)
  })

  it('tar ut statlig skatt först över brytpunkten', () => {
    expect(beraknaNetto(40_000)!.poster.statligSkatt).toBe(0)
    expect(beraknaNetto(70_000)!.poster.statligSkatt).toBeGreaterThan(0)
  })

  it('ligger nära verkliga tabellvärden för vanliga löner', () => {
    // Referens: Skatteverkets skattetabeller 2025 vid riksgenomsnittlig
    // kommunalskatt. Toleransen är 3 % — modellen är en uppskattning, men
    // ska inte kunna glida iväg utan att ett test märker det.
    const facit: Array<[number, number]> = [
      [25_000, 19_900],
      [30_000, 23_400],
      [40_000, 30_200],
      [50_000, 36_600],
      [70_000, 46_800],
    ]
    for (const [brutto, forvantatNetto] of facit) {
      const netto = beraknaNetto(brutto)!.nettoManad
      expect(Math.abs(netto - forvantatNetto) / forvantatNetto).toBeLessThan(0.03)
    }
  })

  it('ger lägre netto i en kommun med högre skatt', () => {
    const billig = beraknaNetto(35_000, 29)!
    const dyr = beraknaNetto(35_000, 35)!
    expect(dyr.nettoManad).toBeLessThan(billig.nettoManad)
  })

  it('redovisar sina antaganden så gränssnittet kan skriva ut dem', () => {
    const r = beraknaNetto(35_000, 33.5)!
    expect(r.antaganden.ar).toBe(SKATTEAR)
    expect(r.antaganden.kommunalskattProcent).toBe(33.5)
  })

  it('summerar: brutto minus skatt är netto', () => {
    const r = beraknaNetto(52_000)!
    expect(r.nettoManad + r.skattManad).toBe(r.bruttoManad)
  })
})
