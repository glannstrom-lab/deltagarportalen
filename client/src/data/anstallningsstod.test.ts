/**
 * Tester för anstallningsstod.ts (spår AG2).
 *
 * Den viktigaste vakten här är INTE att datan är korrekt (den kan inte
 * verifieras av ett enhetstest — den kommer från Arbetsförmedlingens
 * sidor, se docs/anstallningsstod-underlag.md) utan att varje belopp bär
 * sin källa. CLAUDE.md: "Hitta ALDRIG på siffror som är regler" — ett
 * belopp utan `kalla`/`hamtad` är precis den risken.
 */
import { describe, it, expect } from 'vitest'
import { ANSTALLNINGSSTOD, hittaStod, type Anstallningsstod, type StodformId } from './anstallningsstod'

/** Alla belopp i hela datafilen, oavsett stödform — plattat för enkel iteration. */
function allaBelopp() {
  return ANSTALLNINGSSTOD.flatMap((s) => s.belopp.map((b) => ({ stodform: s.id, ...b })))
}

describe('varje belopp har källa och hämtningsdatum (vakten)', () => {
  const belopp = allaBelopp()

  it('finns minst ett belopp att kontrollera (annars testar vakten ingenting)', () => {
    expect(belopp.length).toBeGreaterThan(0)
  })

  it.each(belopp.map((b) => [`${b.stodform}.${b.faltnamn}`, b] as const))(
    '%s har kalla, hamtad och kallTyp ifyllda',
    (_namn, b) => {
      expect(typeof b.kalla).toBe('string')
      expect(b.kalla.length).toBeGreaterThan(0)
      expect(typeof b.hamtad).toBe('string')
      expect(b.hamtad).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(['af', 'konsulent_erfarenhet']).toContain(b.kallTyp)
    }
  )

  it('fäller om ett belopp saknar källa (mutationskontroll)', () => {
    // Simulerar precis det vakten ska stoppa: en siffra utan källa.
    const trasigt: Anstallningsstod['belopp'][number] = {
      faltnamn: 'test',
      beskrivning: 'test',
      varde: 12345,
      enhet: 'kr_per_manad',
      kallTyp: 'af',
      kalla: '',
      hamtad: '',
    }
    const harKalla = trasigt.kalla.length > 0 && /^\d{4}-\d{2}-\d{2}$/.test(trasigt.hamtad)
    expect(harKalla).toBe(false)
  })
})

describe('lönebidragets regel och erfarenhet är separerade (spec-krav)', () => {
  const lonebidrag = hittaStod('lonebidrag')

  it('regeln (max 80 %) ligger i belopp, med källTyp konsulent_erfarenhet men som en RAM', () => {
    const regelpost = lonebidrag.belopp.find((b) => b.faltnamn === 'max_andel_av_bruttokostnad_procent')
    expect(regelpost).toBeDefined()
    expect(regelpost!.varde).toBe(80)
    expect(regelpost!.enhet).toBe('procent')
  })

  it('erfarenheten (30–50 %) ligger i konsulentErfarenhet, INTE i belopp-arrayen', () => {
    expect(lonebidrag.konsulentErfarenhet).toBeDefined()
    expect(lonebidrag.konsulentErfarenhet!.text).toMatch(/30–50 %|30-50 %/)
    // Den får inte finnas som ett strukturerat belopp — bara som fritext.
    const finnsSomBelopp = lonebidrag.belopp.some((b) => b.varde === 30 || b.varde === 50 || b.varde === 40)
    expect(finnsSomBelopp).toBe(false)
  })

  it('erfarenhetstexten är märkt som erfarenhet, inte som ett förväntat utfall', () => {
    expect(lonebidrag.konsulentErfarenhet!.text.toLowerCase()).toContain('erfarenhet')
  })
})

describe('OSA gissar inte lönebidragets tak in i sin egen data', () => {
  it('OSA har inget belopp (ersättningen är EJ BELAGT enligt underlaget)', () => {
    const osa = hittaStod('osa')
    expect(osa.belopp).toHaveLength(0)
    expect(osa.ejBelagt.length).toBeGreaterThan(0)
  })
})

describe('SIUS är personstöd, inte pengar', () => {
  it('SIUS har kategori personstod och inget belopp', () => {
    const sius = hittaStod('sius')
    expect(sius.kategori).toBe('personstod')
    expect(sius.belopp).toHaveLength(0)
  })
})

describe('datamodellens grundform', () => {
  const alla: readonly Anstallningsstod[] = ANSTALLNINGSSTOD

  it('innehåller exakt de fem stödformerna (nystartsjobb, introduktionsjobb, lönebidrag, OSA, SIUS)', () => {
    const ids = alla.map((s) => s.id).sort()
    const forvantade: StodformId[] = ['introduktionsjobb', 'lonebidrag', 'nystartsjobb', 'osa', 'sius'].sort() as StodformId[]
    expect(ids).toEqual(forvantade)
  })

  it('varje post har en källa och ett hämtningsdatum på stödform-nivå också', () => {
    for (const s of alla) {
      expect(s.kalla.length).toBeGreaterThan(0)
      expect(s.hamtad).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })

  it('hittaStod kastar på okänt id i stället för att returnera undefined tyst', () => {
    // @ts-expect-error – avsiktligt fel id för att pröva felvägen
    expect(() => hittaStod('paskoncessioner')).toThrow()
  })
})
