/**
 * Beslut 2026-10-11: ett oläst meddelande från konsulenten är deltagarens nästa
 * steg — efter ett pass i dag (hon kan stå på plats och ska checka in), men före
 * nästa pass, ett möte eller "inget".
 *
 * Mutationer som ska fälla: flytta meddelanderegeln före passIdag → test 1 faller;
 * ta bort den → test 2 och 3 faller.
 */
import { describe, it, expect } from 'vitest'
import { nuSteg, type PassMedAnmalan } from './forvantasRegler'
import type { KonsulentMote } from './konsulentMoten'

const pass = (o: Partial<PassMedAnmalan>): PassMedAnmalan => ({
  id: 'p', plan_id: 'pl', participant_id: 'u', date: '2026-10-12', start_time: '09:00:00', end_time: '12:00:00',
  title: 'Jobbsökarverkstad', activity_type: 'jobsearch', location: null, notes: null, attendance: null,
  attendance_note: null, sick_certificate_received: false, marked_by: null, marked_at: null, self_checkin_at: null,
  created_at: '', updated_at: '', ...o,
})
const mote = (datum: string, tid: string): KonsulentMote => ({
  id: 'm', scheduled_at: new Date(`${datum}T${tid}:00`).toISOString(), duration_minutes: 30,
  meeting_type: 'physical', location: null, meeting_link: null, status: 'scheduled',
})
const idag = '2026-10-12'

describe('nuSteg — olästa meddelanden', () => {
  it('passet i dag går före ett oläst meddelande', () => {
    const r = nuSteg({ pass: [pass({ id: 'a' })], moten: [], idag, nuTid: '08:00', olasta: 2 })
    expect(r).toMatchObject({ typ: 'passIdag', pass: { id: 'a' } })
  })

  it('ett oläst meddelande går före nästa pass och ett möte', () => {
    const imorgon = pass({ id: 'b', date: '2026-10-13' })
    expect(nuSteg({ pass: [imorgon], moten: [], idag, nuTid: '08:00', olasta: 1 })).toEqual({ typ: 'meddelande', antal: 1 })
    expect(nuSteg({ pass: [imorgon], moten: [mote(idag, '10:00')], idag, nuTid: '08:00', olasta: 3 })).toEqual({ typ: 'meddelande', antal: 3 })
  })

  it('ett oläst meddelande går före "inget"', () => {
    expect(nuSteg({ pass: [], moten: [], idag, nuTid: '08:00', olasta: 1 })).toEqual({ typ: 'meddelande', antal: 1 })
  })

  it('utan olästa (eller okänt antal) är allt som förut', () => {
    const imorgon = pass({ id: 'b', date: '2026-10-13' })
    expect(nuSteg({ pass: [imorgon], moten: [], idag, nuTid: '08:00' }).typ).toBe('nastaPass')
    expect(nuSteg({ pass: [imorgon], moten: [mote(idag, '10:00')], idag, nuTid: '08:00', olasta: 0 }).typ).toBe('mote')
  })
})
