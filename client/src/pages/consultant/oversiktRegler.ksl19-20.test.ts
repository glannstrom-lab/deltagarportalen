/**
 * KSL19: läkarintygsflagga dag 8 (kommun) och KSL20: ny avvikelserapport dag 8
 * (leverantör) i Min dag. Reglerna i sig testas i services/franvaroperiod.test.ts;
 * här testas att de är inkopplade rätt och hör till rätt kundtyp.
 */
import { describe, it, expect } from 'vitest'
import { attGoraIdag, leverantorsLage, leverantorSammanfattning, minDagPersoner, type AttGoraPass, type AvvikelsePass } from './oversiktRegler'

const IDAG = new Date(2026, 9, 8, 10, 0) // tors 8 okt 2026
const deltagare = [{ participant_id: 'anna', status: 'ACTIVE' }]
const sjukPass = (dag: number, o: Record<string, unknown> = {}): AttGoraPass => ({
  id: `s${dag}`, plan_id: 'p', participant_id: 'anna', date: `2026-10-0${dag}`, start_time: '09:00', end_time: '12:00',
  title: 'Verkstad', activity_type: 'group_activity', attendance: 'sick_certified', sick_certificate_received: false, ...o,
}) as AttGoraPass
const atta = Array.from({ length: 8 }, (_, i) => sjukPass(i + 1))

describe('KSL19 — läkarintygsflagga dag 8 (kommun)', () => {
  it('en punkt per deltagare efter åtta sjukdagar i följd, utan paragraf', () => {
    const p = attGoraIdag({ deltagare, pass: atta, idag: IDAG }).filter((a) => a.typ === 'lakarintyg_dag8')
    expect(p).toHaveLength(1)
    expect(p[0].text).toBe('Sjuk sedan 1 okt — läkarintyg behövs från dag 8')
    expect(p[0].text).not.toMatch(/§|kap\./)
  })

  it('inte vid sju dagar', () => {
    expect(attGoraIdag({ deltagare, pass: atta.slice(0, 7), idag: new Date(2026, 9, 7) }).some((a) => a.typ === 'lakarintyg_dag8')).toBe(false)
  })

  it('aldrig för en leverantör (franvaroSomFakta) — det är kommunens regel', () => {
    expect(attGoraIdag({ deltagare, pass: atta, idag: IDAG, franvaroSomFakta: true }).some((a) => a.typ === 'lakarintyg_dag8')).toBe(false)
  })

  it('ger ett läge i Min dag med sjuk-status', () => {
    const personer = minDagPersoner({ attGora: attGoraIdag({ deltagare, pass: atta, idag: IDAG }), bradskande: [], leverantor: null, moten: [], deadlines: [], kontakter: [], idag: IDAG })
    const k = personer[0].punkter.find((x) => x.typ === 'lakarintyg_dag8')!
    expect(k.lage).toBe('Läkarintyg behövs från dag 8')
    expect(k.status).toBe('sjuk')
  })
})

describe('KSL20 — ny avvikelserapport dag 8 (leverantör)', () => {
  const lev = (pass: AttGoraPass[]) => leverantorsLage({
    deltagare, plans: [], pass: [], moten: [], placeringar: [], idag: IDAG,
    avvikelsePass: pass.map((p) => ({ ...p, is_provider_led: true })) as unknown as AvvikelsePass[],
  })

  it('en rad när frånvaron fortsatt dag 8 och ingen rapport är antecknad', () => {
    const l = lev(atta)
    expect(l.avvikelseDag8).toEqual([{ participantId: 'anna', text: 'Sjuk sedan 1 okt — ny avvikelserapport till AF behövs för dag 8' }])
    expect(leverantorSammanfattning(l)).toContain('1 med sjukfrånvaro som behöver en ny avvikelserapport dag 8')
  })

  it('ingen rad när dag 8 redan är underrättad, och okänt (null) när passen saknas', () => {
    expect(lev([...atta.slice(0, 7), sjukPass(8, { af_notified_at: '2026-10-08T07:00:00Z' })]).avvikelseDag8).toEqual([])
    expect(leverantorsLage({ deltagare, plans: [], pass: [], moten: [], placeringar: [], idag: IDAG }).avvikelseDag8).toBeNull()
  })

  it('blir en punkt i Min dag', () => {
    const personer = minDagPersoner({ attGora: [], bradskande: [], leverantor: lev(atta), moten: [], deadlines: [], kontakter: [], idag: IDAG, franvaroSomFakta: true })
    expect(personer[0].punkter.some((x) => x.statusText === 'Ny rapport dag 8')).toBe(true)
  })
})
