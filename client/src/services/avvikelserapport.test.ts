/**
 * RR28 (rollspelet 2026-09-27): leverantörens avvikelser — datum, typ, orsak
 * och om AF underrättats — räknade ur passen.
 */
import { describe, it, expect } from 'vitest'
import { avvikelseManader, avvikelserader, avvikelserSomText, omarkeradePasserade } from './avvikelserapport'

const pass = (o: Record<string, unknown>) => ({
  id: 'x', plan_id: 'pl', date: '2026-09-08', title: 'Verkstad', activity_type: 'jobsearch' as const, attendance: null as string | null,
  attendance_note: null as string | null, sick_certificate_received: false, ...o,
}) as Parameters<typeof avvikelserader>[0][number]

describe('avvikelserader', () => {
  const sessions = [
    pass({ id: 'a', date: '2026-09-10', attendance: 'absent_invalid', attendance_note: 'Kom inte, svarade inte i telefon' }),
    pass({ id: 'b', date: '2026-09-03', attendance: 'sick_certified', absence_reason: 'sick', absence_note: 'feber' }),
    pass({ id: 'c', date: '2026-09-04', attendance: 'present' }),
    pass({ id: 'd', date: '2026-09-05', attendance: 'absent_valid', activity_type: 'jobsearch_own' }),
    pass({ id: 'e', date: '2026-09-06', attendance: 'absent_valid', participant_explanation: 'Tandläkare', af_notified_at: '2026-09-07T08:00:00Z' }),
    pass({ id: 'f', date: '2026-10-01', attendance: 'absent_invalid' }),
  ]

  it('tar bara markerad frånvaro i leverantörsledda pass i perioden, i datumordning', () => {
    const rader = avvikelserader(sessions, '2026-09-01', '2026-09-30')
    expect(rader.map((r) => r.sessionId)).toEqual(['b', 'e', 'a'])
    expect(rader.map((r) => r.typ)).toEqual(['Sjuk, intyg saknas', 'Giltig frånvaro', 'Ogiltig frånvaro'])
  })

  it('orsaken samlar anteckning, anmälan och förklaring — och är null när inget finns', () => {
    const rader = avvikelserader([...sessions, pass({ id: 'g', date: '2026-09-11', attendance: 'absent_invalid' })], '2026-09-01', '2026-09-30')
    expect(rader.find((r) => r.sessionId === 'a')?.orsak).toBe('Kom inte, svarade inte i telefon')
    expect(rader.find((r) => r.sessionId === 'b')?.orsak).toBe('Anmäld i förväg av deltagaren: sjuk (feber)')
    expect(rader.find((r) => r.sessionId === 'e')?.orsak).toBe('Deltagarens förklaring: Tandläkare')
    expect(rader.find((r) => r.sessionId === 'g')?.orsak).toBeNull()
  })

  it('underrättelsen följer med', () => {
    const rader = avvikelserader(sessions, '2026-09-01', '2026-09-30')
    expect(rader.find((r) => r.sessionId === 'e')?.underrattad).toBe('2026-09-07T08:00:00Z')
    expect(rader.find((r) => r.sessionId === 'a')?.underrattad).toBeNull()
  })

  it('texten att kopiera säger "ingen antecknad" i stället för att hitta på en orsak', () => {
    const text = avvikelserSomText(avvikelserader([pass({ id: 'g', date: '2026-09-11', attendance: 'absent_invalid' })], '2026-09-01', '2026-09-30'), true)
    expect(text).toBe('2026-09-11 · Ogiltig frånvaro · Verkstad · Orsak: ingen antecknad · AF underrättad: nej')
    expect(avvikelserSomText([], true)).toBe('Inga avvikelser registrerade i perioden.')
    expect(avvikelserSomText(avvikelserader(sessions, '2026-09-10', '2026-09-10'), false)).not.toContain('AF underrättad')
  })

  it('omarkerade passerade pass räknas separat, inte som avvikelser', () => {
    const s = [pass({ id: 'h', date: '2026-09-20' }), pass({ id: 'i', date: '2026-09-28' }), pass({ id: 'j', date: '2026-09-21', activity_type: 'jobsearch_own' })]
    expect(omarkeradePasserade(s, '2026-09-01', '2026-09-30', '2026-09-27')).toBe(1)
    expect(avvikelserader(s, '2026-09-01', '2026-09-30')).toEqual([])
  })

  it('månaderna går från i dag bakåt till planens start', () => {
    expect(avvikelseManader('2026-07-15', '2026-09-27')).toEqual(['2026-09', '2026-08', '2026-07'])
    expect(avvikelseManader('2026-11-01', '2026-09-27')).toEqual(['2026-09'])
    expect(avvikelseManader('2020-01-01', '2026-02-10')).toHaveLength(12)
  })
})
