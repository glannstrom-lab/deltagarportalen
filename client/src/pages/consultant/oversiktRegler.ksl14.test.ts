/**
 * KSL14 (2026-10-12): avvikelser som inte rapporterats till AF syns på Översikt
 * (Rusta och matcha). Samma regel som avvikelserapporten (services/avvikelserapport.ts):
 * leverantörsledda pass, bara markerade utfall, och "underrättad" är konsulentens anteckning.
 */
import { describe, it, expect } from 'vitest'
import { leverantorsLage, leverantorSammanfattning, minDagPersoner, fornaManadensStart, type AvvikelsePass } from './oversiktRegler'

const IDAG = new Date(2026, 9, 14, 10, 0) // ons 14 okt 2026
const deltagare = [
  { participant_id: 'anna', status: 'ACTIVE' },
  { participant_id: 'omar', status: 'ACTIVE' },
]
const pass = (o: Partial<AvvikelsePass> & { id: string }): AvvikelsePass => ({
  plan_id: 'p', participant_id: 'anna', date: '2026-10-08', title: 'Gruppträff', attendance: 'absent_invalid',
  attendance_note: null, sick_certificate_received: null, activity_type: 'group_activity', is_provider_led: true, af_notified_at: null,
  ...o,
} as AvvikelsePass)
const lage = (avvikelsePass?: AvvikelsePass[] | null) =>
  leverantorsLage({ deltagare, plans: [], pass: [], moten: [], placeringar: [], idag: IDAG, avvikelsePass })

describe('leverantorsLage — KSL14: avvikelser som inte rapporterats till AF', () => {
  it('en rad per deltagare; rapporterade, närvaro och icke leverantörsledda pass räknas inte', () => {
    const l = lage([
      pass({ id: '1', date: '2026-10-08' }),
      pass({ id: '2', date: '2026-10-09', attendance: 'absent_valid' }),
      pass({ id: '3', participant_id: 'omar', af_notified_at: '2026-10-10T08:00:00Z' }), // redan underrättad
      pass({ id: '4', participant_id: 'omar', attendance: 'present' }),
      pass({ id: '5', participant_id: 'omar', is_provider_led: false }),
    ])
    expect(l.avvikelserEjRapporterade).toEqual([
      { participantId: 'anna', text: '2 avvikelser är inte rapporterade till AF, den äldsta 8 okt' },
    ])
    expect(leverantorSammanfattning(l)).toContain('1 deltagare med avvikelse som inte rapporterats till AF')
  })

  it('förra månaden räknas, två månader sedan inte', () => {
    expect(fornaManadensStart('2026-10-14')).toBe('2026-09-01')
    expect(fornaManadensStart('2026-01-05')).toBe('2025-12-01')
    const l = lage([pass({ id: '1', date: '2026-09-20' }), pass({ id: '2', participant_id: 'omar', date: '2026-08-31' })])
    expect(l.avvikelserEjRapporterade?.map((p) => p.participantId)).toEqual(['anna'])
  })

  it('kunde passen inte hämtas är svaret okänt (null) — inte "inga", och ingen sammanfattningsrad', () => {
    const l = lage(null)
    expect(l.avvikelserEjRapporterade).toBeNull()
    expect(leverantorSammanfattning(l).join(' ')).not.toMatch(/avvikelse/)
    expect(lage(undefined).avvikelserEjRapporterade).toBeNull()
  })

  it('inga avvikelser är en tom lista — känt och tomt', () => {
    expect(lage([]).avvikelserEjRapporterade).toEqual([])
  })

  it('blir en punkt i Min dag på personen, med fakta-ord (aldrig "giltig")', () => {
    const l = lage([pass({ id: '1' })])
    const personer = minDagPersoner({ attGora: [], bradskande: [], leverantor: l, moten: [], deadlines: [], kontakter: [], idag: IDAG, franvaroSomFakta: true })
    const punkt = personer.find((x) => x.participantId === 'anna')!.punkter.find((x) => x.lage.startsWith('Avvikelse'))!
    expect(punkt.typ).toBe('franvaro')
    expect(punkt.lage).toBe('Avvikelse 8 okt är inte rapporterad till AF')
    expect(JSON.stringify(punkt)).not.toMatch(/giltig/i)
  })
})
