/**
 * Länslistan och bryggan till Yrkesbarometern (O8, 2026-08-26).
 *
 * ## Varför den här filen finns
 *
 * `AF_REGIONS` bär numera två kodsystem: NUTS-3 för Arbetsförmedlingens
 * JobSearch, och SCB:s länskod för Yrkesbarometern. De ser lika officiella ut
 * och är lätta att blanda ihop — en felskriven `lanskod` ger tyst fel prognos
 * för ett helt län, och ingenting i UI:t skulle avslöja det.
 *
 * Testet kontrollerar det som går att kontrollera utan nät: att alla 21 län
 * finns, att båda koduppsättningarna är unika, att formen stämmer, och att de
 * fyra luckorna i SCB:s serie (02, 11, 15, 16 — sammanslagna län) inte råkat
 * fyllas i. Koderna själva verifierades mot den skarpa filen när de skrevs in,
 * se docstringen i `afRegions.ts`.
 *
 * Testet kan falla: byt en `lanskod` mot en dubblett och unikhetstestet faller;
 * ta bort ett län och antalet faller; skriv `1` i stället för `01` och formen
 * faller.
 */

import { describe, it, expect } from 'vitest'
import { AF_REGIONS, getAfRegionName, getLanskod } from './afRegions'

describe('AF_REGIONS', () => {
  it('täcker alla 21 län', () => {
    expect(AF_REGIONS).toHaveLength(21)
  })

  it('har unika NUTS-koder', () => {
    const koder = AF_REGIONS.map((r) => r.code)
    expect(new Set(koder).size).toBe(koder.length)
  })

  it('har unika länskoder — två län med samma kod ger fel prognos för ett av dem', () => {
    const koder = AF_REGIONS.map((r) => r.lanskod)
    expect(new Set(koder).size).toBe(koder.length)
  })

  it('länskoderna är tvåsiffriga med inledande nolla', () => {
    for (const region of AF_REGIONS) {
      expect(region.lanskod, region.name).toMatch(/^\d{2}$/)
    }
  })

  it('använder inte de fyra koder som inte finns i SCB:s serie', () => {
    // 02, 11, 15 och 16 är sammanslagna län. Dyker någon av dem upp är listan
    // gissad, inte hämtad.
    const koder = AF_REGIONS.map((r) => r.lanskod)
    for (const saknad of ['02', '11', '15', '16']) {
      expect(koder).not.toContain(saknad)
    }
  })

  it('använder inte "00" — det är riket, inte ett län', () => {
    expect(AF_REGIONS.map((r) => r.lanskod)).not.toContain('00')
  })

  it('varje län har ett namn som slutar på "län"', () => {
    for (const region of AF_REGIONS) {
      expect(region.name, region.code).toMatch(/ län$/)
    }
  })
})

describe('getLanskod', () => {
  it('översätter NUTS till SCB:s länskod', () => {
    expect(getLanskod('SE110')).toBe('01')
    expect(getLanskod('SE232')).toBe('14')
    expect(getLanskod('SE332')).toBe('25')
  })

  it('returnerar null för okänd kod i stället för att gissa', () => {
    expect(getLanskod('SE999')).toBeNull()
    expect(getLanskod('')).toBeNull()
  })
})

describe('getAfRegionName', () => {
  it('ger länsnamnet', () => {
    expect(getAfRegionName('SE224')).toBe('Skåne län')
  })

  it('faller tillbaka på koden när den är okänd', () => {
    expect(getAfRegionName('SE999')).toBe('SE999')
  })
})
