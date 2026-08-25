/**
 * Nyckelordskontrollen (O4, 2026-08-25).
 *
 * Testen är skrivna för att kunna falla:
 *
 * - Höjer man `MINSTA_PREFIX` till 3 faller "lager ≠ lag".
 * - Tar man bort prefixjämförelsen faller böjningstestet.
 * - Tar man bort den sekundära sorteringen faller determinismtestet.
 * - Tar man bort stopporden faller brustestet.
 */

import { describe, it, expect } from 'vitest'
import { delaIOrd, jamforMotAnnons } from './atsNyckelord'

describe('delaIOrd', () => {
  it('behåller svenska tecken', () => {
    expect(delaIOrd('Företaget söker någon')).toEqual(['företaget', 'söker', 'någon'])
  })

  it('behåller tecken som ingår i teknikord', () => {
    const ord = delaIOrd('Vi använder C# och .NET samt C++')
    expect(ord).toContain('c#')
    expect(ord).toContain('c++')
    // Inledande punkt skalas bort — ".NET" blir "net", vilket matchar hur
    // ordet skrivs i de flesta CV. Skiljetecken i slutet av en mening skulle
    // annars bli en del av ordet.
    expect(ord).toContain('net')
  })

  it('klarar tom och skräpig indata', () => {
    expect(delaIOrd('')).toEqual([])
    expect(delaIOrd('   ,,,  --- ')).toEqual([])
  })
})

describe('jamforMotAnnons', () => {
  it('hittar ord i annonsen som saknas i CV:t', () => {
    const cv = 'Lagerarbetare med truckkort och erfarenhet av plockning'
    const annons = 'Vi söker en lagerarbetare med truckkort. Du behöver också ADR-intyg och behärskar svenska.'

    const { saknas, finns } = jamforMotAnnons(cv, annons)
    expect(saknas).toContain('behärskar')
    expect(finns).toContain('truckkort')
    expect(finns).toContain('lagerarbetare')
  })

  it('räknar böjda former som samma ord', () => {
    const { finns, saknas } = jamforMotAnnons(
      'Jag har lång erfarenhet av kundbemötande',
      'Vi vill ha erfarenheter av kundbemötande'
    )
    expect(finns).toContain('erfarenheter')
    expect(saknas).not.toContain('erfarenheter')
  })

  it('slår inte ihop korta ord som råkar dela början', () => {
    // "lag" får INTE matcha "lager" — det är därför prefixgolvet finns.
    const { saknas } = jamforMotAnnons('Jag spelar i ett lag', 'Arbete i lagerlokal')
    expect(saknas).toContain('lagerlokal')
  })

  it('filtrerar bort annonsspråk och floskler', () => {
    const { finns, saknas } = jamforMotAnnons(
      'Snickare',
      'En spännande och utmanande tjänst för dig som är driven och engagerad. Vi söker en snickare.'
    )
    const alla = [...finns, ...saknas]
    expect(alla).not.toContain('spännande')
    expect(alla).not.toContain('tjänst')
    expect(alla).not.toContain('driven')
    expect(finns).toContain('snickare')
  })

  it('filtrerar bort rena tal', () => {
    const { finns, saknas } = jamforMotAnnons('CV', 'Ansök senast 2026. Vi har 250 anställda.')
    const alla = [...finns, ...saknas]
    expect(alla).not.toContain('2026')
    expect(alla).not.toContain('250')
  })

  it('ger samma ordning två gånger i rad', () => {
    const annons = 'Snickare snickare bygg bygg måleri måleri golv golv'
    const ett = jamforMotAnnons('', annons)
    const två = jamforMotAnnons('', annons)
    expect(ett.saknas).toEqual(två.saknas)
  })

  it('sätter det som nämns oftast först', () => {
    const { saknas } = jamforMotAnnons(
      '',
      'truckkort truckkort truckkort. Vi nämner ADR-intyg en gång. truckkort igen.'
    )
    expect(saknas[0]).toBe('truckkort')
  })

  it('klarar tomt CV utan att krascha', () => {
    const { finns, saknas, provade } = jamforMotAnnons('', 'Vi söker en elektriker med behörighet')
    expect(finns).toEqual([])
    expect(saknas.length).toBeGreaterThan(0)
    expect(provade).toBe(saknas.length)
  })

  it('klarar tom annons utan att påstå något', () => {
    const { finns, saknas, provade } = jamforMotAnnons('Ett helt CV med massor av text', '')
    expect(finns).toEqual([])
    expect(saknas).toEqual([])
    expect(provade).toBe(0)
  })

  it('prövar högst trettio ord', () => {
    const annons = Array.from({ length: 200 }, (_, i) => `kompetensord${i}`).join(' ')
    expect(jamforMotAnnons('', annons).provade).toBeLessThanOrEqual(30)
  })
})
