/**
 * nuSteg — det deltagaren gör härnäst, ur pass och möten (2026-10-11).
 * Beteenden som kan falla:
 *   1. Ett pass i dag som inte checkats in → "passIdag".
 *   2. Incheckat, markerat eller frånvaroanmält pass är inte längre något att göra.
 *   3. Ett passerat pass räknas inte; ett pågående gör det.
 *   4. Ett möte före nästa pass går först.
 *   5. Inget kvar → "inget".
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

// Lokal tid → ISO, så motesDatum/motesStart ger samma datum och tid tillbaka.
const mote = (datum: string, tid: string): KonsulentMote => ({
  id: 'm', scheduled_at: new Date(`${datum}T${tid}:00`).toISOString(), duration_minutes: 30,
  meeting_type: 'physical', location: null, meeting_link: null, status: 'scheduled',
})

const idag = '2026-10-12'

describe('nuSteg', () => {
  it('ett pass i dag som inte är incheckat', () => {
    const r = nuSteg({ pass: [pass({ id: 'a' })], moten: [], idag, nuTid: '08:00' })
    expect(r).toMatchObject({ typ: 'passIdag', pass: { id: 'a' } })
  })

  it('ett pågående pass räknas, ett passerat inte', () => {
    expect(nuSteg({ pass: [pass({ id: 'a' })], moten: [], idag, nuTid: '10:30' }).typ).toBe('passIdag')
    expect(nuSteg({ pass: [pass({ id: 'a' })], moten: [], idag, nuTid: '12:30' }).typ).toBe('inget')
  })

  it('incheckat, markerat eller anmält är inte längre något att göra', () => {
    const imorgon = pass({ id: 'b', date: '2026-10-13' })
    for (const ändring of [
      { self_checkin_at: '2026-10-12T08:55:00Z' },
      { attendance: 'present' as const },
      { absence_reported_at: '2026-10-11T18:00:00Z' },
    ]) {
      const r = nuSteg({ pass: [pass({ id: 'a', ...ändring }), imorgon], moten: [], idag, nuTid: '08:00' })
      expect(r).toMatchObject({ typ: 'nastaPass', pass: { id: 'b' } })
    }
  })

  it('tidigaste passet först, oavsett ordning i listan', () => {
    const r = nuSteg({
      pass: [pass({ id: 'sen', date: '2026-10-15' }), pass({ id: 'tidig', date: '2026-10-13' })],
      moten: [], idag, nuTid: '13:00',
    })
    expect(r).toMatchObject({ typ: 'nastaPass', pass: { id: 'tidig' } })
  })

  it('ett möte före nästa pass går först; ett möte efter gör det inte', () => {
    const p = pass({ id: 'a', date: '2026-10-14' })
    expect(nuSteg({ pass: [p], moten: [mote('2026-10-13', '10:00')], idag, nuTid: '13:00' }).typ).toBe('mote')
    expect(nuSteg({ pass: [p], moten: [mote('2026-10-15', '10:00')], idag, nuTid: '13:00' }).typ).toBe('nastaPass')
  })

  it('ett passerat möte räknas inte', () => {
    expect(nuSteg({ pass: [], moten: [mote(idag, '09:00')], idag, nuTid: '13:00' }).typ).toBe('inget')
  })

  it('ingenting kvar', () => {
    expect(nuSteg({ pass: [], moten: [], idag, nuTid: '08:00' })).toEqual({ typ: 'inget' })
  })
})
