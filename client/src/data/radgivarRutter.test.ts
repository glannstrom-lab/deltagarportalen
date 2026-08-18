/**
 * Vakt för antagandet som `Layout.tsx` vilar på.
 *
 * Layout frågar `harRadgivarinnehall(pathname)` för att avgöra om sidan ska få
 * en 300 px rådgivarkolumn. Frågan besvaras enbart ur ruttabellen — inte ur
 * innehållet — eftersom `coaches.ts` är 43 kB och lazy-laddas med panelen.
 *
 * Det håller bara så länge de två har samma nyckelmängd. Glider de isär åt
 * ena hållet reserveras plats åt en panel som renderar null (den tomma
 * kolumnen som fanns på fyra hubbar fram till 2026-08-18); åt andra hållet
 * finns rådgivartext som ingen sida någonsin visar.
 */

import { describe, it, expect } from 'vitest'
import { PAGE_COACH_CONTENT, getCoachContentForPage } from './coaches'
import { ROUTE_TO_PAGE_KEY, harRadgivarinnehall } from './radgivarRutter'

describe('radgivarRutter mot coaches', () => {
  it('varje rutt i tabellen pekar på innehåll som finns', () => {
    const utanInnehall = ROUTE_TO_PAGE_KEY.filter(([, nyckel]) => !PAGE_COACH_CONTENT[nyckel])
    expect(utanInnehall).toEqual([])
  })

  it('varje innehållsnyckel nås från minst en rutt', () => {
    const naddaNycklar = new Set(ROUTE_TO_PAGE_KEY.map(([, nyckel]) => nyckel))
    const onadda = Object.keys(PAGE_COACH_CONTENT).filter((k) => !naddaNycklar.has(k))
    expect(onadda).toEqual([])
  })

  it('harRadgivarinnehall svarar samma sak som ett riktigt uppslag', () => {
    const rutter = [
      '/oversikt',
      '/cv',
      '/salary',
      '/spontanansökan',
      '/spontanans%C3%B6kan', // procentkodad — samma sida
      '/career/credentials', // undersida ärver förälderns rådgivare
      '/jobb', // hubb utan rådgivare
      '/nätverk',
      '/help',
      '/en-rutt-som-inte-finns',
    ]
    for (const rutt of rutter) {
      expect(harRadgivarinnehall(rutt), rutt).toBe(
        getCoachContentForPage(
          ROUTE_TO_PAGE_KEY.filter(([p]) => decodeURIComponent(rutt) === p || decodeURIComponent(rutt).startsWith(p + '/'))
            .sort((a, b) => b[0].length - a[0].length)[0]?.[1]
        ) !== null
      )
    }
  })
})
