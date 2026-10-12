/**
 * franvaroperiod — KSL19 (läkarintyg dag 8, kommun) och KSL20 (ny avvikelserapport
 * dag 8, leverantör). Kalenderdagar från första sjukdagen är ett ANTAGANDE.
 */
import { describe, it, expect } from 'vitest'
import { avvikelseDag8, dagarMellan, lakarintygDag8, lakarintygText, pagaendeFranvaro, type PeriodPass } from './franvaroperiod'

const sjuk = (date: string, o: Partial<PeriodPass> = {}): PeriodPass => ({ date, attendance: 'sick_certified', sick_certificate_received: false, ...o })
const narv = (date: string): PeriodPass => ({ date, attendance: 'present' })
const dagar = (fran: number, till: number, f: (d: string) => PeriodPass) =>
  Array.from({ length: till - fran + 1 }, (_, i) => f(`2026-10-${String(fran + i).padStart(2, '0')}`))

describe('pagaendeFranvaro', () => {
  it('räknar kalenderdagar från första sjukdagen till den senaste', () => {
    const p = pagaendeFranvaro([narv('2026-10-01'), ...dagar(2, 9, sjuk)], '2026-10-09')!
    expect(p.start).toBe('2026-10-02')
    expect(p.dagar).toBe(8)
    expect(p.kanVaraLangre).toBe(false)
  })

  it('bryts av en närvarodag och av ett passerat omarkerat pass (okänt)', () => {
    expect(pagaendeFranvaro([...dagar(1, 3, sjuk), narv('2026-10-04'), ...dagar(5, 9, sjuk)], '2026-10-09')!.dagar).toBe(5)
    const okant: PeriodPass = { date: '2026-10-04', attendance: null }
    expect(pagaendeFranvaro([...dagar(1, 3, sjuk), okant, ...dagar(5, 9, sjuk)], '2026-10-09')!.dagar).toBe(5)
  })

  it('en anmäld men ännu omarkerad sjukdag räknas som sjuk; framtida pass ignoreras', () => {
    const anmald: PeriodPass = { date: '2026-10-09', attendance: null, absence_reason: 'sick' }
    expect(pagaendeFranvaro([...dagar(1, 8, sjuk), anmald, sjuk('2026-10-12')], '2026-10-09')!.dagar).toBe(9)
  })

  it('är inte pågående när senaste dagen inte är sjuk eller ligger för långt bak', () => {
    expect(pagaendeFranvaro([...dagar(1, 8, sjuk), narv('2026-10-09')], '2026-10-09')).toBeNull()
    expect(pagaendeFranvaro(dagar(1, 8, sjuk), '2026-10-20')).toBeNull()
  })

  it('markerar att perioden kan vara längre när den börjar på första synliga pass', () => {
    expect(pagaendeFranvaro(dagar(1, 3, sjuk), '2026-10-03')!.kanVaraLangre).toBe(true)
  })

  it('dagarMellan räknar hela kalenderdagar över månadsskifte', () => {
    expect(dagarMellan('2026-09-28', '2026-10-02')).toBe(4)
  })
})

describe('lakarintygDag8 (kommun)', () => {
  it('flaggar först när perioden är åtta dagar — sju dagar är inte "mer än sju"', () => {
    expect(lakarintygDag8(dagar(1, 7, sjuk), '2026-10-07')).toBeNull()
    expect(lakarintygDag8(dagar(1, 8, sjuk), '2026-10-08')!.dagar).toBe(8)
  })

  it('flaggar inte när intyget redan kommit på periodens sista pass', () => {
    const lista = [...dagar(1, 8, sjuk), sjuk('2026-10-09', { sick_certificate_received: true })]
    expect(lakarintygDag8(lista, '2026-10-09')).toBeNull()
  })

  it('flaggtexten säger "minst" när perioden kan vara längre, och ingen paragraf', () => {
    const t = lakarintygText(lakarintygDag8(dagar(1, 8, sjuk), '2026-10-08'))!
    expect(t).toBe('Läkarintyg behövs från dag 8 (sjuk minst 8 dagar i följd)')
    expect(t).not.toMatch(/§|kap\./)
    expect(lakarintygText(null)).toBeNull()
  })
})

describe('avvikelseDag8 (leverantör, AFFS § 10)', () => {
  it('kräver ny rapport när frånvaron fortsatt till dag 8 utan underrättelse', () => {
    expect(avvikelseDag8(dagar(1, 8, sjuk), '2026-10-08')!.start).toBe('2026-10-01')
  })
  it('klar när ett pass på eller efter dag 8 är antecknat som underrättat — inte om bara tidigare pass är det', () => {
    expect(avvikelseDag8([...dagar(1, 7, (d) => sjuk(d, { af_notified_at: 'x' })), sjuk('2026-10-08')], '2026-10-08')).not.toBeNull()
    expect(avvikelseDag8([...dagar(1, 7, sjuk), sjuk('2026-10-08', { af_notified_at: 'x' })], '2026-10-08')).toBeNull()
  })
  it('vård av barn räknas som egen sort och blandas inte med sjukdom', () => {
    const barn = (date: string): PeriodPass => ({ date, attendance: 'absent_valid', absence_reason: 'child_care' })
    const lista = dagar(1, 8, barn)
    expect(avvikelseDag8(lista, '2026-10-08', 'child_care')).not.toBeNull()
    expect(avvikelseDag8(lista, '2026-10-08', 'sick')).toBeNull()
  })
})
