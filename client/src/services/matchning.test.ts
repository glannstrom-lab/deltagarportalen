import { describe, it, expect } from 'vitest'
import { aktivaFaktorer, harData, poangsatt, soktermer, BRANSCH_TILL_YRKESOMRADE, type Faktor, type MatchUnderlag } from './matchning'
import type { PlatsbankenJob } from './arbetsformedlingenApi'

const tom: MatchUnderlag = {
  onskadeYrken: [], tidigareYrken: [], intresseYrken: [], kompetenser: [], utbildning: [],
  uteslutnaYrken: [], branscher: [], anstallningsformer: [], distans: null, korkort: [], harBil: false,
}
const jobb = (o: Partial<PlatsbankenJob> & { text?: string }): PlatsbankenJob => ({
  id: 'j', headline: 'Lagerarbetare', employer: { name: 'Nordfrakt' },
  description: { text: o.text ?? 'Vi söker en lagerarbetare med erfarenhet av WMS.' },
  occupation: { label: 'Lagerarbetare' }, occupation_field: { label: 'Transport, distribution, lager' },
  ...o,
} as unknown as PlatsbankenJob)
const alla = (u: MatchUnderlag, av: Faktor[] = []) => aktivaFaktorer(u, new Set(av))

describe('matchning med valbara faktorer', () => {
  it('en faktor utan data går inte att välja — men legitimationsfiltret finns alltid', () => {
    expect(harData(tom, 'onskadeYrken')).toBe(false)
    expect(harData(tom, 'legitimation')).toBe(true)
    expect([...alla(tom)]).toEqual(['legitimation'])
  })

  it('bortkryssade faktorer ger inga söktermer', () => {
    const u = { ...tom, onskadeYrken: ['Lagerarbetare'], tidigareYrken: ['Kassabiträde'] }
    expect(soktermer(u, alla(u))).toEqual(['Lagerarbetare', 'Kassabiträde'])
    expect(soktermer(u, alla(u, ['tidigareYrken']))).toEqual(['Lagerarbetare'])
  })

  it('söktermerna dubbleras inte och önskade yrken kommer först', () => {
    const u = { ...tom, onskadeYrken: ['Lagerarbetare'], tidigareYrken: ['lagerarbetare', 'Truckförare'], intresseYrken: ['Truckförare/Lagerarbetare'] }
    expect(soktermer(u, alla(u))).toEqual(['Lagerarbetare', 'Truckförare'])
  })

  it('en poängskala: önskat yrke i rubriken är basen, kompetenser läggs ovanpå', () => {
    const u = { ...tom, onskadeYrken: ['Lagerarbetare'], kompetenser: ['WMS'] }
    const p = poangsatt(jobb({}), 'Lagerarbetare', u, alla(u))!
    expect(p.score).toBe(66)
    expect(p.skal[0]).toBe('Önskat yrke: Lagerarbetare')
    expect(p.skal).toContain('WMS')
  })

  it('samma jobb utan kompetensfaktorn får lägre poäng — kryssen styr', () => {
    const u = { ...tom, onskadeYrken: ['Lagerarbetare'], kompetenser: ['WMS'] }
    expect(poangsatt(jobb({}), 'x', u, alla(u, ['kompetenser']))!.score).toBe(60)
  })

  it('bransch: yrkesområdet ur annonsen jämförs med profilens bransch', () => {
    const u = { ...tom, onskadeYrken: ['Lagerarbetare'], branscher: ['transport'] }
    const p = poangsatt(jobb({}), 'x', u, alla(u))!
    expect(p.score).toBe(68)
    expect(p.skal).toContain(`Din bransch: ${BRANSCH_TILL_YRKESOMRADE.transport}`)
  })

  it('besvär: ett yrke intresseguiden lämnat bort filtreras bort — men bara när faktorn är vald', () => {
    const u = { ...tom, onskadeYrken: ['Lagerarbetare'], uteslutnaYrken: ['Lagerarbetare/Truckförare'] }
    expect(poangsatt(jobb({}), 'x', u, alla(u))).toBeNull()
    expect(poangsatt(jobb({}), 'x', u, alla(u, ['besvar']))).not.toBeNull()
  })

  it('utan yrkessignal får jobbet en grundpoäng och skälet säger vilken sökning som hittade det', () => {
    const u = { ...tom, kompetenser: ['Svetsning'] }
    const p = poangsatt(jobb({ headline: 'Administratör', occupation: { label: 'Administratör' }, text: 'Erfarenhet av svetsning' } as never), 'Svetsning', u, alla(u))!
    expect(p.score).toBe(31)
    expect(p.skal[0]).toMatch(/Hittades via sökningen/)
  })
})
