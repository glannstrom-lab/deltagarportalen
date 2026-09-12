import { describe, it, expect } from 'vitest'
import { passStatus, type PassIdag } from './dagensPass'

const bas: PassIdag = {
  id: 's1',
  participant_id: 'p1',
  plan_id: 'pl1',
  date: '2026-09-14',
  start_time: '09:00:00',
  end_time: '12:00:00',
  title: 'Jobbsökarverkstad',
  attendance: null,
  self_checkin_at: null,
  absence_reason: null,
  absence_note: null,
}

describe('passStatus (F9) — status härleds ur datan, aldrig gissad', () => {
  it('markerad närvaro vinner över allt annat', () => {
    expect(passStatus({ ...bas, attendance: 'present', self_checkin_at: '2026-09-14T09:01:00Z' })).toEqual({ text: 'Närvarande', ton: 'ok' })
    expect(passStatus({ ...bas, attendance: 'absent_invalid', absence_reason: 'sick' }).text).toBe('Frånvaro, ogiltig')
  })

  it('anmäld frånvaro (F1) visas med orsak och rad', () => {
    const s = passStatus({ ...bas, absence_reason: 'sick', absence_note: 'feber' })
    expect(s.ton).toBe('info')
    expect(s.text).toBe('Anmäld frånvaro: sjuk — „feber”')
  })

  it('incheckad visar klockslaget', () => {
    const s = passStatus({ ...bas, self_checkin_at: '2026-09-14T07:05:00.000Z' })
    expect(s.ton).toBe('ok')
    expect(s.text).toMatch(/^Incheckad \d{2}:\d{2}$/)
  })

  it('"Saknar närvaro" bara när passet är slut; annars "Väntar"', () => {
    expect(passStatus(bas, new Date('2026-09-14T10:00:00'))).toEqual({ text: 'Väntar', ton: 'neutral' })
    expect(passStatus(bas, new Date('2026-09-14T13:00:00'))).toEqual({ text: 'Saknar närvaro', ton: 'varning' })
  })
})
