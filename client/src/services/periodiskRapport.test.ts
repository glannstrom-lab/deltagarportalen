import { describe, it, expect } from 'vitest'
import { sammanstallPeriodiskRapport, langstaMellanrum, kontrolleraPeriod, lokalDag, timText, type UnderlagPass } from './periodiskRapport'

const plan = { id: 'pl', participant_id: 'p1', start_date: '2026-09-01', end_date: null as string | null }
let n = 0
const pass = (o: Partial<UnderlagPass> = {}): UnderlagPass => ({
  id: `s${n++}`, plan_id: 'pl', date: '2026-10-05', start_time: '09:00', end_time: '11:00', title: 'Gruppträff',
  attendance: 'present', location: 'Kontoret', sick_certificate_received: false, activity_type: 'jobsearch',
  is_provider_led: true, is_physical: true, ...o,
})
const mote = (dag: [number, number, number], typ: 'physical' | 'video' | 'phone' = 'physical', status: 'completed' | 'scheduled' = 'completed', pid = 'p1') =>
  ({ participant_id: pid, scheduled_at: new Date(dag[0], dag[1] - 1, dag[2], 10).toISOString(), meeting_type: typ, status })
const P = { from: '2026-10-01', to: '2026-10-31' }
const falt = (r: ReturnType<typeof sammanstallPeriodiskRapport>, id: string) => r.falt.find((f) => f.id === id)!

describe('sammanstallPeriodiskRapport', () => {
  it('andel fysiska: 1 av 2 = 50 % uppfyllt, 1 av 3 = ej uppfyllt', () => {
    const a = sammanstallPeriodiskRapport(plan, [pass(), pass({ is_physical: false })], [], P)
    expect(a.andelFysiska).toBe(0.5)
    expect(a.fysiskaKravUppfyllt).toBe(true)
    expect(falt(a, 'fysiska').text).toMatch(/minst 50 %: uppfyllt/)
    const b = sammanstallPeriodiskRapport(plan, [pass(), pass({ is_physical: false }), pass({ is_physical: false })], [], P)
    expect(b.fysiskaKravUppfyllt).toBe(false)
    expect(falt(b, 'fysiska').text).toContain('ej uppfyllt')
  })

  it('tomt underlag ger — och null, aldrig 0 %', () => {
    const r = sammanstallPeriodiskRapport(plan, [], [], P)
    expect(r.andelFysiska).toBeNull()
    expect(r.fysiskaKravUppfyllt).toBeNull()
    expect(falt(r, 'fysiska').text).toMatch(/^—/)
    expect(falt(r, 'genomforda').text).toMatch(/^—/)
    expect(falt(r, 'fysiska').text).not.toContain('0 %')
  })

  it('periodgränser: pass på från- och till-dagen ingår, dagen efter gör det inte', () => {
    const r = sammanstallPeriodiskRapport(plan, [
      pass({ date: '2026-10-01' }), pass({ date: '2026-10-31' }), pass({ date: '2026-11-01' }), pass({ date: '2026-09-30' }),
    ], [], P)
    expect(falt(r, 'genomforda').kalla).toHaveLength(2)
    expect(r.dagar).toBe(31)
  })

  it('mötesdag räknas i lokal tid även sent på kvällen', () => {
    const sent = new Date(2026, 9, 31, 23, 30).toISOString()
    expect(lokalDag(sent)).toBe('2026-10-31')
    const r = sammanstallPeriodiskRapport(plan, [], [{ participant_id: 'p1', scheduled_at: sent, meeting_type: 'physical', status: 'completed' }], P)
    expect(falt(r, 'moten').text).toContain('1 möte')
  })

  it('planens start och slut klipper perioden', () => {
    const r = sammanstallPeriodiskRapport({ ...plan, start_date: '2026-10-10', end_date: '2026-10-20' }, [pass({ date: '2026-10-05' }), pass({ date: '2026-10-12' }), pass({ date: '2026-10-25' })], [], P)
    expect(r.period).toEqual({ from: '2026-10-10', to: '2026-10-20' })
    expect(falt(r, 'genomforda').kalla).toHaveLength(1)
  })

  it('frånvaro redovisas som fakta, utan godtagbarhet; omarkerade pass är planerade', () => {
    const r = sammanstallPeriodiskRapport(plan, [
      pass({ attendance: 'absent_valid', date: '2026-10-06' }),
      pass({ attendance: 'absent_invalid', date: '2026-10-07' }),
      pass({ attendance: 'sick_certified', date: '2026-10-08', sick_certificate_received: false }),
      pass({ attendance: null, date: '2026-10-09' }),
    ], [], P)
    const t = falt(r, 'franvaro').text
    expect(t).toContain('anmäld i förväg')
    expect(t).toContain('inte anmäld i förväg')
    expect(t).toContain('intyg saknas')
    expect(t).not.toMatch(/ogiltig|godtagbar/)
    expect(falt(r, 'planering').text).toContain('4 pass')
    expect(falt(r, 'planering').text).toContain('inte markerade: 1')
    expect(r.genomfordaMinuter).toBe(0)
  })

  it('deltagarens eget jobbsökande och pass i andra planer räknas inte', () => {
    const r = sammanstallPeriodiskRapport(plan, [
      pass({ is_provider_led: false }), pass({ plan_id: 'annan' }), pass(),
    ], [], P)
    expect(falt(r, 'genomforda').kalla).toHaveLength(1)
  })

  it('tid: 2 h + 1,5 h = 3,5 h', () => {
    const r = sammanstallPeriodiskRapport(plan, [pass(), pass({ start_time: '13:00', end_time: '14:30' })], [], P)
    expect(r.genomfordaMinuter).toBe(210)
    expect(falt(r, 'genomforda').text).toContain('3,5 h')
    expect(timText(90)).toBe('1,5 h')
  })

  it('möten: bara genomförda, rätt deltagare, mellanrum mot kraven 14 och 28 dagar', () => {
    const r = sammanstallPeriodiskRapport(plan, [], [
      mote([2026, 10, 1]), mote([2026, 10, 20], 'video'), mote([2026, 10, 25], 'physical', 'scheduled'), mote([2026, 10, 10], 'physical', 'completed', 'p2'),
    ], P)
    const t = falt(r, 'moten').text
    expect(t).toContain('2 möten (varav 1 fysiska)')
    expect(t).toContain('19 dagar')
    expect(t).toContain('över kravet')
    expect(t).toContain('— (färre än två fysiska möten')
  })

  it('inga möten ger en rad om det, inte 0', () => {
    expect(falt(sammanstallPeriodiskRapport(plan, [], [], P), 'moten').text).toBe('Inga genomförda möten registrerade i perioden.')
  })
})

describe('hjälpare', () => {
  it('langstaMellanrum', () => {
    expect(langstaMellanrum(['2026-10-01'])).toBeNull()
    expect(langstaMellanrum(['2026-10-15', '2026-10-01', '2026-10-05'])).toBe(10)
  })
  it('kontrolleraPeriod', () => {
    expect(kontrolleraPeriod('', '2026-10-01')).toMatch(/både/)
    expect(kontrolleraPeriod('2026-10-05', '2026-10-01')).toMatch(/efter/)
    expect(kontrolleraPeriod('2025-01-01', '2026-10-01')).toMatch(/ett år/)
    expect(kontrolleraPeriod('2026-10-01', '2026-10-31')).toBeNull()
  })
})
