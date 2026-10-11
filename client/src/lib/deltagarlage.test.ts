/**
 * Deltagarlistans "Läget" (omtaget steg 4, 2026-10-11).
 *
 * Motprov (kört 2026-10-11): ta bort `harVarit`-villkoret för omarkerade pass
 * (räkna även framtida) → "ett pass som inte varit än är planerat, inte
 * omarkerat" och "utan plan …" faller.
 * Motprov för sidorna (körda samma dag): spara valet direkt utan paus →
 * piltangenttestet i GruppnarvaroPage faller; släpp `!p.absence_reason` i
 * kanMarkerasNarvarandeIMassa → "Markera resten" faller; förvälj förslaget i
 * NarvaroVal → förslagstestet faller; hämta möteskadensen även för kommun →
 * kommuntestet i ParticipantsTab faller.
 */
import { describe, it, expect } from 'vitest'
import { dagSomKommer, dagSomVarit, deltagarLage, kontaktText, veckoremsa, type LagePass, type VeckansUnderlag } from './deltagarlage'

// Onsdag 14 oktober 2026. Veckan: mån 12 – sön 18.
const IDAG = '2026-10-14'
const KL = '10:00'

const pass = (o: Partial<LagePass>): LagePass => ({
  id: Math.random().toString(36).slice(2), participant_id: 'p', plan_id: 'pl', date: '2026-10-12', start_time: '13:00:00',
  end_time: '14:00:00', title: 'Gruppträff', activity_type: 'jobsearch', attendance: null, attendance_note: null,
  self_checkin_at: null, absence_reason: null, ...o,
})
const underlag = (lista: LagePass[], planStatus: string | null = 'active'): VeckansUnderlag => ({
  planer: planStatus ? [{ id: 'pl', participant_id: 'p', weekly_hours_target: 10, status: planStatus }] : [],
  pass: lista,
})
const lage = (lista: LagePass[], planStatus: string | null = 'active') =>
  deltagarLage({ participantId: 'p', underlag: underlag(lista, planStatus), idag: IDAG, klockan: KL })

describe('dagar i ord', () => {
  it('det som varit och det som kommer', () => {
    expect(dagSomVarit('2026-10-14', IDAG)).toBe('i dag')
    expect(dagSomVarit('2026-10-13', IDAG)).toBe('i går')
    expect(dagSomVarit('2026-10-12', IDAG)).toBe('i måndags')
    expect(dagSomKommer('2026-10-15', IDAG)).toBe('i morgon')
    expect(dagSomKommer('2026-10-16', IDAG)).toBe('på fredag')
  })

  it('senaste kontakt räknas i kalenderdagar och står i ord', () => {
    const nu = new Date(2026, 9, 14, 8, 0).getTime()
    expect(kontaktText(null, nu)).toBe('Ingen kontakt registrerad')
    expect(kontaktText(new Date(2026, 9, 13, 20, 0).toISOString(), nu)).toBe('Senaste kontakt i går')
    expect(kontaktText(new Date(2026, 9, 10, 9, 0).toISOString(), nu)).toBe('Senaste kontakt för 4 dagar sedan')
    expect(kontaktText(new Date(2026, 9, 1, 9, 0).toISOString(), nu)).toBe('Senaste kontakt för 1 vecka sedan')
  })
})

describe('veckoremsan', () => {
  it('fem dagar; det som kräver något syns först när en dag har flera pass', () => {
    const dagar = veckoremsa([
      pass({ date: '2026-10-12', attendance: 'present' }),
      pass({ date: '2026-10-13', attendance: 'present', start_time: '09:00:00' }),
      pass({ date: '2026-10-13', attendance: 'absent_invalid' }),
      pass({ date: '2026-10-14', start_time: '13:00:00' }),
      pass({ date: '2026-10-16', absence_reason: 'sick' }),
    ], IDAG, KL)
    expect(dagar.map((d) => d.datum)).toEqual(['2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15', '2026-10-16'])
    expect(dagar.map((d) => d.status)).toEqual(['narvarande', 'ogiltig', 'planerat', null, 'vantar'])
  })

  it('ett pass som varit men inte markerats väntar på konsulenten; ett som inte varit än är planerat', () => {
    const [mandag, , onsdag] = veckoremsa([
      pass({ date: '2026-10-12' }),
      pass({ date: '2026-10-14', start_time: '08:00:00', end_time: '09:00:00' }),
    ], IDAG, KL)
    expect(mandag.status).toBe('vantar')
    expect(onsdag.status).toBe('vantar')
    expect(veckoremsa([pass({ date: '2026-10-14', start_time: '13:00:00' })], IDAG, KL)[2].status).toBe('planerat')
  })
})

describe('Läget — en mening, bara det datan bär', () => {
  it('ogiltig frånvaro går före allt annat, och saknad anteckning sägs', () => {
    const l = lage([
      pass({ date: '2026-10-12', absence_reason: 'child_care', start_time: '09:00:00' }),
      pass({ date: '2026-10-13', attendance: 'absent_invalid' }),
    ])
    expect(l.lage).toBe('Ogiltig frånvaro i går (Gruppträff)')
    expect(l.tillagg).toBe('Ingen anteckning om varför än')
    expect(l.status).toBe('ogiltig')
    expect(l.fler).toBe(1)
    expect(l.franvaroIVeckan).toBe(true)
  })

  it('en anmäld frånvaro väntar på konsulentens bedömning', () => {
    const l = lage([pass({ date: '2026-10-16', absence_reason: 'sick' })])
    expect(l.lage).toBe('Har anmält frånvaro på fredag: sjuk')
    expect(l.status).toBe('vantar')
  })

  it('ett pass som inte varit än är planerat, inte omarkerat', () => {
    const l = lage([pass({ date: '2026-10-12', attendance: 'present' }), pass({ date: '2026-10-15' })])
    expect(l.lage).toBe('Har varit på alla pass hittills i veckan')
    expect(l.status).toBeNull()
    expect(l.nasta).toBe('I morgon 13:00 · Gruppträff')
  })

  it('omarkerade pass som varit räknas', () => {
    const l = lage([pass({ date: '2026-10-12' }), pass({ date: '2026-10-13' })])
    expect(l.lage).toBe('2 pass i veckan är inte markerade')
    expect(l.statusText).toBe('Inte markerat')
  })

  it('en incheckning väntar på kvittens', () => {
    const l = lage([pass({ date: '2026-10-14', start_time: '08:00:00', end_time: '09:00:00', self_checkin_at: '2026-10-14T06:01:00Z' })])
    expect(l.lage).toBe('Har checkat in i dag')
    expect(l.statusText).toBe('Väntar på kvittens')
  })

  it('utan plan säger det, och utan pass i veckan påstår det ingen närvaro', () => {
    expect(lage([], null)).toMatchObject({ lage: 'Ingen aktivitetsplan', utanPlan: true, dagar: null, plan: null })
    expect(lage([])).toMatchObject({ lage: 'Inga pass inlagda den här veckan', utanPlan: false, plan: 'Plan 10 h/vecka' })
    expect(lage([pass({ date: '2026-10-16' })]).lage).toBe('Inget pass har varit än den här veckan')
    expect(lage([], 'paused').lage).toBe('Planen är pausad')
  })

  it('andra deltagares pass räknas inte', () => {
    const l = deltagarLage({
      participantId: 'p',
      underlag: { planer: underlag([]).planer, pass: [pass({ participant_id: 'annan', date: '2026-10-13', attendance: 'absent_invalid' })] },
      idag: IDAG,
      klockan: KL,
    })
    expect(l.status).toBeNull()
    expect(l.franvaroIVeckan).toBe(false)
  })
})
