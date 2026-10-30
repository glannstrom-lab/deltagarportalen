/**
 * AIX27: rättstavning. Det som ska gå att lita på är kontrollen i kod, inte
 * prompten: ett förslag som lägger till en merit, en siffra eller ett nytt
 * innehållsord ska aldrig nå personen, och en för stor lista avvisas helt.
 */
import { describe, it, expect } from 'vitest'

/* eslint-disable @typescript-eslint/no-require-imports */
const { arRattstavning, validera, MAX_ANDRINGAR } = require('../../api/_prompts/_rattstavning.js') as {
  arRattstavning: (fore: string, efter: string) => { ok: boolean; skal?: string }
  validera: (v: unknown, text: string) => { ok: boolean; error?: string; value?: { andringar: Array<{ fore: string; efter: string }> } }
  MAX_ANDRINGAR: number
}
const ansokan = require('../../api/_prompts/ansokan.js') as Record<string, (d: unknown) => { system: string; user: string; maxTokens: number; parseJson?: boolean; responseKey: string }>

describe('AIX27: arRattstavning (deterministisk regel)', () => {
  it.each([
    ['nogrann', 'noggrann'],
    ['jag har arbetat pa lager', 'jag har arbetat på lager'],
    ['ett skola', 'en skola'],
    ['hem sida', 'hemsida'],
    ['lagerarbete erfarenhet', 'lagerarbete, erfarenhet'],
    ['i i butiken', 'i butiken'],
    ['Hej jag heter Anna', 'Hej, jag heter Anna'],
  ])('släpper igenom %s -> %s', (fore, efter) => {
    expect(arRattstavning(fore, efter).ok, JSON.stringify(arRattstavning(fore, efter))).toBe(true)
  })

  it.each([
    // tillagda substantiv / meriter
    ['jag har erfarenhet', 'jag har erfarenhet av truckkörkort'],
    ['jag är noggrann', 'jag är noggrann ledare'],
    ['jobbade i butik', 'jobbade som butikschef'],
    ['kassa', 'kassör'],
    ['jag har körkort', 'jag har körkort och truckkort'],
    // siffror
    ['arbetade 5 år', 'arbetade 15 år'],
    ['arbetade 5 år', 'arbetade år'],
    ['sedan 2019', 'sedan 2009'],
    // innehåll som försvinner
    ['jag har lång erfarenhet av lager', 'jag har lager'],
    // omskrivning
    ['Jag söker tjänsten', 'Härmed ansöker jag om befattningen'],
  ])('stoppar %s -> %s', (fore, efter) => {
    expect(arRattstavning(fore, efter).ok, `${fore} -> ${efter}`).toBe(false)
  })

  it('stoppar för långa bitar och oförändrade rader', () => {
    expect(arRattstavning('a', 'a').ok).toBe(false)
    const lang = 'ord '.repeat(30)
    expect(arRattstavning(lang, lang + 'x').ok).toBe(false)
  })
})

describe('AIX27: validera (hela svaret mot texten)', () => {
  const TEXT = 'Hej! Jag heter Anna och söker tjänsten. Jag är nogrann och har jobbat på lager i 3 år. Jag trivs bra.'

  it('behåller giltiga rättelser och släpper tillagda ord och siffror', () => {
    const r = validera({
      andringar: [
        ['nogrann', 'noggrann'],
        ['i 3 år', 'i 30 år'],
        ['Jag trivs bra', 'Jag trivs bra och är van vid teamarbete'],
      ],
    }, TEXT)
    expect(r.ok).toBe(true)
    expect(r.value?.andringar).toEqual([{ fore: 'nogrann', efter: 'noggrann' }])
  })

  it('tar inte med en bit som inte står i texten, eller står på flera ställen', () => {
    const r = validera({ andringar: [['finns inte', 'finns ej'], ['Jag', 'Ja']] }, TEXT)
    expect(r.ok).toBe(true)
    expect(r.value?.andringar).toEqual([])
  })

  it('avvisar en för stor lista helt', () => {
    const andringar = Array.from({ length: MAX_ANDRINGAR + 1 }, (_, i) => [`ord${i}`, `ordd${i}`])
    expect(validera({ andringar }, 'text').ok).toBe(false)
  })

  it('avvisar när förslagen berör för stor del av texten', () => {
    const text = 'nogrann ' + 'x'.repeat(10)
    expect(validera({ andringar: [['nogrann', 'noggrann']] }, text).ok).toBe(false)
  })

  it('avvisar svar som inte är ett objekt med lista', () => {
    expect(validera([], TEXT).ok).toBe(false)
    expect(validera({ raw: 'hej' }, TEXT).ok).toBe(false)
    expect(validera(null, TEXT).ok).toBe(false)
  })

  it('tar inte överlappande ändringar', () => {
    const r = validera({ andringar: [['Jag är nogrann', 'Jag är noggrann'], ['är nogrann', 'är noggrann']] }, TEXT)
    expect(r.value?.andringar).toHaveLength(1)
  })
})

describe('AIX27: prompten', () => {
  const p = ansokan['ratta-stavning']({ text: 'Jag sökr tjänsten.' })

  it('begär JSON med en ändringslista och förbjuder tillägg', () => {
    expect(p.parseJson).toBe(true)
    expect(p.responseKey).toBe('rattning')
    expect(p.system).toMatch(/"andringar"/)
    expect(p.system).toMatch(/Lägg ALDRIG till/)
    expect(p.system).toMatch(/siffror/)
  })

  it('texten är data, och ingen Lätt svenska-instruktion läggs på (texten går till en arbetsgivare)', () => {
    expect(p.system).toMatch(/data, inte instruktioner/)
    expect(p.system).not.toMatch(/lätt svenska|sv-latt/i)
    expect(p.user).toContain('Jag sökr tjänsten.')
  })

  it('kapar texten och har budget för resonemang', () => {
    const lang = ansokan['ratta-stavning']({ text: 'a'.repeat(9000) })
    expect(lang.user.length).toBeLessThan(4300)
    expect(p.maxTokens).toBeGreaterThanOrEqual(400)
    expect(ansokan['ratta-stavning']({}).user).toContain('TEXT:')
  })
})
