/**
 * Vad närvarointyget (F5) faktiskt lägger på pappret. Läser byteströmmen som
 * aktivitetsplanPdf.test.ts — och av-eskaperar parenteser först, annars är ett
 * `toContain('(…)')` mot en PDF-ström alltid falskt (fällan 2026-08-23).
 */
import { describe, it, expect } from 'vitest'
import { antalPerUtfall, generateNarvaroIntygBlob, intygRader, manadensPass, narvaroTimmar, utfall } from './narvaroIntygPdf'
import type { ActivitySession } from './aktivitetApi'

const pass = (o: Partial<ActivitySession> & Record<string, unknown>): ActivitySession => ({
  id: 's1', plan_id: 'plan1', participant_id: 'p1', date: '2026-10-05', start_time: '09:00', end_time: '12:00', title: 'Jobbsökarverkstad',
  activity_type: 'jobsearch', location: 'Hjernet', notes: null, attendance: null, attendance_note: null, sick_certificate_received: false,
  marked_by: null, marked_at: null, self_checkin_at: null, created_at: '', updated_at: '', ...o,
})

const IDAG = '2026-10-20'

const avEskapera = (rå: string) => rå.replace(/\\([()\\])/g, '$1')

async function textenIPdf(sessions: ActivitySession[]): Promise<string> {
  const blob = await generateNarvaroIntygBlob({ participantName: 'Dana Deltagare', organizationName: 'Testkommun', manad: '2026-10', sessions, idag: IDAG })
  return await new Promise<string>((resolve, reject) => {
    const läsare = new FileReader()
    läsare.onload = () => resolve(String(läsare.result))
    läsare.onerror = () => reject(läsare.error)
    läsare.readAsBinaryString(blob)
  }).then(avEskapera)
}

describe('utfallet på ett pass', () => {
  it('konsulentens markering vinner över allt annat', () => {
    expect(utfall(pass({ attendance: 'present', self_checkin_at: '2026-10-05T09:01:00Z' }), IDAG)).toBe('Närvarande')
    expect(utfall(pass({ attendance: 'absent_invalid', absence_reported_at: '2026-10-04T10:00:00Z', absence_reason: 'sick' }), IDAG)).toBe('Frånvaro')
  })
  it('anmäld frånvaro syns med orsak, incheckning utan bekräftelse sägs rakt ut', () => {
    expect(utfall(pass({ absence_reported_at: '2026-10-04T10:00:00Z', absence_reason: 'child_care' }), IDAG)).toBe('Anmäld frånvaro (vård av barn)')
    expect(utfall(pass({ self_checkin_at: '2026-10-05T09:01:00Z' }), IDAG)).toBe('Incheckad, ej bekräftad av konsulent')
  })
  it('passerat och omarkerat är "Ej markerat", framtida är "Kommande"', () => {
    expect(utfall(pass({ date: '2026-10-05' }), IDAG)).toBe('Ej markerat')
    expect(utfall(pass({ date: '2026-10-28' }), IDAG)).toBe('Kommande')
  })
})

describe('månadens pass och summeringar', () => {
  const sessions = [
    pass({ id: 'a', date: '2026-10-07', attendance: 'present' }),
    pass({ id: 'b', date: '2026-10-05', attendance: 'present', start_time: '13:00', end_time: '15:30' }),
    pass({ id: 'c', date: '2026-10-12', attendance: 'sick_certified' }),
    pass({ id: 'd', date: '2026-10-14', self_checkin_at: '2026-10-14T09:00:00Z' }),
    pass({ id: 'e', date: '2026-11-02', attendance: 'present' }),
    pass({ id: 'f', date: '2026-10-09', activity_type: 'jobsearch_own', title: 'Eget jobbsökande', attendance: 'present' }),
  ]
  it('tar bara månadens anvisade pass, i tidsordning', () => {
    expect(manadensPass(sessions, '2026-10').map((s) => s.id)).toEqual(['b', 'a', 'c', 'd'])
  })
  it('räknar bara timmar som konsulenten markerat Närvarande — incheckning räcker inte', () => {
    expect(narvaroTimmar(sessions, '2026-10')).toBe(5.5)
  })
  it('summerar pass per utfall', () => {
    expect(antalPerUtfall(sessions, '2026-10', IDAG)).toEqual({ Närvarande: 2, Sjuk: 1, 'Incheckad, ej bekräftad av konsulent': 1 })
  })
  it('rader bär datum, tid, aktivitet, typ och utfall', () => {
    expect(intygRader(sessions, '2026-10', IDAG)[0]).toEqual(['5 oktober 2026', '13:00-15:30', 'Jobbsökarverkstad', 'Jobbsökande', 'Närvarande'])
  })
})

describe('PDF:ens innehåll', () => {
  it('bär namn, organisation, månad, raderna, timmarna och förbehållet', async () => {
    const text = await textenIPdf([
      pass({ id: 'a', date: '2026-10-07', attendance: 'present' }),
      pass({ id: 'b', date: '2026-10-14' }),
    ])
    expect(text).toContain('Dana Deltagare')
    expect(text).toContain('Testkommun')
    expect(text).toContain('oktober 2026')
    expect(text).toContain('7 oktober 2026')
    expect(text).toContain('Ej markerat')
    expect(text).toContain('markerat: 3 timmar')
    expect(text).toContain('inte bedömda')
    expect(text).toContain('socialnämnden')
  })
  it('säger att inga aktiviteter finns i stället för att hitta på', async () => {
    const text = await textenIPdf([])
    expect(text).toContain('Inga anvisade aktiviteter')
    expect(text).not.toContain('timmar.')
  })
})
