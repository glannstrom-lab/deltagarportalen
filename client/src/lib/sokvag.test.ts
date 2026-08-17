/**
 * Sökvägar med svenska tecken.
 *
 * Två av portalens rutter heter `/spontanansökan` och `/nätverk`. React Router
 * ger deras pathname procentkodad, och varje jämförelse i koden är skriven med
 * `ö` respektive `ä`. Uppmätt i webbläsaren 2026-08-17, före rättningen:
 *
 *   /spontanansökan  aktivUnderside: null   radgivarpanel: false
 *   /nätverk         aktivUnderside: null   radgivarpanel: false
 *   /salary          aktivUnderside: "Lön & Förhandling"   radgivarpanel: true
 *
 * Två sidor av tjugofem tappade alltså både aktiv markering i navigationen och
 * hela rådgivarkolumnen, tyst — en sökväg som inte matchar ser exakt likadan ut
 * som en sida utan innehåll.
 */

import { describe, it, expect } from 'vitest'
import { avkodaSokvag } from './sokvag'
import { getPageKeyForPath } from '@/data/coaches'

describe('avkodaSokvag', () => {
  it('avkodar de två rutter som faktiskt har svenska tecken', () => {
    expect(avkodaSokvag('/spontanans%C3%B6kan')).toBe('/spontanansökan')
    expect(avkodaSokvag('/n%C3%A4tverk')).toBe('/nätverk')
  })

  it('lämnar vanliga sökvägar orörda', () => {
    expect(avkodaSokvag('/salary')).toBe('/salary')
    expect(avkodaSokvag('/job-search')).toBe('/job-search')
  })

  it('kraschar inte på en trasig procentsekvens', () => {
    // decodeURIComponent kastar här. En felskriven URL ska inte ta ner naven.
    expect(avkodaSokvag('/s%E0%A4%A')).toBe('/s%E0%A4%A')
  })

  it('klarar tom sträng', () => {
    expect(avkodaSokvag('')).toBe('')
  })
})

describe('rådgivaruppslaget hittar de kodade rutterna', () => {
  it('kodad och avkodad form ger samma sidnyckel', () => {
    expect(getPageKeyForPath('/spontanans%C3%B6kan')).toBe('spontaneous')
    expect(getPageKeyForPath('/spontanansökan')).toBe('spontaneous')
  })

  it('undersidor under en kodad rutt matchar också', () => {
    expect(getPageKeyForPath('/spontanans%C3%B6kan/ny')).toBe('spontaneous')
  })
})

describe('negativ kontroll — testerna kan falla', () => {
  it('avkodningen gör faktiskt något', () => {
    // Första utkastet skrev `expect('/a%C3%B6' === '/aö').toBe(false)`, vilket
    // testar JavaScript och inte den här filen — och som TypeScript dessutom
    // avvisade eftersom två literaler aldrig kan överlappa. Det här är samma
    // avsikt, men mot koden: funktionen måste ha ändrat strängen.
    expect(avkodaSokvag('/spontanans%C3%B6kan')).not.toBe('/spontanans%C3%B6kan')
  })

  it('uppslaget returnerar inte bara alltid något', () => {
    expect(getPageKeyForPath('/en-rutt-som-inte-finns')).toBeUndefined()
  })
})
