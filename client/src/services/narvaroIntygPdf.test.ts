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

async function textenIPdf(sessions: ActivitySession[], regelverk: 'kommun' | 'leverantor' | null = 'kommun'): Promise<string> {
  const blob = await generateNarvaroIntygBlob({ participantName: 'Dana Deltagare', organizationName: 'Testkommun', manad: '2026-10', sessions, idag: IDAG, regelverk })
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
  it('räknar bara timmar som konsulenten markerat — incheckning räcker inte', () => {
    expect(narvaroTimmar(sessions, '2026-10')).toBe(5.5)
  })

  // GG2 (2026-09-20): intyget räknade bara `present` medan veckosaldot,
  // nämndrapporten och aktivitetsloggen räknade `present` + `external`. Samma
  // period gav alltså olika tal i deltagarens kvitto och i nämndens underlag.
  it('räknar external som närvaro — samma definition som nämndrapporten', () => {
    const medExternal = [...sessions, pass({ id: 'g', date: '2026-10-16', attendance: 'external', start_time: '09:00', end_time: '11:00' })]
    expect(narvaroTimmar(medExternal, '2026-10')).toBe(7.5)
  })

  it('delar definitionen med veckosaldot i stället för att kopiera den', async () => {
    const { NARVARANDE_UTFALL } = await import('./aktivitetSchema')
    expect([...NARVARANDE_UTFALL].sort()).toEqual(['external', 'present'])
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

/**
 * RD3 (rollspelet 2026-09-27): Saras intyg (Rusta och matcha) sa "Beslut om
 * försörjningsstöd fattas av socialnämnden". Motprov: skriv tillbaka den fasta
 * sidfoten → båda testerna nedan faller.
 */
describe('sidfoten följer planens regelverk', () => {
  it('Rusta och matcha: Arbetsförmedlingen, inte socialnämnden', async () => {
    const text = await textenIPdf([pass({ attendance: 'present' })], 'leverantor')
    expect(text).toContain('Arbetsförmedlingens tjänst Rusta och') // radbryts före "matcha"
    expect(text).toContain('Arbetsförmedlingen')
    expect(text).not.toMatch(/socialnämnden|försörjningsstöd/)
  })
  it('okänt regelverk: ingen myndighet alls — aldrig kommunens juridik utan belägg', async () => {
    const text = await textenIPdf([pass({ attendance: 'present' })], null)
    expect(text).not.toMatch(/socialnämnden|försörjningsstöd|Arbetsförmedlingen/)
    expect(text).toContain('Genererat från jobin.se')
  })
})

/*
 * RD11 (rollspelet 2026-09-27): en markerad frånvaro stod oförklarad på intyget
 * till handläggaren. Deltagarens egen förklaring följer nu med — märkt som
 * hennes, inte som konsulentens bedömning.
 * Mutation: låt intygRader strunta i participant_explanation → faller.
 */
describe('RD11: deltagarens förklaring på intyget', () => {
  const forklarad = pass({
    attendance: 'absent_invalid',
    participant_explanation: 'Bussen ställdes in och nästa gick för sent.',
    participant_explanation_at: '2026-10-06T08:00:00Z',
  })

  it('utfallet bär förklaringen, märkt som deltagarens', () => {
    const [rad] = intygRader([forklarad], '2026-10', IDAG)
    expect(rad[4]).toBe('Frånvaro\nDeltagarens förklaring: "Bussen ställdes in och nästa gick för sent."')
  })

  it('utan förklaring är utfallet oförändrat', () => {
    const [rad] = intygRader([pass({ attendance: 'absent_invalid' })], '2026-10', IDAG)
    expect(rad[4]).toBe('Frånvaro')
  })

  it('PDF:en innehåller förklaringen', async () => {
    const text = await textenIPdf([forklarad])
    expect(text).toContain('Deltagarens f')
    expect(text).toContain('Bussen st')
  })
})

// RD29 (2026-09-27): deltagarens egen redovisning står på intyget, skild från konsulentens markering.
// Motprov: ta bort avsnittet i generateNarvaroIntygPDF → testet faller.
describe('egen redovisning på intyget', () => {
  it('skriver rubrik, förklaring, incheckningar och jobbsökande', async () => {
    const blob = await generateNarvaroIntygBlob({
      participantName: 'Dana Deltagare', organizationName: 'Testkommun', manad: '2026-10', sessions: [], idag: IDAG, regelverk: 'kommun',
      egenRedovisningAvsnitt: {
        rubrik: 'Min egen redovisning',
        forklaring: 'Uppgifterna nedan har jag registrerat själv.',
        incheckningar: { head: ['Datum', 'Pass'], body: [['7 oktober', 'Verkstad']], tomText: null },
        jobbsokRubrik: 'Eget jobbsökande',
        jobbsokRader: ['Skickade ansökningar: 3'],
      },
    })
    const text = await new Promise<string>((resolve, reject) => {
      const l = new FileReader(); l.onload = () => resolve(String(l.result)); l.onerror = () => reject(l.error); l.readAsBinaryString(blob)
    }).then(avEskapera)
    expect(text).toContain('Min egen redovisning')
    expect(text).toContain('Verkstad')
    expect(text).toContain('Skickade ans')
  })
})
