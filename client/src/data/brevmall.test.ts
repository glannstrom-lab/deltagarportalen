/**
 * Vakt för den handskrivna brevmallen.
 *
 * Mallen finns för att en modell som inte vet något om personen ändå skriver
 * påståenden om henne — uppmätt tre gånger mot prod. Det enda som gör mallen
 * bättre än AI:n är att den inte påstår något. Går den egenskapen förlorad
 * finns ingen anledning att ha den kvar, så testerna vaktar just det.
 */
import { describe, it, expect } from 'vitest'
import { byggBrevmall, raknaLuckor, LUCKA } from './brevmall'

describe('byggBrevmall', () => {
  it('påstår ingenting om personen — varje rad om henne är en lucka', () => {
    const mall = byggBrevmall({ foretag: 'Lagerbolaget AB', titel: 'Lagermedarbetare' })
    // Exakt de fraser modellen hittade på i drift.
    expect(mall).not.toMatch(/goda kunskaper i svenska/i)
    expect(mall).not.toMatch(/är van vid/i)
    expect(mall).not.toMatch(/trivs (med|i)/i)
    expect(mall).not.toMatch(/jag är noggrann/i)
    // Och ingen påhittad merit.
    expect(mall).not.toMatch(/truckkort/i)
    expect(mall).not.toMatch(/erfarenhet av lager/i)
  })

  it('har luckor att fylla i, med ledtråd', () => {
    const mall = byggBrevmall({ foretag: 'X', titel: 'Y' })
    expect(raknaLuckor(mall)).toBeGreaterThanOrEqual(4)
    // Varje lucka ska följas av en parentes som säger vad man skriver där.
    for (const rad of mall.split('\n').filter((r) => r.includes(LUCKA))) {
      expect(rad).toMatch(/\(/)
    }
  })

  it('fyller i företag och titel — de kommer från annonsen, inte från personen', () => {
    const mall = byggBrevmall({ foretag: 'Lagerbolaget AB', titel: 'Lagermedarbetare' })
    expect(mall).toContain('Lagerbolaget AB')
    expect(mall).toContain('Lagermedarbetare')
  })

  it('hittar inte på ett företagsnamn när annonsen saknar det', () => {
    const mall = byggBrevmall({})
    expect(mall).toContain('den utlysta tjänsten')
    expect(mall).not.toMatch(/undefined|null|\[.*\]/)
  })

  it('klarar att bara ett av fälten finns', () => {
    expect(byggBrevmall({ titel: 'Snickare' })).toContain('Snickare')
    expect(byggBrevmall({ foretag: 'Bygg AB' })).toContain('Bygg AB')
    expect(byggBrevmall({ foretag: '   ' })).toContain('den utlysta tjänsten')
  })

  it('innehåller inga platshållare av den sort B21 förbjöd', () => {
    // `[ Ditt namn ]` och liknande var en del av det som gjorde
    // mockGenerateLetter oanvändbar. Mallen signerar inte alls.
    const mall = byggBrevmall({ foretag: 'X', titel: 'Y' })
    expect(mall).not.toMatch(/\[\s*ditt namn\s*\]/i)
    expect(mall).not.toMatch(/med vänliga hälsningar/i)
  })
})
